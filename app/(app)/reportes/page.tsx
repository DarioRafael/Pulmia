'use client'

// Página de reportes: vista consolidada de documentos exportados por paciente.
// Permite ver un resumen de PDFs y Word generados, agrupados por paciente.

import { HeaderApp } from '@/components/layout/header-app'
import { usePacientes } from '@/features/pacientes'
import { useDocumentosExportados } from '@/features/reportes'
import { useRouter } from 'next/navigation'
import { formatearFecha } from '@/lib/utils/fechas'
import type { DocumentoExportado } from '@/lib/tipos'


// Abre un documento guardado como data URI (base64) en una nueva pestaña.
// window.open(dataUri) está bloqueado en Chrome/Firefox — la solución es
// convertir el base64 de vuelta a un Blob URL efímero solo para esta vista.
function abrirDocumento(url: string, nombre: string) {
    if (!url.startsWith('data:')) {
        // URL normal (compatibilidad hacia atrás)
        window.open(url, '_blank')
        return
    }
    const [header, base64] = url.split(',')
    const mime = header.replace('data:', '').replace(';base64', '')
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: mime })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    // PDFs se abren en nueva pestaña; DOCX se descargan (los navegadores no los renderizan)
    if (mime === 'application/pdf') {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.click()
    } else {
        a.download = nombre
        a.click()
    }
    // Limpiar el Blob URL después de un tick
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
}

// Badge de tipo de documento
function TipoBadge({ tipo }: { tipo: 'pdf' | 'docx' }) {
    const esPdf = tipo === 'pdf'
    return (
        <div style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
            background: esPdf ? '#7f1d1d' : '#1e3a5f',
            border: `1px solid ${esPdf ? '#ef4444' : '#3b82f6'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
            color: esPdf ? '#fca5a5' : '#93c5fd',
            fontFamily: 'var(--mono)',
        }}>
            {esPdf ? 'PDF' : 'DOC'}
        </div>
    )
}

export default function ReportesPage() {
    const { documentos, totalDocumentos, totalPdf, totalDocx } = useDocumentosExportados()
    const { pacientes } = usePacientes()
    const router = useRouter()

    // Agrupar documentos por paciente.
    const sinPaciente = documentos.filter((d: DocumentoExportado) => !d.pacienteId)
    const porPaciente = pacientes.map(p => ({
        paciente: p,
        documentos: documentos.filter((d: DocumentoExportado) => d.pacienteId === p.id),
    })).filter(g => g.documentos.length > 0)

    return (
        <>
            <HeaderApp
                titulo="Reportes"
                subtitulo={`${totalDocumentos} documento${totalDocumentos === 1 ? '' : 's'} exportado${totalDocumentos === 1 ? '' : 's'}`}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                {/* Estadísticas: Total, PDF, Word */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                    <div style={{
                        flex: 1, minWidth: 100, padding: '16px', borderRadius: 10,
                        background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--t0)' }}>{totalDocumentos}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                    </div>
                    <div style={{
                        flex: 1, minWidth: 100, padding: '16px', borderRadius: 10,
                        background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--err)' }}>{totalPdf}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>PDF</div>
                    </div>
                    <div style={{
                        flex: 1, minWidth: 100, padding: '16px', borderRadius: 10,
                        background: 'var(--bg-2)', border: '1px solid var(--border)', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ok)' }}>{totalDocx}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Word</div>
                    </div>
                </div>

                {/* Documentos por paciente */}
                {porPaciente.map(({ paciente, documentos: docsPac }) => (
                    <div key={paciente.id} style={{ marginBottom: 24 }}>
                        {/* Label de sección */}
                        <div style={{
                            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
                        }}>
                            {paciente.nombre.split(' ')[0].toUpperCase()} — {docsPac.length} DOCUMENTO{docsPac.length === 1 ? '' : 'S'}
                        </div>

                        {/* Cabecera del paciente */}
                        <div
                            onClick={() => router.push(`/pacientes/${paciente.id}`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
                                cursor: 'pointer', padding: '10px 14px', borderRadius: 8,
                                background: 'var(--bg-2)', border: '1px solid var(--border)',
                            }}
                        >
                            <div style={{
                                width: 30, height: 30, borderRadius: '50%',
                                background: 'transparent',
                                border: '2px solid var(--ok)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 700, color: 'var(--ok)',
                            }}>
                                {paciente.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--t0)' }}>
                                {paciente.nombre}
                            </div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)' }}>
                                {docsPac.length} docs
                            </div>
                        </div>

                        {/* Lista de documentos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {docsPac.map((d: DocumentoExportado) => (
                                <button
                                    key={d.id}
                                    onClick={() => abrirDocumento(d.url, d.nombreArchivo)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', borderRadius: 8, width: '100%',
                                        background: 'var(--bg-1)', border: '1px solid var(--border)',
                                        cursor: 'pointer', textAlign: 'left',
                                    }}
                                >
                                    <TipoBadge tipo={d.tipo} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {d.nombreArchivo}
                                        </div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginTop: 2 }}>
                                            {formatearFecha(d.creadoEn)}
                                            {' · '}
                                            <span style={{ color: 'var(--ok)' }}>{paciente.nombre.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', flexShrink: 0 }}>
                                        {d.tamanoKb ? `${d.tamanoKb} KB` : '—'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Documentos sin paciente */}
                {sinPaciente.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{
                            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
                        }}>
                            SIN PACIENTE — {sinPaciente.length} DOCUMENTO{sinPaciente.length === 1 ? '' : 'S'}
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', borderRadius: 8, marginBottom: 6,
                            background: 'var(--bg-2)', border: '1px solid var(--border)',
                        }}>
                            <div style={{ fontSize: 13, color: 'var(--t1)' }}>Sin paciente asignado</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)' }}>
                                {sinPaciente.length} docs
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {sinPaciente.map((d: DocumentoExportado) => (
                                <button
                                    key={d.id}
                                    onClick={() => abrirDocumento(d.url, d.nombreArchivo)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px', borderRadius: 8, width: '100%',
                                        background: 'var(--bg-1)', border: '1px solid var(--border)',
                                        cursor: 'pointer', textAlign: 'left',
                                    }}
                                >
                                    <TipoBadge tipo={d.tipo} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {d.nombreArchivo}
                                        </div>
                                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)', marginTop: 2 }}>
                                            {formatearFecha(d.creadoEn)}
                                        </div>
                                    </div>
                                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--t2)', flexShrink: 0 }}>
                                        {d.tamanoKb ? `${d.tamanoKb} KB` : '—'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {totalDocumentos === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--t2)', fontSize: 16 }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}></div>
                        Sin documentos exportados. Analiza un estudio y exporta un informe para comenzar.
                    </div>
                )}
            </div>
        </>
    )
}