import React, { useEffect, useRef, useState } from 'react';
import type { BoxState, ServerMessage, ClientMessage } from './types';

const WS_URL = `ws://localhost:8080/ws`;
//const WS_URL = `wss://bff.nim.games.jf-homelab.de/ws`;

export default function App() {
    const [boxes, setBoxes] = useState<BoxState>([true, true, true, true, true]);
    const [connected, setConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);

        ws.onmessage = (ev) => {
            try {
                const msg: ServerMessage = JSON.parse(ev.data);
                if (msg.type === 'state') setBoxes(msg.boxes);
            } catch { /* empty */ }
        };

        return () => ws.close();
    }, []);

    const removeBox = (i: number) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const msg: ClientMessage = { type: 'remove', index: i };
        wsRef.current.send(JSON.stringify(msg));
    };

    const reset = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const msg: ClientMessage = { type: 'reset' };
        wsRef.current.send(JSON.stringify(msg));
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