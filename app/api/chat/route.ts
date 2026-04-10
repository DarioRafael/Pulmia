// app/api/chat/route.ts
// Proxy hacia la API FastAPI de carcinoma pulmonar.
// Variable en .env:
//   FASTAPI_URL → URL base de tu API (ej: http://localhost:8000)

import { NextRequest } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000'

const PATHOLOGY_THRESHOLD = 0.30
const YOUDEN_THRESHOLD    = 0.514
const CANCER_ES           = ['Masa (posible tumor)', 'Nódulo (posible tumor)']

// ── Tipos ─────────────────────────────────────────────────────────────────────
type TextBlock  = { type: 'text';  text: string }
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Busca un bloque de imagen en CUALQUIER mensaje del historial (del más reciente al más antiguo).
 * Esto cubre el caso donde el usuario manda imagen + texto en mensajes distintos.
 */
function findImageBlock(messages: IncomingMessage[]): ImageBlock | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (!Array.isArray(msg.content)) continue
        const block = (msg.content as ContentBlock[]).find(
            (b): b is ImageBlock => b.type === 'image'
        )
        if (block) return block
    }
    return null
}

/** Formatea la respuesta de FastAPI en texto legible para el chat */
function formatResponse(data: FastAPIResponse): string {
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

/** Devuelve una respuesta SSE con un mensaje de error */
function sseError(message: string): Response {
    const payload = `data: ${JSON.stringify({ text: `❌ ${message}` })}\n\ndata: [DONE]\n\n`
    return new Response(payload, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
}

/** Devuelve una respuesta SSE con texto plano */
function sseText(message: string): Response {
    const payload = `data: ${JSON.stringify({ text: message })}\n\ndata: [DONE]\n\n`
    return new Response(payload, {
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

    // Buscar imagen en cualquier mensaje del historial
    const imageBlock = findImageBlock(messages)

    // Sin imagen en todo el historial → pedir que adjunte una
    if (!imageBlock) {
        return sseText('📎 Por favor adjunta una imagen de tórax (radiografía o CT) para que pueda analizarla.')
    }

    // ── Enviar imagen a FastAPI /predict ──────────────────────────────────────
    const { data: imageData, media_type } = imageBlock.source
    const ext    = media_type.split('/')[1] ?? 'png'
    const buffer = Buffer.from(imageData, 'base64')
    const blob   = new Blob([buffer], { type: media_type })

    const formData = new FormData()
    formData.append('file', blob, `imagen.${ext}`)

    let apiRes: Response
    try {
        apiRes = await fetch(`${FASTAPI_URL}/predict`, {
            method: 'POST',
            body:   formData,
        })
    } catch (err) {
        return sseError(`No se pudo conectar con la API en ${FASTAPI_URL}. ¿Está corriendo FastAPI? (${err})`)
    }

    if (!apiRes.ok) {
        const detail = await apiRes.text()
        return sseError(`Error de la API (${apiRes.status}): ${detail}`)
    }

    let data: FastAPIResponse
    try {
        data = await apiRes.json()
    } catch {
        return sseError('La API devolvió una respuesta inválida.')
    }

    // ── Formatear y devolver como SSE ─────────────────────────────────────────
    const responsePayload: Record<string, unknown> = {
        text: formatResponse(data),
    }

    if (data.gradcam_image) {
        responsePayload.gradcam = data.gradcam_image
    }

    const ssePayload = `data: ${JSON.stringify(responsePayload)}\n\ndata: [DONE]\n\n`

    return new Response(ssePayload, {
        headers: {
            'Content-Type':  'text/event-stream',
            'Cache-Control': 'no-cache',
        },
    })
}