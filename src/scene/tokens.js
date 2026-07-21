import * as THREE from 'three';
import { cellWorldPosition } from './boardGeometry.js';

const TOKEN_OFFSETS = [
  [-0.22, -0.22],
  [0.22, -0.22],
  [-0.22, 0.22],
  [0.22, 0.22],
];

// Hair presets rotate per player index so pawns stay distinguishable
// even for players who happen to pick similar shirt colors.
const HAIR_STYLES = [
  { color: '#3B2A20', style: 'round' },
  { color: '#241A14', style: 'spiky' },
  { color: '#8A5A2B', style: 'bun' },
  { color: '#D9A441', style: 'round' },
];

function buildHair(style, color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });

  if (style === 'spiky') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.13, 8), mat);
      spike.position.set(Math.cos(a) * 0.1, 0.1, Math.sin(a) * 0.1);
      spike.rotation.x = Math.cos(a) * 0.5;
      spike.rotation.z = -Math.sin(a) * 0.5;
      group.add(spike);
    }
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), mat);
    group.add(cap);
  } else if (style === 'bun') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mat);
    group.add(cap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat);
    bun.position.set(0, 0.16, 0);
    group.add(bun);
  } else {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.148, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58), mat);
    group.add(cap);
  }
  return group;
}

export function createToken(color, index) {
  const group = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#F4C89B', roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#2A2118', roughness: 0.4 });
  const cheekMat = new THREE.MeshStandardMaterial({ color: '#E8827A', roughness: 0.7, transparent: true, opacity: 0.55 });

  // legs
  const legGeo = new THREE.CapsuleGeometry(0.045, 0.1, 4, 8);
  [-0.06, 0.06].forEach((lx) => {
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(lx, 0.09, 0);
    leg.castShadow = true;
    group.add(leg);
  });

  // body (shirt)
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.14, 6, 12), shirtMat);
  body.position.y = 0.26;
  body.castShadow = true;
  group.add(body);

  // arms
  const armGeo = new THREE.CapsuleGeometry(0.035, 0.11, 4, 8);
  [-0.15, 0.15].forEach((ax) => {
    const arm = new THREE.Mesh(armGeo, shirtMat);
    arm.position.set(ax, 0.24, 0);
    arm.rotation.z = ax > 0 ? -0.35 : 0.35;
    arm.castShadow = true;
    group.add(arm);
  });

  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 16), skinMat);
  head.position.y = 0.46;
  head.castShadow = true;
  group.add(head);

  // face: eyes + cheeks (front-facing, +Z)
  const eyeGeo = new THREE.SphereGeometry(0.014, 8, 8);
  [-0.05, 0.05].forEach((ex) => {
    const eye = new THREE.Mesh(eyeGeo, darkMat);
    eye.position.set(ex, 0.465, 0.128);
    group.add(eye);
  });
  const cheekGeo = new THREE.CircleGeometry(0.022, 12);
  [-0.085, 0.085].forEach((cx) => {
    const cheek = new THREE.Mesh(cheekGeo, cheekMat);
    cheek.position.set(cx, 0.44, 0.118);
    cheek.lookAt(cx * 4, 0.44, 1);
    group.add(cheek);
  });

  // hair
  const { color: hairColor, style } = HAIR_STYLES[index % HAIR_STYLES.length];
  const hair = buildHair(style, hairColor);
  hair.position.y = 0.46;
  group.add(hair);

  group.userData.offset = TOKEN_OFFSETS[index] ?? [0, 0];
  return group;
}

export function placeTokenAtCell(token, cellId) {
  const pos = cellWorldPosition(cellId);
  const [ox, oz] = token.userData.offset;
  token.position.set(pos.x + ox, pos.y, pos.z + oz);
}

export function animateTokenMove(token, fromCell, toCell, { onDone, onUpdate } = {}) {
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
    const baseY = targetPos.y;
    const start = token.position.clone();
    const end = new THREE.Vector3(targetPos.x + ox, baseY, targetPos.z + oz);
    // Slow enough that a camera trying to track the token step-by-step can
    // actually keep up with it instead of snapping between cells.
    const duration = 420;
    const startTime = performance.now();
    const hopHeight = 0.35;
    const startRotY = token.rotation.y;
    const endRotY = startRotY + Math.PI * 0.5 * dir;

    function tick(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t * (2 - t);
      token.position.lerpVectors(start, end, eased);
      token.position.y = baseY + Math.sin(t * Math.PI) * hopHeight;
      token.rotation.y = startRotY + (endRotY - startRotY) * eased;
      onUpdate?.(token.position);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        token.position.y = baseY;
        i += 1;
        if (i < steps.length) hop();
        else onDone?.();
      }
    }
    requestAnimationFrame(tick);
  }
  hop();
}
