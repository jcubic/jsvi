import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, keys, newEditor } from './harness.js';
import { press, type } from './keys.js';

afterEach(cleanupEditors);

/**
 * `it.fails` marks behaviour that differs from vi. Those tests assert what vi
 * does, so each one starts passing once the gap is closed - at which point it
 * should become a plain `it`.
 */

/** Runs a change operator, types `hi`, and leaves insert mode. */
function change(content: string, operator: string) {
    const { editor } = newEditor(content);
    keys(editor, operator);
    type(editor, 'hi');
    press(editor, '\x1b');
    return editor.freeze();
}

describe('delete operator', () => {
    it('dd deletes the current line', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'dd');
        expect(editor.freeze()).toBe('b\nc\nd\n');
    });

    it('Ndd deletes N lines', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, '2dd');
        expect(editor.freeze()).toBe('c\nd\n');
    });

    it('dw deletes to the start of the next word, taking the space', () => {
        const { editor } = newEditor('hello world foo');
        keys(editor, 'dw');
        expect(editor.freeze()).toBe('world foo\n');
    });

    it('dj deletes the current and following line', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'dj');
        expect(editor.freeze()).toBe('c\nd\n');
    });

    it('dG deletes to the end of the buffer', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'dG');
        expect(editor.freeze()).toBe('');
    });

    it('d$ deletes to end of line, leaving the line empty', () => {
        const { editor } = newEditor('hello world');
        keys(editor, 'd$');
        expect(editor.freeze()).toBe('');
    });

    it('D deletes to end of line without entering insert mode', () => {
        const { editor } = newEditor('hello\nworld');
        keys(editor, 'llD');
        expect(editor.freeze()).toBe('he\nworld\n');
        // still in command mode: `x` acts as a command
        keys(editor, 'hx');
        expect(editor.freeze()).toBe('e\nworld\n');
    });
});

describe('change operator', () => {
    it('cc replaces the whole line', () => {
        expect(change('hello world', 'cc')).toBe('hi\n');
    });

    it('C changes from the cursor to end of line', () => {
        expect(change('hello world', 'C')).toBe('hi\n');
    });

    it('c$ changes to end of line', () => {
        expect(change('hello world', 'c$')).toBe('hi\n');
    });

    it('ce changes to the end of the word, leaving the space', () => {
        expect(change('hello world', 'ce')).toBe('hi world\n');
    });

    // jsvi routes `cw` through the same motion as `dw`, so it swallows the
    // trailing space and produces "hiworld". In vi, `cw` is the documented
    // special case that behaves like `ce`
    it.fails('cw changes to the end of the word, leaving the space', () => {
        expect(change('hello world', 'cw')).toBe('hi world\n');
    });

    // jsvi produces "hic" - it deletes both lines and inserts into the
    // survivor instead of replacing the lines with a new one
    it.fails('cj changes whole lines and keeps the survivor on its own line', () => {
        expect(change('a\nb\nc', 'cj')).toBe('hi\nc\n');
    });
});

describe('character delete', () => {
    it('x deletes the character under the cursor', () => {
        const { editor } = newEditor('abc');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('bc\n');
    });

    it('x at the end of the line deletes the last character', () => {
        const { editor } = newEditor('abc');
        keys(editor, '$x');
        expect(editor.freeze()).toBe('ab\n');
    });

    it('X deletes the character before the cursor', () => {
        const { editor } = newEditor('abc');
        keys(editor, 'lX');
        expect(editor.freeze()).toBe('bc\n');
    });

    it('X is a no-op at the start of the line', () => {
        const { editor } = newEditor('abc');
        keys(editor, 'X');
        expect(editor.freeze()).toBe('abc\n');
    });
});

describe('shift operators', () => {
    it('>> indents the line by one shiftwidth', () => {
        const { editor } = newEditor('hello');
        keys(editor, '>>');
        expect(editor.freeze()).toBe('    hello\n');
    });

    it('<< removes one shiftwidth', () => {
        const { editor } = newEditor('    hello');
        keys(editor, '<<');
        expect(editor.freeze()).toBe('hello\n');
    });

    it('<< is a no-op on an unindented line', () => {
        const { editor } = newEditor('hello');
        keys(editor, '<<');
        expect(editor.freeze()).toBe('hello\n');
    });

    it('N<< unindents N lines', () => {
        const { editor } = newEditor('    a\n    b\nc');
        keys(editor, '2<<');
        expect(editor.freeze()).toBe('a\nb\nc\n');
    });

    // jsvi picks the right number of lines but scales the indent with the
    // count as well: 1>> gives 8 spaces, 2>> gives 12 and 3>> gives 16, where
    // vi always shifts by exactly one shiftwidth
    it.fails('N>> indents N lines by one shiftwidth', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, '2>>');
        expect(editor.freeze()).toBe('    a\n    b\nc\nd\n');
    });
});

describe('visual mode', () => {
    it('v selects characters and d deletes them', () => {
        const { editor } = newEditor('ab\ncd');
        keys(editor, 'vld');
        expect(editor.freeze()).toBe('\ncd\n');
    });

    it('v on a single character deletes just that character', () => {
        const { editor } = newEditor('abc');
        keys(editor, 'vd');
        expect(editor.freeze()).toBe('bc\n');
    });

    it('V selects the line and d deletes it', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'Vd');
        expect(editor.freeze()).toBe('b\nc\nd\n');
    });

    it('V extended with j deletes both lines', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'Vjd');
        expect(editor.freeze()).toBe('c\nd\n');
    });

    // jsvi leaves two empty lines ("\n") instead of joining what is left of
    // the first and last line, so the `d` of "cd" is lost as well
    it.fails('v across a line boundary joins the remainder', () => {
        const { editor } = newEditor('ab\ncd');
        keys(editor, 'vjd');
        expect(editor.freeze()).toBe('d\n');
    });
});
