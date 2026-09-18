# jsvi

[![npm version](https://img.shields.io/npm/v/jsvi.svg)](https://www.npmjs.com/package/jsvi)
[![JSDelivr CDN download](https://data.jsdelivr.com/v1/package/npm/jsvi/badge)](https://www.jsdelivr.com/package/npm/jsvi)
[![CI](https://github.com/jcubic/jsvi/actions/workflows/ci.yml/badge.svg)](https://github.com/jcubic/jsvi/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/jcubic/jsvi/badge.svg)](https://coveralls.io/github/jcubic/jsvi)

VI editor implemented in JavaScript, which turns any `<textarea>` into a
full-screen VI-style editor running in the browser.

## Install

```bash
npm install jsvi
```

## Usage

### ES Module

```js
import vi from 'jsvi';
import 'jsvi/vi.css';

const textarea = document.querySelector('#editor');
const editor = vi(textarea, {
    onSave() {
        console.log('contents:', textarea.value);
        console.log('contents:', editor.freeze());
    },
    onExit() {
        console.log('editor closed');
    }
});
```

TypeScript types for the public API (the `vi()` factory and the editor
instance it returns) are included, so `import vi from 'jsvi'` is typed
out of the box.

### Script Tag (jsDelivr)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsvi/vi.css" />
<script src="https://cdn.jsdelivr.net/npm/jsvi/vi.js"></script>
<script>
    const editor = vi(document.querySelector('#editor'));
</script>
```

This build exposes a global `vi` function, same as before — no bundler
required.

## API

`vi(textarea, options?)` replaces the given `<textarea>` with the editor
UI and returns an editor instance. Options:

| Option            | Type                       | Description                              |
|-------------------|----------------------------|-------------------------------------------|
| `onSave`          | `() => void`                | Called when file is saved (`:w`)  |
| `onExit`          | `() => void`                | Called when the editor is closed (`:q`)  |
| `color`           | `string`                    | Foreground color (needs `backgroundColor`) |
| `backgroundColor` | `string`                    | Background color (needs `color`)         |
| `spell_script`    | `string`                    | URL of a server-side spell-check script  |
| `padding`         | `number`                    | Space in pixels around the editor's text area (default `0`) |
| `html`            | `boolean`                    | Interpret `<b>`/`<u>`/`<i>`/`<span class="rv">` and `&amp;`/`&lt;` as rich-text markup, and escape `<`/`&` on save (default `false`, plain text) |

The returned editor instance exposes methods such as `freeze()` /
`thaw()` (serialize/load the buffer), `insert()`, `delete()`,
`command()` (run an ex command), and `disable()` (tear down the
editor). See [`vi.esm.d.ts`](./vi.esm.d.ts) for the full public
interface.

## Development

```bash
npm install
npm run build      # generates vi.esm.js from vi.js
npm run typecheck  # type-checks the public interface with tsc
npm test           # runs the Vitest + jsdom test suite
npm run coverage   # runs tests with a code coverage report
```

`vi.js` is the original ES5 source and is also the browser/script-tag
build; `vi.esm.js` is generated from it (with an `export default`
added) so the package can be `import`ed by name.

## License

<pre>

Copyright (C) 2006-2008 Internet Connection, Inc.
Copyright (C) 2013-2026 Jakub T. Jankiewicz

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see &lt;<a href="https://www.gnu.org/licenses/">https://www.gnu.org/licenses/</a>&gt;.

Released under the GNU General Public License v3.0. See
<a href="https://github.com/jcubic/jsvi/blob/master/LICENSE">LICENSE</a> for details.

</pre>
