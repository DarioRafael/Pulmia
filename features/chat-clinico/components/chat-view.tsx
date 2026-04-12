'use client'

// Vista completa del chat clínico.
// Se usa tanto en la ruta dedicada (/estudios/[id]/chat) como dentro del
// ChatBubble expandido. Contiene todo el flujo: historial, input, streaming.

import { useCallback } from 'react'
import { ListaMensajes } from './lista-mensajes'
import { BarraInput } from './barra-input'
import { useChat } from '../hooks/use-chat'
import { streamChat } from '../api'
import type { BloqueContenido, BloqueImagen, BloqueTexto, MensajeHistorial, Mensaje } from '../tipos'

interface ChatViewProps {
    /** Si es compacto (dentro del bubble) se oculta el header. */
    readonly compacto?: boolean
}

function buildContentWithImage(text: string, base64: string, mime: string): BloqueContenido[] {
    const blocks: BloqueContenido[] = [
        { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
    ]
    if (text.trim()) blocks.push({ type: 'text', text })
    return blocks
}

function extractBase64FromDataUrl(dataUrl: string): { data: string; mime: string } {
    const [header, data] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
    return { data, mime }
}

export function ChatView({ compacto }: ChatViewProps) {
    const {
        messages, isTyping, status,
        addMessage, startStream, appendChunk, endStream, attachGradcam,
        showTyping, hideTyping,
    } = useChat()

    const handleSend = useCallback((text: string, imageB64?: string, imageMime?: string) => {
        if (!text.trim() && !imageB64) return

        addMessage('user', text, imageB64 ? `data:${imageMime};base64,${imageB64}` : undefined)
        showTyping()

        const history: MensajeHistorial[] = messages
            .filter((m: Mensaje) => !m.isStreaming)
            .map((m: Mensaje) => {
                if (m.imagenDataUrl) {
                    const { data, mime } = extractBase64FromDataUrl(m.imagenDataUrl)
                    return { role: m.rol === 'ai' ? 'assistant' as const : 'user' as const, content: buildContentWithImage(m.contenido, data, mime) }
                }
                return { role: m.rol === 'ai' ? 'assistant' as const : 'user' as const, content: m.contenido }
            })

        if (imageB64 && imageMime) {
            history.push({ role: 'user', content: buildContentWithImage(text, imageB64, imageMime) })
        } else {
            history.push({ role: 'user', content: text || '(imagen adjunta)' })
        }

        startStream()

        streamChat(history, {
            onChunk: (chunk) => { hideTyping(); appendChunk(chunk) },
            onGradcam: (base64) => { attachGradcam(`data:image/png;base64,${base64}`) },
            onDone: () => { endStream() },
            onError: (err) => { hideTyping(); endStream(); console.error(err) },
        })
    }, [messages, addMessage, startStream, appendChunk, endStream, attachGradcam, showTyping, hideTyping])

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'var(--bg-0)', overflow: 'hidden',
        }}>
            {!compacto && (
                <header style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0 16px', height: 50, flexShrink: 0,
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-glass)', backdropFilter: 'blur(16px)',
                }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 'var(--r6)', flexShrink: 0,
                        background: 'var(--accent)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-accent)',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                  stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t0)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            Chat Clínico
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--t2)', letterSpacing: '0.06em', lineHeight: 1 }}>
                            {status}
                        </div>
                    </div>
                </header>
            )}
            <ListaMensajes mensajes={messages} isTyping={isTyping} />
            <BarraInput onSend={handleSend} disabled={isTyping} />
        </div>
    )
}
