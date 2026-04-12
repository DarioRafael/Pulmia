'use client'

// Ficha detallada de un paciente con todos sus estudios.

import { useParams, useRouter } from 'next/navigation'
import { HeaderApp } from '@/components/layout/header-app'
import { FichaPaciente, usePacientes } from '@/features/pacientes'
import { useEstudios } from '@/features/estudios'

export default function PacienteDetallePage() {
    const params = useParams()
    const router = useRouter()
    const { obtener, eliminar } = usePacientes()
    const { estudios } = useEstudios()
    const id = typeof params.id === 'string' ? params.id : ''
    const paciente = obtener(id)

    if (!paciente) {
        return (
            <>
                <HeaderApp titulo="Paciente no encontrado" />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: 'var(--t2)' }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>👤</div>
                        <div style={{ fontSize: 14 }}>Este paciente no existe o fue eliminado.</div>
                        <button
                            onClick={() => router.push('/pacientes')}
                            style={{
                                marginTop: 16, padding: '8px 20px', borderRadius: 8,
                                background: 'var(--accent)', color: '#fff', border: 'none',
                                fontSize: 13, cursor: 'pointer',
                            }}
                        >
                            Ver pacientes
                        </button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <HeaderApp
                titulo={paciente.nombre}
                subtitulo="Ficha del paciente"
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <FichaPaciente
                    paciente={paciente}
                    estudios={estudios}
                    onVerEstudio={(estudioId) => router.push(`/estudios/${estudioId}`)}
                    onEditar={() => router.push(`/pacientes/${id}/editar`)}
                    onEliminar={() => {
                        if (confirm(`¿Eliminar al paciente "${paciente.nombre}"? Los estudios no se eliminarán.`)) {
                            eliminar(id)
                            router.push('/pacientes')
                        }
                    }}
                />
            </div>
        </>
    )
}
