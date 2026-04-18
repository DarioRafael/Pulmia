'use client'

import { useState, useEffect } from 'react'
import { HeaderApp } from '@/components/layout/header-app'
import { ZonaSubida, InformeResultado, useAnalisis } from '@/features/analisis'
import { useInformeActivo } from '@/features/analisis/informe-activo-context'
import { useEstudios } from '@/features/estudios'
import { usePacientes } from '@/features/pacientes'
import { usePlan } from '@/components/plan'
import { useRouter } from 'next/navigation'
import type { Paciente } from '@/lib/tipos'

export default function AnalizarPage() {
    const { estado, previsualizarArchivo, confirmarAnalisis, reiniciar } = useAnalisis()
    const { guardar, puedoCrear, estudiosEsteMes } = useEstudios()
    const { pacientes, guardar: guardarPaciente } = usePacientes()
    const { limites } = usePlan()
    const { setInformeActivo, limpiarInformeActivo } = useInformeActivo()
    const router = useRouter()

    const [mostrarGuardar, setMostrarGuardar] = useState(false)
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>('')
    const [nuevoPacienteNombre, setNuevoPacienteNombre] = useState('')
    const [notas, setNotas] = useState('')

    // Cuando el análisis completa, expone el informe al ChatBubble global.
    useEffect(() => {
        if (estado.paso === 'completado') {
            setInformeActivo(estado.informe)
        }
    }, [estado, setInformeActivo])

    function handleReiniciar() {
        limpiarInformeActivo()
        reiniciar()
    }

    function handleGuardar() {
        if (estado.paso !== 'completado') return

        let pacienteId: string | undefined
        if (nuevoPacienteNombre.trim()) {
            const nuevoPaciente = guardarPaciente({ nombre: nuevoPacienteNombre.trim() })
            pacienteId = nuevoPaciente.id
        } else if (pacienteSeleccionado) {
            pacienteId = pacienteSeleccionado
        }

        const estudio = guardar({
            imagenDataUrl: estado.imagenDataUrl,
            nombreArchivo: estado.nombreArchivo,
            mimeType: estado.mimeType,
            informe: estado.informe,
            pacienteId,
            notas: notas.trim() || undefined,
        })
        router.push(`/estudios/${estudio.id}`)
    }

    return (
        <>
            <HeaderApp
                titulo="Analizar radiografía"
                subtitulo={
                    limites.estudiosPorMes !== null
                        ? `${estudiosEsteMes}/${limites.estudiosPorMes} este mes`
                        : undefined
                }
            />
            <div style={{
                flex: 1, overflowY: 'auto', padding: '32px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
                {/* Paso 1: Zona de subida */}
                {estado.paso === 'idle' && (
                    <ZonaSubida
                        onArchivo={previsualizarArchivo}
                        disabled={!puedoCrear}
                    />
                )}

                {/* Paso 2: Preview */}
                {estado.paso === 'preview' && (
                    <div style={{
                        maxWidth: 520, width: '100%', margin: '0 auto',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                    }}>
                        <div style={{
                            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                            Previsualización
                        </div>
                        <div style={{
                            width: '100%', borderRadius: 16, overflow: 'hidden',
                            border: '2px solid var(--accent)', position: 'relative',
                            background: 'var(--bg-2)',
                        }}>
                            <img
                                src={estado.imagenDataUrl}
                                alt="Radiografía seleccionada"
                                style={{ width: '100%', display: 'block' }}
                            />
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                padding: '12px 16px',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                color: '#fff',
                            }}>
                                <div style={{
                                    fontFamily: 'var(--mono)', fontSize: 11,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                        <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
                                        <circle cx="8" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
                                    </svg>
                                    {estado.nombreArchivo}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                            <button
                                onClick={handleReiniciar}
                                style={{
                                    flex: 1, padding: '12px 20px', borderRadius: 10,
                                    background: 'var(--bg-3)', color: 'var(--t0)',
                                    border: '1px solid var(--border)', fontSize: 13,
                                    fontWeight: 500, cursor: 'pointer', transition: 'all var(--ts)',
                                }}
                            >
                                Cambiar imagen
                            </button>
                            <button
                                onClick={confirmarAnalisis}
                                style={{
                                    flex: 1, padding: '12px 20px', borderRadius: 10,
                                    background: 'var(--accent)', color: '#fff', border: 'none',
                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                    boxShadow: 'var(--shadow-accent)', transition: 'all var(--ts)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                </svg>
                                Analizar radiografía
                            </button>
                        </div>
                    </div>
                )}

                {/* Paso 3: Subiendo / Analizando */}
                {(estado.paso === 'subiendo' || estado.paso === 'analizando') && (
                    <div style={{
                        maxWidth: 520, width: '100%', margin: '0 auto',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
                    }}>
                        <div style={{
                            width: '100%', borderRadius: 16, overflow: 'hidden',
                            border: '1px solid var(--border)', position: 'relative',
                        }}>
                            <img
                                src={estado.imagenDataUrl}
                                alt="Analizando..."
                                style={{ width: '100%', display: 'block', filter: 'brightness(0.6)' }}
                            />
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', gap: 16,
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    border: '3px solid rgba(255,255,255,0.2)',
                                    borderTopColor: 'var(--accent)',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                                <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>
                                    {estado.paso === 'subiendo' ? 'Subiendo imagen...' : 'Analizando con el modelo...'}
                                </div>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                                    {estado.nombreArchivo}
                                </div>
                            </div>
                        </div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Paso 4: Completado */}
                {estado.paso === 'completado' && !mostrarGuardar && (
                    <InformeResultado
                        informe={estado.informe}
                        imagenDataUrl={estado.imagenDataUrl}
                        gradcamBase64={estado.informe.gradcamBase64}
                        onGuardar={() => setMostrarGuardar(true)}
                        onNuevo={handleReiniciar}
                    />
                )}

                {/* Paso 4b: Formulario guardar */}
                {estado.paso === 'completado' && mostrarGuardar && (
                    <div style={{
                        maxWidth: 480, width: '100%', margin: '0 auto',
                        display: 'flex', flexDirection: 'column', gap: 16,
                    }}>
                        <div style={{
                            padding: '20px', borderRadius: 14,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                        }}>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)',
                                letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16,
                            }}>
                                Guardar estudio
                            </div>

                            <label style={{ display: 'block', marginBottom: 12 }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 6 }}>
                                    Paciente existente
                                </span>
                                <select
                                    value={pacienteSeleccionado}
                                    onChange={(e) => {
                                        setPacienteSeleccionado(e.target.value)
                                        if (e.target.value) setNuevoPacienteNombre('')
                                    }}
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 8,
                                        background: 'var(--bg-3)', color: 'var(--t0)',
                                        border: '1px solid var(--border)', fontSize: 13,
                                    }}
                                >
                                    <option value="">— Sin paciente —</option>
                                    {pacientes.map((p: Paciente) => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </label>

                            <label style={{ display: 'block', marginBottom: 12 }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 6 }}>
                                    O crear nuevo paciente
                                </span>
                                <input
                                    type="text"
                                    value={nuevoPacienteNombre}
                                    onChange={(e) => {
                                        setNuevoPacienteNombre(e.target.value)
                                        if (e.target.value) setPacienteSeleccionado('')
                                    }}
                                    placeholder="Nombre del paciente..."
                                    style={{
                                        width: '100%', padding: '10px 12px', borderRadius: 8,
                                        background: 'var(--bg-3)', color: 'var(--t0)',
                                        border: '1px solid var(--border)', fontSize: 13,
                                    }}
                                />
                            </label>

                            <label style={{ display: 'block', marginBottom: 16 }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)', display: 'block', marginBottom: 6 }}>
                                    Notas (opcional)
                                </span>
                                <textarea
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                    placeholder="Observaciones del estudio..."
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
                                    onClick={() => setMostrarGuardar(false)}
                                    style={{
                                        flex: 1, padding: '10px 16px', borderRadius: 8,
                                        background: 'var(--bg-3)', color: 'var(--t1)',
                                        border: '1px solid var(--border)', fontSize: 13,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={handleGuardar}
                                    style={{
                                        flex: 1, padding: '10px 16px', borderRadius: 8,
                                        background: 'var(--accent)', color: '#fff', border: 'none',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        boxShadow: 'var(--shadow-accent)',
                                    }}
                                >
                                    Guardar estudio
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {estado.paso === 'error' && (
                    <div style={{ textAlign: 'center', padding: '48px 24px', maxWidth: 400 }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
                        <div style={{ fontSize: 14, color: 'var(--err)', marginBottom: 16 }}>
                            {estado.mensaje}
                        </div>
                        <button
                            onClick={handleReiniciar}
                            style={{
                                padding: '10px 24px', borderRadius: 10,
                                background: 'var(--bg-3)', color: 'var(--t0)',
                                border: '1px solid var(--border)', fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {!puedoCrear && estado.paso === 'idle' && (
                    <div style={{
                        marginTop: 16, padding: '12px 16px', borderRadius: 10,
                        border: '1px solid var(--warn)', background: 'var(--warn-bg)',
                        color: 'var(--warn)', fontSize: 13, textAlign: 'center', maxWidth: 420,
                    }}>
                        Has alcanzado el límite de {limites.estudiosPorMes} estudios/mes.
                        <a href="/upgrade" style={{ color: 'var(--accent)', marginLeft: 6 }}>
                            Actualizar plan →
                        </a>
                    </div>
                )}
            </div>
        </>
    )
}