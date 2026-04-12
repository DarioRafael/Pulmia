'use client'

// Hook que gestiona el estado de la pantalla de análisis:
// idle → preview → subiendo → analizando → completado/error.
// Ahora incluye un paso de previsualización donde el usuario ve la imagen
// antes de confirmar el análisis.

import { useState, useCallback } from 'react'
import { analizarImagen } from '../api'
import type { EstadoAnalisis } from '../tipos'

export function useAnalisis() {
    const [estado, setEstado] = useState<EstadoAnalisis>({ paso: 'idle' })

    /** Paso 1: el usuario escoge un archivo → se muestra la preview. */
    const previsualizarArchivo = useCallback(async (archivo: File) => {
        const imagenDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(archivo)
        })

        setEstado({
            paso: 'preview',
            archivo,
            imagenDataUrl,
            nombreArchivo: archivo.name,
        })
    }, [])

    /** Paso 2: el usuario confirma → se sube y analiza. */
    const confirmarAnalisis = useCallback(async () => {
        if (estado.paso !== 'preview') return

        const { archivo, imagenDataUrl, nombreArchivo } = estado

        setEstado({ paso: 'subiendo', nombreArchivo, imagenDataUrl })
        setEstado({ paso: 'analizando', nombreArchivo, imagenDataUrl })

        try {
            const { informe } = await analizarImagen(archivo)
            setEstado({
                paso: 'completado',
                informe,
                imagenDataUrl,
                nombreArchivo,
                mimeType: archivo.type || 'image/jpeg',
            })
        } catch (err) {
            setEstado({
                paso: 'error',
                mensaje: err instanceof Error ? err.message : 'Error desconocido',
            })
        }
    }, [estado])

    /** Atajo: seleccionar y analizar directo (sin preview). */
    const analizar = useCallback(async (archivo: File) => {
        const imagenDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(archivo)
        })

        setEstado({ paso: 'subiendo', nombreArchivo: archivo.name, imagenDataUrl })
        setEstado({ paso: 'analizando', nombreArchivo: archivo.name, imagenDataUrl })

        try {
            const { informe } = await analizarImagen(archivo)
            setEstado({
                paso: 'completado',
                informe,
                imagenDataUrl,
                nombreArchivo: archivo.name,
                mimeType: archivo.type || 'image/jpeg',
            })
        } catch (err) {
            setEstado({
                paso: 'error',
                mensaje: err instanceof Error ? err.message : 'Error desconocido',
            })
        }
    }, [])

    const reiniciar = useCallback(() => {
        setEstado({ paso: 'idle' })
    }, [])

    return { estado, previsualizarArchivo, confirmarAnalisis, analizar, reiniciar }
}
