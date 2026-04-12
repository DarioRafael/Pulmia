'use client'

// Vista del informe de un análisis recién completado.
// Muestra: imagen original, Grad-CAM, probabilidad de carcinoma,
// patologías relevantes y severidad. Botón para guardar como estudio.

import type { InformeAnalisis } from '@/lib/tipos'

interface InformeResultadoProps {
    readonly informe: InformeAnalisis
    readonly imagenDataUrl: string
    readonly gradcamBase64?: string
    readonly onGuardar: () => void
    readonly onNuevo: () => void
}

const COLORES_SEVERIDAD: Record<string, string> = {
    baja: 'var(--ok)',
    media: 'var(--warn)',
    alta: 'var(--err)',
}

export function InformeResultado({ informe, imagenDataUrl, gradcamBase64, onGuardar, onNuevo }: InformeResultadoProps) {
    const colorSev = COLORES_SEVERIDAD[informe.severidad] ?? 'var(--t1)'

    return (
        <div style={{
            maxWidth: 680, margin: '0 auto', width: '100%',
            display: 'flex', flexDirection: 'column', gap: 20,
        }}>
            {/* Header del resultado */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: 14,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
            }}>
                <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                        Resultado del análisis
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: colorSev }}>
                        {informe.porcentajeCarcinoma}%
                        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--t1)', marginLeft: 8 }}>
                            probabilidad de carcinoma
                        </span>
                    </div>
                </div>
                <div style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: `${colorSev}15`,
                    border: `1px solid ${colorSev}40`,
                    fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600,
                    color: colorSev, textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                    {informe.severidad}
                </div>
            </div>

            {/* Imágenes: original + Grad-CAM */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Radiografía original
                    </div>
                    <img src={imagenDataUrl} alt="Radiografía" style={{
                        width: '100%', borderRadius: 12, border: '1px solid var(--border)',
                    }} />
                </div>
                {gradcamBase64 && (
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Grad-CAM (zona de interés)
                        </div>
                        <img src={`data:image/png;base64,${gradcamBase64}`} alt="Grad-CAM" style={{
                            width: '100%', borderRadius: 12, border: '1px solid var(--border)',
                        }} />
                    </div>
                )}
            </div>

            {/* Etiqueta del modelo */}
            <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
            }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Clasificación del modelo
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--t0)' }}>
                    {informe.etiquetaCarcinoma}
                </div>
            </div>

            {/* Patologías relevantes */}
            {informe.patologiasRelevantes.length > 0 && (
                <div style={{
                    padding: '14px 16px', borderRadius: 10,
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
                        Condiciones detectadas (&gt;30%)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {informe.patologiasRelevantes.map((p) => (
                            <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-3)',
                                    overflow: 'hidden', position: 'relative',
                                }}>
                                    <div style={{
                                        width: `${p.porcentaje}%`, height: '100%',
                                        borderRadius: 3, background: 'var(--accent)',
                                        transition: 'width 0.4s ease',
                                    }} />
                                </div>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t1)', minWidth: 36, textAlign: 'right' }}>
                                    {p.porcentaje}%
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--t0)', minWidth: 140 }}>
                                    {p.nombre}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingBottom: 24 }}>
                <button
                    onClick={onGuardar}
                    style={{
                        padding: '10px 24px', borderRadius: 10,
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        boxShadow: 'var(--shadow-accent)', transition: 'all var(--ts)',
                    }}
                >
                    Guardar estudio
                </button>
                <button
                    onClick={onNuevo}
                    style={{
                        padding: '10px 24px', borderRadius: 10,
                        background: 'var(--bg-3)', color: 'var(--t0)',
                        border: '1px solid var(--border)', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', transition: 'all var(--ts)',
                    }}
                >
                    Nuevo análisis
                </button>
            </div>
        </div>
    )
}
