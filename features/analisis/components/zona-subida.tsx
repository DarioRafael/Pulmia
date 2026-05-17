'use client'

// Zona de drag & drop / click para subir una radiografía.
// Es la pantalla principal de la app clínica.

import { useState, useRef } from 'react'

interface ZonaSubidaProps {
    readonly onArchivo: (archivo: File) => void
    readonly disabled?: boolean
}

export function ZonaSubida({ onArchivo, disabled }: ZonaSubidaProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [hover, setHover] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const dragCounterRef = useRef(0)

    function handleFile(file: File) {
        if (file.type.startsWith('image/')) {
            onArchivo(file)
        }
    }

    const activo = isDragging || hover

    return (
        <>
            <style>{`
                @keyframes pulso-icono {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50%      { transform: scale(1.06); opacity: 0.9; }
                }
                @keyframes flotar-marco {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-2px); }
                }
                @keyframes pulso-anillo {
                    0%   { transform: scale(0.95); opacity: 0.45; }
                    100% { transform: scale(1.55); opacity: 0; }
                }
            `}</style>

            <div
                onDragEnter={(e) => {
                    e.preventDefault()
                    dragCounterRef.current++
                    setIsDragging(true)
                }}
                onDragLeave={() => {
                    dragCounterRef.current--
                    if (dragCounterRef.current === 0) setIsDragging(false)
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault()
                    dragCounterRef.current = 0
                    setIsDragging(false)
                    const file = e.dataTransfer?.files?.[0]
                    if (file) handleFile(file)
                }}
                onClick={() => !disabled && fileRef.current?.click()}
                onMouseEnter={() => !disabled && setHover(true)}
                onMouseLeave={() => setHover(false)}
                role="button"
                tabIndex={0}
                aria-label="Subir radiografía: arrastra una imagen o haz click para seleccionar"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
                style={{
                    width: '100%',
                    margin: '0 auto',
                    padding: 48,
                    border: `2px dashed ${activo ? 'var(--accent)' : 'var(--border-h)'}`,
                    borderRadius: 20,
                    background: isDragging
                        ? 'var(--accent-glow)'
                        : hover
                            ? 'var(--bg-3)'
                            : 'var(--bg-2)',
                    cursor: disabled ? 'default' : 'pointer',
                    transition: 'all var(--ts)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    opacity: disabled ? 0.5 : 1,
                    position: 'relative',
                    boxShadow: activo ? '0 0 0 6px var(--accent-glow)' : 'none',
                }}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFile(f)
                        e.target.value = ''
                    }}
                />

                {/* Icono de radiografía con anillo pulsante en hover/drag */}
                <div style={{
                    position: 'relative',
                    width: 72,
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {/* Anillos pulsantes en hover/drag */}
                    {activo && (
                        <>
                            <span
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 18,
                                    border: '2px solid var(--accent)',
                                    animation: 'pulso-anillo 1.6s ease-out infinite',
                                    pointerEvents: 'none',
                                }}
                            />
                            <span
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 18,
                                    border: '2px solid var(--accent)',
                                    animation: 'pulso-anillo 1.6s ease-out 0.55s infinite',
                                    pointerEvents: 'none',
                                }}
                            />
                        </>
                    )}
                    <div style={{
                        width: 72, height: 72, borderRadius: 18,
                        background: activo ? 'var(--accent-glow)' : 'var(--bg-3)',
                        border: `1px solid ${activo ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all var(--ts)',
                        animation: activo ? 'pulso-icono 1.8s ease-in-out infinite' : 'flotar-marco 3.2s ease-in-out infinite',
                    }}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--accent)' }}>
                            {/* Pulmones estilizados */}
                            <path d="M16 6V18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            <path
                                d="M10 9C7.5 11 6 14 6 17.5C6 21 7 24 9 25C10.5 25.8 12 25 12.5 23.5L13.5 20"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            <path
                                d="M22 9C24.5 11 26 14 26 17.5C26 21 25 24 23 25C21.5 25.8 20 25 19.5 23.5L18.5 20"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                            {/* Flecha de subida superpuesta */}
                            <circle cx="24" cy="8" r="4.5" fill="var(--bg-2)" stroke="currentColor" strokeWidth="1.4" />
                            <path d="M24 6V10M22 8L24 6L26 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t0)', marginBottom: 6, letterSpacing: '-0.01em' }}>
                        {isDragging ? 'Suelta la imagen aquí' : 'Sube una radiografía de tórax'}
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--t1)', lineHeight: 1.65, maxWidth: 380, margin: '0 auto' }}>
                        Arrastra una imagen o haz click para seleccionarla. El modelo identificará patrones torácicos en pocos segundos.
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)', marginTop: 10, letterSpacing: '0.05em' }}>
                        PNG · JPG &nbsp;·&nbsp; máx. ~20 MB &nbsp;·&nbsp; DICOM próximamente
                    </div>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 22px', borderRadius: 10,
                    background: activo ? 'var(--accent-h)' : 'var(--accent)',
                    color: '#fff',
                    fontSize: 14, fontWeight: 600,
                    boxShadow: 'var(--shadow-accent)',
                    transition: 'background var(--ts), transform var(--ts)',
                    transform: activo ? 'scale(1.02)' : 'scale(1)',
                }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M8 11V3M5 6L8 3L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Seleccionar archivo
                </div>
            </div>
        </>
    )
}
