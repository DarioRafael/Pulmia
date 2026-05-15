'use client'

import { useState, useEffect } from 'react'
import type React from 'react'
import { HeaderApp } from '@/components/layout/header-app'
import { ZonaSubida, InformeResultado, useAnalisis } from '@/features/analisis'
import { useInformeActivo } from '@/features/analisis/informe-activo-context'
import { useEstudios } from '@/features/estudios'
import { usePacientes } from '@/features/pacientes'
import { usePlan } from '@/components/plan'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Paciente } from '@/lib/tipos'



// ── Mini componente: stat badge ───────────────────────────────────────
function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 8,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
        }}>
            <span style={{ color: 'var(--accent)', opacity: 0.8 }}>{icon}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--t2)' }}>{label}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--t0)', fontWeight: 600 }}>{value}</span>
        </div>
    )
}

// ── Mini componente: paso del flujo ───────────────────────────────────
function PasoFlujo({ num, texto, activo }: { num: number; texto: string; activo: boolean }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: activo ? 1 : 0.35,
            transition: 'opacity 0.3s',
        }}>
            <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: activo ? 'var(--accent)' : 'var(--bg-3)',
                border: `1px solid ${activo ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600,
                color: activo ? '#fff' : 'var(--t2)',
                flexShrink: 0,
            }}>{num}</div>
            <span style={{ fontSize: 14, color: activo ? 'var(--t0)' : 'var(--t2)' }}>{texto}</span>
        </div>
    )
}

// ── Mini componente: chip de metadato de imagen ───────────────────────
function MetaChip({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 2,
            padding: '10px 14px', borderRadius: 8,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            flex: 1, minWidth: 0,
        }}>
            <div style={{
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: 4,
            }}>
                {icon}{label}
            </div>
            <div style={{
                fontSize: 14, color: 'var(--t0)', fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{value}</div>
        </div>
    )
}

// ── Panel reutilizable: metadatos + modelo ────────────────────────────
function PanelMetaYModelo({
                              nombreArchivo, imagenMeta, enProceso = false,
                          }: {
    nombreArchivo?: string
    imagenMeta: { size: string; type: string; dims?: string } | null
    enProceso?: boolean
}) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Metadatos de la imagen */}
            <div style={{ padding: '16px', borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    Detalles de la imagen
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    <MetaChip label="Archivo" value={nombreArchivo || '—'} icon={<svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h4M6 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <MetaChip label="Formato" value={imagenMeta?.type || '—'} icon={<svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/></svg>} />
                        <MetaChip label="Tamaño" value={imagenMeta?.size || '—'} icon={<svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M4 10l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
                    </div>
                    {imagenMeta?.dims && (
                        <MetaChip label="Dimensiones" value={imagenMeta.dims} icon={<svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 6h12M6 2v12" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>} />
                    )}
                </div>
            </div>
            {/* El modelo detecta */}
            <div style={{ padding: '16px', borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
                    {enProceso ? 'Procesando' : 'El modelo detecta'}
                </div>
                {['Carcinoma (prob. estimada)', 'Atelectasia y fibrosis', 'Efusión y hernia', 'Zonas de atención (Grad-CAM)', '14+ condiciones torácicas'].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--t1)' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                        {item}
                    </div>
                ))}
            </div>
        </div>
    )
}

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
    const [imagenMeta, setImagenMeta] = useState<{ size: string; type: string; dims?: string } | null>(null)

    useEffect(() => {
        if (estado.paso !== 'completado') return
        const timeout = setTimeout(() => {
            setInformeActivo(estado.informe)
        }, 0)
        return () => clearTimeout(timeout)
    }, [estado, setInformeActivo])

    // Extraer metadatos cuando se elige una imagen
    useEffect(() => {
        if (estado.paso !== 'preview' || !estado.imagenDataUrl) return

        // Calcular size y tipo de forma síncrona
        const base64 = estado.imagenDataUrl.split(',')[1] || ''
        const bytes = Math.round((base64.length * 3) / 4)
        const kb = bytes > 1024 * 1024
            ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
            : `${(bytes / 1024).toFixed(0)} KB`
        const tipo = ('mimeType' in estado ? (estado as { mimeType?: string }).mimeType : undefined)?.split('/')[1]?.toUpperCase()
            ?? estado.nombreArchivo?.split('.').pop()?.toUpperCase()
            ?? 'IMG'

        let cancelled = false
        const img = new window.Image()
        img.onload = () => {
            if (!cancelled) {
                setImagenMeta({ size: kb, type: tipo, dims: `${img.naturalWidth} × ${img.naturalHeight}` })
            }
        }
        img.src = estado.imagenDataUrl

        // Limpiar al salir del paso preview
        return () => {
            cancelled = true
            setImagenMeta(null)
        }
    }, [estado])

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
                position: 'relative', zIndex: 1,
            }}>

                {/* ── Paso 1: Zona de subida ─────────────────────────────── */}
                {estado.paso === 'idle' && (
                    <div style={{
                        maxWidth: 860, width: '100%',
                        display: 'flex', flexDirection: 'column', gap: 24,
                    }}>
                        {/* Cabecera descriptiva */}
                        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 11,
                                color: 'var(--accent)', letterSpacing: '0.1em',
                                textTransform: 'uppercase', marginBottom: 8,
                            }}>
                            </div>
                            <h2 style={{
                                fontSize: 26, fontWeight: 700, color: 'var(--t0)',
                                letterSpacing: '-0.02em', marginBottom: 8,
                            }}>
                                Radiografía de tórax con IA
                            </h2>
                            <p style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
                                Sube una imagen y el modelo detectará patrones relevantes en segundos.
                            </p>
                        </div>

                        {/* Zona de subida */}
                        <ZonaSubida
                            onArchivo={previsualizarArchivo}
                            disabled={!puedoCrear}
                        />

                        {/* Fila inferior: Cómo funciona + Stats */}
                        <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
                            {/* Pasos del flujo */}
                            <div style={{
                                flex: '1 1 260px',
                                padding: '16px 20px', borderRadius: 12,
                                background: 'var(--bg-2)', border: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column', gap: 12,
                            }}>
                                <div style={{
                                    fontFamily: 'var(--mono)', fontSize: 11,
                                    color: 'var(--t2)', letterSpacing: '0.06em',
                                    textTransform: 'uppercase', marginBottom: 4,
                                }}>
                                    Cómo funciona
                                </div>
                                <PasoFlujo num={1} texto="Sube una radiografía (PNG)" activo={true} />
                                <PasoFlujo num={2} texto="Revisa la previsualización y confirma" activo={false} />
                                <PasoFlujo num={3} texto="El modelo analiza patrones en la imagen" activo={false} />
                                <PasoFlujo num={4} texto="Obtén el informe y guarda el estudio" activo={false} />
                            </div>

                            {/* Stats de uso */}
                            <div style={{
                                flex: '1 1 200px',
                                padding: '16px 20px', borderRadius: 12,
                                background: 'var(--bg-2)', border: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column', gap: 10,
                            }}>
                                <div style={{
                                    fontFamily: 'var(--mono)', fontSize: 11,
                                    color: 'var(--t2)', letterSpacing: '0.06em',
                                    textTransform: 'uppercase', marginBottom: 4,
                                }}>
                                    Uso del plan
                                </div>
                                {limites.estudiosPorMes !== null ? (
                                    <>
                                        <StatBadge
                                            icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                            label="Usados este mes"
                                            value={`${estudiosEsteMes} / ${limites.estudiosPorMes}`}
                                        />
                                        <div style={{
                                            height: 4, borderRadius: 4,
                                            background: 'var(--bg-3)', overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                height: '100%', borderRadius: 4,
                                                width: `${Math.min(100, (estudiosEsteMes / limites.estudiosPorMes) * 100)}%`,
                                                background: estudiosEsteMes >= limites.estudiosPorMes ? 'var(--err)' : 'var(--accent)',
                                                transition: 'width 0.4s ease',
                                            }} />
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: 14, color: 'var(--t1)' }}>Plan sin límite de estudios</div>
                                )}
                                <StatBadge
                                    icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                                    label="Tiempo estimado"
                                    value="~20 seg"
                                />
                                <StatBadge
                                    icon={<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    label="Formatos"
                                    value="PNG"
                                />
                            </div>
                        </div>

                        {/* Aviso de límite alcanzado */}
                        {!puedoCrear && (
                            <div style={{
                                padding: '12px 16px', borderRadius: 10,
                                border: '1px solid var(--warn)', background: 'var(--warn-bg)',
                                color: 'var(--warn)', fontSize: 13, textAlign: 'center',
                            }}>
                                Has alcanzado el límite de {limites.estudiosPorMes} estudios/mes.
                                <a href="/upgrade" style={{ color: 'var(--accent)', marginLeft: 6 }}>
                                    Actualizar plan →
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Paso 2: Preview ────────────────────────────────────── */}
                {estado.paso === 'preview' && (
                    <div style={{
                        maxWidth: 900, width: '100%', margin: '0 auto',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.1fr',
                        gap: 20,
                        alignItems: 'start',
                    }}>
                        {/* Columna izquierda: imagen */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)',
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                                Previsualización
                            </div>
                            <div style={{
                                width: '100%', borderRadius: 16, overflow: 'hidden',
                                border: '2px solid var(--accent)', position: 'relative',
                                background: 'var(--bg-2)',
                                boxShadow: '0 0 32px rgba(20,184,166,0.08)',
                            }}>
                                <Image
                                    src={estado.imagenDataUrl}
                                    alt="Radiografía seleccionada"
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    style={{ width: '100%', height: 'auto', display: 'block' }}
                                    unoptimized
                                />
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '12px 16px',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
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

                            {/* Botones acción */}
                            <div style={{ display: 'flex', gap: 12 }}>
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

                        {/* Columna derecha: panel de metadatos y tips */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Fila superior: Detalles | El modelo detecta */}
                            <PanelMetaYModelo
                                nombreArchivo={estado.nombreArchivo}
                                imagenMeta={imagenMeta}
                            />

                            {/* Pasos del flujo — ancho completo de ambas columnas */}
                            <div style={{
                                padding: '14px 16px', borderRadius: 12,
                                background: 'var(--bg-2)', border: '1px solid var(--border)',
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px',
                            }}>
                                <PasoFlujo num={1} texto="Imagen cargada" activo={true} />
                                <PasoFlujo num={2} texto="Confirmando análisis" activo={true} />
                                <PasoFlujo num={3} texto="Procesando con modelo" activo={false} />
                                <PasoFlujo num={4} texto="Informe listo" activo={false} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Paso 3: Analizando ─────────────────────────────────── */}
                {(estado.paso === 'subiendo' || estado.paso === 'analizando') && (
                    <div style={{
                        maxWidth: 900, width: '100%', margin: '0 auto',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1.1fr',
                        gap: 20,
                        alignItems: 'start',
                    }}>
                        <style>{`
                            @keyframes spin { to { transform: rotate(360deg); } }
                            @keyframes scan-line {
                                0%   { transform: translateY(-100%); }
                                100% { transform: translateY(400%); }
                            }
                        `}</style>

                        {/* Columna izquierda: imagen con overlay de análisis */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{
                                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)',
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                            }}>
                                Previsualización
                            </div>
                            <div style={{
                                width: '100%', borderRadius: 16, overflow: 'hidden',
                                border: '2px solid var(--accent)', position: 'relative',
                                background: 'var(--bg-2)',
                                boxShadow: '0 0 32px rgba(20,184,166,0.08)',
                            }}>
                                <Image
                                    src={estado.imagenDataUrl}
                                    alt="Analizando..."
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    unoptimized
                                    style={{ width: '100%', height: 'auto', display: 'block', filter: 'brightness(0.45) saturate(0)' }}
                                />
                                {/* Línea de escaneo */}
                                <div style={{
                                    position: 'absolute', left: 0, right: 0,
                                    height: '8%',
                                    background: 'linear-gradient(transparent, rgba(20,184,166,0.18), transparent)',
                                    animation: 'scan-line 1.8s ease-in-out infinite',
                                }} />
                                {/* Spinner y texto */}
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 16,
                                }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: '50%',
                                        border: '3px solid rgba(255,255,255,0.15)',
                                        borderTopColor: 'var(--accent)',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                    <div style={{ fontSize: 15, color: '#fff', fontWeight: 500 }}>
                                        {estado.paso === 'subiendo' ? 'Subiendo imagen...' : 'Analizando con el modelo...'}
                                    </div>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                                        {estado.nombreArchivo}
                                    </div>
                                </div>
                                {/* Nombre archivo abajo */}
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '12px 16px',
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
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
                            {/* Botones deshabilitados para mantener layout */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button disabled style={{
                                    flex: 1, padding: '12px 20px', borderRadius: 10,
                                    background: 'var(--bg-3)', color: 'var(--t2)',
                                    border: '1px solid var(--border)', fontSize: 13,
                                    fontWeight: 500, cursor: 'not-allowed', opacity: 0.5,
                                }}>
                                    Cambiar imagen
                                </button>
                                <button disabled style={{
                                    flex: 1, padding: '12px 20px', borderRadius: 10,
                                    background: 'var(--accent)', color: '#fff', border: 'none',
                                    fontSize: 13, fontWeight: 600, cursor: 'not-allowed', opacity: 0.6,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                    <div style={{
                                        width: 14, height: 14, borderRadius: '50%',
                                        border: '2px solid rgba(255,255,255,0.4)',
                                        borderTopColor: '#fff',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                    Analizando...
                                </button>
                            </div>
                        </div>

                        {/* Columna derecha: igual que preview */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <PanelMetaYModelo
                                nombreArchivo={estado.nombreArchivo}
                                imagenMeta={imagenMeta}
                                enProceso
                            />
                            {/* Pasos — ancho completo */}
                            <div style={{
                                padding: '14px 16px', borderRadius: 12,
                                background: 'var(--bg-2)', border: '1px solid var(--border)',
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px',
                            }}>
                                <PasoFlujo num={1} texto="Imagen cargada" activo={true} />
                                <PasoFlujo num={2} texto="Análisis confirmado" activo={true} />
                                <PasoFlujo num={3} texto={estado.paso === 'subiendo' ? 'Subiendo imagen...' : 'Procesando con modelo...'} activo={true} />
                                <PasoFlujo num={4} texto="Informe listo" activo={false} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Paso 4: Completado ─────────────────────────────────── */}
                {estado.paso === 'completado' && !mostrarGuardar && (
                    <InformeResultado
                        informe={estado.informe}
                        imagenDataUrl={estado.imagenDataUrl}
                        gradcamBase64={estado.informe.gradcamBase64}
                        onGuardar={() => setMostrarGuardar(true)}
                        onNuevo={handleReiniciar}
                    />
                )}

                {/* ── Paso 4b: Guardar estudio ──────────────────────────── */}
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
                                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)',
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

                {/* ── Error ─────────────────────────────────────────────── */}
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

            </div>
        </>
    )
}