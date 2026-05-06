'use client'

import { useState, useRef, useEffect } from 'react'
import type React from 'react'

interface BarraInputProps {
    readonly onSend: (text: string, imageB64?: string, imageMime?: string) => void
    readonly onGenerateReport?: () => void
    readonly onDocumentAttach?: (file: File) => Promise<void>
    readonly disabled?: boolean
}

interface PendingImage {
    b64: string
    mime: string
    name: string
    dataUrl: string
}

interface PendingDoc {
    file: File
    name: string
    isPdf: boolean
}

// Tipos de archivo que se aceptan como "documento clínico"
const DOC_MIME = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
])

function isDocFile(file: File) {
    return DOC_MIME.has(file.type) || file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.doc')
}
function isImageFile(file: File) {
    return file.type.startsWith('image/')
}

// Qué tipo de archivo está siendo arrastrado (sin acceso al contenido)
function detectDragType(dt: DataTransfer): 'image' | 'doc' | 'unknown' | null {
    if (!dt.types.includes('Files')) return null
    // Durante dragenter los items están disponibles en Chrome/Firefox
    for (const item of Array.from(dt.items)) {
        if (item.kind !== 'file') continue
        if (item.type.startsWith('image/')) return 'image'
        if (DOC_MIME.has(item.type)) return 'doc'
        // fallback por extensión no disponible aquí → unknown
        return 'unknown'
    }
    return 'unknown'
}

export function BarraInput({ onSend, onGenerateReport, onDocumentAttach, disabled }: BarraInputProps) {
    const [text, setText]           = useState('')
    const [pendingImg, setPendingImg] = useState<PendingImage | null>(null)
    const [pendingDoc, setPendingDoc] = useState<PendingDoc | null>(null)
    const [focused, setFocused]     = useState(false)
    const [dragType, setDragType]   = useState<'image' | 'doc' | 'unknown' | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileRef     = useRef<HTMLInputElement>(null)
    const docRef      = useRef<HTMLInputElement>(null)
    const dragCounterRef = useRef(0)

    // ── Leer imagen ────────────────────────────────────────────────────────────
    function readImageFile(file: File) {
        const reader = new FileReader()
        reader.onload = ev => {
            const d    = ev.target?.result as string
            const mime = file.type || 'image/jpeg'
            const b64  = d.split(',')[1]
            setPendingImg({ b64, mime, name: file.name, dataUrl: d })
        }
        reader.readAsDataURL(file)
    }

    // ── Manejar documento (preview local + callback padre) ─────────────────────
    function handleDocFile(file: File) {
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf')
        setPendingDoc({ file, name: file.name, isPdf })
    }

    // ── Auto-resize textarea ───────────────────────────────────────────────────
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 110) + 'px'
    }, [text])

    // ── Drag & Drop global ─────────────────────────────────────────────────────
    useEffect(() => {
        const onDragEnter = (e: DragEvent) => {
            if (!e.dataTransfer?.types.includes('Files')) return
            dragCounterRef.current++
            const t = detectDragType(e.dataTransfer)
            setDragType(t)
        }
        const onDragLeave = () => {
            dragCounterRef.current--
            if (dragCounterRef.current === 0) setDragType(null)
        }
        const onDragOver = (e: DragEvent) => { e.preventDefault() }
        const onDrop = (e: DragEvent) => {
            e.preventDefault()
            dragCounterRef.current = 0
            setDragType(null)
            const file = e.dataTransfer?.files?.[0]
            if (!file) return
            if (isImageFile(file)) {
                readImageFile(file)
            } else if (isDocFile(file)) {
                handleDocFile(file)
            }
        }

        window.addEventListener('dragenter', onDragEnter)
        window.addEventListener('dragleave', onDragLeave)
        window.addEventListener('dragover',  onDragOver)
        window.addEventListener('drop',      onDrop)
        return () => {
            window.removeEventListener('dragenter', onDragEnter)
            window.removeEventListener('dragleave', onDragLeave)
            window.removeEventListener('dragover',  onDragOver)
            window.removeEventListener('drop',      onDrop)
        }
    }, [])

    // ── Paste imagen ───────────────────────────────────────────────────────────
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

    // ── Input file handlers ────────────────────────────────────────────────────
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        readImageFile(f)
        e.target.value = ''
    }

    function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0]
        if (!f) return
        handleDocFile(f)
        e.target.value = ''
    }

    // ── Enviar ─────────────────────────────────────────────────────────────────
    async function send() {
        const t = text.trim()
        if (!t && !pendingImg && !pendingDoc) return

        // Si hay documento pendiente, primero lo sube y luego envía el texto
        if (pendingDoc) {
            await onDocumentAttach?.(pendingDoc.file)
            setPendingDoc(null)
            if (t) onSend(t)
        } else if (pendingImg) {
            onSend(t, pendingImg.b64, pendingImg.mime)
            setPendingImg(null)
        } else {
            onSend(t)
        }

        setText('')
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    const canSend = (text.trim().length > 0 || !!pendingImg || !!pendingDoc) && !disabled
    const isDragging = dragType !== null

    return (
        <>
            {/* ── Overlay drag & drop ──────────────────────────────────────────── */}
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
                        {dragType === 'doc' ? (
                            /* Ícono documento */
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--accent)' }}>
                                <path d="M20 4H8C6.9 4 6 4.9 6 6V26C6 27.1 6.9 28 8 28H24C25.1 28 26 27.1 26 26V10L20 4Z"
                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20 4V10H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="11" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                <line x1="11" y1="21" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        ) : (
                            /* Ícono imagen / adjunto genérico */
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--accent)' }}>
                                <path d="M26 15L14.5 26.5C11.46 29.54 6.54 29.54 3.5 26.5C0.46 23.46 0.46 18.54 3.5 15.5L15 4C17.21 1.79 20.79 1.79 23 4C25.21 6.21 25.21 9.79 23 12L11.5 23.5C10.12 24.88 7.88 24.88 6.5 23.5C5.12 22.12 5.12 19.88 6.5 18.5L17 8"
                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                            {dragType === 'doc'
                                ? 'Suelta para adjuntar documento'
                                : dragType === 'image'
                                    ? 'Suelta para adjuntar imagen'
                                    : 'Suelta para adjuntar archivo'}
                        </span>
                        <span style={{
                            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                            letterSpacing: '0.04em',
                        }}>
                            Imágenes · PDF · DOCX
                        </span>
                    </div>
                </div>
            )}

            <div style={{
                padding: '8px 16px 12px', flexShrink: 0,
                background: 'var(--bg-1)', borderTop: '1px solid var(--border)',
            }}>
                {/* ── Preview imagen pendiente ─────────────────────────────────── */}
                {pendingImg && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 10px', marginBottom: 8,
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r8)',
                    }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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

                {/* ── Preview documento pendiente ──────────────────────────────── */}
                {pendingDoc && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 10px', marginBottom: 8,
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r8)',
                    }}>
                        {/* Ícono PDF o DOCX */}
                        <div style={{
                            width: 34, height: 34, borderRadius: 'var(--r4)', flexShrink: 0,
                            border: '1px solid var(--border-h)',
                            background: pendingDoc.isPdf ? 'rgba(220,50,50,0.12)' : 'rgba(43,107,224,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {pendingDoc.isPdf ? (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M9.5 1H4C3.45 1 3 1.45 3 2V14C3 14.55 3.45 15 4 15H12C12.55 15 13 14.55 13 14V4.5L9.5 1Z"
                                          stroke="#e05252" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9.5 1V4.5H13" stroke="#e05252" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <text x="4.5" y="11.5" fontFamily="var(--mono)" fontSize="3.8" fill="#e05252" fontWeight="700">PDF</text>
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M9.5 1H4C3.45 1 3 1.45 3 2V14C3 14.55 3.45 15 4 15H12C12.55 15 13 14.55 13 14V4.5L9.5 1Z"
                                          stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9.5 1V4.5H13" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <line x1="5" y1="8"  x2="11" y2="8"  stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
                                    <line x1="5" y1="10" x2="11" y2="10" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
                                    <line x1="5" y1="12" x2="8"  y2="12" stroke="var(--accent)" strokeWidth="1" strokeLinecap="round"/>
                                </svg>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                                fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t1)',
                                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {pendingDoc.name}
                            </span>
                            <span style={{
                                fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--t3)',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                {pendingDoc.isPdf ? 'PDF' : 'Word'} · listo para enviar
                            </span>
                        </div>

                        <button
                            onClick={() => setPendingDoc(null)}
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

                {/* ── Barra de escritura ───────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 4,
                    background: 'var(--bg-2)',
                    border: `1px solid ${focused ? 'var(--border-focus)' : 'var(--border-h)'}`,
                    borderRadius: 'var(--r12)', padding: '4px 5px',
                    transition: 'border-color var(--ts), box-shadow var(--ts)',
                    boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
                }}>

                    <ReportBtn onClick={onGenerateReport} disabled={disabled} />

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
                                if (canSend) void send()
                            }
                        }}
                        placeholder={
                            disabled    ? 'Esperando respuesta...'
                                : pendingDoc ? `Mensaje sobre "${pendingDoc.name}" (opcional)...`
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

                    {/* Inputs ocultos */}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                    <input
                        ref={docRef} type="file"
                        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        style={{ display: 'none' }}
                        onChange={handleDocChange}
                    />

                    {onDocumentAttach && (
                        <IconBtn title="Adjuntar documento (PDF / Word) — o arrástralo aquí" onClick={() => docRef.current?.click()}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M8 1H3C2.45 1 2 1.45 2 2V12C2 12.55 2.45 13 3 13H11C11.55 13 12 12.55 12 12V5L8 1Z"
                                      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8 1V5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="4.5" y1="9.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                        </IconBtn>
                    )}

                    <IconBtn title="Adjuntar imagen — o arrástrala aquí" onClick={() => fileRef.current?.click()}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M12 9V12C12 12.55 11.55 13 11 13H3C2.45 13 2 12.55 2 12V9"
                                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <line x1="7" y1="1.5" x2="7" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <path d="M4.5 4L7 1.5L9.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </IconBtn>

                    <button
                        onClick={() => canSend && void send()}
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

// ── Botón de reporte con tooltip ─────────────────────────────────────────────
function ReportBtn({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
    const [hovered, setHovered] = useState(false)
    return (
        <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0 }}>
            <button
                onClick={() => !disabled && onClick?.()}
                title="Generar reporte"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: hovered && !disabled ? 'var(--accent-glow)' : 'transparent',
                    border: 'none',
                    color: hovered && !disabled ? 'var(--accent)' : 'var(--t2)',
                    cursor: disabled ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--ta)', alignSelf: 'flex-end',
                    opacity: disabled ? 0.4 : 1,
                }}
            >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M8.5 1H3C2.45 1 2 1.45 2 2V12C2 12.55 2.45 13 3 13H11C11.55 13 12 12.55 12 12V4.5L8.5 1Z"
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8.5 1V4.5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="4.5" y1="7"  x2="9.5" y2="7"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="4.5" y1="9"  x2="9.5" y2="9"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="4.5" y1="11" x2="7.5" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
            </button>
            {hovered && !disabled && (
                <div style={{
                    position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--bg-3)', border: '1px solid var(--border-h)',
                    borderRadius: 6, padding: '4px 8px', whiteSpace: 'nowrap',
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t1)',
                    letterSpacing: '0.04em', pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 20,
                }}>
                    Generar reporte
                </div>
            )}
        </div>
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