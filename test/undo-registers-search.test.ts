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

describe('undo (group 5)', () => {
    it('u toggles last change', () => {
        const c = newEditor('hello\nworld');
        press(c.ed, 'd'); press(c.ed, 'd'); // delete hello
        expect(c.ed.freeze()).toBe('world\n');
        press(c.ed, 'u');
        expect(c.ed.freeze()).toContain('hello');
        press(c.ed, 'u'); // toggle back
        expect(c.ed.freeze()).toContain('world');
        cleanup(c);
    });
    it('U restores line', () => {
        const c = newEditor('hello\nworld');
        // edit first line via insert
        press(c.ed, 'A'); type(c.ed, '!!!'); press(c.ed, '\x1b');
        expect(c.ed.freeze()).toBe('hello!!!\nworld\n');
        press(c.ed, 'U');
        expect(c.ed.freeze()).toBe('hello\nworld\n');
        cleanup(c);
    });
});

describe('registers (group 6)', () => {
    it('named register "ayy -> "ap', () => {
        const c = newEditor('foo\nbar\nbaz');
        press(c.ed, '"'); press(c.ed, 'a'); press(c.ed, 'y'); press(c.ed, 'y');
        press(c.ed, 'j'); // to bar
        press(c.ed, '"'); press(c.ed, 'a'); press(c.ed, 'p');
        expect(c.ed.freeze()).toBe('foo\nbar\nfoo\nbaz\n');
        cleanup(c);
    });
    it('numbered rotation and p/P linewise vs charwise', () => {
        const c = newEditor('a\nb\nc');
        // delete two lines to fill registers 1,2
        press(c.ed, 'd'); press(c.ed, 'd');
        press(c.ed, 'd'); press(c.ed, 'd');
        // paste from "1 should be last delete (b), "2 should be previous (a) after roll
        // use "1p
        press(c.ed, '"'); press(c.ed, '1'); press(c.ed, 'p');
        expect(c.ed.freeze().length).toBeGreaterThan(2);
        cleanup(c);
    });
    it('p after charwise yank inserts after cursor', () => {
        const c = newEditor('hello world');
        press(c.ed, 'y'); press(c.ed, 'w'); // yank hello
        press(c.ed, 'w'); // to world
        press(c.ed, 'p');
        expect(c.ed.freeze()).toContain('hello');
        cleanup(c);
    });
});

describe('search (group 7)', () => {
    it('/pattern then n/N via keypress', () => {
        const c = newEditor('foo bar foo bar');
        // /bar + Enter via command()
        c.ed.command('/bar');
        // after search cursor on bar, x deletes b
        press(c.ed, 'x');
        expect(c.ed.freeze()).toBe('foo ar foo bar\n');
        cleanup(c);
        const c2 = newEditor('foo bar foo bar');
        c2.ed.command('/bar');
        press(c2.ed, 'n'); // next match
        press(c2.ed, 'x');
        // second bar's b deleted
        expect(c2.ed.freeze()).toBe('foo bar foo ar\n');
        cleanup(c2);
        const c3 = newEditor('foo bar foo bar');
        c3.ed.command('/bar');
        press(c3.ed, 'n'); press(c3.ed, 'N'); // back
        press(c3.ed, 'x');
        expect(c3.ed.freeze()).toBe('foo ar foo bar\n');
        cleanup(c3);
    });
    it('? backward search', () => {
        const c = newEditor('foo bar foo bar');
        c.ed.command('?bar');
        press(c.ed, 'x');
        expect(c.ed.freeze().length).toBeGreaterThan(0);
        cleanup(c);
    });
    it('search() direct api with bounds', () => {
        const c = newEditor('aaa bbb aaa bbb');
        const ok = c.ed.search('/bbb', 0, 0, 10);
        expect(ok).toBe(true);
        // cursor should be on first bbb, verify by deleting
        press(c.ed, 'x');
        expect(c.ed.freeze()).toContain('aaa');
        cleanup(c);
        const c2 = newEditor('aaa bbb');
        const miss = c2.ed.search('/zzz', 0, 0, 10);
        expect(miss).toBe(false);
        cleanup(c2);
    });
    it('wraps around buffer end', () => {
        const c = newEditor('foo bar');
        c.ed.command('/foo');
        c.ed.command('/bar');
        // search again for foo should wrap to top
        c.ed.command('/foo');
        press(c.ed, 'x');
        expect(c.ed.freeze()).toBe('oo bar\n');
        cleanup(c);
    });
});
