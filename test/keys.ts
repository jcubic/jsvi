import type { ViEditor } from '../vi.esm.js';

/**
 * `keyCode` values for the keys jsvi's `keyfix` (keydown, synth=true) path
 * recognizes (vi.js:2280-2306) — use these with `key()`. Note: Enter (13)
 * and Escape (27) are deliberately NOT in that list — real browsers fire
 * `keypress` for them, so jsvi expects them via the synth=false path; use
 * the dedicated `enter()`/`esc()` helpers below instead of `key()` for
 * those. Tab (9) is similarly only handled on the synth=false path inside
 * insert mode (vi.js:3194) — `term_keypress_inner` drops it early
 * (vi.js:2674) when synth=true.
 */
export const Keys = {
    BACKSPACE: 8,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    PGUP: 33,
    PGDN: 34,
    HOME: 36,
    END: 35,
    INSERT: 45,
    DELETE: 46
} as const;

interface FakeKeyEvent {
    which: number;
    charCode?: number;
    keyCode?: number;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
}

/**
 * Sends a single printable character through the `keypress` (synth=false)
 * path, mirroring what a real `keypress` DOM event delivers.
 */
export function press(editor: ViEditor, ch: string, modifiers: Partial<FakeKeyEvent> = {}): void {
    const code = ch.charCodeAt(0);
    const event: FakeKeyEvent = { which: code, charCode: code, ...modifiers };
    editor.keypress_inner(event as unknown as KeyboardEvent, false);
}

/**
 * Sends a non-printable key (arrows, Backspace, Enter, Esc, Tab, Delete,
 * Home/End, PageUp/PageDown) through the `keyfix` (synth=true) path.
 */
export function key(editor: ViEditor, keyCode: number, modifiers: Partial<FakeKeyEvent> = {}): void {
    const event: FakeKeyEvent = { which: keyCode, keyCode, ...modifiers };
    editor.keypress_inner(event as unknown as KeyboardEvent, true);
}

/** Types out a string one character at a time via `press`. */
export function type(editor: ViEditor, text: string): void {
    for (const ch of text) {
        press(editor, ch);
    }
}

/** Sends Enter (splits the line in insert mode, runs the command line in ex/search entry). */
export function enter(editor: ViEditor): void {
    press(editor, '\r');
}

/** Sends Escape (returns to command mode from insert/replace/ex/search entry). */
export function esc(editor: ViEditor): void {
    press(editor, '\x1b');
}
