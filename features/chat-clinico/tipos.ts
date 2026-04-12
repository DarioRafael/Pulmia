// Tipos propios del chat clínico.
// Son tipos de VISTA (mensajes renderizados, estado UI) — los tipos del
// dominio (Estudio, Resultado, etc.) viven en `lib/tipos/`.

export type RolMensaje = 'user' | 'ai'

export interface Mensaje {
    readonly id: string
    readonly rol: RolMensaje
    readonly contenido: string
    readonly timestamp: Date
    /** Data URL de la imagen adjunta (solo mensajes de usuario). */
    readonly imagenDataUrl?: string
    /** Subtítulo corto de la imagen (nombre de archivo, etc.). */
    readonly imagenTitulo?: string
    /** Mensaje siendo transmitido por streaming (se oculta el botón copiar). */
    readonly isStreaming?: boolean
    /** Data URL del Grad-CAM adjunto al mensaje de IA. */
    readonly gradcamDataUrl?: string
}

export type EstadoChat = 'idle' | 'thinking' | 'online'

/**
 * Bloque tipado para enviar al endpoint `/api/chat`.
 * Coincide con el contrato histórico (OpenAI-compatible) para no romper la
 * ruta existente del chat.
 */
export type BloqueTexto = { type: 'text'; text: string }
export type BloqueImagen = {
    type: 'image'
    source: { type: 'base64'; media_type: string; data: string }
}
export type BloqueContenido = BloqueTexto | BloqueImagen

export interface MensajeHistorial {
    readonly role: 'user' | 'assistant'
    readonly content: string | BloqueContenido[]
}
