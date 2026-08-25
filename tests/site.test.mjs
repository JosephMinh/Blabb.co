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
const waitlistWorker = readFileSync('worker/waitlist.js', 'utf8');
const privacyHtml = readFileSync('privacy/index.html', 'utf8');
const termsHtml = readFileSync('terms/index.html', 'utf8');
const waitlistReceivedHtml = readFileSync('waitlist-received/index.html', 'utf8');
const notFoundHtml = readFileSync('404.html', 'utf8');
const renderer = readFileSync('src/scene/renderer.js', 'utf8');
const phoneScene = readFileSync('src/scene/phone-scene.js', 'utf8');
const sceneMaterials = readFileSync('src/scene/materials.js', 'utf8');
const screenTexture = readFileSync('src/scene/screen-texture.js', 'utf8');
const storyPhases = readFileSync('src/scene/story-phases.js', 'utf8');
const phoneTimeline = readFileSync('src/scene/phone-timeline.js', 'utf8');
const capabilityPolicy = readFileSync('src/scene/capability-policy.js', 'utf8');
const artifactStyles = readFileSync('src/styles/artifact.scss', 'utf8');
const phoneGenerator = readFileSync('tools/generate_phone_model.py', 'utf8');
const branding = readFileSync('Branding.md', 'utf8');
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = [entryScript, renderer, phoneScene, phoneTimeline, phoneStory, bubbleDemo, transcriptDemo, useCases, waitlist].join('\n');

// Metadata, publishing, and essential local assets.
assert.match(html, /<title>Blabb: Private offline voice typing for Android<\/title>/);
assert.match(html, /rel="canonical" href="https:\/\/blabb\.co\/"/);
assert.match(html, /property="og:image" content="https:\/\/blabb\.co\/assets\/og\.png"/);
assert.match(html, /property="og:image:alt" content="Blabb\. Voice typing\. On your device\."/);
assert.match(html, /name="twitter:image" content="https:\/\/blabb\.co\/assets\/og\.png"/);
assert.match(html, /href="privacy\/"/);
assert.match(html, /href="terms\/"/);
assert.equal(readFileSync('CNAME', 'utf8').trim(), 'blabb.co');
assert.match(privacyHtml, /rel="canonical" href="https:\/\/blabb\.co\/privacy\/"/);
assert.match(privacyHtml, /The Blabb developer does not receive that information from these downloads/);
assert.match(termsHtml, /rel="canonical" href="https:\/\/blabb\.co\/terms\/"/);
assert.match(notFoundHtml, /name="robots" content="noindex"/);
assert.match(notFoundHtml, /href="\/styles\.css"/);
assert.match(notFoundHtml, /src="\/assets\/blabb-mark\.png"/);
assert.match(notFoundHtml, /href="\/privacy\/"/);
assert.match(notFoundHtml, /href="\/terms\/"/);
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
  'scripts/waitlist.js',
  'worker/waitlist.js',
  'wrangler.jsonc',
  'waitlist-received/index.html'
].forEach((path) => assert.ok(existsSync(path), `Missing required site asset: ${path}`));
assert.equal(existsSync('assets/blabb-glyph.svg'), false, 'The non-canonical redraw must not ship');
assert.equal(existsSync('assets/favicon.svg'), false, 'The non-canonical favicon must not ship');

// Every local HTML/CSS/module reference resolves in the static site tree.
const htmlFiles = ['index.html', 'privacy/index.html', 'terms/index.html', 'waitlist-received/index.html', '404.html'];
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
    if (/^(?:#|data:|https?:)/i.test(reference)) continue;
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
assert.doesNotMatch(html, />Tomorrow</);
assert.match(html, /class="date-chip">Today</);
assert.match(html, /status-signal[\s\S]*status-wifi[\s\S]*status-battery/);
assert.match(screenTexture, /text\(context, "Today"/);
assert.match(screenTexture, /function drawStatusIcons/);
assert.match(screenTexture, /roundedRect\(context, 687, 35, 14, 21/);
assert.match(css, /\.status-battery \{[^}]*width: 8px; height: 13px/);
assert.match(screenTexture, /opticallyCenteredText\(context, "M", 83, 143/);
assert.match(screenTexture, /function drawSendIcon/);
assert.match(screenTexture, /const opticalOffsetX = size \* 0\.055/);
assert.match(screenTexture, /roundedRect\(context, 620, 982, 84, 84, 42, colors\.aqua\)/);
assert.match(screenTexture, /drawSendIcon\(context, 662, 1024\)/);
assert.match(html, /class="send-button"><svg viewBox="0 0 24 24"/);
assert.match(css, /\.send-button \{[^}]*color: var\(--plum\); background: var\(--aqua\)/);
assert.match(css, /\.send-button svg \{[^}]*translateX\(0\.8px\)/);

// Public copy describes what each visual signal means, without internal palette names.
const renderedCopy = html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ');
assert.doesNotMatch(renderedCopy, /\b(?:aqua|coral|forest(?: green)?|plum|lilac)\b/i);
[html, privacyHtml, termsHtml, notFoundHtml, packageJson.description].forEach((copy) => {
  assert.doesNotMatch(copy, /—|&mdash;|&#(?:8212|x2014);/i, 'Public copy must not use em dashes');
});
assert.match(html, /keyboard you already use/i);
assert.match(html, /without sending your voice to the cloud/i);
assert.match(html, /Private beta/);
assert.match(html, /Android 13\+/);
assert.match(html, /No app account/);
assert.match(html, /<form class="waitlist-form" action="\/api\/waitlist" method="post" data-waitlist-form/);
assert.match(html, /name="platform" value="android" checked/);
assert.match(html, /name="platform" value="ios"/);
assert.doesNotMatch(html, /join the Android waitlist/i);
assert.match(html, /class="waitlist-icon"[^>]*>[\s\S]*M20 4H4/);
assert.doesNotMatch(html, /M17\.6 9\.5 19 7\.1/);
assert.match(html, /id="waitlist-email"[^>]+type="email"[^>]+required/);
assert.match(html, /name="website"[^>]+tabindex="-1"/);
assert.match(entryScript, /initWaitlist\(\)/);
assert.match(waitlist, /fetch\(form\.action/);
assert.match(waitlistWorker, /source_blabb_waitlist: true/);
assert.match(waitlistWorker, /platform_android/);
assert.match(waitlistWorker, /platform_ios/);
assert.match(waitlistWorker, /method: "PUT"/);
assert.doesNotMatch(waitlistWorker, /status:\s*["'](?:subscribed|SUBSCRIBED)["']/);
assert.match(privacyHtml, /Cloudflare[\s\S]*EmailOctopus/);
assert.match(privacyHtml, /does not keep a separate waitlist database or log submitted email addresses/);
assert.match(waitlistReceivedHtml, /Check your inbox/);
assert.doesNotMatch([html, termsHtml, privacyHtml, waitlistReceivedHtml, notFoundHtml, scripts].join('\n'), /mailto:|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
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
assert.match(html, /SNOOZE<br \/>10 MIN/);
assert.equal((html.match(/class="mobile-chapter-summary"/g) || []).length, 6);
assert.match(phoneScene, /dictate[\s\S]*process[\s\S]*insert[\s\S]*continue[\s\S]*snooze/);
assert.match(screenTexture, /showSecond[\s\S]*showsContinueInsertion\(phase\)/);
assert.match(storyPhases, /resultStart:\s*0\.28[\s\S]*undoStart:\s*0\.78/);
assert.match(phoneScene, /continueInsertion[\s\S]*key = `\$\{textureState\}-\$\{phaseBucket\}-\$\{continueInsertion \? 1 : 0\}`/);
const fallbackContinueTimeline = phoneStory.match(/function playContinueTimeline\(\)[\s\S]*?function playSnoozeTimeline/)?.[0] || '';
assert.doesNotMatch(fallbackContinueTimeline, /setVisualState\("(?:listening|processing)"/);
assert.match(phoneScene, /textureState[\s\S]*"snoozed"/);
assert.match(phoneScene, /function snoozeStoryFrame[\s\S]*bubbleX[\s\S]*targetVisible/);
assert.match(phoneTimeline, /syncJourneyVisibility[\s\S]*exitClearance[\s\S]*bounds\.bottom > exitClearance/);
assert.match(phoneTimeline, /addEventListener\("scroll", syncJourneyVisibility/);

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
assert.match(phoneScene, /Math\.PI \* 2 \/ 1\.2/);
assert.match(phoneScene, /badgeRadius: 0\.1152/);
assert.match(phoneScene, /badgeOffset: 0\.1984/);
assert.match(phoneScene, /widthDp: 176,[\s\S]*heightDp: 78,[\s\S]*cornerRadiusDp: 28/);
assert.match(phoneScene, /bottomMarginDp: 22,[\s\S]*restingStrokeDp: 2,[\s\S]*capturedStrokeDp: 3/);
assert.match(phoneScene, /surface\.name = "android-snooze-overlay"/);
assert.match(phoneScene, /bubble\.group\.visible = frame\.bubbleVisible;[\s\S]*snoozeTarget\.visible = frame\.targetVisible/);
assert.match(phoneScene, /context\.font = `700 \$\{appSnoozeTargetMetrics\.textSizeSp \* scale\}px Nunito, sans-serif`/);
assert.match(phoneScene, /fillText\("SNOOZE", 256, 89\)[\s\S]*fillText\("10 MIN", 256, 139\)/);
assert.match(phoneScene, /globalCompositeOperation = "source-in"/);
assert.match(phoneScene, /fillStyle = "#170a1c"/);
assert.doesNotMatch(phoneScene, /bubble\.group\.rotation\.z/);
assert.match(phoneScene, /const dots = new THREE\.Group/);
assert.match(screenTexture, /It will return automatically in 10 minutes\./);
assert.match(screenTexture, /End snooze/);
assert.match(html, /Drag the idle bubble down to snooze for 10 minutes\./);
assert.doesNotMatch(html, /⌨/);
assert.match(html, /id="bubble-plum-tint"[\s\S]*flood-color="#170A1C"[\s\S]*in2="SourceAlpha"/);
assert.match(css, /circle closest-side, transparent 88\.3%, black 89%/);
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
assert.match(html, /don't forget the literal comma after the greeting/i);
assert.match(html, /Don’t forget the comma after the greeting\./);
assert.doesNotMatch([html, transcriptDemo].join('\n'), /comma means the word/i);
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
assert.match(html, /Bounded pseudonymous evidence\. Never raw text or app history/);

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
assert.match(css, /--font:\s*"Nunito", system-ui, sans-serif/);
assert.match(css, /\.mobile-menu \{[^}]*background:\s*var\(--paper\)/);
assert.match(css, /\.chapter-state-card/);
assert.match(css, /\.js\.enhanced \.reveal/);
assert.match(css, /\.js\.enhanced \.chapter-copy\.reveal\s*\{[^}]*opacity:\s*1[^}]*transform:\s*none/);
assert.match(entryScript, /classList\.add\("enhanced"\)/);
assert.match(readFileSync('scripts/main.js', 'utf8'), /motionSections[\s\S]*IntersectionObserver/);
assert.match(html, /href="#story" data-mobile-showcase/);
assert.match(readFileSync('scripts/main.js', 'utf8'), /mobileShowcaseLink[\s\S]*hero\.offsetHeight \* 0\.35/);
assert.match(html, /<canvas id="artifact-webgl" data-device="android-phone"><\/canvas>/);
assert.match(html, /artifact-drag-hint/);
assert.match(html, /artifact-drag-icon/);
assert.match(artifactStyles, /\.artifact-drag-icon\s*\{[^}]*flex:\s*0 0 30px[^}]*aspect-ratio:\s*1/);
assert.match(html, /class="lab-heading-rail"/);
assert.match(css, /\.lab-heading-rail\s*\{[^}]*min-width:\s*0/);
assert.doesNotMatch([html, css, phoneStory, phoneScene, artifactStyles].join('\n'), /state-readout/);
assert.match(renderer, /new THREE\.WebGLRenderer/);
assert.match(renderer, /RoomEnvironment/);
assert.match(renderer, /shadowMap\.enabled = !automated/);
assert.doesNotMatch(renderer, /PCFSoftShadowMap/);
assert.match(renderer, /const shadowMapSize = compactShadows \? 1024 : 2048/);
assert.match(renderer, /key\.shadow\.radius = compactShadows \? 2\.5 : 7/);
assert.match(renderer, /key\.shadow\.camera\.near = 2/);
assert.match(renderer, /key\.shadow\.camera\.far = 24/);
assert.match(renderer, /key\.shadow\.focus = 0\.82/);
assert.match(renderer, /ACESFilmicToneMapping/);
assert.match(renderer, /renderer\.render\(scene, camera\)/);
assert.match(renderer, /render\(gsap\.ticker\.time\)/);
assert.doesNotMatch(renderer, /render\(performance\.now\(\) \/ 1000\)/);
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
assert.match(screenTexture, /const screenSafe = \{ left: 64, right: 704 \}/);
assert.doesNotMatch(screenTexture, /const start = 278|showSecond \? 287|showFirst \? 515/);
assert.match(phoneScene, /GLTFLoader/);
assert.match(phoneScene, /blabb-phone\.glb/);
assert.match(phoneScene, /TextureLoader[\s\S]*blabb-mark\.png/);
assert.match(phoneScene, /createBubble\(materials, logoTexture\)/);
assert.match(phoneScene, /profile\.name = "thin-bubble-profile"/);
assert.match(phoneScene, /profile\.scale\.set\(1, 1, 0\.24\)/);
assert.doesNotMatch(phoneScene, /logoCanvas|logoContext|fillText\("B"/);
for (const [name, hex] of Object.entries({ plum: '170A1C', aqua: '88E0D9', coral: 'EF8354', forest: '32533D' })) {
  assert.match(branding, new RegExp(hex));
  assert.match(sceneMaterials, new RegExp(`${name}: new THREE\\.Color\\("#${hex.toLowerCase()}"\\)`));
  assert.match(sceneMaterials, new RegExp(`${name}: new THREE\\.MeshBasicMaterial\\(\\{ color: palette\\.${name}, toneMapped: false \\}\\)`));
}
assert.match(css, /--text-on-dark: rgba\(237, 223, 239, 0\.88\)/);
assert.match(css, /--text-on-dark-muted: rgba\(237, 223, 239, 0\.72\)/);
assert.match(css, /--text-on-light-muted: rgba\(23, 10, 28, 0\.78\)/);
assert.match(phoneScene, /CylinderGeometry\(bubbleMetrics\.radius, bubbleMetrics\.radius, 0\.16[\s\S]*materials\.aqua/);
assert.doesNotMatch(phoneScene, /bubble\.body\.material\.emissiveIntensity/);
assert.doesNotMatch(phoneScene, /CircleGeometry\(0\.35[\s\S]*opacity: 0\.25/, 'Bubble must not use a flat circular fake shadow');
assert.match(phoneScene, /body\.castShadow = true/);
assert.match(phoneScene, /bubbleRestPosition = Object\.freeze\(\{ x: 1\.58, y: -0\.5, z: 0\.41 \}\)/);
assert.match(phoneScene, /bubbleTarget\.set\(bubbleRestPosition\.x, bubbleRestPosition\.y, bubbleRestPosition\.z\)/);
assert.match(phoneScene, /double|TouchRings|touchRings/i);
assert.match(phoneScene, /function rotateBy/);
assert.match(phoneScene, /phone-interaction-proxy/);
assert.match(phoneScene, /intersectObject\(interactionProxy, false\)/);
assert.doesNotMatch(phoneScene, /intersectObject\(phone, true\)/);
assert.match(phoneScene, /showcaseScale = THREE\.MathUtils\.clamp\(viewport\.height \/ 980, 0\.68, 0\.82\)/);
assert.match(phoneScene, /smoothstep\(phase, 0\.3, 0\.62\)/);
assert.match(phoneScene, /smoothstep\(phase, 0\.64, 0\.86\)/);
assert.match(phoneScene, /stage\.dataset\.mobileMode = phase < 0\.48 \? "peek" : phase < 0\.7 \? "showcase" : "handoff"/);
assert.match(phoneScene, /targetScale\.setScalar\(0\.74\)/);
assert.match(phoneScene, /targetPosition\.y = 0\.56/);
assert.match(phoneScene, /stage\.dataset\.phoneScale = targetScale\.x\.toFixed\(3\)/);
assert.match(phoneScene, /state === "hero" \? 0\.5 : 0\.6/);
assert.match(phoneScene, /tablet \? 0\.58 : 0\.59/);
assert.match(phoneScene, /Math\.min\(0\.86, viewport\.height \/ 900\)/);
assert.match(phoneScene, /Math\.min\(0\.92, viewport\.height \/ 880\)/);
assert.match(phoneScene, /compact && state !== "hero"[\s\S]*targetRotation\.y \*= 0\.72/);
assert.match(phoneScene, /if \(compact\) \{[\s\S]*phone\.position\.copy\(targetPosition\);[\s\S]*phone\.scale\.copy\(targetScale\)/);
assert.match(phoneScene, /const float = viewport\.width <= 880 \? 0/);
assert.doesNotMatch(phoneScene, /phone\.position\.y \+= float/);
assert.doesNotMatch(phoneScene, /handsetDepth|assembly-(?:battery|board|midframe|display)/);
assert.match(phoneGenerator, /rounded_box\([\s\S]*"PHONE_BODY", \(phone_width, phone_depth, phone_height\)/);
assert.match(phoneGenerator, /continuous-shell/);
assert.match(phoneGenerator, /phone_width = 3\.5[\s\S]*phone_depth = 0\.42[\s\S]*phone_height = 7\.45/);
assert.match(phoneGenerator, /rail_bevel = phone_depth \* 0\.45/);
assert.match(phoneGenerator, /"DISPLAY_GLASS",[\s\S]*front_face_width,[\s\S]*front_face_height/);
assert.doesNotMatch(phoneGenerator, /DISPLAY_RECESS_CUTTER|display_recess/);
assert.match(phoneGenerator, /boolean_recess\(body, usb_cutter\)/);
assert.match(phoneGenerator, /SPEAKER_CUTTER_/);
assert.match(phoneGenerator, /VOLUME_BUTTON", \(0\.045, 0\.16, 0\.64\)[^\n]+plum/);
assert.match(phoneGenerator, /POWER_BUTTON", \(0\.045, 0\.16, 0\.38\)[^\n]+plum/);
assert.match(phoneScene, /PlaneGeometry\(3\.122, 7\.072\)/);
assert.match(phoneScene, /screenMesh\.position\.set\(0, 0, 0\.2158\)/);
assert.doesNotMatch(phoneScene, /screenMesh\.material\.polygonOffset/);
assert.match(screenTexture, /context\.roundRect\(0, 0, canvas\.width, canvas\.height, 34\)/);
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
assert.match(capabilityPolicy, /memory <= 4 \? 1\.75 : 2/);
assert.doesNotMatch(phoneScene, /cursorBeat|screen\.render\(\)/);
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
