'use client'

// Aviso médico-legal reutilizable de Pulmia.
//
// Variantes:
//  - "banner":  versión completa para colocar bajo el header de páginas
//               clave (Analizar). Cerrable con persistencia en localStorage.
//  - "inline":  versión corta para integrarse al diseño de un informe.
//               Siempre visible, no se puede cerrar.
//  - "footer":  línea pequeña para sidebar / pie de pantalla.
//  - "compact": variante reducida del banner, sin cierre, para zonas
//               donde el aviso ya está implícito pero se necesita refuerzo.

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Variante = 'banner' | 'inline' | 'footer' | 'compact'

interface MedicalDisclaimerProps {
    readonly variante: Variante
    /** Clave usada para recordar el cierre del banner. Solo aplica a "banner". */
    readonly storageKey?: string
}

const TEXTO_BANNER =
    'Pulmia es una herramienta de apoyo clínico basada en inteligencia artificial. Los resultados generados no constituyen un diagnóstico médico definitivo y no reemplazan el criterio, evaluación ni decisión del médico tratante. Toda interpretación clínica debe ser realizada por un profesional de salud autorizado.'

const TEXTO_INLINE =
    'Este resultado es un indicador de apoyo. La decisión clínica corresponde al médico tratante.'

const TEXTO_FOOTER =
    'Pulmia no reemplaza el diagnóstico médico. Uso exclusivo de apoyo clínico.'

const STORAGE_KEY_DEFAULT = 'pulmia.disclaimer.banner.cerrado'

function IconoShield({ size = 16, color = 'var(--accent)' }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
                d="M8 1.5L13 3.5V8C13 11 10.7 13.5 8 14.5C5.3 13.5 3 11 3 8V3.5L8 1.5Z"
                stroke={color}
                strokeWidth="1.4"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M6 8L7.5 9.5L10.5 6.5"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function IconoInfo({ size = 14, color = 'var(--accent)' }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.4" />
            <path d="M8 7.5V11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="5.2" r="0.85" fill={color} />
        </svg>
    )
}

function IconoCerrar({ size = 12 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    )
}

export function MedicalDisclaimer({ variante, storageKey = STORAGE_KEY_DEFAULT }: MedicalDisclaimerProps) {
    const [cerrado, setCerrado] = useState(false)
    const [hidratado, setHidratado] = useState(false)

    useEffect(() => {
        if (variante !== 'banner') return
        try {
            const guardado = window.localStorage.getItem(storageKey)
            if (guardado === '1') setCerrado(true)
        } catch {
            // localStorage puede no estar disponible — el banner se mantiene visible.
        }
        setHidratado(true)
    }, [variante, storageKey])

    function handleCerrar() {
        setCerrado(true)
        try {
            window.localStorage.setItem(storageKey, '1')
        } catch {
            // Silenciar errores de localStorage (modo privado, etc).
        }
    }

    // ── Banner: aviso completo, cerrable, con borde teal a la izquierda ───
    if (variante === 'banner') {
        // Evita flicker al hidratar
        if (!hidratado || cerrado) return null
        return (
            <div
                role="note"
                aria-label="Aviso médico-legal de Pulmia"
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 18px',
                    paddingRight: 40,
                    borderRadius: 12,
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid var(--accent)',
                }}
            >
                <span style={{ flexShrink: 0, marginTop: 2 }}>
                    <IconoShield size={18} color="var(--accent)" />
                </span>
                <div style={{ minWidth: 0 }}>
                    <div
                        style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 10,
                            color: 'var(--accent)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                            fontWeight: 600,
                        }}
                    >
                        Aviso médico-legal
                    </div>
                    <p style={{
                        fontSize: 13,
                        color: 'var(--t1)',
                        lineHeight: 1.6,
                        margin: 0,
                    }}>
                        {TEXTO_BANNER}
                    </p>
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                        <Link
                            href="/legal"
                            style={{
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                fontWeight: 500,
                            }}
                        >
                            Ver marco legal y científico →
                        </Link>
                    </div>
                </div>
                <button
                    onClick={handleCerrar}
                    aria-label="Cerrar aviso médico"
                    title="Cerrar aviso (se recordará en esta sesión)"
                    style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--t2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background var(--ta), color var(--ta)',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-3)'
                        e.currentTarget.style.color = 'var(--t0)'
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--t2)'
                    }}
                >
                    <IconoCerrar />
                </button>
            </div>
        )
    }

    // ── Inline: aviso corto, siempre visible, integrado a un informe ──────
    if (variante === 'inline') {
        return (
            <div
                role="note"
                aria-label="Aviso clínico"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--border-focus)',
                }}
            >
                <span style={{ flexShrink: 0 }}>
                    <IconoInfo size={14} color="var(--accent)" />
                </span>
                <span style={{
                    fontSize: 12,
                    color: 'var(--t1)',
                    lineHeight: 1.55,
                }}>
                    {TEXTO_INLINE}
                </span>
            </div>
        )
    }

    // ── Compact: refuerzo pequeño, no cerrable, para listados o sub-paneles ─
    if (variante === 'compact') {
        return (
            <div
                role="note"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    fontSize: 11,
                    color: 'var(--t2)',
                }}
            >
                <IconoShield size={11} color="var(--accent)" />
                <span>Apoyo clínico — no sustituye diagnóstico médico</span>
            </div>
        )
    }

    // ── Footer: línea pequeña para sidebar inferior ───────────────────────
    return (
        <div
            role="note"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                color: 'var(--t2)',
                lineHeight: 1.45,
            }}
        >
            <span style={{ flexShrink: 0, color: 'var(--accent)', opacity: 0.7 }}>
                <IconoShield size={10} color="var(--accent)" />
            </span>
            <span>{TEXTO_FOOTER}</span>
        </div>
    )
}
