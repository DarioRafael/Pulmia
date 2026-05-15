'use client'

// Vista completa del chat clínico.
// Se usa tanto en la ruta dedicada (/estudios/[id]/chat) como dentro del
// ChatBubble expandido. Contiene todo el flujo: historial, input, streaming.
// Ahora incluye selector de contexto (paciente + estudio) para dar info
// detallada basada en datos reales.
//
// NUEVO: genera reporte PDF/Word desde el botón de la barra o cuando el
// usuario escribe frases como "genera un reporte", "generar informe", etc.
//
// NUEVO: el médico puede adjuntar documentos PDF o Word (.docx) con datos
// clínicos del paciente. El texto extraído se inyecta como contexto adicional
// en el sistema, enriqueciendo las respuestas y los reportes generados.

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ListaMensajes } from './lista-mensajes'
import { BarraInput } from './barra-input'
import { SelectorContexto } from './selector-contexto'
import { ReportModal } from './report-modal'
import { useChat } from '../hooks/use-chat'
import { streamChat } from '../api'
import { usePacientes } from '@/features/pacientes'
import { useEstudios } from '@/features/estudios'
import { useInformeActivo } from '@/features/analisis/informe-activo-context'
import type { BloqueContenido, MensajeHistorial, Mensaje } from '../tipos'
import type { Estudio, Paciente } from '@/lib/tipos'

// ── Frases que disparan la generación de reporte ─────────────────────────────
const REPORT_TRIGGERS = [
    /gen[ae]r[ae]?\s+(un\s+)?reporte/i,
    /gen[ae]r[ae]?\s+(un\s+)?informe/i,
    /crea\s+(un\s+)?reporte/i,
    /crea\s+(un\s+)?informe/i,
    /exporta?\s+(el\s+)?reporte/i,
    /exporta?\s+(el\s+)?informe/i,
    /descarga\s+(el\s+)?reporte/i,
    /quiero\s+(un\s+)?reporte/i,
    /dame\s+(un\s+)?reporte/i,
    /dame\s+(un\s+)?informe/i,
]

function isReportRequest(text: string): boolean {
    return REPORT_TRIGGERS.some(r => r.test(text))
}

// ── Extracción de texto de documentos adjuntos ───────────────────────────────

/**
 * Extrae texto plano de un archivo PDF usando pdf.js (dinámico).
 * Devuelve el texto concatenado de todas las páginas.
 */
async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    // Importación dinámica para no penalizar el bundle inicial
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pages: string[] = []
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = (content.items as unknown as { str?: string }[])
            .map(item => item.str ?? '')
            .join(' ')
        pages.push(pageText)
    }
    return pages.join('\n\n').trim()
}

/**
 * Extrae texto plano de un archivo Word (.docx) usando mammoth.js (dinámico).
 */
async function extractTextFromDOCX(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.trim()
}

/**
 * Detecta el tipo de documento por extensión/mime y extrae su texto.
 * Devuelve null si el formato no es soportado.
 */
async function extractDocumentText(file: File): Promise<string | null> {
    const name = file.name.toLowerCase()
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        return extractTextFromPDF(file)
    }
    if (
        name.endsWith('.docx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        return extractTextFromDOCX(file)
    }
    return null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ChatViewProps {
    readonly compacto?: boolean
    readonly estudioIdInicial?: string
    readonly pacienteIdInicial?: string
}

function buildContentWithImage(text: string, base64: string, mime: string): BloqueContenido[] {
    const blocks: BloqueContenido[] = [
        { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
    ]
    if (text.trim()) blocks.push({ type: 'text', text })
    return blocks
}

function extractBase64FromDataUrl(dataUrl: string): { data: string; mime: string } {
    const [header, data] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
    return { data, mime }
}

// Serializa una fila del historial de estudios para el contexto del LLM.
// `estudioFocalId` indica cuál marcar como seleccionado (solo en modo paciente+estudio).
function formatearFilaEstudio(e: Estudio, i: number, estudioFocalId?: string): string[] {
    const sufijo = estudioFocalId && e.id === estudioFocalId ? ' ← ESTUDIO SELECCIONADO' : ''
    const filas: string[] = [
        `  ${i + 1}. ${e.nombreArchivo} (${e.creadoEn})${sufijo}`,
        `     Resultado: ${e.informe.etiquetaCarcinoma} — ${e.informe.porcentajeCarcinoma}% carcinoma — Severidad: ${e.informe.severidad}`,
    ]
    if (e.informe.patologiasRelevantes.length > 0) {
        const pats = e.informe.patologiasRelevantes.map(p => `${p.nombre}:${p.porcentaje}%`).join(', ')
        filas.push(`     Patologías: ${pats}`)
    }
    if (e.notas) filas.push(`     Notas: ${e.notas}`)
    return filas
}

// Serializa el detalle ampliado de un estudio (bloque [ESTUDIO SELECCIONADO EN DETALLE]).
function formatearDetalleEstudio(e: Estudio, encabezado: string): string[] {
    const filas: string[] = [
        `\n[${encabezado}: ${e.nombreArchivo}]`,
        `Fecha: ${e.creadoEn}`,
        `Resultado: ${e.informe.etiquetaCarcinoma}`,
        `Probabilidad de carcinoma: ${e.informe.porcentajeCarcinoma}%`,
        `Severidad: ${e.informe.severidad}`,
    ]
    if (e.informe.patologiasRelevantes.length > 0) {
        filas.push('Patologías detectadas:')
        e.informe.patologiasRelevantes.forEach(p => filas.push(`  - ${p.nombre}: ${p.porcentaje}%`))
    }
    if (e.notas) filas.push(`Notas del médico: ${e.notas}`)
    return filas
}

function buildContextBlock(
    paciente: Paciente | undefined,
    estudio: Estudio | undefined,
    estudiosDelPaciente: readonly Estudio[],
    documentoClinico: string | null,
): string {
    const partes: string[] = []

    if (paciente) {
        partes.push(`[CONTEXTO - Paciente: ${paciente.nombre}]`)
        if (paciente.fechaNacimiento) partes.push(`Fecha de nacimiento: ${paciente.fechaNacimiento}`)
        if (paciente.notas) partes.push(`Notas del paciente: ${paciente.notas}`)
        partes.push(`Total de estudios: ${estudiosDelPaciente.length}`)

        if (estudio) {
            // Modo paciente + estudio específico: historial completo marcando el focal
            if (estudiosDelPaciente.length > 0) {
                partes.push('\nHistorial de estudios del paciente:')
                estudiosDelPaciente.forEach((e, i) =>
                    partes.push(...formatearFilaEstudio(e, i, estudio.id))
                )
            }
            // Detalle ampliado del estudio seleccionado
            partes.push(...formatearDetalleEstudio(estudio, 'ESTUDIO SELECCIONADO EN DETALLE'))
        } else {
            // Modo paciente sin estudio específico: todos los estudios sin marcar focal
            if (estudiosDelPaciente.length > 0) {
                partes.push('\nHistorial completo de estudios (sin filtro de estudio):')
                estudiosDelPaciente.forEach((e, i) =>
                    partes.push(...formatearFilaEstudio(e, i))
                )
            } else {
                partes.push('Este paciente no tiene estudios registrados aún.')
            }
        }
    } else if (estudio) {
        // Modo estudio sin paciente (acceso directo por URL o estudio inicial)
        partes.push(...formatearDetalleEstudio(estudio, 'CONTEXTO - Estudio'))
    }

    // Documento clínico adjunto por el médico (PDF o Word)
    if (documentoClinico) {
        partes.push('\n[DOCUMENTO CLÍNICO ADJUNTO POR EL MÉDICO]')
        partes.push('El siguiente texto fue extraído de un documento proporcionado por el médico. Úsalo como contexto adicional del paciente para enriquecer tu interpretación y el reporte:')
        partes.push('---')
        // Limitar a 6000 caracteres para no saturar el contexto del LLM
        const extracto = documentoClinico.length > 6000
            ? documentoClinico.slice(0, 6000) + '\n[... documento truncado por longitud ...]'
            : documentoClinico
        partes.push(extracto)
        partes.push('---')
    }

    return partes.join('\n')
}

// ── Componente principal ─────────────────────────────────────────────────────

export function ChatView({ compacto, estudioIdInicial, pacienteIdInicial }: ChatViewProps) {
    const storageKey = estudioIdInicial
        ? `estudio:${estudioIdInicial}`
        : pacienteIdInicial
            ? `paciente:${pacienteIdInicial}`
            : 'general'

    const {
        messages, isTyping, status,
        addMessage, startStream, appendChunk, endStream, attachGradcam,
        showTyping, hideTyping,
    } = useChat(storageKey)

    const { pacientes } = usePacientes()
    const { estudios } = useEstudios()
    const { informeActivo } = useInformeActivo()

    const params = useParams()
    const idDeUrl = typeof params?.id === 'string' ? params.id : null

    const [pacienteId, setPacienteId] = useState<string | null>(pacienteIdInicial ?? null)
    const [estudioIdManual, setEstudioIdManual] = useState<string | null>(null)

    // Si hay un paciente seleccionado manualmente, el estudio sólo puede venir
    // de estudioIdManual (elegido por el usuario en el selector). La URL o el
    // estudioIdInicial no deben inyectarse como contexto cuando hay un paciente
    // activo, ya que podrían pertenecer a otro paciente.
    const estudioId = estudioIdManual ?? (pacienteId ? null : (estudioIdInicial ?? idDeUrl ?? null))

    // ── Documento clínico adjunto (PDF o Word) ───────────────────────────────
    // Guardamos el texto extraído del documento más reciente que haya adjuntado
    // el médico. Se acumula en el contexto de todas las llamadas al LLM mientras
    // dure la sesión (o hasta que se adjunte uno nuevo).
    const [documentoClinico, setDocumentoClinico] = useState<string | null>(null)
    const [nombreDocumento, setNombreDocumento] = useState<string | null>(null)

    // ── Estado del modal de reporte ──────────────────────────────────────────
    const [reportModalOpen, setReportModalOpen] = useState(false)

    const estudioActual = estudios.find(e => e.id === estudioId)
    // Resolver paciente: primero por selección manual, luego por el pacienteId del
    // estudio activo (para que el asistente tenga los datos del paciente cuando se
    // llega al chat desde la vista de un estudio directamente).
    const pacienteActual = pacientes.find(p =>
        p.id === pacienteId || (!pacienteId && p.id === estudioActual?.pacienteId)
    )

    // Solo usar informeActivo si NO hay un paciente seleccionado,
    // o si el informeActivo pertenece a un estudio de ese mismo paciente.
    const informeActivoPerteneceAlPaciente = !pacienteActual
        || estudios.some(e => e.pacienteId === pacienteActual.id && e.informe === informeActivo)

    const informeParaChat = estudioActual?.informe
        ?? (informeActivoPerteneceAlPaciente ? informeActivo : null)

    // Todos los estudios del paciente seleccionado, ordenados del más reciente al más antiguo.
    // Si no hay paciente seleccionado manualmente pero el estudio tiene pacienteId asociado,
    // se recupera igual el historial para que el asistente tenga el contexto completo.
    const estudiosDelPaciente = useMemo(() => {
        const pid = pacienteId ?? estudioActual?.pacienteId ?? null
        if (!pid) return []
        return [...estudios.filter(e => e.pacienteId === pid)]
            .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    }, [pacienteId, estudioActual, estudios])

    // ── Abrir modal de reporte ───────────────────────────────────────────────
    const handleGenerateReport = useCallback(() => {
        setReportModalOpen(true)
    }, [])

    // ── Manejo de documentos adjuntos (PDF / Word) ───────────────────────────
    const handleDocumentAttach = useCallback(async (file: File) => {
        addMessage('user', `📎 Documento adjuntado: ${file.name}`, undefined)
        showTyping()
        try {
            const text = await extractDocumentText(file)
            if (!text || text.length < 10) {
                hideTyping()
                addMessage('ai', '⚠️ No pude extraer texto del documento. Asegúrate de que sea un PDF con texto seleccionable o un archivo Word (.docx).', undefined)
                return
            }
            setDocumentoClinico(text)
            setNombreDocumento(file.name)
            hideTyping()
            addMessage(
                'ai',
                `✅ **Documento clínico cargado:** \`${file.name}\`\n\nHe leído el contenido y lo usaré como contexto adicional del paciente en mis respuestas y en el reporte. ¿Tienes alguna pregunta sobre los hallazgos o deseas generar el reporte con esta información integrada?`,
                undefined,
            )
        } catch (err) {
            hideTyping()
            console.error('[ChatView] Error al leer documento:', err)
            addMessage('ai', '⚠️ Ocurrió un error al leer el documento. Intenta con otro archivo.', undefined)
        }
    }, [addMessage, showTyping, hideTyping])

    // ── Envío de mensajes ────────────────────────────────────────────────────
    const handleSend = useCallback((text: string, imageB64?: string, imageMime?: string) => {
        if (!text.trim() && !imageB64) return

        // Detectar intent de reporte en el mensaje
        if (isReportRequest(text)) {
            addMessage('user', text, undefined)
            addMessage('ai', '📄 Abriendo el generador de reporte...', undefined)
            setReportModalOpen(true)
            return
        }

        addMessage('user', text, imageB64 ? `data:${imageMime};base64,${imageB64}` : undefined)
        showTyping()

        const history: MensajeHistorial[] = messages
            .filter((m: Mensaje) => !m.isStreaming)
            .map((m: Mensaje) => {
                if (m.imagenDataUrl) {
                    const { data, mime } = extractBase64FromDataUrl(m.imagenDataUrl)
                    return { role: m.rol === 'ai' ? 'assistant' as const : 'user' as const, content: buildContentWithImage(m.contenido, data, mime) }
                }
                return { role: m.rol === 'ai' ? 'assistant' as const : 'user' as const, content: m.contenido }
            })

        const contextBlock = buildContextBlock(pacienteActual, estudioActual, estudiosDelPaciente, documentoClinico)
        let userMessage = text || '(imagen adjunta)'
        if (contextBlock) {
            userMessage = `${contextBlock}\n\n---\nPregunta del usuario: ${userMessage}`
        }

        if (imageB64 && imageMime) {
            history.push({ role: 'user', content: buildContentWithImage(userMessage, imageB64, imageMime) })
        } else {
            history.push({ role: 'user', content: userMessage })
        }

        startStream()

        void streamChat(history, informeParaChat, {
            onChunk: (chunk) => { hideTyping(); appendChunk(chunk) },
            onGradcam: (base64) => { attachGradcam(`data:image/png;base64,${base64}`) },
            onDone: () => { endStream() },
            onError: (err) => { hideTyping(); endStream(); console.error(err) },
        })
    }, [messages, addMessage, startStream, appendChunk, endStream, attachGradcam, showTyping, hideTyping, pacienteActual, estudioActual, estudiosDelPaciente, informeParaChat, documentoClinico])

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'var(--bg-0)', overflow: 'hidden',
        }}>
            {!compacto && (
                <header style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0 16px', height: 50, flexShrink: 0,
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-glass)', backdropFilter: 'blur(16px)',
                }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 'var(--r6)', flexShrink: 0,
                        background: 'var(--accent)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-accent)',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                  stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t0)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            Chat Clínico
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--t2)', letterSpacing: '0.06em', lineHeight: 1 }}>
                            {status}
                        </div>
                    </div>
                    {/* Indicador de documento clínico activo */}
                    {nombreDocumento && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '3px 8px', borderRadius: 'var(--r6)',
                            background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                            fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--mono)',
                            maxWidth: 160, overflow: 'hidden',
                        }}>
                            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                <path d="M7 1H3C2.45 1 2 1.45 2 2V10C2 10.55 2.45 11 3 11H9C9.55 11 10 10.55 10 10V4L7 1Z"
                                      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7 1V4H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {nombreDocumento}
                            </span>
                        </div>
                    )}
                </header>
            )}

            {(pacientes.length > 0 || estudios.length > 0) && (
                <div style={{
                    padding: '6px 10px', borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-1)', flexShrink: 0,
                }}>
                    <SelectorContexto
                        pacientes={pacientes}
                        estudios={estudios}
                        pacienteId={pacienteId}
                        estudioId={estudioId}
                        onCambio={(pId, eId) => {
                            setPacienteId(pId)
                            setEstudioIdManual(eId)
                        }}
                    />
                </div>
            )}

            <ListaMensajes mensajes={messages} isTyping={isTyping} />

            <BarraInput
                onSend={handleSend}
                onGenerateReport={handleGenerateReport}
                onDocumentAttach={handleDocumentAttach}   // ← nuevo
                disabled={isTyping}
            />

            {/* Modal de selección y descarga de reporte */}
            {reportModalOpen && (
                <ReportModal
                    paciente={pacienteActual}
                    estudio={estudioActual}
                    informe={informeParaChat}
                    messages={messages}
                    documentoClinico={documentoClinico}
                    nombreDocumento={nombreDocumento}
                    onClose={() => setReportModalOpen(false)}
                />
            )}
        </div>
    )
}