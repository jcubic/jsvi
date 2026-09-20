import { describe, expect, it } from 'vitest';
import createEditor, { type ViEditor } from '../vi.esm.js';
import { Keys, key, press } from './keys.js';

function newEditor(content = 'hello\nworld'): { textarea: HTMLTextAreaElement; editor: ViEditor } {
    const textarea = document.createElement('textarea');
    textarea.value = content;
    document.body.appendChild(textarea);
    const editor = createEditor(textarea);
    return { textarea, editor };
}

function cleanup({ textarea, editor }: { textarea: HTMLTextAreaElement; editor: ViEditor }) {
    editor.disable(false);
    textarea.remove();
}

// Real browsers never fire `keypress` for Escape (it produces no character),
// so exiting insert mode via Escape must work through the `keyup` handler
// alone -- it can't rely on Escape also being intercepted on `keydown`
// (older jsvi builds / browsers that don't add 27 to the keydown fast-path
// depend on this entirely).
function realKeyup(keyCode: number) {
    document.dispatchEvent(new KeyboardEvent('keyup', {
        keyCode, which: keyCode, bubbles: true, cancelable: true
    } as KeyboardEventInit));
}

describe('Escape via keyup after an arrow key in insert mode', () => {
    it('exits insert mode after arrow keydown + arrow keyup + Escape keyup', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'i');
        key(editor, Keys.RIGHT); // arrow keydown-equivalent: sets the internal fakemode flag
        realKeyup(39); // arrow's own keyup -- must not leave fakemode stuck afterwards
        realKeyup(27); // Escape keyup -- the only path older browsers/builds use
        // probe: if still in insert mode this would be inserted as literal text
        press(editor, 'z');
        expect(editor.freeze()).not.toContain('z');
        cleanup({ textarea, editor });
    });

    it('does not leave a stale fakemode flag after multiple arrow presses', () => {
        const { textarea, editor } = newEditor();
        press(editor, 'i');
        key(editor, Keys.DOWN);
        realKeyup(40);
        key(editor, Keys.UP);
        realKeyup(38);
        realKeyup(27);
        press(editor, 'z');
        expect(editor.freeze()).not.toContain('z');
        cleanup({ textarea, editor });
    });
});
