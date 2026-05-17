'use client'

// Etiqueta permanente que identifica a Pulmia como herramienta de apoyo
// clínico, no como dispositivo de diagnóstico. Al hacer click lleva a la
// página de marco legal/acerca. Pensada para colocarse cerca del logo
// en la sidebar o en el header.

import Link from 'next/link'
import { useState } from 'react'

interface MedicalToolBadgeProps {
    readonly compact?: boolean
}

export function MedicalToolBadge({ compact = false }: MedicalToolBadgeProps) {
    const [hover, setHover] = useState(false)

    const contenido = (
        <span
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            title="Pulmia es una herramienta de apoyo clínico. No reemplaza el criterio médico. Click para ver el marco legal."
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: compact ? 4 : 6,
                padding: compact ? '2px 7px' : '3px 9px',
                borderRadius: 999,
                background: hover ? 'var(--accent-glow)' : 'var(--bg-3)',
                border: `1px solid ${hover ? 'var(--border-focus)' : 'var(--border-h)'}`,
                fontSize: compact ? 9 : 10,
                fontFamily: 'var(--mono)',
                color: hover ? 'var(--accent)' : 'var(--t1)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all var(--ta)',
                whiteSpace: 'nowrap',
            }}
        >
            <svg
                width={compact ? 9 : 10}
                height={compact ? 9 : 10}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
            >
                <path
                    d="M8 1.5L13 3.5V8C13 11 10.7 13.5 8 14.5C5.3 13.5 3 11 3 8V3.5L8 1.5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                    fill="none"
                />
                <path
                    d="M6 8L7.5 9.5L10.5 6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            {compact ? 'Apoyo clínico' : 'Apoyo clínico'}
        </span>
    )

    return (
        <Link
            href="/legal"
            aria-label="Marco legal: Pulmia es una herramienta de apoyo clínico"
            style={{ display: 'inline-flex', textDecoration: 'none' }}
        >
            {contenido}
        </Link>
    )
}
