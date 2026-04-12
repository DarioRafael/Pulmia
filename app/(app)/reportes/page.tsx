'use client'

// Página de reportes: vista consolidada de estudios por paciente.
// Permite ver un resumen general de todos los estudios agrupados por paciente.

import { HeaderApp } from '@/components/layout/header-app'
import { useEstudios } from '@/features/estudios'
import { usePacientes } from '@/features/pacientes'
import { useRouter } from 'next/navigation'
import { formatearFecha } from '@/lib/utils/fechas'
import type { Estudio } from '@/lib/tipos'

const COLORES_SEVERIDAD: Record<string, string> = {
    baja: 'var(--ok)',
    media: 'var(--warn)',
    alta: 'var(--err)',
}

export default function ReportesPage() {
    const { estudios, totalEstudios } = useEstudios()
    const { pacientes } = usePacientes()
    const router = useRouter()

    // Agrupar estudios por paciente.
    const sinPaciente = estudios.filter((e: Estudio) => !e.pacienteId)
    const porPaciente = pacientes.map(p => ({
        paciente: p,
        estudios: estudios.filter((e: Estudio) => e.pacienteId === p.id),
    })).filter(g => g.estudios.length > 0)

    // Estadísticas generales.
    const totalAlta = estudios.filter((e: Estudio) => e.informe.severidad === 'alta').length
    const totalMedia = estudios.filter((e: Estudio) => e.informe.severidad === 'media').length
    const totalBaja = estudios.filter((e: Estudio) => e.informe.severidad === 'baja').length

    return (
        <>
            <HeaderApp
                titulo="Reportes"
                subtitulo={`${totalEstudios} estudio${totalEstudios === 1 ? '' : 's'} analizados`}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {/* Estadísticas */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <div style={{
                        flex: 1, minWidth: 120, padding: '16px', borderRadius: 12,
                        background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{totalEstudios}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Total</div>
                    </div>
                    <div style={{
                        flex: 1, minWidth: 120, padding: '16px', borderRadius: 12,
                        background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--err)' }}>{totalAlta}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Severidad alta</div>
                    </div>
                    <div style={{
                        flex: 1, minWidth: 120, padding: '16px', borderRadius: 12,
                        background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warn)' }}>{totalMedia}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Severidad media</div>
                    </div>
                    <div style={{
                        flex: 1, minWidth: 120, padding: '16px', borderRadius: 12,
                        background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ok)' }}>{totalBaja}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase' }}>Severidad baja</div>
                    </div>
                </div>

                {/* Estudios por paciente */}
                {porPaciente.map(({ paciente, estudios: estudiosPac }) => (
                    <div key={paciente.id} style={{ marginBottom: 20 }}>
                        <div
                            onClick={() => router.push(`/pacientes/${paciente.id}`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                                cursor: 'pointer', padding: '8px 12px', borderRadius: 8,
                                background: 'var(--bg-2)', border: '1px solid var(--border)',
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 600,
                            }}>
                                {paciente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)' }}>{paciente.nombre}</div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)' }}>
                                    {estudiosPac.length} estudio{estudiosPac.length === 1 ? '' : 's'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                            {estudiosPac.map((e: Estudio) => {
                                const color = COLORES_SEVERIDAD[e.informe.severidad] ?? 'var(--t1)'
                                return (
                                    <button
                                        key={e.id}
                                        onClick={() => router.push(`/estudios/${e.id}`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 12px', borderRadius: 8, width: '100%',
                                            background: 'var(--bg-1)', border: '1px solid var(--border)',
                                            cursor: 'pointer', textAlign: 'left',
                                        }}
                                    >
                                        <img src={e.imagenDataUrl} alt="" style={{
                                            width: 32, height: 32, objectFit: 'cover', borderRadius: 4,
                                        }} />
                                        <div style={{ flex: 1, fontSize: 12, color: 'var(--t0)' }}>
                                            {e.nombreArchivo}
                                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)' }}>
                                                {formatearFecha(e.creadoEn)}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 700, color }}>{e.informe.porcentajeCarcinoma}%</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {/* Estudios sin paciente */}
                {sinPaciente.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{
                            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
                            padding: '8px 12px', borderRadius: 8,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                        }}>
                            Sin paciente asignado ({sinPaciente.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16 }}>
                            {sinPaciente.map((e: Estudio) => {
                                const color = COLORES_SEVERIDAD[e.informe.severidad] ?? 'var(--t1)'
                                return (
                                    <button
                                        key={e.id}
                                        onClick={() => router.push(`/estudios/${e.id}`)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 12px', borderRadius: 8, width: '100%',
                                            background: 'var(--bg-1)', border: '1px solid var(--border)',
                                            cursor: 'pointer', textAlign: 'left',
                                        }}
                                    >
                                        <img src={e.imagenDataUrl} alt="" style={{
                                            width: 32, height: 32, objectFit: 'cover', borderRadius: 4,
                                        }} />
                                        <div style={{ flex: 1, fontSize: 12, color: 'var(--t0)' }}>
                                            {e.nombreArchivo}
                                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)' }}>
                                                {formatearFecha(e.creadoEn)}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 14, fontWeight: 700, color }}>{e.informe.porcentajeCarcinoma}%</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {totalEstudios === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--t2)', fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                        Sin estudios para reportar. Analiza una radiografía para comenzar.
                    </div>
                )}
            </div>
        </>
    )
}
