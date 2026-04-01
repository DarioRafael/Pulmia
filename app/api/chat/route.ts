// app/api/chat/route.ts
// Servidor Next.js — proxy hacia cualquier API compatible con OpenAI.
// Variables en .env:
//   AI_API_URL   → endpoint del proveedor
//   AI_API_KEY   → api key del proveedor
//   AI_MODEL     → modelo a usar

import { NextRequest } from 'next/server'

const AI_URL   = process.env.AI_API_URL ?? ''
const AI_KEY   = process.env.AI_API_KEY ?? ''
const AI_MODEL = process.env.AI_MODEL   ?? ''

const SYSTEM_PROMPT = `Eres un asistente médico especializado en carcinoma pulmonar.
Ayudas a médicos radiólogos con análisis de imágenes, interpretación de resultados
y soporte clínico basado en evidencia. Responde siempre en español, de forma clara
y precisa. No sustituyes el criterio médico profesional.`

// ── Normalización de mensajes ─────────────────────────────────────────────────
// Convierte el formato interno de imágenes ({ type:'image', source:{ type:'base64', ... } })
// al formato image_url compatible con la especificación OpenAI, que es el estándar
// adoptado por la mayoría de proveedores con soporte de visión.
type TextBlock     = { type: 'text'; text: string }
type ImageBlock    = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ImageUrlBlock = { type: 'image_url'; image_url: { url: string } }
type ContentBlock  = TextBlock | ImageBlock

function normalizeMessages(messages: unknown[]): unknown[] {
    return messages.map(msg => {
        const m = msg as { role: string; content: unknown }
        if (!Array.isArray(m.content)) return m

        const content = (m.content as ContentBlock[]).map(block => {
            if (block.type === 'image') {
                const url = `data:${block.source.media_type};base64,${block.source.data}`
                return { type: 'image_url', image_url: { url } } satisfies ImageUrlBlock
            }
            return block
        })

        return { ...m, content }
    })
}
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    if (!AI_KEY) {
        return new Response('AI_API_KEY no configurada en .env', { status: 500 })
    }
    if (!AI_URL) {
        return new Response('AI_API_URL no configurada en .env', { status: 500 })
    }
    if (!AI_MODEL) {
        return new Response('AI_MODEL no configurado en .env', { status: 500 })
    }

    let body: { messages: unknown[] }
    try {
        body = await req.json()
    } catch {
        return new Response('Body inválido', { status: 400 })
    }

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
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...normalizeMessages(body.messages),
                ],
            }),
        })
    } catch (err) {
        return new Response(`No se pudo conectar al proveedor de IA: ${err}`, { status: 502 })
    }

    if (!aiRes.ok) {
        const detail = await aiRes.text()
        return new Response(`Error del proveedor (${aiRes.status}): ${detail}`, { status: 502 })
    }

    return new Response(aiRes.body, {
        headers: {
            'Content-Type':  'text/event-stream',
            'Cache-Control': 'no-cache',
        },
    })
}