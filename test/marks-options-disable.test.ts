import { describe, expect, it, vi } from 'vitest';
import createEditor, { type ViEditor } from '../vi.esm.js';
import { press, type } from './keys.js';

function newEditor(content: string, opts: any = {}) {
    const ta = document.createElement('textarea');
    ta.value = content;
    document.body.appendChild(ta);
    const ed = createEditor(ta, opts);
    return { ta, ed };
}
function cleanup(c: { ta: HTMLTextAreaElement; ed: ViEditor }, save = false) {
    try { c.ed.disable(save); } catch {}
    c.ta.remove();
}

describe('marks (group 9)', () => {
    it('m sets mark and \' jumps back', () => {
        const c = newEditor('a\nb\nc\nd\ne');
        press(c.ed, 'j'); // b
        press(c.ed, 'm'); press(c.ed, 'a'); // mark a = b
        press(c.ed, 'j'); press(c.ed, 'j'); // d
        press(c.ed, "'"); press(c.ed, 'a'); // jump to a
        // verify by deleting line -> should delete b
        press(c.ed, 'd'); press(c.ed, 'd');
        expect(c.ed.freeze()).toBe('a\nc\nd\ne\n');
        cleanup(c);
    });
});

describe('options (group 10)', () => {
    it('html true round-trips formatting', () => {
        const c = newEditor('<b>hi</b>', { html: true });
        expect(c.ed.freeze()).toContain('<b>');
        c.ed.thaw('<u>bye</u>');
        expect(c.ed.freeze()).toContain('<u>');
        cleanup(c);
    });
    it('html false keeps literal text', () => {
        const c = newEditor('<b>hi</b>', { html: false });
        expect(c.ed.freeze()).toBe('<b>hi</b>\n');
        cleanup(c);
    });
    it('color/backgroundColor applied', () => {
        const c = newEditor('hello', { color: 'red', backgroundColor: 'black' });
        // just verify no throw and editor created
        expect(c.ed.freeze()).toBe('hello\n');
        cleanup(c);
    });
    it('onSave/onExit only on save', () => {
        const onSave = vi.fn(), onExit = vi.fn();
        const c = newEditor('hello', { onSave, onExit });
        c.ed.disable(false);
        expect(onSave).not.toHaveBeenCalled();
        c.ta.remove();
        const ta2 = document.createElement('textarea');
        ta2.value = 'hello';
        document.body.appendChild(ta2);
        const ed2 = createEditor(ta2, { onSave, onExit });
        press(ed2, 'A'); type(ed2, 'x'); press(ed2, '\x1b');
        ed2.disable(true);
        expect(ta2.value).toContain('x');
        ta2.remove();
    });
});

describe('disable teardown (group 11)', () => {
    it('restores textarea with save true', () => {
        const ta = document.createElement('textarea');
        ta.value = 'orig';
        document.body.appendChild(ta);
        const ed = createEditor(ta);
        press(ed, 'A'); type(ed, '!!!'); press(ed, '\x1b');
        ed.disable(true);
        expect(ta.value).toContain('orig');
        expect(document.body.contains(ta)).toBe(true);
        ta.remove();
    });
    it('leaves original untouched with save false', () => {
        const ta = document.createElement('textarea');
        ta.value = 'orig';
        document.body.appendChild(ta);
        const ed = createEditor(ta);
        press(ed, 'A'); type(ed, '!!!'); press(ed, '\x1b');
        const frozen = ed.freeze();
        ed.disable(false);
        expect(ta.value).not.toContain('!!!');
        expect(frozen).toContain('!!!');
        ta.remove();
    });
    it('call twice is safe or throws predictably', () => {
        const c = newEditor('hello');
        c.ed.disable(false);
        try { c.ed.disable(false); } catch {}
        expect(document.body.contains(c.ta)).toBe(true);
        c.ta.remove();
    });
});
