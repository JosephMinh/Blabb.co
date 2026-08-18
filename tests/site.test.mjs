import { readFileSync, existsSync, statSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { dirname, resolve } from 'node:path';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');
const entryScript = readFileSync('script.js', 'utf8');
const phoneStory = readFileSync('scripts/phone-story.js', 'utf8');
const bubbleDemo = readFileSync('scripts/bubble-demo.js', 'utf8');
const transcriptDemo = readFileSync('scripts/transcript-demo.js', 'utf8');
const useCases = readFileSync('scripts/use-cases.js', 'utf8');
const privacyHtml = readFileSync('privacy/index.html', 'utf8');
const termsHtml = readFileSync('terms/index.html', 'utf8');
const notFoundHtml = readFileSync('404.html', 'utf8');
const scripts = [entryScript, phoneStory, bubbleDemo, transcriptDemo, useCases].join('\n');
const currentApk = 'https://github.com/JosephMinh/Blabb/releases/download/v0.12.5/Blabb-v0.12.5-debug.apk';

// Metadata, publishing, and essential local assets.
assert.match(html, /<title>Blabb — Private offline voice typing for Android<\/title>/);
assert.match(html, /rel="canonical" href="https:\/\/blabb\.co\/"/);
assert.match(html, /property="og:image" content="https:\/\/blabb\.co\/assets\/og\.png"/);
assert.match(html, /property="og:image:alt" content="Blabb — Voice typing\. On your device\."/);
assert.match(html, /name="twitter:image" content="https:\/\/blabb\.co\/assets\/og\.png"/);
assert.match(html, /href="privacy\/"/);
assert.match(html, /href="terms\/"/);
assert.equal(readFileSync('CNAME', 'utf8').trim(), 'blabb.co');
assert.match(privacyHtml, /rel="canonical" href="https:\/\/blabb\.co\/privacy\/"/);
assert.match(privacyHtml, /The Blabb developer does not receive that information from these downloads/);
assert.match(termsHtml, /rel="canonical" href="https:\/\/blabb\.co\/terms\/"/);
assert.match(notFoundHtml, /name="robots" content="noindex"/);
assert.match(readFileSync('sitemap.xml', 'utf8'), /https:\/\/blabb\.co\/(?:<|\s)[\s\S]*https:\/\/blabb\.co\/privacy\/[\s\S]*https:\/\/blabb\.co\/terms\//);
assert.match(readFileSync('robots.txt', 'utf8'), /Sitemap: https:\/\/blabb\.co\/sitemap\.xml/);
[
  'assets/blabb-mark.png',
  'assets/blabb-logo.png',
  'assets/blabb-glyph.svg',
  'assets/nunito.ttf',
  'assets/nunito-subset.woff2',
  'scripts/main.js',
  'scripts/phone-story.js',
  'scripts/bubble-demo.js',
  'scripts/transcript-demo.js',
  'scripts/use-cases.js'
].forEach((path) => assert.ok(existsSync(path), `Missing required site asset: ${path}`));

// Every local HTML/CSS/module reference resolves in the static site tree.
const htmlFiles = ['index.html', 'privacy/index.html', 'terms/index.html', '404.html'];
for (const file of htmlFiles) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1].split(/[?#]/)[0];
    if (!reference || reference.startsWith('#') || /^[a-z]+:/i.test(reference)) continue;
    let target = reference.startsWith('/') ? reference.slice(1) : resolve(dirname(file), reference);
    if (!target || target.endsWith('/')) target += 'index.html';
    assert.ok(existsSync(target), `${file} has a missing local reference: ${match[1]}`);
  }
}
for (const file of ['styles.css', 'legal.css']) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const reference = match[1];
    if (/^(?:data:|https?:)/i.test(reference)) continue;
    assert.ok(existsSync(resolve(dirname(file), reference)), `${file} has a missing asset reference: ${reference}`);
  }
}
for (const file of ['script.js', 'scripts/main.js', 'scripts/phone-story.js', 'scripts/bubble-demo.js', 'scripts/transcript-demo.js', 'scripts/use-cases.js']) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    assert.ok(existsSync(resolve(dirname(file), match[1])), `${file} has a missing module import: ${match[1]}`);
  }
}

// The first viewport says what Blabb is and qualifies the current build.
assert.match(html, /Speak\.[\s\S]*It types\./);
assert.match(html, /private voice bubble for Android/i);
assert.match(html, /keyboard you already use/i);
assert.match(html, /without sending your voice to the cloud/i);
assert.match(html, /Testing build/);
assert.match(html, /Android 13\+/);
assert.match(html, /No account/);
assert.ok(html.split(currentApk).length >= 5, 'Primary CTAs must use the current v0.12.5 APK URL');
assert.match(html, /class="button header-download"[^>]+aria-label="Download Blabb v0\.12\.5"/);

// The continuous story covers the product-accurate, full-context lifecycle.
[
  'STEP 01', 'FOCUS',
  'STEP 02', 'DICTATE',
  'STEP 03', 'PROCESS LOCALLY',
  'STEP 04', 'INSERT',
  'STEP 05', 'CONTINUE OR UNDO',
  'STEP 06', 'MOVE OR SNOOZE'
].forEach((copy) => assert.ok(html.includes(copy), `Missing phone-story copy: ${copy}`));
assert.match(html, /No words appear yet\. Blabb waits for the complete recording\./);
assert.match(html, /Only after processing finishes does the final, punctuated sentence land/);
assert.match(html, /remove only Blabb’s latest insertion/);
assert.match(html, /SNOOZE · 10 MIN/);
assert.match(phoneStory, /listening[\s\S]*processing[\s\S]*inserting[\s\S]*success/);
assert.match(phoneStory, /undo-highlight/);
assert.match(phoneStory, /dock-left[\s\S]*target[\s\S]*snoozed[\s\S]*returned/);

// Supporting experiences in the plan are present and interactive.
['modes', 'privacy', 'controls', 'tools', 'contexts', 'privacy-promise', 'questions'].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `Missing required section #${id}`);
});
assert.match(html, /Bubble[\s\S]*Voice Input/);
assert.match(html, /custom field does not expose a safe bubble target/i);
assert.match(html, /Dictated audio sent to Blabb[\s\S]*0 <em>bytes<\/em>/);
assert.match(html, /first voice-model download is about 73 MB/i);
['ready', 'listening', 'processing', 'success', 'compatibility', 'attention'].forEach((state) => {
  assert.match(html, new RegExp(`data-bubble-state="${state}"`), `Missing bubble lab state: ${state}`);
  assert.ok(bubbleDemo.includes(state), `Bubble lab script does not handle: ${state}`);
});
assert.match(html, /period[\s\S]*comma[\s\S]*question mark[\s\S]*new line[\s\S]*literal/);
assert.match(html, /Remove fillers/);
assert.match(transcriptDemo, /true-true[\s\S]*false-false/);
['messages', 'notes', 'email', 'search', 'forms'].forEach((context) => {
  assert.match(useCases, new RegExp(`id: "${context}"`), `Missing generic typing context: ${context}`);
});

// Privacy wording includes both the simple promise and bounded failure behavior.
assert.match(html, /No cloud speech recognition/);
assert.match(html, /No dictation history/);
assert.match(html, /No tracking machinery/);
assert.match(html, /Secure fields stay silent/);
assert.match(html, /Insertion is verified/);
assert.match(html, /At most one Keystore-encrypted transcript, expiring after ten minutes/);
assert.match(html, /Bounded pseudonymous evidence—not raw text or app history/);

// All practical FAQ items from the plan ship in readable HTML.
const faqQuestions = [
  'Does Blabb need the internet?',
  'Which Android versions are supported?',
  'Why does Blabb need AccessibilityService access?',
  'Why “display over other apps”?',
  'What happens in password fields?',
  'How large is the first model download?',
  'Does the bubble work in every text field?',
  'What is Blabb Voice Input?',
  'What should Samsung users change?',
  'Is this currently a testing build?'
];
faqQuestions.forEach((question) => assert.ok(html.includes(question), `Missing FAQ: ${question}`));
assert.equal((html.match(/<details>/g) || []).length, 10, 'Expected all ten setup FAQ answers');

// Accessibility, progressive enhancement, reduced motion, and privacy posture.
assert.match(html, /class="skip-link" href="#main"/);
assert.match(html, /<noscript>/);
assert.match(html, /role="tablist"/);
assert.match(html, /aria-live="polite"/);
assert.match(css, /prefers-reduced-motion: reduce/);
assert.match(css, /\.chapter-state-card/);
assert.match(css, /\.js\.enhanced \.reveal/);
assert.match(entryScript, /classList\.add\("enhanced"\)/);
assert.match(readFileSync('scripts/main.js', 'utf8'), /motionSections[\s\S]*IntersectionObserver/);
assert.match(phoneStory, /journeyBounds\.bottom <= 0[\s\S]*clearTimeline/);
assert.doesNotMatch(scripts, /gtag|google-analytics|segment\.com|mixpanel|hotjar/i);
assert.doesNotMatch(html, /<link[^>]+fonts\.googleapis\.com/i);
assert.doesNotMatch(html, /works everywhere|works in every app/i);

// Keep the dependency-free page materially light without image sequences or a loader.
assert.ok(statSync('index.html').size < 60_000, 'HTML should stay below 60 KB');
assert.ok(statSync('styles.css').size < 100_000, 'CSS should stay below 100 KB');
assert.ok(statSync('legal.css').size < 10_000, 'Legal-page CSS should stay below 10 KB');
assert.doesNotMatch(html, /splash|loading-screen|three\.js|webgl/i);

console.log('Blabb.co revamp checks passed.');
