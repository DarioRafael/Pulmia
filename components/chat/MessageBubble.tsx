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
            className={`msg-wrap ${isUser ? 'user' : 'ai'}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                animation: 'msg-in 0.2s ease both',
                position: 'relative',
                gap: 4,
            }}
        >
            {/* Etiqueta del remitente */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '0 4px',
                fontFamily: 'var(--mono)',
                fontSize: 8,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isUser ? 'var(--t2)' : 'var(--accent)',
            }}>
                {!isUser && (
                    <span style={{
                        width: 14,
                        height: 14,
                        borderRadius: 'var(--r3)',
                        background: 'var(--accent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                )}
                {isUser ? 'Médico' : 'Sistema IA'}
            </div>

            {/* Burbuja */}
            <div
                className={`bubble ${message.isStreaming ? 'streaming' : ''}`}
                style={{
                    maxWidth: isUser ? '66%' : '76%',
                    padding: isUser ? '9px 14px' : '11px 15px',
                    fontSize: 13.5,
                    lineHeight: isUser ? 1.65 : 1.75,
                    wordBreak: 'break-word',
                    background: isUser ? 'var(--bg-3)' : 'var(--bg-2)',
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
                    boxShadow: isUser ? 'none' : 'var(--shadow-sm)',
                }}
            >
                {/* Imagen adjunta */}
                {message.imageDataUrl && (
                    <div style={{ marginBottom: 8 }}>
                        <img
                            src={message.imageDataUrl}
                            alt={message.imageCaption || 'Imagen adjunta'}
                            className="bubble-img"
                            onClick={() => window.open(message.imageDataUrl, '_blank')}
                        />
                        {message.imageCaption && (
                            <div style={{
                                fontSize: 11,
                                color: 'var(--t1)',
                                fontFamily: 'var(--mono)',
                                letterSpacing: '0.02em',
                            }}>
                                {message.imageCaption}
                            </div>
                        )}
                    </div>
                )}

                {/* Contenido */}
                {isUser ? (
                    <span style={{ letterSpacing: '-0.01em' }}>{message.content}</span>
                ) : (
                    <span dangerouslySetInnerHTML={{ __html: md(message.content) }} />
                )}

                {/* Botón copiar */}
                {!isUser && !message.isStreaming && (
                    <button
                        onClick={handleCopy}
                        className="copy-btn"
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
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
                    fontSize: 7.5,
                    color: 'var(--t3)',
                    padding: '0 4px',
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