'use client'

// Selector de contexto para el chat clínico.
// Permite al usuario escoger un paciente y/o estudio para que el chat
// tenga datos concretos al responder preguntas.

import { useState } from 'react'
import type { Paciente, Estudio } from '@/lib/tipos'

interface SelectorContextoProps {
    readonly pacientes: readonly Paciente[]
    readonly estudios: readonly Estudio[]
    readonly pacienteId: string | null
    readonly estudioId: string | null
    readonly onCambio: (pacienteId: string | null, estudioId: string | null) => void
}

export function SelectorContexto({
    pacientes, estudios, pacienteId, estudioId, onCambio,
}: SelectorContextoProps) {
    const [abierto, setAbierto] = useState(false)

    const pacienteActual = pacientes.find(p => p.id === pacienteId)
    const estudioActual = estudios.find(e => e.id === estudioId)

    // Estudios filtrados por paciente si hay uno seleccionado.
    const estudiosFiltrados = pacienteId
        ? estudios.filter(e => e.pacienteId === pacienteId)
        : estudios

    const tieneContexto = pacienteId || estudioId

    return (
        <div style={{ position: 'relative' }}>
            {/* Botón para abrir el selector */}
            <button
                onClick={() => setAbierto(!abierto)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 6,
                    background: tieneContexto ? 'var(--accent-glow)' : 'var(--bg-3)',
                    border: `1px solid ${tieneContexto ? 'var(--accent)' : 'var(--border)'}`,
                    color: tieneContexto ? 'var(--accent)' : 'var(--t2)',
                    fontSize: 11, cursor: 'pointer', transition: 'all var(--ta)',
                    fontFamily: 'var(--mono)', letterSpacing: '0.03em',
                }}
            >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M2 11C2 8.5 3.8 7 6 7C8.2 7 10 8.5 10 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                {tieneContexto ? (
                    <span>
                        {pacienteActual ? pacienteActual.nombre : ''}
                        {pacienteActual && estudioActual ? ' · ' : ''}
                        {estudioActual ? `${estudioActual.informe.porcentajeCarcinoma}%` : ''}
                    </span>
                ) : (
                    'Contexto'
                )}
                {tieneContexto && (
                    <span
                        onClick={(e) => { e.stopPropagation(); onCambio(null, null); setAbierto(false) }}
                        style={{ marginLeft: 2, cursor: 'pointer', opacity: 0.7 }}
                    >
                        ×
                    </span>
                )}
            </button>

            {/* Dropdown del selector */}
            {abierto && (
                <div style={{
                    position: 'absolute', bottom: '100%', left: 0, right: 0,
                    minWidth: 280, maxHeight: 320, overflowY: 'auto',
                    marginBottom: 6, borderRadius: 10,
                    background: 'var(--bg-1)', border: '1px solid var(--border-h)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 10, padding: '8px',
                }}>
                    {/* Pacientes */}
                    <div style={{
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        padding: '4px 8px', marginBottom: 4,
                    }}>
                        Paciente
                    </div>
                    <button
                        onClick={() => { onCambio(null, estudioId); }}
                        style={{
                            width: '100%', padding: '6px 8px', borderRadius: 6,
                            background: !pacienteId ? 'var(--accent-glow)' : 'transparent',
                            border: 'none', color: 'var(--t1)', fontSize: 11,
                            cursor: 'pointer', textAlign: 'left',
                        }}
                    >
                        — Todos —
                    </button>
                    {pacientes.map(p => (
                        <button
                            key={p.id}
                            onClick={() => {
                                onCambio(p.id, null)
                            }}
                            style={{
                                width: '100%', padding: '6px 8px', borderRadius: 6,
                                background: pacienteId === p.id ? 'var(--accent-glow)' : 'transparent',
                                border: 'none', color: pacienteId === p.id ? 'var(--accent)' : 'var(--t0)',
                                fontSize: 11, cursor: 'pointer', textAlign: 'left',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}
                        >
                            <span style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: 'var(--bg-3)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 600,
                            }}>
                                {p.nombre.charAt(0).toUpperCase()}
                            </span>
                            {p.nombre}
                        </button>
                    ))}

                    {/* Estudios */}
                    {estudiosFiltrados.length > 0 && (
                        <>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                padding: '8px 8px 4px', marginTop: 4,
                                borderTop: '1px solid var(--border)',
                            }}>
                                Estudio
                            </div>
                            <button
                                onClick={() => { onCambio(pacienteId, null) }}
                                style={{
                                    width: '100%', padding: '6px 8px', borderRadius: 6,
                                    background: !estudioId ? 'var(--accent-glow)' : 'transparent',
                                    border: 'none', color: 'var(--t1)', fontSize: 11,
                                    cursor: 'pointer', textAlign: 'left',
                                }}
                            >
                                — Ninguno —
                            </button>
                            {estudiosFiltrados.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => { onCambio(pacienteId, e.id); setAbierto(false) }}
                                    style={{
                                        width: '100%', padding: '6px 8px', borderRadius: 6,
                                        background: estudioId === e.id ? 'var(--accent-glow)' : 'transparent',
                                        border: 'none', color: estudioId === e.id ? 'var(--accent)' : 'var(--t0)',
                                        fontSize: 11, cursor: 'pointer', textAlign: 'left',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}
                                >
                                    <img src={e.imagenDataUrl} alt="" style={{
                                        width: 20, height: 20, objectFit: 'cover', borderRadius: 3,
                                    }} />
                                    <span style={{ flex: 1 }}>{e.nombreArchivo}</span>
                                    <span style={{
                                        fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                                    }}>
                                        {e.informe.porcentajeCarcinoma}%
                                    </span>
                                </button>
                            ))}
                        </>
                    )}

                    {pacientes.length === 0 && estudios.length === 0 && (
                        <div style={{ padding: '12px 8px', fontSize: 11, color: 'var(--t2)', textAlign: 'center' }}>
                            Sin pacientes ni estudios. Analiza una radiografía primero.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
