// Resultado de un análisis del modelo de visión.
// Estos tipos son el "contrato" con el backend FastAPI — si el API cambia,
// los ajustes se hacen aquí y TypeScript propaga los errores al resto.

/**
 * Entrada del diccionario de patologías detectadas por el modelo.
 * El modelo devuelve probabilidades (0..1) para cada patología conocida.
 */
export type PatologiasDetectadas = Readonly<Record<string, number>>

/**
 * Resultado crudo devuelto por FastAPI tras analizar una radiografía.
 * No contiene lógica de negocio — es el DTO directo.
 */
export interface ResultadoAnalisis {
    /** Probabilidad 0..1 de hallazgo compatible con carcinoma. */
    readonly probabilidadCarcinoma: number
    /** Etiqueta textual devuelta por el modelo (ej: "Masa (posible tumor)"). */
    readonly etiquetaCarcinoma: string
    /** Probabilidades por patología conocida. */
    readonly patologias: PatologiasDetectadas
    /** Imagen Grad-CAM en base64 (sin prefijo data:), si el modelo la devolvió. */
    readonly gradcamBase64?: string
}

/**
 * Resultado normalizado para consumir desde la UI, enriquecido con
 * valores derivados (porcentajes redondeados, severidad, etc.).
 */
export interface InformeAnalisis extends ResultadoAnalisis {
    /** Porcentaje entero 0..100 para mostrar en tarjetas. */
    readonly porcentajeCarcinoma: number
    /** Patologías relevantes (por encima del umbral) ordenadas desc. */
    readonly patologiasRelevantes: readonly PatologiaRelevante[]
    /** Severidad cualitativa calculada en base a los umbrales. */
    readonly severidad: Severidad
}

export interface PatologiaRelevante {
    readonly nombre: string
    readonly probabilidad: number
    readonly porcentaje: number
}

/**
 * Severidad derivada del resultado. No sustituye el juicio médico; es solo
 * una etiqueta para colorear UI y priorizar revisión.
 */
export type Severidad = 'baja' | 'media' | 'alta'
