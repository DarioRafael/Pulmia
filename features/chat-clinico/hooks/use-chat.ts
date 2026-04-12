'use client'

// Hook de estado de mensajes y streaming del chat clínico.
// Replicación fiel de la lógica que existía en `lib/hooks/useChat.ts`,
// adaptada a los tipos propios de la feature.

import { useState, useRef, useCallback } from 'react'
import type { Mensaje } from '../tipos'

function generarId() {
    return Math.random().toString(36).slice(2, 10)
}

export function useChat() {
    const [messages, setMessages] = useState<Mensaje[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [status, setStatus] = useState<string>('en espera...')
    const streamBufferRef = useRef<string>('')
    const streamIdRef = useRef<string | null>(null)

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
    }, [])

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
