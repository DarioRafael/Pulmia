// lib/api/chat.ts
// Cliente — llama al route handler /api/chat.

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

    // Leer TODA la respuesta de una vez (no es streaming real, es un único chunk JSON)
    const fullText = await res.text()

    let textResult  = ''
    let gradcamResult = ''

    for (const line of fullText.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue

        try {
            const json = JSON.parse(payload)

            if (typeof json.text === 'string' && json.text.length > 0) {
                textResult = json.text
            }
            if (typeof json.gradcam === 'string' && json.gradcam.length > 0) {
                gradcamResult = json.gradcam
            }
        } catch {
            // línea malformada — ignorar
        }
    }

    // Primero el texto
    if (textResult) {
        callbacks.onChunk(textResult)
    }

    // Luego el Grad-CAM (si existe)
    if (gradcamResult) {
        callbacks.onGradcam(gradcamResult)
    }

    callbacks.onDone()
}