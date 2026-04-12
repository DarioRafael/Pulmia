'use client'

// Store de pacientes en localStorage.
// Misma estrategia que useEstudios: interfaz estable para migrar a Supabase.

import { useState, useEffect, useCallback } from 'react'
import type { Paciente } from '@/lib/tipos'

const STORAGE_KEY = 'pacientes_clinicos'

interface PacienteNuevo {
    readonly nombre: string
    readonly fechaNacimiento?: string
    readonly notas?: string
}

function leerPacientes(): Paciente[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as Paciente[]) : []
    } catch {
        return []
    }
}

function escribirPacientes(pacientes: Paciente[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes))
}

export function usePacientes() {
    const [pacientes, setPacientes] = useState<Paciente[]>([])

    useEffect(() => {
        setPacientes(leerPacientes())
    }, [])

    const guardar = useCallback((nuevo: PacienteNuevo): Paciente => {
        const paciente: Paciente = {
            ...nuevo,
            id: crypto.randomUUID(),
            creadoEn: new Date().toISOString(),
        }
        setPacientes(prev => {
            const updated = [paciente, ...prev]
            escribirPacientes(updated)
            return updated
        })
        return paciente
    }, [])

    const obtener = useCallback((id: string): Paciente | undefined => {
        return pacientes.find(p => p.id === id)
    }, [pacientes])

    const actualizar = useCallback((id: string, cambios: Partial<PacienteNuevo>) => {
        setPacientes(prev => {
            const updated = prev.map(p =>
                p.id === id ? { ...p, ...cambios } : p,
            )
            escribirPacientes(updated)
            return updated
        })
    }, [])

    const eliminar = useCallback((id: string) => {
        setPacientes(prev => {
            const updated = prev.filter(p => p.id !== id)
            escribirPacientes(updated)
            return updated
        })
    }, [])

    return {
        pacientes,
        guardar,
        obtener,
        actualizar,
        eliminar,
    }
}
