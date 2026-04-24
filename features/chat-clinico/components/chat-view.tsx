'use client'

// Vista completa del chat clínico.
// Se usa tanto en la ruta dedicada (/estudios/[id]/chat) como dentro del
// ChatBubble expandido. Contiene todo el flujo: historial, input, streaming.
// Ahora incluye selector de contexto (paciente + estudio) para dar info
// detallada basada en datos reales.
//
// NUEVO: genera reporte PDF/Word desde el botón de la barra o cuando el
// usuario escribe frases como "genera un reporte", "generar informe", etc.

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ListaMensajes } from './lista-mensajes'
import { BarraInput } from './barra-input'
import { SelectorContexto } from './selector-contexto'
import { ReportModal } from './report-modal'          // ← nuevo
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

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ChatViewProps {
    readonly compacto?: boolean
    readonly estudioIdInicial?: string
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

function buildContextBlock(
    paciente: Paciente | undefined,
    estudio: Estudio | undefined,
    estudiosDelPaciente: readonly Estudio[],
): string {
    const partes: string[] = []

    if (paciente) {
        partes.push(`[CONTEXTO - Paciente: ${paciente.nombre}]`)
        if (paciente.fechaNacimiento) partes.push(`Fecha de nacimiento: ${paciente.fechaNacimiento}`)
        if (paciente.notas) partes.push(`Notas del paciente: ${paciente.notas}`)
        partes.push(`Total de estudios: ${estudiosDelPaciente.length}`)

        if (estudiosDelPaciente.length > 0) {
            partes.push('\nHistorial de estudios del paciente:')
            estudiosDelPaciente.forEach((e, i) => {
                partes.push(`  ${i + 1}. ${e.nombreArchivo} (${e.creadoEn})`)
                partes.push(`     Resultado: ${e.informe.etiquetaCarcinoma} — ${e.informe.porcentajeCarcinoma}% carcinoma — Severidad: ${e.informe.severidad}`)
                if (e.informe.patologiasRelevantes.length > 0) {
                    const pats = e.informe.patologiasRelevantes.map(p => `${p.nombre}:${p.porcentaje}%`).join(', ')
                    partes.push(`     Patologías: ${pats}`)
                }
                if (e.notas) partes.push(`     Notas: ${e.notas}`)
            })
        }
    }

    if (estudio) {
        partes.push(`\n[CONTEXTO - Estudio seleccionado: ${estudio.nombreArchivo}]`)
        partes.push(`Fecha: ${estudio.creadoEn}`)
        partes.push(`Resultado: ${estudio.informe.etiquetaCarcinoma}`)
        partes.push(`Probabilidad de carcinoma: ${estudio.informe.porcentajeCarcinoma}%`)
        partes.push(`Severidad: ${estudio.informe.severidad}`)
        if (estudio.informe.patologiasRelevantes.length > 0) {
            partes.push('Patologías detectadas:')
            estudio.informe.patologiasRelevantes.forEach(p => {
                partes.push(`  - ${p.nombre}: ${p.porcentaje}%`)
            })
        }
        if (estudio.notas) partes.push(`Notas del médico: ${estudio.notas}`)
    }

    return partes.join('\n')
}

// ── Componente principal ─────────────────────────────────────────────────────

export function ChatView({ compacto, estudioIdInicial }: ChatViewProps) {
    const {
        messages, isTyping, status,
        addMessage, startStream, appendChunk, endStream, attachGradcam,
        showTyping, hideTyping,
    } = useChat()

    const { pacientes } = usePacientes()
    const { estudios } = useEstudios()
    const { informeActivo } = useInformeActivo()

    const params = useParams()
    const idDeUrl = typeof params?.id === 'string' ? params.id : null

    const [pacienteId, setPacienteId] = useState<string | null>(null)
    const [estudioIdManual, setEstudioIdManual] = useState<string | null>(null)
    const estudioId = estudioIdManual ?? estudioIdInicial ?? idDeUrl ?? null

    // ── Estado del modal de reporte ──────────────────────────────────────────
    const [reportModalOpen, setReportModalOpen] = useState(false)

    const pacienteActual = pacientes.find(p => p.id === pacienteId)
    const estudioActual = estudios.find(e => e.id === estudioId)

    const informeParaChat = estudioActual?.informe ?? informeActivo ?? null

    const estudiosDelPaciente = useMemo(
        () => pacienteId ? estudios.filter(e => e.pacienteId === pacienteId) : [],
        [pacienteId, estudios],
    )

    // ── Abrir modal de reporte ───────────────────────────────────────────────
    const handleGenerateReport = useCallback(() => {
        setReportModalOpen(true)
    }, [])

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

        const contextBlock = buildContextBlock(pacienteActual, estudioActual, estudiosDelPaciente)
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
    }, [messages, addMessage, startStream, appendChunk, endStream, attachGradcam, showTyping, hideTyping, pacienteActual, estudioActual, estudiosDelPaciente, informeParaChat])

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
                onGenerateReport={handleGenerateReport}   // ← nuevo
                disabled={isTyping}
            />

            {/* Modal de selección y descarga de reporte */}
            {reportModalOpen && (
                <ReportModal
                    paciente={pacienteActual}
                    estudio={estudioActual}
                    informe={informeParaChat}
                    messages={messages}
                    onClose={() => setReportModalOpen(false)}
                />
            )}
        </div>
    )
}