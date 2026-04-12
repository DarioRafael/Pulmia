'use client'

// Lista de pacientes con tarjetas resumidas.
// Muestra nombre, fecha de creación y cantidad de estudios asociados.

import type { Paciente, Estudio } from '@/lib/tipos'
import { formatearFecha } from '@/lib/utils/fechas'

interface ListaPacientesProps {
    readonly pacientes: readonly Paciente[]
    readonly estudios: readonly Estudio[]
    readonly onSeleccionar: (id: string) => void
}

export function ListaPacientes({ pacientes, estudios, onSeleccionar }: ListaPacientesProps) {
    if (pacientes.length === 0) {
        return (
            <div style={{
                textAlign: 'center', padding: '48px 24px',
                color: 'var(--t2)', fontSize: 13,
            }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
                Sin pacientes registrados. Se crean al guardar un estudio.
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pacientes.map(paciente => {
                const estudiosPaciente = estudios.filter(e => e.pacienteId === paciente.id)
                const ultimoEstudio = estudiosPaciente[0]

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
                    >
                        {/* Avatar */}
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: 18,
                        }}>
                            {paciente.nombre.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t0)', marginBottom: 3 }}>
                                {paciente.nombre}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '0.03em' }}>
                                Registrado: {formatearFecha(paciente.creadoEn)}
                                {paciente.fechaNacimiento && ` · Nac: ${formatearFecha(paciente.fechaNacimiento)}`}
                            </div>
                        </div>

                        {/* Contador de estudios */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                                {estudiosPaciente.length}
                            </div>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                                letterSpacing: '0.05em', textTransform: 'uppercase',
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
