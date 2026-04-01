// lib/api/chat.ts
// Cliente — llama al route handler /api/chat.
// No necesita saber nada del proveedor ni de la API key.

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface StreamCallbacks {
    onChunk: (chunk: string) => void
    onDone:  () => void
    onError: (err: Error) => void
}

export async function streamChat(
    messages: ChatMessage[],
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

    const reader = res.body?.getReader()
    if (!reader) {
        callbacks.onError(new Error('No se recibió stream.'))
        return
    }

    const decoder = new TextDecoder()

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const raw = decoder.decode(value, { stream: true })

            for (const line of raw.split('\n')) {
                const trimmed = line.trim()
                if (!trimmed.startsWith('data:')) continue

                const payload = trimmed.slice(5).trim()
                if (payload === '[DONE]') continue

                try {
                    const json  = JSON.parse(payload)
                    const delta = json.choices?.[0]?.delta?.content
                    if (typeof delta === 'string' && delta.length > 0) {
                        callbacks.onChunk(delta)
                    }
                } catch {
                    // línea malformada — ignorar
                }
            }
        }
        callbacks.onDone()
    } catch (err) {
        callbacks.onError(err instanceof Error ? err : new Error(String(err)))
    } finally {
        reader.releaseLock()
    }
}