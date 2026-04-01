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
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <div
            className={`msg-wrap ${isUser ? 'user' : 'ai'}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                animation: 'msg-in 0.22s ease both',
                position: 'relative',
            }}
        >
            {/* Remitente */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 4,
                    padding: '0 2px',
                    fontFamily: 'var(--mono)',
                    fontSize: 8,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: isUser ? 'var(--t2)' : 'var(--accent)',
                    opacity: isUser ? 1 : 0.8,
                }}
            >
        <span
            style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: 'currentColor',
                display: 'inline-block',
            }}
        />
                {isUser ? 'medico' : 'sistema ia'}
            </div>

            {/* Burbuja */}
            <div
                className={`bubble ${message.isStreaming ? 'streaming' : ''}`}
                style={{
                    maxWidth: isUser ? '68%' : '78%',
                    padding: isUser ? '10px 15px' : '12px 16px',
                    fontSize: 13.5,
                    lineHeight: isUser ? 1.7 : 1.8,
                    wordBreak: 'break-word',
                    background: isUser ? 'var(--bg-3)' : 'var(--bg-2)',
                    border: isUser
                        ? '1px solid var(--border-h)'
                        : '1px solid var(--border)',
                    borderLeft: isUser ? undefined : '2px solid var(--accent)',
                    borderRadius: isUser
                        ? 'var(--r12) var(--r12) 3px var(--r12)'
                        : '3px var(--r12) var(--r12) var(--r12)',
                    color: 'var(--t0)',
                    position: 'relative',
                    transition: 'border-color var(--ta)',
                }}
            >
                {/* Radiografia adjunta — por ahora se muestran imagenes generales;
            cuando el backend soporte DICOM esta seccion renderizara el visor DICOM */}
                {message.imageDataUrl && (
                    <div>
                        <img
                            src={message.imageDataUrl}
                            alt={message.imageCaption || 'Imagen adjunta'}
                            className="bubble-img"
                            onClick={() => window.open(message.imageDataUrl, '_blank')}
                        />
                        {message.imageCaption && (
                            <div style={{ fontSize: 12, color: 'var(--t1)', marginTop: 2 }}>
                                {message.imageCaption}
                            </div>
                        )}
                    </div>
                )}

                {/* Contenido de texto */}
                {isUser ? (
                    <span>{message.content}</span>
                ) : (
                    <span dangerouslySetInnerHTML={{ __html: md(message.content) }} />
                )}

                {/* Boton copiar — solo en mensajes de IA */}
                {!isUser && !message.isStreaming && (
                    <button
                        onClick={handleCopy}
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'var(--bg-3)',
                            border: '1px solid var(--border)',
                            color: copied ? 'var(--ok)' : 'var(--t2)',
                            borderColor: copied ? 'rgba(76,175,135,0.4)' : 'var(--border)',
                            fontFamily: 'var(--mono)',
                            fontSize: 8,
                            letterSpacing: '0.06em',
                            padding: '2px 8px',
                            borderRadius: 'var(--r4)',
                            cursor: 'pointer',
                            opacity: 0,
                            transition: 'all var(--ta)',
                        }}
                        className="copy-btn"
                    >
                        {copied ? 'copiado' : 'copiar'}
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
                    marginTop: 4,
                    padding: '0 3px',
                    opacity: 0,
                    transition: 'opacity 0.15s',
                }}
            >
                {timestamp}
            </div>
        </div>
    )
}