// POST /api/chat
// Lógica dual:
//   • Mensaje con imagen  → FastAPI /predict (modelo de visión) → Groq interpreta
//   • Mensaje solo texto  → Groq (con datos del último análisis como contexto)
//
// Ahora usa los módulos compartidos del sistema:
//   - lib/modelo        → cliente tipado de FastAPI
//   - lib/servidor      → estado del último análisis
//   - lib/utils/umbrales → constantes clínicas

import { NextRequest } from 'next/server'
import { predecirRadiografia, ModeloError } from '@/lib/modelo'
import { obtenerUltimoAnalisis, guardarUltimoAnalisis } from '@/lib/servidor/estado-analisis'
import { UMBRAL_PATOLOGIA, UMBRAL_YOUDEN, ETIQUETAS_CARCINOMA } from '@/lib/utils/umbrales'
import type { ResultadoAnalisis } from '@/lib/tipos'

const AI_URL   = process.env.AI_API_URL  ?? ''
const AI_KEY   = process.env.AI_API_KEY  ?? ''
const AI_MODEL = process.env.AI_MODEL    ?? ''

const SYSTEM_PROMPT = `Eres un asistente médico especializado en carcinoma pulmonar.
Ayudas a médicos radiólogos con la interpretación de resultados y soporte clínico basado en evidencia.
Responde siempre en español, de forma clara y precisa.
No sustituyes el criterio médico profesional.

IMPORTANTE: Cuando se te proporcionen datos de análisis, basa tu respuesta ÚNICAMENTE en esos datos numéricos.
No intentes analizar ni describir imágenes por tu cuenta.`

// ── Tipos SSE ────────────────────────────────────────────────────────────────
type TextBlock  = { type: 'text'; text: string }
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ContentBlock = TextBlock | ImageBlock

interface IncomingMessage {
    role:    string
    content: string | ContentBlock[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function findImageInLastMessage(messages: IncomingMessage[]): ImageBlock | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (msg.role !== 'user') continue
        if (!Array.isArray(msg.content)) break
        const block = (msg.content as ContentBlock[]).find(
            (b): b is ImageBlock => b.type === 'image',
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

function buildSystemPrompt(analysis: ResultadoAnalisis | null): string {
    if (!analysis) return SYSTEM_PROMPT

    const relevantes = Object.entries(analysis.patologias)
        .filter(([name, prob]) => !ETIQUETAS_CARCINOMA.includes(name) && prob > UMBRAL_PATOLOGIA)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `  - ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    const contexto = `

=== DATOS DEL ÚLTIMO ANÁLISIS (modelo de visión) ===
Resultado: ${analysis.etiquetaCarcinoma}
Probabilidad de cáncer: ${Math.round(analysis.probabilidadCarcinoma * 100)}%
Umbral de detección: ${Math.round(UMBRAL_YOUDEN * 100)}%
Condiciones detectadas (>${Math.round(UMBRAL_PATOLOGIA * 100)}%):
${relevantes || '  (ninguna por encima del umbral)'}
=====================================================
Basa tus respuestas ÚNICAMENTE en estos datos. No describas ni analices imágenes.`

    return SYSTEM_PROMPT + contexto
}

function buildImageAnalysisPrompt(data: ResultadoAnalisis): string {
    const todasPathologies = Object.entries(data.patologias)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `  - ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    return `Se acaba de analizar una radiografía de tórax con el modelo de visión. Estos son los resultados crudos:

=== RESULTADOS DEL MODELO DE VISIÓN ===
Resultado general: ${data.etiquetaCarcinoma}
Probabilidad de carcinoma: ${Math.round(data.probabilidadCarcinoma * 100)}%
Umbral de detección (Youden): ${Math.round(UMBRAL_YOUDEN * 100)}%

Probabilidades por condición (todas):
${todasPathologies}

Umbral relevancia otras patologías: ${Math.round(UMBRAL_PATOLOGIA * 100)}%
=======================================

Con base ÚNICAMENTE en estos datos numéricos, redacta un informe clínico claro y estructurado para el radiólogo.
Incluye: interpretación del resultado de carcinoma, análisis de las condiciones detectadas por encima del umbral, y recomendaciones clínicas apropiadas según la severidad.
Usa formato markdown. No menciones que eres una IA ni que estás interpretando datos; redacta directamente como informe.`
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

// ── Rama A: imagen → FastAPI → Groq ─────────────────────────────────────────

async function handleImageMessage(imageBlock: ImageBlock): Promise<Response> {
    const { data: imageData, media_type } = imageBlock.source
    const ext    = media_type.split('/')[1] ?? 'png'
    const buffer = Buffer.from(imageData, 'base64')
    const blob   = new Blob([buffer], { type: media_type })

    let resultado: ResultadoAnalisis
    try {
        resultado = await predecirRadiografia(blob, `imagen.${ext}`)
    } catch (err) {
        if (err instanceof ModeloError) {
            return sseError(err.message)
        }
        return sseError(`Error inesperado: ${String(err)}`)
    }

    // Guardar para contexto conversacional.
    guardarUltimoAnalisis(resultado)

    if (resultado.gradcamBase64) {
        const groqResponse = await callGroqStreaming(SYSTEM_PROMPT, buildImageAnalysisPrompt(resultado))
        const gradcamChunk = `data: ${JSON.stringify({ gradcam: resultado.gradcamBase64 })}\n\n`
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

    return callGroqStreaming(SYSTEM_PROMPT, buildImageAnalysisPrompt(resultado))
}

// ── Rama B: texto → Groq ─────────────────────────────────────────────────────

async function handleTextMessage(messages: IncomingMessage[]): Promise<Response> {
    if (!AI_KEY)   return sseError('AI_API_KEY no configurada en .env')
    if (!AI_URL)   return sseError('AI_API_URL no configurada en .env')
    if (!AI_MODEL) return sseError('AI_MODEL no configurado en .env')

    const lastAnalysis = obtenerUltimoAnalisis()

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

// ── Handler principal ────────────────────────────────────────────────────────

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
        ? handleImageMessage(imageBlock)
        : handleTextMessage(messages)
}
