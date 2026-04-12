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
    const fileRef = useRef<HTMLInputElement>(null)
    const dragCounterRef = useRef(0)

    function handleFile(file: File) {
        if (file.type.startsWith('image/')) {
            onArchivo(file)
        }
    }

    return (
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
            style={{
                width: '100%',
                maxWidth: 520,
                margin: '0 auto',
                padding: 48,
                border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-h)'}`,
                borderRadius: 20,
                background: isDragging ? 'var(--accent-glow)' : 'var(--bg-2)',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'all var(--ts)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                    e.target.value = ''
                }}
            />

            {/* Icono de radiografía */}
            <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: 'var(--accent)' }}>
                    <rect x="4" y="4" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="14" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 20L11 16L14 18L17 14L20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t0)', marginBottom: 6 }}>
                    Subir radiografía
                </div>
                <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.6 }}>
                    Arrastra una imagen aquí o haz click para seleccionar.
                    <br />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)' }}>
                        PNG, JPG, DICOM (próximamente)
                    </span>
                </div>
            </div>

            <div style={{
                padding: '8px 20px', borderRadius: 10,
                background: 'var(--accent)', color: '#fff',
                fontSize: 13, fontWeight: 500,
                boxShadow: 'var(--shadow-accent)',
            }}>
                Seleccionar archivo
            </div>
        </div>
    )
}
