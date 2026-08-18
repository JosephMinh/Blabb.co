import { readFileSync, existsSync, statSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { dirname, resolve } from 'node:path';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');
const entryScript = readFileSync('src/main.js', 'utf8');
const phoneStory = readFileSync('scripts/phone-story.js', 'utf8');
const bubbleDemo = readFileSync('scripts/bubble-demo.js', 'utf8');
const transcriptDemo = readFileSync('scripts/transcript-demo.js', 'utf8');
const useCases = readFileSync('scripts/use-cases.js', 'utf8');
const waitlist = readFileSync('scripts/waitlist.js', 'utf8');
const privacyHtml = readFileSync('privacy/index.html', 'utf8');
const termsHtml = readFileSync('terms/index.html', 'utf8');
const notFoundHtml = readFileSync('404.html', 'utf8');
const renderer = readFileSync('src/scene/renderer.js', 'utf8');
const phoneScene = readFileSync('src/scene/phone-scene.js', 'utf8');
const sceneMaterials = readFileSync('src/scene/materials.js', 'utf8');
const screenTexture = readFileSync('src/scene/screen-texture.js', 'utf8');
const phoneTimeline = readFileSync('src/scene/phone-timeline.js', 'utf8');
const capabilityPolicy = readFileSync('src/scene/capability-policy.js', 'utf8');
const artifactStyles = readFileSync('src/styles/artifact.scss', 'utf8');
const phoneGenerator = readFileSync('tools/generate_phone_model.py', 'utf8');
const branding = readFileSync('Branding.md', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = [entryScript, renderer, phoneScene, phoneTimeline, phoneStory, bubbleDemo, transcriptDemo, useCases, waitlist].join('\n');

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
  'assets/nunito.ttf',
  'assets/nunito-subset.woff2',
  'package-lock.json',
  'vite.config.js',
  '.github/workflows/pages.yml',
  'src/main.js',
  'src/scene/renderer.js',
  'src/scene/phone-scene.js',
  'src/scene/screen-texture.js',
  'src/scene/phone-timeline.js',
  'src/scene/capability-policy.js',
  'assets/phone/blabb-phone.glb',
  'tools/generate_phone_model.py',
  'src/styles/artifact.scss',
  'scripts/main.js',
  'scripts/phone-story.js',
  'scripts/bubble-demo.js',
  'scripts/transcript-demo.js',
  'scripts/use-cases.js',
  'scripts/waitlist.js'
].forEach((path) => assert.ok(existsSync(path), `Missing required site asset: ${path}`));
assert.equal(existsSync('assets/blabb-glyph.svg'), false, 'The non-canonical redraw must not ship');
assert.equal(existsSync('assets/favicon.svg'), false, 'The non-canonical favicon must not ship');

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
for (const file of ['src/main.js', 'src/scene/renderer.js', 'src/scene/phone-scene.js', 'src/scene/screen-texture.js', 'src/scene/phone-timeline.js', 'src/scene/materials.js', 'src/scene/capability-policy.js', 'scripts/main.js', 'scripts/phone-story.js', 'scripts/bubble-demo.js', 'scripts/transcript-demo.js', 'scripts/use-cases.js', 'scripts/waitlist.js']) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    if (!match[1].startsWith('.')) continue;
    assert.ok(existsSync(resolve(dirname(file), match[1])), `${file} has a missing module import: ${match[1]}`);
  }
}

// The first viewport says what Blabb is and qualifies the current build.
assert.match(html, /Speak\.[\s\S]*It types\./);
assert.match(html, /private voice bubble for Android/i);
assert.match(html, /keyboard you already use/i);
assert.match(html, /without sending your voice to the cloud/i);
assert.match(html, /Private beta/);
assert.match(html, /Android 13\+/);
assert.match(html, /No app account/);
assert.match(html, /class="waitlist-form" data-state="paused"/);
assert.match(html, /id="waitlist-email"[^>]+type="email"[^>]+disabled/);
assert.match(html, /No email is collected here while signups are paused/);
assert.match(privacyHtml, /Website waitlist[\s\S]*does not collect or submit email addresses/);
assert.doesNotMatch([html, termsHtml, privacyHtml, notFoundHtml, scripts].join('\n'), /mailto:|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
assert.doesNotMatch([html, termsHtml, privacyHtml, notFoundHtml].join('\n'), /github\.com\/JosephMinh\/Blabb(?:\/|\b)|Blabb-v\d[^\s"<]*\.apk/i);
assert.doesNotMatch(html, /Download Blabb|Download for Android/i);
assert.match(html, /<link rel="stylesheet" href="\/styles\.css"/);

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
assert.match(phoneScene, /dictate[\s\S]*process[\s\S]*insert[\s\S]*continue[\s\S]*snooze/);
assert.match(screenTexture, /showSecond[\s\S]*phase < 0\.68/);
assert.match(phoneScene, /textureState[\s\S]*"snoozed"/);
assert.match(phoneScene, /bubbleTarget\.x[\s\S]*snoozeTarget\.visible/);

// Supporting experiences in the plan are present and interactive.
['modes', 'privacy', 'controls', 'tools', 'contexts', 'privacy-promise', 'questions'].forEach((id) => {
  assert.match(html, new RegExp(`id="${id}"`), `Missing required section #${id}`);
});
assert.match(html, /Bubble[\s\S]*Voice Input/);
assert.match(html, /id="app-tab"[\s\S]*Blabb app/);
assert.match(html, /Tap to dictate with Blabb/);
assert.match(html, /Keyboard[\s\S]*Start speaking/);
assert.match(html, /class="mode-home-screen"[\s\S]*You’re ready to Blabb/);
assert.match(html, /Text field detection[\s\S]*Floating bubble[\s\S]*Microphone[\s\S]*Voice model/);
assert.doesNotMatch(html, /local-waveform|processing-card/);
assert.doesNotMatch(screenTexture, /ui-state-card|Listening on this phone/);
assert.match(phoneScene, /stateRing[\s\S]*snoozeTarget/);
assert.match(phoneScene, /processingArc[\s\S]*THREE\.MathUtils\.degToRad\(245\)/);
assert.match(phoneScene, /const dots = new THREE\.Group/);
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
  'When can I try Blabb?'
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
assert.match(css, /\.js\.enhanced \.chapter-copy\.reveal\s*\{[^}]*opacity:\s*1[^}]*transform:\s*none/);
assert.match(entryScript, /classList\.add\("enhanced"\)/);
assert.match(readFileSync('scripts/main.js', 'utf8'), /motionSections[\s\S]*IntersectionObserver/);
assert.match(html, /<canvas id="artifact-webgl" data-device="android-phone"><\/canvas>/);
assert.match(html, /artifact-drag-hint/);
assert.match(renderer, /new THREE\.WebGLRenderer/);
assert.match(renderer, /RoomEnvironment/);
assert.match(renderer, /shadowMap\.enabled = !automated/);
assert.doesNotMatch(renderer, /PCFSoftShadowMap/);
assert.match(renderer, /ACESFilmicToneMapping/);
assert.match(renderer, /renderer\.render\(scene, camera\)/);
assert.doesNotMatch(renderer, /createPostprocessing|EffectComposer|composer\.render/);
assert.match(renderer, /powerPreference: "high-performance"/);
assert.match(renderer, /WEBGL_debug_renderer_info/);
assert.match(renderer, /swiftshader\|llvmpipe\|software rasterizer\|basic render\|microsoft warp/i);
assert.match(renderer, /software-fallback/);
assert.match(renderer, /automated \|\| softwareRenderer/);
assert.match(renderer, /softwareRenderer \? 0\.5/);
assert.match(html, /data-device="android-phone"/);
assert.match(screenTexture, /new THREE\.CanvasTexture/);
assert.match(screenTexture, /Blabb bubble snoozed/);
assert.match(screenTexture, /function textWidth[\s\S]*context\.measureText/);
assert.match(screenTexture, /baseLineY[\s\S]*insertionLineY[\s\S]*secondX/);
assert.doesNotMatch(screenTexture, /const start = 278|showSecond \? 287|showFirst \? 515/);
assert.match(phoneScene, /GLTFLoader/);
assert.match(phoneScene, /blabb-phone\.glb/);
assert.match(phoneScene, /TextureLoader[\s\S]*blabb-mark\.png/);
assert.match(phoneScene, /createBubble\(materials, logoTexture\)/);
assert.match(phoneScene, /profile\.name = "thin-bubble-profile"/);
assert.match(phoneScene, /profile\.scale\.set\(1, 1, 0\.24\)/);
assert.match(phoneScene, /state === "hero" \? -3\.12 : 2\.1/);
assert.match(phoneScene, /Math\.min\(0\.44, viewport\.height \/ 1800\)/);
assert.doesNotMatch(phoneScene, /logoCanvas|logoContext|fillText\("B"/);
for (const [name, hex] of Object.entries({ plum: '170A1C', aqua: '88E0D9', coral: 'EF8354', forest: '32533D' })) {
  assert.match(branding, new RegExp(hex));
  assert.match(sceneMaterials, new RegExp(`${name}: new THREE\\.Color\\("#${hex.toLowerCase()}"\\)`));
  assert.match(sceneMaterials, new RegExp(`${name}: new THREE\\.MeshBasicMaterial\\(\\{ color: palette\\.${name}, toneMapped: false \\}\\)`));
}
assert.match(phoneScene, /CylinderGeometry\(0\.32, 0\.32, 0\.16[\s\S]*materials\.aqua/);
assert.doesNotMatch(phoneScene, /bubble\.body\.material\.emissiveIntensity/);
assert.match(phoneScene, /double|TouchRings|touchRings/i);
assert.match(phoneScene, /function rotateBy/);
assert.match(phoneScene, /phone-interaction-proxy/);
assert.match(phoneScene, /intersectObject\(interactionProxy, false\)/);
assert.doesNotMatch(phoneScene, /intersectObject\(phone, true\)/);
assert.doesNotMatch(phoneScene, /handsetDepth|assembly-(?:battery|board|midframe|display)/);
assert.match(phoneGenerator, /rounded_box\("PHONE_BODY"/);
assert.match(phoneGenerator, /continuous-shell/);
assert.match(phoneGenerator, /PHONE_BODY", \(3\.5, 0\.42, 7\.45\)/);
assert.match(phoneGenerator, /boolean_recess\(body, display_recess\)/);
assert.match(phoneGenerator, /rounded_plate\("DISPLAY_GLASS"/);
assert.match(phoneGenerator, /boolean_recess\(body, usb_cutter\)/);
assert.match(phoneGenerator, /SPEAKER_CUTTER_/);
assert.match(phoneScene, /PlaneGeometry\(3\.34, 7\.24\)/);
assert.match(screenTexture, /context\.roundRect\(0, 0, canvas\.width, canvas\.height, 52\)/);
assert.doesNotMatch(phoneGenerator, /MAINBOARD|BATTERY_AQUA|MIDFRAME_|DISPLAY_BED|OLED_PANEL|LOCAL_ENGINE|CHARGING_COIL/);
assert.doesNotMatch(phoneScene, /explosionTarget|updateLayerTargets/);
assert.match(renderer, /controller\.hitTest/);
assert.match(renderer, /touchDecision/);
assert.match(renderer, /setPointerCapture/);
assert.match(renderer, /selectstart[\s\S]*dragstart[\s\S]*suppressNativeDrag/);
assert.match(renderer, /pointerdown", onPointerDown, \{ passive: false \}/);
assert.match(renderer, /firstFrame = false/);
assert.doesNotMatch(phoneScene, /cameraIsland/);
assert.match(phoneTimeline, /ScrollTrigger\.create/);
['focus', 'dictate', 'process', 'insert', 'undo', 'snooze'].forEach((label) => assert.ok(phoneTimeline.includes(`"${label}"`), `Missing scroll label: ${label}`));
assert.doesNotMatch(phoneTimeline, /setTimeout|setInterval/);
assert.match(capabilityPolicy, /deviceMemory <= 2/);
assert.match(capabilityPolicy, /prefers-reduced-motion: reduce/);
assert.match(artifactStyles, /artifact-stage::after/);
assert.ok(statSync('assets/phone/blabb-phone.glb').size < 2_500_000, '3D handset should stay below 2.5 MB');
assert.doesNotMatch(scripts, /gtag|google-analytics|segment\.com|mixpanel|hotjar/i);
assert.doesNotMatch(html, /<link[^>]+fonts\.googleapis\.com/i);
assert.doesNotMatch(html, /works everywhere|works in every app/i);

// Keep the semantic shell light; the 3D runtime is dynamically imported after first paint.
assert.ok(statSync('index.html').size < 60_000, 'HTML should stay below 60 KB');
assert.ok(statSync('styles.css').size < 100_000, 'CSS should stay below 100 KB');
assert.ok(statSync('legal.css').size < 10_000, 'Legal-page CSS should stay below 10 KB');
assert.doesNotMatch(html, /splash|loading-screen/i);
assert.match(entryScript, /import\("\.\/scene\/renderer\.js"\)/);
assert.equal(packageJson.dependencies.three, '0.185.1');
assert.equal(packageJson.dependencies.gsap, '3.15.0');
assert.equal(packageJson.dependencies.lenis, '1.3.26');
assert.equal(packageJson.devDependencies.vite, '8.2.1');
assert.equal(packageJson.devDependencies.sass, '1.102.0');
assert.equal(packageJson.devDependencies['@playwright/test'], '1.62.1');

console.log('Blabb.co revamp checks passed.');
