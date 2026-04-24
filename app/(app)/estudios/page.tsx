'use client'

// Historial de estudios agrupado por paciente.
// Cada estudio muestra un badge de severidad coloreado.

import { HeaderApp } from '@/components/layout/header-app'
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
                            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            marginBottom: 8, padding: '8px 12px', borderRadius: 8,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                        }}>
                            Sin paciente asignado ({sinPaciente.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                            {sinPaciente.map(renderEstudio)}
                        </div>
                    </div>
                )}

                {totalEstudios === 0 && (
                    <div style={{
                        textAlign: 'center', padding: '48px 24px',
                        color: 'var(--t2)', fontSize: 13,
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>🫁</div>
                        Sin estudios aún. Analiza una radiografía para comenzar.
                    </div>
                )}
            </div>
        </>
    )
}