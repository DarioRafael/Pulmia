'use client'

import { useState, useRef, useCallback } from 'react'
import { Message } from '@/lib/types'

function generateId() {
    return Math.random().toString(36).slice(2, 10)
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [status, setStatus] = useState<string>('en espera...')
    const streamBufferRef = useRef<string>('')
    const streamIdRef = useRef<string | null>(null)

    const addMessage = useCallback((
        role: 'user' | 'ai',
        content: string,
        imageDataUrl?: string,
        imageCaption?: string
    ) => {
        const msg: Message = {
            id: generateId(),
            role,
            content,
            timestamp: new Date(),
            imageDataUrl,
            imageCaption,
        }
        setMessages(prev => [...prev, msg])
        return msg.id
    }, [])

    const startStream = useCallback(() => {
        if (streamIdRef.current) {
            const staleId = streamIdRef.current
            setMessages(prev =>
                prev.map(m => m.id === staleId ? { ...m, isStreaming: false } : m)
            )
        }

        streamBufferRef.current = ''
        const id = generateId()
        streamIdRef.current = id

        const msg: Message = {
            id,
            role: 'ai',
            content: '',
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
            const id = generateId()
            streamIdRef.current = id
            streamBufferRef.current = chunk

            const msg: Message = {
                id,
                role: 'ai',
                content: chunk,
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
        const id   = streamIdRef.current

        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, content: raw } : m)
        )
    }, [])

    /**
     * Adjunta el Grad-CAM al mensaje de stream activo.
     * El campo gradcamDataUrl se renderiza ENCIMA del texto en MessageBubble.
     */
    const attachGradcam = useCallback((dataUrl: string) => {
        const id = streamIdRef.current
        if (!id) return
        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, gradcamDataUrl: dataUrl } : m)
        )
    }, [])

    const endStream = useCallback(() => {
        if (!streamIdRef.current) return
        const id = streamIdRef.current

        streamIdRef.current = null
        streamBufferRef.current = ''

        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, isStreaming: false } : m)
        )
        setStatus('en espera...')
    }, [])

    const forceEndStream = useCallback(() => {
        if (!streamIdRef.current) return
        const id = streamIdRef.current
        streamIdRef.current = null
        streamBufferRef.current = ''
        setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, isStreaming: false } : m)
        )
        setStatus('en espera...')
        setIsTyping(false)
    }, [])

    const showTyping  = useCallback(() => setIsTyping(true), [])
    const hideTyping  = useCallback(() => setIsTyping(false), [])

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
        forceEndStream,
        attachGradcam,
        showTyping,
        hideTyping,
        clearMessages,
    }
}