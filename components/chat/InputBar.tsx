'use client'

import { useState, useRef, useEffect } from 'react'

interface InputBarProps {
    onSend: (text: string, imageB64?: string, imageMime?: string) => void
    disabled?: boolean
}

interface PendingImage {
    b64: string
    mime: string
    name: string
    dataUrl: string
}

export function InputBar({ onSend, disabled }: InputBarProps) {
    const [text, setText] = useState('')
    // Por ahora se acepta cualquier imagen como adjunto.
    // Cuando el backend soporte DICOM, aqui se cambiara el accept a
    // ".dcm,image/*" y se validara el tipo antes de adjuntar.
    const [pendingImg, setPendingImg] = useState<PendingImage | null>(null)
    const [micActive, setMicActive] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    // Auto-resize del textarea
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 110) + 'px'
    }, [text])

    function send() {
        const t = text.trim()
        if (!t && !pendingImg) return
        if (pendingImg) {
            onSend(t, pendingImg.b64, pendingImg.mime)
            setPendingImg(null)
        } else {
            onSend(t)
        }
        setText('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        const reader = new FileReader()
        reader.onload = ev => {
            const d = ev.target?.result as string
            const mime = f.type || 'image/jpeg'
            const b64 = d.split(',')[1]
            setPendingImg({ b64, mime, name: f.name, dataUrl: d })
        }
        reader.readAsDataURL(f)
        e.target.value = ''
    }

    function handleMicClick() {
        // El backend (pywebview) gestiona el microfono.
        // Esta funcion se conectara con pywebview.api.on_mic_click()
        // cuando se integre el puente con Python.
        setMicActive(v => !v)
        try {
            // @ts-ignore — pywebview se inyecta en tiempo de ejecucion
            window.pywebview?.api?.on_mic_click()
        } catch (_) {}
    }

    return (
        <div
            style={{
                padding: '10px 18px 14px',
                flexShrink: 0,
                background: 'var(--bg-1)',
                borderTop: '1px solid var(--border)',
                position: 'relative',
            }}
        >
            {/* Preview de imagen / radiografia adjunta */}
            {pendingImg && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        marginBottom: 7,
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r8)',
                    }}
                >
                    <img
                        src={pendingImg.dataUrl}
                        alt={pendingImg.name}
                        style={{
                            width: 36,
                            height: 36,
                            objectFit: 'cover',
                            borderRadius: 'var(--r6)',
                            flexShrink: 0,
                        }}
                    />
                    <span
                        style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 9,
                            color: 'var(--t1)',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
            {pendingImg.name}
          </span>
                    <button
                        onClick={() => setPendingImg(null)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--t2)',
                            cursor: 'pointer',
                            padding: '3px',
                            borderRadius: 'var(--r4)',
                            lineHeight: 1,
                            fontSize: 11,
                            transition: 'color var(--ta)',
                        }}
                        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--err)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--t2)')}
                    >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <line x1="1" y1="1" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="10" y1="1" x2="1" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Pill de input */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 3,
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border-h)',
                    borderRadius: 'var(--r12)',
                    padding: '4px 5px',
                    transition: 'border-color var(--ta), box-shadow var(--ta)',
                }}
                onFocus={() => {}}
            >
                {/* Microfono */}
                <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                    {micActive && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: -2,
                                borderRadius: '50%',
                                border: '1.5px solid rgba(91,107,240,0.4)',
                                animation: 'mic-pulse 1.3s ease-out infinite',
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                    <button
                        onClick={handleMicClick}
                        title="Microfono"
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: micActive ? 'var(--accent)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: micActive ? '#fff' : 'var(--t2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--ta)',
                            boxShadow: micActive ? '0 0 14px rgba(91,107,240,0.5)' : 'none',
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <rect x="5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M2.5 7.5A5 5 0 0 0 12.5 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <line x1="7.5" y1="12.5" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Separador */}
                <div style={{ width: 1, height: 16, background: 'var(--border)', alignSelf: 'center', flexShrink: 0 }} />

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            if ((text.trim() || pendingImg) && !disabled) send()
                        }
                    }}
                    placeholder={pendingImg ? 'Descripcion de la imagen (opcional)...' : 'Escribe un mensaje...'}
                    disabled={disabled}
                    rows={1}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: disabled ? 'rgba(221,224,240,0.3)' : 'var(--t0)',
                        fontFamily: 'var(--sans)',
                        fontSize: 13.5,
                        padding: '7px 6px',
                        caretColor: 'var(--accent)',
                        resize: 'none',
                        minHeight: 36,
                        maxHeight: 110,
                        overflowY: 'auto',
                        lineHeight: 1.6,
                        alignSelf: 'center',
                        scrollbarWidth: 'none',
                    }}
                />

                {/* Separador */}
                <div style={{ width: 1, height: 16, background: 'var(--border)', alignSelf: 'center', flexShrink: 0 }} />

                {/* Adjuntar imagen / radiografia */}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <button
                    onClick={() => fileRef.current?.click()}
                    title="Adjuntar imagen"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--t2)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all var(--ta)',
                        alignSelf: 'flex-end',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--t0)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--t2)')}
                >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path
                            d="M13 9.5V12.5C13 13.05 12.55 13.5 12 13.5H3C2.45 13.5 2 13.05 2 12.5V9.5"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                        />
                        <line x1="7.5" y1="1.5" x2="7.5" y2="9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        <path d="M4.5 4.5L7.5 1.5L10.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Enviar */}
                <button
                    onClick={() => { if ((text.trim() || pendingImg) && !disabled) send() }}
                    title="Enviar (Enter)"
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: 'var(--accent)',
                        border: 'none',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        color: '#fff',
                        fontSize: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 10px rgba(91,107,240,0.4)',
                        transition: 'all var(--ta)',
                        alignSelf: 'flex-end',
                        opacity: disabled ? 0.5 : 1,
                    }}
                    onMouseEnter={e => {
                        if (!disabled) {
                            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-h)'
                            ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'
                        }
                    }}
                    onMouseLeave={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)'
                        ;(e.currentTarget as HTMLButtonElement).style.transform = 'none'
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    )
}