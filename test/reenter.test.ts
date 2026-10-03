import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import createEditor, { type ViEditor } from '../vi.esm.js';
import { press, type } from './keys.js';

/**
 * The editor's DOM lives in closure variables shared by every session, so
 * exiting has to drop them - otherwise the next `vi()` call reuses the same
 * nodes along with whatever inline styles the previous session left on them.
 * The visible symptom was the hidden "backing" textarea keeping the
 * `display: none` that teardown puts on it: it is what holds the real focus
 * while the editor runs, and a `display: none` element cannot be focused, so
 * every session after the first left the keyboard on whatever had focus
 * before - in an embedding page, an iframe in another pane, whose document
 * never forwards keystrokes to the editor's document-level handlers.
 */
describe('re-entering the editor', () => {
    let textarea: HTMLTextAreaElement;
    let editor: ViEditor | undefined;

    function start(content: string, options: Record<string, unknown> = {}) {
        textarea.value = content;
        editor = createEditor(textarea, { padding: 10, ...options });
        return editor;
    }

    function wrappers() {
        return document.querySelectorAll('.vi-editor');
    }

    function backing(): HTMLTextAreaElement | null {
        return document.querySelector('.vi-editor textarea');
    }

    function term(): HTMLElement | null {
        return document.querySelector('.vi-editor .editor');
    }

    beforeEach(() => {
        textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
    });

    afterEach(() => {
        // tolerated so a test fails on its own assertion rather than here -
        // `disable()` being safe to call twice is its own test below
        try { editor?.disable(false); } catch { /* already torn down */ }
        editor = undefined;
        textarea.remove();
    });

    it('removes its DOM on exit', () => {
        const first = start('line one\nline two');
        expect(wrappers()).toHaveLength(1);

        first.disable(false);
        expect(wrappers()).toHaveLength(0);
    });

    it('builds a fresh backing textarea for each session', () => {
        const first = start('line one\nline two');
        const before = backing();
        expect(before).not.toBeNull();
        first.disable(false);

        start('line one\nline two');
        const after = backing();
        expect(after).not.toBeNull();
        // a brand new node, not the previous one carrying its old styles
        expect(after).not.toBe(before);
        expect(after!.isConnected).toBe(true);
        // `display: none` would make `backing.focus()` a silent no-op in a
        // real browser - it stays invisible through `visibility: hidden` and
        // a 1x1 size, which still allow focus
        expect(after!.style.display).not.toBe('none');
    });

    it('does not leave a second wrapper behind across sessions', () => {
        const first = start('a');
        first.disable(false);
        const second = start('b');
        expect(wrappers()).toHaveLength(1);
        second.disable(false);
        expect(wrappers()).toHaveLength(0);
    });

    it('accepts insert-mode input on a second session', () => {
        const first = start('line one\nline two');
        press(first, 'i');
        type(first, 'X');
        press(first, '\x1b');
        expect(first.freeze()).toBe('Xline one\nline two\n');
        first.disable(false);

        const second = start('line one\nline two');
        press(second, 'i');
        type(second, 'Z');
        press(second, '\x1b');
        expect(second.freeze()).toBe('Zline one\nline two\n');
    });

    it('does not leak the :kwak background image into the next session', () => {
        const first = start('hello');
        first.command(':kwak');
        expect(term()!.style.backgroundImage).toContain('ducky');
        first.disable(false);

        start('hello');
        expect(term()!.style.backgroundImage).toBe('');
    });

    it('does not leak color options into a session that omits them', () => {
        const first = start('hello', { color: 'rgb(255, 0, 0)', backgroundColor: 'rgb(0, 0, 255)' });
        expect(term()!.style.color).toBe('rgb(255, 0, 0)');
        first.disable(false);

        start('hello');
        expect(term()!.style.color).toBe('');
        expect(term()!.style.backgroundColor).toBe('');
    });

    it('restores the page document handlers after each session', () => {
        const onkeydown = () => {};
        document.onkeydown = onkeydown;

        const first = start('hello');
        expect(document.onkeydown).not.toBe(onkeydown);
        first.disable(false);
        expect(document.onkeydown).toBe(onkeydown);

        const second = start('hello');
        expect(document.onkeydown).not.toBe(onkeydown);
        second.disable(false);
        expect(document.onkeydown).toBe(onkeydown);

        document.onkeydown = null;
    });

    it('restores the page document handlers when re-initialised on the same textarea', () => {
        const onkeydown = () => {};
        document.onkeydown = onkeydown;

        start('hello');
        // second init without an exit in between - the live session has to be
        // torn down rather than silently abandoned
        const second = start('hello again');
        expect(wrappers()).toHaveLength(1);
        second.disable(false);
        expect(document.onkeydown).toBe(onkeydown);

        document.onkeydown = null;
    });

    it('cancels queued redraws so they cannot fire after teardown', () => {
        vi.useFakeTimers();
        try {
            const first = start('line one\nline two');
            // exit before the redraw scheduled by init has had a chance to
            // run - it must not fire against the dropped nodes
            first.disable(false);
            expect(() => vi.runAllTimers()).not.toThrow();
        } finally {
            vi.useRealTimers();
        }
    });

    it('tolerates disable() being called twice', () => {
        const first = start('hello');
        first.disable(false);
        expect(() => first.disable(false)).not.toThrow();
        expect(wrappers()).toHaveLength(0);
    });

    it('still saves to the textarea on :wq after a previous session', () => {
        const first = start('one');
        first.disable(false);

        const second = start('two');
        press(second, 'i');
        type(second, 'A');
        press(second, '\x1b');
        second.command(':wq');
        expect(textarea.value).toBe('Atwo\n');
    });
});
