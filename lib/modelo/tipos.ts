// Tipos del contrato con el backend FastAPI.
// Estas shapes coinciden exactamente con lo que devuelve el endpoint /predict.

/**
 * Respuesta cruda de FastAPI /predict.
 * No lo consumas desde la UI directamente — usa `aInforme()` para
 * convertirlo en un `InformeAnalisis` tipado con porcentajes.
 */
export interface FastAPIPredictResponse {
    readonly cancer_probability: number
    readonly cancer_result: string
    readonly pathologies: Readonly<Record<string, number>>
    readonly gradcam_image?: string
}
