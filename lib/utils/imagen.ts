// Utilidades de manejo de imágenes en cliente.
//
// El problema: las radiografías originales pueden ser DataURLs muy grandes
// (5–15 MB en base64). localStorage está limitado a ~5–10 MB total en la
// mayoría de navegadores, así que guardar varias radiografías sin comprimir
// produce QuotaExceededError.
//
// Estrategia: redimensionar la imagen a una resolución razonable (por defecto
// 1280 px en el lado mayor) y recomprimirla como JPEG con calidad alta. Una
// radiografía de 5–15 MB queda típicamente en 200–600 KB sin pérdida visible
// para el médico.

/** Resultado de medir el peso aproximado de un DataURL base64. */
export function tamanoDataUrlBytes(dataUrl: string): number {
    const coma = dataUrl.indexOf(',')
    if (coma === -1) return 0
    const base64 = dataUrl.slice(coma + 1)
    // Cada 4 chars de base64 = 3 bytes; ajustar por padding.
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

/**
 * Comprime una imagen DataURL redimensionándola y recomprimiéndola.
 *
 * - `maxDimension`: límite del lado mayor (px). Se mantiene la proporción.
 * - `quality`: 0..1 para JPEG. Para radiografías 0.85 es indistinguible.
 *
 * Si el navegador no expone Canvas (SSR), devuelve el original sin cambios.
 */
export async function comprimirImagen(
    dataUrl: string,
    maxDimension = 1280,
    quality = 0.85,
): Promise<string> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return dataUrl
    }
    if (!dataUrl.startsWith('data:image/')) {
        return dataUrl
    }

    const img = await cargarImagen(dataUrl)

    // Si ya está dentro del límite y es pequeña, no la tocamos.
    const ladoMayor = Math.max(img.naturalWidth, img.naturalHeight)
    const sePuedeBaipasear = ladoMayor <= maxDimension && tamanoDataUrlBytes(dataUrl) < 400 * 1024
    if (sePuedeBaipasear) {
        return dataUrl
    }

    const escala = Math.min(1, maxDimension / ladoMayor)
    const w = Math.max(1, Math.round(img.naturalWidth * escala))
    const h = Math.max(1, Math.round(img.naturalHeight * escala))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl

    // Fondo blanco para evitar artefactos al pasar PNG con alpha a JPEG.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)

    // JPEG da el mejor ratio para radiografías (escala de grises).
    return canvas.toDataURL('image/jpeg', quality)
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
        img.src = src
    })
}
