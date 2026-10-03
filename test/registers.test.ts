import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, keys, newEditor } from './harness.js';

afterEach(cleanupEditors);

/**
 * Yanking has no observable result on its own, so every yank here is checked
 * by pasting it back.
 *
 * `it.fails` marks behaviour that differs from vi. Those tests assert what vi
 * does, so each one starts passing once the gap is closed - at which point it
 * should become a plain `it`.
 */

describe('linewise yank and paste', () => {
    it('yy then p puts the line below the current one', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'yyjp');
        expect(editor.freeze()).toBe('a\nb\na\nc\n');
    });

    it('yy then P puts the line above the current one', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'yyjP');
        expect(editor.freeze()).toBe('a\na\nb\nc\n');
    });

    // jsvi yanks the current line N times instead of N consecutive lines, so
    // `2yy` gives "a\na" rather than "a\nb"
    it.fails('Nyy yanks several lines', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, '2yyGp');
        expect(editor.freeze()).toBe('a\nb\nc\na\nb\n');
    });
});

describe('charwise yank and paste', () => {
    it('yw then p puts the text after the cursor', () => {
        const { editor } = newEditor('hello world');
        keys(editor, 'ywwp');
        expect(editor.freeze()).toBe('hello whello orld\n');
    });

    it('y$ yanks to the end of the line', () => {
        const { editor } = newEditor('hello world');
        keys(editor, 'y$$p');
        expect(editor.freeze()).toBe('hello worldhello world\n');
    });

    it('x then p moves the character after the next one', () => {
        const { editor } = newEditor('abc');
        keys(editor, 'xp');
        expect(editor.freeze()).toBe('bac\n');
    });

    it('x then P puts the character back where it was', () => {
        const { editor } = newEditor('abc');
        keys(editor, 'xP');
        expect(editor.freeze()).toBe('abc\n');
    });

    it('dw then p re-inserts the deleted word after the cursor', () => {
        const { editor } = newEditor('hello world');
        keys(editor, 'dwp');
        expect(editor.freeze()).toBe('whello orld\n');
    });

    it('a visual-mode yank pastes from the start of the selection', () => {
        const { editor } = newEditor('hello');
        keys(editor, 'vlyp');
        expect(editor.freeze()).toBe('hheello\n');
    });
});

describe('named registers', () => {
    it('"ayy and "ap round-trip a line', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, '"ayyj"ap');
        expect(editor.freeze()).toBe('a\nb\na\nc\n');
    });

    it('"add and "ap round-trip a deleted line', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, '"add"ap');
        expect(editor.freeze()).toBe('b\na\nc\n');
    });

    // `lastreg` is assigned when the `"` prefix is read (vi.js:2730) but only
    // ever reset when the editor is initialised (vi.js:3769), so a register
    // prefix is sticky: the following unprefixed `yy` overwrites "a, and "ap
    // pastes "b" instead of "a"
    it.fails('a named register is independent of the unnamed one', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, '"ayy');  // "a = a
        keys(editor, 'jyy');   // unnamed = b
        keys(editor, '"ap');   // paste "a, not b
        expect(editor.freeze()).toBe('a\nb\na\nc\n');
    });

    it('"0 holds the most recent yank', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'yy"0p');
        expect(editor.freeze()).toBe('a\na\nb\nc\n');
    });
});

describe('numbered registers', () => {
    it('the unnamed register holds the most recent delete', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'dddd');
        keys(editor, 'p');
        expect(editor.freeze()).toBe('c\nb\nd\n');
    });

    // jsvi leaves "1 empty after a single line delete, so `"1p` pastes
    // nothing and the buffer is unchanged
    it.fails('"1 holds the most recent line delete', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'dd"1p');
        expect(editor.freeze()).toBe('b\na\nc\n');
    });

    // jsvi shifts the wrong way: after two deletes "1 holds the *older* line
    // ("a") and "2 is empty, where vi has "1 = newest and "2 = previous
    it.fails('"1 and "2 rotate with "1 holding the newest delete', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'dddd');
        keys(editor, '"1p');
        expect(editor.freeze()).toBe('c\nb\nd\n');
    });

    // jsvi pastes once regardless of the count
    it.fails('Np pastes the register N times', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'dd2p');
        expect(editor.freeze()).toBe('b\na\na\nc\n');
    });
});

describe('yank register rotation api', () => {
    it('roll_yank leaves the buffer untouched', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'yy');
        editor.roll_yank();
        expect(editor.freeze()).toBe('a\nb\nc\n');
    });
});
