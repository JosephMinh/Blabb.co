import * as THREE from "three";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
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
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const cssScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  const ambient = new THREE.HemisphereLight(0xeddfef, 0x170a1c, 2.2);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xfffaff, 3.3);
  key.position.set(-4, 7, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88e0d9, 3.7);
  rim.position.set(5, 1, 4);
  scene.add(rim);
  const coralFill = new THREE.PointLight(0xef8354, 7, 18, 2);
  coralFill.position.set(-4, -3, 5);
  scene.add(coralFill);

  const controller = createPhoneScene(scene, cssScene, camera);
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.className = "artifact-css3d";
  cssRenderer.domElement.setAttribute("aria-hidden", "true");
  stage.append(cssRenderer.domElement);

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

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const ratio = artifactPixelRatio();
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    cssRenderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controller.resize(width, height);
  }

  function render(time) {
    if (!running || document.hidden || !stage.classList.contains("is-visible")) return;
    const seconds = time;
    const delta = Math.min(0.05, Math.max(0.001, seconds - previousTime));
    previousTime = seconds;
    smoothPointerX += (pointerX - smoothPointerX) * 0.055;
    smoothPointerY += (pointerY - smoothPointerY) * 0.055;
    camera.position.x = smoothPointerX * 0.14;
    camera.position.y = smoothPointerY * -0.1;
    camera.lookAt(0, 0, 0);
    controller.tick(seconds, delta);
    renderer.render(scene, camera);
    cssRenderer.render(cssScene, camera);

    if (!firstFrame) {
      firstFrame = true;
      document.documentElement.classList.add("webgl-ready");
      document.documentElement.classList.remove("artifact-fallback-active");
    }
  }

  function onPointerMove(event) {
    if (window.matchMedia("(max-width: 880px), (pointer: coarse)").matches) return;
    pointerX = event.clientX / width * 2 - 1;
    pointerY = event.clientY / height * 2 - 1;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.documentElement);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", () => { running = !document.hidden; });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    contextLosses += 1;
    running = false;
    document.documentElement.classList.remove("webgl-ready");
    if (contextLosses > 1) document.documentElement.classList.add("artifact-fallback-active");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    if (contextLosses > 1) return;
    running = true;
    resize();
  });

  resize();
  const timeline = createPhoneTimeline(controller, stage);
  if (window.scrollY <= document.querySelector(".journey").offsetHeight) stage.classList.add("is-visible");
  gsap.ticker.add(render);
  render(performance.now() / 1000);

  window.addEventListener("pagehide", () => {
    timeline.destroy();
    resizeObserver.disconnect();
    gsap.ticker.remove(render);
    renderer.dispose();
  }, { once: true });

  return true;
}
