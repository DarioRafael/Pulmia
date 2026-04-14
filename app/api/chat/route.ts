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

// ── System prompt base ───────────────────────────────────────────────────────
// Más concreto: define el rol, el formato esperado y las restricciones duras.
const SYSTEM_PROMPT_BASE = `Eres un asistente de soporte clínico especializado en interpretación de radiografías de tórax para carcinoma pulmonar.

REGLAS ESTRICTAS:
1. Basa tus respuestas ÚNICAMENTE en los datos numéricos que se te proporcionen. Nunca inventes valores.
2. No describes imágenes ni mencionas haber visto ninguna radiografía.
3. Responde siempre en español, con lenguaje clínico preciso y directo.
4. No sustituyes el criterio médico profesional; indícalo cuando sea relevante.
5. Si no tienes datos de análisis disponibles, indícalo explícitamente en lugar de especular.

FORMATO DE RESPUESTA:
- Usa markdown con encabezados claros (##, ###).
- Prioriza lo más clínicamente relevante al inicio.
- Si hay riesgo alto de carcinoma, resáltalo con énfasis visual (negritas).`

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

// ── Construcción de prompts ──────────────────────────────────────────────────

/**
 * System prompt para conversación de seguimiento.
 * Inyecta el último análisis de forma estructurada y priorizada.
 */
function buildSystemPrompt(analysis: ResultadoAnalisis | null): string {
    if (!analysis) {
        return SYSTEM_PROMPT_BASE + `\n\nNOTA: No hay ningún análisis de imagen cargado en esta sesión. Si el usuario pregunta sobre resultados, indícalo.`
    }

    const umbralPct    = Math.round(UMBRAL_YOUDEN * 100)
    const carcinomaPct = Math.round(analysis.probabilidadCarcinoma * 100)
    const esPositivo   = analysis.probabilidadCarcinoma >= UMBRAL_YOUDEN

    // Separar patologías relevantes de las que están bajo el umbral
    const relevantes = Object.entries(analysis.patologias)
        .filter(([name, prob]) => !ETIQUETAS_CARCINOMA.includes(name) && prob > UMBRAL_PATOLOGIA)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `    • ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    const noRelevantes = Object.entries(analysis.patologias)
        .filter(([name, prob]) => !ETIQUETAS_CARCINOMA.includes(name) && prob <= UMBRAL_PATOLOGIA)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `    • ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    const contexto = `

══════════════════════════════════════════════
ANÁLISIS DISPONIBLE (modelo de visión computacional)
══════════════════════════════════════════════
▶ VEREDICTO: ${analysis.etiquetaCarcinoma}
▶ PROBABILIDAD DE CARCINOMA: ${carcinomaPct}% ${esPositivo ? '⚠️ POR ENCIMA DEL UMBRAL' : '✓ Por debajo del umbral'}
▶ UMBRAL DE CORTE (índice Youden): ${umbralPct}%

CONDICIONES CON SEÑAL SIGNIFICATIVA (>${Math.round(UMBRAL_PATOLOGIA * 100)}%):
${relevantes || '    (ninguna supera el umbral)'}

CONDICIONES CON SEÑAL BAJA (informativo):
${noRelevantes || '    (ninguna)'}
══════════════════════════════════════════════

Al responder preguntas del médico:
- Ancla SIEMPRE tu respuesta a los valores numéricos anteriores.
- Si te preguntan por algo no cubierto por estos datos, indícalo explícitamente.
- No repitas todos los datos en cada respuesta; sé conciso y pertinente.`

    return SYSTEM_PROMPT_BASE + contexto
}

/**
 * User prompt para el análisis inicial de imagen.
 * Estructura los datos de forma que Groq produzca un informe médico completo.
 */
function buildImageAnalysisPrompt(data: ResultadoAnalisis): string {
    const umbralPct    = Math.round(UMBRAL_YOUDEN * 100)
    const carcinomaPct = Math.round(data.probabilidadCarcinoma * 100)
    const esPositivo   = data.probabilidadCarcinoma >= UMBRAL_YOUDEN

    const relevantes = Object.entries(data.patologias)
        .filter(([name]) => !ETIQUETAS_CARCINOMA.includes(name))
        .filter(([, prob]) => prob > UMBRAL_PATOLOGIA)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `  • ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    const todasOrdenadas = Object.entries(data.patologias)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `  • ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    return `El modelo de visión computacional procesó una radiografía de tórax. Estos son los resultados que debes interpretar:

RESULTADO PRINCIPAL:
  • Clasificación: ${data.etiquetaCarcinoma}
  • Probabilidad de carcinoma: ${carcinomaPct}%
  • Umbral de decisión (Youden): ${umbralPct}%
  • Conclusión del modelo: ${esPositivo ? `Supera el umbral por ${carcinomaPct - umbralPct} puntos porcentuales` : `${umbralPct - carcinomaPct} puntos por debajo del umbral`}

CONDICIONES CON SEÑAL SIGNIFICATIVA (>${Math.round(UMBRAL_PATOLOGIA * 100)}%):
${relevantes || '  (ninguna supera el umbral de relevancia)'}

TODAS LAS PROBABILIDADES (referencia completa):
${todasOrdenadas}

---

Con base EXCLUSIVAMENTE en los datos anteriores, genera un informe clínico estructurado con las siguientes secciones en markdown:

## Resultado del Análisis Automatizado
(Interpreta el veredicto del modelo y su probabilidad en contexto clínico)

## Hallazgos Relevantes
(Analiza las condiciones con señal significativa y su posible implicación clínica)

## Nivel de Urgencia
(Clasifica: Urgente / Prioritario / Rutinario, justificado en los datos)

## Recomendaciones
(Pasos clínicos sugeridos basados en los hallazgos, ordenados por prioridad)

## Limitaciones del Análisis
(Una o dos oraciones sobre las limitaciones del modelo automatizado)

Redacta en tono clínico profesional. No menciones que eres una IA.`
}

// ── Llamada a Groq con streaming ─────────────────────────────────────────────

async function callGroqStreaming(
    systemPrompt: string,
    messages: unknown[],
): Promise<Response> {
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
                    ...messages,
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

    const userMessages = [{ role: 'user', content: buildImageAnalysisPrompt(resultado) }]
    const groqResponse = await callGroqStreaming(SYSTEM_PROMPT_BASE, userMessages)

    if (resultado.gradcamBase64) {
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

    return groqResponse
}

// ── Rama B: texto → Groq ─────────────────────────────────────────────────────

async function handleTextMessage(messages: IncomingMessage[]): Promise<Response> {
    const lastAnalysis  = obtenerUltimoAnalisis()
    const systemPrompt  = buildSystemPrompt(lastAnalysis)
    const groqMessages  = normalizeMessagesForGroq(messages)

    return callGroqStreaming(systemPrompt, groqMessages)
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