import { describe, expect, it } from 'vitest';
import createEditor from '../vi.esm.js';

function newEditor(c: string) {
    const ta = document.createElement('textarea');
    ta.value = c;
    document.body.appendChild(ta);
    const ed = createEditor(ta);
    return { ta, ed };
}

describe('save freeze Unix trailing newline', () => {
    it('adds trailing newline on Unix', () => {
        const c = newEditor('hello');
        expect(c.ed.freeze()).toBe('hello\n');
        c.ed.disable(false); c.ta.remove();
    });
    it('does not add extra newline when last line already empty', () => {
        const c = newEditor('hello\n');
        expect(c.ed.freeze()).toBe('hello\n');
        // also via thaw of trailing empty
        c.ed.thaw('a\nb\n');
        expect(c.ed.freeze()).toBe('a\nb\n');
        c.ed.disable(false); c.ta.remove();
    });
    it('preserves blank last line', () => {
        const c = newEditor('a\n\n');
        expect(c.ed.freeze()).toBe('a\n\n');
        c.ed.disable(false); c.ta.remove();
    });
});
