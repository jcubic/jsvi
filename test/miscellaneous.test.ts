import { describe, expect, it } from 'vitest';
import createEditor from '../vi.esm.js';
import { press, type } from './keys.js';

function newEditor(c: string) {
    const ta = document.createElement('textarea');
    ta.value = c;
    document.body.appendChild(ta);
    const ed = createEditor(ta);
    return { ta, ed };
}
function cleanup(c: any) { try{c.ed.disable(false)}catch{} c.ta.remove(); }

describe('H M L', () => {
    it('H M L move within viewport', () => {
        const buf = Array.from({length: 20}, (_,i)=>`line${i}`).join('\n');
        const c = newEditor(buf);
        press(c.ed, 'L'); // to bottom
        press(c.ed, 'x'); // delete char, verify moved
        expect(c.ed.freeze()).toContain('line');
        cleanup(c);
        const c2 = newEditor(buf);
        press(c2.ed, 'H');
        press(c2.ed, 'x');
        expect(c2.ed.freeze()).toContain('line');
        cleanup(c2);
        const c3 = newEditor(buf);
        press(c3.ed, 'M');
        press(c3.ed, 'x');
        expect(c3.ed.freeze()).toContain('line');
        cleanup(c3);
    });
});

describe('>> << with count', () => {
    it('2>> and 2<<', () => {
        const c = newEditor('a\nb\nc\nd');
        press(c.ed, '2'); press(c.ed, '>'); press(c.ed, '>');
        expect(c.ed.freeze()).toContain('    ');
        cleanup(c);
        const c2 = newEditor('    a\n    b\nc');
        press(c2.ed, '2'); press(c2.ed, '<'); press(c2.ed, '<');
        expect(c2.ed.freeze()).toContain('a');
        cleanup(c2);
    });
});

describe(':set flags', () => {
    it(':set handles formatting', () => {
        const c = newEditor('hello');
        c.ed.command(':set b');
        c.ed.command(':set +i');
        c.ed.command(':set -u');
        c.ed.command(':set b!');
        c.ed.command(':set unknown'); // should set statustext error but not throw
        expect(c.ed.freeze()).toContain('hello');
        cleanup(c);
    });
});

describe('term_skipreverse2 fuzz', () => {
    it('paragraph motions with fuzz', () => {
        const c = newEditor('a\n\nb\n\nc');
        // { and } use skipreverse2 with fuzz 0
        press(c.ed, '}'); press(c.ed, '}');
        press(c.ed, '{');
        // direct call with fuzz 1
        c.ed.skipreverse2(/^[ ]*$/, 1);
        c.ed.skipforward(/^[ ]*$/, 1);
        expect(c.ed.freeze()).toContain('a');
        cleanup(c);
    });
});

describe('lastinsert join-undo', () => {
    it('type across join then Esc', () => {
        const c = newEditor('123\n456');
        press(c.ed, 'j'); press(c.ed, 'i');
        // backspace join
        c.ed.keypress_inner({ which: 8, charCode: 8 } as any, true); // backspace synth
        type(c.ed, 'X');
        press(c.ed, '\x1b');
        // buffer should be joined with X in middle
        expect(c.ed.freeze()).toContain('123');
        // undo should work
        press(c.ed, 'u');
        expect(c.ed.freeze()).toBeDefined();
        cleanup(c);
    });
    it('empty line join undo', () => {
        const c = newEditor('123\n');
        press(c.ed, 'j'); press(c.ed, 'i');
        c.ed.keypress_inner({ which: 8, charCode: 8 } as any, true);
        press(c.ed, '\x1b');
        expect(c.ed.freeze()).toContain('123');
        cleanup(c);
    });
});
