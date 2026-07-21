import * as THREE from 'three';
import { cellWorldPosition } from './boardGeometry.js';

const TOKEN_OFFSETS = [
  [-0.22, -0.22],
  [0.22, -0.22],
  [-0.22, 0.22],
  [0.22, 0.22],
];

export function createToken(color, index) {
  const group = new THREE.Group();
  const bodyGeo = new THREE.CapsuleGeometry(0.14, 0.22, 4, 10);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.05 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.24;
  body.castShadow = true;
  const headGeo = new THREE.SphereGeometry(0.13, 16, 16);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.position.y = 0.44;
  head.castShadow = true;
  group.add(body, head);
  group.userData.offset = TOKEN_OFFSETS[index] ?? [0, 0];
  return group;
}

export function placeTokenAtCell(token, cellId) {
  const pos = cellWorldPosition(cellId);
  const [ox, oz] = token.userData.offset;
  token.position.set(pos.x + ox, 0.16, pos.z + oz);
}

export function animateTokenMove(token, fromCell, toCell, { onDone } = {}) {
  const steps = [];
  const dir = toCell > fromCell ? 1 : -1;
  for (let c = fromCell; c !== toCell; c += dir) steps.push(c + dir);
  if (steps.length === 0) {
    onDone?.();
    return;
  }

  let i = 0;
  function hop() {
    const target = steps[i];
    const [ox, oz] = token.userData.offset;
    const targetPos = cellWorldPosition(target);
    const start = token.position.clone();
    const end = new THREE.Vector3(targetPos.x + ox, 0.16, targetPos.z + oz);
    const duration = 220;
    const startTime = performance.now();
    const hopHeight = 0.35;

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t * (2 - t);
      token.position.lerpVectors(start, end, eased);
      token.position.y = 0.16 + Math.sin(t * Math.PI) * hopHeight;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        token.position.y = 0.16;
        i += 1;
        if (i < steps.length) hop();
        else onDone?.();
      }
    }
    requestAnimationFrame(tick);
  }
  hop();
}
