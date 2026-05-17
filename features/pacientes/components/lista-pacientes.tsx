'use client'

// Lista de pacientes con tarjetas resumidas.
// Muestra nombre, fecha de registro, último estudio con su severidad y
// cantidad total de estudios asociados.

import type { Paciente, Estudio } from '@/lib/tipos'
import { formatearFecha } from '@/lib/utils/fechas'

interface ListaPacientesProps {
    readonly pacientes: readonly Paciente[]
    readonly estudios: readonly Estudio[]
    readonly onSeleccionar: (id: string) => void
}

const SEVERIDAD_COLOR: Record<string, string> = {
    baja: 'var(--ok)',
    media: 'var(--warn)',
    alta: 'var(--err)',
}

const SEVERIDAD_BG: Record<string, string> = {
    baja: 'var(--ok-bg)',
    media: 'var(--warn-bg)',
    alta: 'var(--err-bg)',
}

export function ListaPacientes({ pacientes, estudios, onSeleccionar }: ListaPacientesProps) {
    if (pacientes.length === 0) {
        return (
            <div style={{
                maxWidth: 460, margin: '24px auto',
                textAlign: 'center', padding: '40px 28px',
                borderRadius: 16,
                background: 'var(--bg-2)',
                border: '1px dashed var(--border-h)',
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 18px',
                    color: 'var(--accent)',
                }}>
                    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                        <circle cx="14" cy="10" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M5 24C5 19.5 9 16 14 16C19 16 23 19.5 23 24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t0)', marginBottom: 6, letterSpacing: '-0.01em' }}>
                    Sin pacientes registrados
                </div>
                <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.65, marginBottom: 8 }}>
                    Usa <strong style={{ color: 'var(--t0)' }}>“Nuevo paciente”</strong> arriba para crearlos
                    manualmente, o se crearán automáticamente al guardar un estudio asociado.
                </p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pacientes.map(paciente => {
                const estudiosPaciente = estudios.filter(e => e.pacienteId === paciente.id)
                const ultimoEstudio = estudiosPaciente[0]
                const sev = ultimoEstudio?.informe.severidad
                const sevColor = sev ? SEVERIDAD_COLOR[sev] : undefined
                const sevBg = sev ? SEVERIDAD_BG[sev] : undefined

                return (
                    <button
                        key={paciente.id}
                        onClick={() => onSeleccionar(paciente.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px', borderRadius: 12,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                            transition: 'all var(--ta)',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--border-h)'
                            e.currentTarget.style.background = 'var(--bg-3)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border)'
                            e.currentTarget.style.background = 'var(--bg-2)'
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: 16, fontWeight: 600, color: 'var(--accent)',
                            fontFamily: 'var(--mono)',
                        }}>
                            {paciente.nombre.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: 14, fontWeight: 600, color: 'var(--t0)',
                                marginBottom: 3, letterSpacing: '-0.005em',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {paciente.nombre}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '0.03em' }}>
                                Registrado: {formatearFecha(paciente.creadoEn)}
                                {paciente.fechaNacimiento && ` · Nac: ${formatearFecha(paciente.fechaNacimiento)}`}
                            </div>
                            {/* Preview del último estudio */}
                            {ultimoEstudio && sev && sevColor && sevBg && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    marginTop: 6,
                                }}>
                                    <span style={{
                                        fontFamily: 'var(--mono)', fontSize: 9,
                                        color: 'var(--t2)', letterSpacing: '0.05em', textTransform: 'uppercase',
                                    }}>
                                        Último:
                                    </span>
                                    <span style={{
                                        fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                                        color: sevColor, background: sevBg,
                                        padding: '1px 7px', borderRadius: 4,
                                        border: `1px solid ${sevColor}33`,
                                        letterSpacing: '0.04em',
                                    }}>
                                        {ultimoEstudio.informe.porcentajeCarcinoma}% · {sev}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--t2)' }}>
                                        {formatearFecha(ultimoEstudio.creadoEn)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Contador de estudios */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, fontFamily: 'var(--mono)' }}>
                                {estudiosPaciente.length}
                            </div>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                                letterSpacing: '0.05em', textTransform: 'uppercase',
                                marginTop: 3,
                            }}>
                                {estudiosPaciente.length === 1 ? 'estudio' : 'estudios'}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
