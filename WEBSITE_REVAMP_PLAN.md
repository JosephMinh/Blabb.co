# Blabb.co Website Revamp Plan

## Purpose

Rebuild Blabb.co as a cinematic, product-led landing page inspired by the style,
layout, and scroll choreography of Contra's Project Cost Calculator:

<https://contra.com/project-rate-hiring-calculator/>

The website must borrow the reference site's visual grammar—not its content or
branding. Blabb's actual Android app, interaction model, colors, terminology,
privacy guarantees, and current behavior remain the source of truth.

The central artifact will be a bespoke 3D phone with Blabb actively working in a
text field. This artifact is a mandatory release requirement: it must be
implemented as a production-quality WebGL/Three.js scene, remain visually
continuous through the experience, and provide the site's primary cinematic
impact. A flat DOM/CSS phone mockup is not an acceptable substitute. As the
visitor moves through the site, the same phone will demonstrate dictation, local
processing, insertion, continued dictation, exact double-tap undo, bubble
movement, and ten-minute snooze.

## Implementation record — 2026-08-18

The shipped first version keeps the experience, product story, single-canvas
architecture, CSS3D screen, package baseline, responsive behavior, and fallback
requirements in this plan. Two low-level rendering details were deliberately
revised during browser validation:

- The handset, bubble, rings, badges, and exploded system layers are built from
  procedural Three.js geometry instead of downloaded GLB/KTX2/HDR assets. This
  removes model and decoder requests, starts the scene sooner, and keeps the
  artifact fully art-directable without reducing its 3D treatment.
- The normal transparent render pass uses emissive PBR materials instead of an
  `UnrealBloomPass`. Browser inspection showed that the bloom composer replaced
  the transparent canvas with an opaque black surface. The post-processing
  module remains isolated for a future selective-bloom pass that preserves
  alpha correctly.

These amendments supersede the GLB asset contract, HDR light, and mandatory
bloom bullets below. They do not change the visual acceptance criteria or the
requirement for a real, continuous WebGL/Three.js phone.

## Source of truth

`Branding.md` is the authority for the website's colors, font, and logo. Use its
Nunito requirement without adding another typeface, and use its canonical logo
source rather than inventing a replacement.

Before changing product claims or demonstrations, verify them against the
current Android repository at:

`/home/ubuntu/ntm_Dev/Blabb`

Primary references:

- `Branding.md` for the canonical palette, Nunito typeface, and logo source.
- `README.md` for the current product behavior and supported workflow.
- `app/src/main/res/values/strings.xml` for user-facing language.
- `app/src/main/java/com/ntmdev/blabb/bubble/BubbleState.kt` for bubble states.
- `app/src/main/java/com/ntmdev/blabb/bubble/BubbleView.kt` for state visuals.
- `app/src/main/java/com/ntmdev/blabb/ui/theme/Theme.kt` for brand colors and type.
- `docs/privacy/index.md` for privacy and retention claims.

Important product constraint: current Blabb uses accuracy-first, full-context
transcription after recording stops. It does not insert a live transcript while
the user is speaking. Every website demonstration must therefore show:

`ready -> listening -> processing -> inserting -> success`

Do not show words appearing during the listening state in this release. Repeat
the product-truth audit before every future website release.

## Experience goals

1. Explain Blabb in the first viewport: it is private, offline voice typing for
   Android that works beside the user's existing keyboard.
2. Make the floating bubble memorable by using it as the continuous protagonist
   throughout the page.
3. Demonstrate real behavior rather than showing decorative product mockups.
4. Achieve the visual pop of the Contra calculator through scale, contrast,
   typography, controlled motion, and a single transforming device.
5. Preserve Blabb's approachable personality and canonical colors.
6. Stay materially lighter, faster, and more accessible than the reference site.
7. Make the Android download the obvious next action without hiding the testing
   build status or setup requirements.

## Reference-derived implementation decisions

The technical direction below comes from a production inspection of Contra's
Project Cost Calculator on 2026-08-18. Its HTML serves the experience as a
static, semantic document with a hashed ES-module bundle and compiled CSS. The
page contains a primary WebGL canvas, three supporting WebGL canvases, and a
CSS3D overlay. Its JavaScript bundle contains Three.js r125, `WebGLRenderer`,
`GLTFLoader`, `DRACOLoader`, `KTX2Loader`, `MeshoptDecoder`, `RGBELoader`,
`CSS3DObject`, `EffectComposer`, `UnrealBloomPass`, GSAP 3.12.5,
`ScrollTrigger`, `Flip`, `CustomEase`, `SplitText`, Lenis, Howler, and Taxi. A
Playwright network capture showed 32 GLB model requests, 26 KTX2 texture
requests, Draco and Basis WASM decoders, locally hosted WOFF2 fonts, and Segment
analytics.

Use the reference's architecture, not its old dependency versions or its asset
volume. Blabb uses one persistent WebGL canvas, one synchronized CSS3D layer,
two GLB files, KTX2 textures, a small HDR environment map, and one master scroll
timeline. This preserves the reference's 3D continuity while keeping Blabb's
payload and runtime work bounded.

### Locked package baseline

- Node.js 24 for development and deployment builds.
- Vite `8.2.1` for the static build and code splitting.
- Three.js `0.185.1` for WebGL, glTF loading, CSS3D, and post-processing.
- GSAP `3.15.0` with ScrollTrigger, Flip, CustomEase, and SplitText.
- Lenis `1.3.26` for synchronized desktop wheel scrolling.
- Sass `1.102.0` for compiled, component-oriented styles.
- `@gltf-transform/cli` `4.4.2` and `draco3dgltf` `1.5.7` for the production
  model pipeline.
- Playwright `1.62.1` for visual and interaction regression tests.
- Commit `package-lock.json` and pin these exact versions without caret or tilde
  ranges.

### Reference features excluded from Blabb

- Do not use Howler, audio files, or an audio control.
- Do not use Taxi or client-side page-transition routing.
- Do not use Segment or any analytics, advertising, tracking, or session replay.
- Do not use a blocking asset loader. Render the headline, product explanation,
  download action, and an approved fallback poster before the 3D runtime loads.
- Do not reproduce the reference's four-canvas and 58-asset 3D payload. Use the
  single-canvas, two-model architecture defined in this plan.

## Brand and visual direction

### Canonical palette

- Plum: `#170A1C`
- Aqua: `#88E0D9`
- Coral: `#EF8354`
- Lilac: `#EDDFEF`
- Forest: `#32533D`

Supporting surface palette:

- Near-black plum: `#110715`
- Deep surface: `#211226`
- Paper: `#FFFAFF`
- Mist: `#F7F0F8`

### Color roles

- Plum/near-black: immersive page background and phone hardware.
- Aqua: ready state, primary controls, local processing glow, and main CTA.
- Coral: listening amplitude, active motion, and processing emphasis.
- Forest: verified insertion and success state.
- Lilac/paper: editorial copy, light interface panels, and section contrast.

### Typography

- Use the locally hosted Nunito family specified in `Branding.md` for every piece
  of typography: wordmark, headlines, emphasized headline lines, body copy,
  buttons, labels, counters, technical panels, and simulated device UI.
- Create hierarchy through Nunito weight, size, style, color, case, and spacing.
- Use Nunito's tabular numerals, uppercase text, and increased letter spacing for
  step counters and technical labels.
- Do not introduce a display serif, monospace stack, remote font, or any typeface
  other than Nunito.

### Shape and texture

- Reserve circular geometry for the Blabb bubble and state rings.
- Use capsule shapes for navigation, toggles, and primary actions.
- Reduce general card rounding compared with the current site; technical panels
  use 14px radii, 1px borders, and tighter internal spacing.
- Introduce subtle grain, thin construction lines, soft radial glow, and a faint
  interface grid. These elements must never reduce text contrast.

## Page architecture

### 1. Floating header

Use a compact Contra-style capsule header that remains visible over the
experience.

Content:

- Blabb mark.
- `Voice typing for Android` descriptor.
- `How it works`, `Privacy`, and `Questions` navigation.
- Primary `Download Blabb` action.

Behavior:

- Use a translucent near-black plum capsule with a 1px lilac border and backdrop
  blur over the hero.
- Switches to a light treatment over pale sections.
- At viewport widths below 720px, collapses to a logo, download button, and menu
  button.
- No audio toggle or social-share controls.

### 2. Cinematic hero

Primary headline:

> Speak.  
> *It types.*

Supporting copy:

> A private voice bubble that works beside the keyboard you already use. Tap,
> talk, and your words appear—without sending your voice to the cloud.

Actions:

- Primary: `Download for Android`
- Secondary: `See it work`
- Qualification: `Testing build · Android 13+ · No account`

Central visual:

- A large Android phone presented as an exploded stack.
- Layers include the phone shell, active app, text field, keyboard, local speech
  model, and floating Blabb bubble.
- The layers begin separated, echoing Contra's hero artifact, then assemble into
  a usable phone as the visitor starts scrolling.
- Aqua light must originate from the bubble and the local-model layer.
- The phone must be a bespoke WebGL/Three.js artifact with real 3D depth,
  lighting, materials, camera movement, and separable hardware/interface layers.
- Semantic DOM/SVG must support readable UI content, interaction, accessibility,
  and fallbacks, but must not replace the required 3D artifact in capable
  browsers.

### 3. Sticky phone story

The assembled phone becomes sticky for a sequence of full-viewport chapters.
The phone remains the same object while its UI and the bubble state change.

A desktop step counter displays `STEP 01 — 06`. Mobile uses a six-segment
progress bar paired with these exact labels: `01 · FOCUS`, `02 · DICTATE`,
`03 · PROCESS LOCALLY`, `04 · INSERT`, `05 · CONTINUE / UNDO`, and
`06 · MOVE / SNOOZE`.

#### Step 01 — Focus

Headline: `Wherever you type.`

- Show a generic messaging interface with the Android keyboard visible.
- Focus the composer and display its cursor.
- Animate the ready bubble into position beside the keyboard.
- Explain that the bubble appears only while a safe, compatible text field and
  keyboard surface are active.

#### Step 02 — Dictate

Headline: `Tap. Talk.`

- Tap the ready bubble.
- Transition to the real listening treatment: coral amplitude ring and stop
  badge around the aqua bubble.
- Animate amplitude in response to an illustrative voice waveform.
- Demonstrate push-to-talk with a brief press-and-hold affordance.
- Do not insert or preview words during this step.

#### Step 03 — Process locally

Headline: `Processed right here.`

- Stop the recording.
- Transition the bubble to its coral processing spinner/dots state.
- Slightly separate the phone layers to expose a `LOCAL VOICE ENGINE` layer.
- Animate the captured waveform flowing downward into that layer and no farther.
- Then transition from processing to inserting.

#### Step 04 — Insert

Headline: `Your words, at the cursor.`

- Insert a final, punctuated sentence into the composer.
- Preserve the existing text and cursor context in the visual.
- Transition the bubble to the forest-green verified success ring/check.
- Clearly distinguish final insertion from the previous listening state.

#### Step 05 — Continue or undo

Headline: `Keep going—or take it back.`

- First demonstrate a single tap on the green check starting another dictation.
- Return to success after inserting a short second phrase.
- Then demonstrate a physical double-tap removing only the latest Blabb
  insertion.
- Keep the earlier text untouched so exact undo is visually obvious.
- Avoid generic labels such as `undo all`; the behavior is transaction-specific.

#### Step 06 — Move or snooze

Headline: `There when you want it.`

- Drag the idle bubble to the opposite side and show it docking neatly.
- Drag it downward to reveal the bottom-center `SNOOZE · 10 MIN` target.
- Drop the bubble into the target and dismiss it from the phone.
- Show the foreground notification with its `End snooze` action.
- Briefly demonstrate the bubble returning automatically.

### 4. Bubble / Voice Input mode switch

Reuse the conceptual role of Contra's Calculator/Spreadsheet switch with a
product-accurate toggle:

- `Bubble`
- `Voice Input`

Bubble mode shows Blabb beside the existing keyboard. Voice Input mode transforms
the device into the user-enabled Blabb Voice Input compatibility route used for
custom editors that do not expose a safe bubble target.

Copy must not imply universal bubble compatibility. Explain that the Voice Input
compatibility route is enabled by the user, improves compatibility, and leaves
the user's ordinary keyboard available.

### 5. Privacy results panel

Translate Contra's calculator results into a high-impact privacy summary.

Heading:

> Your privacy results are in.

Primary result:

> Dictated audio sent to Blabb  
> **0 bytes**

Use narrow, accurate wording because initial model downloads still use HTTPS.

Supporting table:

| Signal | Destination |
|---|---|
| Dictated audio | This phone |
| Speech recognition | This phone |
| Active-field context | This phone |
| Transcript history | Not kept |
| Account | Not required |
| Dictation after setup | Works offline |

Include a direct link to the privacy policy and a short disclosure that model
files are downloaded during setup.

### 6. Bubble controls laboratory

Create a large aqua stage with a lilac technical panel and an oversized
interactive Blabb bubble. Visitors use six persistent buttons by click, tap, or
keyboard activation to select and preview the real visual states:

- Ready
- Listening
- Processing
- Success
- Compatibility
- Recovery/attention

Accompany it with the core gestures:

- Tap to start and stop.
- Hold for push-to-talk.
- Tap the green check to dictate again.
- Double-tap the green check to remove the latest insertion.
- Drag sideways to move and dock.
- Drag down to snooze for ten minutes.

The state artwork must be recreated from the app's real palette, rings, and
badges rather than invented independently.

### 7. Dictation tools panel

Use a compact operating-system-style panel rather than a grid of generic feature
cards.

Demonstrate:

- Spoken punctuation: `period`, `comma`, `question mark`, and `new line`.
- The `literal` escape for typing command words.
- A filler-removal toggle demonstrating removal of standalone `um`, `uh`, and
  `erm`.
- Vibration feedback.
- One-tap paste fallback.
- Hardware-appropriate local model selection.

Interactive transcript example:

- Show a raw spoken phrase.
- Toggle punctuation and filler removal.
- Animate the deterministic final result.
- Clearly label this as text-processing demonstration, not browser-based speech
  recognition.

### 8. Use-case carousel

Use the visual position occupied by Contra's testimonial carousel for a set of
generic typing contexts until genuine Blabb testimonials exist:

- Messages
- Notes
- Email
- Search
- Forms

The phone rotates six degrees while its screen surface slides horizontally
between contexts; the Blabb bubble remains anchored in place. Do not use
third-party app logos or imply endorsement. Always use
`compatible text fields` rather than `every app`.

### 9. Editorial privacy section

Headline:

> Your thoughts are  
> *not our business.*

Primary promises:

- No cloud speech recognition.
- No dictation history.
- No advertising, analytics, or tracking SDKs.
- No account.

Add a quieter `BUILT TO FAIL SAFELY` subsection covering:

- Password and PIN fields are excluded.
- Insertion is verified and never blindly retried.
- At most one recovery transcript is stored with Android Keystore encryption.
- Recovery content expires after ten minutes.
- Compatibility learning stores bounded pseudonymous evidence, not raw text or
  app history.

Keep this understandable; link to the full privacy policy for implementation
detail.

### 10. Setup realities and FAQ

Answer the practical questions that determine whether someone will install:

- Does Blabb need the internet?
- Which Android versions are supported?
- Why does it need AccessibilityService access?
- Why does it need display-over-other-apps permission?
- What happens in password fields?
- How large is the first model download?
- Does the bubble work in every text field?
- What is Blabb Voice Input?
- What should Samsung users change for reliability?
- Is this currently a testing build?

All model sizes and compatibility claims must be read from the current app
repository at implementation time, not copied permanently from this plan.

### 11. Final cinematic CTA

Return to the exploded phone composition. The phone layers separate while the
Blabb bubble moves toward the foreground.

Headline:

> Give your thumbs  
> *a break.*

CTA:

- `Download Blabb for Android`
- Include the current version, Android requirement, testing-build status, and
  link to the current GitHub release page.

## Motion design

### Principles

- Motion explains state or spatial relationships; it is not ornamental noise.
- The phone and bubble provide continuity from hero to final CTA.
- Use long, confident transitions and limited simultaneous movement.
- Keep copy readable while the device animates.
- Do not require a loader before useful content appears.

### State choreography

- Ready: calm aqua bubble, no continuous movement.
- Listening: coral amplitude ring tied to a designed waveform.
- Processing: the app-accurate rotating 245-degree coral arc with the plum
  three-dot badge.
- Inserting: brief directional movement from model layer to cursor.
- Success: forest ring and check, followed by stillness.
- Undo: latest insertion highlights and retracts without disturbing prior text.
- Snooze: bubble follows the pointer/finger into the target and cleanly exits.

### Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Do not pin long scroll sequences.
- Present the six phone states as stacked static chapters.
- Replace amplitude, spinners, parallax, and 3D rotations with discrete state
  changes.
- Keep all content and controls available.

## Responsive behavior

### Desktop

- Position the sticky phone's center at 58% of the viewport width.
- Large titles anchored to the lower-left.
- Supporting copy and state details on the right.
- Full exploded-device transitions and subtle pointer parallax.

### Tablet

- Center the phone with copy moving above and below it.
- Reduce the exploded depth and limit the number of simultaneous layers.
- Retain step navigation and the mode switch.

### Mobile

- Prioritize the phone and current state over decorative depth.
- Keep one WebGL phone sticky through six 65vh chapters, then release it
  immediately after Step 06. Use stacked static chapter cards only for the
  reduced-motion and WebGL-unavailable fallbacks.
- Keep the download CTA reachable without completing the demonstration.
- Never allow the simulated keyboard or bubble to render below browser controls.
- Disable cursor parallax and other pointer-only interactions.

## Technical approach

### Document and build architecture

- Serve each page as complete semantic HTML. The headline, product explanation,
  download action, privacy facts, FAQ, and legal content exist in the document
  before JavaScript runs.
- Use vanilla ES modules. Do not use React, Vue, Svelte, Web Components, or a
  client-side router.
- Compile modular SCSS through Vite. Do not use Tailwind, Bootstrap, or another
  CSS framework.
- Load the Three.js runtime through a dynamic import immediately after the first
  content paint. Reserve the canvas dimensions in CSS and display the approved
  poster until the first successful WebGL frame replaces it without layout
  shift.
- Build `dist/` with `npm ci && npm run build`. Deploy only `dist/` through a
  GitHub Actions Pages workflow running Node.js 24.

### Rendering architecture

- Use one fixed, persistent `<canvas id="artifact-webgl" aria-hidden="true">`
  from the hero through the final CTA. Do not create a new phone per section.
- Use one Three.js `Scene`, `PerspectiveCamera`, `WebGLRenderer`, and synchronized
  `CSS3DRenderer`. Both renderers share the same camera and viewport dimensions.
- Construct `WebGLRenderer` with `alpha: true`, `antialias: true`, and
  `powerPreference: "high-performance"`. Cap device pixel ratio at `1.5` on
  desktop and `1.25` on tablet and mobile.
- Set `SRGBColorSpace`, ACES filmic tone mapping, and physically based materials.
  Use one key light, one rim light, and the HDR environment map; do not add
  decorative lights that lack a defined role.
- Use `EffectComposer`, `RenderPass`, and `UnrealBloomPass`. Restrict bloom to the
  aqua bubble and local-engine emissive layers with Three.js layers; all other
  geometry renders without bloom.
- Use `CSS3DRenderer` for the active app, composer, inserted text, cursor,
  keyboard, technical labels, and notification. These DOM surfaces track named
  anchors in the 3D model and remain crisp at every viewport size.
- Keep the WebGL canvas out of the accessibility tree. Keep the readable story
  and interactive controls in ordinary semantic DOM; never create duplicate
  focus targets inside the CSS3D layer.
- Size both renderers with `ResizeObserver`. Stop rendering when the artifact is
  outside its story range or `document.visibilityState` is `hidden`, and resume
  on the next GSAP update.

### 3D asset contract

- Create the artifact in Blender 4.5 LTS and export glTF 2.0.
- Deliver exactly two runtime models: `blabb-phone.glb` and `blabb-bubble.glb`.
- `blabb-phone.glb` contains named nodes for `shell`, `glass`, `screen-anchor`,
  `keyboard-anchor`, `composer-anchor`, `local-engine`, `notification-anchor`,
  and the separable exploded layers.
- `blabb-bubble.glb` contains named nodes for the bubble body, plum mark, coral
  ring, forest ring, stop badge, three-dot badge, check badge, keyboard badge,
  and attention badge.
- Keep the combined visible scene below 100,000 triangles. Keep
  `blabb-phone.glb` below 900 KiB and `blabb-bubble.glb` below 150 KiB after
  compression.
- Compress mesh geometry with Draco through `@gltf-transform/cli`. Encode PBR,
  normal, emissive, and baked-light textures as KTX2/Basis at a maximum of
  1024×1024. Keep all KTX2 textures together below 1.2 MiB.
- Use one 512×256 HDR environment map below 200 KiB. Do not ship raw PNG or
  JPEG material maps in the production build.
- Load the two models with `GLTFLoader` and `DRACOLoader`, textures with
  `KTX2Loader`, and the environment with `RGBELoader` plus `PMREMGenerator`.

### Scroll and animation architecture

- Drive the entire phone story from one GSAP timeline with ScrollTrigger labels
  `focus`, `dictate`, `process`, `insert`, `undo`, and `snooze` in that order.
- Derive every phone, bubble, copy, and camera state from scroll progress. Do not
  use `setTimeout`, independent autoplay loops, or state transitions that can
  drift away from the visible chapter.
- Register GSAP ScrollTrigger, Flip, CustomEase, and SplitText once in
  `main.js`. Use Flip for the Bubble/Voice Input switch and use SplitText only
  for the hero and final CTA while preserving their original accessible labels.
- Run Lenis only when `(min-width: 1024px)`, `(pointer: fine)`, and
  `prefers-reduced-motion: no-preference` all match. Set `duration: 1.1`, connect
  Lenis scroll events to `ScrollTrigger.update`, and advance Lenis from the GSAP
  ticker. Touch, keyboard, and reduced-motion contexts use native scrolling.
- Use one GSAP ticker for Lenis, scroll choreography, and WebGL rendering. Do not
  create a second `requestAnimationFrame` loop.
- Never lock the scrollbar, replace the browser scrollbar, trap wheel input, or
  prevent native keyboard scrolling.

### Fallback architecture

- Render approved AVIF and WebP posters from the same Blender camera, materials,
  lighting, and pose as the WebGL hero.
- Use the poster plus six semantic static chapter cards for reduced motion,
  WebGL initialization failure, context loss, and devices reporting 4 GiB or
  less through `navigator.deviceMemory`.
- Replace the poster only after the models, compressed textures, CSS3D surfaces,
  first frame, and first resize have all completed successfully.
- Recover one WebGL context loss by rebuilding the renderer from cached assets.
  After a second loss, retain the poster and static chapters for the session.
- Show no loader, percentage counter, spinner, blank canvas, or hidden first
  viewport while the artifact initializes.

### Required source organization

```text
index.html
404.html
privacy/index.html
terms/index.html
package.json
package-lock.json
vite.config.js
.github/workflows/pages.yml
src/
  main.js
  styles/
    main.scss
    _tokens.scss
    _base.scss
    _components.scss
    _sections.scss
    _motion.scss
  scripts/
    header.js
    phone-story.js
    bubble-demo.js
    transcript-demo.js
    use-cases.js
  scene/
    renderer.js
    asset-loader.js
    phone-scene.js
    css3d-screen.js
    materials.js
    postprocessing.js
    phone-timeline.js
    capability-policy.js
  assets/
    brand/
    fonts/
public/
  assets/
    models/
      blabb-phone.glb
      blabb-bubble.glb
    textures/
    environment/
    fallback/
  draco/
tests/
  e2e/
    artifact.spec.js
    phone-story.spec.js
    reduced-motion.spec.js
    no-webgl.spec.js
```

Use this structure. Additions require a documented plan amendment. Product
states, rendering, and motion timelines must remain in their named modules and
must not be combined into one unstructured script.

## Asset plan

Deliver:

1. Clean Blabb mark and wordmark assets from the canonical app artwork.
2. SVG/CSS representations of the ready, listening, processing, success,
   compatibility, and attention bubble states.
3. A bespoke, optimized 3D Android phone and Blabb bubble artifact with separate
   screen, hardware, keyboard, local-engine, and lighting layers for WebGL.
4. Generic message, notes, email, search, and form interfaces.
5. A keyboard component that does not copy a proprietary keyboard skin.
6. Local-engine chip/layer artwork for the exploded view.
7. A procedural grain texture, aqua bubble light, and aqua local-engine light.
8. A real screen recording from a supported Android device for behavior
   reference and later QA; do not rely on it as the only website demonstration.

## Content rules

- Use `on-device`, `local`, and `offline after setup`; do not use vague privacy
  terms in their place.
- Say `compatible text fields`, not `every app` or `works everywhere`.
- Say `works beside your existing keyboard`; do not describe Blabb primarily as
  a keyboard replacement.
- Distinguish the user-enabled Blabb Voice Input compatibility route from the
  bubble.
- Never show or imply text appearing while the user is still speaking in this
  release.
- Never invent testimonials, download counts, accuracy percentages, or supported
  app lists.
- Keep recovery claims precise: at most one item, encrypted where applicable,
  short-lived, and resumed only by user action.
- Recheck current version, model size, Android support, and download URL before
  release.

## Accessibility and privacy requirements

- All animated information must also exist as readable HTML.
- Preserve a working skip link and logical heading structure.
- Every interactive demo must work by keyboard and expose state with ARIA.
- Do not autoplay sound or require audio to understand the demonstration.
- Respect reduced-motion preferences.
- Maintain strong contrast across glow and gradient backgrounds.
- Do not add analytics, advertising, session replay, remote fonts, or tracking
  SDKs in this release.

## Performance targets

- No blocking splash screen or asset loader.
- Keep the initial semantic HTML, critical CSS, and entry JavaScript below
  180 KiB transferred with Brotli compression.
- Keep all Nunito WOFF2 subsets together below 80 KiB transferred.
- Keep the dynamically imported Three.js, GSAP, Lenis, and scene runtime below
  450 KiB transferred with Brotli compression.
- Keep the two GLB models, KTX2 textures, HDR map, and fallback posters together
  below 2.5 MiB transferred.
- Keep the complete first-visit page transfer below 3.3 MiB, excluding the APK.
- Render the headline, explanation, download action, and fallback poster before
  the WebGL runtime request begins.
- Lazy-load the use-case carousel artwork and supporting demo code when their
  sections enter a 600px root margin.
- Use vector and CSS state art; do not use image sequences.
- Provide complete essential content, navigation, privacy facts, and download
  access when JavaScript fails.
- Stop the renderer, bloom pass, Lenis ticker work, and decorative animation when
  their sections are off-screen.
- On Lighthouse mobile with a 412×915 viewport and simulated Fast 4G, achieve
  LCP at or below 2.5 seconds, CLS at or below 0.05, and TBT below 200ms.
- Sustain at least 55 frames per second on a 2021 M1 MacBook Air at 1440×900 and
  at least 30 frames per second on a Pixel 6 at 412×915 during the pinned story.

## Implementation phases

### Phase 1 — Product storyboard and wireframe

- Lock the storyboard to the six states and lifecycle defined in this plan.
- Use this exact spoken phrase for the transcript demonstration: `hey um send
  the draft comma then call me question mark new line literal comma means the
  word`.
- Use this exact processed result: `Hey, send the draft, then call me?` followed
  by a new line and `Comma means the word.`
- Produce desktop and mobile wireframes.
- Apply the Nunito-only hierarchy and the exact `Speak. It types.` headline.
- Record the current version, Android requirement, testing-build status, APK
  URL, model size, and GitHub release URL from the product source of truth.

### Phase 2 — Visual foundation

- Introduce the expanded tokens and editorial type hierarchy.
- Build the floating header, buttons, technical labels, and panel primitives.
- Establish dark, light, and gradient section treatments.
- Implement responsive spacing and accessibility foundations.

### Phase 3 — Phone artifact

- Build the mandatory Three.js/WebGL phone artifact, including the hardware,
  keyboard, field, local-engine layer, bubble states, materials, lighting, and
  camera choreography.
- Verify bubble artwork against the Android implementation.
- Implement phone assembly/explosion and static reduced-motion layouts.
- Do not proceed to release with a flat DOM/CSS mockup standing in for the 3D
  artifact.

### Phase 4 — Scroll story

- Implement Focus, Dictate, Process, Insert, Continue/Undo, and Snooze.
- Add the step counter, scroll prompts, and phone continuity.
- Test forward and reverse scrolling at different speeds.
- Ensure animation state cannot contradict visible copy.

### Phase 5 — Supporting experiences

- Build the Bubble/Voice Input mode switch.
- Build the privacy results panel.
- Build the bubble controls laboratory and transcript tools demo.
- Add the use-case carousel, privacy section, FAQ, and final CTA.

### Phase 6 — Product-truth audit

- Compare every claim with the current Android repository.
- Remove stale references to live preview or retired models.
- Validate permissions, recovery, secure-field, and compatibility language.
- Validate the current APK URL and version.

### Phase 7 — Quality and release

- Test current Chrome, Firefox, and WebKit with Playwright at 1440×1000,
  1024×1366, 390×844, and 320×568.
- Capture the hero, all six ScrollTrigger labels, Bubble/Voice Input switch,
  privacy result, bubble laboratory, use-case carousel, and final CTA at desktop
  and mobile widths.
- Fail the visual suite when the WebGL canvas is absent, remains transparent,
  renders the fallback in a capable browser, loses phone continuity, or shows a
  lifecycle state that contradicts the active chapter.
- Test keyboard navigation, screen-reader labeling, and reduced motion.
- Test the 4 GiB device-memory fallback, WebGL context loss, JavaScript failure,
  and simulated Fast 4G loading.
- Run existing site checks and expand them for new critical content.
- Verify privacy and terms links, metadata, social card, sitemap, and 404 page.
- Present the Playwright desktop and mobile capture sets for visual approval.
  Do not deploy before that approval.
- Deploy to GitHub Pages and perform a production smoke test.

## Acceptance criteria

The revamp is complete when:

- A first-time visitor can explain what Blabb does after the first viewport.
- The primary phone demonstration accurately shows all current lifecycle stages.
- Dictation, local processing, insertion, continued dictation, exact double-tap
  undo, repositioning, and ten-minute snooze are demonstrated.
- The Bubble/Voice Input distinction is understandable.
- Privacy claims are accurate and model-download network use is not obscured.
- The site visually echoes Contra's scale, rhythm, technical UI, and cinematic
  device treatment while remaining unmistakably Blabb.
- The bespoke WebGL/Three.js phone artifact is present in the default supported
  experience, remains continuous through the primary story, and has been
  visually approved at desktop and mobile sizes; a flat DOM/CSS substitute does
  not satisfy this criterion.
- The shipped package versions, renderer architecture, two-model asset contract,
  CSS3D screen layer, GSAP timeline, Lenis policy, and performance budgets match
  this plan exactly.
- The primary CTA points to the current Android release.
- Mobile visitors receive a complete, performant experience.
- Reduced-motion and no-JavaScript visitors can access all essential content.
- No fabricated metrics, app compatibility claims, or testimonials appear.
- The page ships without a blocking loader, scroll hijacking, or tracking SDKs.

## Future enhancements

These are intentionally outside the first implementation:

- Additional 3D device variants or cinematic camera sequences beyond the
  required phone and bubble artifact.
- User-controlled audio in the demonstration.
- Genuine testimonial carousel after real quotes are collected and approved.
- Download analytics; tracking is prohibited for this release.
- Interactive browser microphone transcription; it uses a non-Blabb engine and
  misrepresents the product story.
