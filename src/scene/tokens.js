import * as THREE from 'three';
import { cellWorldPosition } from './boardGeometry.js';
import { ZONES } from '../game/zones.js';

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
  group.userData.shirtMat = shirtMat;
  group.userData.hairGroup = hair;
  return group;
}

// Five career "costumes" — one per EEC zone — swapped onto the token the
// moment a player reaches FINISH, so their pawn visibly becomes whichever
// industry they scored highest in.
function buildDigitalCostume(zone) {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: '#2A2118', roughness: 0.35 });
  const lensGeo = new THREE.TorusGeometry(0.026, 0.006, 8, 16);
  [-0.05, 0.05].forEach((ex) => {
    const lens = new THREE.Mesh(lensGeo, frameMat);
    lens.position.set(ex, 0.465, 0.132);
    group.add(lens);
  });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.004, 0.004), frameMat);
  bridge.position.set(0, 0.465, 0.132);
  group.add(bridge);

  const laptop = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.014, 0.1), frameMat);
  const screenMat = new THREE.MeshStandardMaterial({
    color: zone.color, emissive: zone.color, emissiveIntensity: 0.9, roughness: 0.3,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.01), screenMat);
  screen.position.set(0, 0.05, -0.045);
  screen.rotation.x = -0.35;
  laptop.add(base, screen);
  laptop.position.set(0, 0.2, 0.14);
  laptop.rotation.x = -0.25;
  group.add(laptop);
  return group;
}

function buildRoboticsCostume(zone) {
  const group = new THREE.Group();
  const hatMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.4 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.148, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hatMat);
  dome.position.y = 0.49;
  group.add(dome);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.014, 8, 24), hatMat);
  brim.rotation.x = Math.PI / 2;
  brim.position.y = 0.455;
  group.add(brim);

  const toolMat = new THREE.MeshStandardMaterial({ color: '#8A93A1', roughness: 0.35, metalness: 0.6 });
  const wrench = new THREE.Group();
  wrench.add(new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.09, 0.012), toolMat));
  const head1 = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.008, 8, 12, Math.PI), toolMat);
  head1.position.y = 0.05;
  wrench.add(head1);
  wrench.position.set(0.19, 0.17, 0.05);
  wrench.rotation.z = -0.7;
  group.add(wrench);
  return group;
}

function buildLogisticsCostume(zone) {
  const group = new THREE.Group();
  const capMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.4 });
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.15, 0.05, 16), capMat);
  capTop.position.y = 0.5;
  group.add(capTop);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.09), capMat);
  brim.position.set(0, 0.475, 0.09);
  group.add(brim);

  const wingMat = new THREE.MeshStandardMaterial({ color: '#E8C349', roughness: 0.3, metalness: 0.5 });
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.075, 4), wingMat);
    wing.position.set(side * 0.045, 0.3, 0.12);
    wing.rotation.z = side * 1.15;
    wing.rotation.x = 1.5;
    group.add(wing);
  });
  return group;
}

function buildBioCostume(zone) {
  const group = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: '#F5F5F0', roughness: 0.55 });
  const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.17, 6, 12), coatMat);
  coat.position.y = 0.24;
  group.add(coat);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.2, 0.01), new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.5 }));
  stripe.position.set(0, 0.22, 0.13);
  group.add(stripe);

  const goggleMat = new THREE.MeshPhysicalMaterial({ color: zone.color, roughness: 0.2, transparent: true, opacity: 0.5 });
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.02), goggleMat);
  goggles.position.set(0, 0.465, 0.135);
  group.add(goggles);

  const flask = new THREE.Group();
  const flaskMat = new THREE.MeshPhysicalMaterial({ color: '#DCEFE6', roughness: 0.1, transparent: true, opacity: 0.55 });
  flask.add(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 10, 1, true), flaskMat));
  const liquid = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 10, 8),
    new THREE.MeshStandardMaterial({ color: zone.color, emissive: zone.color, emissiveIntensity: 0.6 }),
  );
  liquid.position.y = -0.012;
  flask.add(liquid);
  flask.position.set(0.19, 0.19, 0.03);
  flask.rotation.z = -0.3;
  group.add(flask);
  return group;
}

function buildMedicalCostume(zone) {
  const group = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: '#F5F5F0', roughness: 0.55 });
  const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.135, 0.17, 6, 12), coatMat);
  coat.position.y = 0.24;
  group.add(coat);

  const crossMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.45 });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.05, 0.01), crossMat);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.01), crossMat);
  crossV.position.set(0, 0.24, 0.135);
  crossH.position.set(0, 0.24, 0.135);
  group.add(crossV, crossH);

  const tubeMat = new THREE.MeshStandardMaterial({ color: '#3A4048', roughness: 0.4 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 20, Math.PI * 1.3), tubeMat);
  collar.position.set(0, 0.37, 0.02);
  collar.rotation.x = Math.PI / 2.1;
  group.add(collar);
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.1, 6), tubeMat);
  drop.position.set(0, 0.28, 0.13);
  group.add(drop);
  const chestpiece = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), tubeMat);
  chestpiece.position.set(0, 0.225, 0.13);
  group.add(chestpiece);
  return group;
}

const COSTUME_BUILDERS = {
  dig: buildDigitalCostume,
  rob: buildRoboticsCostume,
  log: buildLogisticsCostume,
  bio: buildBioCostume,
  med: buildMedicalCostume,
};

export function transformTokenForCareer(token, zoneKey) {
  if (token.userData.transformedZone === zoneKey) return;
  const zone = ZONES[zoneKey];
  const builder = COSTUME_BUILDERS[zoneKey];
  if (!zone || !builder) return;

  if (token.userData.costume) {
    token.remove(token.userData.costume);
  }
  token.userData.shirtMat?.color.set(zone.color);
  if (token.userData.hairGroup) {
    token.userData.hairGroup.visible = zoneKey !== 'rob' && zoneKey !== 'log';
  }

  const costume = builder(zone);
  token.add(costume);
  token.userData.costume = costume;
  token.userData.transformedZone = zoneKey;
}

export function placeTokenAtCell(token, cellId) {
  const pos = cellWorldPosition(cellId);
  const [ox, oz] = token.userData.offset;
  token.position.set(pos.x + ox, pos.y, pos.z + oz);
}

export function animateTokenMove(token, fromCell, toCell, { onDone, onUpdate, onHopLand } = {}) {
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
    const hopHeight = 0.16;

    // Face the direction this hop actually travels in world space, instead
    // of turning a fixed 90° every single hop — on a straight run of cells
    // that's the same direction each time, so it only visibly turns where
    // the board path itself turns (each row/column end).
    const startRotY = token.rotation.y;
    let endRotY = startRotY;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    if (Math.abs(dx) > 1e-6 || Math.abs(dz) > 1e-6) {
      const targetRotY = Math.atan2(dx, dz);
      let delta = (targetRotY - startRotY) % (Math.PI * 2);
      if (delta > Math.PI) delta -= Math.PI * 2;
      if (delta < -Math.PI) delta += Math.PI * 2;
      endRotY = startRotY + delta;
    }

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
        onHopLand?.();
        i += 1;
        if (i < steps.length) hop();
        else onDone?.();
      }
    }
    requestAnimationFrame(tick);
  }
  hop();
}
