export function TypingIndicator() {
    return (
        <div className="msg-wrap ai" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Etiqueta */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '0 4px',
                fontFamily: 'var(--mono)',
                fontSize: 8,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
            }}>
                <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: 'var(--r3)',
                    background: 'var(--accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
                        <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                Sistema IA
            </div>

            {/* Burbuja con puntos */}
            <div style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderLeft: '2px solid var(--accent)',
                borderRadius: 'var(--r4) var(--r12) var(--r12) var(--r12)',
                padding: '11px 16px',
                display: 'flex',
                gap: 5,
                alignItems: 'center',
                width: 'fit-content',
                boxShadow: 'var(--shadow-sm)',
            }}>
                <Dot delay={0} />
                <Dot delay={180} />
                <Dot delay={360} />
            </div>
        </div>
    )
}

function Dot({ delay }: { delay: number }) {
    return (
        <span style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            opacity: 0.3,
            animation: `t-bounce 1.4s ease-in-out infinite ${delay}ms`,
        }} />
    )
}