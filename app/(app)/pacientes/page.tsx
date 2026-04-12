'use client'

// Lista de pacientes del sistema.
// Permite ver, crear y acceder a la ficha de cada paciente.

import { useState } from 'react'
import { HeaderApp } from '@/components/layout/header-app'
import { ListaPacientes, usePacientes } from '@/features/pacientes'
import { useEstudios } from '@/features/estudios'
import { useRouter } from 'next/navigation'

export default function PacientesPage() {
    const { pacientes, guardar } = usePacientes()
    const { estudios } = useEstudios()
    const router = useRouter()

    const [creando, setCreando] = useState(false)
    const [nombre, setNombre] = useState('')
    const [fechaNac, setFechaNac] = useState('')
    const [notas, setNotas] = useState('')

    function handleCrear() {
        if (!nombre.trim()) return
        const paciente = guardar({
            nombre: nombre.trim(),
            fechaNacimiento: fechaNac || undefined,
            notas: notas.trim() || undefined,
        })
        setCreando(false)
        setNombre('')
        setFechaNac('')
        setNotas('')
        router.push(`/pacientes/${paciente.id}`)
    }

    return (
        <>
            <HeaderApp
                titulo="Pacientes"
                subtitulo={`${pacientes.length} paciente${pacientes.length === 1 ? '' : 's'} registrado${pacientes.length === 1 ? '' : 's'}`}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {/* Botón crear paciente */}
                {!creando && (
                    <button
                        onClick={() => setCreando(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 20px', borderRadius: 10, marginBottom: 16,
                            background: 'var(--accent)', color: '#fff', border: 'none',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            boxShadow: 'var(--shadow-accent)',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Nuevo paciente
                    </button>
                )}

                {/* Formulario de creación */}
                {creando && (
                    <div style={{
                        padding: '20px', borderRadius: 14, marginBottom: 16,
                        background: 'var(--bg-2)', border: '1px solid var(--accent)',
                    }}>
                        <div style={{
                            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14,
                        }}>
                            Registrar paciente
                        </div>

                        <label style={{ display: 'block', marginBottom: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 4 }}>
                                Nombre *
                            </span>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Nombre completo del paciente"
                                autoFocus
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

                        <label style={{ display: 'block', marginBottom: 14 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 4 }}>
                                Notas
                            </span>
                            <textarea
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                placeholder="Observaciones clínicas..."
                                rows={2}
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
                                onClick={() => { setCreando(false); setNombre(''); setFechaNac(''); setNotas('') }}
                                style={{
                                    padding: '8px 18px', borderRadius: 8,
                                    background: 'var(--bg-3)', color: 'var(--t1)',
                                    border: '1px solid var(--border)', fontSize: 13, cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCrear}
                                disabled={!nombre.trim()}
                                style={{
                                    padding: '8px 18px', borderRadius: 8,
                                    background: nombre.trim() ? 'var(--accent)' : 'var(--bg-3)',
                                    color: nombre.trim() ? '#fff' : 'var(--t2)',
                                    border: 'none', fontSize: 13, fontWeight: 600,
                                    cursor: nombre.trim() ? 'pointer' : 'default',
                                }}
                            >
                                Registrar
                            </button>
                        </div>
                    </div>
                )}

                <ListaPacientes
                    pacientes={pacientes}
                    estudios={estudios}
                    onSeleccionar={(id) => router.push(`/pacientes/${id}`)}
                />
            </div>
        </>
    )
}
