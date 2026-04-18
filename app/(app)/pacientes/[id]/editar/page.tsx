'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { HeaderApp } from '@/components/layout/header-app'
import { usePacientes } from '@/features/pacientes'

export default function EditarPacientePage() {
    const params = useParams()
    const router = useRouter()
    const { obtener, actualizar } = usePacientes()
    const id = typeof params.id === 'string' ? params.id : ''
    const paciente = obtener(id)

    const [nombre, setNombre] = useState(paciente?.nombre ?? '')
    const [fechaNac, setFechaNac] = useState(paciente?.fechaNacimiento ?? '')
    const [notas, setNotas] = useState(paciente?.notas ?? '')

    // Solo sincroniza si el paciente carga después del montaje (hidratación desde localStorage).
    // Se usa una ref implícita via key del efecto para no re-ejecutar en cada render.
    useEffect(() => {
        if (!paciente) return
        setNombre(paciente.nombre)
        setFechaNac(paciente.fechaNacimiento ?? '')
        setNotas(paciente.notas ?? '')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paciente?.nombre, paciente?.fechaNacimiento, paciente?.notas])

    if (!paciente) {
        return (
            <>
                <HeaderApp titulo="Paciente no encontrado" />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 14, color: 'var(--t2)' }}>Este paciente no existe.</div>
                </div>
            </>
        )
    }

    function handleGuardar() {
        if (!nombre.trim()) return
        actualizar(id, {
            nombre: nombre.trim(),
            fechaNacimiento: fechaNac || undefined,
            notas: notas.trim() || undefined,
        })
        router.push(`/pacientes/${id}`)
    }

    return (
        <>
            <HeaderApp titulo={`Editar: ${paciente.nombre}`} subtitulo="Modificar datos del paciente" />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: 480, width: '100%' }}>
                    <div style={{
                        padding: '20px', borderRadius: 14,
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                    }}>
                        <label style={{ display: 'block', marginBottom: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 4 }}>
                                Nombre *
                            </span>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 8,
                                    background: 'var(--bg-3)', color: 'var(--t0)',
                                    border: '1px solid var(--border)', fontSize: 13,
                                }}
                            />
                        </label>

                        <label style={{ display: 'block', marginBottom: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 4 }}>
                                Fecha de nacimiento
                            </span>
                            <input
                                type="date"
                                value={fechaNac}
                                onChange={(e) => setFechaNac(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 8,
                                    background: 'var(--bg-3)', color: 'var(--t0)',
                                    border: '1px solid var(--border)', fontSize: 13,
                                }}
                            />
                        </label>

                        <label style={{ display: 'block', marginBottom: 16 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 4 }}>
                                Notas
                            </span>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                rows={3}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 8,
                                    background: 'var(--bg-3)', color: 'var(--t0)',
                                    border: '1px solid var(--border)', fontSize: 13,
                                    resize: 'vertical', fontFamily: 'inherit',
                                }}
                            />
                        </label>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => router.push(`/pacientes/${id}`)}
                                style={{
                                    padding: '10px 20px', borderRadius: 8,
                                    background: 'var(--bg-3)', color: 'var(--t1)',
                                    border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={!nombre.trim()}
                                style={{
                                    padding: '10px 20px', borderRadius: 8,
                                    background: 'var(--accent)', color: '#fff',
                                    border: 'none', fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer', boxShadow: 'var(--shadow-accent)',
                                }}
                            >
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}