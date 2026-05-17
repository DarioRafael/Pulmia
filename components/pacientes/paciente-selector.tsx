'use client'

// Selector unificado de paciente: un solo control que permite buscar entre
// los pacientes existentes y, si el texto no coincide con ninguno, crear
// uno nuevo con ese nombre. Reemplaza el patrón anterior de tener un
// <select> y un <input> separados (que era confuso para el usuario).
//
// Modos del valor interno:
//   - 'ninguno'   → no asociar a ningún paciente (botón "Sin paciente")
//   - 'existente' → usar el paciente con el id indicado
//   - 'nuevo'     → crear un paciente con el nombre indicado al guardar

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Paciente } from '@/lib/tipos'

export type SeleccionPaciente =
    | { tipo: 'ninguno' }
    | { tipo: 'existente'; pacienteId: string; nombre: string }
    | { tipo: 'nuevo'; nombre: string }

interface PacienteSelectorProps {
    readonly pacientes: readonly Paciente[]
    readonly valor: SeleccionPaciente
    readonly onChange: (v: SeleccionPaciente) => void
    /** Label visible encima del input. */
    readonly label?: string
    /** Placeholder cuando el input está vacío. */
    readonly placeholder?: string
}

function normalizar(s: string): string {
    return s.trim().toLowerCase()
}

export function PacienteSelector({
    pacientes,
    valor,
    onChange,
    label = 'Paciente',
    placeholder = 'Busca un paciente o escribe un nombre nuevo…',
}: PacienteSelectorProps) {
    // Texto del input — refleja el valor seleccionado para que sea controlado.
    const textoInicial =
        valor.tipo === 'existente' ? valor.nombre :
        valor.tipo === 'nuevo' ? valor.nombre :
        ''
    const [texto, setTexto] = useState(textoInicial)
    const [abierto, setAbierto] = useState(false)
    const [hoverIdx, setHoverIdx] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const wrapRef = useRef<HTMLDivElement>(null)

    // Si cambia el valor desde fuera (ej. reset), sincronizar el texto.
    useEffect(() => {
        const externo =
            valor.tipo === 'existente' ? valor.nombre :
            valor.tipo === 'nuevo' ? valor.nombre :
            ''
        setTexto(externo)
    }, [valor])

    // Cerrar al hacer click fuera.
    useEffect(() => {
        if (!abierto) return
        function onClick(e: MouseEvent) {
            if (!wrapRef.current?.contains(e.target as Node)) {
                setAbierto(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [abierto])

    // Filtrar pacientes que matchean el texto.
    const filtrados = useMemo(() => {
        const q = normalizar(texto)
        if (!q) return pacientes
        return pacientes.filter(p => normalizar(p.nombre).includes(q))
    }, [pacientes, texto])

    // ¿El texto coincide exactamente con algún paciente existente?
    const matchExacto = useMemo(() => {
        const q = normalizar(texto)
        if (!q) return undefined
        return pacientes.find(p => normalizar(p.nombre) === q)
    }, [pacientes, texto])

    const puedeCrear = texto.trim().length > 0 && !matchExacto

    function elegirExistente(p: Paciente) {
        setTexto(p.nombre)
        setAbierto(false)
        onChange({ tipo: 'existente', pacienteId: p.id, nombre: p.nombre })
    }

    function elegirNuevo(nombre: string) {
        setTexto(nombre)
        setAbierto(false)
        onChange({ tipo: 'nuevo', nombre: nombre.trim() })
    }

    function quitar() {
        setTexto('')
        setAbierto(false)
        onChange({ tipo: 'ninguno' })
        inputRef.current?.focus()
    }

    function handleInputChange(nuevo: string) {
        setTexto(nuevo)
        setAbierto(true)
        setHoverIdx(0)
        const trimmed = nuevo.trim()
        if (!trimmed) {
            onChange({ tipo: 'ninguno' })
            return
        }
        const m = pacientes.find(p => normalizar(p.nombre) === normalizar(trimmed))
        if (m) {
            onChange({ tipo: 'existente', pacienteId: m.id, nombre: m.nombre })
        } else {
            onChange({ tipo: 'nuevo', nombre: trimmed })
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setAbierto(true)
            const total = filtrados.length + (puedeCrear ? 1 : 0)
            setHoverIdx((i) => Math.min(i + 1, Math.max(0, total - 1)))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHoverIdx((i) => Math.max(0, i - 1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (!abierto) {
                setAbierto(true)
                return
            }
            if (hoverIdx < filtrados.length) {
                const p = filtrados[hoverIdx]
                if (p) elegirExistente(p)
            } else if (puedeCrear) {
                elegirNuevo(texto)
            }
        } else if (e.key === 'Escape') {
            setAbierto(false)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────

    const chipTipo =
        valor.tipo === 'existente' ? { label: 'Existente', color: 'var(--accent)', bg: 'var(--accent-glow)' } :
        valor.tipo === 'nuevo'     ? { label: 'Nuevo',     color: 'var(--ok)',     bg: 'var(--ok-bg)' } :
        null

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            {label && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 6,
                }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--t1)' }}>
                        {label}
                    </span>
                    {chipTipo && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '1px 8px', borderRadius: 999,
                            fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            color: chipTipo.color, background: chipTipo.bg,
                            border: `1px solid ${chipTipo.color}33`,
                        }}>
                            {chipTipo.label}
                        </span>
                    )}
                </div>
            )}

            <div style={{ position: 'relative' }}>
                {/* Ícono de búsqueda / paciente */}
                <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    color: valor.tipo === 'ninguno' ? 'var(--t2)' : 'var(--accent)',
                    display: 'flex', pointerEvents: 'none',
                }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                        <path d="M3 14C3 11.2 5.2 9 8 9C10.8 9 13 11.2 13 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                </span>

                <input
                    ref={inputRef}
                    type="text"
                    value={texto}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setAbierto(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={abierto}
                    aria-autocomplete="list"
                    style={{
                        width: '100%',
                        padding: '10px 36px 10px 32px',
                        borderRadius: 8,
                        background: 'var(--bg-3)',
                        color: 'var(--t0)',
                        border: `1px solid ${abierto ? 'var(--border-sel)' : 'var(--border)'}`,
                        fontSize: 13,
                        outline: 'none',
                        transition: 'border-color var(--ta)',
                    }}
                />

                {/* Botón limpiar (× a la derecha) */}
                {texto && (
                    <button
                        type="button"
                        onClick={quitar}
                        aria-label="Quitar paciente"
                        title="Quitar paciente"
                        style={{
                            position: 'absolute', right: 8, top: '50%',
                            transform: 'translateY(-50%)',
                            width: 22, height: 22, borderRadius: 6,
                            background: 'transparent', border: 'none',
                            color: 'var(--t2)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Hint debajo del input */}
            <div style={{
                fontSize: 11, color: 'var(--t2)', marginTop: 6,
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                {valor.tipo === 'ninguno' && (
                    <>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--t3)' }} />
                        Sin paciente — el estudio quedará en “Sin paciente asignado”.
                    </>
                )}
                {valor.tipo === 'existente' && (
                    <>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
                        Se asociará al paciente existente.
                    </>
                )}
                {valor.tipo === 'nuevo' && (
                    <>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ok)' }} />
                        Se creará un paciente nuevo con este nombre al guardar.
                    </>
                )}
            </div>

            {/* Dropdown */}
            {abierto && (filtrados.length > 0 || puedeCrear || pacientes.length === 0) && (
                <div
                    role="listbox"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0, right: 0,
                        zIndex: 50,
                        maxHeight: 240,
                        overflowY: 'auto',
                        background: 'var(--bg-2)',
                        border: '1px solid var(--border-h)',
                        borderRadius: 10,
                        boxShadow: 'var(--shadow-md)',
                        padding: 4,
                    }}
                >
                    {filtrados.length === 0 && !puedeCrear && (
                        <div style={{
                            padding: '10px 12px',
                            fontSize: 12, color: 'var(--t2)',
                        }}>
                            No hay pacientes registrados aún.
                        </div>
                    )}

                    {filtrados.map((p, idx) => {
                        const activo = idx === hoverIdx
                        return (
                            <button
                                type="button"
                                key={p.id}
                                onMouseEnter={() => setHoverIdx(idx)}
                                onClick={() => elegirExistente(p)}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 10px', borderRadius: 6,
                                    background: activo ? 'var(--bg-3)' : 'transparent',
                                    border: 'none', textAlign: 'left',
                                    cursor: 'pointer',
                                    color: 'var(--t0)', fontSize: 13,
                                }}
                            >
                                <div style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: 'var(--accent-glow)',
                                    border: '1px solid var(--accent)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                                    fontFamily: 'var(--mono)',
                                    flexShrink: 0,
                                }}>
                                    {p.nombre.charAt(0).toUpperCase()}
                                </div>
                                <span style={{
                                    flex: 1,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {p.nombre}
                                </span>
                                <span style={{
                                    fontFamily: 'var(--mono)', fontSize: 9,
                                    color: 'var(--t2)', letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                }}>
                                    Existente
                                </span>
                            </button>
                        )
                    })}

                    {puedeCrear && (
                        <>
                            {filtrados.length > 0 && (
                                <div style={{ height: 1, background: 'var(--border)', margin: '4px 6px' }} />
                            )}
                            <button
                                type="button"
                                onMouseEnter={() => setHoverIdx(filtrados.length)}
                                onClick={() => elegirNuevo(texto)}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 10px', borderRadius: 6,
                                    background: hoverIdx === filtrados.length ? 'var(--bg-3)' : 'transparent',
                                    border: 'none', textAlign: 'left',
                                    cursor: 'pointer',
                                    color: 'var(--t0)', fontSize: 13,
                                }}
                            >
                                <div style={{
                                    width: 26, height: 26, borderRadius: '50%',
                                    background: 'var(--ok-bg)',
                                    border: '1px solid var(--ok)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    color: 'var(--ok)',
                                }}>
                                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                        <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                        <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <span style={{ flex: 1 }}>
                                    Crear nuevo: <strong style={{ color: 'var(--t0)' }}>“{texto.trim()}”</strong>
                                </span>
                                <span style={{
                                    fontFamily: 'var(--mono)', fontSize: 9,
                                    color: 'var(--ok)', letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                }}>
                                    Nuevo
                                </span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
