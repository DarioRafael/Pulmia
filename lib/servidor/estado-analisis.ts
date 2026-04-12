// Estado en memoria del último análisis realizado.
//
// ADVERTENCIA: Es una variable de módulo compartida entre peticiones del
// mismo proceso Node.js. Está bien para desarrollo single-user pero NO es
// seguro en producción multi-usuario — en Fase 3 se moverá a Supabase.
//
// Vive aquí (y no en route handlers) para que tanto `/api/analyze` como
// `/api/chat` lean y escriban el mismo valor — así el chat puede
// contextualizar sus respuestas con el último informe que generó el
// endpoint de análisis.

// Nota: este módulo debe usarse EXCLUSIVAMENTE desde route handlers o
// server components. Si se importa desde un client component, Next.js
// enviará esta variable al cliente y todos los usuarios verán el mismo
// estado — eso romperá la semántica aquí esperada.
import type { ResultadoAnalisis } from '@/lib/tipos'

let ultimoAnalisis: ResultadoAnalisis | null = null

/**
 * Devuelve el último análisis almacenado, o `null` si todavía no se ha hecho
 * ninguno desde que arrancó el servidor.
 */
export function obtenerUltimoAnalisis(): ResultadoAnalisis | null {
    return ultimoAnalisis
}

/**
 * Actualiza el último análisis almacenado.
 * Debe llamarse desde `/api/analyze` cuando termina con éxito, y desde
 * `/api/chat` cuando el usuario envía una imagen por el flujo del chat.
 */
export function guardarUltimoAnalisis(resultado: ResultadoAnalisis): void {
    ultimoAnalisis = resultado
}

/**
 * Limpia el estado. Útil para tests; no se llama en el flujo normal.
 */
export function limpiarUltimoAnalisis(): void {
    ultimoAnalisis = null
}
