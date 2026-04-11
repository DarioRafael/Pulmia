// app/api/chat/route.ts
// Lógica dual:
//   • Mensaje con imagen  → FastAPI /predict (modelo de visión) → Groq interpreta los datos
//   • Mensaje solo texto  → Groq (con datos numéricos del último análisis, sin imagen)
//
// Variables en .env:
//   FASTAPI_URL  → URL base de tu API  (ej: http://localhost:8000)
//   AI_API_URL   → endpoint de Groq    (ej: https://api.groq.com/openai/v1/chat/completions)
//   AI_API_KEY   → api key de Groq
//   AI_MODEL     → modelo de Groq      (ej: llama-3.3-70b-versatile)

import { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000'
const AI_URL      = process.env.AI_API_URL  ?? ''
const AI_KEY      = process.env.AI_API_KEY  ?? ''
const AI_MODEL    = process.env.AI_MODEL    ?? ''

const PATHOLOGY_THRESHOLD = 0.30
const YOUDEN_THRESHOLD    = 0.514
const CANCER_ES           = ['Masa (posible tumor)', 'Nódulo (posible tumor)']

const SYSTEM_PROMPT = `Eres un asistente médico especializado en carcinoma pulmonar.
Ayudas a médicos radiólogos con la interpretación de resultados y soporte clínico basado en evidencia.
Responde siempre en español, de forma clara y precisa.
No sustituyes el criterio médico profesional.

IMPORTANTE: Cuando se te proporcionen datos de análisis, basa tu respuesta ÚNICAMENTE en esos datos numéricos.
No intentes analizar ni describir imágenes por tu cuenta.`

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TextBlock  = { type: 'text'; text: string }
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ContentBlock = TextBlock | ImageBlock

interface IncomingMessage {
    role:    string
    content: string | ContentBlock[]
}

interface FastAPIResponse {
    cancer_probability: number
    cancer_result:      string
    pathologies:        Record<string, number>
    gradcam_image?:     string
}

// Último análisis en memoria (suficiente para desarrollo)
let lastAnalysis: FastAPIResponse | null = null

// ── Helpers compartidos ───────────────────────────────────────────────────────

function findImageInLastMessage(messages: IncomingMessage[]): ImageBlock | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (msg.role !== 'user') continue
        if (!Array.isArray(msg.content)) break
        const block = (msg.content as ContentBlock[]).find(
            (b): b is ImageBlock => b.type === 'image'
        )
        return block ?? null
    }
    return null
}

function sseError(message: string): Response {
    const payload = `data: ${JSON.stringify({ text: `❌ ${message}` })}\n\ndata: [DONE]\n\n`
    return new Response(payload, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
}

// ── Helpers de Groq ───────────────────────────────────────────────────────────

function normalizeMessagesForGroq(messages: IncomingMessage[]): unknown[] {
    const result: unknown[] = []

    for (const msg of messages) {
        const role = msg.role === 'ai' ? 'assistant' : msg.role

        if (typeof msg.content === 'string') {
            if (msg.content.trim()) result.push({ role, content: msg.content })
            continue
        }

        const textBlocks = (msg.content as ContentBlock[])
            .filter((b): b is TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('\n')
            .trim()

        if (textBlocks) result.push({ role, content: textBlocks })
    }

    return result
}

function buildSystemPrompt(analysis: FastAPIResponse | null): string {
    if (!analysis) return SYSTEM_PROMPT

    const { cancer_probability, cancer_result, pathologies } = analysis

    const relevantes = Object.entries(pathologies)
        .filter(([name, prob]) => !CANCER_ES.includes(name) && prob > PATHOLOGY_THRESHOLD)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `  - ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    const contexto = `

=== DATOS DEL ÚLTIMO ANÁLISIS (modelo de visión) ===
Resultado: ${cancer_result}
Probabilidad de cáncer: ${Math.round(cancer_probability * 100)}%
Umbral de detección: ${Math.round(YOUDEN_THRESHOLD * 100)}%
Condiciones detectadas (>${Math.round(PATHOLOGY_THRESHOLD * 100)}%):
${relevantes || '  (ninguna por encima del umbral)'}
=====================================================
Basa tus respuestas ÚNICAMENTE en estos datos. No describas ni analices imágenes.`

    return SYSTEM_PROMPT + contexto
}

async function callGroqStreaming(systemPrompt: string, userMessage: string): Promise<Response> {
    if (!AI_KEY)   return sseError('AI_API_KEY no configurada en .env')
    if (!AI_URL)   return sseError('AI_API_URL no configurada en .env')
    if (!AI_MODEL) return sseError('AI_MODEL no configurado en .env')

    let aiRes: Response
    try {
        aiRes = await fetch(AI_URL, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${AI_KEY}`,
            },
            body: JSON.stringify({
                model:  AI_MODEL,
                stream: true,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userMessage  },
                ],
            }),
        })
    } catch (err) {
        return sseError(`No se pudo conectar con Groq: ${err}`)
    }

    if (!aiRes.ok) {
        return sseError(`Error de Groq (${aiRes.status}): ${await aiRes.text()}`)
    }

    return new Response(aiRes.body, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
}

// ── Rama A: imagen → FastAPI → Groq interpreta ───────────────────────────────

/**
 * Construye el prompt que Groq recibirá con los datos crudos de FastAPI.
 * Groq redacta la interpretación completa, sin texto hardcodeado.
 */
function buildImageAnalysisPrompt(data: FastAPIResponse): string {
    const { cancer_probability, cancer_result, pathologies } = data

    const todasPathologies = Object.entries(pathologies)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `  - ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    return `Se acaba de analizar una radiografía de tórax con el modelo de visión. Estos son los resultados crudos:

=== RESULTADOS DEL MODELO DE VISIÓN ===
Resultado general: ${cancer_result}
Probabilidad de carcinoma: ${Math.round(cancer_probability * 100)}%
Umbral de detección (Youden): ${Math.round(YOUDEN_THRESHOLD * 100)}%

Probabilidades por condición (todas):
${todasPathologies}

Umbral relevancia otras patologías: ${Math.round(PATHOLOGY_THRESHOLD * 100)}%
=======================================

Con base ÚNICAMENTE en estos datos numéricos, redacta un informe clínico claro y estructurado para el radiólogo. 
Incluye: interpretación del resultado de carcinoma, análisis de las condiciones detectadas por encima del umbral, y recomendaciones clínicas apropiadas según la severidad. 
Usa formato markdown. No menciones que eres una IA ni que estás interpretando datos; redacta directamente como informe.`
}

async function handleImageMessage(imageBlock: ImageBlock, messages: IncomingMessage[]): Promise<Response> {
    const { data: imageData, media_type } = imageBlock.source
    const ext    = media_type.split('/')[1] ?? 'png'
    const buffer = Buffer.from(imageData, 'base64')
    const blob   = new Blob([buffer], { type: media_type })

    const formData = new FormData()
    formData.append('file', blob, `imagen.${ext}`)

    let apiRes: Response
    try {
        apiRes = await fetch(`${FASTAPI_URL}/predict`, { method: 'POST', body: formData })
    } catch (err) {
        return sseError(`No se pudo conectar con FastAPI en ${FASTAPI_URL}. ¿Está corriendo? (${err})`)
    }

    if (!apiRes.ok) {
        return sseError(`Error de FastAPI (${apiRes.status}): ${await apiRes.text()}`)
    }

    let data: FastAPIResponse
    try {
        data = await apiRes.json()
    } catch {
        return sseError('FastAPI devolvió una respuesta inválida.')
    }

    // Guardar para contexto conversacional posterior
    lastAnalysis = data

    // Si hay gradcam, enviarlo primero como evento separado antes del streaming de texto
    // El cliente debe manejar este evento inicial y luego concatenar el stream de Groq
    if (data.gradcam_image) {
        // Emitimos el gradcam como primer chunk SSE, luego el stream de Groq continúa
        const groqResponse = await callGroqStreaming(SYSTEM_PROMPT, buildImageAnalysisPrompt(data))

        // Prefijamos el stream con el evento gradcam
        const gradcamChunk = `data: ${JSON.stringify({ gradcam: data.gradcam_image })}\n\n`
        const encoder = new TextEncoder()

        const readable = new ReadableStream({
            async start(controller) {
                controller.enqueue(encoder.encode(gradcamChunk))

                if (groqResponse.body) {
                    const reader = groqResponse.body.getReader()
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        controller.enqueue(value)
                    }
                }
                controller.close()
            },
        })

        return new Response(readable, {
            headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
        })
    }

    // Sin gradcam: stream directo de Groq
    return callGroqStreaming(SYSTEM_PROMPT, buildImageAnalysisPrompt(data))
}

// ── Rama B: texto → Groq ──────────────────────────────────────────────────────

async function handleTextMessage(messages: IncomingMessage[]): Promise<Response> {
    if (!AI_KEY)   return sseError('AI_API_KEY no configurada en .env')
    if (!AI_URL)   return sseError('AI_API_URL no configurada en .env')
    if (!AI_MODEL) return sseError('AI_MODEL no configurado en .env')

    let aiRes: Response
    try {
        aiRes = await fetch(AI_URL, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${AI_KEY}`,
            },
            body: JSON.stringify({
                model:    AI_MODEL,
                stream:   true,
                messages: [
                    { role: 'system', content: buildSystemPrompt(lastAnalysis) },
                    ...normalizeMessagesForGroq(messages),
                ],
            }),
        })
    } catch (err) {
        return sseError(`No se pudo conectar con Groq: ${err}`)
    }

    if (!aiRes.ok) {
        return sseError(`Error de Groq (${aiRes.status}): ${await aiRes.text()}`)
    }

    return new Response(aiRes.body, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    let body: { messages: IncomingMessage[] }
    try {
        body = await req.json()
    } catch {
        return new Response('Body inválido', { status: 400 })
    }

    const { messages } = body
    const imageBlock = findImageInLastMessage(messages)

    return imageBlock
        ? handleImageMessage(imageBlock, messages)  // imagen → FastAPI → Groq interpreta
        : handleTextMessage(messages)                // texto  → Groq (con datos numéricos)
}