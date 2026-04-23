'use client'

// Vista del informe de un análisis recién completado.
// Muestra: disclaimer médico, imagen original, Grad-CAM con leyenda,
// probabilidad de carcinoma con riesgo contextualizado, interpretación
// del modelo, patologías agrupadas por severidad y acciones con contexto.

import type { InformeAnalisis } from '@/lib/tipos'

interface InformeResultadoProps {
    readonly informe: InformeAnalisis
    readonly imagenDataUrl: string
    readonly gradcamBase64?: string
    readonly onGuardar: () => void
    readonly onNuevo: () => void
}

// Etiqueta de riesgo contextualizada según porcentaje, sin usar "severidad" cruda.
function etiquetaRiesgo(pct: number): { texto: string; color: string; bg: string; border: string } {
    if (pct >= 75) return { texto: 'Riesgo alto (modelo IA)', color: '#A32D2D', bg: '#FCEBEB', border: '#F7C1C1' }
    if (pct >= 50) return { texto: 'Riesgo moderado–alto (modelo IA)', color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' }
    if (pct >= 30) return { texto: 'Riesgo moderado (modelo IA)', color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97' }
    return { texto: 'Riesgo bajo (modelo IA)', color: '#185FA5', bg: '#E6F1FB', border: '#B5D4F4' }
}

// Color de barra según porcentaje de la patología detectada.
function colorBarra(pct: number): string {
    if (pct >= 85) return '#E24B4A'
    if (pct >= 65) return '#EF9F27'
    return '#185FA5'
}

const estiloLabel: React.CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--t2)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 10,
}

const estiloCard: React.CSSProperties = {
    padding: '18px 20px',
    borderRadius: 14,
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
}

export function InformeResultado({ informe, imagenDataUrl, gradcamBase64, onGuardar, onNuevo }: InformeResultadoProps) {
    const pct = informe.porcentajeCarcinoma
    const riesgo = etiquetaRiesgo(pct)

    // Separar patologías en principales (>=65%) y secundarias (30–64%)
    const principales = informe.patologiasRelevantes.filter(p => p.porcentaje >= 65)
    const secundarias = informe.patologiasRelevantes.filter(p => p.porcentaje < 65)

    return (
        <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
        }}>

            {/* ── Fila principal: columna izquierda + columna derecha ── */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* ── COLUMNA IZQUIERDA: Resultado + Imágenes ── */}
                <div style={{ flex: '1 1 480px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── 1. Resultado principal ── */}
                    <div style={estiloCard}>
                        <div style={estiloLabel}>Resultado del análisis</div>

                        {/* Disclaimer médico — visible antes de leer el número */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'var(--warn-bg)',
                            border: '1px solid var(--warn)',
                            marginBottom: 18,
                        }}>
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                                <circle cx="8" cy="8" r="7" stroke="var(--warn)" strokeWidth="1.4" />
                                <path d="M8 5v3.5" stroke="var(--warn)" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="8" cy="11.5" r="0.8" fill="var(--warn)" />
                            </svg>
                            <span style={{ fontSize: 12, color: 'var(--warn)', lineHeight: 1.6 }}>
                                Este resultado es generado por un modelo de IA y{' '}
                                <strong style={{ fontWeight: 600 }}>no sustituye el diagnóstico médico.</strong>
                                {' '}Debe ser interpretado por un profesional de salud.
                            </span>
                        </div>

                        {/* Número principal */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--t0)', lineHeight: 1 }}>
                                {pct}%
                            </span>
                            <span style={{ fontSize: 14, color: 'var(--t1)' }}>
                                probabilidad estimada de carcinoma
                            </span>
                        </div>

                        {/* Badge de riesgo contextualizado */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 12px',
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 500,
                                background: riesgo.bg,
                                color: riesgo.color,
                                border: `1px solid ${riesgo.border}`,
                            }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M5 1.5L8.5 8H1.5L5 1.5Z" stroke={riesgo.color} strokeWidth="1.2" fill="none" />
                                </svg>
                                {riesgo.texto}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--t2)' }}>
                                Umbral de detección del modelo: 50%
                            </span>
                        </div>
                    </div>

                    {/* ── 2. Imágenes ── */}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {/* Radiografía original */}
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Radiografía original
                            </div>
                            <img
                                src={imagenDataUrl}
                                alt="Radiografía original"
                                style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
                            />
                        </div>

                        {/* Grad-CAM con leyenda */}
                        {gradcamBase64 && (
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Grad-CAM — zona de atención del modelo
                                </div>
                                <img
                                    src={`data:image/png;base64,${gradcamBase64}`}
                                    alt="Mapa de calor Grad-CAM con zonas de alta relevancia en rojo"
                                    style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
                                />
                                {/* Leyenda del heatmap */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                    <span style={{ fontSize: 11, color: 'var(--t2)' }}>Baja</span>
                                    <div style={{
                                        flex: 1,
                                        height: 7,
                                        borderRadius: 4,
                                        background: 'linear-gradient(to right, #3b4bc8, #29c5a0, #f5c518, #e24b4a)',
                                    }} />
                                    <span style={{ fontSize: 11, color: 'var(--t2)' }}>Alta relevancia</span>
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4, lineHeight: 1.5 }}>
                                    Las zonas rojas indican mayor relevancia para el modelo al clasificar la imagen.
                                </div>
                            </div>
                        )}
                    </div>

                </div>{/* fin columna izquierda */}

                {/* ── COLUMNA DERECHA: Interpretación + Condiciones ── */}
                <div style={{ flex: '1 1 340px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── 3. Interpretación del modelo ── */}
                    <div style={estiloCard}>
                        <div style={estiloLabel}>Interpretación del modelo</div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: riesgo.color,
                                marginTop: 5, flexShrink: 0,
                            }} />
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t0)', marginBottom: 4 }}>
                                    Detección positiva por el modelo
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.65 }}>
                                    {informe.etiquetaCarcinoma}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 4. Condiciones detectadas ── */}
                    {informe.patologiasRelevantes.length > 0 && (
                        <div style={estiloCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div style={{ ...estiloLabel, marginBottom: 0 }}>Condiciones detectadas</div>
                                <span style={{ fontSize: 11, color: 'var(--t2)' }}>Solo condiciones &gt;30%</span>
                            </div>

                            {/* Hallazgos principales */}
                            {principales.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '2px 10px',
                                        borderRadius: 10,
                                        fontSize: 11,
                                        background: '#FCEBEB',
                                        color: '#A32D2D',
                                        marginBottom: 10,
                                    }}>
                                        Hallazgos principales
                                    </div>
                                    <FilaPatologias patologias={principales} />
                                </div>
                            )}

                            {/* Hallazgos secundarios */}
                            {secundarias.length > 0 && (
                                <div style={{
                                    borderTop: principales.length > 0 ? '1px solid var(--border)' : 'none',
                                    paddingTop: principales.length > 0 ? 14 : 0,
                                }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '2px 10px',
                                        borderRadius: 10,
                                        fontSize: 11,
                                        background: 'var(--bg-3)',
                                        color: 'var(--t1)',
                                        marginBottom: 10,
                                    }}>
                                        Hallazgos secundarios
                                    </div>
                                    <FilaPatologias patologias={secundarias} />
                                </div>
                            )}
                        </div>
                    )}

                </div>{/* fin columna derecha */}

            </div>{/* fin fila principal */}

            {/* ── 5. Acciones ── centradas debajo de ambas columnas */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
                paddingBottom: 24,
            }}>
                <button
                    onClick={onGuardar}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 22px',
                        borderRadius: 10,
                        background: 'var(--accent)',
                        color: '#fff',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-accent)',
                        transition: 'all var(--ts)',
                    }}
                >
                    <IconoGuardar />
                    Guardar estudio
                </button>

                <button
                    onClick={onNuevo}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 22px',
                        borderRadius: 10,
                        background: 'var(--bg-3)',
                        color: 'var(--t0)',
                        border: '1px solid var(--border)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all var(--ts)',
                    }}
                >
                    <IconoNuevo />
                    Nuevo análisis
                </button>

                <span style={{ fontSize: 11, color: 'var(--t2)' }}>
                    El estudio no se guarda automáticamente
                </span>
            </div>
        </div>
    )
}

// ── Sub-componentes internos ──

interface PatologiaItem {
    nombre: string
    porcentaje: number
}

function FilaPatologias({ patologias }: { patologias: PatologiaItem[] }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {patologias.map((p) => (
                <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--t0)', minWidth: 150 }}>
                        {p.nombre}
                    </span>
                    <div style={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        background: 'var(--bg-3)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${p.porcentaje}%`,
                            height: '100%',
                            borderRadius: 3,
                            background: colorBarra(p.porcentaje),
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                    <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        color: 'var(--t1)',
                        minWidth: 34,
                        textAlign: 'right',
                    }}>
                        {p.porcentaje}%
                    </span>
                </div>
            ))}
        </div>
    )
}

function IconoGuardar() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 10v1.5A1.5 1.5 0 002.5 13h9A1.5 1.5 0 0013 11.5V10" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    )
}

function IconoNuevo() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="var(--t1)" strokeWidth="1.2" />
            <path d="M7 4.5V7l1.5 1.5" stroke="var(--t1)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    )
}