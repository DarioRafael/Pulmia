// app/api/chat/route.ts
// Servidor Next.js — proxy hacia cualquier API compatible con OpenAI.
// Variables en .env:
//   AI_API_URL   → endpoint del proveedor  (default: Groq)
//   AI_API_KEY   → api key del proveedor
//   AI_MODEL     → modelo a usar           (default: llama-3.3-70b-versatile)

import { NextRequest } from 'next/server'

const AI_URL   = process.env.AI_API_URL ?? 'https://api.groq.com/openai/v1/chat/completions'
const AI_KEY   = process.env.AI_API_KEY ?? ''
const AI_MODEL = process.env.AI_MODEL   ?? 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `Eres un asistente médico especializado en carcinoma pulmonar.
Ayudas a médicos radiólogos con análisis de imágenes, interpretación de resultados
y soporte clínico basado en evidencia. Responde siempre en español, de forma clara
y precisa. No sustituyes el criterio médico profesional.`

export async function POST(req: NextRequest) {
    if (!AI_KEY) {
        return new Response('AI_API_KEY no configurada en .env', { status: 500 })
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
                    ...body.messages,
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