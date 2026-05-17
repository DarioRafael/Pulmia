'use client'

// Hook de estado de mensajes y streaming del chat clínico.
// Replicación fiel de la lógica que existía en `lib/hooks/useChat.ts`,
// adaptada a los tipos propios de la feature.
//
// NUEVO: acepta una `storageKey` opcional para persistir el historial de
// mensajes en localStorage de forma aislada (prefijo "chat:"), sin mezclar
// con los datos de pacientes ni estudios.

import { useState, useRef, useCallback, useEffect } from 'react'
import type { Mensaje } from '../tipos'

function generarId() {
    return Math.random().toString(36).slice(2, 10)
}

// ── Helpers de serialización ─────────────────────────────────────────────────
// Los timestamps se guardan como strings ISO y se restauran como Date.

interface MensajeSerializado extends Omit<Mensaje, 'timestamp'> {
    timestamp: string
}

function serializarMensajes(msgs: Mensaje[]): string {
    const serializados: MensajeSerializado[] = msgs
        // No persistir mensajes que aún están en streaming
        .filter(m => !m.isStreaming)
        .map(m => ({ ...m, timestamp: m.timestamp.toISOString() }))
    return JSON.stringify(serializados)
}

function deserializarMensajes(raw: string): Mensaje[] {
    try {
        const parsed = JSON.parse(raw) as MensajeSerializado[]
        if (!Array.isArray(parsed)) return []
        return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
    } catch {
        return []
    }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useChat(storageKey?: string) {
    // Clave real en localStorage: siempre con prefijo "chat:" para no colisionar
    // con las keys de pacientes ("pacientes") ni estudios ("estudios").
    const lsKey = storageKey ? `chat:${storageKey}` : null

    // Inicializar desde localStorage si hay clave y datos previos
    const [messages, setMessages] = useState<Mensaje[]>(() => {
        if (!lsKey || typeof window === 'undefined') return []
        const raw = localStorage.getItem(lsKey)
        return raw ? deserializarMensajes(raw) : []
    })

    const [isTyping, setIsTyping]  = useState(false)
    const [status, setStatus]      = useState<string>('en espera...')
    const streamBufferRef          = useRef<string>('')
    const streamIdRef              = useRef<string | null>(null)

    // Persistir cada vez que cambian los mensajes (solo si hay clave)
    useEffect(() => {
        if (!lsKey) return
        // Guardar solo mensajes que ya terminaron de hacer streaming
        const finalizados = messages.filter(m => !m.isStreaming)
        if (finalizados.length === 0) {
            localStorage.removeItem(lsKey)
        } else {
            localStorage.setItem(lsKey, serializarMensajes(finalizados))
        }
    }, [messages, lsKey])

    const addMessage = useCallback((
        rol: 'user' | 'ai',
        contenido: string,
        imagenDataUrl?: string,
        imagenTitulo?: string,
    ) => {
        const msg: Mensaje = {
            id: generarId(),
            rol,
            contenido,
            timestamp: new Date(),
            imagenDataUrl,
            imagenTitulo,
        }
        setMessages(prev => [...prev, msg])
        return msg.id
    }, [])

    const startStream = useCallback(() => {
        if (streamIdRef.current) {
            const staleId = streamIdRef.current
            setMessages(prev =>
                prev.map(m => m.id === staleId ? { ...m, isStreaming: false } : m),
            )
        }

        streamBufferRef.current = ''
        const id = generarId()
        streamIdRef.current = id

        const msg: Mensaje = {
            id,
            rol: 'ai',
            contenido: '',
            timestamp: new Date(),
            isStreaming: true,
        }
        setMessages(prev => [...prev, msg])
        setStatus('escribiendo...')
        setIsTyping(false)
        return id
    }, [])

    const appendChunk = useCallback((chunk: string) => {
        if (!streamIdRef.current) {
            const id = generarId()
            streamIdRef.current = id
            streamBufferRef.current = chunk

            const msg: Mensaje = {
                id,
                rol: 'ai',
                contenido: chunk,
                timestamp: new Date(),
                isStreaming: true,
            }
            setMessages(prev => [...prev, msg])
            setStatus('escribiendo...')
            setIsTyping(false)
            return
        }

        streamBufferRef.current += chunk
        const raw = streamBufferRef.current
        const id = streamIdRef.current

        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, contenido: raw } : m),
        )
    }, [])

    const attachGradcam = useCallback((dataUrl: string) => {
        const id = streamIdRef.current
        if (!id) return
        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, gradcamDataUrl: dataUrl } : m),
        )
    }, [])

    const endStream = useCallback(() => {
        if (!streamIdRef.current) return
        const id = streamIdRef.current

        streamIdRef.current = null
        streamBufferRef.current = ''

        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, isStreaming: false } : m),
        )
        setStatus('en espera...')
    }, [])

    const showTyping = useCallback(() => setIsTyping(true), [])
    const hideTyping = useCallback(() => setIsTyping(false), [])

    const clearMessages = useCallback(() => {
        if (streamIdRef.current) {
            streamIdRef.current = null
            streamBufferRef.current = ''
        }
        setMessages([])
        setIsTyping(false)
        setStatus('en espera...')
        // Limpiar también de localStorage
        if (lsKey) localStorage.removeItem(lsKey)
    }, [lsKey])

    return {
        messages,
        isTyping,
        status,
        setStatus,
        addMessage,
        startStream,
        appendChunk,
        endStream,
        attachGradcam,
        showTyping,
        hideTyping,
        clearMessages,
    }
}