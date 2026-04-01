'use client'

import { useState, useCallback, useRef } from 'react'

export function useToast() {
    const [message, setMessage] = useState('')
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showToast = useCallback((msg: string, duration = 2400) => {
        setMessage(msg)
        setVisible(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setVisible(false), duration)
    }, [])

    return { message, visible, showToast }
}

interface ToastProps {
    message: string
    visible: boolean
}

export function Toast({ message, visible }: ToastProps) {
    return (
        <div
            style={{
                position: 'fixed',
                bottom: 78,
                left: '50%',
                transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(10px)',
                background: 'var(--bg-3)',
                border: '1px solid var(--border-h)',
                backdropFilter: 'blur(16px)',
                color: 'var(--t0)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.04em',
                padding: '7px 20px',
                borderRadius: 'var(--r6)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.2s, transform 0.2s',
                pointerEvents: 'none',
                zIndex: 500,
                whiteSpace: 'nowrap',
            }}
        >
            {message}
        </div>
    )
}