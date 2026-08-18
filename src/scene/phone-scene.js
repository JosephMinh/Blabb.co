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

// These groups preserve the model's logical organization, but the handset is
// always presented as one fully assembled object.
const layerNames = ["back", "battery", "board", "midframe", "frame", "display", "glass"];

const chapterRotations = {
  hero: [-0.14, -0.48, 0.08],
  focus: [-0.04, -0.15, 0.015],
  dictate: [-0.07, 0.17, -0.025],
  process: [-0.12, -0.3, 0.048],
  insert: [0.025, 0.1, -0.018],
  continue: [-0.035, -0.18, 0.015],
  snooze: [-0.06, 0.24, -0.04]
};

function layerForName(name) {
  if (/^(BACK_|CAMERA_)/.test(name)) return "back";
  if (/^(BATTERY|CHARGING_|COIL_|LOWER_CONTACT)/.test(name)) return "battery";
  if (/^(MAINBOARD|BOARD_|LOCAL_ENGINE|ENGINE_|HEAT_|TRACE_)/.test(name)) return "board";
  if (/^MIDFRAME/.test(name)) return "midframe";
  if (/^(METAL_FRAME|VOLUME_|POWER_|SPEAKER_|USB_|MIC_|ANTENNA_)/.test(name)) return "frame";
  if (/^(DISPLAY_BED|OLED_|SELFIE_|EARPIECE)/.test(name)) return "display";
  if (/^DISPLAY_GLASS/.test(name)) return "glass";
  return "frame";
}

function roundedPanel(width, height, depth, material, radius = 0.12) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 5, radius), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createLabelTexture(title, subtitle, accent) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 220;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(23,10,28,.9)";
  context.beginPath();
  context.roundRect(12, 12, 744, 196, 38);
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 5;
  context.stroke();
  context.font = "950 42px Nunito, sans-serif";
  context.fillStyle = accent;
  context.textAlign = "center";
  context.fillText(title, 384, 94);
  context.font = "800 23px Nunito, sans-serif";
  context.fillStyle = "#eddfef";
  context.fillText(subtitle, 384, 148);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBubble(materials) {
  const group = new THREE.Group();
  group.name = "blabb-bubble-hardware";

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.35, 64),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false })
  );
  shadow.position.set(0.055, -0.055, -0.1);
  group.add(shadow);

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.16, 64, 2),
    new THREE.MeshPhysicalMaterial({
      color: palette.aqua,
      roughness: 0.24,
      metalness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.11,
      emissive: palette.aqua,
      emissiveIntensity: 0.28
    })
  );
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  group.add(body);

  const metalRim = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.035, 18, 80), materials.rail);
  metalRim.position.z = 0.092;
  group.add(metalRim);
  const stateRing = new THREE.Mesh(new THREE.TorusGeometry(0.258, 0.023, 16, 80), materials.coral);
  stateRing.position.z = 0.116;
  group.add(stateRing);

  const processingArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.258, 0.026, 16, 80, THREE.MathUtils.degToRad(245)),
    materials.coral
  );
  processingArc.position.z = 0.121;
  processingArc.visible = false;
  group.add(processingArc);

  const logoCanvas = document.createElement("canvas");
  logoCanvas.width = 512;
  logoCanvas.height = 512;
  const logoContext = logoCanvas.getContext("2d");
  logoContext.fillStyle = "#170a1c";
  logoContext.font = "950 300px Nunito, sans-serif";
  logoContext.textAlign = "center";
  logoContext.textBaseline = "middle";
  logoContext.fillText("B", 256, 208);
  logoContext.lineWidth = 46;
  logoContext.lineCap = "round";
  logoContext.beginPath();
  logoContext.arc(256, 242, 128, Math.PI * 0.17, Math.PI * 0.83);
  logoContext.stroke();
  const logoTexture = new THREE.CanvasTexture(logoCanvas);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
    depthWrite: false,
    toneMapped: false
  }));
  logo.position.z = 0.2;
  logo.renderOrder = 10;
  group.add(logo);

  const badge = new THREE.Group();
  badge.position.set(0.22, -0.22, 0.15);
  const badgeDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 40), materials.coral);
  badgeDisc.rotation.x = Math.PI / 2;
  badge.add(badgeDisc);
  const stop = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ color: palette.paper }));
  stop.position.z = 0.04;
  badge.add(stop);
  const checkGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.047, 0, 0.045),
    new THREE.Vector3(-0.012, -0.034, 0.045),
    new THREE.Vector3(0.054, 0.045, 0.045)
  ]);
  const check = new THREE.Line(checkGeometry, new THREE.LineBasicMaterial({ color: palette.paper, linewidth: 3 }));
  check.visible = false;
  badge.add(check);
  const dots = new THREE.Group();
  [-0.032, 0, 0.032].forEach((x) => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.01, 18), new THREE.MeshBasicMaterial({ color: palette.paper }));
    dot.position.set(x, 0, 0.045);
    dots.add(dot);
  });
  dots.visible = false;
  badge.add(dots);
  group.add(badge);

  return { group, body, stateRing, processingArc, badge, badgeDisc, stop, check, dots };
}

function createFlow(materials) {
  const group = new THREE.Group();
  group.name = "private-local-data-flow";
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.38, -1.15, 0.92),
    new THREE.Vector3(1.1, 0.05, 1.1),
    new THREE.Vector3(0.45, 1.22, 0.72),
    new THREE.Vector3(0.23, 2.25, 0.18)
  ]);
  const guide = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, 0.012, 8, false),
    new THREE.MeshBasicMaterial({ color: palette.aqua, transparent: true, opacity: 0.26, depthWrite: false })
  );
  group.add(guide);
  for (let index = 0; index < 12; index += 1) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.035 + (index % 3) * 0.01, 16, 12),
      index % 3 ? materials.aqua : materials.coral
    );
    dot.userData.offset = index / 12;
    group.add(dot);
  }
  group.userData.curve = curve;
  group.visible = false;
  return group;
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
    ring.position.set(0.82, -0.7, 0.86 + index * 0.002);
    ring.userData.index = index;
    group.add(ring);
  });
  return group;
}

function createSnoozeTarget(materials) {
  const target = roundedPanel(2.38, 0.74, 0.075, materials.panelDeep, 0.24);
  target.name = "snooze-dock";
  target.position.set(0, -2.82, 0.82);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.22, 0.62),
    new THREE.MeshBasicMaterial({
      map: createLabelTexture("SNOOZE", "RETURNS IN 10 MINUTES", "#88e0d9"),
      transparent: true,
      toneMapped: false
    })
  );
  label.position.z = 0.05;
  target.add(label);
  target.visible = false;
  return target;
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
  const gltf = await loader.loadAsync(new URL("../../assets/phone/blabb-phone.glb", import.meta.url).href);
  const phone = new THREE.Group();
  phone.name = "blabb-android-phone";
  webglScene.add(phone);
  applyBrandMaterials(gltf.scene);
  const layers = prepareModel(gltf.scene, phone);

  const screen = createScreenTexture();
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.32, 6.92),
    new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false })
  );
  screenMesh.name = "live-blabb-screen";
  screenMesh.position.set(0, -0.035, 0.775);
  screenMesh.material.polygonOffset = true;
  screenMesh.material.polygonOffsetFactor = -2;
  layers.glass.add(screenMesh);

  const bubble = createBubble(materials);
  bubble.group.position.set(1.5, -1.18, 1.08);
  bubble.group.scale.setScalar(1.34);
  layers.glass.add(bubble.group);
  const bubbleTarget = bubble.group.position.clone();

  const snoozeTarget = createSnoozeTarget(materials);
  phone.add(snoozeTarget);
  const flow = createFlow(materials);
  phone.add(flow);
  const touchRings = createTouchRings();
  phone.add(touchRings);

  // Compress the model's authoring-depth axis so the assembled object has a
  // believable modern-handset profile from every draggable angle.
  const handsetDepth = 0.3;
  Object.values(layers).forEach((layer) => { layer.scale.z = handsetDepth; });
  snoozeTarget.scale.z = handsetDepth;
  touchRings.scale.z = handsetDepth;

  const engineCore = phone.getObjectByName("LOCAL_ENGINE_CORE");
  if (engineCore?.material) {
    engineCore.material = engineCore.material.clone();
    engineCore.material.emissive = palette.aqua.clone();
    engineCore.material.emissiveIntensity = 0.08;
  }

  const stepReadout = document.querySelector("#active-step");
  const stateReadout = document.querySelector("#state-readout span");
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
  let lastCursorBeat = -1;
  const targetPosition = new THREE.Vector3();
  const targetRotation = new THREE.Euler();
  const targetScale = new THREE.Vector3(1, 1, 1);

  function updateReadout(index) {
    if (index === currentIndex) return;
    currentIndex = index;
    const [step, label, chapter] = chapters[index];
    if (stepReadout) stepReadout.textContent = step;
    if (stateReadout) stateReadout.textContent = label;
    if (liveRegion) liveRegion.textContent = `${label}. ${chapter === "dictate" ? "No transcript is shown while Blabb is listening." : "The Blabb phone demonstration updated."}`;
  }

  function updateScreen(nextState, localPhase) {
    const textureState = nextState === "snooze" && localPhase >= 0.5 && localPhase < 0.76 ? "snoozed" : nextState;
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
    bubble.stateRing.material = success ? materials.forest : materials.coral;
    bubble.badgeDisc.material = success ? materials.forest : processing ? materials.edge : materials.coral;
    bubble.check.visible = success;
    bubble.stop.visible = listening;
    bubble.dots.visible = processing;
    bubble.body.material.emissiveIntensity = listening ? 0.68 : processing ? 0.52 : 0.28;
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
    const xRatio = compact ? 0.5 : tablet ? 0.5 : 0.59;
    targetPosition.x = (xRatio * 2 - 1) * viewWidth * 0.5;
    targetPosition.y = compact ? (state === "hero" ? -3.12 : 0.68) : -0.04;
    targetPosition.z = 0;
    targetScale.setScalar(compact
      ? Math.min(0.72, viewport.height / 1120)
      : tablet
        ? Math.min(0.74, viewport.height / 1080)
        : Math.min(0.82, viewport.height / 1120));
    if (state === "hero") targetScale.multiplyScalar(compact ? 0.45 : 0.78);
    targetRotation.set(...chapterRotations[state]);

    bubbleTarget.set(1.5, -1.18, 1.08);
    bubble.group.visible = true;
    snoozeTarget.visible = false;

    if (state === "snooze") {
      if (phase < 0.25) bubbleTarget.x = THREE.MathUtils.lerp(1.5, -1.5, phase / 0.25);
      else if (phase < 0.5) {
        bubbleTarget.x = -1.5;
        bubbleTarget.y = THREE.MathUtils.lerp(-1.18, -2.82, (phase - 0.25) / 0.25);
        snoozeTarget.visible = true;
      } else if (phase < 0.76) {
        bubbleTarget.set(-1.5, -2.82, 1.08);
        bubble.group.visible = false;
        snoozeTarget.visible = phase < 0.62;
      } else {
        bubbleTarget.x = THREE.MathUtils.lerp(-1.5, 1.5, (phase - 0.76) / 0.24);
      }
    }

    flow.visible = false;
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
    bubbleTarget.set(compact ? 1.1 : 1.46, compact ? -2.85 : -1.14, 0.98);
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

    phone.position.lerp(targetPosition, ease);
    phone.scale.lerp(targetScale, ease);
    phone.rotation.x = THREE.MathUtils.lerp(phone.rotation.x, targetRotation.x + userPitch, ease);
    phone.rotation.y = THREE.MathUtils.lerp(phone.rotation.y, targetRotation.y + userYaw, ease);
    phone.rotation.z = THREE.MathUtils.lerp(phone.rotation.z, targetRotation.z, ease);
    bubble.group.position.lerp(bubbleTarget, ease);

    const float = Math.sin(time * 0.82) * 0.035;
    phone.position.y += float;
    bubble.group.rotation.z = Math.sin(time * 0.9) * 0.03;
    if (state === "dictate") bubble.stateRing.scale.setScalar(1 + Math.sin(time * 9) * 0.035);
    if (bubble.processingArc.visible) bubble.processingArc.rotation.z -= delta * 3.1;
    if (flow.visible) {
      flow.userData.curve.points[0].set(
        bubble.group.position.x + layers.glass.position.x,
        bubble.group.position.y + layers.glass.position.y,
        bubble.group.position.z + layers.glass.position.z
      );
      flow.userData.curve.points[3].set(
        0.23 + layers.board.position.x,
        2.25 + layers.board.position.y,
        0.18 + layers.board.position.z
      );
      flow.children.slice(1).forEach((dot) => {
        const cycle = (time * 0.48 + dot.userData.offset) % 1;
        dot.position.copy(flow.userData.curve.getPointAt(cycle));
        dot.scale.setScalar(Math.sin(cycle * Math.PI));
      });
    }
    if (engineCore?.material) {
      const active = flow.visible || state === "process";
      engineCore.material.emissiveIntensity = active ? 0.75 + Math.sin(time * 5) * 0.2 : 0.08;
    }
    updateTouchRings(time);
    const cursorBeat = Math.floor(time * 2);
    if (cursorBeat !== lastCursorBeat) {
      lastCursorBeat = cursorBeat;
      screen.render();
    }
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
    return raycaster.intersectObject(phone, true).some(({ object }) => object.visible);
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
    yawVelocity = THREE.MathUtils.clamp(yawDelta * 0.72, -0.12, 0.12);
    pitchVelocity = THREE.MathUtils.clamp(pitchDelta * 0.55, -0.045, 0.045);
    if (stage) stage.dataset.rotation = `${userPitch.toFixed(3)},${userYaw.toFixed(3)}`;
  }

  function endDrag() {
    dragging = false;
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
