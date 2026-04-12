'use client'

// Layout del grupo (app): sidebar + header + content + chat bubble.
// Todos los route segments dentro de (app)/ heredan este layout.

import { SidebarApp } from '@/components/layout/sidebar-app'
import { ChatBubble } from '@/features/chat-clinico'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <SidebarApp />
            <main style={{
                flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                height: '100%', overflow: 'hidden', background: 'var(--bg-0)',
            }}>
                {children}
            </main>
            <ChatBubble />

            <style>{`
                @keyframes msg-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: none; }
                }
                @keyframes t-bounce {
                    0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    30%           { transform: translateY(-5px) scale(1.2); opacity: 1; }
                }
                @keyframes mic-pulse {
                    0%   { transform: scale(0.8); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0;   }
                }
                @keyframes dot-stream {
                    0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
                    40%           { opacity: 1; transform: scale(1.3); }
                }
                .msg-wrap:hover .copy-btn { opacity: 1 !important; }
                .msg-wrap:hover .msg-ts   { opacity: 1 !important; }
                .prose-ai h1, .prose-ai h2, .prose-ai h3 { font-size: 13px; font-weight: 650; color: var(--t0); margin: 12px 0 4px; letter-spacing: -0.02em; line-height: 1.3; }
                .prose-ai h1 { font-size: 14px; }
                .prose-ai h2 { font-size: 13px; }
                .prose-ai h3 { font-size: 12.5px; color: var(--t1); }
                .prose-ai p  { margin: 4px 0; }
                .prose-ai ul, .prose-ai ol { padding-left: 18px; margin: 4px 0; }
                .prose-ai li { margin: 2px 0; }
                .prose-ai strong { font-weight: 650; color: var(--t0); }
                .prose-ai em { color: var(--t1); font-style: italic; }
                .prose-ai code { font-family: var(--mono); font-size: 11.5px; background: var(--bg-3); border: 1px solid var(--border); border-radius: 3px; padding: 1px 5px; }
                .prose-ai hr { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
                .prose-ai blockquote { border-left: 2px solid var(--accent); padding-left: 10px; color: var(--t1); margin: 6px 0; }
                .bubble-img { max-width: 100%; border-radius: var(--r8); border: 1px solid var(--border-h); }
            `}</style>
        </div>
    )
}
