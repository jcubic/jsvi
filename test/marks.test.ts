import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, cursorMarker, keys, newEditor } from './harness.js';

afterEach(cleanupEditors);

describe('marks', () => {
    it("m sets a mark and ' jumps back to it", () => {
        const { editor } = newEditor('a\nb\nc\nd\ne');
        keys(editor, 'j');    // on b
        keys(editor, 'ma');   // mark a = b
        keys(editor, 'jj');   // on d
        keys(editor, "'a");   // back to the mark
        keys(editor, 'dd');
        expect(editor.freeze()).toBe('a\nc\nd\ne\n');
    });

    it('keeps several marks apart', () => {
        const { editor } = newEditor('a\nb\nc\nd\ne');
        keys(editor, 'jma');   // mark a = line 2
        keys(editor, 'jjmb');  // mark b = line 4
        keys(editor, "'a");
        expect(cursorMarker(editor)).toBe('a\n|b\nc\nd\ne\n');
    });

    it("' to an unset mark leaves the buffer alone", () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, "'z");
        expect(editor.freeze()).toBe('a\nb\nc\n');
    });

    it('a mark can be used as an ex address', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'jma');   // mark a = line 2
        keys(editor, 'jj');    // cursor on line 4
        editor.command(":'a,.d");
        expect(editor.freeze()).toBe('a\n');
    });
});
