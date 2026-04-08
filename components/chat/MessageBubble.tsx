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
                    {/* Imagen adjunta del usuario */}
                    {message.imageDataUrl && (
                        <div style={{ marginBottom: message.content ? 10 : 0 }}>
                            <img
                                src={message.imageDataUrl}
                                alt={message.imageCaption || 'Imagen adjunta'}
                                className="bubble-img"
                                onClick={() => window.open(message.imageDataUrl, '_blank')}
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

                    {message.content && (
                        <span>{message.content}</span>
                    )}
                </div>
            ) : (
                /* ── TEXTO IA ── */
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
                    {/* Indicador de streaming */}
                    {message.isStreaming && (
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 2,
                            marginLeft: 4,
                            verticalAlign: 'middle',
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

                    <span dangerouslySetInnerHTML={{ __html: md(message.content) }} />

                    {/* Botón copiar */}
                    {!message.isStreaming && (
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
        </div>
    )
}