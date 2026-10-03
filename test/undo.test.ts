import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, keys, newEditor } from './harness.js';
import { press, type } from './keys.js';

afterEach(cleanupEditors);

describe('u (undo)', () => {
    it('restores the buffer after a line delete', () => {
        const { editor } = newEditor('hello\nworld');
        keys(editor, 'dd');
        expect(editor.freeze()).toBe('world\n');
        keys(editor, 'u');
        expect(editor.freeze()).toBe('hello\nworld\n');
    });

    it('is a toggle, so a second u redoes the change', () => {
        const { editor } = newEditor('hello\nworld');
        keys(editor, 'dd');
        keys(editor, 'u');
        keys(editor, 'u');
        expect(editor.freeze()).toBe('world\n');
    });

    it('undoes a whole insert-mode session as one change', () => {
        const { editor } = newEditor('hello');
        press(editor, 'A');
        type(editor, '!!!');
        press(editor, '\x1b');
        expect(editor.freeze()).toBe('hello!!!\n');
        keys(editor, 'u');
        expect(editor.freeze()).toBe('hello\n');
    });

    it('undoes a character delete', () => {
        const { editor } = newEditor('abc');
        keys(editor, 'x');
        keys(editor, 'u');
        expect(editor.freeze()).toBe('abc\n');
    });

    it('undoes a shift', () => {
        const { editor } = newEditor('hello');
        keys(editor, '>>');
        keys(editor, 'u');
        expect(editor.freeze()).toBe('hello\n');
    });

    it('is driveable through the ex command as well', () => {
        const { editor } = newEditor('hello\nworld');
        keys(editor, 'dd');
        editor.command(':u');
        expect(editor.freeze()).toBe('hello\nworld\n');
    });
});

describe('U (restore line)', () => {
    it('restores the line edited in insert mode', () => {
        const { editor } = newEditor('hello\nworld');
        press(editor, 'A');
        type(editor, '!!!');
        press(editor, '\x1b');
        expect(editor.freeze()).toBe('hello!!!\nworld\n');
        keys(editor, 'U');
        expect(editor.freeze()).toBe('hello\nworld\n');
    });
});

describe('undo snapshot api', () => {
    it('save_undo makes the current buffer the undo point', () => {
        const { editor } = newEditor('hello');
        keys(editor, 'x');
        editor.save_undo();
        keys(editor, 'x');
        keys(editor, 'u');
        expect(editor.freeze()).toBe('ello\n');
    });

    it('save_undo_line leaves the buffer untouched', () => {
        const { editor } = newEditor('hello');
        editor.save_undo_line();
        expect(editor.freeze()).toBe('hello\n');
    });
});
