import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createDicePipTexture } from './textures.js';

// Euler rotation that brings the pip-value face to point up (+Y), from the die's rest pose.
const FACE_ROTATION = {
  1: new THREE.Euler(0, 0, 0),
  2: new THREE.Euler(0, 0, Math.PI / 2),
  3: new THREE.Euler(-Math.PI / 2, 0, 0),
  4: new THREE.Euler(Math.PI / 2, 0, 0),
  5: new THREE.Euler(0, 0, -Math.PI / 2),
  6: new THREE.Euler(Math.PI, 0, 0),
};

export function createDice() {
  const size = 0.66;
  const geo = new RoundedBoxGeometry(size, size, size, 4, size * 0.16);
  // box material order: px(2), nx(5), py(1), ny(6), pz(3), nz(4)
  const faceValues = [2, 5, 1, 6, 3, 4];
  const materials = faceValues.map((v) => new THREE.MeshPhysicalMaterial({
    map: createDicePipTexture(v),
    roughness: 0.22,
    metalness: 0.04,
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
  }));
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function rollDiceAnimation(mesh, value, { onDone } = {}) {
  const start = { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z };
  const target = FACE_ROTATION[value];
  const spins = 2 + Math.floor(Math.random() * 2);
  const end = {
    x: target.x + Math.PI * 2 * spins,
    y: target.y + Math.PI * 2 * spins * 0.6,
    z: target.z + Math.PI * 2 * spins * 0.4,
  };
  const duration = 700;
  const startTime = performance.now();

  const bounceHeight = 0.5;
  const baseY = mesh.position.y;

  function tick(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    mesh.rotation.x = start.x + (end.x - start.x) * eased;
    mesh.rotation.y = start.y + (end.y - start.y) * eased;
    mesh.rotation.z = start.z + (end.z - start.z) * eased;
    mesh.position.y = baseY + Math.sin(t * Math.PI) * bounceHeight;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      mesh.rotation.set(target.x, target.y, target.z);
      mesh.position.y = baseY;
      onDone?.();
    }
  }
  requestAnimationFrame(tick);
}
