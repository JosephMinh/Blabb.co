import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createMaterials, palette } from "./materials.js";
import { createScreenSurface } from "./css3d-screen.js";

const chapters = [
  ["00", "EXPLODED VIEW", "hero"],
  ["01", "READY", "focus"],
  ["02", "LISTENING", "dictate"],
  ["03", "PROCESSING LOCALLY", "process"],
  ["04", "INSERT + VERIFY", "insert"],
  ["05", "CONTINUE + EXACT UNDO", "continue"],
  ["06", "MOVE + SNOOZE", "snooze"]
];

function roundedPanel(width, height, depth, material, radius = 0.12) {
  return new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 5, radius), material);
}

function textSprite(text, color = "#88e0d9") {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "800 28px Nunito, sans-serif";
  context.letterSpacing = "5px";
  context.fillStyle = color;
  context.fillText(text, 18, 56);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(3.7, 0.46, 1);
  return sprite;
}

function createBubble(materials) {
  const group = new THREE.Group();
  group.name = "blabb-bubble";

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.56, 64), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24 }));
  shadow.position.set(0.09, -0.1, -0.04);
  shadow.scale.setScalar(1.13);
  group.add(shadow);

  const core = new THREE.Mesh(new THREE.CircleGeometry(0.55, 64), materials.aqua);
  group.add(core);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.59, 0.055, 16, 80), materials.edge);
  rim.name = "bubble-rim";
  group.add(rim);

  const stateRing = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.055, 16, 80), materials.coral);
  stateRing.name = "state-ring";
  group.add(stateRing);

  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.74, 0.74),
    new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })
  );
  logo.position.z = 0.035;
  new THREE.TextureLoader().load(new URL("../../assets/blabb-mark.png", import.meta.url).href, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    logo.material.map = texture;
    logo.material.needsUpdate = true;
  });
  group.add(logo);

  const badge = new THREE.Group();
  badge.position.set(0.54, -0.5, 0.08);
  const badgeDisc = new THREE.Mesh(new THREE.CircleGeometry(0.2, 36), materials.coral);
  badge.add(badgeDisc);

  const stop = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ color: palette.paper }));
  stop.position.z = 0.02;
  badge.add(stop);

  const checkGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.09, 0, 0.03),
    new THREE.Vector3(-0.025, -0.07, 0.03),
    new THREE.Vector3(0.115, 0.09, 0.03)
  ]);
  const check = new THREE.Line(checkGeometry, new THREE.LineBasicMaterial({ color: palette.paper }));
  check.visible = false;
  badge.add(check);
  group.add(badge);

  return { group, stateRing, badge, badgeDisc, stop, check };
}

function createFlow(materials) {
  const group = new THREE.Group();
  for (let index = 0; index < 9; index += 1) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.045 + (index % 3) * 0.012, 16, 12), index % 2 ? materials.aqua : materials.coral);
    dot.userData.offset = index / 9;
    group.add(dot);
  }
  group.visible = false;
  return group;
}

export function createPhoneScene(webglScene, cssScene, camera) {
  const materials = createMaterials();
  const phone = new THREE.Group();
  phone.name = "blabb-phone";
  webglScene.add(phone);

  const shell = roundedPanel(3.76, 7.78, 0.38, materials.shell, 0.34);
  shell.name = "shell";
  phone.add(shell);

  const glass = roundedPanel(3.5, 7.47, 0.12, materials.glass, 0.28);
  glass.name = "glass";
  glass.position.z = 0.22;
  phone.add(glass);

  const sideA = roundedPanel(0.08, 0.75, 0.12, materials.edge, 0.04);
  sideA.position.set(1.92, 1.7, 0);
  phone.add(sideA);
  const sideB = sideA.clone();
  sideB.scale.y = 0.68;
  sideB.position.y = 0.72;
  phone.add(sideB);

  const cameraIsland = roundedPanel(0.8, 0.18, 0.08, materials.edge, 0.09);
  cameraIsland.position.set(0, 3.48, 0.34);
  phone.add(cameraIsland);

  const appLayer = roundedPanel(3.35, 6.9, 0.08, materials.panelDeep, 0.18);
  appLayer.name = "active-app";
  const appLabel = textSprite("ACTIVE APP");
  appLabel.position.set(-0.2, -3.22, 0.08);
  appLayer.add(appLabel);
  webglScene.add(appLayer);

  const fieldLayer = roundedPanel(3.35, 1.42, 0.08, materials.panelCoral, 0.16);
  fieldLayer.name = "focused-field";
  const fieldLabel = textSprite("FOCUSED FIELD", "#ef8354");
  fieldLabel.position.set(0, -0.88, 0.08);
  fieldLayer.add(fieldLabel);
  webglScene.add(fieldLayer);

  const engineLayer = roundedPanel(3.35, 1.24, 0.16, materials.panelAqua, 0.16);
  engineLayer.name = "local-engine";
  const engineLabel = textSprite("LOCAL VOICE ENGINE");
  engineLabel.position.set(0, -0.7, 0.1);
  engineLayer.add(engineLabel);
  const engineBars = new THREE.Group();
  for (let index = 0; index < 7; index += 1) {
    const bar = roundedPanel(0.15, 0.42 + Math.sin(index * 1.4) * 0.14, 0.09, index % 2 ? materials.coral : materials.aqua, 0.05);
    bar.position.x = (index - 3) * 0.28;
    engineBars.add(bar);
  }
  engineLayer.add(engineBars);
  webglScene.add(engineLayer);

  const bubble = createBubble(materials);
  bubble.group.position.set(2.02, -1.85, 0.72);
  phone.add(bubble.group);

  const snoozeTarget = roundedPanel(2.1, 0.72, 0.05, materials.panelCoral, 0.18);
  const snoozeLabel = textSprite("SNOOZE · 10 MIN", "#ef8354");
  snoozeLabel.scale.set(2.4, 0.3, 1);
  snoozeLabel.position.z = 0.05;
  snoozeTarget.add(snoozeLabel);
  snoozeTarget.position.set(0, -3.05, 0.55);
  snoozeTarget.visible = false;
  phone.add(snoozeTarget);

  const flow = createFlow(materials);
  webglScene.add(flow);

  const cssPhone = new THREE.Group();
  const screen = createScreenSurface();
  cssPhone.add(screen.object);
  cssScene.add(cssPhone);

  const stepReadout = document.querySelector("#active-step");
  const stateReadout = document.querySelector("#state-readout span");
  const liveRegion = document.querySelector("#phone-live");

  let viewport = { width: innerWidth, height: innerHeight };
  let progress = 0;
  let currentIndex = -1;
  let state = "hero";
  let phase = 0;
  let visible = true;
  const targetPosition = new THREE.Vector3();
  const targetRotation = new THREE.Euler();
  const targetScale = new THREE.Vector3(1, 1, 1);
  const bubbleTarget = new THREE.Vector3(2.02, -1.85, 0.72);

  function updateReadout(index) {
    if (index === currentIndex) return;
    currentIndex = index;
    const [step, label, chapter] = chapters[index];
    if (stepReadout) stepReadout.textContent = step;
    if (stateReadout) stateReadout.textContent = label;
    if (liveRegion) liveRegion.textContent = `${label}. ${chapter === "dictate" ? "No transcript is shown while Blabb is listening." : "The Blabb phone demonstration updated."}`;
  }

  function applyBubbleState(nextState, localPhase) {
    const isListening = nextState === "dictate" || (nextState === "continue" && localPhase > 0.18 && localPhase < 0.39);
    const isProcessing = nextState === "process" || (nextState === "continue" && localPhase >= 0.39 && localPhase < 0.56);
    const isSuccess = ["insert", "continue"].includes(nextState) && !isListening && !isProcessing;
    bubble.stateRing.visible = isListening || isProcessing || isSuccess;
    bubble.badge.visible = isListening || isProcessing || isSuccess;
    bubble.stateRing.material = isSuccess ? materials.forest : materials.coral;
    bubble.badgeDisc.material = isSuccess ? materials.forest : materials.coral;
    bubble.check.visible = isSuccess;
    bubble.stop.visible = !isSuccess;
    bubble.stateRing.scale.setScalar(isListening ? 1 + Math.sin(performance.now() * 0.012) * 0.08 : 1);
    if (isProcessing) bubble.stateRing.rotation.z += 0.06;
  }

  function setProgress(nextProgress) {
    progress = THREE.MathUtils.clamp(nextProgress, 0, 0.9999);
    const chapterValue = progress * chapters.length;
    const index = Math.min(chapters.length - 1, Math.floor(chapterValue));
    phase = chapterValue - index;
    state = chapters[index][2];
    document.documentElement.dataset.artifactChapter = state;
    updateReadout(index);
    screen.update(state, phase);

    const compact = viewport.width <= 880;
    const tablet = viewport.width <= 1180;
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
    const viewWidth = viewHeight * camera.aspect;
    const xRatio = compact ? 0.5 : tablet ? 0.5 : 0.58;
    targetPosition.x = (xRatio * 2 - 1) * viewWidth * 0.5;
    targetPosition.y = compact ? (state === "hero" ? -2.55 : 0.88) : -0.05;
    targetPosition.z = 0;
    targetScale.setScalar(compact
      ? Math.min(0.76, viewport.height / 1020)
      : tablet
        ? Math.min(0.72, viewport.height / 1100)
        : Math.min(1.02, viewport.height / 920));
    targetRotation.set(-0.035, state === "hero" ? -0.2 + phase * 0.12 : -0.05, state === "hero" ? 0.07 - phase * 0.04 : 0.018);

    const explosion = state === "hero" ? 1 - phase * 0.75 : state === "process" ? 0.7 : 0;
    appLayer.position.set(targetPosition.x - explosion * 1.15, targetPosition.y + explosion * 0.46, -0.45 - explosion * 0.4);
    appLayer.rotation.z = explosion * -0.13;
    appLayer.scale.copy(targetScale);
    fieldLayer.position.set(targetPosition.x + explosion * 1.4, targetPosition.y - 1.45 + explosion * 0.18, -0.2 - explosion * 0.3);
    fieldLayer.rotation.z = explosion * 0.11;
    fieldLayer.scale.copy(targetScale);
    engineLayer.position.set(targetPosition.x - explosion * 0.48, targetPosition.y - 2.3 - explosion * 0.8, -0.6 - explosion * 0.45);
    engineLayer.rotation.z = explosion * -0.06;
    engineLayer.scale.copy(targetScale);
    appLayer.visible = explosion > 0.03;
    fieldLayer.visible = explosion > 0.03;
    engineLayer.visible = explosion > 0.03;

    bubbleTarget.set(2.02, -1.85, 0.72);
    bubble.group.visible = true;
    snoozeTarget.visible = false;

    if (state === "snooze") {
      if (phase < 0.25) bubbleTarget.x = THREE.MathUtils.lerp(2.02, -2.02, phase / 0.25);
      else if (phase < 0.5) {
        bubbleTarget.x = -2.02;
        bubbleTarget.y = THREE.MathUtils.lerp(-1.85, -3.05, (phase - 0.25) / 0.25);
        snoozeTarget.visible = true;
      } else if (phase < 0.76) {
        bubbleTarget.set(-2.02, -3.05, 0.72);
        bubble.group.visible = false;
        snoozeTarget.visible = phase < 0.62;
        screen.update("snoozed", phase);
      } else {
        bubbleTarget.x = THREE.MathUtils.lerp(-2.02, 2.02, (phase - 0.76) / 0.24);
      }
    }

    flow.visible = state === "process";
    applyBubbleState(state, phase);
  }

  function setFinal(active) {
    visible = active;
    if (!active) return;
    state = "final";
    const compact = viewport.width <= 880;
    const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
    const viewWidth = viewHeight * camera.aspect;
    targetPosition.set(compact ? 0 : -viewWidth * 0.22, compact ? -3.45 : 0, 0);
    targetRotation.set(-0.1, -0.36, -0.05);
    targetScale.setScalar(compact ? 0.55 : 0.92);
    screen.update("insert", 1);
    appLayer.visible = true;
    fieldLayer.visible = true;
    engineLayer.visible = true;
    appLayer.position.set(targetPosition.x - 1.35, targetPosition.y + 0.6, -0.7);
    fieldLayer.position.set(targetPosition.x + 1.5, targetPosition.y - 1.1, -0.42);
    engineLayer.position.set(targetPosition.x - 0.7, targetPosition.y - 2.7, -0.9);
    [appLayer, fieldLayer, engineLayer].forEach((layer) => layer.scale.copy(targetScale));
    bubble.group.visible = true;
    bubbleTarget.set(compact ? 1.45 : 2.25, compact ? -3.45 : -1.5, 0.78);
    applyBubbleState("insert", 1);
  }

  function tick(time, delta) {
    const ease = 1 - Math.pow(0.001, Math.min(delta, 0.05));
    phone.position.lerp(targetPosition, ease);
    phone.scale.lerp(targetScale, ease);
    phone.rotation.x = THREE.MathUtils.lerp(phone.rotation.x, targetRotation.x, ease);
    phone.rotation.y = THREE.MathUtils.lerp(phone.rotation.y, targetRotation.y, ease);
    phone.rotation.z = THREE.MathUtils.lerp(phone.rotation.z, targetRotation.z, ease);
    bubble.group.position.lerp(bubbleTarget, ease);

    cssPhone.position.copy(phone.position);
    cssPhone.scale.copy(phone.scale);
    cssPhone.rotation.copy(phone.rotation);

    if (state === "dictate") {
      const pulse = 1 + Math.sin(time * 8.5) * 0.055;
      bubble.stateRing.scale.setScalar(pulse);
    }
    if (state === "process") {
      bubble.stateRing.rotation.z -= delta * 2.8;
      flow.children.forEach((dot) => {
        const cycle = (time * 0.42 + dot.userData.offset) % 1;
        dot.position.set(targetPosition.x + Math.sin(cycle * 12) * 0.16, targetPosition.y + 0.2 - cycle * 2.35, 0.8);
        dot.scale.setScalar(Math.sin(cycle * Math.PI));
      });
    }
    engineBars.children.forEach((bar, index) => {
      bar.scale.y = 0.7 + Math.sin(time * 4 + index) * 0.24;
    });
  }

  function resize(width, height) {
    viewport = { width, height };
    setProgress(progress);
  }

  setProgress(0);
  return { phone, cssPhone, screen, setProgress, setFinal, tick, resize, get visible() { return visible; } };
}
