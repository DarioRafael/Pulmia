'use client'

// ReportModal — genera reporte clínico en PDF (jsPDF) o Word (docx).
// Recibe el contexto actual del chat (paciente, estudio, mensajes) y
// ofrece al usuario elegir formato antes de descargar.
// NUEVO: guarda el documento en useDocumentosExportados tras la descarga,
// para que aparezca en la página de Reportes.
//
// Dependencias necesarias:
//   npm install jspdf docx file-saver
//   npm install -D @types/file-saver
//

import { useState, useEffect } from 'react'
import {
    Document, Packer, Paragraph, TextRun,
    HeadingLevel, AlignmentType, BorderStyle,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Paciente, Estudio } from '@/lib/tipos'
import type { Mensaje } from '../tipos'
import { useDocumentosExportados } from '@/features/reportes'

interface ReportModalProps {
    readonly paciente: Paciente | undefined
    readonly estudio: Estudio | undefined
    readonly informe: Estudio['informe'] | null
    readonly messages: readonly Mensaje[]
    readonly onClose: () => void
}

type Formato = 'pdf' | 'docx'

// ── Gemini API ────────────────────────────────────────────────────────────────

/**
 * Llama a Gemini para generar una narrativa clínica estructurada.
 * Devuelve texto plano con secciones separadas por líneas en blanco.
 * Si falla, devuelve null y el reporte continúa sin narrativa IA.
 */
async function generateGeminiNarrative(
    informe: Estudio['informe'],
    paciente: Paciente | undefined,
    estudio: Estudio | undefined,
): Promise<string | null> {
    const patologiasStr = informe.patologiasRelevantes.length > 0
        ? informe.patologiasRelevantes
            .map(p => `${p.nombre} (${p.porcentaje}%)`)
            .join(', ')
        : 'Ninguna por encima del umbral'

    const pacienteInfo = paciente
        ? `Nombre: ${paciente.nombre}${paciente.fechaNacimiento ? `, Fecha de nacimiento: ${paciente.fechaNacimiento}` : ''}${paciente.notas ? `, Notas: ${paciente.notas}` : ''}`
        : 'No especificado'

    const prompt = `DATOS DEL ANÁLISIS:
- Paciente: ${pacienteInfo}
- Archivo: ${estudio?.nombreArchivo ?? 'No especificado'}
- Fecha del estudio: ${estudio?.creadoEn ?? 'No especificada'}
- Resultado del modelo: ${informe.etiquetaCarcinoma}
- Probabilidad de carcinoma: ${informe.porcentajeCarcinoma}%
- Severidad: ${informe.severidad}
- Patologías detectadas: ${patologiasStr}
${estudio?.notas ? `- Notas del médico: ${estudio.notas}` : ''}

Genera EXACTAMENTE las siguientes secciones, separadas por una línea en blanco. Usa solo texto plano sin Markdown ni asteriscos:

HALLAZGOS RADIOLÓGICOS
[Describe los hallazgos principales detectados por el modelo en 2-3 oraciones clínicas precisas.]

INTERPRETACIÓN
[Interpreta el significado clínico de los resultados en 2-3 oraciones, considerando la probabilidad y severidad.]

RECOMENDACIONES
[Proporciona 2-4 recomendaciones clínicas concretas basadas en los hallazgos, numeradas del 1 al 4.]

ADVERTENCIA
[Una oración recordando que este análisis es asistido por IA y debe ser validado por un médico especialista.]`

    try {
        // Las API keys viven en el servidor (AI_API_KEY_1/2/3 sin prefijo NEXT_PUBLIC).
        // El cliente nunca puede acceder a ellas directamente — delegamos al backend.
        const response = await fetch('/api/chat', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        })

        if (!response.ok) {
            console.error('[ReportModal] Error del servidor al generar narrativa:', response.status)
            return null
        }

        const data = await response.json()
        return (data?.narrative as string | undefined)?.trim() ?? null
    } catch (err) {
        console.error('[ReportModal] Error al solicitar narrativa:', err)
        return null
    }
}


// ── Helpers de contenido ─────────────────────────────────────────────────────

function buildReportLines(
    paciente: Paciente | undefined,
    estudio: Estudio | undefined,
    informe: Estudio['informe'] | null,
    messages: readonly Mensaje[],
    geminiNarrative: string | null,
): string[] {
    const lines: string[] = []
    const now = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })

    lines.push('REPORTE CLÍNICO — ASISTENTE MÉDICO IA')
    lines.push(`Generado: ${now}`)
    lines.push('')

    if (paciente) {
        lines.push('── PACIENTE ──────────────────────────────────────────')
        lines.push(`Nombre: ${paciente.nombre}`)
        if (paciente.fechaNacimiento) lines.push(`Fecha de nacimiento: ${paciente.fechaNacimiento}`)
        if (paciente.notas) lines.push(`Notas: ${paciente.notas}`)
        lines.push('')
    }

    if (estudio && informe) {
        lines.push('── ESTUDIO ANALIZADO ─────────────────────────────────')
        lines.push(`Archivo: ${estudio.nombreArchivo}`)
        lines.push(`Fecha: ${estudio.creadoEn}`)
        lines.push(`Resultado: ${informe.etiquetaCarcinoma}`)
        lines.push(`Probabilidad de carcinoma: ${informe.porcentajeCarcinoma}%`)
        lines.push(`Severidad: ${informe.severidad}`)
        if (informe.patologiasRelevantes.length > 0) {
            lines.push('Patologías detectadas:')
            informe.patologiasRelevantes.forEach(p => {
                lines.push(`  • ${p.nombre}: ${p.porcentaje}%`)
            })
        }
        if (estudio.notas) lines.push(`Notas del médico: ${estudio.notas}`)
        lines.push('')
    }

    // ── Interpretación Clínica generada por Gemini ──────────────────────────
    if (geminiNarrative) {
        lines.push('── INTERPRETACIÓN CLÍNICA (IA) ───────────────────────')
        geminiNarrative.split('\n').forEach(l => lines.push(l))
        lines.push('')
    }

    const chatLines = messages.filter(m => !m.isStreaming && m.contenido.trim())
    if (chatLines.length > 0) {
        lines.push('── HISTORIAL DE CONSULTA ─────────────────────────────')
        chatLines.forEach(m => {
            const rol = m.rol === 'user' ? 'Médico' : 'Asistente IA'
            lines.push(`[${rol}]`)
            const words = m.contenido.split(' ')
            let current = ''
            words.forEach(w => {
                if ((current + ' ' + w).length > 90) {
                    lines.push(current.trim())
                    current = w
                } else {
                    current += ' ' + w
                }
            })
            if (current.trim()) lines.push(current.trim())
            lines.push('')
        })
    }

    lines.push('─────────────────────────────────────────────────────')
    lines.push('Documento generado automáticamente. No reemplaza el criterio clínico.')

    return lines
}

// ── Generación PDF ───────────────────────────────────────────────────────────

/**
 * Genera el PDF y devuelve { blob, filename }.
 * La descarga y el guardado los hace el llamador.
 */
async function buildPDF(
    paciente: Paciente | undefined,
    estudio: Estudio | undefined,
    informe: Estudio['informe'] | null,
    messages: readonly Mensaje[],
    geminiNarrative: string | null,
): Promise<{ blob: Blob; filename: string }> {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const lines = buildReportLines(paciente, estudio, informe, messages, geminiNarrative)

    const margin = 18
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    let y = margin

    // ─ Header con fondo ─
    doc.setFillColor(15, 30, 70)
    doc.rect(0, 0, pageW, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('Reporte Clínico — Asistente Médico IA', margin, 14)
    doc.setTextColor(30, 30, 30)
    y = 32

    for (const line of lines) {
        if (line.startsWith('REPORTE CLÍNICO') || line.startsWith('Generado:')) continue

        if (y > pageH - margin) {
            doc.addPage()
            y = margin
        }

        if (line.startsWith('──')) {
            doc.setFillColor(235, 240, 255)
            doc.rect(margin - 2, y - 4, pageW - (margin - 2) * 2, 7, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(9)
            doc.setTextColor(30, 60, 160)
            doc.text(line.replace(/──\s*/g, '').replace(/\s*──*/g, '').trim(), margin, y)
            doc.setTextColor(30, 30, 30)
            y += 8
        } else if (line === '') {
            y += 4
        } else if (line.startsWith('[Médico]') || line.startsWith('[Asistente IA]')) {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8.5)
            const isAI = line.includes('Asistente IA')
            doc.setTextColor(isAI ? 43 : 30, isAI ? 107 : 30, isAI ? 224 : 30)
            doc.text(line, margin, y)
            doc.setTextColor(30, 30, 30)
            y += 5
        } else if (line.startsWith('  •')) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.text(line, margin + 4, y)
            y += 5
        } else {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            const wrapped = doc.splitTextToSize(line, pageW - margin * 2)
            wrapped.forEach((wl: string) => {
                if (y > pageH - margin) { doc.addPage(); y = margin }
                doc.text(wl, margin, y)
                y += 5
            })
        }
    }

    const filename = `Informe_${paciente?.nombre?.replace(/\s+/g, '-') ?? 'sin-paciente'}_${Date.now()}.pdf`
    const blob = doc.output('blob')
    return { blob, filename }
}

// ── Generación DOCX ──────────────────────────────────────────────────────────

/**
 * Genera el DOCX y devuelve { blob, filename }.
 * La descarga y el guardado los hace el llamador.
 */
async function buildDOCX(
    paciente: Paciente | undefined,
    estudio: Estudio | undefined,
    informe: Estudio['informe'] | null,
    messages: readonly Mensaje[],
    geminiNarrative: string | null,
): Promise<{ blob: Blob; filename: string }> {
    const now = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })

    const paragraphs: Paragraph[] = []

    paragraphs.push(new Paragraph({
        text: 'Reporte Clínico — Asistente Médico IA',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
    }))
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: `Generado: ${now}`, color: '666666', size: 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
    }))

    function sectionHeader(title: string) {
        paragraphs.push(new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2B6BE0' } },
        }))
    }

    function row(label: string, value: string) {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({ text: `${label}: `, bold: true, size: 20 }),
                new TextRun({ text: value, size: 20 }),
            ],
            spacing: { after: 60 },
        }))
    }

    if (paciente) {
        sectionHeader('Paciente')
        row('Nombre', paciente.nombre)
        if (paciente.fechaNacimiento) row('Fecha de nacimiento', paciente.fechaNacimiento)
        if (paciente.notas) row('Notas', paciente.notas)
    }

    if (estudio && informe) {
        sectionHeader('Estudio Analizado')
        row('Archivo', estudio.nombreArchivo)
        row('Fecha', estudio.creadoEn)
        row('Resultado', informe.etiquetaCarcinoma)
        row('Probabilidad de carcinoma', `${informe.porcentajeCarcinoma}%`)
        row('Severidad', informe.severidad)
        if (informe.patologiasRelevantes.length > 0) {
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: 'Patologías detectadas:', bold: true, size: 20 })],
                spacing: { before: 60, after: 40 },
            }))
            informe.patologiasRelevantes.forEach(p => {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: `• ${p.nombre}: ${p.porcentaje}%`, size: 20 })],
                    indent: { left: 360 },
                    spacing: { after: 40 },
                }))
            })
        }
        if (estudio.notas) row('Notas del médico', estudio.notas)
    }

    if (geminiNarrative) {
        sectionHeader('Interpretación Clínica (IA)')
        const geminiLines = geminiNarrative.split('\n')
        for (const line of geminiLines) {
            const trimmed = line.trim()
            if (!trimmed) {
                paragraphs.push(new Paragraph({ spacing: { after: 80 } }))
                continue
            }
            const isSubsection = trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !trimmed.endsWith('.')
            if (isSubsection) {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: trimmed, bold: true, color: '1E3A8A', size: 20 })],
                    spacing: { before: 160, after: 60 },
                }))
            } else {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: trimmed, size: 20 })],
                    spacing: { after: 60 },
                }))
            }
        }
    }

    const chatMessages = messages.filter(m => !m.isStreaming && m.contenido.trim())
    if (chatMessages.length > 0) {
        sectionHeader('Historial de Consulta')
        chatMessages.forEach(m => {
            const isAI = m.rol === 'ai'
            const label = isAI ? 'Asistente IA' : 'Médico'
            paragraphs.push(new Paragraph({
                children: [
                    new TextRun({
                        text: `[${label}]  `,
                        bold: true,
                        color: isAI ? '2B6BE0' : '1E6E1E',
                        size: 19,
                    }),
                    new TextRun({ text: m.contenido, size: 19 }),
                ],
                spacing: { after: 120 },
            }))
        })
    }

    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: 'Documento generado automáticamente. No reemplaza el criterio clínico.',
            italics: true, color: '888888', size: 17,
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' } },
    }))

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Calibri', size: 20 },
                },
            },
        },
        sections: [{ children: paragraphs }],
    })

    const blob = await Packer.toBlob(doc)
    const filename = `Informe_${paciente?.nombre?.replace(/\s+/g, '-') ?? 'sin-paciente'}_${Date.now()}.docx`
    return { blob, filename }
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function ReportModal({ paciente, estudio, informe, messages, onClose }: ReportModalProps) {
    const [formato, setFormato] = useState<Formato>('pdf')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { guardar } = useDocumentosExportados()

    // Estado de la narrativa IA
    const [geminiNarrative, setGeminiNarrative] = useState<string | null>(null)
    const [geminiLoading, setGeminiLoading] = useState(false)
    const [geminiError, setGeminiError] = useState(false)

    // Generamos la narrativa al abrir el modal si hay un informe disponible
    useEffect(() => {
        if (!informe) return
        setGeminiLoading(true)
        setGeminiError(false)
        generateGeminiNarrative(informe, paciente, estudio)
            .then(narrative => {
                setGeminiNarrative(narrative)
                if (!narrative) setGeminiError(true)
            })
            .catch(() => setGeminiError(true))
            .finally(() => setGeminiLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Solo al montar

    async function handleDownload() {
        setLoading(true)
        setError(null)
        try {
            let blob: Blob
            let filename: string

            if (formato === 'pdf') {
                ;({ blob, filename } = await buildPDF(paciente, estudio, informe, messages, geminiNarrative))
            } else {
                ;({ blob, filename } = await buildDOCX(paciente, estudio, informe, messages, geminiNarrative))
            }

            // Descargar el archivo
            saveAs(blob, filename)

            // Guardar en el historial de Reportes.
            // Convertimos el blob a base64 (igual que imagenDataUrl en estudios)
            // para que la URL sobreviva recargas de página, a diferencia de
            // URL.createObjectURL() que muere cuando la pestaña se cierra.
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = () => reject(reader.error)
                reader.readAsDataURL(blob)
            })
            const tamanoKb = Math.round(blob.size / 1024)

            // Escribir directo a localStorage ANTES de cerrar el modal.
            // guardar() usa setDocumentos() cuyo callback es asíncrono en React:
            // si onClose() desmonta el componente primero, el update se cancela
            // y localStorage queda vacío.
            const STORAGE_KEY = 'documentos_exportados'
            const prevDocs: object[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
            const nuevoDoc = {
                id: crypto.randomUUID(),
                tipo: formato,
                nombreArchivo: filename,
                pacienteId: paciente?.id,
                estudioId: estudio?.id,
                tamanoKb,
                url: base64,
                creadoEn: new Date().toISOString(),
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify([nuevoDoc, ...prevDocs]))

            // También llamar guardar() para sincronizar el estado en memoria
            // si la página de Reportes ya está montada en el layout.
            guardar({
                tipo: formato,
                nombreArchivo: filename,
                pacienteId: paciente?.id,
                estudioId: estudio?.id,
                tamanoKb,
                url: base64,
            })

            onClose()
        } catch (e) {
            console.error(e)
            setError('Error al generar el reporte. Verifica que las dependencias estén instaladas.')
        } finally {
            setLoading(false)
        }
    }

    const hasContext = !!(paciente || estudio || informe)
    const chatCount = messages.filter(m => !m.isStreaming && m.contenido.trim()).length

    return (
        // Overlay
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
            }}
        >
            {/* Tarjeta */}
            <div style={{
                width: 360, background: 'var(--bg-1)',
                border: '1px solid var(--border-h)', borderRadius: 'var(--r16)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                overflow: 'hidden',
                animation: 'report-modal-in 0.18s ease both',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-2)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 'var(--r6)',
                            background: 'var(--accent)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                <path d="M8.5 1H3C2.45 1 2 1.45 2 2V12C2 12.55 2.45 13 3 13H11C11.55 13 12 12.55 12 12V4.5L8.5 1Z"
                                      stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M8.5 1V4.5H12" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="4.5" y1="7"  x2="9.5" y2="7"  stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="4.5" y1="9"  x2="9.5" y2="9"  stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                                <line x1="4.5" y1="11" x2="7"   y2="11" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)' }}>
                            Generar Reporte
                        </span>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: 'var(--t2)',
                        cursor: 'pointer', padding: 4,
                        display: 'flex', alignItems: 'center', borderRadius: 'var(--r4)',
                    }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                {/* Contenido */}
                <div style={{ padding: '16px' }}>

                    {/* Resumen de lo que incluirá */}
                    <div style={{
                        padding: '10px 12px', borderRadius: 'var(--r8)',
                        background: 'var(--bg-2)', border: '1px solid var(--border)',
                        marginBottom: 16,
                    }}>
                        <div style={{
                            fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                        }}>
                            Contenido del reporte
                        </div>
                        <IncludeRow icon="🧑‍⚕️" label="Datos del paciente"  active={!!paciente}  value={paciente?.nombre} />
                        <IncludeRow icon="🩻" label="Resultado del estudio" active={!!informe}   value={informe ? `${informe.porcentajeCarcinoma}%` : undefined} />
                        <IncludeRow icon="🤖" label="Interpretación IA"     active={!!geminiNarrative && !geminiLoading} value={geminiLoading ? 'cargando…' : geminiError ? 'no disponible' : undefined} />
                        <IncludeRow icon="💬" label="Historial de consulta" active={chatCount > 0} value={chatCount > 0 ? `${chatCount} mensajes` : undefined} />
                        {!hasContext && (
                            <p style={{ fontSize: 11, color: 'var(--t2)', margin: '6px 0 0' }}>
                                Sin contexto seleccionado. El reporte estará vacío.
                            </p>
                        )}
                    </div>

                    {/* Selector de formato */}
                    <div style={{
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
                    }}>
                        Formato de descarga
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <FormatBtn
                            label="PDF"
                            sublabel=".pdf"
                            icon={<PdfIcon />}
                            selected={formato === 'pdf'}
                            onClick={() => setFormato('pdf')}
                        />
                        <FormatBtn
                            label="Word"
                            sublabel=".docx"
                            icon={<WordIcon />}
                            selected={formato === 'docx'}
                            onClick={() => setFormato('docx')}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '8px 12px', borderRadius: 'var(--r8)',
                            background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.3)',
                            fontSize: 11, color: '#e05555', marginBottom: 12,
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onClose} style={{
                            flex: 1, height: 36, borderRadius: 'var(--r8)',
                            background: 'transparent', border: '1px solid var(--border)',
                            color: 'var(--t1)', fontSize: 12, cursor: 'pointer',
                            transition: 'all var(--ta)',
                        }}>
                            Cancelar
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={loading || geminiLoading}
                            style={{
                                flex: 2, height: 36, borderRadius: 'var(--r8)',
                                background: (loading || geminiLoading) ? 'var(--bg-3)' : 'var(--accent)',
                                border: 'none',
                                color: (loading || geminiLoading) ? 'var(--t2)' : '#fff',
                                fontSize: 12, fontWeight: 600,
                                cursor: (loading || geminiLoading) ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                transition: 'all var(--ta)',
                                boxShadow: (loading || geminiLoading) ? 'none' : 'var(--shadow-accent)',
                            }}
                        >
                            {geminiLoading ? (
                                <>
                                    <SpinnerIcon />
                                    Preparando análisis IA…
                                </>
                            ) : loading ? (
                                <>
                                    <SpinnerIcon />
                                    Generando…
                                </>
                            ) : (
                                <>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                        <path d="M6 1V8M6 8L3.5 5.5M6 8L8.5 5.5"
                                              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M1 10H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                    Descargar {formato.toUpperCase()}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes report-modal-in {
                    from { opacity: 0; transform: scale(0.95) translateY(8px); }
                    to   { opacity: 1; transform: none; }
                }
            `}</style>
        </div>
    )
}

// ── Subcomponentes ───────────────────────────────────────────────────────────

function IncludeRow({ icon, label, active, value }: {
    icon: string; label: string; active: boolean; value?: string
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 0',
        }}>
            <span style={{ fontSize: 13 }}>{icon}</span>
            <span style={{ fontSize: 11, color: active ? 'var(--t0)' : 'var(--t3)', flex: 1 }}>{label}</span>
            {active && value && (
                <span style={{
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)',
                    background: 'var(--accent-glow)', padding: '2px 6px', borderRadius: 4,
                }}>
                    {value}
                </span>
            )}
            {!active && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t3)' }}>
                    —
                </span>
            )}
        </div>
    )
}

function FormatBtn({ label, sublabel, icon, selected, onClick }: {
    label: string; sublabel: string; icon: React.ReactNode; selected: boolean; onClick: () => void
}) {
    return (
        <button onClick={onClick} style={{
            flex: 1, padding: '10px 12px', borderRadius: 'var(--r8)',
            background: selected ? 'var(--accent-glow)' : 'var(--bg-2)',
            border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all var(--ta)',
        }}>
            {icon}
            <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: selected ? 'var(--accent)' : 'var(--t0)' }}>{label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--t2)' }}>{sublabel}</div>
            </div>
        </button>
    )
}

function PdfIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="1" width="13" height="17" rx="2" fill="#e53e3e" opacity="0.15"/>
            <rect x="2" y="1" width="13" height="17" rx="2" stroke="#e53e3e" strokeWidth="1.2"/>
            <path d="M9 1v4.5H13" stroke="#e53e3e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="9"  x2="12" y2="9"  stroke="#e53e3e" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="11" x2="12" y2="11" stroke="#e53e3e" strokeWidth="1" strokeLinecap="round"/>
            <line x1="5" y1="13" x2="9"  y2="13" stroke="#e53e3e" strokeWidth="1" strokeLinecap="round"/>
        </svg>
    )
}

function WordIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="1" width="13" height="17" rx="2" fill="#2b6be0" opacity="0.15"/>
            <rect x="2" y="1" width="13" height="17" rx="2" stroke="#2b6be0" strokeWidth="1.2"/>
            <path d="M9 1v4.5H13" stroke="#2b6be0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <text x="4.5" y="15" fontFamily="helvetica" fontSize="7" fontWeight="bold" fill="#2b6be0">W</text>
        </svg>
    )
}

function SpinnerIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 8" strokeLinecap="round"/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
    )
}