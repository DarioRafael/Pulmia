'use client'

// Hook que gestiona el estado de la pantalla de análisis:
// idle → subiendo → analizando → completado/error.

import { useState, useCallback } from 'react'
import { analizarImagen } from '../api'
import type { EstadoAnalisis } from '../tipos'

export function useAnalisis() {
    const [estado, setEstado] = useState<EstadoAnalisis>({ paso: 'idle' })

    const analizar = useCallback(async (archivo: File) => {
        setEstado({ paso: 'subiendo', nombreArchivo: archivo.name })

        // Leer como data URL para mostrar en el informe después.
        const imagenDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(archivo)
        })

        setEstado({ paso: 'analizando', nombreArchivo: archivo.name })

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

    return { estado, analizar, reiniciar }
}
