// POST /api/chat
// Lógica dual:
//   • Mensaje con imagen  → FastAPI /predict (modelo de visión) → LLM interpreta
//   • Mensaje solo texto  → LLM (con informe del estudio activo como contexto)
//
// El informe ya no se lee de estado global en memoria — viene en el body del
// request, enviado por el cliente desde useEstudios(). Esto permite que cada
// usuario/estudio tenga su propio contexto sin interferencias.

import { NextRequest } from 'next/server'
import { predecirRadiografia, ModeloError } from '@/lib/modelo'
import { UMBRAL_PATOLOGIA, UMBRAL_YOUDEN, ETIQUETAS_CARCINOMA } from '@/lib/utils/umbrales'
import type { ResultadoAnalisis } from '@/lib/tipos'

// ── API Keys con fallback persistente ────────────────────────────────────────
//
// En el .env puedes definir múltiples claves con el mismo nombre usando un
// sufijo numérico opcional:
//
//   AI_API_KEY_1=AIzaSy...   ← primera clave
//   AI_API_KEY_2=AIzaSy...   ← segunda clave
//   AI_API_KEY_3=AIzaSy...   ← tercera clave
//   AI_API_KEY=AIzaSy...     ← también se acepta sin sufijo (actúa como _1)
//
// Si una clave falla (tokens agotados, 429, 401, etc.) se marca como fallida
// y NUNCA se vuelve a usar en el ciclo de vida actual del servidor.
// Las peticiones siguientes arrancan desde la primera clave NO fallida.
//
// NOTA: el estado se guarda en globalThis para sobrevivir hot-reloads de Next.js
// en desarrollo sin perder el seguimiento de claves fallidas.

function loadApiKeys(): string[] {
    const keys: string[] = []

    // Acepta AI_API_KEY, AI_API_KEY_1, AI_API_KEY_2, ... AI_API_KEY_N
    const base = process.env.AI_API_KEY
    if (base?.trim()) keys.push(base.trim())

    // Escanear hasta AI_API_KEY_20 para no depender de gaps en la numeración
    for (let i = 1; i <= 20; i++) {
        const k = process.env[`AI_API_KEY_${i}`]
        if (!k?.trim()) continue
        // Evitar duplicados si AI_API_KEY y AI_API_KEY_1 son iguales
        if (!keys.includes(k.trim())) keys.push(k.trim())
    }

    return keys
}

const API_KEYS: string[] = loadApiKeys()

// ── Estado persistente en globalThis (sobrevive hot-reloads) ─────────────────
declare global {
    // eslint-disable-next-line no-var
    var __apiKeyState: { currentKeyIndex: number; failedKeyIndices: Set<number> } | undefined
}

if (!globalThis.__apiKeyState) {
    globalThis.__apiKeyState = { currentKeyIndex: 0, failedKeyIndices: new Set<number>() }
}

const keyState = globalThis.__apiKeyState

/**
 * Devuelve el índice de la próxima clave disponible a partir de `startIndex`.
 * Retorna -1 si todas las claves están agotadas.
 */
function getNextAvailableKeyIndex(startIndex: number): number {
    for (let i = startIndex; i < API_KEYS.length; i++) {
        if (!keyState.failedKeyIndices.has(i)) return i
    }
    return -1
}

/**
 * Marca una clave como fallida de forma permanente y avanza el índice global.
 */
function markKeyAsFailed(index: number): void {
    keyState.failedKeyIndices.add(index)
    // Avanzar currentKeyIndex hasta la próxima clave válida
    keyState.currentKeyIndex = getNextAvailableKeyIndex(index + 1)
    if (keyState.currentKeyIndex === -1) {
        console.error('[API Keys] Todas las API keys han fallado.')
    } else {
        console.warn(
            `[API Keys] Clave #${index + 1} marcada como fallida. ` +
            `Usando clave #${keyState.currentKeyIndex + 1} en adelante.`
        )
    }
}

// ── Config estática ───────────────────────────────────────────────────────────
const AI_URL   = process.env.AI_API_URL  ?? ''
const AI_MODEL = process.env.AI_MODEL    ?? ''

// ── System prompt base ───────────────────────────────────────────────────────
const SYSTEM_PROMPT_BASE = `Eres un asistente de soporte clínico especializado en interpretación de radiografías de tórax para carcinoma pulmonar.

REGLAS ESTRICTAS:
1. Basa tus respuestas ÚNICAMENTE en los datos numéricos que se te proporcionen. Nunca inventes valores.
2. El mapa de calor Grad-CAM (si se proporciona) SOLO sirve para ubicar espacialmente los hallazgos — NO para inferir probabilidades ni diagnósticos adicionales.
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

type GeminiPart =
    | { text: string }
    | { inline_data: { mime_type: string; data: string } }

interface GeminiMessage {
    role:  string
    parts: GeminiPart[]
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

function normalizeMessagesForLLM(messages: IncomingMessage[]): GeminiMessage[] {
    const result: GeminiMessage[] = []
    for (const msg of messages) {
        const role = msg.role === 'ai' ? 'assistant' : msg.role
        if (typeof msg.content === 'string') {
            if (msg.content.trim()) result.push({ role, parts: [{ text: msg.content }] })
            continue
        }
        const textBlocks = (msg.content as ContentBlock[])
            .filter((b): b is TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('\n')
            .trim()
        if (textBlocks) result.push({ role, parts: [{ text: textBlocks }] })
    }
    return result
}

// ── Construcción de prompts ──────────────────────────────────────────────────

function buildSystemPrompt(informe: ResultadoAnalisis | null): string {
    if (!informe) {
        return SYSTEM_PROMPT_BASE + `\n\nNOTA: No hay ningún análisis de imagen cargado en esta sesión. Si el usuario pregunta sobre resultados, indícalo.`
    }

    const umbralPct    = Math.round(UMBRAL_YOUDEN * 100)
    const carcinomaPct = Math.round(informe.probabilidadCarcinoma * 100)
    const esPositivo   = informe.probabilidadCarcinoma >= UMBRAL_YOUDEN

    const relevantes = Object.entries(informe.patologias)
        .filter(([name, prob]) => !ETIQUETAS_CARCINOMA.includes(name) && prob > UMBRAL_PATOLOGIA)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `    • ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    const noRelevantes = Object.entries(informe.patologias)
        .filter(([name, prob]) => !ETIQUETAS_CARCINOMA.includes(name) && prob <= UMBRAL_PATOLOGIA)
        .sort(([, a], [, b]) => b - a)
        .map(([name, prob]) => `    • ${name}: ${Math.round(prob * 100)}%`)
        .join('\n')

    const contexto = `

══════════════════════════════════════════════
ANÁLISIS DISPONIBLE (modelo de visión computacional)
══════════════════════════════════════════════
▶ VEREDICTO: ${informe.etiquetaCarcinoma}
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

function buildImageAnalysisPrompt(data: ResultadoAnalisis, conGradcam: boolean): string {
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

    const instruccionGradcam = conGradcam
        ? `MAPA DE CALOR GRAD-CAM (adjunto como imagen):
  • Zonas ROJAS/CÁLIDAS → mayor atención del modelo de visión
  • Zonas AZULES/FRÍAS  → menor atención del modelo de visión
  • Úsalo ÚNICAMENTE para ubicar espacialmente los hallazgos descritos en los datos numéricos.
  • NO derives diagnósticos ni probabilidades adicionales del mapa de calor.
  • Ejemplo de uso correcto: "La señal de Infiltración (62%) se concentra en el lóbulo superior derecho según el Grad-CAM."

`
        : ''

    return `${instruccionGradcam}El modelo de visión computacional procesó una radiografía de tórax. Estos son los resultados que debes interpretar:

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

Con base EXCLUSIVAMENTE en los datos anteriores (y el Grad-CAM para ubicación espacial si está disponible), genera un informe clínico estructurado con las siguientes secciones en markdown:

## Resultado del Análisis Automatizado
(Interpreta el veredicto del modelo y su probabilidad en contexto clínico)

## Hallazgos Relevantes
(Analiza las condiciones con señal significativa. Si hay Grad-CAM, menciona la zona anatómica aproximada donde el modelo concentró su atención para cada hallazgo)

## Nivel de Urgencia
(Clasifica: Urgente / Prioritario / Rutinario, justificado en los datos)

## Recomendaciones
(Pasos clínicos sugeridos basados en los hallazgos, ordenados por prioridad)

## Limitaciones del Análisis
(Una o dos oraciones sobre las limitaciones del modelo automatizado)

Redacta en tono clínico profesional. No menciones que eres una IA.`
}

// ── Llamada al servicio de lenguaje con streaming y fallback de API keys ──────

/**
 * Determina si un código HTTP indica que la clave está agotada o inválida
 * (y por lo tanto debe marcarse como fallida de forma permanente).
 */
function isKeyExhaustedError(status: number, body: string): boolean {
    // 429 = rate limit / cuota agotada
    // 401 = clave inválida o revocada
    if (status === 401) return true
    if (status === 429) {
        // Gemini devuelve 429 tanto para rate-limit temporal como para cuota diaria agotada.
        // Consideramos ambos casos como "clave agotada" para el fallback.
        return true
    }
    // 403 con mensaje de cuota
    if (status === 403 && body.toLowerCase().includes('quota')) return true
    return false
}

async function callLLMStreaming(
    systemPrompt: string,
    messages: GeminiMessage[],
): Promise<Response> {
    if (!AI_URL)   return sseError('AI_API_URL no configurada en .env')
    if (!AI_MODEL) return sseError('AI_MODEL no configurado en .env')
    if (API_KEYS.length === 0) return sseError('No hay ninguna AI_API_KEY configurada en .env')

    const contents = messages.map(msg => ({
        role:  msg.role === 'assistant' ? 'model' : 'user',
        parts: msg.parts,
    }))

    const requestBody = JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.3 },
    })

    // Intentar con cada clave disponible en orden, sin retroceder
    let keyIndex = getNextAvailableKeyIndex(keyState.currentKeyIndex)

    while (keyIndex !== -1) {
        const apiKey = API_KEYS[keyIndex]

        let llmRes: Response
        try {
            llmRes = await fetch(
                `${AI_URL}/${AI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`,
                {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    requestBody,
                }
            )
        } catch (err) {
            // Error de red — no marcamos la clave como fallida, puede ser transitorio
            return sseError(`No se pudo conectar con el servicio de lenguaje: ${err}`)
        }

        if (llmRes.ok) {
            // ✅ Clave funcionó — actualizar el índice global si avanzó
            if (keyIndex > keyState.currentKeyIndex) keyState.currentKeyIndex = keyIndex
            return buildStreamingResponse(llmRes)
        }

        // La respuesta no fue OK — leer el cuerpo para decidir si es fallo permanente
        const errorBody = await llmRes.text()

        if (isKeyExhaustedError(llmRes.status, errorBody)) {
            console.warn(
                `[API Keys] Clave #${keyIndex + 1} rechazada ` +
                `(HTTP ${llmRes.status}). Marcando como fallida.`
            )
            markKeyAsFailed(keyIndex)
            // Intentar con la siguiente
            keyIndex = getNextAvailableKeyIndex(keyIndex + 1)
            continue
        }

        // Error no relacionado con la clave (ej. payload inválido) — no hacer fallback
        return sseError(`Error del servicio de lenguaje (${llmRes.status}): ${errorBody}`)
    }

    // Todas las claves están agotadas
    return sseError(
        'Todas las API keys configuradas han alcanzado su límite o son inválidas. ' +
        'Por favor, revisa las variables AI_API_KEY en tu .env y reinicia el servidor.'
    )
}

/** Construye la Response de streaming SSE a partir de la respuesta HTTP de Gemini */
function buildStreamingResponse(llmRes: Response): Response {
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
        async start(controller) {
            const reader  = llmRes.body!.getReader()
            const decoder = new TextDecoder()
            let buffer    = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue
                    const raw = line.slice(6).trim()
                    if (!raw || raw === '[DONE]') continue

                    try {
                        const parsed = JSON.parse(raw)
                        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
                        if (text) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                            )
                        }
                    } catch { /* chunk incompleto, ignorar */ }
                }
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
        },
    })

    return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
}

// ── Rama A: imagen → FastAPI → LLM ──────────────────────────────────────────

async function handleVisionMessage(imageBlock: ImageBlock): Promise<Response> {
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

    // Sin guardarUltimoAnalisis() — el resultado viaja por el stream al cliente,
    // que lo persistirá en useEstudios() si el usuario decide guardar el estudio.
    const userParts: GeminiPart[] = []

    if (resultado.gradcamBase64) {
        userParts.push({
            inline_data: {
                mime_type: 'image/png',
                data: resultado.gradcamBase64,
            },
        })
    }

    userParts.push({
        text: buildImageAnalysisPrompt(resultado, !!resultado.gradcamBase64),
    })

    const userMessages: GeminiMessage[] = [{ role: 'user', parts: userParts }]
    const llmResponse = await callLLMStreaming(SYSTEM_PROMPT_BASE, userMessages)

    if (resultado.gradcamBase64) {
        const gradcamChunk = `data: ${JSON.stringify({ gradcam: resultado.gradcamBase64 })}\n\n`
        const encoder = new TextEncoder()

        const readable = new ReadableStream({
            async start(controller) {
                controller.enqueue(encoder.encode(gradcamChunk))
                if (llmResponse.body) {
                    const reader = llmResponse.body.getReader()
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

    return llmResponse
}

// ── Rama B: texto → LLM ─────────────────────────────────────────────────────

async function handleTextMessage(
    messages: IncomingMessage[],
    informe: ResultadoAnalisis | null,
): Promise<Response> {
    // El informe viene del cliente — no hay estado global de servidor.
    const systemPrompt = buildSystemPrompt(informe)
    const llmMessages  = normalizeMessagesForLLM(messages)

    if (informe?.gradcamBase64) {
        const gradcamContexto: GeminiMessage[] = [
            {
                role: 'user',
                parts: [
                    { inline_data: { mime_type: 'image/png', data: informe.gradcamBase64 } },
                    {
                        text: 'Este es el mapa de calor Grad-CAM del análisis activo. ' +
                            'Úsalo SOLO para ubicar espacialmente los hallazgos — ' +
                            'los datos numéricos autoritativos están en tu contexto de sistema.',
                    },
                ],
            },
            {
                role: 'assistant',
                parts: [{ text: 'Entendido. Tengo el Grad-CAM como referencia espacial y los datos numéricos como fuente autoritativa.' }],
            },
            ...llmMessages,
        ]
        return callLLMStreaming(systemPrompt, gradcamContexto)
    }

    return callLLMStreaming(systemPrompt, llmMessages)
}

// ── Handler principal ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    let body: { messages: IncomingMessage[]; informe?: ResultadoAnalisis | null }
    try {
        body = await req.json()
    } catch {
        return new Response('Body inválido', { status: 400 })
    }

    const { messages, informe } = body
    const imageBlock = findImageInLastMessage(messages)

    return imageBlock
        ? handleVisionMessage(imageBlock)
        : handleTextMessage(messages, informe ?? null)
}
// ── Llamada no-streaming (para narrativa de reportes) ─────────────────────────

/**
 * Igual que callLLMStreaming pero devuelve el texto completo de una vez.
 * Usa el mismo pool de API keys con fallback automático.
 */
async function callLLMOnce(
    systemPrompt: string,
    userText: string,
): Promise<string | null> {
    if (!AI_URL || !AI_MODEL || API_KEYS.length === 0) return null

    const requestBody = JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    })

    let keyIndex = getNextAvailableKeyIndex(keyState.currentKeyIndex)

    while (keyIndex !== -1) {
        const apiKey = API_KEYS[keyIndex]
        let res: Response
        try {
            res = await fetch(
                `${AI_URL}/${AI_MODEL}:generateContent?key=${apiKey}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody },
            )
        } catch {
            return null // error de red, no marcamos la clave
        }

        if (res.ok) {
            if (keyIndex > keyState.currentKeyIndex) keyState.currentKeyIndex = keyIndex
            const data = await res.json()
            // Gemini puede devolver el texto dividido en múltiples parts — concatenar todo
            const parts: unknown[] = data?.candidates?.[0]?.content?.parts ?? []
            const text = parts
                .map((p: unknown) => (p as { text?: string }).text ?? '')
                .join('')
                .trim()
            return text || null
        }

        const errorBody = await res.text()
        if (isKeyExhaustedError(res.status, errorBody)) {
            markKeyAsFailed(keyIndex)
            keyIndex = getNextAvailableKeyIndex(keyIndex + 1)
            continue
        }
        return null
    }
    return null
}

// ── Handler narrativa (PUT /api/chat) ─────────────────────────────────────────
//
// Body esperado: { prompt: string }
// Respuesta:     { narrative: string | null }
//
// El cliente (ReportModal) construye el prompt con los datos del informe y lo
// envía aquí. Las API keys viven solo en el servidor — nunca se exponen al
// navegador.

export async function PUT(req: NextRequest) {
    let body: { prompt?: string }
    try { body = await req.json() } catch { return new Response('Body inválido', { status: 400 }) }

    if (!body.prompt?.trim()) {
        return Response.json({ narrative: null }, { status: 400 })
    }

    const NARRATIVE_SYSTEM = `Eres un asistente médico especializado en radiología. \
Genera interpretaciones clínicas profesionales en español para reportes médicos formales. \
Responde ÚNICAMENTE con el contenido solicitado, sin encabezados Markdown, asteriscos ni comentarios previos.`

    const narrative = await callLLMOnce(NARRATIVE_SYSTEM, body.prompt)
    return Response.json({ narrative })
}