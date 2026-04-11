'use client'

import { useState } from 'react'
import { Message } from '@/lib/types'
import { md } from '@/lib/utils/markdown'

interface MessageBubbleProps {
    message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const [copied, setCopied] = useState(false)
    const isUser = message.role === 'user'

    const timestamp = message.timestamp.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
    })

    function handleCopy() {
        navigator.clipboard?.writeText(message.content)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
    }

    return (
        <div
            className="msg-wrap"
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                animation: 'msg-in 0.18s ease both',
                position: 'relative',
                gap: 5,
            }}
        >
            {isUser ? (
                /* ── BURBUJA USUARIO ── */
                <div
                    className="bubble"
                    style={{
                        maxWidth: '62%',
                        padding: '9px 14px',
                        fontSize: 13.5,
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        background: 'var(--bg-3)',
                        border: '1px solid var(--border-h)',
                        borderRadius: 'var(--r12) var(--r12) var(--r4) var(--r12)',
                        color: 'var(--t0)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {message.imageDataUrl && (
                        <div style={{ marginBottom: message.content ? 10 : 0 }}>
                            <img
                                src={message.imageDataUrl}
                                alt={message.imageCaption || 'Imagen adjunta'}
                                className="bubble-img"
                                style={{ cursor: 'zoom-in' }}
                                onClick={() => {
                                    const [header, base64] = (message.imageDataUrl ?? '').split(',')
                                    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
                                    const bytes = atob(base64)
                                    const arr = new Uint8Array(bytes.length)
                                    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
                                    const blob = new Blob([arr], { type: mime })
                                    const url = URL.createObjectURL(blob)
                                    const win = window.open(url, '_blank')
                                    win?.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
                                }}
                            />
                            {message.imageCaption && (
                                <div style={{
                                    fontSize: 10,
                                    color: 'var(--t1)',
                                    fontFamily: 'var(--mono)',
                                    letterSpacing: '0.04em',
                                    marginTop: 4,
                                }}>
                                    {message.imageCaption}
                                </div>
                            )}
                        </div>
                    )}
                    {message.content && <span>{message.content}</span>}
                </div>
            ) : (
                /* ── RESPUESTA IA ── */
                <div
                    style={{
                        maxWidth: '78%',
                        fontSize: 13.5,
                        lineHeight: 1.78,
                        wordBreak: 'break-word',
                        color: 'var(--t0)',
                        position: 'relative',
                    }}
                >
                    {/* Grad-CAM ARRIBA del texto del informe */}
                    {message.gradcamDataUrl && (
                        <div style={{ marginBottom: 12 }}>
                            <img
                                src={message.gradcamDataUrl}
                                alt="Grad-CAM"
                                className="bubble-img"
                                style={{ cursor: 'zoom-in', display: 'block' }}
                                onClick={() => {
                                    const [header, base64] = (message.gradcamDataUrl ?? '').split(',')
                                    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
                                    const bytes = atob(base64)
                                    const arr = new Uint8Array(bytes.length)
                                    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
                                    const blob = new Blob([arr], { type: mime })
                                    const url = URL.createObjectURL(blob)
                                    const win = window.open(url, '_blank')
                                    win?.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
                                }}
                            />
                            <div style={{
                                fontSize: 10,
                                color: 'var(--t1)',
                                fontFamily: 'var(--mono)',
                                letterSpacing: '0.04em',
                                marginTop: 4,
                            }}>
                                Grad-CAM — Región de interés analizada por el modelo
                            </div>
                        </div>
                    )}

                    {/* Contenido markdown renderizado */}
                    <div
                        className="bubble prose-ai"
                        dangerouslySetInnerHTML={{ __html: md(message.content) }}
                    />

                    {/* Indicador de streaming (debajo del texto, no intercalado) */}
                    {message.isStreaming && (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            marginTop: 4,
                            marginLeft: 2,
                        }}>
                            {[0, 1, 2].map(i => (
                                <span
                                    key={i}
                                    style={{
                                        width: 3,
                                        height: 3,
                                        borderRadius: '50%',
                                        background: 'var(--t2)',
                                        display: 'inline-block',
                                        animation: `dot-stream 1s ease-in-out ${i * 0.15}s infinite`,
                                    }}
                                />
                            ))}
                        </span>
                    )}

                    {/* Botón copiar */}
                    {!message.isStreaming && message.content && (
                        <button
                            onClick={handleCopy}
                            className="copy-btn"
                            title={copied ? 'Copiado' : 'Copiar respuesta'}
                            style={{
                                background: copied ? 'var(--ok-bg)' : 'var(--bg-0)',
                                border: `1px solid ${copied ? 'rgba(46,184,122,0.3)' : 'var(--border-h)'}`,
                                color: copied ? 'var(--ok)' : 'var(--t2)',
                                fontFamily: 'var(--mono)',
                                fontSize: 8,
                                letterSpacing: '0.06em',
                                padding: '2px 8px',
                                borderRadius: 'var(--r4)',
                                cursor: 'pointer',
                                opacity: 0,
                                transition: 'all var(--ta)',
                                marginTop: 6,
                                display: 'block',
                            }}
                        >
                            {copied ? '✓ copiado' : 'copiar'}
                        </button>
                    )}
                </div>
            )}

            {/* Timestamp */}
            <div
                className="msg-ts"
                style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 8,
                    color: 'var(--t3)',
                    padding: '0 2px',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                    letterSpacing: '0.04em',
                }}
            >
                {timestamp}
            </div>

            {/* Estilos para markdown renderizado */}
            <style>{`
                .prose-ai h1, .prose-ai h2, .prose-ai h3 {
                    font-size: 13px;
                    font-weight: 650;
                    color: var(--t0);
                    margin: 12px 0 4px;
                    letter-spacing: -0.02em;
                    line-height: 1.3;
                }
                .prose-ai h1 { font-size: 14px; }
                .prose-ai h2 { font-size: 13px; }
                .prose-ai h3 { font-size: 12.5px; color: var(--t1); }
                .prose-ai p  { margin: 4px 0; }
                .prose-ai ul, .prose-ai ol {
                    padding-left: 18px;
                    margin: 4px 0;
                }
                .prose-ai li { margin: 2px 0; }
                .prose-ai strong { font-weight: 650; color: var(--t0); }
                .prose-ai em { color: var(--t1); font-style: italic; }
                .prose-ai code {
                    font-family: var(--mono);
                    font-size: 11.5px;
                    background: var(--bg-3);
                    border: 1px solid var(--border);
                    border-radius: 3px;
                    padding: 1px 5px;
                }
                .prose-ai hr {
                    border: none;
                    border-top: 1px solid var(--border);
                    margin: 10px 0;
                }
                .prose-ai blockquote {
                    border-left: 2px solid var(--accent);
                    padding-left: 10px;
                    color: var(--t1);
                    margin: 6px 0;
                }
            `}</style>
        </div>
    )
}