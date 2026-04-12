// Re-exports del módulo de utilidades.

export {
    UMBRAL_PATOLOGIA,
    UMBRAL_YOUDEN,
    ETIQUETAS_CARCINOMA,
    RANGOS_SEVERIDAD,
} from './umbrales'
export {
    aPorcentaje,
    calcularSeveridad,
    patologiasRelevantes,
    aInforme,
} from './formato'
export { formatearFecha, formatearFechaHora, ahoraISO } from './fechas'
