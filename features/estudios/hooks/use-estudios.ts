'use client'

// Store de estudios en localStorage.
// En fases futuras (Supabase) este hook se reescribe para llamar a la API,
// pero la interfaz de retorno queda igual — los componentes no necesitan cambiar.

import { useState, useEffect, useCallback } from 'react'
import type { Estudio, EstudioNuevo } from '@/lib/tipos'
import { usePlan } from '@/components/plan'

const STORAGE_KEY = 'estudios_clinicos'

function leerEstudios(): Estudio[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as Estudio[]) : []
    } catch {
        return []
    }
}

function escribirEstudios(estudios: Estudio[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estudios))
}

export function useEstudios() {
    const [estudios, setEstudios] = useState<Estudio[]>([])
    const { limites } = usePlan()

    // Carga inicial desde localStorage.
    useEffect(() => {
        setEstudios(leerEstudios())
    }, [])

    const guardar = useCallback((nuevo: EstudioNuevo): Estudio => {
        const estudio: Estudio = {
            ...nuevo,
            id: crypto.randomUUID(),
            creadoEn: new Date().toISOString(),
        }
        setEstudios(prev => {
            const updated = [estudio, ...prev]
            escribirEstudios(updated)
            return updated
        })
        return estudio
    }, [])

    const obtener = useCallback((id: string): Estudio | undefined => {
        return estudios.find(e => e.id === id)
    }, [estudios])

    const eliminar = useCallback((id: string) => {
        setEstudios(prev => {
            const updated = prev.filter(e => e.id !== id)
            escribirEstudios(updated)
            return updated
        })
    }, [])

    // Estudios visibles según el límite del plan.
    const estudiosVisibles = limites.estudiosEnHistorial === null
        ? estudios
        : estudios.slice(0, limites.estudiosEnHistorial)

    // Conteo de estudios del mes actual para validar el límite mensual.
    const mesActual = new Date().toISOString().slice(0, 7) // "2026-04"
    const estudiosEsteMes = estudios.filter(e => e.creadoEn.startsWith(mesActual)).length

    const puedoCrear = limites.estudiosPorMes === null || estudiosEsteMes < limites.estudiosPorMes

    return {
        estudios: estudiosVisibles,
        totalEstudios: estudios.length,
        estudiosEsteMes,
        puedoCrear,
        guardar,
        obtener,
        eliminar,
    }
}
