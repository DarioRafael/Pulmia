// Funciones de formateo y derivación para mostrar resultados del modelo.
// No contienen IO — son puras y fáciles de testear.

import type {
    InformeAnalisis,
    PatologiaRelevante,
    ResultadoAnalisis,
    Severidad,
} from '@/lib/tipos'
import { ETIQUETAS_CARCINOMA, RANGOS_SEVERIDAD, UMBRAL_PATOLOGIA } from './umbrales'

/**
 * Convierte una probabilidad 0..1 en un porcentaje entero.
 * Usa `Math.round` para no dar falsa precisión ("77.3%" en UI clínica es ruido).
 */
export function aPorcentaje(probabilidad: number): number {
    return Math.round(probabilidad * 100)
}

/**
 * Calcula la severidad cualitativa a partir de la probabilidad de carcinoma.
 * Usado para colorear tarjetas y priorizar revisiones — NO es una decisión médica.
 */
export function calcularSeveridad(probabilidad: number): Severidad {
    if (probabilidad < RANGOS_SEVERIDAD.baja) return 'baja'
    if (probabilidad < RANGOS_SEVERIDAD.media) return 'media'
    return 'alta'
}

/**
 * Ordena y filtra las patologías devueltas por el modelo para mostrar solo
 * las que están por encima del umbral y NO son la etiqueta principal de
 * carcinoma (esa se muestra aparte en el informe).
 */
export function patologiasRelevantes(
    patologias: Readonly<Record<string, number>>,
): readonly PatologiaRelevante[] {
    return Object.entries(patologias)
        .filter(([nombre, prob]) => !ETIQUETAS_CARCINOMA.includes(nombre) && prob > UMBRAL_PATOLOGIA)
        .sort(([, a], [, b]) => b - a)
        .map(([nombre, probabilidad]) => ({
            nombre,
            probabilidad,
            porcentaje: aPorcentaje(probabilidad),
        }))
}

/**
 * Transforma un `ResultadoAnalisis` crudo en un `InformeAnalisis` enriquecido
 * con los valores derivados que la UI necesita. Esta es la frontera entre el
 * DTO del backend y lo que consumen los componentes.
 */
export function aInforme(resultado: ResultadoAnalisis): InformeAnalisis {
    return {
        ...resultado,
        porcentajeCarcinoma: aPorcentaje(resultado.probabilidadCarcinoma),
        patologiasRelevantes: patologiasRelevantes(resultado.patologias),
        severidad: calcularSeveridad(resultado.probabilidadCarcinoma),
    }
}
