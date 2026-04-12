// POST /api/analyze
// Endpoint principal del sistema clínico.
// Recibe una imagen (multipart/form-data), la envía a FastAPI para predecir,
// normaliza el resultado a InformeAnalisis y lo devuelve al cliente.
// También guarda el resultado en el estado compartido para que el chat pueda
// contextualizar las conversaciones.

import { NextRequest, NextResponse } from 'next/server'
import { predecirRadiografia, ModeloError } from '@/lib/modelo'
import { aInforme } from '@/lib/utils/formato'
import { guardarUltimoAnalisis } from '@/lib/servidor/estado-analisis'

export async function POST(req: NextRequest) {
    let formData: FormData
    try {
        formData = await req.formData()
    } catch {
        return NextResponse.json({ error: 'Se esperaba multipart/form-data.' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: 'Se requiere un archivo "file".' }, { status: 400 })
    }

    const nombreArchivo = file instanceof File ? file.name : 'imagen.png'

    try {
        const resultado = await predecirRadiografia(file, nombreArchivo)

        // Guardar en memoria para que /api/chat tenga contexto.
        guardarUltimoAnalisis(resultado)

        const informe = aInforme(resultado)

        return NextResponse.json({
            informe,
            gradcamBase64: resultado.gradcamBase64 ?? null,
        })
    } catch (err) {
        if (err instanceof ModeloError) {
            return NextResponse.json(
                { error: err.message },
                { status: err.codigo === 'sin_conexion' ? 502 : 500 },
            )
        }
        return NextResponse.json(
            { error: `Error inesperado: ${String(err)}` },
            { status: 500 },
        )
    }
}
