import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// vi.js is a classic script (sets the global `vi`) so it can be used
// unmodified via a plain <script> tag (e.g. from jsDelivr). This script
// generates an ESM build by appending an export statement, without
// touching the original source.

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(path.join(root, 'vi.js'), 'utf8');
const out = `${src}\nexport default vi;\n`;

writeFileSync(path.join(root, 'vi.esm.js'), out);
