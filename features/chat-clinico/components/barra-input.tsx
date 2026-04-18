'use client'

import { useState, useRef, useEffect } from 'react'

interface BarraInputProps {
    readonly onSend: (text: string, imageB64?: string, imageMime?: string) => void
    readonly disabled?: boolean
}

interface PendingImage {
    b64: string
    mime: string
    name: string
    dataUrl: string
}

export function BarraInput({ onSend, disabled }: BarraInputProps) {
    const [text, setText] = useState('')
    const [pendingImg, setPendingImg] = useState<PendingImage | null>(null)
    const [micActive, setMicActive] = useState(false)
    const [focused, setFocused] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const dragCounterRef = useRef(0)

    // Declarada antes de los useEffect para que el de drag/drop pueda referenciarla.
    function readImageFile(file: File) {
        const reader = new FileReader()
        reader.onload = ev => {
            const d = ev.target?.result as string
            const mime = file.type || 'image/jpeg'
            const b64 = d.split(',')[1]
            setPendingImg({ b64, mime, name: file.name, dataUrl: d })
        }
        reader.readAsDataURL(file)
    }

    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 110) + 'px'
    }, [text])

    useEffect(() => {
        const onDragEnter = (e: DragEvent) => {
            if (!e.dataTransfer?.types.includes('Files')) return
            dragCounterRef.current++
            setIsDragging(true)
        }
        const onDragLeave = () => {
            dragCounterRef.current--
            if (dragCounterRef.current === 0) setIsDragging(false)
        }
        const onDragOver = (e: DragEvent) => { e.preventDefault() }
        const onDrop = (e: DragEvent) => {
            e.preventDefault()
            dragCounterRef.current = 0
            setIsDragging(false)
            const file = e.dataTransfer?.files?.[0]
            if (file && file.type.startsWith('image/')) readImageFile(file)
        }

        window.addEventListener('dragenter', onDragEnter)
        window.addEventListener('dragleave', onDragLeave)
        window.addEventListener('dragover', onDragOver)
        window.addEventListener('drop', onDrop)
        return () => {
            window.removeEventListener('dragenter', onDragEnter)
            window.removeEventListener('dragleave', onDragLeave)
            window.removeEventListener('dragover', onDragOver)
            window.removeEventListener('drop', onDrop)
        }
    }, [])

    function handlePaste(e: React.ClipboardEvent) {
        const items = e.clipboardData?.items
        if (!items) return
        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault()
                const file = item.getAsFile()
                if (file) readImageFile(file)
                break
            }
        }
    }

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
        readImageFile(f)
        e.target.value = ''
    }

    const canSend = (text.trim().length > 0 || !!pendingImg) && !disabled

    return (
        <>
            {isDragging && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(9, 12, 24, 0.75)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                        padding: '28px 40px', background: 'var(--bg-2)',
                        border: '1.5px dashed var(--accent)', borderRadius: 'var(--r16)',
                        boxShadow: '0 0 40px var(--accent-glow)',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--accent)' }}>
                            <path d="M26 15L14.5 26.5C11.46 29.54 6.54 29.54 3.5 26.5C0.46 23.46 0.46 18.54 3.5 15.5L15 4C17.21 1.79 20.79 1.79 23 4C25.21 6.21 25.21 9.79 23 12L11.5 23.5C10.12 24.88 7.88 24.88 6.5 23.5C5.12 22.12 5.12 19.88 6.5 18.5L17 8"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                            Suelta para adjuntar imagen
                        </span>
                    </div>
                </div>
            )}

            <div style={{
                padding: '8px 16px 12px', flexShrink: 0,
                background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
            }}>
                {pendingImg && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 10px', marginBottom: 8,
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r8)',
                    }}>
                        <img src={pendingImg.dataUrl} alt={pendingImg.name} style={{
                            width: 34, height: 34, objectFit: 'cover',
                            borderRadius: 'var(--r4)', flexShrink: 0, border: '1px solid var(--border-h)',
                        }} />
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t1)', flex: 1,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {pendingImg.name}
                        </span>
                        <button
                            onClick={() => setPendingImg(null)}
                            style={{
                                background: 'transparent', border: 'none', color: 'var(--t2)',
                                cursor: 'pointer', padding: '4px', borderRadius: 'var(--r4)',
                                lineHeight: 1, display: 'flex', alignItems: 'center',
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                )}

                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 4,
                    background: 'var(--bg-2)',
                    border: `1px solid ${focused ? 'var(--border-focus)' : 'var(--border-h)'}`,
                    borderRadius: 'var(--r12)', padding: '4px 5px',
                    transition: 'border-color var(--ts), box-shadow var(--ts)',
                    boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
                }}>
                    <MicBtn active={micActive} onClick={() => setMicActive(v => !v)} />
                    <div style={{ width: 1, height: 16, background: 'var(--border)', alignSelf: 'center', flexShrink: 0 }} />

                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onPaste={handlePaste}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                if (canSend) send()
                            }
                        }}
                        placeholder={
                            disabled ? 'Esperando respuesta...'
                                : pendingImg ? 'Descripción de la imagen (opcional)...'
                                    : 'Escribe un mensaje clínico...'
                        }
                        disabled={disabled}
                        rows={1}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: disabled ? 'var(--t2)' : 'var(--t0)',
                            fontFamily: 'var(--sans)', fontSize: 13, letterSpacing: '-0.01em',
                            padding: '7px 6px', caretColor: 'var(--accent)', resize: 'none',
                            minHeight: 34, maxHeight: 110, overflowY: 'auto', lineHeight: 1.55,
                            alignSelf: 'center', scrollbarWidth: 'none',
                        }}
                    />

                    <div style={{ width: 1, height: 16, background: 'var(--border)', alignSelf: 'center', flexShrink: 0 }} />

                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    <IconBtn title="Adjuntar imagen" onClick={() => fileRef.current?.click()}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M12 9V12C12 12.55 11.55 13 11 13H3C2.45 13 2 12.55 2 12V9"
                                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <line x1="7" y1="1.5" x2="7" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <path d="M4.5 4L7 1.5L9.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </IconBtn>

                    <button
                        onClick={() => canSend && send()}
                        title="Enviar (Enter)"
                        style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: canSend ? 'var(--accent)' : 'var(--bg-3)',
                            border: canSend ? 'none' : '1px solid var(--border)',
                            cursor: canSend ? 'pointer' : 'default',
                            color: canSend ? '#fff' : 'var(--t3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all var(--ts)', alignSelf: 'flex-end',
                            boxShadow: canSend ? 'var(--shadow-accent)' : 'none',
                        }}
                    >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M6.5 11V2M6.5 2L3 5.5M6.5 2L10 5.5"
                                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    )
}

function IconBtn({ title, onClick, children }: {
    title: string; onClick: () => void; children: React.ReactNode
}) {
    return (
        <button onClick={onClick} title={title} style={{
            width: 34, height: 34, borderRadius: '50%', background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'var(--t2)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--ta)', alignSelf: 'flex-end',
        }}>
            {children}
        </button>
    )
}

function MicBtn({ active, onClick }: { active: boolean; onClick: () => void }) {
    return (
        <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
            {active && (
                <div style={{
                    position: 'absolute', inset: -3, borderRadius: '50%',
                    border: '1.5px solid var(--accent)',
                    animation: 'mic-pulse 1.3s ease-out infinite',
                    pointerEvents: 'none', opacity: 0.5,
                }} />
            )}
            <IconBtn title="Micrófono" onClick={onClick}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="4.5" y="1" width="5" height="7.5" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M2 7A5 5 0 0 0 12 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
            </IconBtn>
        </div>
    )
}