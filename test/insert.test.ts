import { describe, expect, it } from 'vitest';
import createEditor, { type ViEditor } from '../vi.esm.js';
import { Keys, esc, enter, key, press, type } from './keys.js';

function newEditor(content = 'hello\nworld'): { textarea: HTMLTextAreaElement; editor: ViEditor } {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    const editor = createEditor(textarea);
    return { textarea, editor };
}

function cleanup({ textarea, editor }: { textarea: HTMLTextAreaElement; editor: ViEditor }) {
    editor.disable(false);
    textarea.remove();
}

describe('insert mode entry points', () => {
    it('"i" inserts before the cursor', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'i');
        type(editor, 'X');
        esc(editor);
        expect(editor.freeze()).toBe('Xhello\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"a" inserts after the cursor', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'a');
        type(editor, 'X');
        esc(editor);
        expect(editor.freeze()).toBe('hXello\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"A" appends at the end of the line regardless of cursor column', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'l');
        press(editor, 'l');
        press(editor, 'A');
        type(editor, 'X');
        esc(editor);
        expect(editor.freeze()).toBe('helloX\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"I" inserts at the start of the line regardless of cursor column', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'l');
        press(editor, 'l');
        press(editor, 'I');
        type(editor, 'X');
        esc(editor);
        expect(editor.freeze()).toBe('Xhello\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"o" opens a new line below the current one', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'o');
        type(editor, 'new');
        esc(editor);
        expect(editor.freeze()).toBe('hello\nnew\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"O" opens a new line above the current one', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'O');
        type(editor, 'new');
        esc(editor);
        expect(editor.freeze()).toBe('new\nhello\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"R" overwrites existing characters instead of inserting', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'R');
        type(editor, 'ZZZ');
        esc(editor);
        expect(editor.freeze()).toBe('ZZZlo\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"S" replaces the whole current line', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'j');
        press(editor, 'S');
        type(editor, 'bye');
        esc(editor);
        expect(editor.freeze()).toBe('hello\nbye\n');
        cleanup({ textarea, editor });
    });

    it('"C" changes from the cursor to end of line', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'l');
        press(editor, 'l');
        press(editor, 'C');
        type(editor, 'XYZ');
        esc(editor);
        expect(editor.freeze()).toBe('heXYZ\nworld\n');
        cleanup({ textarea, editor });
    });

    it('"D" deletes from the cursor to end of line without entering insert mode', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'l');
        press(editor, 'l');
        press(editor, 'D');
        expect(editor.freeze()).toBe('he\nworld\n');
        // still in command mode: "x" deletes a character instead of being
        // typed literally
        press(editor, 'h');
        press(editor, 'x');
        expect(editor.freeze()).toBe('e\nworld\n');
        cleanup({ textarea, editor });
    });

    it('Enter splits the line at the cursor while in insert mode', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'i');
        type(editor, 'ab');
        enter(editor);
        esc(editor);
        expect(editor.freeze()).toBe('ab\nhello\nworld\n');
        cleanup({ textarea, editor });
    });

    it('Esc returns to command mode so subsequent keys act as commands', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'i');
        type(editor, 'X');
        esc(editor);
        // cursor is back on the "X" we just typed; "x" deletes it as a
        // command instead of inserting the literal character
        press(editor, 'x');
        expect(editor.freeze()).toBe('hello\nworld\n');
        cleanup({ textarea, editor });
    });
});

describe('backspace', () => {
    function setup(content: string) {
        return newEditor(content);
    }

    it('deletes the character before the cursor mid-line', () => {
        const { textarea, editor } = setup('hello');
        press(editor, 'l');
        press(editor, 'l');
        press(editor, 'l');
        press(editor, 'i');
        key(editor, Keys.BACKSPACE);
        esc(editor);
        expect(editor.freeze()).toBe('helo\n');
        cleanup({ textarea, editor });
    });

    it('joins the current line onto the previous one at column 0', () => {
        const { textarea, editor } = setup('123\n456');
        press(editor, 'j');
        press(editor, 'i');
        key(editor, Keys.BACKSPACE);
        esc(editor);
        expect(editor.freeze()).toBe('123456\n');
        cleanup({ textarea, editor });
    });

    it('places the cursor exactly at the join point', () => {
        const { textarea, editor } = setup('123\n456');
        press(editor, 'j');
        press(editor, 'i');
        key(editor, Keys.BACKSPACE);
        type(editor, '|');
        esc(editor);
        expect(editor.freeze()).toBe('123|456\n');
        cleanup({ textarea, editor });
    });

    it('removes an empty line and joins onto the previous one', () => {
        const { textarea, editor } = setup('123\n');
        press(editor, 'j');
        press(editor, 'i');
        key(editor, Keys.BACKSPACE);
        esc(editor);
        expect(editor.freeze()).toBe('123\n');
        cleanup({ textarea, editor });
    });

    it('is a no-op at the very start of the buffer', () => {
        const { textarea, editor } = setup('abc');
        press(editor, 'i');
        key(editor, Keys.BACKSPACE);
        esc(editor);
        expect(editor.freeze()).toBe('abc\n');
        cleanup({ textarea, editor });
    });
});
