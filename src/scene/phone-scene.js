import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createMaterials, palette } from "./materials.js";
import { createScreenTexture } from "./screen-texture.js";

const chapters = [
  ["00", "INTERACTIVE MODEL", "hero"],
  ["01", "READY", "focus"],
  ["02", "LISTENING", "dictate"],
  ["03", "PROCESSING LOCALLY", "process"],
  ["04", "INSERT + VERIFY", "insert"],
  ["05", "CONTINUE + EXACT UNDO", "continue"],
  ["06", "MOVE + SNOOZE", "snooze"]
];

// These groups keep exterior finishes maintainable while the handset remains
// one continuous, fully assembled object.
const layerNames = ["back", "frame", "glass"];

const chapterRotations = {
  hero: [-0.14, -0.48, 0.08],
  focus: [-0.04, -0.15, 0.015],
  dictate: [-0.07, 0.17, -0.025],
  process: [-0.12, -0.3, 0.048],
  insert: [0.025, 0.1, -0.018],
  continue: [-0.035, -0.18, 0.015],
  snooze: [-0.06, 0.24, -0.04]
};

const mix = (from, to, progress) => from + (to - from) * progress;

// Mirrors the app gesture: reveal the target as dragging begins, dock left,
// travel into the target's centered capture halo, hold there, then snooze.
export function snoozeStoryFrame(progress) {
  const phase = Math.min(1, Math.max(0, progress));
  const frame = {
    bubbleX: 1.5,
    bubbleY: -1.18,
    bubbleVisible: true,
    targetVisible: true,
    captured: phase >= 0.48 && phase < 0.74,
    snoozed: phase >= 0.74 && phase < 0.9
  };

  if (phase < 0.18) {
    frame.bubbleX = mix(1.5, -1.5, phase / 0.18);
  } else if (phase < 0.62) {
    const travel = (phase - 0.18) / 0.44;
    frame.bubbleX = mix(-1.5, 0, travel);
    frame.bubbleY = mix(-1.18, -2.99, travel);
  } else if (phase < 0.74) {
    frame.bubbleX = 0;
    frame.bubbleY = -2.99;
  } else if (phase < 0.9) {
    frame.bubbleX = 0;
    frame.bubbleY = -2.99;
    frame.bubbleVisible = false;
    frame.targetVisible = false;
  } else {
    const returning = (phase - 0.9) / 0.1;
    frame.bubbleX = mix(0, 1.5, returning);
    frame.bubbleY = mix(-2.99, -1.18, returning);
    frame.targetVisible = false;
  }

  return frame;
}

// Normalized directly from BubbleView.kt. Keeping these ratios together makes
// every status state share the Android overlay's exact 48dp construction.
const bubbleMetrics = Object.freeze({
  radius: 0.32,
  rimCenter: 0.3032,
  rimTube: 0.0168,
  listeningRingCenter: 0.2664,
  stateRingCenter: 0.2688,
  stateRingTube: 0.016,
  badgeRadius: 0.1152,
  badgeOffset: 0.1984
});

function layerForName(name) {
  if (/^(BACK_|CAMERA_)/.test(name)) return "back";
  if (/^(DISPLAY_GLASS|SELFIE_|EARPIECE)/.test(name)) return "glass";
  return "frame";
}

function roundedPanel(width, height, depth, material, radius = 0.12) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 5, radius), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// BubbleView applies a PorterDuff SRC_IN plum tint to this master bitmap.
// Reproduce that operation for the 3D plane while preserving the untouched
// launcher mark for BrandMark tiles on the phone screen.
function createBubbleLogoTexture(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = "#170a1c";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "source-over";
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createBubble(materials, logoTexture) {
  const group = new THREE.Group();
  group.name = "blabb-bubble-hardware";
  const profile = new THREE.Group();
  profile.name = "thin-bubble-profile";
  profile.scale.set(1, 1, 0.24);
  group.add(profile);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  );
  shadow.position.set(0.055, -0.055, -0.1);
  profile.add(shadow);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(bubbleMetrics.radius, bubbleMetrics.radius, 0.16, 64, 2),
    materials.aqua
  );
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  profile.add(body);

  const plumRim = new THREE.Mesh(
    new THREE.TorusGeometry(bubbleMetrics.rimCenter, bubbleMetrics.rimTube, 18, 80),
    materials.plum
  );
  plumRim.position.z = 0.091;
  profile.add(plumRim);
  const listeningRingMaterial = materials.coral.clone();
  listeningRingMaterial.transparent = true;
  listeningRingMaterial.opacity = 0.86;
  const successRingMaterial = materials.forest.clone();
  successRingMaterial.transparent = true;
  successRingMaterial.opacity = 230 / 255;
  const stateRing = new THREE.Mesh(
    new THREE.TorusGeometry(bubbleMetrics.listeningRingCenter, bubbleMetrics.stateRingTube, 16, 80),
    listeningRingMaterial
  );
  stateRing.position.z = 0.094;
  profile.add(stateRing);

  const processingArc = new THREE.Mesh(
    new THREE.TorusGeometry(
      bubbleMetrics.stateRingCenter,
      bubbleMetrics.stateRingTube,
      16,
      80,
      THREE.MathUtils.degToRad(245)
    ),
    materials.coral
  );
  processingArc.position.z = 0.096;
  processingArc.visible = false;
  profile.add(processingArc);

  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.64), new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    toneMapped: false
  }));
  logo.position.z = 0.086;
  profile.add(logo);

  const badge = new THREE.Group();
  badge.position.set(bubbleMetrics.badgeOffset, -bubbleMetrics.badgeOffset, 0.09);
  const badgeDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(bubbleMetrics.badgeRadius, bubbleMetrics.badgeRadius, 0.06, 40),
    materials.coral
  );
  badgeDisc.rotation.x = Math.PI / 2;
  badge.add(badgeDisc);
  const stopSize = bubbleMetrics.badgeRadius * 0.74;
  const stop = new THREE.Mesh(new THREE.PlaneGeometry(stopSize, stopSize), materials.white);
  stop.position.z = 0.04;
  badge.add(stop);
  const checkPoints = [
    new THREE.Vector3(-bubbleMetrics.badgeRadius * 0.5, 0, 0.045),
    new THREE.Vector3(-bubbleMetrics.badgeRadius * 0.12, -bubbleMetrics.badgeRadius * 0.34, 0.045),
    new THREE.Vector3(bubbleMetrics.badgeRadius * 0.52, bubbleMetrics.badgeRadius * 0.4, 0.045)
  ];
  const checkCurve = new THREE.CurvePath();
  checkCurve.add(new THREE.LineCurve3(checkPoints[0], checkPoints[1]));
  checkCurve.add(new THREE.LineCurve3(checkPoints[1], checkPoints[2]));
  const check = new THREE.Mesh(
    new THREE.TubeGeometry(checkCurve, 16, bubbleMetrics.badgeRadius * 0.11, 10, false),
    materials.white
  );
  check.visible = false;
  badge.add(check);
  const dots = new THREE.Group();
  const dotRadius = bubbleMetrics.badgeRadius * 0.13;
  [-1, 0, 1].forEach((index) => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(dotRadius, 18), materials.white);
    const x = index * dotRadius * 2.5;
    dot.position.set(x, 0, 0.045);
    dots.add(dot);
  });
  dots.visible = false;
  badge.add(dots);
  profile.add(badge);

  return {
    group,
    body,
    stateRing,
    listeningRingMaterial,
    successRingMaterial,
    processingArc,
    badge,
    badgeDisc,
    stop,
    check,
    dots
  };
}

function createTouchRings() {
  const group = new THREE.Group();
  [0, 1].forEach((index) => {
    const material = new THREE.MeshBasicMaterial({
      color: index ? palette.coral : palette.aqua,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.14, 48), material);
    ring.position.set(0.82, -0.7, 0.345 + index * 0.002);
    ring.userData.index = index;
    group.add(ring);
  });
  return group;
}

function createSnoozeLabelTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 228;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 41px Nunito, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("SNOOZE", 256, 89);
  context.fillText("10 MIN", 256, 139);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSnoozeTarget(materials) {
  const target = new THREE.Group();
  target.name = "snooze-dock";
  // 176dp × 78dp on the app's 360dp-wide handset, 22dp above the bottom.
  // The physical model has a slightly narrower display aspect, so preserve
  // the target's own 176:78 silhouette rather than stretching it with it.
  target.position.set(0, -2.99, 0.34);
  const border = roundedPanel(1.526, 0.676, 0.06, materials.aqua, 0.243);
  const body = roundedPanel(1.491, 0.641, 0.075, materials.snooze, 0.226);
  body.position.z = 0.015;
  target.add(border, body);
  const restingLabel = createSnoozeLabelTexture("#eddfef");
  const capturedLabel = createSnoozeLabelTexture("#170a1c");
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.43, 0.61),
    new THREE.MeshBasicMaterial({
      map: restingLabel,
      transparent: true,
      toneMapped: false
    })
  );
  label.position.z = 0.065;
  target.add(label);
  target.visible = false;
  target.userData = { border, body, label, restingLabel, capturedLabel, captured: false };
  return target;
}

function setSnoozeTargetCaptured(target, captured, materials) {
  if (target.userData.captured === captured) return;
  target.userData.captured = captured;
  target.userData.border.material = captured ? materials.plum : materials.aqua;
  target.userData.body.material = captured ? materials.aqua : materials.snooze;
  target.userData.label.material.map = captured
    ? target.userData.capturedLabel
    : target.userData.restingLabel;
  target.userData.label.material.needsUpdate = true;
  target.scale.setScalar(captured ? 1.06 : 1);
}

function prepareModel(model, phone) {
  const layerGroups = {};
  layerNames.forEach((name) => {
    const group = new THREE.Group();
    group.name = `assembly-${name}`;
    group.userData.targetPosition = new THREE.Vector3();
    group.userData.targetRotation = new THREE.Euler();
    layerGroups[name] = group;
    phone.add(group);
  });

  phone.add(model);
  const parts = [];
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    parts.push(object);
  });
  parts.forEach((part) => layerGroups[layerForName(part.name)].attach(part));
  phone.remove(model);
  return layerGroups;
}

function applyBrandMaterials(model) {
  const tuned = new Set();
  model.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const modelMaterials = Array.isArray(object.material) ? object.material : [object.material];
    modelMaterials.forEach((material) => {
      if (tuned.has(material)) return;
      tuned.add(material);
      const name = material.name.toUpperCase();
      if (name.startsWith("BLABB_PLUM")) {
        material.color.copy(palette.plum);
        material.metalness = name.includes("MATTE") ? 0.14 : 0.58;
        material.roughness = name.includes("MATTE") ? 0.46 : 0.22;
      } else if (name.startsWith("BLABB_AQUA")) {
        material.color.copy(palette.aqua);
        material.emissive?.copy(palette.aqua);
        material.emissiveIntensity = 0.34;
      } else if (name.startsWith("BLABB_CORAL")) {
        material.color.copy(palette.coral);
        material.emissive?.copy(palette.coral);
        material.emissiveIntensity = 0.22;
      } else if (name.startsWith("POLISHED_STEEL")) {
        material.color.copy(palette.plum);
        material.metalness = 0.9;
        material.roughness = 0.17;
      } else if (name.startsWith("SOFT_SILVER") || name.startsWith("PAPER")) {
        material.color.copy(palette.lilac);
      } else if (name.startsWith("BOARD")) {
        material.color.copy(palette.forest);
      }
      material.needsUpdate = true;
    });
  });
}

export async function createPhoneScene(webglScene, camera) {
  const materials = createMaterials();
  const loader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();
  const [gltf, logoTexture] = await Promise.all([
    loader.loadAsync(new URL("../../assets/phone/blabb-phone.glb", import.meta.url).href),
    textureLoader.loadAsync(new URL("../../assets/blabb-mark.png", import.meta.url).href)
  ]);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.anisotropy = 8;
  logoTexture.minFilter = THREE.LinearMipmapLinearFilter;
  logoTexture.magFilter = THREE.LinearFilter;
  const phone = new THREE.Group();
  phone.name = "blabb-android-phone";
  webglScene.add(phone);
  const interactionProxy = new THREE.Mesh(
    new THREE.BoxGeometry(3.95, 7.75, 0.9),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  interactionProxy.name = "phone-interaction-proxy";
  phone.add(interactionProxy);
  applyBrandMaterials(gltf.scene);
  const layers = prepareModel(gltf.scene, phone);

  const screen = createScreenTexture(logoTexture.image);
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.122, 7.072),
    new THREE.MeshBasicMaterial({
      map: screen.texture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: true,
      toneMapped: false
    })
  );
  screenMesh.name = "live-blabb-screen";
  // The display texture is laminated against the glass. A sub-millimetre
  // separation prevents z-fighting without producing a floating edge at
  // glancing angles; normal depth writes keep the bezel in front of it.
  screenMesh.position.set(0, 0, 0.2158);
  layers.glass.add(screenMesh);

  const bubble = createBubble(materials, createBubbleLogoTexture(logoTexture.image));
  bubble.group.position.set(1.5, -1.18, 0.41);
  bubble.group.scale.setScalar(1.34);
  layers.glass.add(bubble.group);
  const bubbleTarget = bubble.group.position.clone();

  const snoozeTarget = createSnoozeTarget(materials);
  phone.add(snoozeTarget);
  const touchRings = createTouchRings();
  phone.add(touchRings);

  const stepReadout = document.querySelector("#active-step");
  const liveRegion = document.querySelector("#phone-live");
  const stage = document.querySelector("#artifact-stage");

  let viewport = { width: innerWidth, height: innerHeight };
  let progress = 0;
  let currentIndex = -1;
  let state = "hero";
  let phase = 0;
  let visible = true;
  let userYaw = 0;
  let userPitch = 0;
  let yawVelocity = 0;
  let pitchVelocity = 0;
  let dragging = false;
  let lastScreenKey = "";
  const targetPosition = new THREE.Vector3();
  const targetRotation = new THREE.Euler();
  const targetScale = new THREE.Vector3(1, 1, 1);

  function updateReadout(index) {
    if (index === currentIndex) return;
    currentIndex = index;
    const [step, label, chapter] = chapters[index];
    if (stepReadout) stepReadout.textContent = step;
    if (liveRegion) liveRegion.textContent = `${label}. ${chapter === "dictate" ? "No transcript is shown while Blabb is listening." : "The Blabb phone demonstration updated."}`;
  }

  function updateScreen(nextState, localPhase) {
    const textureState = nextState === "snooze" && snoozeStoryFrame(localPhase).snoozed ? "snoozed" : nextState;
    const phaseBucket = nextState === "continue" ? Math.floor(localPhase * 20) : 0;
    const key = `${textureState}-${phaseBucket}`;
    if (key === lastScreenKey) return;
    lastScreenKey = key;
    screen.update(textureState, localPhase);
    if (stage) stage.dataset.screenState = textureState;
  }

  function applyBubbleState(nextState, localPhase) {
    const listening = nextState === "dictate" || (nextState === "continue" && localPhase > 0.18 && localPhase < 0.39);
    const processing = nextState === "process" || (nextState === "continue" && localPhase >= 0.39 && localPhase < 0.56);
    const success = ["insert", "continue"].includes(nextState) && !listening && !processing;
    bubble.processingArc.visible = processing;
    bubble.stateRing.visible = listening || success;
    bubble.badge.visible = listening || processing || success;
    bubble.stateRing.material = success ? bubble.successRingMaterial : bubble.listeningRingMaterial;
    bubble.stateRing.scale.setScalar(success
      ? bubbleMetrics.stateRingCenter / bubbleMetrics.listeningRingCenter
      : 1);
    bubble.badgeDisc.material = success ? materials.forest : processing ? materials.plum : materials.coral;
    bubble.check.visible = success;
    bubble.stop.visible = listening;
    bubble.dots.visible = processing;
  }

  function setProgress(nextProgress) {
    visible = true;
    progress = THREE.MathUtils.clamp(nextProgress, 0, 0.9999);
    const chapterValue = progress * chapters.length;
    const index = Math.min(chapters.length - 1, Math.floor(chapterValue));
    phase = chapterValue - index;
    state = chapters[index][2];
    document.documentElement.dataset.artifactChapter = state;
    if (stage) stage.dataset.chapter = state;
    updateReadout(index);
    updateScreen(state, phase);

    const compact = viewport.width <= 880;
    const tablet = viewport.width <= 1180;
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
    const viewWidth = viewHeight * camera.aspect;
    // Mobile story chapters use an editorial two-layer composition: copy on
    // the left, handset on the right. The hero remains centered.
    const xRatio = compact ? (state === "hero" ? 0.5 : 0.6) : tablet ? 0.58 : 0.59;
    targetPosition.x = (xRatio * 2 - 1) * viewWidth * 0.5;
    targetPosition.z = 0;
    if (compact) {
      // Mobile gets a deliberate product reveal instead of a miniaturized
      // desktop composition: the phone peeks above the fold, grows into a
      // large centered showcase, then clears the stage before the hero notes.
      const showcaseScale = THREE.MathUtils.clamp(viewport.height / 980, 0.68, 0.82);
      if (state === "hero") {
        const entrance = THREE.MathUtils.smoothstep(phase, 0.3, 0.62);
        const exit = THREE.MathUtils.smoothstep(phase, 0.64, 0.86);
        if (stage) stage.dataset.mobileMode = phase < 0.48 ? "peek" : phase < 0.7 ? "showcase" : "handoff";
        const initialY = viewport.height <= 700 ? -5.1 : -3.92;
        const showcaseY = THREE.MathUtils.lerp(initialY, 0.12, entrance);
        targetPosition.y = THREE.MathUtils.lerp(showcaseY, 3.8, exit);
        targetScale.setScalar(
          THREE.MathUtils.lerp(showcaseScale * 0.78, showcaseScale, entrance)
          * THREE.MathUtils.lerp(1, 0.7, exit)
        );
      } else {
        if (stage) stage.dataset.mobileMode = "story";
        targetPosition.y = 0.56;
        targetScale.setScalar(0.74);
      }
    } else {
      if (stage) delete stage.dataset.mobileMode;
      targetPosition.y = -0.04;
      // The story copy now occupies the left rail, so let the handset use the
      // open center/right stage. Viewport-height divisors keep its full shell
      // and shadow inside short laptop screens.
      targetScale.setScalar(tablet
        ? Math.min(0.86, viewport.height / 900)
        : Math.min(0.92, viewport.height / 880));
      if (state === "hero") targetScale.multiplyScalar(0.78);
    }
    if (stage) {
      stage.dataset.phoneScale = targetScale.x.toFixed(3);
      stage.dataset.phoneX = targetPosition.x.toFixed(3);
      stage.dataset.phoneY = targetPosition.y.toFixed(3);
    }
    targetRotation.set(...chapterRotations[state]);
    if (compact && state !== "hero") {
      targetRotation.x *= 0.82;
      targetRotation.y *= 0.72;
      targetRotation.z *= 0.8;
    }
    // Touch scrolling already supplies the easing on compact layouts. Apply
    // the composed position immediately so the phone follows the viewport
    // instead of lagging behind a quick swipe by several frames.
    if (compact) {
      phone.position.copy(targetPosition);
      phone.scale.copy(targetScale);
    }

    bubbleTarget.set(1.5, -1.18, 0.41);
    bubble.group.visible = true;
    snoozeTarget.visible = false;
    setSnoozeTargetCaptured(snoozeTarget, false, materials);

    if (state === "snooze") {
      const frame = snoozeStoryFrame(phase);
      bubbleTarget.set(frame.bubbleX, frame.bubbleY, 0.41);
      bubble.group.visible = frame.bubbleVisible;
      snoozeTarget.visible = frame.targetVisible;
      setSnoozeTargetCaptured(snoozeTarget, frame.captured, materials);
    }

    applyBubbleState(state, phase);
  }

  function setFinal(active) {
    visible = active;
    if (!active) return;
    state = "final";
    const compact = viewport.width <= 880;
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
    const viewWidth = viewHeight * camera.aspect;
    targetPosition.set(compact ? 0 : -viewWidth * 0.23, compact ? -2.8 : 0, 0);
    targetRotation.set(-0.14, -0.45, -0.055);
    targetScale.setScalar(compact ? 0.58 : 0.9);
    updateScreen("final", 1);
    bubble.group.visible = true;
    bubbleTarget.set(compact ? 1.1 : 1.46, compact ? -2.85 : -1.14, 0.41);
    applyBubbleState("insert", 1);
  }

  function updateTouchRings(time) {
    touchRings.children.forEach((ring, index) => {
      let pulse = -1;
      if (state === "dictate") pulse = (time * 0.72 + index * 0.5) % 1;
      if (state === "continue") {
        const center = index === 0 ? 0.62 : 0.7;
        const distance = Math.abs(phase - center);
        pulse = distance < 0.1 ? distance / 0.1 : -1;
      }
      ring.material.opacity = pulse >= 0 ? (1 - pulse) * 0.72 : 0;
      ring.scale.setScalar(pulse >= 0 ? 0.8 + pulse * 2.2 : 0.01);
    });
  }

  function tick(time, delta) {
    const ease = 1 - Math.pow(0.001, Math.min(delta, 0.05));

    if (!dragging) {
      userYaw += yawVelocity;
      userPitch = THREE.MathUtils.clamp(userPitch + pitchVelocity, -0.58, 0.58);
      const inertia = Math.pow(0.00035, delta);
      yawVelocity *= inertia;
      pitchVelocity *= inertia;
    }

    const float = viewport.width <= 880 ? 0 : Math.sin(time * 0.82) * 0.035;
    phone.position.x = THREE.MathUtils.lerp(phone.position.x, targetPosition.x, ease);
    phone.position.y = THREE.MathUtils.lerp(phone.position.y, targetPosition.y + float, ease);
    phone.position.z = THREE.MathUtils.lerp(phone.position.z, targetPosition.z, ease);
    phone.scale.lerp(targetScale, ease);
    phone.rotation.x = THREE.MathUtils.lerp(phone.rotation.x, targetRotation.x + userPitch, ease);
    phone.rotation.y = THREE.MathUtils.lerp(phone.rotation.y, targetRotation.y + userYaw, ease);
    phone.rotation.z = THREE.MathUtils.lerp(phone.rotation.z, targetRotation.z, ease);
    bubble.group.position.lerp(bubbleTarget, ease);

    if (state === "dictate") {
      const pulsePhase = (time % 1.2) / 1.2;
      const ringRadius = bubbleMetrics.radius * (0.82 + 0.025 * pulsePhase);
      bubble.stateRing.scale.setScalar(ringRadius / bubbleMetrics.listeningRingCenter);
      bubble.listeningRingMaterial.opacity = (150 + 90 * (1 - pulsePhase)) / 255;
    }
    if (bubble.processingArc.visible) bubble.processingArc.rotation.z -= delta * (Math.PI * 2 / 1.2);
    updateTouchRings(time);
  }

  function resize(width, height) {
    viewport = { width, height };
    setProgress(progress);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function hitTest(clientX, clientY) {
    if (!visible || !stage?.classList.contains("is-visible")) return false;
    pointer.set(clientX / viewport.width * 2 - 1, -(clientY / viewport.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObject(interactionProxy, false).length > 0;
  }

  function beginDrag() {
    dragging = true;
    yawVelocity = 0;
    pitchVelocity = 0;
  }

  function rotateBy(deltaX, deltaY, pointerType = "mouse") {
    const sensitivity = pointerType === "touch" ? 0.009 : 0.0075;
    const yawDelta = deltaX * sensitivity;
    const pitchDelta = deltaY * sensitivity;
    userYaw += yawDelta;
    userPitch = THREE.MathUtils.clamp(userPitch + pitchDelta, -0.58, 0.58);
    if (Math.abs(userYaw) > Math.PI * 4) {
      const completedTurns = Math.trunc(userYaw / (Math.PI * 2)) * Math.PI * 2;
      userYaw -= completedTurns;
      phone.rotation.y -= completedTurns;
    }
    yawVelocity = THREE.MathUtils.clamp(yawDelta * 0.72, -0.12, 0.12);
    pitchVelocity = THREE.MathUtils.clamp(pitchDelta * 0.55, -0.045, 0.045);
  }

  function endDrag() {
    dragging = false;
    if (stage) stage.dataset.rotation = `${userPitch.toFixed(3)},${userYaw.toFixed(3)}`;
  }

  setProgress(0);
  Object.values(layers).forEach((layer) => {
    layer.position.copy(layer.userData.targetPosition);
    layer.rotation.copy(layer.userData.targetRotation);
  });
  phone.position.copy(targetPosition);
  phone.scale.copy(targetScale);
  phone.rotation.copy(targetRotation);
  if (stage) stage.dataset.modelReady = "true";
  return {
    phone,
    screen,
    setProgress,
    setFinal,
    tick,
    resize,
    hitTest,
    beginDrag,
    rotateBy,
    endDrag,
    get visible() { return visible; }
  };
}
