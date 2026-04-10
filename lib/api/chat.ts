// lib/api/chat.ts
// Maneja dos formatos de SSE:
//   • FastAPI  → data: { text, gradcam }         (respuesta de imagen)
//   • Groq     → data: { choices:[{delta:{content}}] }  (stream OpenAI-compatible)

type TextBlock  = { type: 'text'; text: string }
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ContentBlock = TextBlock | ImageBlock

export interface ChatMessage {
    role:    'user' | 'assistant'
    content: string | ContentBlock[]
}

export interface StreamCallbacks {
    onChunk:   (chunk: string) => void
    onGradcam: (base64: string) => void
    onDone:    () => void
    onError:   (err: Error) => void
}

export async function streamChat(
    messages:  ChatMessage[],
    callbacks: StreamCallbacks,
): Promise<void> {
    let res: Response
    try {
        res = await fetch('/api/chat', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ messages }),
        })
    } catch (err) {
        callbacks.onError(new Error(`Sin conexión: ${err}`))
        return
    }

    if (!res.ok) {
        callbacks.onError(new Error(`Error ${res.status}: ${await res.text()}`))
        return
    }

    // Leer el stream línea a línea con un reader para soportar streaming real de Groq
    const reader  = res.body?.getReader()
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

            // Procesar todas las líneas completas disponibles en el buffer
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''   // la última puede estar incompleta

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed.startsWith('data:')) continue

                const payload = trimmed.slice(5).trim()
                if (payload === '[DONE]') continue

                let json: Record<string, unknown>
                try {
                    json = JSON.parse(payload)
                } catch {
                    continue   // línea malformada
                }

                // ── Formato FastAPI: { text, gradcam? } ──
                if (typeof json.text === 'string' && json.text.length > 0) {
                    callbacks.onChunk(json.text)
                }
                if (typeof json.gradcam === 'string' && json.gradcam.length > 0) {
                    callbacks.onGradcam(json.gradcam)
                }

                // ── Formato Groq/OpenAI: { choices:[{ delta:{ content } }] } ──
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
        callbacks.onError(new Error(`Error leyendo stream: ${err}`))
        return
    } finally {
        reader.releaseLock()
    }

    callbacks.onDone()
}