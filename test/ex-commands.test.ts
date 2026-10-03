import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanupEditors, keys, newEditor } from './harness.js';
import { press, type } from './keys.js';

afterEach(cleanupEditors);

/**
 * `it.fails` marks behaviour that differs from vi. Those tests assert what vi
 * does, so each one starts passing once the gap is closed - at which point it
 * should become a plain `it`.
 */

describe('writing and quitting', () => {
    it(':w syncs the textarea without exiting', () => {
        const onExit = vi.fn();
        const { textarea, editor } = newEditor('hello', { onExit });
        press(editor, 'A');
        type(editor, '!');
        press(editor, '\x1b');
        editor.command(':w');
        expect(textarea.value).toBe('hello!\n');
        expect(onExit).not.toHaveBeenCalled();
    });

    it(':q exits an unmodified buffer', () => {
        const onExit = vi.fn();
        const { editor } = newEditor('hello', { onExit });
        editor.command(':q');
        expect(onExit).toHaveBeenCalled();
    });

    it(':q refuses to exit a modified buffer', () => {
        const onExit = vi.fn();
        const { editor } = newEditor('hello', { onExit });
        press(editor, 'A');
        type(editor, 'x');
        press(editor, '\x1b');
        editor.command(':q');
        expect(onExit).not.toHaveBeenCalled();
    });

    it(':q! discards changes and exits', () => {
        const onExit = vi.fn();
        const { textarea, editor } = newEditor('hello', { onExit });
        press(editor, 'A');
        type(editor, 'x');
        press(editor, '\x1b');
        editor.command(':q!');
        expect(onExit).toHaveBeenCalled();
        expect(textarea.value).toBe('hello\n');
    });

    it(':x saves and exits', () => {
        const onExit = vi.fn();
        const { textarea, editor } = newEditor('hello', { onExit });
        press(editor, 'A');
        type(editor, 'x');
        press(editor, '\x1b');
        editor.command(':x');
        expect(onExit).toHaveBeenCalled();
        expect(textarea.value).toBe('hellox\n');
    });

    it(':wq saves and exits', () => {
        const onSave = vi.fn();
        const onExit = vi.fn();
        const { editor } = newEditor('hello', { onSave, onExit });
        editor.command(':wq');
        expect(onSave).toHaveBeenCalled();
        expect(onExit).toHaveBeenCalled();
    });
});

describe('line ranges', () => {
    it(':%d deletes the whole buffer', () => {
        const { editor } = newEditor('a\nb\nc\nd\ne');
        editor.command(':%d');
        expect(editor.freeze()).toBe('');
    });

    it(':N,Md deletes an explicit range', () => {
        const { editor } = newEditor('a\nb\nc\nd\ne');
        editor.command(':3,4d');
        expect(editor.freeze()).toBe('a\nb\ne\n');
    });

    it(':Nd deletes a single line', () => {
        const { editor } = newEditor('a\nb\nc');
        editor.command(':2d');
        expect(editor.freeze()).toBe('a\nc\n');
    });

    it(':$d deletes the last line', () => {
        const { editor } = newEditor('a\nb\nc');
        editor.command(':$d');
        expect(editor.freeze()).toBe('a\nb\n');
    });

    it(':.d deletes the line the cursor is on', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'j');
        editor.command(':.d');
        expect(editor.freeze()).toBe('a\nc\n');
    });

    it(':1,$d deletes every line', () => {
        const { editor } = newEditor('a\nb\nc');
        editor.command(':1,$d');
        expect(editor.freeze()).toBe('');
    });

    // jsvi starts the range one line too early whenever the end is `$`:
    // `:4,$d` removes lines 3-5 and `:3,$d` removes 2-5. An explicit numeric
    // end such as `:4,5d` is handled correctly
    it.fails(':N,$d deletes from line N to the end', () => {
        const { editor } = newEditor('1\n2\n3\n4\n5');
        editor.command(':4,$d');
        expect(editor.freeze()).toBe('1\n2\n3\n');
    });

    it(':1,2d deletes the first two lines', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        editor.command(':1,2d');
        expect(editor.freeze()).toBe('c\nd\n');
    });

    it('a mark works as a range endpoint', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'jma');
        keys(editor, 'jj');
        editor.command(":'a,.d");
        expect(editor.freeze()).toBe('a\n');
    });
});

describe('search and relative addressing', () => {
    // jsvi parses these forms but resolves no line from them, so each command
    // below is a silent no-op and the buffer comes back unchanged

    it.fails(':/pattern/d deletes the matching line', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        editor.command(':/c/d');
        expect(editor.freeze()).toBe('a\nb\nd\n');
    });

    it.fails(':?pattern?d deletes the match found searching backward', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'jjj');
        editor.command(':?b?d');
        expect(editor.freeze()).toBe('a\nc\nd\n');
    });

    it.fails(':/from/,/to/d deletes the range between two matches', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        editor.command(':/b/,/c/d');
        expect(editor.freeze()).toBe('a\nd\n');
    });

    it.fails(':.+1d deletes the line after the cursor', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        keys(editor, 'j');
        editor.command(':.+1d');
        expect(editor.freeze()).toBe('a\nb\nd\n');
    });

    it.fails(':$-1d deletes the second to last line', () => {
        const { editor } = newEditor('a\nb\nc\nd');
        editor.command(':$-1d');
        expect(editor.freeze()).toBe('a\nb\nd\n');
    });
});

describe('substitution', () => {
    it(':%s replaces across the whole buffer', () => {
        const { editor } = newEditor('foo\nfoo\nfoo');
        editor.command(':%s/foo/bar/g');
        expect(editor.freeze()).toBe('bar\nbar\nbar\n');
    });

    it(':%s replaces every occurrence on a line with /g', () => {
        const { editor } = newEditor('foo foo');
        editor.command(':%s/foo/bar/g');
        expect(editor.freeze()).toBe('bar bar\n');
    });

    // jsvi only ever substitutes on the first line of the range
    it.fails(':N,Ms replaces across the given range', () => {
        const { editor } = newEditor('foo\nfoo\nfoo');
        editor.command(':1,2s/foo/bar/');
        expect(editor.freeze()).toBe('bar\nbar\nfoo\n');
    });

    // a single-line address is a silent no-op in jsvi - the buffer is
    // untouched where vi substitutes on that one line
    it.fails(':Ns replaces on the addressed line', () => {
        const { editor } = newEditor('foo\nfoo\nfoo');
        editor.command(':1s/foo/bar/');
        expect(editor.freeze()).toBe('bar\nfoo\nfoo\n');
    });

    // likewise with no address at all, which vi applies to the current line
    it.fails(':s replaces on the current line', () => {
        const { editor } = newEditor('foo\nfoo');
        editor.command(':s/foo/bar/');
        expect(editor.freeze()).toBe('bar\nfoo\n');
    });
});

describe('reloading and unknown commands', () => {
    it(':e! discards changes and reloads from the textarea', () => {
        const { editor } = newEditor('a\nb\nc');
        keys(editor, 'dd');
        expect(editor.freeze()).toBe('b\nc\n');
        editor.command(':e!');
        expect(editor.freeze()).toBe('a\nb\nc\n');
    });

    it('an unrecognised command leaves the buffer untouched', () => {
        const { editor } = newEditor('hello');
        editor.command(':zzz');
        expect(editor.freeze()).toBe('hello\n');
    });

    it(':= reports a line number without changing the buffer', () => {
        const { editor } = newEditor('a\nb\nc');
        editor.command(':=');
        expect(editor.freeze()).toBe('a\nb\nc\n');
    });
});

describe('rich-text formatting (:F)', () => {
    it(':F!b marks following input as bold when html is on', () => {
        const { editor } = newEditor('hello', { html: true });
        editor.command(':F!b');
        press(editor, 'A');
        type(editor, 'XY');
        press(editor, '\x1b');
        expect(editor.freeze()).toBe('hello<b>XY\n');
    });

    it('leaves the buffer alone until something is typed', () => {
        const { editor } = newEditor('hello', { html: true });
        editor.command(':F!b');
        expect(editor.freeze()).toBe('hello\n');
    });
});
