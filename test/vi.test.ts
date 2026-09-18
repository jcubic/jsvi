import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// Aliased on import: vitest itself exposes a mocking helper named `vi`,
// which would otherwise shadow this package's default export.
import createEditor, { type ViEditor } from '../vi.esm.js';

describe('vi editor happy path', () => {
    let textarea: HTMLTextAreaElement;
    let editor: ViEditor;

    beforeEach(() => {
        textarea = document.createElement('textarea');
        textarea.value = 'hello\nworld';
        document.body.appendChild(textarea);
        editor = createEditor(textarea);
    });

    afterEach(() => {
        editor.disable(false);
        textarea.remove();
    });

    it('loads the initial textarea contents into the buffer', () => {
        expect(editor.freeze()).toBe('hello\nworld\n');
    });

    it('replaces the buffer contents on thaw', () => {
        editor.thaw('one\ntwo\nthree');
        expect(editor.freeze()).toBe('one\ntwo\nthree\n');
    });

    it('exposes the documented public API', () => {
        expect(typeof editor.insert).toBe('function');
        expect(typeof editor.delete).toBe('function');
        expect(typeof editor.command).toBe('function');
    });
});
