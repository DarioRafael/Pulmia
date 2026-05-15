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

import { useState, useEffect, useRef } from 'react'
import type React from 'react'
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
    readonly documentoClinico?: string | null
    readonly nombreDocumento?: string | null
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
    documentoClinico?: string | null,
    nombreDocumento?: string | null,
): Promise<string | null> {
    const patologiasStr = informe.patologiasRelevantes.length > 0
        ? informe.patologiasRelevantes
            .map(p => `${p.nombre} (${p.porcentaje}%)`)
            .join(', ')
        : 'Ninguna por encima del umbral'

    const pacienteInfo = paciente
        ? `Nombre: ${paciente.nombre}${paciente.fechaNacimiento ? `, Fecha de nacimiento: ${paciente.fechaNacimiento}` : ''}${paciente.notas ? `, Notas: ${paciente.notas}` : ''}`
        : 'No especificado'

    const documentoSection = documentoClinico
        ? `\nDOCUMENTO CLÍNICO ADJUNTO (${nombreDocumento ?? 'sin nombre'}):\n"""\n${documentoClinico.slice(0, 6000)}\n"""\nUsa este documento para extraer o completar datos del paciente (nombre, edad, antecedentes, diagnósticos previos, medicamentos, alergias, etc.) que no estén en los campos anteriores. Si hay datos contradictorios, prioriza los del documento.\n`
        : ''

    const prompt = `Eres un radiólogo clínico experto redactando un informe médico formal para un expediente clínico. Redacta en español, con terminología médica precisa y en tercera persona.

DATOS DEL ANÁLISIS:${documentoSection}
- Paciente: ${pacienteInfo}
- Archivo analizado: ${estudio?.nombreArchivo ?? 'No especificado'}
- Fecha del estudio: ${estudio?.creadoEn ?? 'No especificada'}
- Resultado del modelo de IA: ${informe.etiquetaCarcinoma}
- Probabilidad de carcinoma calculada: ${informe.porcentajeCarcinoma}%
- Nivel de severidad asignado: ${informe.severidad}
- Patologías con mayor relevancia estadística: ${patologiasStr}
${estudio?.notas ? `- Observaciones del médico solicitante: ${estudio.notas}` : ''}

Genera EXACTAMENTE las siguientes secciones en orden, separadas por una línea en blanco. Usa SOLO texto plano sin Markdown, asteriscos ni símbolos especiales. Cada título de sección debe ir en su propia línea, en MAYÚSCULAS. El contenido de cada sección debe tener entre 4 y 6 oraciones con profundidad clínica real — interpreta los datos, no los repitas literalmente. NO uses listas con guiones ni viñetas dentro del cuerpo; redacta en prosa fluida. Es OBLIGATORIO completar TODAS las secciones sin excepción.

${documentoClinico ? `DATOS EXTRAÍDOS DEL DOCUMENTO CLÍNICO ADJUNTO
Extrae y presenta en prosa los datos clínicos del paciente contenidos en el documento adjunto: nombre completo, edad, fecha de nacimiento, antecedentes patológicos personales y familiares, medicamentos actuales, alergias documentadas, estudios previos relevantes y cualquier diagnóstico previo pertinente. Si el documento no contiene información adicional más allá de la ya registrada, indícalo explícitamente.

` : ''}DESCRIPCIÓN DE HALLAZGOS RADIOLÓGICOS
Describe detalladamente los hallazgos imagenológicos identificados por el modelo de análisis automatizado. Incluye su localización anatómica probable, características morfológicas (tamaño estimado, densidad, márgenes, distribución), y la coexistencia de condiciones asociadas. Contextualiza la probabilidad estadística reportada en términos de su relevancia clínica y menciona cómo los hallazgos secundarios complementan o modulan la interpretación del hallazgo principal.

DIAGNÓSTICO DIFERENCIAL Y CORRELACIÓN CLÍNICA
Plantea los diagnósticos diferenciales más probables en orden descendente de probabilidad, justificando cada uno con base en los hallazgos radiológicos y los datos clínicos disponibles. Analiza si la probabilidad de carcinoma reportada por el modelo es concordante con el patrón de hallazgos acompañantes o si existe discordancia que requiera consideración adicional. Señala qué características favorecen o contraindican cada diagnóstico diferencial.

CLASIFICACIÓN DE URGENCIA Y PRIORIDAD DE ATENCIÓN
Clasifica el caso como URGENTE, PRIORITARIO o RUTINARIO. Justifica la clasificación considerando la probabilidad de malignidad, la severidad de los hallazgos, el riesgo de deterioro clínico si se retrasa la atención, y las implicaciones pronósticas de un diagnóstico tardío. Indica el tiempo máximo recomendado para la intervención o seguimiento según la clasificación asignada.

PLAN DE ESTUDIO Y MANEJO RECOMENDADO
Describe en prosa los estudios complementarios y acciones clínicas recomendadas en orden de prioridad, especificando la modalidad exacta de cada uno (por ejemplo: tomografía computarizada de tórax de alta resolución con contraste, broncoscopía flexible con biopsia transbronquial, ecocardiograma transtorácico, PET-CT con FDG). Para cada estudio, explica qué información adicional aportaría y cómo contribuiría a confirmar o descartar los diagnósticos diferenciales planteados. Incluye también recomendaciones de interconsulta con especialidades relevantes.

CONSIDERACIONES CLÍNICAS ESPECIALES
Señala factores específicos del caso que pueden influir en la interpretación del modelo o en las decisiones clínicas: limitaciones técnicas del estudio, comorbilidades que podrían modificar el manejo, características del paciente que elevan o reducen el riesgo, y aspectos que el especialista debe ponderar antes de tomar decisiones terapéuticas. Menciona si existen condiciones que podrían generar falsos positivos o negativos en el análisis automatizado.

RESUMEN EJECUTIVO
Resume en 3 a 4 oraciones los puntos más relevantes del caso: hallazgo principal, probabilidad de malignidad, clasificación de urgencia y acción más prioritaria recomendada. Este resumen está dirigido al médico tratante para una revisión rápida del caso.

NOTA DE VALIDACIÓN
Este informe fue generado mediante análisis automatizado por inteligencia artificial y tiene carácter orientativo. Debe ser revisado, validado e interpretado por un médico especialista certificado antes de tomar cualquier decisión clínica, diagnóstica o terapéutica. El modelo de IA no sustituye el juicio clínico del profesional de la salud responsable del paciente.`

    try {
        // Las API keys viven en el servidor (AI_API_KEY_1/2/3 sin prefijo NEXT_PUBLIC).
        // El cliente nunca puede acceder a ellas directamente — delegamos al backend.
        // IMPORTANTE: el handler PUT de /api/chat debe respetar max_tokens del body.
        // Si lo hardcodea a 1000, la narrativa se corta. Mínimo recomendado: 4096.
        const response = await fetch('/api/chat', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, max_tokens: 4096 }),
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
    _messages: readonly Mensaje[],
    geminiNarrative: string | null,
    nombreDocumento?: string | null,
): string[] {
    const lines: string[] = []
    const now = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })
    const folio = `RPT-${Date.now().toString(36).toUpperCase()}`

    // ── Encabezado ──
    lines.push('REPORTE CLÍNICO — ASISTENTE MÉDICO IA')
    lines.push(`Folio: ${folio}`)
    lines.push(`Fecha de generación: ${now}`)
    lines.push('CONFIDENCIAL — USO EXCLUSIVO DEL PERSONAL MÉDICO AUTORIZADO')
    lines.push('')

    // ── Datos del Paciente ──
    if (paciente) {
        lines.push('── I. DATOS DEL PACIENTE ────────────────────────────')
        lines.push(`Nombre completo: ${paciente.nombre}`)
        if (paciente.fechaNacimiento) lines.push(`Fecha de nacimiento: ${paciente.fechaNacimiento}`)
        if (paciente.notas) lines.push(`Antecedentes / Notas clínicas: ${paciente.notas}`)
        if (nombreDocumento) lines.push(`Documento clínico adjunto: ${nombreDocumento}`)
        lines.push('')
    }

    // ── Datos del Estudio ──
    if (estudio && informe) {
        lines.push('── II. DATOS DEL ESTUDIO ANALIZADO ──────────────────')
        lines.push(`Archivo de imagen: ${estudio.nombreArchivo}`)
        lines.push(`Fecha de realización: ${estudio.creadoEn}`)
        lines.push(`Identificador de estudio: ${estudio.id ?? '—'}`)
        lines.push('')

        lines.push('── III. RESULTADOS DEL ANÁLISIS ─────────────────────')
        lines.push(`Diagnóstico del modelo: ${informe.etiquetaCarcinoma}`)
        lines.push(`Probabilidad de carcinoma: ${informe.porcentajeCarcinoma}%`)
        lines.push(`Nivel de severidad: ${informe.severidad}`)

        if (informe.patologiasRelevantes.length > 0) {
            lines.push('')
            lines.push('Patologías detectadas con relevancia estadística:')
            informe.patologiasRelevantes.forEach(p => {
                lines.push(`  • ${p.nombre}: ${p.porcentaje}%`)
            })
        }

        if (estudio.notas) {
            lines.push('')
            lines.push(`Observaciones del médico solicitante: ${estudio.notas}`)
        }
        lines.push('')
    }

    // ── Interpretación IA ──
    if (geminiNarrative) {
        lines.push('── IV. ANÁLISIS CLÍNICO GENERADO POR IA ─────────────')
        geminiNarrative.split('\n').forEach(l => lines.push(l))
        lines.push('')
    }

    // ── Pie de documento ──
    lines.push('─────────────────────────────────────────────────────')
    lines.push(`Folio: ${folio}  |  Generado: ${now}`)
    lines.push('Este documento fue generado automáticamente. No reemplaza el criterio clínico del médico especialista.')

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
    _messages: readonly Mensaje[],
    geminiNarrative: string | null,
    nombreDocumento?: string | null,
): Promise<{ blob: Blob; filename: string }> {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const lines = buildReportLines(paciente, estudio, informe, _messages, geminiNarrative, nombreDocumento)
    const now = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })
    const folio = lines.find(l => l.startsWith('Folio:'))?.replace('Folio: ', '') ?? ''

    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const marginL = 20
    const marginR = 20
    const contentW = pageW - marginL - marginR

    // ── Helper: agregar número de página y pie en cada hoja ──
    function drawPageChrome(pageNum: number) {
        // Banda superior azul oscuro
        doc.setFillColor(10, 25, 60)
        doc.rect(0, 0, pageW, 18, 'F')
        // Línea acento azul claro
        doc.setFillColor(43, 107, 224)
        doc.rect(0, 18, pageW, 1.2, 'F')

        // Título en header
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9.5)
        doc.setTextColor(255, 255, 255)
        doc.text('REPORTE CLÍNICO — ASISTENTE MÉDICO IA', marginL, 11.5)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(160, 185, 230)
        doc.text(`CONFIDENCIAL`, pageW - marginR, 11.5, { align: 'right' })

        // Pie de página
        doc.setFillColor(245, 247, 252)
        doc.rect(0, pageH - 12, pageW, 12, 'F')
        doc.setDrawColor(210, 218, 235)
        doc.setLineWidth(0.3)
        doc.line(0, pageH - 12, pageW, pageH - 12)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(130, 140, 160)
        doc.text(`Folio: ${folio}`, marginL, pageH - 5)
        doc.text(`Generado: ${now}`, pageW / 2, pageH - 5, { align: 'center' })
        doc.text(`Página ${pageNum}`, pageW - marginR, pageH - 5, { align: 'right' })
    }

    let pageNum = 1
    drawPageChrome(pageNum)
    let y = 26

    // ── Bloque de resumen superior (metadatos clave) ──
    if (paciente || informe) {
        doc.setFillColor(237, 242, 255)
        doc.setDrawColor(180, 200, 245)
        doc.setLineWidth(0.3)
        doc.roundedRect(marginL, y, contentW, paciente && informe ? 22 : 12, 2, 2, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(30, 60, 140)
        let colX = marginL + 4
        if (paciente) {
            doc.text('PACIENTE', colX, y + 5)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(30, 30, 50)
            doc.setFontSize(9)
            doc.text(paciente.nombre, colX, y + 10.5)
            if (paciente.fechaNacimiento) {
                doc.setFontSize(7.5)
                doc.setTextColor(80, 90, 110)
                doc.text(`Nac. ${paciente.fechaNacimiento}`, colX, y + 15.5)
            }
            colX += 70
        }
        if (informe) {
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(30, 60, 140)
            doc.text('RESULTADO DEL ANÁLISIS', colX, y + 5)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(30, 30, 50)
            doc.text(informe.etiquetaCarcinoma, colX, y + 10.5)
            doc.setFontSize(7.5)
            doc.setTextColor(80, 90, 110)
            doc.text(`Probabilidad: ${informe.porcentajeCarcinoma}%  |  Severidad: ${informe.severidad}`, colX, y + 15.5)
        }
        y += (paciente && informe ? 22 : 12) + 6
    }

    // ── Renderizar líneas del reporte ──
    for (const line of lines) {
        // Saltar las líneas del encabezado ya renderizadas
        if (
            line.startsWith('REPORTE CLÍNICO') ||
            line.startsWith('Folio:') ||
            line.startsWith('Fecha de generación:') ||
            line.startsWith('CONFIDENCIAL —') ||
            line.startsWith('Nombre completo:') ||
            line.startsWith('Fecha de nacimiento:') ||
            (line.startsWith('Folio:') && line.includes('Generado:'))
        ) continue

        // Nueva página si no cabe
        const checkAndPage = (needed = 6) => {
            if (y + needed > pageH - 15) {
                doc.addPage()
                pageNum++
                drawPageChrome(pageNum)
                y = 26
            }
        }
        checkAndPage()

        // Sección principal (──)
        if (line.startsWith('──')) {
            checkAndPage(12)
            const title = line.replace(/──\s*/g, '').replace(/\s*─+/g, '').trim()
            doc.setFillColor(10, 25, 60)
            doc.rect(marginL, y - 3, 2.5, 8, 'F')
            doc.setFillColor(237, 242, 255)
            doc.rect(marginL + 2.5, y - 3, contentW - 2.5, 8, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8.5)
            doc.setTextColor(10, 25, 60)
            doc.text(title, marginL + 6, y + 1.8)
            doc.setTextColor(30, 30, 30)
            y += 10

            // Línea separadora final
        } else if (line.startsWith('─────')) {
            checkAndPage(6)
            doc.setDrawColor(200, 210, 230)
            doc.setLineWidth(0.4)
            doc.line(marginL, y, pageW - marginR, y)
            y += 5

            // Pie de documento (última línea)
        } else if (line.includes('No reemplaza el criterio clínico')) {
            checkAndPage(8)
            doc.setFillColor(255, 248, 230)
            doc.setDrawColor(230, 180, 60)
            doc.setLineWidth(0.3)
            doc.roundedRect(marginL, y - 1, contentW, 8, 1.5, 1.5, 'FD')
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(7.5)
            doc.setTextColor(120, 80, 0)
            doc.text(line, marginL + 3, y + 4)
            y += 10

            // Línea en blanco
        } else if (line === '') {
            y += 3.5

            // Subsecciones en MAYÚSCULAS (títulos de secciones IA)
        } else if (
            line === line.toUpperCase() &&
            line.length > 6 &&
            !line.endsWith('.') &&
            !line.includes(':') &&
            !line.startsWith('  ')
        ) {
            checkAndPage(9)
            doc.setFillColor(230, 236, 255)
            doc.rect(marginL, y - 2.5, contentW, 6.5, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(30, 60, 160)
            doc.text(line, marginL + 3, y + 2)
            doc.setTextColor(30, 30, 30)
            y += 9

            // Campos clave (Label: valor)
        } else if (line.includes(':') && !line.startsWith('  ') && line.split(':')[0].length < 50) {
            checkAndPage(6)
            const colonIdx = line.indexOf(':')
            const label = line.substring(0, colonIdx).trim()
            const value = line.substring(colonIdx + 1).trim()
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8.5)
            doc.setTextColor(40, 50, 80)
            const labelW = doc.getTextWidth(`${label}: `)
            doc.text(`${label}: `, marginL, y)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(30, 30, 30)
            const wrapped = doc.splitTextToSize(value, contentW - labelW)
            doc.text(wrapped[0] ?? '', marginL + labelW, y)
            y += 5
            for (let i = 1; i < wrapped.length; i++) {
                checkAndPage(5)
                doc.text(wrapped[i], marginL + labelW, y)
                y += 5
            }

            // Viñetas
        } else if (line.startsWith('  •')) {
            checkAndPage(5)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8.5)
            doc.setTextColor(43, 107, 224)
            doc.text('•', marginL + 4, y)
            doc.setTextColor(30, 30, 30)
            const text = line.replace('  •', '').trim()
            const wrapped = doc.splitTextToSize(text, contentW - 10)
            wrapped.forEach((wl: string, i: number) => {
                checkAndPage(5)
                doc.text(wl, marginL + 8, y)
                if (i < wrapped.length - 1) y += 5
            })
            y += 5

            // Texto normal (prosa IA)
        } else {
            checkAndPage(5)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(30, 30, 30)
            const wrapped = doc.splitTextToSize(line, contentW)
            wrapped.forEach((wl: string) => {
                checkAndPage(5)
                doc.text(wl, marginL, y)
                y += 5.2
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
    _messages: readonly Mensaje[],
    geminiNarrative: string | null,
    nombreDocumento?: string | null,
): Promise<{ blob: Blob; filename: string }> {
    const now = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })
    const folio = `RPT-${Date.now().toString(36).toUpperCase()}`

    const paragraphs: Paragraph[] = []

    // ── Encabezado principal ──
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'REPORTE CLÍNICO', bold: true, size: 32, color: '0A193C', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
    }))
    paragraphs.push(new Paragraph({
        children: [new TextRun({ text: 'Asistente Médico con Inteligencia Artificial', size: 22, color: '2B6BE0', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
    }))

    // Línea separadora decorativa
    paragraphs.push(new Paragraph({
        border: { bottom: { style: BorderStyle.THICK, size: 12, color: '0A193C' } },
        spacing: { after: 180 },
    }))

    // ── Bloque de metadatos del documento ──
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({ text: 'Folio: ', bold: true, size: 18, color: '444444' }),
            new TextRun({ text: folio, size: 18, color: '2B6BE0' }),
            new TextRun({ text: '   |   ', size: 18, color: 'AAAAAA' }),
            new TextRun({ text: 'Fecha: ', bold: true, size: 18, color: '444444' }),
            new TextRun({ text: now, size: 18, color: '444444' }),
        ],
        spacing: { after: 40 },
    }))
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: '⚠ DOCUMENTO CONFIDENCIAL — USO EXCLUSIVO DEL PERSONAL MÉDICO AUTORIZADO',
            bold: true, size: 16, color: 'B45309',
        })],
        spacing: { after: 280 },
    }))

    // ── Helper: cabecera de sección numerada ──
    function sectionHeader(num: string, title: string) {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({ text: `${num}. `, bold: true, size: 22, color: '2B6BE0' }),
                new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: '0A193C' }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 320, after: 100 },
            border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: '2B6BE0' },
                left: { style: BorderStyle.THICK, size: 18, color: '2B6BE0' },
            },
        }))
    }

    // ── Helper: fila label-valor ──
    function row(label: string, value: string) {
        paragraphs.push(new Paragraph({
            children: [
                new TextRun({ text: `${label}:`, bold: true, size: 20, color: '1E3A8A' }),
                new TextRun({ text: `  ${value}`, size: 20, color: '111827' }),
            ],
            spacing: { after: 80 },
        }))
    }

    // ── Helper: subsección IA ──
    function aiSubsection(title: string) {
        paragraphs.push(new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 20, color: '1E3A8A' })],
            spacing: { before: 200, after: 80 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: '93C5FD' } },
        }))
    }

    // ── I. Datos del Paciente ──
    if (paciente) {
        sectionHeader('I', 'Datos del Paciente')
        row('Nombre completo', paciente.nombre)
        if (paciente.fechaNacimiento) row('Fecha de nacimiento', paciente.fechaNacimiento)
        if (paciente.notas) row('Antecedentes / Notas clínicas', paciente.notas)
        if (nombreDocumento) row('Documento clínico adjunto', nombreDocumento)
    }

    // ── II. Datos del Estudio ──
    if (estudio && informe) {
        sectionHeader('II', 'Datos del Estudio Analizado')
        row('Archivo de imagen', estudio.nombreArchivo)
        row('Fecha de realización', estudio.creadoEn)
        if (estudio.id) row('Identificador de estudio', estudio.id)
    }

    // ── III. Resultados del Análisis ──
    if (informe) {
        sectionHeader('III', 'Resultados del Análisis Automatizado')
        row('Diagnóstico del modelo', informe.etiquetaCarcinoma)
        row('Probabilidad de carcinoma', `${informe.porcentajeCarcinoma}%`)
        row('Nivel de severidad asignado', informe.severidad)

        if (informe.patologiasRelevantes.length > 0) {
            paragraphs.push(new Paragraph({
                children: [new TextRun({ text: 'Patologías detectadas con relevancia estadística:', bold: true, size: 20, color: '1E3A8A' })],
                spacing: { before: 120, after: 60 },
            }))
            informe.patologiasRelevantes.forEach(p => {
                paragraphs.push(new Paragraph({
                    children: [
                        new TextRun({ text: `${p.nombre}`, bold: true, size: 19, color: '1E3A8A' }),
                        new TextRun({ text: `  —  ${p.porcentaje}%`, size: 19, color: '374151' }),
                    ],
                    indent: { left: 480 },
                    spacing: { after: 60 },
                    bullet: { level: 0 },
                }))
            })
        }

        if (estudio?.notas) {
            paragraphs.push(new Paragraph({ spacing: { after: 80 } }))
            row('Observaciones del médico solicitante', estudio.notas)
        }
    }

    // ── IV. Análisis Clínico IA ──
    if (geminiNarrative) {
        sectionHeader('IV', 'Análisis Clínico Generado por Inteligencia Artificial')

        const geminiLines = geminiNarrative.split('\n')
        for (const line of geminiLines) {
            const trimmed = line.trim()
            if (!trimmed) {
                paragraphs.push(new Paragraph({ spacing: { after: 100 } }))
                continue
            }
            const isSubsection = trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !trimmed.endsWith('.')
            if (isSubsection) {
                aiSubsection(trimmed)
            } else {
                paragraphs.push(new Paragraph({
                    children: [new TextRun({ text: trimmed, size: 20, color: '111827' })],
                    spacing: { after: 80 },
                }))
            }
        }
    }

    // ── Pie / Aviso legal ──
    paragraphs.push(new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB' } },
        spacing: { before: 480 },
    }))
    paragraphs.push(new Paragraph({
        children: [new TextRun({
            text: 'AVISO IMPORTANTE: Este informe fue generado mediante análisis automatizado por inteligencia artificial y tiene carácter orientativo. Debe ser revisado, validado e interpretado por un médico especialista certificado antes de tomar cualquier decisión clínica, diagnóstica o terapéutica.',
            italics: true, size: 16, color: '6B7280',
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
    }))
    paragraphs.push(new Paragraph({
        children: [
            new TextRun({ text: `Folio: ${folio}  |  `, size: 15, color: '9CA3AF' }),
            new TextRun({ text: `Generado: ${now}`, size: 15, color: '9CA3AF' }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
    }))

    const doc = new Document({
        styles: {
            default: {
                document: { run: { font: 'Calibri', size: 20, color: '111827' } },
            },
        },
        sections: [{ children: paragraphs }],
    })

    const blob = await Packer.toBlob(doc)
    const filename = `Informe_${paciente?.nombre?.replace(/\s+/g, '-') ?? 'sin-paciente'}_${Date.now()}.docx`
    return { blob, filename }
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function ReportModal({ paciente, estudio, informe, messages, documentoClinico, nombreDocumento, onClose }: ReportModalProps) {
    const [formato, setFormato] = useState<Formato>('pdf')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { guardar } = useDocumentosExportados()

    // Estado de la narrativa IA
    const [geminiNarrative, setGeminiNarrative] = useState<string | null>(null)
    const [geminiLoading, setGeminiLoading] = useState(false)
    const [geminiError, setGeminiError] = useState(false)

    // Guardamos las props en refs para poder leerlas dentro del efecto
    // sin necesidad de incluirlas como dependencias (no queremos regenerar
    // la narrativa cada vez que paciente/estudio/informe cambian — solo
    // cuando el médico adjunta un nuevo documento clínico).
    const informeRef       = useRef(informe)
    const pacienteRef      = useRef(paciente)
    const estudioRef       = useRef(estudio)
    const nombreDocRef     = useRef(nombreDocumento)
    informeRef.current     = informe
    pacienteRef.current    = paciente
    estudioRef.current     = estudio
    nombreDocRef.current   = nombreDocumento

    useEffect(() => {
        if (!informeRef.current) return
        setGeminiLoading(true)
        setGeminiError(false)
        setGeminiNarrative(null)
        generateGeminiNarrative(
            informeRef.current,
            pacienteRef.current,
            estudioRef.current,
            documentoClinico,
            nombreDocRef.current,
        )
            .then(narrative => {
                setGeminiNarrative(narrative)
                if (!narrative) setGeminiError(true)
            })
            .catch(() => setGeminiError(true))
            .finally(() => setGeminiLoading(false))
    }, [documentoClinico]) // Re-genera solo cuando cambia el documento adjunto

    async function handleDownload() {
        setLoading(true)
        setError(null)
        try {
            let blob: Blob
            let filename: string

            if (formato === 'pdf') {
                ;({ blob, filename } = await buildPDF(paciente, estudio, informe, messages, geminiNarrative, nombreDocumento))
            } else {
                ;({ blob, filename } = await buildDOCX(paciente, estudio, informe, messages, geminiNarrative, nombreDocumento))
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
                        <IncludeRow icon="️" label="Datos del paciente"  active={!!paciente}  value={paciente?.nombre} />
                        <IncludeRow icon="" label="Resultado del estudio" active={!!informe}   value={informe ? `${informe.porcentajeCarcinoma}%` : undefined} />
                        <IncludeRow icon="" label="Documento clínico"     active={!!documentoClinico} value={nombreDocumento ?? undefined} />
                        <IncludeRow icon="" label="Interpretación IA"     active={!!geminiNarrative && !geminiLoading} value={geminiLoading ? 'cargando…' : geminiError ? 'no disponible' : undefined} />
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