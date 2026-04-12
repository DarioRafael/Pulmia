// Estudio clínico: una radiografía analizada por el modelo.
// Un paciente puede tener múltiples estudios; un estudio pertenece a un paciente
// (opcional en Free sin gestión de pacientes) y contiene exactamente una imagen.

import type { InformeAnalisis } from './resultado'

/**
 * Estudio clínico completo.
 *
 * En Fase 2 se persiste en localStorage del cliente. En Fase 3 (Supabase)
 * se mueve a la tabla `estudios` — los campos siguen siendo los mismos para
 * que el cambio sea transparente para los componentes.
 */
export interface Estudio {
    /** Identificador estable generado en el cliente (crypto.randomUUID). */
    readonly id: string
    /** ISO 8601 — momento en que se creó el estudio. */
    readonly creadoEn: string
    /** Data URL de la radiografía original (base64). */
    readonly imagenDataUrl: string
    /** Nombre original del archivo subido (útil para mostrar y debug). */
    readonly nombreArchivo: string
    /** Tipo MIME de la imagen. */
    readonly mimeType: string
    /** Resultado del análisis del modelo. */
    readonly informe: InformeAnalisis
    /** ID del paciente asociado. Solo se rellena si el usuario tiene Premium. */
    readonly pacienteId?: string
    /** Notas libres del médico sobre el estudio. */
    readonly notas?: string
}

/**
 * Entrada parcial para crear un estudio nuevo antes de guardarlo.
 * El id y creadoEn los asigna el store.
 */
export type EstudioNuevo = Omit<Estudio, 'id' | 'creadoEn'>
