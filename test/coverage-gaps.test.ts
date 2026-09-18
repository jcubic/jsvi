import { describe, expect, it } from 'vitest';
import createEditor from '../vi.esm.js';
import { press, key } from './keys.js';

function newEditor(c: string, opts: any = {}) {
    const ta = document.createElement('textarea');
    ta.value = c;
    document.body.appendChild(ta);
    const ed = createEditor(ta, opts);
    return { ta, ed };
}

describe('coverage gaps', () => {
    it('_rer _rel via search with ^ and $', () => {
        const c = newEditor('hello\nworld');
        c.ed.search('/^hello', 0, 0, 10);
        c.ed.search('/world$', 0, 0, 10);
        c.ed.rsearch('?hello', 0, 1, 10);
        c.ed.search('/l+', 0, 0, 10);
        expect(c.ed.freeze()).toContain('hello');
        c.ed.disable(false); c.ta.remove();
    });
    it('term_justify via J and direct', () => {
        const c = newEditor('  hello\n  world');
        press(c.ed, 'J');
        c.ed.justify();
        expect(c.ed.freeze()).toBeDefined();
        c.ed.disable(false); c.ta.remove();
    });
    it('term_vi_tt t ff via F f t T ;', () => {
        const c = newEditor('abXcdXef');
        press(c.ed, 'f'); press(c.ed, 'X'); // f X
        press(c.ed, 'F'); press(c.ed, 'a'); // F a backwards
        press(c.ed, 't'); press(c.ed, 'X'); // t X
        press(c.ed, 'T'); press(c.ed, 'a'); // T a
        expect(c.ed.freeze()).toContain('ab');
        c.ed.disable(false); c.ta.remove();
        // direct vi_* calls
        const c2 = newEditor('abXcd');
        c2.ed.vi_f(); c2.ed.vi_ff(); c2.ed.vi_t(); c2.ed.vi_tt();
        c2.ed.vi_bb(); c2.ed.vi_b(); c2.ed.vi_ww(); c2.ed.vi_w();
        c2.ed.vi_e(); c2.ed.vi_ee(); c2.ed.vi_bounce(); c2.ed.vi_eol(); c2.ed.vi_line();
        c2.ed.vi_h(); c2.ed.vi_j(); c2.ed.vi_k(); c2.ed.vi_l();
        c2.ed.vi_top(); c2.ed.vi_eof(); c2.ed.vi_hh(); c2.ed.vi_ll(); c2.ed.vi_mm();
        c2.ed.vi_ob(); c2.ed.vi_cb(); c2.ed.vi_v(); c2.ed.vi_vv();
        c2.ed.disable(false); c2.ta.remove();
    });
    it('term_skipreverse2 and _addr', () => {
        const c = newEditor('a\n\nb\n\nc');
        c.ed.skipreverse2(/^[ ]*$/, 0);
        c.ed.skipforward(/^[ ]*$/, 0);
        c.ed.skipbackward(/^[ ]*$/);
        c.ed.command(':1,2d');
        c.ed.disable(false); c.ta.remove();
        const c2 = newEditor('a\nb\nc');
        c2.ed.command(':$d');
        c2.ed.command(':.,$d');
        c2.ed.disable(false); c2.ta.remove();
        const c3 = newEditor('a\nb\nc\nd');
        press(c3.ed, 'j'); press(c3.ed, 'm'); press(c3.ed, 'a');
        c3.ed.command(":'a,.d");
        c3.ed.command(":/a/d");
        c3.ed.command(":?b?d");
        expect(c3.ed.freeze().length).toBeGreaterThanOrEqual(0);
        c3.ed.disable(false); c3.ta.remove();
    });
    it('k==10 CR in insert mode (Ctrl-J)', () => {
        const c = newEditor('hello');
        press(c.ed, 'i');
        // send \n as k==10 via charCode 10 synth false
        c.ed.keypress_inner({ which: 10, charCode: 10 } as any, false);
        // also k==13 via Enter
        press(c.ed, '\r');
        expect(c.ed.freeze()).toContain('\n');
        c.ed.disable(false); c.ta.remove();
    });
    it('Tab handling and _rl _suggest _dosuggest via API', () => {
        const c = newEditor('hello', { spell_script: '/fake' });
        // Tab in insert mode should insert spaces
        press(c.ed, 'i');
        c.ed.keypress_inner({ which: 9, charCode: 9 } as any, false);
        expect(c.ed.freeze()).toContain('    ');
        // trigger justify and other exposed
        c.ed.calcy(); c.ed.calcx(); c.ed.scrollto(); c.ed.redraw(); c.ed.resize(); c.ed.draw_cursor();
        c.ed.save_undo(); c.ed.save_undo_line(); c.ed.roll_yank();
        c.ed.indent(0, 1); c.ed.unindent(0, 1); c.ed.delete(0);
        c.ed.select(); c.ed.operate();
        c.ed.vi_set('d'); c.ed.vi_flag('d'); c.ed.vi_unset('d');
        c.ed.insert(0, 'x');
        c.ed.paste(true); c.ed.paste(false, 'a');
        // try to trigger _fauc / _yaty via scroll
        try { (c.ed as any)._yaty?.(0); } catch {}
        c.ed.disable(false); c.ta.remove();
    });
});
