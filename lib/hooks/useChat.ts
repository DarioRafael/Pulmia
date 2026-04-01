'use client'

import { useState, useRef, useCallback } from 'react'
import { Message } from '@/lib/types'

function generateId() {
    return Math.random().toString(36).slice(2, 10)
}

function now() {
    return new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export function useChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [status, setStatus] = useState<string>('en espera...')
    const streamBufferRef = useRef<string>('')
    const streamIdRef = useRef<string | null>(null)

    const addMessage = useCallback((role: 'user' | 'ai', content: string, imageDataUrl?: string, imageCaption?: string) => {
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

    // Inicia un mensaje de streaming — devuelve el id del mensaje para poder actualizarlo
    const startStream = useCallback(() => {
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
        if (!streamIdRef.current) return
        streamBufferRef.current += chunk
        const raw = streamBufferRef.current
        setMessages(prev =>
            prev.map(m =>
                m.id === streamIdRef.current ? { ...m, content: raw } : m
            )
        )
    }, [])

    const endStream = useCallback(() => {
        if (!streamIdRef.current) return
        setMessages(prev =>
            prev.map(m =>
                m.id === streamIdRef.current ? { ...m, isStreaming: false } : m
            )
        )
        streamIdRef.current = null
        streamBufferRef.current = ''
        setStatus('en espera...')
    }, [])

    const showTyping = useCallback(() => setIsTyping(true), [])
    const hideTyping = useCallback(() => setIsTyping(false), [])

    const clearMessages = useCallback(() => {
        setMessages([])
        streamIdRef.current = null
        streamBufferRef.current = ''
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
        showTyping,
        hideTyping,
        clearMessages,
    }
}