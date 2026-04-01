export function TypingIndicator() {
    return (
        <div className="msg-wrap ai" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
                style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 8,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '0 2px',
                }}
            >
        <span
            style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}
        />
                Sistema IA
            </div>
            <div
                style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    borderLeft: '2px solid var(--accent)',
                    borderRadius: '3px var(--r12) var(--r12) var(--r12)',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',
                    width: 'fit-content',
                }}
            >
                <Dot delay={0} />
                <Dot delay={160} />
                <Dot delay={320} />
            </div>
        </div>
    )
}

function Dot({ delay }: { delay: number }) {
    return (
        <span
            style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'inline-block',
                animation: `t-bounce 1.4s ease-in-out infinite ${delay}ms`,
            }}
        />
    )
}