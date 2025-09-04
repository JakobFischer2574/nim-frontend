// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { BoxState, ServerMessage, ClientMessage } from './types';

// => a) Lokal direkt aufs Backend (Port 3000)
const API_BASE = 'http://localhost:3000';

// => b) Besser: Same-Origin default + optional .env Override (prod-tauglich)
//const API_BASE = (import.meta as any)?.env?.VITE_API_BASE ?? '';

const ES_URL = `${API_BASE}/events`;

// kleines Backoff für Reconnect
function backoff(attempt: number) {
    // 0.5s, 1s, 2s, 4s, max 5s
    return Math.min(500 * 2 ** attempt, 5000);
}

export default function App() {
    const [boxes, setBoxes] = useState<BoxState>([true, true, true, true, true]);
    const [connected, setConnected] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const esRef = useRef<EventSource | null>(null);
    const reconnectTimer = useRef<number | null>(null);

    useEffect(() => {
        let closed = false;

        const connect = () => {
            if (closed) return;
            const es = new EventSource(ES_URL);
            esRef.current = es;

            console.log('[SSE] connecting to', ES_URL);
            es.onopen = () => {
                console.log('[SSE] open');
                setConnected(true);
                setAttempt(0);
            };
            es.onerror = (e) => {
                console.warn('[SSE] error', e);
                setConnected(false);
                es.close();
                const next = backoff(attempt);
                if (!closed) {
                    if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
                    reconnectTimer.current = window.setTimeout(() => {
                        setAttempt((a) => a + 1);
                        connect();
                    }, next);
                }
            };
            es.onmessage = (ev) => {
                try {
                    const msg: ServerMessage = JSON.parse(ev.data);
                    if (msg.type === 'state') setBoxes(msg.boxes);
                } catch {
                    console.error('[SSE] invalid message', ev.data);
                }
            };
        };

        connect();

        const onVis = () => {
            if (document.visibilityState === 'visible' && !connected) {
                if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
                setAttempt((a) => a + 1);
                connect();
            }
        };
        document.addEventListener('visibilitychange', onVis);

        return () => {
            closed = true;
            document.removeEventListener('visibilitychange', onVis);
            if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
            esRef.current?.close();
        };
    }, [attempt, connected]);

    async function post(path: string, payload?: unknown) {
        const ctrl = new AbortController();
        const timeout = window.setTimeout(() => ctrl.abort(), 8000);
        try {
            const res = await fetch(`${API_BASE}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload ? JSON.stringify(payload) : undefined,
                signal: ctrl.signal,
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                console.warn('[POST]', path, res.status, txt);
            }
        } catch (e) {
            console.error('[POST failed]', path, e);
        } finally {
            window.clearTimeout(timeout);
        }
    }

    const removeBox = (i: number) => {
        const msg: ClientMessage = { type: 'remove', index: i };
        post('/remove', msg);
    };

    const reset = () => {
        const msg: ClientMessage = { type: 'reset' } as const;
        post('/reset', msg);
    };

    return (
        <div style={{
            minHeight: '100svh',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial'
        }}>
            <div style={{ width: 420, maxWidth: '92vw' }}>
                <header style={{ textAlign: 'center', marginBottom: 16 }}>
                    <h1 style={{ margin: 0 }}>🍰 CakeBoxes</h1>
                    <p style={{ margin: 0, opacity: 0.7 }}>
                        Status: {connected ? 'online' : 'offline'}
                    </p>
                </header>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 12,
                    marginBottom: 16
                }}>
                    {boxes.map((exists, i) => (
                        <button
                            key={i}
                            onClick={() => exists && removeBox(i)}
                            disabled={!exists}
                            style={{
                                aspectRatio: '1 / 1',
                                borderRadius: 16,
                                border: '1px solid #ddd',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                fontSize: 24,
                                cursor: exists ? 'pointer' : 'not-allowed',
                                background: exists ? 'white' : '#f3f4f6'
                            }}
                            title={exists ? 'Wegnehmen!' : 'Schon weg!'}
                        >
                            {exists ? '🍰' : '🚫'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button onClick={reset} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd' }}>
                        Reset (alle 5 zurück)
                    </button>
                </div>
            </div>
        </div>
    );
}
