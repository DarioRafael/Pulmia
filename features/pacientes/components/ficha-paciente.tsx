'use client'

// Ficha detallada de un paciente.
// Muestra info del paciente + lista de sus estudios asociados.

import type { Paciente, Estudio } from '@/lib/tipos'
import { formatearFecha, formatearFechaHora } from '@/lib/utils/fechas'

interface FichaPacienteProps {
    readonly paciente: Paciente
    readonly estudios: readonly Estudio[]
    readonly onVerEstudio: (id: string) => void
    readonly onEditar: () => void
    readonly onEliminar: () => void
}

const COLORES_SEVERIDAD: Record<string, string> = {
    baja: 'var(--ok)',
    media: 'var(--warn)',
    alta: 'var(--err)',
}

export function FichaPaciente({ paciente, estudios, onVerEstudio, onEditar, onEliminar }: FichaPacienteProps) {
    const estudiosPaciente = estudios.filter(e => e.pacienteId === paciente.id)

    return (
        <div style={{
            maxWidth: 680, width: '100%', margin: '0 auto',
            display: 'flex', flexDirection: 'column', gap: 20,
        }}>
            {/* Header del paciente */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '20px', borderRadius: 14,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
            }}>
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--accent-glow)', border: '2px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, fontWeight: 700, color: 'var(--accent)',
                }}>
                    {paciente.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t0)' }}>
                        {paciente.nombre}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>
                        Registrado: {formatearFecha(paciente.creadoEn)}
                        {paciente.fechaNacimiento && ` · Nac: ${formatearFecha(paciente.fechaNacimiento)}`}
                    </div>
                    {paciente.notas && (
                        <div style={{ fontSize: 12, color: 'var(--t1)', marginTop: 6 }}>
                            {paciente.notas}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={onEditar}
                        style={{
                            padding: '6px 14px', borderRadius: 8,
                            background: 'var(--bg-3)', color: 'var(--t1)',
                            border: '1px solid var(--border)', fontSize: 12,
                            cursor: 'pointer',
                        }}
                    >
                        Editar
                    </button>
                    <button
                        onClick={onEliminar}
                        style={{
                            padding: '6px 14px', borderRadius: 8,
                            background: 'transparent', color: 'var(--err)',
                            border: '1px solid var(--err)', fontSize: 12,
                            cursor: 'pointer', opacity: 0.7,
                        }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                    flex: 1, padding: '14px 16px', borderRadius: 12,
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                        {estudiosPaciente.length}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Estudios
                    </div>
                </div>
                {estudiosPaciente.length > 0 && (
                    <div style={{
                        flex: 1, padding: '14px 16px', borderRadius: 12,
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontSize: 22, fontWeight: 700,
                            color: COLORES_SEVERIDAD[estudiosPaciente[0].informe.severidad] ?? 'var(--t1)',
                        }}>
                            {estudiosPaciente[0].informe.porcentajeCarcinoma}%
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Último resultado
                        </div>
                    </div>
                )}
            </div>

            {/* Lista de estudios del paciente */}
            <div>
                <div style={{
                    fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
                }}>
                    Radiografías del paciente
                </div>

                {estudiosPaciente.length === 0 ? (
                    <div style={{
                        padding: '32px', textAlign: 'center', color: 'var(--t2)',
                        fontSize: 13, borderRadius: 12, background: 'var(--bg-2)',
                        border: '1px solid var(--border)',
                    }}>
                        Este paciente no tiene estudios aún. Ve a Analizar para subir una radiografía.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {estudiosPaciente.map(estudio => {
                            const color = COLORES_SEVERIDAD[estudio.informe.severidad] ?? 'var(--t1)'
                            return (
                                <button
                                    key={estudio.id}
                                    onClick={() => onVerEstudio(estudio.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px', borderRadius: 10,
                                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                                        cursor: 'pointer', textAlign: 'left', width: '100%',
                                        transition: 'all var(--ta)',
                                    }}
                                >
                                    <img src={estudio.imagenDataUrl} alt="RX" style={{
                                        width: 40, height: 40, objectFit: 'cover',
                                        borderRadius: 6, flexShrink: 0, border: '1px solid var(--border-h)',
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t0)' }}>
                                            {estudio.nombreArchivo}
                                        </div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)' }}>
                                            {formatearFechaHora(estudio.creadoEn)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color }}>{estudio.informe.porcentajeCarcinoma}%</div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color, textTransform: 'uppercase' }}>
                                            {estudio.informe.severidad}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
