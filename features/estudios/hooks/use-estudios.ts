'use client'

// Store de estudios en localStorage.
// En fases futuras (Supabase) este hooks se reescribe para llamar a la API,
// pero la interfaz de retorno queda igual — los componentes no necesitan cambiar.
//
// Manejo de cuota: localStorage tiene un límite real (~5–10 MB). Las
// radiografías en base64 son grandes, por eso:
//  1. Se comprime la imagen antes de guardarla.
//  2. Si setItem lanza QuotaExceededError, se intenta liberar espacio
//     descartando las imágenes más antiguas (manteniendo el resto del
//     registro) y se reintenta.
//  3. Si aun así falla, se devuelve un error para que el caller informe
//     al usuario en lugar de crashear la app.

import { useState, useEffect, useCallback } from 'react'
import type { Estudio, EstudioNuevo } from '@/lib/tipos'
import { usePlan } from '@/components/plan'

const STORAGE_KEY = 'estudios_clinicos'
const NOTAS_MAX_CHARS = 8000

/** Resultado de guardar un estudio. */
export type ResultadoGuardar =
    | { ok: true; estudio: Estudio }
    | { ok: false; error: 'cuota_excedida' | 'almacenamiento_no_disponible'; mensaje: string }

function leerEstudios(): Estudio[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as Estudio[]) : []
    } catch {
        return []
    }
}

function esErrorDeCuota(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false
    const e = err as { name?: string; code?: number }
    return (
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        e.code === 22 ||
        e.code === 1014
    )
}

/**
 * Intenta escribir el array. Si la cuota está llena, libera espacio
 * dropeando las imágenes de los estudios más antiguos (manteniendo todo
 * lo demás del registro: informe, paciente, notas, etc).
 *
 * Devuelve la lista final que quedó persistida, para que el hook actualice
 * el estado en consecuencia.
 */
function escribirEstudiosConRescate(estudios: Estudio[]): Estudio[] {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estudios))
        return estudios
    } catch (err) {
        if (!esErrorDeCuota(err)) throw err
    }

    // Rescate progresivo: empezamos quitando la imagen del más viejo,
    // luego del siguiente, etc., hasta que entre.
    // El más nuevo siempre está en estudios[0] (insertamos al inicio).
    const trabajados = [...estudios]
    for (let i = trabajados.length - 1; i >= 0; i--) {
        const orig = trabajados[i]
        if (!orig.imagenDataUrl) continue
        trabajados[i] = { ...orig, imagenDataUrl: '' }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trabajados))
            return trabajados
        } catch (err) {
            if (!esErrorDeCuota(err)) throw err
        }
    }

    // Último intento: descartar estudios viejos completos.
    while (trabajados.length > 1) {
        trabajados.pop()
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trabajados))
            return trabajados
        } catch (err) {
            if (!esErrorDeCuota(err)) throw err
        }
    }

    // Si después de todo eso sigue sin caber, lanzar.
    throw Object.assign(new Error('Cuota de almacenamiento agotada'), {
        name: 'QuotaExceededError',
    })
}

export function useEstudios() {
    const [estudios, setEstudios] = useState<Estudio[]>([])
    const { limites } = usePlan()

    // Carga inicial desde localStorage.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEstudios(leerEstudios())
    }, [])

    /**
     * Guarda un estudio. Devuelve un resultado en vez de throw para que
     * el caller pueda manejar el error de cuota sin crashear la app.
     */
    const guardar = useCallback((nuevo: EstudioNuevo): ResultadoGuardar => {
        if (typeof window === 'undefined') {
            return { ok: false, error: 'almacenamiento_no_disponible', mensaje: 'Almacenamiento no disponible.' }
        }

        // Truncamos notas muy largas (también las cortamos en UI, pero por si acaso).
        const notas = nuevo.notas && nuevo.notas.length > NOTAS_MAX_CHARS
            ? nuevo.notas.slice(0, NOTAS_MAX_CHARS)
            : nuevo.notas

        const estudio: Estudio = {
            ...nuevo,
            notas,
            id: crypto.randomUUID(),
            creadoEn: new Date().toISOString(),
        }

        try {
            // Calculamos la lista nueva fuera del setEstudios para poder
            // capturar errores y manejarlos sincrónicamente.
            const actuales = leerEstudios()
            const actualizado = [estudio, ...actuales]
            const persistidos = escribirEstudiosConRescate(actualizado)
            setEstudios(persistidos)
            return { ok: true, estudio }
        } catch (err) {
            if (esErrorDeCuota(err)) {
                return {
                    ok: false,
                    error: 'cuota_excedida',
                    mensaje:
                        'No hay espacio suficiente en el almacenamiento del navegador. ' +
                        'Elimina estudios antiguos o reduce el tamaño de las notas.',
                }
            }
            throw err
        }
    }, [])

    const obtener = useCallback((id: string): Estudio | undefined => {
        return estudios.find(e => e.id === id)
    }, [estudios])

    const eliminar = useCallback((id: string) => {
        setEstudios(prev => {
            const updated = prev.filter(e => e.id !== id)
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            } catch {
                // Si al eliminar falla algo (poco probable), no lo bloqueamos.
            }
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

export { NOTAS_MAX_CHARS }
