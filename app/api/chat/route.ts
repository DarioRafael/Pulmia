// app/api/chat/route.ts
// Lógica dual:
//   • Mensaje con imagen  → FastAPI /predict (modelo de visión)
//   • Mensaje solo texto  → Groq (solo con datos numéricos, sin imagen)
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

// ── Rama A: imagen → FastAPI ──────────────────────────────────────────────────

function formatFastAPIResponse(data: FastAPIResponse): string {
    const { cancer_probability, cancer_result, pathologies } = data

    const detected = Object.entries(pathologies)
        .filter(([name, prob]) => !CANCER_ES.includes(name) && prob > PATHOLOGY_THRESHOLD)
        .sort(([, a], [, b]) => b - a)

    let text = `${cancer_result}\n\n`

    if (detected.length > 0) {
        text += `**Otras condiciones detectadas (>${Math.round(PATHOLOGY_THRESHOLD * 100)}%):**\n`
        for (const [name, prob] of detected) {
            const bar = '█'.repeat(Math.round(prob * 20))
            text += `• ${name}: ${Math.round(prob * 100)}% ${bar}\n`
        }
        text += '\n'
    } else {
        text += 'No se detectaron otras condiciones relevantes (>30%).\n\n'
    }

    if (cancer_probability >= YOUDEN_THRESHOLD) {
        text += detected.length > 0
            ? '💡 **Nota:** Se detectaron también otras condiciones. Un especialista debe evaluar el cuadro completo.'
            : '💡 **Se recomienda evaluación urgente por un especialista.**'
    } else if (detected.length > 0) {
        text += '💡 Aunque no se detectan indicadores fuertes de carcinoma, las condiciones listadas ameritan revisión médica.'
    } else {
        text += '✅ No se detectaron hallazgos significativos en esta imagen.'
    }

    return text
}

async function handleImageMessage(imageBlock: ImageBlock): Promise<Response> {
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

    // Guardar para contexto conversacional
    lastAnalysis = data

    const responsePayload: Record<string, unknown> = { text: formatFastAPIResponse(data) }
    if (data.gradcam_image) responsePayload.gradcam = data.gradcam_image

    return new Response(`data: ${JSON.stringify(responsePayload)}\n\ndata: [DONE]\n\n`, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
}

// ── Rama B: texto → Groq ──────────────────────────────────────────────────────

/**
 * Limpia el historial para Groq:
 * - Elimina TODOS los bloques de imagen (Groq solo recibe texto)
 * - Normaliza role 'ai' → 'assistant'
 * - Descarta mensajes que queden vacíos tras eliminar imágenes
 */
function normalizeMessagesForGroq(messages: IncomingMessage[]): unknown[] {
    const result: unknown[] = []

    for (const msg of messages) {
        const role = msg.role === 'ai' ? 'assistant' : msg.role

        if (typeof msg.content === 'string') {
            if (msg.content.trim()) result.push({ role, content: msg.content })
            continue
        }

        // Filtrar: solo bloques de texto, sin imágenes
        const textBlocks = (msg.content as ContentBlock[])
            .filter((b): b is TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('\n')
            .trim()

        if (textBlocks) result.push({ role, content: textBlocks })
    }

    return result
}

/** Inyecta los datos numéricos del análisis en el system prompt */
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
        ? handleImageMessage(imageBlock)   // imagen → FastAPI
        : handleTextMessage(messages)      // texto  → Groq (sin imágenes, con datos numéricos)
}