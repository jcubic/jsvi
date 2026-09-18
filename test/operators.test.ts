import { describe, expect, it } from 'vitest';
import createEditor, { type ViEditor } from '../vi.esm.js';
import { press, type } from './keys.js';

function newEditor(c: string) {
    const ta = document.createElement('textarea');
    ta.value = c;
    document.body.appendChild(ta);
    const ed = createEditor(ta);
    return { ta, ed };
}
function cleanup(c: { ta: HTMLTextAreaElement; ed: ViEditor }) {
    c.ed.disable(false);
    c.ta.remove();
}

describe('operators', () => {
    it('dd and Ndd', () => {
        const c = newEditor('a\nb\nc\nd');
        press(c.ed, 'd'); press(c.ed, 'd');
        expect(c.ed.freeze()).toBe('b\nc\nd\n');
        cleanup(c);
        const c2 = newEditor('a\nb\nc\nd');
        press(c2.ed, '2'); press(c2.ed, 'd'); press(c2.ed, 'd');
        expect(c2.ed.freeze()).toBe('c\nd\n');
        cleanup(c2);
    });
    it('dw dj d$', () => {
        const c = newEditor('hello world foo');
        press(c.ed, 'd'); press(c.ed, 'w');
        expect(c.ed.freeze()).toBe('world foo\n');
        cleanup(c);
        const c2 = newEditor('a\nb\nc');
        press(c2.ed, 'd'); press(c2.ed, 'j');
        expect(c2.ed.freeze()).toBe('c\n');
        cleanup(c2);
        const c3 = newEditor('hello world');
        press(c3.ed, 'd'); press(c3.ed, '$');
        expect(c3.ed.freeze()).toBe('\n');
        cleanup(c3);
    });
    it('cc cw C', () => {
        const c = newEditor('hello world');
        press(c.ed, 'c'); press(c.ed, 'c');
        type(c.ed, 'hi');
        press(c.ed, '\x1b');
        expect(c.ed.freeze()).toBe('hi\n');
        cleanup(c);
        const c2 = newEditor('hello world');
        press(c2.ed, 'c'); press(c2.ed, 'w'); type(c2.ed, 'hi'); press(c2.ed, '\x1b');
        expect(c2.ed.freeze()).toContain('hi');
        cleanup(c2);
    });
    it('yy yw y$ and p/P', () => {
        const c = newEditor('a\nb\nc');
        press(c.ed, 'y'); press(c.ed, 'y'); // yank line a
        press(c.ed, 'j'); press(c.ed, 'p'); // paste after b
        expect(c.ed.freeze()).toBe('a\nb\na\nc\n');
        cleanup(c);
        const c2 = newEditor('hello world');
        press(c2.ed, 'y'); press(c2.ed, 'w'); // yank hello
        press(c2.ed, 'w'); press(c2.ed, 'p'); // paste after world?
        expect(c2.ed.freeze()).toContain('hello');
        cleanup(c2);
    });
    it('x X', () => {
        const c = newEditor('abc');
        press(c.ed, 'x');
        expect(c.ed.freeze()).toBe('bc\n');
        cleanup(c);
        const c2 = newEditor('abc');
        press(c2.ed, 'l'); press(c2.ed, 'X');
        expect(c2.ed.freeze()).toBe('bc\n');
        cleanup(c2);
    });
    it('>> <<', () => {
        const c = newEditor('hello');
        press(c.ed, '>'); press(c.ed, '>');
        expect(c.ed.freeze()).toBe('    hello\n');
        cleanup(c);
        const c2 = newEditor('    hello');
        press(c2.ed, '<'); press(c2.ed, '<');
        expect(c2.ed.freeze()).toBe('hello\n');
        cleanup(c2);
    });
    it('visual v/V + d/y', () => {
        const c = newEditor('a\nb\nc\nd');
        press(c.ed, 'v'); press(c.ed, 'j'); press(c.ed, 'd');
        expect(c.ed.freeze()).toContain('c');
        cleanup(c);
        const c2 = newEditor('a\nb\nc\nd');
        press(c2.ed, 'V'); press(c2.ed, 'd');
        expect(c2.ed.freeze()).toBe('b\nc\nd\n');
        cleanup(c2);
        const c3 = newEditor('a\nb\nc');
        press(c3.ed, 'v'); press(c3.ed, 'j'); press(c3.ed, 'y'); press(c3.ed, 'p');
        // yank a,b and paste
        expect(c3.ed.freeze()).toContain('a');
        cleanup(c3);
    });
});
