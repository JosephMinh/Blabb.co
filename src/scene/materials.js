import * as THREE from "three";

export const palette = {
  plum: new THREE.Color("#170a1c"),
  nearBlack: new THREE.Color("#110715"),
  deep: new THREE.Color("#211226"),
  aqua: new THREE.Color("#88e0d9"),
  coral: new THREE.Color("#ef8354"),
  lilac: new THREE.Color("#eddfef"),
  forest: new THREE.Color("#32533d"),
  paper: new THREE.Color("#fffaff")
};

export function createMaterials() {
  return {
    // Brand-critical bubble surfaces bypass lighting and tone mapping so their
    // displayed sRGB values remain identical to Branding.md at every angle.
    plum: new THREE.MeshBasicMaterial({ color: palette.plum, toneMapped: false }),
    aqua: new THREE.MeshBasicMaterial({ color: palette.aqua, toneMapped: false }),
    coral: new THREE.MeshBasicMaterial({ color: palette.coral, toneMapped: false }),
    forest: new THREE.MeshBasicMaterial({ color: palette.forest, toneMapped: false }),
    panelDeep: new THREE.MeshPhysicalMaterial({ color: palette.deep, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
  };
}
