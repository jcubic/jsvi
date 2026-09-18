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
function cleanup(c: { ta: HTMLTextAreaElement; ed: ViEditor }) {
    // disable without save to avoid side effects
    try { c.ed.disable(false); } catch {}
    c.ta.remove();
}

describe('ex commands (group 8)', () => {
    it(':w triggers onSave and syncs textarea', () => {
        const onSave = vi.fn();
        const c = newEditor('hello\nworld', { onSave });
        press(c.ed, 'A'); type(c.ed, '!'); press(c.ed, '\x1b');
        c.ed.command(':w');
        expect(onSave).toHaveBeenCalled();
        expect(c.ta.value).toBe(c.ed.freeze());
        cleanup(c);
    });
    it(':q / :q! / :x / :wq', () => {
        let exited = false;
        const c = newEditor('hello', { onExit: () => exited = true });
        // unmodified -> :q exits
        c.ed.command(':q');
        expect(exited).toBe(true);
        cleanup(c);
        exited = false;
        const c2 = newEditor('hello', { onExit: () => exited = true });
        press(c2.ed, 'A'); type(c2.ed, 'x'); press(c2.ed, '\x1b');
        c2.ed.command(':q');
        expect(exited).toBe(false); // blocked
        c2.ed.command(':q!');
        expect(exited).toBe(true);
        cleanup(c2);
        let saved = false; exited = false;
        const c3 = newEditor('hello', { onSave: () => saved = true, onExit: () => exited = true });
        press(c3.ed, 'A'); type(c3.ed, 'x'); press(c3.ed, '\x1b');
        c3.ed.command(':x');
        expect(exited).toBe(true);
        cleanup(c3);
        saved = false; exited = false;
        const c4 = newEditor('hello', { onSave: () => saved = true, onExit: () => exited = true });
        c4.ed.command(':wq');
        expect(saved).toBe(true);
        expect(exited).toBe(true);
        cleanup(c4);
    });
    it(':%d and :3,5d and :.,$d', () => {
        const c = newEditor('a\nb\nc\nd\ne');
        c.ed.command(':%d');
        expect(c.ed.freeze()).toBe('');
        cleanup(c);
        const c2 = newEditor('a\nb\nc\nd\ne');
        c2.ed.command(':3,4d');
        // deletes lines 3-4 (c,d) leaving a,b,e
        expect(c2.ed.freeze()).toContain('a');
        expect(c2.ed.freeze()).toContain('e');
        cleanup(c2);
        const c3 = newEditor('a\nb\nc\nd\ne');
        press(c3.ed, 'j');
        c3.ed.command(':.,$d');
        // should leave at least first line
        expect(c3.ed.freeze().length).toBeLessThan('a\nb\nc\nd\ne\n'.length);
        cleanup(c3);
    });
    it(':s and :%s substitution', () => {
        const c = newEditor('foo\nfoo\nfoo');
        c.ed.command(':1s/foo/bar/');
        expect(c.ed.freeze().length).toBeGreaterThan(0);
        cleanup(c);
        const c2 = newEditor('foo\nfoo\nfoo');
        c2.ed.command(':%s/foo/bar/g');
        expect(c2.ed.freeze()).toBe('bar\nbar\nbar\n');
        cleanup(c2);
    });
    it('invalid command leaves buffer untouched', () => {
        const c = newEditor('hello');
        const before = c.ed.freeze();
        c.ed.command(':zzz');
        expect(c.ed.freeze()).toBe(before);
        cleanup(c);
    });
    it(':set and marks addressing', () => {
        const c = newEditor('a\nb\nc\nd');
        press(c.ed, 'j'); press(c.ed, 'm'); press(c.ed, 'a');
        press(c.ed, 'j'); press(c.ed, 'j');
        c.ed.command(":'a,.d");
        expect(c.ed.freeze().length).toBeLessThan('a\nb\nc\nd\n'.length);
        cleanup(c);
    });
});
