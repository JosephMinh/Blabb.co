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
    rail: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#49354e"),
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 0.86,
      clearcoatRoughness: 0.12
    }),
    shell: new THREE.MeshPhysicalMaterial({
      color: palette.plum,
      metalness: 0.68,
      roughness: 0.23,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2
    }),
    edge: new THREE.MeshStandardMaterial({ color: palette.deep, metalness: 0.82, roughness: 0.24 }),
    back: new THREE.MeshPhysicalMaterial({ color: palette.deep, metalness: 0.28, roughness: 0.5, clearcoat: 0.32 }),
    cameraBar: new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#0b070d"), metalness: 0.74, roughness: 0.16, clearcoat: 1 }),
    cameraGlass: new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#060308"), metalness: 0.25, roughness: 0.08, clearcoat: 1 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: palette.paper,
      metalness: 0.02,
      roughness: 0.08,
      transmission: 0.12,
      transparent: true,
      opacity: 0.94,
      clearcoat: 1
    }),
    aqua: new THREE.MeshStandardMaterial({ color: palette.aqua, emissive: palette.aqua, emissiveIntensity: 0.32, roughness: 0.32 }),
    coral: new THREE.MeshStandardMaterial({ color: palette.coral, emissive: palette.coral, emissiveIntensity: 0.38, roughness: 0.3 }),
    forest: new THREE.MeshStandardMaterial({ color: palette.forest, emissive: palette.forest, emissiveIntensity: 0.22, roughness: 0.35 }),
    lilac: new THREE.MeshPhysicalMaterial({ color: palette.lilac, metalness: 0.1, roughness: 0.54, transparent: true, opacity: 0.78 }),
    panelAqua: new THREE.MeshPhysicalMaterial({ color: palette.aqua, emissive: palette.aqua, emissiveIntensity: 0.18, transparent: true, opacity: 0.14, side: THREE.DoubleSide }),
    panelCoral: new THREE.MeshPhysicalMaterial({ color: palette.coral, emissive: palette.coral, emissiveIntensity: 0.1, transparent: true, opacity: 0.12, side: THREE.DoubleSide }),
    panelDeep: new THREE.MeshPhysicalMaterial({ color: palette.deep, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
  };
}
