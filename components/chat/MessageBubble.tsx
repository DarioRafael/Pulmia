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
            {/* Etiqueta del remitente */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 2px',
                fontFamily: 'var(--mono)',
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isUser ? 'var(--t2)' : 'var(--accent)',
                fontWeight: isUser ? 400 : 500,
            }}>
                {!isUser && (
                    <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: 'var(--r4)',
                        background: 'var(--accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 0 8px var(--accent-glow)',
                    }}>
                        <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                )}
                {isUser ? 'Médico' : 'Sistema IA'}

                {/* Indicador de streaming inline */}
                {message.isStreaming && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                        marginLeft: 4,
                    }}>
                        {[0, 1, 2].map(i => (
                            <span
                                key={i}
                                style={{
                                    width: 3,
                                    height: 3,
                                    borderRadius: '50%',
                                    background: 'var(--accent)',
                                    display: 'inline-block',
                                    animation: `dot-stream 1s ease-in-out ${i * 0.15}s infinite`,
                                }}
                            />
                        ))}
                    </span>
                )}
            </div>

            {/* Burbuja */}
            <div
                className="bubble"
                style={{
                    maxWidth: isUser ? '62%' : '78%',
                    padding: isUser ? '9px 14px' : '13px 16px',
                    fontSize: 13.5,
                    lineHeight: isUser ? 1.6 : 1.78,
                    wordBreak: 'break-word',
                    background: isUser
                        ? 'var(--bg-3)'
                        : 'linear-gradient(135deg, var(--bg-2) 0%, color-mix(in srgb, var(--bg-2) 95%, var(--accent) 5%) 100%)',
                    border: isUser
                        ? '1px solid var(--border-h)'
                        : '1px solid var(--border)',
                    borderLeft: isUser ? undefined : '2px solid var(--accent)',
                    borderRadius: isUser
                        ? 'var(--r12) var(--r12) var(--r4) var(--r12)'
                        : 'var(--r4) var(--r12) var(--r12) var(--r12)',
                    color: 'var(--t0)',
                    position: 'relative',
                    transition: 'border-color var(--ta)',
                    boxShadow: isUser
                        ? 'none'
                        : '0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
            >
                {/* Imagen adjunta */}
                {message.imageDataUrl && (
                    <div style={{ marginBottom: 10 }}>
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

                {/* Contenido de texto */}
                {isUser ? (
                    <span style={{ letterSpacing: '-0.01em' }}>{message.content}</span>
                ) : (
                    <span dangerouslySetInnerHTML={{ __html: md(message.content) }} />
                )}

                {/* Botón copiar — solo cuando NO está en streaming */}
                {!isUser && !message.isStreaming && (
                    <button
                        onClick={handleCopy}
                        className="copy-btn"
                        title={copied ? 'Copiado' : 'Copiar respuesta'}
                        style={{
                            position: 'absolute',
                            top: 9,
                            right: 9,
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
                        }}
                    >
                        {copied ? '✓ copiado' : 'copiar'}
                    </button>
                )}
            </div>

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