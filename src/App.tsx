import React, { useEffect, useRef, useState } from 'react';
import type { BoxState, ServerMessage, ClientMessage } from './types';

<<<<<<< HEAD

const API_BASE = 'http://localhost:8000';
const ES_URL = `${API_BASE}/events`;

=======
//const WS_URL = `ws://localhost:8080/ws`;
const WS_URL = `ws://bff.nim.games.jf-homelab.de/ws`;
>>>>>>> 2645822800ced6c8261d9602b9073293a7ca0040

export default function App() {
    const [boxes, setBoxes] = useState<BoxState>([true, true, true, true, true]);
    const [connected, setConnected] = useState(false);
    const esRef = useRef<EventSource | null>(null);


    useEffect(() => {
        const es = new EventSource(ES_URL);
        esRef.current = es;

        console.log('[SSE] connecting to', ES_URL);
        es.onopen = () => { console.log('[SSE] open'); setConnected(true); };
        es.onerror = (e) => { console.warn('[SSE] error', e); setConnected(false); };
        es.onmessage = (ev) => {
            // Debug: zeig die ersten Bytes
            // console.debug('[SSE] message', ev.data?.slice(0, 80));
            try {
                const msg: ServerMessage = JSON.parse(ev.data);
                if (msg.type === 'state') setBoxes(msg.boxes);
            } catch {}
        };

        return () => es.close();
    }, []);



    const post = (path: string, payload?: unknown) =>
        fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload ? JSON.stringify(payload) : undefined,
        }).catch(() => {});


    const removeBox = (i: number) => {
        if (!connected) return;
        const msg: ClientMessage = { type: 'remove', index: i };
        post('/remove', msg);
    };


    const reset = () => {
        if (!connected) return;
        const msg: ClientMessage = { type: 'reset' } as any; // Body wird auf Server-Seite ignoriert
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
