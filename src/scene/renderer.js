import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { canRunArtifact, artifactPixelRatio } from "./capability-policy.js";
import { createPhoneScene } from "./phone-scene.js";
import { createPhoneTimeline } from "./phone-timeline.js";

export async function initArtifact() {
  const stage = document.querySelector("#artifact-stage");
  const canvas = document.querySelector("#artifact-webgl");
  if (!stage || !canvas || !canRunArtifact()) {
    document.documentElement.classList.add("artifact-fallback-active");
    return false;
  }

  await document.fonts?.ready;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(0x000000, 0);
  const automated = navigator.webdriver;
  const debugRenderer = renderer.getContext().getExtension("WEBGL_debug_renderer_info");
  const gpuName = debugRenderer
    ? renderer.getContext().getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL)
    : "";
  const softwareRenderer = /swiftshader|llvmpipe|software rasterizer|basic render|microsoft warp/i.test(gpuName);
  if (softwareRenderer && !automated) {
    canvas.dataset.renderer = "software-fallback";
    stage.dataset.rendererMode = "fallback";
    renderer.dispose();
    document.documentElement.classList.add("artifact-fallback-active");
    return false;
  }
  renderer.shadowMap.enabled = !automated && !softwareRenderer;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  canvas.dataset.renderer = "threejs-gltf";
  stage.dataset.rendererMode = softwareRenderer ? "test" : "full";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 12.25);

  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  const environmentScene = new RoomEnvironment();
  const environment = environmentGenerator.fromScene(environmentScene, 0.035);
  scene.environment = environment.texture;
  environmentScene.dispose();
  environmentGenerator.dispose();

  const ambient = new THREE.HemisphereLight(0xeddfef, 0x100614, 0.72);
  scene.add(ambient);
  const key = new THREE.SpotLight(0xfff8ff, 82, 28, Math.PI * 0.19, 0.62, 1.35);
  key.position.set(-4.8, 7.2, 9.5);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  // Keep the phone's long cast shadow smooth where it crosses light surfaces.
  // Desktop GPUs get a denser map; compact/coarse-pointer devices retain the
  // lighter map because the handset occupies far fewer screen pixels there.
  const compactShadows = window.matchMedia("(max-width: 880px), (pointer: coarse)").matches;
  const shadowMapSize = compactShadows ? 1024 : 2048;
  key.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  key.shadow.radius = compactShadows ? 2.5 : 7;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 24;
  key.shadow.focus = 0.82;
  key.shadow.bias = -0.00025;
  scene.add(key, key.target);
  const aquaRim = new THREE.PointLight(0x88e0d9, 18, 19, 1.7);
  aquaRim.position.set(5.2, 1.6, 5.8);
  scene.add(aquaRim);
  const coralRim = new THREE.PointLight(0xef8354, 15, 18, 1.8);
  coralRim.position.set(-4.2, -3.5, 4.8);
  scene.add(coralRim);
  const upperRim = new THREE.DirectionalLight(0xd8c0ff, 1.55);
  upperRim.position.set(2, 7, -1);
  scene.add(upperRim);

  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(17, 17),
    new THREE.ShadowMaterial({ color: 0x070209, opacity: 0.34, transparent: true })
  );
  shadowCatcher.position.z = -3.35;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const controller = await createPhoneScene(scene, camera);
  let width = 0;
  let height = 0;
  let running = true;
  let contextLosses = 0;
  let firstFrame = false;
  let pointerX = 0;
  let pointerY = 0;
  let smoothPointerX = 0;
  let smoothPointerY = 0;
  let previousTime = performance.now() / 1000;
  let lastBudgetedFrame = -Infinity;
  let activePointer = null;
  let lastDragX = 0;
  let lastDragY = 0;
  let touchDecision = "pending";
  let pointerCaptureTarget = null;
  let lastHoverTest = -Infinity;

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = softwareRenderer ? 0.5 : automated ? 1 : artifactPixelRatio();
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controller.resize(width, height);
  }

  function render(time) {
    if (!running || document.hidden || stage.dataset.renderPaused === "true" || !stage.classList.contains("is-visible")) return;
    if ((automated || softwareRenderer) && time - lastBudgetedFrame < 0.14) return;
    lastBudgetedFrame = time;
    const seconds = time;
    const delta = Math.min(0.05, Math.max(0.001, seconds - previousTime));
    previousTime = seconds;
    smoothPointerX += (pointerX - smoothPointerX) * 0.052;
    smoothPointerY += (pointerY - smoothPointerY) * 0.052;
    camera.position.x = smoothPointerX * 0.38;
    camera.position.y = smoothPointerY * -0.26;
    camera.lookAt(0, 0, 0);
    controller.tick(seconds, delta);
    // Keep the full-viewport canvas transparent. Fullscreen bloom passes write
    // opaque alpha and would cover the semantic walkthrough behind the phone.
    renderer.render(scene, camera);

    if (!firstFrame) {
      firstFrame = true;
      stage.dataset.rendered = "true";
      stage.dataset.renderState = "ready";
      document.documentElement.classList.add("webgl-ready");
      document.documentElement.classList.remove("artifact-fallback-active");
    }
  }

  function isPageControl(target) {
    return target instanceof Element && Boolean(target.closest("a, button, input, textarea, select, summary, label"));
  }

  function onPointerDown(event) {
    if (activePointer !== null || isPageControl(event.target) || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (!controller.hitTest(event.clientX, event.clientY)) return;
    // The WebGL layer deliberately lets the semantic page receive pointer
    // events. Cancel the underlying page's mouse/pen default once the raycast
    // confirms a phone hit, otherwise browsers can start a text/image drag.
    if (event.pointerType !== "touch") event.preventDefault();
    activePointer = event.pointerId;
    lastDragX = event.clientX;
    lastDragY = event.clientY;
    touchDecision = event.pointerType === "touch" ? "pending" : "rotate";
    controller.beginDrag();
    pointerCaptureTarget = event.target instanceof Element ? event.target : null;
    try { pointerCaptureTarget?.setPointerCapture(event.pointerId); } catch {}
    stage.classList.add("is-dragging");
    stage.dataset.interaction = "dragging";
    document.documentElement.classList.add("artifact-dragging");
  }

  function suppressNativeDrag(event) {
    if (activePointer !== null) event.preventDefault();
  }

  function onPointerMove(event) {
    if (!window.matchMedia("(max-width: 880px), (pointer: coarse)").matches) {
      pointerX = event.clientX / width * 2 - 1;
      pointerY = event.clientY / height * 2 - 1;
      if (activePointer === null && event.timeStamp - lastHoverTest >= 34) {
        lastHoverTest = event.timeStamp;
        stage.classList.toggle("is-hovered", controller.hitTest(event.clientX, event.clientY));
      }
    }
    if (event.pointerId !== activePointer) return;
    const deltaX = event.clientX - lastDragX;
    const deltaY = event.clientY - lastDragY;
    if (touchDecision === "pending" && Math.hypot(deltaX, deltaY) >= 7) {
      touchDecision = Math.abs(deltaX) > Math.abs(deltaY) * 1.12 ? "rotate" : "scroll";
      if (touchDecision === "scroll") {
        finishDrag();
        return;
      }
    }
    if (touchDecision !== "rotate") return;
    event.preventDefault();
    controller.rotateBy(deltaX, deltaY, event.pointerType);
    lastDragX = event.clientX;
    lastDragY = event.clientY;
  }

  function finishDrag(event) {
    if (event && "pointerId" in event && event.pointerId !== activePointer) return;
    if (activePointer === null) return;
    const completedPointer = activePointer;
    activePointer = null;
    touchDecision = "pending";
    controller.endDrag();
    stage.classList.remove("is-dragging");
    stage.dataset.interaction = "ready";
    document.documentElement.classList.remove("artifact-dragging");
    try {
      if (pointerCaptureTarget?.hasPointerCapture(completedPointer)) pointerCaptureTarget.releasePointerCapture(completedPointer);
    } catch {}
    pointerCaptureTarget = null;
  }

  function onVisibilityChange() {
    running = !document.hidden;
    if (document.hidden) finishDrag();
  }

  function onContextLost(event) {
    event.preventDefault();
    contextLosses += 1;
    running = false;
    firstFrame = false;
    finishDrag();
    stage.dataset.renderState = "recovering";
    stage.dataset.contextLosses = String(contextLosses);
    document.documentElement.classList.remove("webgl-ready");
    document.documentElement.classList.add("artifact-fallback-active");
  }

  function onContextRestored() {
    firstFrame = false;
    running = !document.hidden;
    previousTime = performance.now() / 1000;
    stage.dataset.renderState = "restoring";
    resize();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.documentElement);
  window.addEventListener("pointerdown", onPointerDown, { passive: false });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", finishDrag, { passive: true });
  window.addEventListener("pointercancel", finishDrag, { passive: true });
  window.addEventListener("lostpointercapture", finishDrag, true);
  window.addEventListener("blur", finishDrag);
  document.addEventListener("selectstart", suppressNativeDrag, true);
  document.addEventListener("dragstart", suppressNativeDrag, true);
  document.addEventListener("visibilitychange", onVisibilityChange);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  resize();
  const timeline = createPhoneTimeline(controller, stage);
  const journey = document.querySelector(".journey");
  if (journey && window.scrollY <= journey.offsetHeight) stage.classList.add("is-visible");
  gsap.ticker.add(render);
  render(performance.now() / 1000);

  window.addEventListener("pagehide", () => {
    timeline.destroy();
    resizeObserver.disconnect();
    window.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finishDrag);
    window.removeEventListener("pointercancel", finishDrag);
    window.removeEventListener("lostpointercapture", finishDrag, true);
    window.removeEventListener("blur", finishDrag);
    document.removeEventListener("selectstart", suppressNativeDrag, true);
    document.removeEventListener("dragstart", suppressNativeDrag, true);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    gsap.ticker.remove(render);
    environment.dispose();
    renderer.dispose();
  }, { once: true });

  return true;
}
