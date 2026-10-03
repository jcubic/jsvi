import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, newEditor } from './harness.js';

afterEach(cleanupEditors);

describe('loading and serializing the buffer', () => {
    it('loads the textarea contents into the buffer', () => {
        const { editor } = newEditor('hello\nworld');
        expect(editor.freeze()).toBe('hello\nworld\n');
    });

    it('replaces the buffer contents on thaw', () => {
        const { editor } = newEditor('hello\nworld');
        editor.thaw('one\ntwo\nthree');
        expect(editor.freeze()).toBe('one\ntwo\nthree\n');
    });

    it('loads an empty textarea as a single empty line', () => {
        const { editor } = newEditor('');
        expect(editor.freeze()).toBe('');
    });

    it('strips CR from CRLF input', () => {
        const { editor } = newEditor('hello\r\nworld');
        expect(editor.freeze()).toBe('hello\nworld\n');
    });

    it('writes the buffer back to the textarea on construction', () => {
        const { textarea } = newEditor('hello');
        expect(textarea.value).toBe('hello\n');
    });
});

describe('trailing newline on save', () => {
    it('terminates the last line', () => {
        const { editor } = newEditor('hello');
        expect(editor.freeze()).toBe('hello\n');
    });

    it('does not add a second newline when the input already ended with one', () => {
        const { editor } = newEditor('hello\n');
        expect(editor.freeze()).toBe('hello\n');
    });

    it('does not add a second newline after thawing a terminated buffer', () => {
        const { editor } = newEditor('hello');
        editor.thaw('a\nb\n');
        expect(editor.freeze()).toBe('a\nb\n');
    });

    it('preserves a deliberate blank last line', () => {
        const { editor } = newEditor('a\n\n');
        expect(editor.freeze()).toBe('a\n\n');
    });
});
