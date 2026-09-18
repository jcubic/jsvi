import type { ViEditor } from '../vi.esm.js';

/**
 * `keyCode` values for the non-printable keys jsvi's `keyfix` (keydown)
 * handler recognizes (vi.js:2280-2306). Raw browser codes are accepted
 * directly, no need for the legacy synthetic 57373-57376 arrow codes.
 */
export const Keys = {
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    ESC: 27,
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
