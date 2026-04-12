'use client'

// Lista de estudios del historial del usuario.
// Muestra tarjetas resumidas con: miniatura, fecha, severidad, probabilidad.

import type { Estudio } from '@/lib/tipos'
import { formatearFechaHora } from '@/lib/utils/fechas'

interface ListaEstudiosProps {
    readonly estudios: readonly Estudio[]
    readonly onSeleccionar: (id: string) => void
}

const COLORES_SEVERIDAD: Record<string, string> = {
    baja: 'var(--ok)',
    media: 'var(--warn)',
    alta: 'var(--err)',
}

export function ListaEstudios({ estudios, onSeleccionar }: ListaEstudiosProps) {
    if (estudios.length === 0) {
        return (
            <div style={{
                textAlign: 'center', padding: '48px 24px',
                color: 'var(--t2)', fontSize: 13,
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                Sin estudios todavía. Sube una radiografía para comenzar.
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {estudios.map(estudio => {
                const color = COLORES_SEVERIDAD[estudio.informe.severidad] ?? 'var(--t1)'
                return (
                    <button
                        key={estudio.id}
                        onClick={() => onSeleccionar(estudio.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '12px 16px', borderRadius: 12,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                            transition: 'all var(--ta)',
                        }}
                    >
                        {/* Miniatura */}
                        <img src={estudio.imagenDataUrl} alt="Radiografía" style={{
                            width: 48, height: 48, objectFit: 'cover',
                            borderRadius: 8, flexShrink: 0, border: '1px solid var(--border-h)',
                        }} />

                        {/* Datos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t0)', marginBottom: 3 }}>
                                {estudio.nombreArchivo}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '0.03em' }}>
                                {formatearFechaHora(estudio.creadoEn)}
                            </div>
                        </div>

                        {/* Probabilidad + severidad */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color }}>
                                {estudio.informe.porcentajeCarcinoma}%
                            </div>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 9, color,
                                letterSpacing: '0.05em', textTransform: 'uppercase',
                            }}>
                                {estudio.informe.severidad}
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
