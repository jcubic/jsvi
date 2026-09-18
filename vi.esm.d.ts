/**
 * Type declarations for the public interface of jsvi.
 *
 * jsvi is a browser-only VI editor emulator that renders into a
 * <textarea>. These types cover the `vi()` factory and the editor
 * instance it returns; they do not describe the internal implementation.
 */

export interface ViOptions {
    /** Called when the user saves (`:w`). */
    onSave?: () => void;
    /** Called when the user exits the editor (`:q`). */
    onExit?: () => void;
    /** Foreground (text) color; requires `backgroundColor` to also be set. */
    color?: string;
    /** Background color; requires `color` to also be set. */
    backgroundColor?: string;
    /** URL of a server-side spell-check script used by the `:spell` command. */
    spell_script?: string;
    /** Space in pixels between the editor's text area and the frame around it. Defaults to 0. */
    padding?: number;
}

export interface ViEditor {
    /** Serializes the current buffer to a string. */
    freeze(): string;
    /** Replaces the buffer contents with the given string. */
    thaw(content: string): void;
    /** Switches between command mode (0) and insert mode (1). */
    setmode(mode: number): void;
    /** Rotates the numbered yank registers. */
    roll_yank(): void;
    /** Re-indents the current selection/line. */
    justify(): void;

    // Motion commands. Each moves the cursor and returns whether the
    // motion succeeded.
    vi_bb(): boolean;
    vi_b(): boolean;
    vi_tt(): boolean;
    vi_t(): boolean;
    vi_ff(): boolean;
    vi_f(): boolean;
    vi_eof(): boolean;
    vi_top(): boolean;
    vi_h(): boolean;
    vi_j(): boolean;
    vi_k(): boolean;
    vi_l(): boolean;
    vi_ll(): boolean;
    vi_mm(): boolean;
    vi_hh(): boolean;
    vi_ob(): boolean;
    vi_cb(): boolean;
    vi_ww(): boolean;
    vi_w(): boolean;
    vi_bounce(): boolean;
    vi_eol(): boolean;
    vi_line(): boolean;
    vi_ee(): boolean;
    vi_e(): boolean;
    vi_v(): void;
    vi_vv(): void;

    /** Returns whether the given vi command flag (e.g. 'd', 'c', 'y') is set. */
    vi_flag(flag: string): boolean;
    vi_unset(flag: string): void;
    vi_set(flag: string): void;

    /** Applies the current pending operator (d/c/y) over the last motion. */
    select(): void;
    indent(line: number, amount: number): void;
    unindent(line: number, amount: number): void;
    operate(): void;

    save_undo_line(): void;
    save_undo(): void;
    /** Deletes line `line` and returns its (frozen) text. */
    delete(line: number): string;

    skipreverse2(pattern: RegExp, fuzz: number): boolean;
    skipforward(pattern: RegExp, fuzz: number): boolean;
    skipbackward(pattern: RegExp): boolean;

    search(pattern: string, top: number, start: number, bottom: number): boolean;
    rsearch(pattern: string, top: number, start: number, bottom: number): boolean;
    /** Runs an ex command (e.g. ':w', ':q', '/pattern'). */
    command(cmd: string): void;

    calcy(): void;
    calcx(): void;
    scrollto(): void;

    /** Inserts a new empty line at `line`. */
    insert(line: number, content: string): void;
    /** Pastes the yank/named register `ign` after (or before) the cursor. */
    paste(after: boolean, ign?: string): void;

    keyfix(event: KeyboardEvent): boolean;
    keypress(event: KeyboardEvent): boolean;
    keypress_inner(event: KeyboardEvent, synth?: boolean): boolean | undefined;

    draw_cursor(toggle?: boolean): void;
    redraw(): void;
    resize(): void;

    /** Tears down the editor and restores the original <textarea>. */
    disable(save?: boolean): void;
}

/**
 * Turns a <textarea> into a full-screen VI editor.
 */
declare function vi(textarea: HTMLTextAreaElement, options?: ViOptions): ViEditor;

export default vi;
