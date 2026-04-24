// Documento exportado (PDF o DOCX) generado a partir de un estudio.
// Feature Premium — parte del feature reportes.

export type TipoDocumento = 'pdf' | 'docx'

/**
 * Registro de un documento generado y descargado por el usuario.
 * Se persiste en localStorage para mantener el historial de exportaciones.
 */
export interface DocumentoExportado {
    readonly id: string
    readonly tipo: TipoDocumento
    readonly nombreArchivo: string
    /** undefined = estudio sin paciente asignado */
    readonly pacienteId?: string
    /** Estudio de origen del informe */
    readonly estudioId?: string
    /** ISO 8601 */
    readonly creadoEn: string
    /** Tamaño aproximado en KB */
    readonly tamanoKb?: number
    /** Blob URL o ruta descargable */
    readonly url: string
}