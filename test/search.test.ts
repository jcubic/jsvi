import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, cursorMarker, keys, newEditor } from './harness.js';

afterEach(cleanupEditors);

describe('/ forward search', () => {
    it('moves the cursor onto the first match', () => {
        const { editor } = newEditor('foo bar foo bar');
        editor.command('/bar');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('foo ar foo bar\n');
    });

    it('n advances to the next match', () => {
        const { editor } = newEditor('foo bar foo bar');
        editor.command('/bar');
        keys(editor, 'nx');
        expect(editor.freeze()).toBe('foo bar foo ar\n');
    });

    it('N goes back to the previous match', () => {
        const { editor } = newEditor('foo bar foo bar');
        editor.command('/bar');
        keys(editor, 'nNx');
        expect(editor.freeze()).toBe('foo ar foo bar\n');
    });

    it('wraps around the end of the buffer', () => {
        const { editor } = newEditor('foo bar');
        editor.command('/foo');
        editor.command('/bar');
        editor.command('/foo');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('oo bar\n');
    });

    it('finds a match on a later line', () => {
        const { editor } = newEditor('aaa\nbbb\nccc');
        editor.command('/ccc');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('aaa\nbbb\ncc\n');
    });

    it('leaves the buffer alone when there is no match', () => {
        const { editor } = newEditor('foo bar');
        editor.command('/zzz');
        expect(editor.freeze()).toBe('foo bar\n');
    });
});

describe('? backward search', () => {
    it('moves the cursor onto the match', () => {
        const { editor } = newEditor('foo bar');
        editor.command('?bar');
        expect(cursorMarker(editor)).toBe('foo |bar\n');
    });

    it('searches backward from the cursor', () => {
        const { editor } = newEditor('bar foo bar');
        editor.command('/foo');
        editor.command('?bar');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('ar foo bar\n');
    });
});

describe('search patterns', () => {
    // jsvi ignores the `^` anchor and matches anywhere in the line, so this
    // lands on the "hello" inside "xhello" on line 1 instead of line 2. It
    // only looks correct when the match happens to sit in column 0
    it.fails('anchors a pattern at the start of the line with ^', () => {
        const { editor } = newEditor('xhello\nhello');
        editor.command('/^hello');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('xhello\nello\n');
    });

    it('anchors a pattern at the end of the line with $', () => {
        const { editor } = newEditor('world x\nworld');
        editor.command('/world$');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('world x\norld\n');
    });

    it('accepts a repetition pattern', () => {
        const { editor } = newEditor('abc lll def');
        editor.command('/l+');
        keys(editor, 'x');
        expect(editor.freeze()).toBe('abc ll def\n');
    });
});

describe('search api', () => {
    it('search reports a hit and moves onto it', () => {
        const { editor } = newEditor('aaa bbb aaa bbb');
        expect(editor.search('/bbb', 0, 0, 10)).toBe(true);
        expect(cursorMarker(editor)).toBe('aaa |bbb aaa bbb\n');
    });

    it('search reports a miss', () => {
        const { editor } = newEditor('aaa bbb');
        expect(editor.search('/zzz', 0, 0, 10)).toBe(false);
    });

    it('rsearch reports a hit searching backward', () => {
        const { editor } = newEditor('hello\nworld');
        keys(editor, 'j');
        expect(editor.rsearch('?hello', 0, 1, 10)).toBe(true);
    });

    it('rsearch reports a miss', () => {
        const { editor } = newEditor('hello\nworld');
        keys(editor, 'j');
        expect(editor.rsearch('?zzz', 0, 1, 10)).toBe(false);
    });
});
