'use client'

// Historial de estudios agrupado por paciente.
// Cada estudio muestra un badge de severidad coloreado.

import { HeaderApp } from '@/components/layout/header-app'
import { MedicalDisclaimer } from '@/components/medical/medical-disclaimer'
import { useEstudios } from '@/features/estudios'
import { usePacientes } from '@/features/pacientes'
import { usePlan } from '@/components/plan'
import { UpgradePrompt } from '@/components/plan'
import { useRouter } from 'next/navigation'
import { formatearFecha } from '@/lib/utils/fechas'
import type { Estudio } from '@/lib/tipos'

const SEVERIDAD_COLOR: Record<string, string> = {
    baja:  'var(--ok)',
    media: 'var(--warn)',
    alta:  'var(--err)',
}

const SEVERIDAD_BG: Record<string, string> = {
    baja:  'var(--ok-bg)',
    media: 'var(--warn-bg)',
    alta:  'var(--err-bg)',
}

export default function EstudiosPage() {
    const { estudios, totalEstudios } = useEstudios()
    const { pacientes } = usePacientes()
    const { can, limites } = usePlan()
    const router = useRouter()

    const tieneHistorialLimitado = !can('historial_ilimitado') && totalEstudios > estudios.length

    // Estadísticas
    const totalAlta  = estudios.filter((e: Estudio) => e.informe.severidad === 'alta').length
    const totalMedia = estudios.filter((e: Estudio) => e.informe.severidad === 'media').length
    const totalBaja  = estudios.filter((e: Estudio) => e.informe.severidad === 'baja').length

    // Agrupar por paciente
    const sinPaciente = estudios.filter((e: Estudio) => !e.pacienteId)
    const porPaciente = pacientes.map(p => ({
        paciente: p,
        estudios: estudios.filter((e: Estudio) => e.pacienteId === p.id),
    })).filter(g => g.estudios.length > 0)

    const renderEstudio = (e: Estudio) => {
        const color = SEVERIDAD_COLOR[e.informe.severidad] ?? 'var(--t1)'
        const bg    = SEVERIDAD_BG[e.informe.severidad]   ?? 'transparent'
        return (
            <button
                key={e.id}
                onClick={() => router.push(`/estudios/${e.id}`)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10, width: '100%',
                    background: 'var(--bg-1)', border: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.12s ease, background 0.12s ease',
                }}
                onMouseEnter={ev => {
                    ev.currentTarget.style.background  = 'var(--bg-2)'
                    ev.currentTarget.style.borderColor = 'var(--border-h)'
                }}
                onMouseLeave={ev => {
                    ev.currentTarget.style.background  = 'var(--bg-1)'
                    ev.currentTarget.style.borderColor = 'var(--border)'
                }}
            >
                <img
                    src={e.imagenDataUrl}
                    alt=""
                    style={{
                        width: 36, height: 36, objectFit: 'cover',
                        borderRadius: 6, flexShrink: 0,
                        border: '1px solid var(--border-h)',
                    }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 13, fontWeight: 500, color: 'var(--t0)',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {e.nombreArchivo}
                    </div>
                    <div style={{
                        fontFamily: 'var(--mono)', fontSize: 10,
                        color: 'var(--t2)', marginTop: 2,
                    }}>
                        {formatearFecha(e.creadoEn)}
                    </div>
                </div>

                {/* Badge severidad */}
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-end', gap: 4, flexShrink: 0,
                }}>
                    <span style={{
                        fontSize: 15, fontWeight: 700, color,
                        letterSpacing: '-0.02em',
                    }}>
                        {e.informe.porcentajeCarcinoma}%
                    </span>
                    <span style={{
                        fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500,
                        color, background: bg,
                        padding: '2px 7px', borderRadius: 4,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        border: `1px solid ${color}33`,
                    }}>
                        {e.informe.severidad}
                    </span>
                </div>
            </button>
        )
    }

    return (
        <>
            <HeaderApp
                titulo="Estudios"
                subtitulo={`${totalEstudios} estudio${totalEstudios === 1 ? '' : 's'} en total`}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                {tieneHistorialLimitado && (
                    <div style={{ marginBottom: 16 }}>
                        <UpgradePrompt
                            feature="historial_ilimitado"
                            mensaje={`Mostrando los últimos ${limites.estudiosEnHistorial} estudios. Actualiza para ver todo el historial.`}
                        />
                    </div>
                )}

                {/* ── Estadísticas ── */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    {[
                        { valor: totalEstudios, etiqueta: 'Total',           color: 'var(--accent)' },
                        { valor: totalAlta,     etiqueta: 'Severidad alta',  color: 'var(--err)'    },
                        { valor: totalMedia,    etiqueta: 'Severidad media', color: 'var(--warn)'   },
                        { valor: totalBaja,     etiqueta: 'Severidad baja',  color: 'var(--ok)'     },
                    ].map(({ valor, etiqueta, color }) => (
                        <div key={etiqueta} style={{
                            flex: 1, minWidth: 120, padding: '16px', borderRadius: 12,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color }}>{valor}</div>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 9,
                                color: 'var(--t2)', textTransform: 'uppercase',
                            }}>
                                {etiqueta}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Por paciente ── */}
                {porPaciente.map(({ paciente, estudios: estudiosPac }) => (
                    <div key={paciente.id} style={{ marginBottom: 20 }}>
                        <div
                            onClick={() => router.push(`/pacientes/${paciente.id}`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                marginBottom: 8, cursor: 'pointer',
                                padding: '8px 12px', borderRadius: 8,
                                background: 'var(--bg-2)', border: '1px solid var(--border)',
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--accent-glow)',
                                border: '1px solid var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 600, color: 'var(--accent)',
                            }}>
                                {paciente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)' }}>
                                    {paciente.nombre}
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)' }}>
                                    {estudiosPac.length} estudio{estudiosPac.length === 1 ? '' : 's'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                            {estudiosPac.map(renderEstudio)}
                        </div>
                    </div>
                ))}

                {/* ── Sin paciente ── */}
                {sinPaciente.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            marginBottom: 8, padding: '10px 14px', borderRadius: 8,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                                    letterSpacing: '0.06em', textTransform: 'uppercase',
                                }}>
                                    Sin paciente asignado ({sinPaciente.length})
                                </span>
                            </div>
                            <button
                                onClick={() => router.push('/pacientes')}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    padding: '5px 10px', borderRadius: 6,
                                    background: 'transparent',
                                    border: '1px solid var(--accent)',
                                    color: 'var(--accent)',
                                    fontSize: 11, fontWeight: 500, cursor: 'pointer',
                                    fontFamily: 'var(--mono)',
                                    letterSpacing: '0.03em',
                                }}
                            >
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                                    <path d="M3 14C3 11.2 5.2 9 8 9C10.8 9 13 11.2 13 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <line x1="12" y1="3.5" x2="14" y2="3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                    <line x1="13" y1="2.5" x2="13" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                                Asignar paciente
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                            {sinPaciente.map(renderEstudio)}
                        </div>
                    </div>
                )}

                {totalEstudios === 0 && (
                    <div style={{
                        maxWidth: 460, margin: '32px auto',
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
                                <path d="M14 5V17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M9 8C7 9.5 6 12 6 15C6 18 7 20.5 8.5 21.3C9.5 22 10.5 21.3 11 20L11.8 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                <path d="M19 8C21 9.5 22 12 22 15C22 18 21 20.5 19.5 21.3C18.5 22 17.5 21.3 17 20L16.2 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            </svg>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t0)', marginBottom: 6, letterSpacing: '-0.01em' }}>
                            Sin estudios registrados
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.65, marginBottom: 18 }}>
                            Analiza una radiografía de tórax y guarda el estudio para verlo aquí.
                            Los estudios se agrupan por paciente automáticamente.
                        </p>
                        <button
                            onClick={() => router.push('/analizar')}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '10px 22px', borderRadius: 10,
                                background: 'var(--accent)', color: '#fff', border: 'none',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                boxShadow: 'var(--shadow-accent)',
                            }}
                        >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                                <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <circle cx="8" cy="7" r="2" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M5 12L7 9L9 10L11 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                            </svg>
                            Analizar primera radiografía
                        </button>
                    </div>
                )}

                {/* Disclaimer compact al final del listado */}
                {totalEstudios > 0 && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', marginTop: 24,
                    }}>
                        <MedicalDisclaimer variante="compact" />
                    </div>
                )}
            </div>
        </>
    )
}