'use client'

// Burbuja de mensaje del chat clínico.
// Replica el diseño original de MessageBubble con los tipos nuevos.

import { useState } from 'react'
import type { Mensaje } from '../tipos'
import { md } from '../utils/markdown'

interface MensajeBurbujaProps {
    readonly mensaje: Mensaje
}

function abrirImagenEnTab(dataUrl: string) {
    const [header, base64] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
    const bytes = atob(base64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: mime })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    win?.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
}

export function MensajeBurbuja({ mensaje }: MensajeBurbujaProps) {
    const [copied, setCopied] = useState(false)
    const isUser = mensaje.rol === 'user'

    const timestamp = mensaje.timestamp.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
    })

    function handleCopy() {
        navigator.clipboard?.writeText(mensaje.contenido)
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
                    {mensaje.imagenDataUrl && (
                        <div style={{ marginBottom: mensaje.contenido ? 10 : 0 }}>
                            <img
                                src={mensaje.imagenDataUrl}
                                alt={mensaje.imagenTitulo || 'Imagen adjunta'}
                                className="bubble-img"
                                style={{ cursor: 'zoom-in' }}
                                onClick={() => mensaje.imagenDataUrl && abrirImagenEnTab(mensaje.imagenDataUrl)}
                            />
                            {mensaje.imagenTitulo && (
                                <div style={{
                                    fontSize: 10, color: 'var(--t1)', fontFamily: 'var(--mono)',
                                    letterSpacing: '0.04em', marginTop: 4,
                                }}>
                                    {mensaje.imagenTitulo}
                                </div>
                            )}
                        </div>
                    )}
                    {mensaje.contenido && <span>{mensaje.contenido}</span>}
                </div>
            ) : (
                <div style={{
                    maxWidth: '78%', fontSize: 13.5, lineHeight: 1.78,
                    wordBreak: 'break-word', color: 'var(--t0)', position: 'relative',
                }}>
                    {mensaje.gradcamDataUrl && (
                        <div style={{ marginBottom: 12 }}>
                            <img
                                src={mensaje.gradcamDataUrl}
                                alt="Grad-CAM"
                                className="bubble-img"
                                style={{ cursor: 'zoom-in', display: 'block' }}
                                onClick={() => mensaje.gradcamDataUrl && abrirImagenEnTab(mensaje.gradcamDataUrl)}
                            />
                            <div style={{
                                fontSize: 10, color: 'var(--t1)', fontFamily: 'var(--mono)',
                                letterSpacing: '0.04em', marginTop: 4,
                            }}>
                                Grad-CAM — Región de interés analizada por el modelo
                            </div>
                        </div>
                    )}

                    <div
                        className="bubble prose-ai"
                        dangerouslySetInnerHTML={{ __html: md(mensaje.contenido) }}
                    />

                    {mensaje.isStreaming && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            gap: 2, marginTop: 4, marginLeft: 2,
                        }}>
                            {[0, 1, 2].map(i => (
                                <span key={i} style={{
                                    width: 3, height: 3, borderRadius: '50%',
                                    background: 'var(--t2)', display: 'inline-block',
                                    animation: `dot-stream 1s ease-in-out ${i * 0.15}s infinite`,
                                }} />
                            ))}
                        </span>
                    )}

                    {!mensaje.isStreaming && mensaje.contenido && (
                        <button
                            onClick={handleCopy}
                            className="copy-btn"
                            title={copied ? 'Copiado' : 'Copiar respuesta'}
                            style={{
                                background: copied ? 'var(--ok-bg)' : 'var(--bg-0)',
                                border: `1px solid ${copied ? 'rgba(46,184,122,0.3)' : 'var(--border-h)'}`,
                                color: copied ? 'var(--ok)' : 'var(--t2)',
                                fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.06em',
                                padding: '2px 8px', borderRadius: 'var(--r4)',
                                cursor: 'pointer', opacity: 0, transition: 'all var(--ta)',
                                marginTop: 6, display: 'block',
                            }}
                        >
                            {copied ? '✓ copiado' : 'copiar'}
                        </button>
                    )}
                </div>
            )}

            <div className="msg-ts" style={{
                fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)',
                padding: '0 2px', opacity: 0, transition: 'opacity 0.15s', letterSpacing: '0.04em',
            }}>
                {timestamp}
            </div>
        </div>
    )
}
