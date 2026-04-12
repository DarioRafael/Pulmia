// Helpers de formateo de fechas.
// Usamos strings ISO 8601 en el modelo y formateamos al vuelo aquí para
// evitar mezclar zonas horarias, Date objects en serialización, etc.

/**
 * Formatea una fecha ISO como "15 mar, 14:32" en es-MX.
 * Si la fecha es inválida devuelve una cadena vacía — las fechas mal
 * formadas en este sistema no deberían llegar a la UI.
 */
export function formatearFechaHora(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Formatea una fecha ISO como "15 mar 2026" en es-MX.
 */
export function formatearFecha(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Devuelve la fecha actual en formato ISO.
 * Existe como función para poder mockear en tests sin tocar `Date` global.
 */
export function ahoraISO(): string {
    return new Date().toISOString()
}
