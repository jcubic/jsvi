## 0.2.1
### Bugfix
* fix `ESC` losing focus in iframe

## 0.2.0
### Features
* add padding
* add TypeScript types
* add `html` option to disable HTML processing (default `false`)
### Bugfix
* fix cursor movement exiting insert mode
* fix backsapce in first column
* fix `C` leaving cursor on last character instead of empty EOL position
* fix `D` falling through to insert mode
* fix `o`/`O`/`i`/`R`/`S`/`s` inserting command character due to missing return
* fix `term_rows`/`term_cols` zero in headless/jsdom causing cursor drift after insert
* fix stale closure state leaking between `createEditor` instances
* fix `Esc` not exiting insert mode when sent via keydown/synth path
* fix `term_freeze` adding extra trailing newline when last line already empty (Unix save)
* fix `term_justify` ReferenceError `p is not defined` and handle empty buffer
* fix `term_vi_eol`/`term_vi_line` crash on empty buffer
* fix `term_vi_bounce` crash on missing line buffer

## 0.1.0
### Features
* adding onSave/onExit callbacks and color options
* initial fork
