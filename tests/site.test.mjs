import { readFileSync, existsSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');

assert.match(html, /<title>Blabb/);
assert.match(html, /rel="canonical" href="https:\/\/blabb\.co\/"/);
assert.match(html, /href="privacy\/"/);
assert.match(html, /href="terms\/"/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /@font-face/);
assert.ok(existsSync('assets/blabb-mark.png'));
assert.ok(existsSync('assets/blabb-logo.png'));
assert.ok(existsSync('assets/nunito.ttf'));
assert.equal(readFileSync('CNAME', 'utf8').trim(), 'blabb.co');

console.log('Blabb.co site checks passed.');
