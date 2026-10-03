import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, cursorMarker, keys, newEditor } from './harness.js';

afterEach(cleanupEditors);

/**
 * Motions are observed either by deleting the character under the cursor with
 * `x`, or - where the deletion would be ambiguous - with `cursorMarker`, which
 * types a `|` at the cursor.
 *
 * `it.fails` marks behaviour that differs from vi. Those tests assert what vi
 * does, so each one starts passing the moment the gap is closed, at which
 * point it should become a plain `it`.
 */

describe('character motions', () => {
    it('l moves one column right', () => {
        const { editor } = newEditor('abc\ndef');
        keys(editor, 'lx');
        expect(editor.freeze()).toBe('ac\ndef\n');
    });

    it('h moves one column left', () => {
        const { editor } = newEditor('abc\ndef');
        keys(editor, 'llhx');
        expect(editor.freeze()).toBe('ac\ndef\n');
    });

    it('h stops at column 0 instead of wrapping to the previous line', () => {
        const { editor } = newEditor('abc\ndef');
        keys(editor, 'hhhx');
        expect(editor.freeze()).toBe('bc\ndef\n');
    });

    it('j moves down a line', () => {
        const { editor } = newEditor('abc\ndef\nghi');
        keys(editor, 'jx');
        expect(editor.freeze()).toBe('abc\nef\nghi\n');
    });

    it('k moves up a line', () => {
        const { editor } = newEditor('abc\ndef\nghi');
        keys(editor, 'jkx');
        expect(editor.freeze()).toBe('bc\ndef\nghi\n');
    });

    it('k stops on the first line', () => {
        const { editor } = newEditor('abc\ndef');
        keys(editor, 'kkx');
        expect(editor.freeze()).toBe('bc\ndef\n');
    });
});

describe('word motions', () => {
    it('w moves to the start of the next word', () => {
        const { editor } = newEditor('hello world foo');
        keys(editor, 'wx');
        expect(editor.freeze()).toBe('hello orld foo\n');
    });

    it('w repeats across words', () => {
        const { editor } = newEditor('hello world foo');
        keys(editor, 'wwx');
        expect(editor.freeze()).toBe('hello world oo\n');
    });

    it('b moves back to the start of the current word', () => {
        const { editor } = newEditor('hello world foo');
        keys(editor, '$bx');
        expect(editor.freeze()).toBe('hello world oo\n');
    });

    it('e moves to the last character of the word', () => {
        const { editor } = newEditor('hello world');
        keys(editor, 'wex');
        expect(editor.freeze()).toBe('hello worl\n');
    });
});

describe('line motions', () => {
    it('$ moves to the last character of the line', () => {
        const { editor } = newEditor('  hello');
        keys(editor, '$x');
        expect(editor.freeze()).toBe('  hell\n');
    });

    it('0 moves to column 0 including leading whitespace', () => {
        const { editor } = newEditor('  hello');
        keys(editor, '$0x');
        expect(editor.freeze()).toBe(' hello\n');
    });

    // jsvi has no command-mode handler for `^` at all, so the cursor does not
    // move and `x` deletes the leading space instead of the `h`
    it.fails('^ moves to the first non-blank character', () => {
        const { editor } = newEditor('  hello');
        keys(editor, '$^x');
        expect(editor.freeze()).toBe('  ello\n');
    });
});

describe('buffer motions', () => {
    it('G moves to the last line', () => {
        const { editor } = newEditor('a\nb\nc\nd\ne');
        keys(editor, 'Gx');
        expect(editor.freeze()).toBe('a\nb\nc\nd\n');
    });

    it('NG moves to the given line', () => {
        const { editor } = newEditor('a\nb\nc\nd\ne');
        keys(editor, '3Gx');
        expect(editor.freeze()).toBe('a\nb\n\nd\ne\n');
    });

    it('gg moves back to the first line', () => {
        const { editor } = newEditor('a\nb\nc\nd\ne');
        keys(editor, 'Gggx');
        expect(editor.freeze()).toBe('\nb\nc\nd\ne\n');
    });
});

describe('find-character motions', () => {
    it('f jumps forward onto the given character', () => {
        const { editor } = newEditor('abxcdxef');
        keys(editor, 'fxx');
        expect(editor.freeze()).toBe('abcdxef\n');
    });

    it('F jumps backward onto the given character', () => {
        const { editor } = newEditor('abxcdxef');
        keys(editor, '$Fx');
        expect(cursorMarker(editor)).toBe('abxcd|xef\n');
    });

    it('F stays put when the character is not behind the cursor', () => {
        const { editor } = newEditor('abxcdxef');
        keys(editor, 'Fa');
        expect(cursorMarker(editor)).toBe('|abxcdxef\n');
    });

    it('t stops on the character before the target', () => {
        const { editor } = newEditor('abxcdxef');
        keys(editor, 'tx');
        expect(cursorMarker(editor)).toBe('a|bxcdxef\n');
    });

    it('T stops on the character after the target searching backward', () => {
        const { editor } = newEditor('abxcdxef');
        keys(editor, '$Tx');
        expect(cursorMarker(editor)).toBe('abxcdx|ef\n');
    });

    // jsvi has no command-mode handler for `;`, so the cursor stays on the
    // first match instead of advancing to the second `x`
    it.fails('; repeats the last f', () => {
        const { editor } = newEditor('abxcdxef');
        keys(editor, 'fx;');
        expect(cursorMarker(editor)).toBe('abxcd|xef\n');
    });
});

describe('paragraph motions', () => {
    it('} moves to the next blank line', () => {
        const { editor } = newEditor('a\n\nb\n\nc');
        keys(editor, '}');
        expect(cursorMarker(editor)).toBe('a\n|\nb\n\nc\n');
    });

    it('} repeats to the following blank line', () => {
        const { editor } = newEditor('a\n\nb\n\nc');
        keys(editor, '}}');
        expect(cursorMarker(editor)).toBe('a\n\nb\n|\nc\n');
    });

    it('{ moves back to the previous blank line', () => {
        const { editor } = newEditor('a\n\nb\n\nc');
        keys(editor, '}}{');
        expect(cursorMarker(editor)).toBe('a\n|\nb\n\nc\n');
    });

    it('{ stops at the top of the buffer', () => {
        const { editor } = newEditor('a\n\nb\n\nc');
        keys(editor, '{');
        expect(cursorMarker(editor)).toBe('|a\n\nb\n\nc\n');
    });
});

describe('matching bracket (%)', () => {
    it('jumps from an opening paren to its match', () => {
        const { editor } = newEditor('a(hello)');
        keys(editor, '%');
        expect(cursorMarker(editor)).toBe('a(hello|)\n');
    });

    it('jumps from an opening bracket to its match', () => {
        const { editor } = newEditor('a[xy]');
        keys(editor, '%');
        expect(cursorMarker(editor)).toBe('a[xy|]\n');
    });

    it('jumps from an opening brace to its match', () => {
        const { editor } = newEditor('a{z}');
        keys(editor, '%');
        expect(cursorMarker(editor)).toBe('a{z|}\n');
    });

    // term_vi_bounce's inner scan is `while (x > 0 && x < t.length)`, so it
    // can never start when the bracket is in column 0 - the cursor does not
    // move and `x` deletes the `(`
    it.fails('jumps from a bracket in column 0', () => {
        const { editor } = newEditor('(hello)');
        keys(editor, '%x');
        expect(editor.freeze()).toBe('(hello\n');
    });
});

describe('viewport motions', () => {
    const buffer = Array.from({ length: 20 }, (_, i) => `line${i}`).join('\n');

    function cursorLine(text: string) {
        return text.split('\n').findIndex(line => line.includes('|'));
    }

    it('H moves to the top visible line', () => {
        const { editor } = newEditor(buffer);
        keys(editor, 'G');
        keys(editor, 'H');
        expect(cursorLine(cursorMarker(editor))).toBe(0);
    });

    it('L moves to the bottom visible line', () => {
        const { editor } = newEditor(buffer);
        keys(editor, 'L');
        expect(cursorLine(cursorMarker(editor))).toBe(19);
    });

    // the exact line depends on the viewport height, so this asserts only that
    // M lands strictly between H and L rather than the arithmetic
    it('M moves between the top and bottom lines', () => {
        const { editor } = newEditor(buffer);
        keys(editor, 'M');
        const line = cursorLine(cursorMarker(editor));
        expect(line).toBeGreaterThan(0);
        expect(line).toBeLessThan(19);
    });
});

describe('paragraph scanning api', () => {
    it('skipforward reports a match and moves onto it', () => {
        const { editor } = newEditor('a\n\nb\n\nc');
        expect(editor.skipforward(/^[ ]*$/, 0)).toBe(true);
        expect(cursorMarker(editor)).toBe('a\n|\nb\n\nc\n');
    });

    it('skipforward reports no match past the end of the buffer', () => {
        const { editor } = newEditor('a\nb\nc');
        expect(editor.skipforward(/^[ ]*$/, 0)).toBe(false);
    });

    it('skipbackward reports a match and moves onto it', () => {
        const { editor } = newEditor('a\n\nb\n\nc');
        keys(editor, 'jjj');
        expect(editor.skipbackward(/^[ ]*$/)).toBe(true);
        expect(cursorMarker(editor)).toBe('a\n\nb\n|\nc\n');
    });

    it('skipreverse2 accepts a fuzz argument without disturbing the buffer', () => {
        const { editor } = newEditor('a\n\nb\n\nc');
        editor.skipreverse2(/^[ ]*$/, 0);
        editor.skipreverse2(/^[ ]*$/, 1);
        expect(editor.freeze()).toBe('a\n\nb\n\nc\n');
    });
});
