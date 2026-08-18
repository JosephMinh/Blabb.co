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

function faceDisc(radius, material, segments = 48) {
  return new THREE.Mesh(new THREE.CircleGeometry(radius, segments), material);
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

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.25, 64), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.24 }));
  shadow.position.set(0.04, -0.045, -0.04);
  shadow.scale.setScalar(1.13);
  group.add(shadow);

  const core = new THREE.Mesh(new THREE.CircleGeometry(0.24, 64), materials.aqua);
  group.add(core);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.228, 0.025, 16, 80), materials.edge);
  rim.name = "bubble-rim";
  group.add(rim);

  const stateRing = new THREE.Mesh(new THREE.TorusGeometry(0.202, 0.022, 16, 80), materials.coral);
  stateRing.name = "state-ring";
  group.add(stateRing);

  const processingArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.202, 0.024, 16, 80, THREE.MathUtils.degToRad(245)),
    materials.coral
  );
  processingArc.name = "processing-arc";
  processingArc.visible = false;
  group.add(processingArc);

  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.48),
    new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })
  );
  logo.position.z = 0.035;
  new THREE.TextureLoader().load(new URL("../../assets/blabb-mark.png", import.meta.url).href, (texture) => {
    const source = texture.image;
    const canvas = document.createElement("canvas");
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    const context = canvas.getContext("2d");
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "source-in";
    context.fillStyle = "#170a1c";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const tintedMark = new THREE.CanvasTexture(canvas);
    tintedMark.colorSpace = THREE.SRGBColorSpace;
    logo.material.map = tintedMark;
    logo.material.needsUpdate = true;
    texture.dispose();
  });
  group.add(logo);

  const badge = new THREE.Group();
  badge.position.set(0.149, -0.149, 0.08);
  const badgeDisc = new THREE.Mesh(new THREE.CircleGeometry(0.086, 36), materials.coral);
  badge.add(badgeDisc);

  const stop = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.064), new THREE.MeshBasicMaterial({ color: palette.paper }));
  stop.position.z = 0.02;
  badge.add(stop);

  const checkGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.044, 0, 0.03),
    new THREE.Vector3(-0.01, -0.034, 0.03),
    new THREE.Vector3(0.052, 0.044, 0.03)
  ]);
  const check = new THREE.Line(checkGeometry, new THREE.LineBasicMaterial({ color: palette.paper }));
  check.visible = false;
  badge.add(check);
  const dots = new THREE.Group();
  [-0.032, 0, 0.032].forEach((x) => {
    const dot = faceDisc(0.009, new THREE.MeshBasicMaterial({ color: palette.paper }), 20);
    dot.position.set(x, 0, 0.03);
    dots.add(dot);
  });
  dots.visible = false;
  badge.add(dots);
  group.add(badge);

  return { group, stateRing, processingArc, badge, badgeDisc, stop, check, dots };
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

  const rail = roundedPanel(3.86, 7.88, 0.48, materials.rail, 0.36);
  rail.name = "android-metal-rail";
  phone.add(rail);

  const shell = roundedPanel(3.74, 7.76, 0.38, materials.shell, 0.33);
  shell.name = "shell";
  shell.position.z = 0.01;
  phone.add(shell);

  const back = roundedPanel(3.65, 7.66, 0.12, materials.back, 0.3);
  back.name = "matte-android-back";
  back.position.z = -0.25;
  phone.add(back);

  const glass = roundedPanel(3.5, 7.47, 0.12, materials.glass, 0.28);
  glass.name = "glass";
  glass.position.z = 0.22;
  phone.add(glass);

  const sideA = roundedPanel(0.09, 0.72, 0.15, materials.edge, 0.04);
  sideA.name = "android-volume-rocker";
  sideA.position.set(1.96, 1.58, 0.02);
  phone.add(sideA);
  const sideB = sideA.clone();
  sideB.name = "android-power-button";
  sideB.material = materials.aqua;
  sideB.scale.y = 0.58;
  sideB.position.y = 0.64;
  phone.add(sideB);

  const rearCameraBar = roundedPanel(3.44, 0.66, 0.22, materials.cameraBar, 0.18);
  rearCameraBar.name = "android-camera-bar";
  rearCameraBar.position.set(0, 2.72, -0.34);
  phone.add(rearCameraBar);
  [-0.92, -0.42].forEach((x, index) => {
    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(index ? 0.165 : 0.19, 0.04, 16, 48), materials.rail);
    lensRing.position.set(x, 2.72, -0.465);
    lensRing.rotation.y = Math.PI;
    phone.add(lensRing);
    const lens = faceDisc(index ? 0.145 : 0.17, materials.cameraGlass);
    lens.position.set(x, 2.72, -0.47);
    lens.rotation.y = Math.PI;
    phone.add(lens);
  });
  const cameraFlash = faceDisc(0.09, materials.lilac);
  cameraFlash.position.set(0.82, 2.72, -0.47);
  cameraFlash.rotation.y = Math.PI;
  phone.add(cameraFlash);

  const usbPort = roundedPanel(0.42, 0.08, 0.13, materials.cameraGlass, 0.04);
  usbPort.name = "usb-c-port";
  usbPort.position.set(0, -3.96, 0.01);
  usbPort.rotation.x = Math.PI * 0.5;
  phone.add(usbPort);

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
  bubble.group.position.set(1.39, -1.17, 0.72);
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

  const depthRig = new THREE.Group();
  depthRig.name = "exploded-depth-rig";
  const aquaOrbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.75, 0.022, 10, 96),
    new THREE.MeshBasicMaterial({ color: palette.aqua, transparent: true, opacity: 0.46, depthWrite: false })
  );
  aquaOrbit.scale.set(1.05, 1.38, 1);
  const coralOrbit = new THREE.Mesh(
    new THREE.TorusGeometry(2.32, 0.016, 10, 96),
    new THREE.MeshBasicMaterial({ color: palette.coral, transparent: true, opacity: 0.38, depthWrite: false })
  );
  coralOrbit.scale.set(1.12, 1.5, 1);
  coralOrbit.rotation.z = 0.48;
  depthRig.add(aquaOrbit, coralOrbit);
  webglScene.add(depthRig);

  const depthLines = [materials.aqua, materials.coral, materials.aqua].map((material) => {
    const lineMaterial = new THREE.LineBasicMaterial({ color: material.color, transparent: true, opacity: 0.52 });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), lineMaterial);
    webglScene.add(line);
    return line;
  });

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
  const depthBaseScale = new THREE.Vector3(1, 1, 1);
  const bubbleTarget = new THREE.Vector3(1.39, -1.17, 0.72);
  let explosionAmount = 1;

  const chapterRotations = {
    hero: [-0.14, -0.5, 0.09],
    focus: [-0.05, -0.18, 0.02],
    dictate: [-0.08, 0.18, -0.025],
    process: [-0.13, -0.32, 0.05],
    insert: [0.035, 0.12, -0.02],
    continue: [-0.04, -0.2, 0.018],
    snooze: [-0.07, 0.26, -0.045]
  };

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
    bubble.processingArc.visible = isProcessing;
    bubble.stateRing.visible = isListening || isSuccess;
    bubble.badge.visible = isListening || isProcessing || isSuccess;
    bubble.stateRing.material = isSuccess ? materials.forest : materials.coral;
    bubble.badgeDisc.material = isSuccess ? materials.forest : isProcessing ? materials.edge : materials.coral;
    bubble.check.visible = isSuccess;
    bubble.stop.visible = isListening;
    bubble.dots.visible = isProcessing;
    bubble.stateRing.scale.setScalar(isListening ? 1 + Math.sin(performance.now() * 0.012) * 0.025 : 1);
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
    const rotation = chapterRotations[state];
    targetRotation.set(rotation[0], rotation[1], rotation[2]);

    const explosion = state === "hero" ? 1.2 - phase * 0.78 : state === "process" ? 0.86 : 0;
    explosionAmount = explosion;
    appLayer.position.set(targetPosition.x - explosion * 1.34, targetPosition.y + explosion * 0.64, -0.62 - explosion * 0.62);
    appLayer.rotation.set(explosion * 0.04, explosion * -0.1, explosion * -0.15);
    appLayer.scale.copy(targetScale);
    fieldLayer.position.set(targetPosition.x + explosion * 1.58, targetPosition.y - 1.45 + explosion * 0.24, 0.28 + explosion * 0.5);
    fieldLayer.rotation.set(explosion * -0.08, explosion * 0.16, explosion * 0.13);
    fieldLayer.scale.copy(targetScale);
    engineLayer.position.set(targetPosition.x - explosion * 0.66, targetPosition.y - 2.3 - explosion * 0.92, 0.5 + explosion * 0.72);
    engineLayer.rotation.set(explosion * 0.1, explosion * -0.12, explosion * -0.08);
    engineLayer.scale.copy(targetScale);
    appLayer.visible = explosion > 0.03;
    fieldLayer.visible = explosion > 0.03;
    engineLayer.visible = explosion > 0.03;
    depthRig.visible = explosion > 0.03;
    depthRig.position.set(targetPosition.x, targetPosition.y, -1.42);
    depthBaseScale.copy(targetScale).multiplyScalar(0.92 + explosion * 0.08);
    depthRig.scale.copy(depthBaseScale);
    const layerTargets = [appLayer.position, fieldLayer.position, engineLayer.position];
    depthLines.forEach((line, lineIndex) => {
      line.visible = explosion > 0.08;
      const positions = line.geometry.attributes.position;
      positions.setXYZ(0, targetPosition.x, targetPosition.y, -0.18);
      positions.setXYZ(1, layerTargets[lineIndex].x, layerTargets[lineIndex].y, layerTargets[lineIndex].z);
      positions.needsUpdate = true;
    });

    bubbleTarget.set(1.39, -1.17, 0.72);
    bubble.group.visible = true;
    snoozeTarget.visible = false;

    if (state === "snooze") {
      if (phase < 0.25) bubbleTarget.x = THREE.MathUtils.lerp(1.39, -1.39, phase / 0.25);
      else if (phase < 0.5) {
        bubbleTarget.x = -1.39;
        bubbleTarget.y = THREE.MathUtils.lerp(-1.17, -3.05, (phase - 0.25) / 0.25);
        snoozeTarget.visible = true;
      } else if (phase < 0.76) {
        bubbleTarget.set(-1.39, -3.05, 0.72);
        bubble.group.visible = false;
        snoozeTarget.visible = phase < 0.62;
        screen.update("snoozed", phase);
      } else {
        bubbleTarget.x = THREE.MathUtils.lerp(-1.39, 1.39, (phase - 0.76) / 0.24);
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
    targetRotation.set(-0.16, -0.52, -0.065);
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
    bubbleTarget.set(compact ? 1.2 : 1.48, compact ? -3.45 : -1.17, 0.78);
    applyBubbleState("insert", 1);
    explosionAmount = 0.9;
    depthRig.visible = true;
    depthRig.position.set(targetPosition.x, targetPosition.y, -1.45);
    depthBaseScale.copy(targetScale);
    depthRig.scale.copy(depthBaseScale);
    depthLines.forEach((line) => { line.visible = false; });
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
      const pulse = 1 + Math.sin(time * 8.5) * 0.025;
      bubble.stateRing.scale.setScalar(pulse);
    }
    if (state === "process") {
      bubble.processingArc.rotation.z -= delta * 2.8;
      flow.children.forEach((dot) => {
        const cycle = (time * 0.42 + dot.userData.offset) % 1;
        dot.position.set(targetPosition.x + Math.sin(cycle * 12) * 0.16, targetPosition.y + 0.2 - cycle * 2.35, 0.8);
        dot.scale.setScalar(Math.sin(cycle * Math.PI));
      });
    }
    engineBars.children.forEach((bar, index) => {
      bar.scale.y = 0.7 + Math.sin(time * 4 + index) * 0.24;
    });
    if (depthRig.visible) {
      aquaOrbit.rotation.z = time * 0.055;
      coralOrbit.rotation.z = 0.48 - time * 0.075;
      const breathe = 1 + Math.sin(time * 1.3) * 0.018 * explosionAmount;
      depthRig.scale.copy(depthBaseScale).multiplyScalar(breathe);
    }
  }

  function resize(width, height) {
    viewport = { width, height };
    setProgress(progress);
  }

  setProgress(0);
  return { phone, cssPhone, screen, setProgress, setFinal, tick, resize, get visible() { return visible; } };
}
