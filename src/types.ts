export type BoxState = boolean[]; // true = vorhanden, false = entfernt
export type ServerMessage = { type: 'state'; boxes: BoxState };
export type ClientMessage = { type: 'remove'; index: number } | { type: 'reset' };