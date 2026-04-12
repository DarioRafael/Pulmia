// Cliente tipado del modelo FastAPI.
// Este módulo es la ÚNICA frontera entre la app y el servicio de visión —
// si el contrato del modelo cambia, se ajusta aquí y no hay que tocar rutas.

import type { ResultadoAnalisis } from '@/lib/tipos'
import type { FastAPIPredictResponse } from './tipos'

const FASTAPI_URL = process.env.FASTAPI_URL ?? 'http://localhost:8000'

/**
 * Error devuelto por el cliente del modelo. Envolver errores permite que los
 * route handlers devuelvan mensajes homogéneos sin conocer detalles de fetch.
 */
export class ModeloError extends Error {
    readonly codigo: 'sin_conexion' | 'respuesta_invalida' | 'error_remoto'

    constructor(codigo: ModeloError['codigo'], mensaje: string) {
        super(mensaje)
        this.codigo = codigo
        this.name = 'ModeloError'
    }
}

/**
 * Llama al endpoint `/predict` de FastAPI con una imagen y devuelve el
 * resultado ya normalizado al tipo `ResultadoAnalisis` del dominio.
 *
 * Acepta un `Blob` o `Buffer` para máxima flexibilidad: los route handlers
 * reciben un `File` del FormData y los módulos internos pueden reconstruir
 * un `Blob` a partir de base64.
 */
export async function predecirRadiografia(
    imagen: Blob,
    nombreArchivo: string,
): Promise<ResultadoAnalisis> {
    const formData = new FormData()
    formData.append('file', imagen, nombreArchivo)

    let res: Response
    try {
        res = await fetch(`${FASTAPI_URL}/predict`, { method: 'POST', body: formData })
    } catch (err) {
        throw new ModeloError(
            'sin_conexion',
            `No se pudo conectar con FastAPI en ${FASTAPI_URL}: ${String(err)}`,
        )
    }

    if (!res.ok) {
        const texto = await res.text().catch(() => '(sin cuerpo)')
        throw new ModeloError('error_remoto', `FastAPI respondió ${res.status}: ${texto}`)
    }

    let data: FastAPIPredictResponse
    try {
        data = (await res.json()) as FastAPIPredictResponse
    } catch {
        throw new ModeloError('respuesta_invalida', 'FastAPI devolvió JSON inválido.')
    }

    // Validación mínima de shape — si el contrato cambia queremos un error
    // claro en el servidor y no un `undefined` propagándose a la UI.
    if (typeof data.cancer_probability !== 'number' || typeof data.cancer_result !== 'string') {
        throw new ModeloError('respuesta_invalida', 'Respuesta de FastAPI sin campos esperados.')
    }

    return {
        probabilidadCarcinoma: data.cancer_probability,
        etiquetaCarcinoma: data.cancer_result,
        patologias: data.pathologies ?? {},
        ...(data.gradcam_image !== undefined && { gradcamBase64: data.gradcam_image }),
    }
}
