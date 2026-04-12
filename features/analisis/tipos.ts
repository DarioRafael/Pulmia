// Tipos de la feature de análisis.
// El resultado real del análisis se modela en lib/tipos/resultado.ts —
// aquí solo están los tipos de estado de UI de la feature.

import type { InformeAnalisis } from '@/lib/tipos'

/** Estado del formulario de análisis. */
export type EstadoAnalisis =
    | { paso: 'idle' }
    | { paso: 'subiendo'; nombreArchivo: string }
    | { paso: 'analizando'; nombreArchivo: string }
    | { paso: 'completado'; informe: InformeAnalisis; imagenDataUrl: string; nombreArchivo: string; mimeType: string }
    | { paso: 'error'; mensaje: string }
