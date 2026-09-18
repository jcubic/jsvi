# jsvi

[![npm version](https://img.shields.io/npm/v/jsvi.svg)](https://www.npmjs.com/package/jsvi)
[![CI](https://github.com/jcubic/jsvi/actions/workflows/ci.yml/badge.svg)](https://github.com/jcubic/jsvi/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/jcubic/jsvi/badge.svg)](https://coveralls.io/github/jcubic/jsvi)

VI editor implemented in JavaScript, that turns any `<textarea>` into a
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
    onSave(content) {
        console.log('saved:', content);
    },
    onExit() {
        console.log('editor closed');
    }
});
```

TypeScript types for the public API (the `vi()` factory and the editor
instance it returns) are included, so `import vi from 'jsvi'` is typed
out of the box.

### Script tag (jsDelivr)

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
| `onSave`          | `(content: string) => void` | Called with the buffer contents on `:w`  |
| `onExit`          | `() => void`                | Called when the editor is closed (`:q`)  |
| `color`           | `string`                    | Foreground color (needs `backgroundColor`) |
| `backgroundColor` | `string`                    | Background color (needs `color`)         |
| `spell_script`    | `string`                    | URL of a server-side spell-check script  |

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

Copyright (C) 2006-2008 Internet Connection, Inc.
Copyright (C) 2013-2026 Jakub T. Jankiewicz

Released under the GNU General Public License v3.0. See
[LICENSE](./LICENSE) for details.
