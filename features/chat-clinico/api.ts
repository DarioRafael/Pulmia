// Cliente del endpoint `/api/chat`.
// Parsea los dos formatos de SSE que el route handler puede devolver:
//   • FastAPI  → data: { text, gradcam? }
//   • Groq     → data: { choices:[{ delta:{ content } }] }

import type { MensajeHistorial } from './tipos'

export interface CallbacksStream {
    readonly onChunk: (chunk: string) => void
    readonly onGradcam: (base64: string) => void
    readonly onDone: () => void
    readonly onError: (err: Error) => void
}

/**
 * Envía el historial al endpoint de chat y procesa el stream SSE chunk a chunk.
 * Los callbacks permiten al consumidor reaccionar a cada evento sin acoplarse
 * al formato del protocolo.
 */
export async function streamChat(
    mensajes: readonly MensajeHistorial[],
    callbacks: CallbacksStream,
): Promise<void> {
    let res: Response
    try {
        res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: mensajes }),
        })
    } catch (err) {
        callbacks.onError(new Error(`Sin conexión: ${String(err)}`))
        return
    }

    if (!res.ok) {
        callbacks.onError(new Error(`Error ${res.status}: ${await res.text()}`))
        return
    }

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
        callbacks.onError(new Error('No se pudo leer el stream'))
        return
    }

    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Procesar todas las líneas completas disponibles.
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed.startsWith('data:')) continue

                const payload = trimmed.slice(5).trim()
                if (payload === '[DONE]') continue

                let json: Record<string, unknown>
                try {
                    json = JSON.parse(payload)
                } catch {
                    continue
                }

                // Formato FastAPI: { text, gradcam? }
                if (typeof json.text === 'string' && json.text.length > 0) {
                    callbacks.onChunk(json.text)
                }
                if (typeof json.gradcam === 'string' && json.gradcam.length > 0) {
                    callbacks.onGradcam(json.gradcam)
                }

                // Formato Groq/OpenAI: { choices: [{ delta: { content } }] }
                const choices = json.choices
                if (Array.isArray(choices) && choices.length > 0) {
                    const delta = (choices[0] as Record<string, unknown>).delta
                    if (delta && typeof (delta as Record<string, unknown>).content === 'string') {
                        const content = (delta as Record<string, unknown>).content as string
                        if (content.length > 0) callbacks.onChunk(content)
                    }
                }
            }
        }
    } catch (err) {
        callbacks.onError(new Error(`Error leyendo stream: ${String(err)}`))
        return
    } finally {
        reader.releaseLock()
    }

    callbacks.onDone()
}
