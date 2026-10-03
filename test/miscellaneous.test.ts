import { afterEach, describe, expect, it } from 'vitest';
import { cleanupEditors, keys, newEditor } from './harness.js';
import { press, type } from './keys.js';

afterEach(cleanupEditors);

/**
 * Anything that does not belong to one feature area: line joining, the
 * lower-level methods of the public API, and the easter eggs.
 *
 * `it.fails` marks behaviour that differs from vi. Those tests assert what vi
 * does, so each one starts passing once the gap is closed - at which point it
 * should become a plain `it`.
 */

describe('J (join lines)', () => {
    it('joins the next line on with a single space', () => {
        const { editor } = newEditor('hello\n   world');
        keys(editor, 'J');
        expect(editor.freeze()).toBe('hello world\n');
    });

    it('collapses the indentation of the joined line', () => {
        const { editor } = newEditor('a\n        b');
        keys(editor, 'J');
        expect(editor.freeze()).toBe('a b\n');
    });

    // jsvi strips the leading whitespace of the *first* line too, so this
    // comes out as "hello world" - vi only strips the second line's indent
    it.fails('keeps the indentation of the first line', () => {
        const { editor } = newEditor('  hello\n  world');
        keys(editor, 'J');
        expect(editor.freeze()).toBe('  hello world\n');
    });
});

describe('justify', () => {
    it('joins a short line onto the one above', () => {
        const { editor } = newEditor('a\nb\nc');
        editor.justify();
        expect(editor.freeze()).toBe('a b\nc\n');
    });

    // jsvi empties the buffer whenever the paragraph is a single line -
    // "a b c", "hello world" and a 48-character line all come back as "".
    // The old coverage test asserted only `toBeDefined()`, which passes on ""
    // and so hid the data loss
    it.fails('keeps the text of a single-line paragraph', () => {
        const { editor } = newEditor('a b c');
        editor.justify();
        expect(editor.freeze()).toBe('a b c\n');
    });
});

describe('line editing api', () => {
    it('delete removes the line and returns its text', () => {
        const { editor } = newEditor('a\nb\nc');
        expect(editor.delete(1)).toBe('b\n');
        expect(editor.freeze()).toBe('a\nc\n');
    });

    // the `content` argument is part of the signature but ignored by the
    // implementation, which only ever opens an empty line
    it('insert opens an empty line at the given index', () => {
        const { editor } = newEditor('a\nb\nc');
        editor.insert(1, 'ignored');
        expect(editor.freeze()).toBe('a\n\nb\nc\n');
    });

    it('indent shifts a line by the given number of shiftwidths', () => {
        const { editor } = newEditor('a\nb\nc');
        editor.indent(1, 2);
        expect(editor.freeze()).toBe('a\n        b\nc\n');
    });

    it('unindent removes a shiftwidth from a line', () => {
        const { editor } = newEditor('    a\nb');
        editor.unindent(0, 1);
        expect(editor.freeze()).toBe('a\nb\n');
    });

    it('paste puts the yanked line into the buffer', () => {
        const { editor } = newEditor('hello');
        keys(editor, 'yy');
        editor.paste(true);
        expect(editor.freeze()).toBe('hello\nhello\n');
    });

    it('paste inserts explicit text instead of the register when given', () => {
        const { editor } = newEditor('hello');
        keys(editor, 'yy');
        // the second argument is the text to paste - this is the path the
        // clipboard uses, with the contents of the backing textarea
        editor.paste(true, 'ZZ');
        expect(editor.freeze()).toBe('hZZello\n');
    });
});

describe('motion api called directly', () => {
    // the keyboard tests in motions.test.ts cover what these do; this checks
    // that every documented entry point is callable on its own, reports a
    // boolean, and does not modify the buffer
    const motions = [
        'vi_h', 'vi_j', 'vi_k', 'vi_l', 'vi_hh', 'vi_ll', 'vi_mm',
        'vi_b', 'vi_bb', 'vi_w', 'vi_ww', 'vi_e', 'vi_ee',
        'vi_f', 'vi_ff', 'vi_t', 'vi_tt',
        'vi_top', 'vi_eof', 'vi_eol', 'vi_line', 'vi_bounce',
        'vi_ob', 'vi_cb'
    ] as const;

    it.each(motions)('%s returns a boolean and leaves the buffer alone', name => {
        const { editor } = newEditor('abXcd\nsecond line\nthird');
        keys(editor, 'j');
        expect(typeof editor[name]()).toBe('boolean');
        expect(editor.freeze()).toBe('abXcd\nsecond line\nthird\n');
    });

    it('vi_v and vi_vv start visual mode without changing the buffer', () => {
        const { editor } = newEditor('abc\ndef');
        editor.vi_v();
        editor.vi_vv();
        expect(editor.freeze()).toBe('abc\ndef\n');
    });
});

describe('pending operator flags', () => {
    it('vi_set marks a flag and vi_flag reports it', () => {
        const { editor } = newEditor('hello');
        expect(editor.vi_flag('d')).toBe(false);
        editor.vi_set('d');
        expect(editor.vi_flag('d')).toBe(true);
    });

    it('vi_unset clears a flag', () => {
        const { editor } = newEditor('hello');
        editor.vi_set('d');
        editor.vi_unset('d');
        expect(editor.vi_flag('d')).toBe(false);
    });
});

describe('operator glue api', () => {
    // select() and operate() apply a pending operator over the last motion.
    // They depend on internal motion state that the public API cannot set up,
    // so calling them in isolation does nothing - "callable without
    // corrupting the buffer" is the whole of their standalone contract
    it('select does nothing without a motion to act on', () => {
        const { editor } = newEditor('hello world\nsecond');
        editor.vi_set('d');
        editor.vi_w();
        editor.select();
        expect(editor.freeze()).toBe('hello world\nsecond\n');
    });

    // with a pending `d` and no motion, operate() currently empties the whole
    // buffer rather than doing nothing - a destructive outcome from a public
    // API call, which the old smoke test hid by asserting nothing at all
    it.fails('operate does nothing without a motion to act on', () => {
        const { editor } = newEditor('hello world\nsecond');
        editor.vi_set('d');
        editor.operate();
        expect(editor.freeze()).toBe('hello world\nsecond\n');
    });
});

describe('rendering api', () => {
    it('the redraw and measurement entry points leave the buffer alone', () => {
        const { editor } = newEditor('hello\nworld');
        editor.calcx();
        editor.calcy();
        editor.scrollto();
        editor.draw_cursor();
        editor.redraw();
        editor.resize();
        expect(editor.freeze()).toBe('hello\nworld\n');
    });
});

describe('easter eggs', () => {
    it(':kwak sets the duck background', () => {
        const { editor } = newEditor('hello');
        editor.command(':kwak');
        const term = document.querySelector('.vi-editor .editor') as HTMLElement;
        expect(term.style.backgroundImage).toContain('ducky');
        expect(editor.freeze()).toBe('hello\n');
    });

    it(':moo leaves the buffer alone', () => {
        const { editor } = newEditor('hello');
        editor.command(':moo');
        expect(editor.freeze()).toBe('hello\n');
    });

    it(':h and :about leave the buffer alone', () => {
        const { editor } = newEditor('hello');
        editor.command(':h');
        editor.command(':about');
        expect(editor.freeze()).toBe('hello\n');
    });
});

describe('spell_script option', () => {
    it('is accepted without disturbing the buffer', () => {
        const { editor } = newEditor('hello wrold', { spell_script: '/fake-spell' });
        press(editor, 'A');
        type(editor, '!');
        press(editor, '\x1b');
        expect(editor.freeze()).toBe('hello wrold!\n');
    });
});
