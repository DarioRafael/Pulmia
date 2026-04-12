'use client'

import { useState, useCallback, useRef } from 'react'

export function useToast() {
    const [message, setMessage] = useState('')
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const showToast = useCallback((msg: string, duration = 2200) => {
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
        <div style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: visible
                ? 'translateX(-50%) translateY(0) scale(1)'
                : 'translateX(-50%) translateY(8px) scale(0.97)',
            background: 'var(--bg-3)',
            border: '1px solid var(--border-h)',
            backdropFilter: 'blur(20px)',
            color: 'var(--t0)',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.04em',
            padding: '6px 18px',
            borderRadius: 'var(--r6)',
            boxShadow: 'var(--shadow-md)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.18s ease, transform 0.18s ease',
            pointerEvents: 'none',
            zIndex: 500,
            whiteSpace: 'nowrap',
        }}>
            {message}
        </div>
    )
}