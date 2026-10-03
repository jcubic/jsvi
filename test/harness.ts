import createEditor, { type ViEditor } from '../vi.esm.js';
import { press, type as typeText } from './keys.js';

export interface Harness {
    textarea: HTMLTextAreaElement;
    editor: ViEditor;
}

const live: Harness[] = [];

/**
 * Creates a textarea in the document and turns it into an editor.
 *
 * jsvi is a singleton: `vi()` tears down any editor that is still open, so
 * only the most recently created one is live. Use them one at a time - a test
 * that needs a second buffer must finish with the first, and an earlier
 * handle must not be touched again once a newer editor exists.
 */
export function newEditor(content = '', options: Record<string, unknown> = {}): Harness {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    const editor = createEditor(textarea, options);
    const harness = { textarea, editor };
    live.push(harness);
    return harness;
}

/**
 * Tears down every editor made since the last call. Register it once per file
 * with `afterEach(cleanupEditors)` so no test has to unwind by hand - that
 * includes tests which already exited through `:q`/`:wq`, because `disable()`
 * is a no-op on an editor that is already torn down.
 */
export function cleanupEditors(): void {
    while (live.length) {
        const { textarea, editor } = live.pop() as Harness;
        editor.disable(false);
        textarea.remove();
    }
}

/** Sends each character of `input` through the command-mode keypress path. */
export function keys(editor: ViEditor, input: string): void {
    for (const ch of input) {
        press(editor, ch);
    }
}

/**
 * Reveals the cursor column by entering insert mode and typing `|` at it, then
 * returns the buffer. Checking a motion this way is the only way to observe
 * the cursor through the public API - but the marker is a real edit, so this
 * has to be the last thing a test does with that buffer.
 */
export function cursorMarker(editor: ViEditor): string {
    press(editor, 'i');
    typeText(editor, '|');
    press(editor, '\x1b');
    return editor.freeze();
}
