// lib/utils/markdown.ts
export function md(raw: string): string {
    // Separar bloques de código para no procesarlos
    const codeBlocks: string[] = []
    let s = raw.replace(/```([\s\S]*?)```/g, (_, c) => {
        codeBlocks.push(`<pre>${c.trim()}</pre>`)
        return `%%CODE_${codeBlocks.length - 1}%%`
    })

    s = s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')

        // Headings — h1 a h4
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm,  '<h3>$1</h3>')
        .replace(/^## (.+)$/gm,   '<h2>$1</h2>')
        .replace(/^# (.+)$/gm,    '<h1>$1</h1>')

        // Negrita e itálica
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g,     '<em>$1</em>')

        // Listas — agrupar <li> consecutivos en <ul>
        .replace(/^[*\-•] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)

        // Listas numeradas
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')

        // Línea horizontal
        .replace(/^---$/gm, '<hr>')

        // Saltos de línea (no después de elementos de bloque)
        .replace(/(?<!>)\n(?!<(h[1-4]|ul|li|hr|pre))/g, '<br>')
        .replace(/\n/g, '')

    // Restaurar bloques de código
    s = s.replace(/%%CODE_(\d+)%%/g, (_, i) => codeBlocks[parseInt(i)])

    return s
}