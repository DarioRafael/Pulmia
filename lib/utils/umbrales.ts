// Umbrales clínicos usados para decidir qué probabilidades son relevantes.
// Fuente única de verdad — si el equipo clínico decide cambiarlos, se toca
// SOLO este archivo.

/**
 * Probabilidad mínima (0..1) para considerar una patología "relevante" y
 * mostrarla en el informe. Por debajo de este umbral la señal se considera
 * ruido y no se muestra para no saturar al radiólogo.
 */
export const UMBRAL_PATOLOGIA = 0.3

/**
 * Umbral de Youden — punto de operación elegido para el clasificador binario
 * de carcinoma. Por encima de este valor se reporta hallazgo positivo.
 */
export const UMBRAL_YOUDEN = 0.514

/**
 * Conjunto de etiquetas que el modelo usa para clasificar "carcinoma".
 * Se mantiene en español porque así las devuelve el modelo; si el pipeline
 * cambia a inglés, se actualiza aquí.
 */
export const ETIQUETAS_CARCINOMA: readonly string[] = [
    'Masa (posible tumor)',
    'Nódulo (posible tumor)',
] as const

/**
 * Rangos para calcular la severidad cualitativa.
 * La severidad es solo un color/etiqueta de UI; el valor clínico real es la
 * probabilidad numérica del modelo.
 */
export const RANGOS_SEVERIDAD = {
    /** 0..baja → "baja" */
    baja: 0.3,
    /** baja..media → "media" */
    media: 0.6,
    /** media..1 → "alta" */
} as const
