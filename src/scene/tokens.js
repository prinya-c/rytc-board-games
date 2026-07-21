import * as THREE from 'three';
import { cellWorldPosition } from './boardGeometry.js';
import { ZONES } from '../game/zones.js';

const TOKEN_OFFSETS = [
  [-0.22, -0.22],
  [0.22, -0.22],
  [-0.22, 0.22],
  [0.22, 0.22],
];

// Body anchor points, ground (feet) at y = 0. More adult-proportioned than
// the old chibi build — smaller head-to-body ratio, a neck, and longer,
// slimmer limbs — while still just primitive capsules/spheres, no rigging.
const HIP_Y = 0.24;
const TORSO_Y = 0.415;
const TORSO_RADIUS = 0.095;
const SHOULDER_Y = 0.5;
const NECK_Y = 0.615;
const HEAD_Y = 0.74;
const HEAD_R = 0.1;

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

  // legs — longer and slimmer than the old chibi capsules for a real stance
  const legGeo = new THREE.CapsuleGeometry(0.038, 0.15, 4, 8);
  [-0.055, 0.055].forEach((lx) => {
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(lx, HIP_Y / 2 - 0.003, 0);
    leg.castShadow = true;
    group.add(leg);
  });

  // torso (shirt) — narrower waist, sits right on the hip line
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(TORSO_RADIUS, 0.16, 6, 12), shirtMat);
  body.position.y = TORSO_Y;
  body.castShadow = true;
  group.add(body);

  // neck — the key change that reads as "human" instead of head-glued-to-body
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.037, 0.05, 10), skinMat);
  neck.position.y = NECK_Y;
  group.add(neck);

  // arms — attached at shoulder height, slimmer and longer
  const armGeo = new THREE.CapsuleGeometry(0.032, 0.15, 4, 8);
  [-0.135, 0.135].forEach((ax) => {
    const arm = new THREE.Mesh(armGeo, shirtMat);
    arm.position.set(ax, SHOULDER_Y, 0);
    arm.rotation.z = ax > 0 ? -0.2 : 0.2;
    arm.castShadow = true;
    group.add(arm);
  });

  // head — smaller relative to the body than the old chibi build
  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 20, 16), skinMat);
  head.position.y = HEAD_Y;
  head.castShadow = true;
  group.add(head);

  // face: eyes + cheeks (front-facing, +Z)
  const eyeGeo = new THREE.SphereGeometry(0.011, 8, 8);
  [-0.037, 0.037].forEach((ex) => {
    const eye = new THREE.Mesh(eyeGeo, darkMat);
    eye.position.set(ex, HEAD_Y + 0.005, HEAD_R * 0.94);
    group.add(eye);
  });
  const cheekGeo = new THREE.CircleGeometry(0.017, 12);
  [-0.062, 0.062].forEach((cx) => {
    const cheek = new THREE.Mesh(cheekGeo, cheekMat);
    cheek.position.set(cx, HEAD_Y - 0.02, HEAD_R * 0.87);
    cheek.lookAt(cx * 4, HEAD_Y - 0.02, 1);
    group.add(cheek);
  });

  // hair
  const { color: hairColor, style } = HAIR_STYLES[index % HAIR_STYLES.length];
  const hair = buildHair(style, hairColor);
  hair.scale.setScalar(HEAD_R / 0.135);
  hair.position.y = HEAD_Y;
  group.add(hair);

  group.userData.offset = TOKEN_OFFSETS[index] ?? [0, 0];
  group.userData.shirtMat = shirtMat;
  group.userData.hairGroup = hair;
  return group;
}

// Five career "costumes" — one per EEC zone — swapped onto the token the
// moment a player reaches FINISH, so their pawn visibly becomes whichever
// industry they scored highest in. Each costume fully sleeves the arms (not
// just the torso) so the original shirt color never peeks out past it, and
// hair is hidden for all five so it never coincidentally clashes with a
// hat/headpiece color.
function sleeveArms(group, mat, radius = 0.038) {
  const geo = new THREE.CapsuleGeometry(radius, 0.15, 4, 8);
  [-0.135, 0.135].forEach((ax) => {
    const sleeve = new THREE.Mesh(geo, mat);
    sleeve.position.set(ax, SHOULDER_Y, 0);
    sleeve.rotation.z = ax > 0 ? -0.2 : 0.2;
    group.add(sleeve);
  });
}

function buildDigitalCostume(zone) {
  const group = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.45 });
  sleeveArms(group, shirtMat);

  const headsetMat = new THREE.MeshStandardMaterial({ color: '#2A2118', roughness: 0.35, metalness: 0.3 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.009, 8, 20, Math.PI), headsetMat);
  band.position.set(0, HEAD_Y + 0.09, 0);
  band.rotation.z = Math.PI;
  group.add(band);
  [-1, 1].forEach((side) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), headsetMat);
    cup.position.set(side * 0.1, HEAD_Y, 0);
    cup.rotation.z = Math.PI / 2;
    group.add(cup);
  });

  const frameMat = new THREE.MeshStandardMaterial({ color: '#1B1F2A', roughness: 0.3 });
  const lensGeo = new THREE.TorusGeometry(0.033, 0.008, 8, 16);
  [-0.037, 0.037].forEach((ex) => {
    const lens = new THREE.Mesh(lensGeo, frameMat);
    lens.position.set(ex, HEAD_Y + 0.005, HEAD_R * 0.97);
    group.add(lens);
  });
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.006), frameMat);
  bridge.position.set(0, HEAD_Y + 0.005, HEAD_R * 0.97);
  group.add(bridge);

  const laptop = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.016, 0.13), frameMat);
  const screenMat = new THREE.MeshStandardMaterial({
    color: zone.color, emissive: zone.color, emissiveIntensity: 0.9, roughness: 0.3,
  });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.012), screenMat);
  screen.position.set(0, 0.065, -0.058);
  screen.rotation.x = -0.35;
  laptop.add(base, screen);
  laptop.position.set(0, 0.34, 0.17);
  laptop.rotation.x = -0.3;
  group.add(laptop);
  return group;
}

function buildRoboticsCostume(zone) {
  const group = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.45 });
  sleeveArms(group, shirtMat);

  const vestMat = new THREE.MeshStandardMaterial({ color: '#E8C349', roughness: 0.5 });
  [-1, 1].forEach((side) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.19, 0.012), vestMat);
    strap.position.set(side * 0.045, TORSO_Y, HEAD_R * 0.85);
    strap.rotation.z = side * 0.3;
    group.add(strap);
  });

  const hatMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.4 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R * 1.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hatMat);
  dome.position.y = HEAD_Y + 0.03;
  group.add(dome);
  const brim = new THREE.Mesh(new THREE.TorusGeometry(HEAD_R * 1.1, 0.014, 8, 24), hatMat);
  brim.rotation.x = Math.PI / 2;
  brim.position.y = HEAD_Y - 0.005;
  group.add(brim);

  const toolMat = new THREE.MeshStandardMaterial({ color: '#8A93A1', roughness: 0.35, metalness: 0.6 });
  const wrench = new THREE.Group();
  wrench.add(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.11, 0.014), toolMat));
  const head1 = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.009, 8, 12, Math.PI), toolMat);
  head1.position.y = 0.06;
  wrench.add(head1);
  wrench.position.set(0.2, 0.33, 0.07);
  wrench.rotation.z = -0.7;
  group.add(wrench);
  return group;
}

function buildLogisticsCostume(zone) {
  const group = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.45 });
  sleeveArms(group, shirtMat);

  const goldMat = new THREE.MeshStandardMaterial({ color: '#E8C349', roughness: 0.3, metalness: 0.5 });
  [-1, 1].forEach((side) => {
    const epaulette = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.05), goldMat);
    epaulette.position.set(side * 0.13, SHOULDER_Y + 0.08, 0);
    group.add(epaulette);
  });

  const capMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.4 });
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(HEAD_R * 1.1, HEAD_R * 1.14, 0.055, 16), capMat);
  capTop.position.y = HEAD_Y + 0.07;
  group.add(capTop);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.09), capMat);
  brim.position.set(0, HEAD_Y + 0.03, 0.09);
  group.add(brim);
  const capBadge = new THREE.Mesh(new THREE.CircleGeometry(0.02, 12), goldMat);
  capBadge.position.set(0, HEAD_Y + 0.04, HEAD_R * 1.11);
  group.add(capBadge);

  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 4), goldMat);
    wing.position.set(side * 0.05, SHOULDER_Y - 0.12, HEAD_R * 0.95);
    wing.rotation.z = side * 1.15;
    wing.rotation.x = 1.5;
    group.add(wing);
  });
  return group;
}

function buildCoatBase(zone) {
  const group = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: '#F5F5F0', roughness: 0.55 });
  const coat = new THREE.Mesh(new THREE.CapsuleGeometry(TORSO_RADIUS + 0.014, 0.18, 6, 12), coatMat);
  coat.position.y = TORSO_Y - 0.01;
  group.add(coat);
  sleeveArms(group, coatMat, 0.036);
  return { group, coatMat };
}

function buildBioCostume(zone) {
  const { group, coatMat } = buildCoatBase(zone);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.24, 0.01), new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.5 }));
  stripe.position.set(0, TORSO_Y, HEAD_R * 0.95);
  group.add(stripe);

  const goggleMat = new THREE.MeshPhysicalMaterial({ color: zone.color, roughness: 0.2, transparent: true, opacity: 0.55 });
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.038, 0.025), goggleMat);
  goggles.position.set(0, HEAD_Y + 0.005, HEAD_R * 0.97);
  group.add(goggles);
  const strapMat = new THREE.MeshStandardMaterial({ color: '#2A2118', roughness: 0.5 });
  const strap = new THREE.Mesh(new THREE.TorusGeometry(HEAD_R * 1.02, 0.006, 6, 16, Math.PI), strapMat);
  strap.position.set(0, HEAD_Y + 0.005, 0);
  strap.rotation.y = Math.PI / 2;
  group.add(strap);

  const flask = new THREE.Group();
  const flaskMat = new THREE.MeshPhysicalMaterial({ color: '#DCEFE6', roughness: 0.1, transparent: true, opacity: 0.55 });
  flask.add(new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.065, 10, 1, true), flaskMat));
  const liquid = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 10, 8),
    new THREE.MeshStandardMaterial({ color: zone.color, emissive: zone.color, emissiveIntensity: 0.6 }),
  );
  liquid.position.y = -0.015;
  flask.add(liquid);
  flask.position.set(0.2, 0.32, 0.04);
  flask.rotation.z = -0.3;
  group.add(flask);
  return group;
}

function buildMedicalCostume(zone) {
  const { group } = buildCoatBase(zone);

  const crossMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.45 });
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.065, 0.012), crossMat);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.018, 0.012), crossMat);
  crossV.position.set(0, TORSO_Y + 0.06, HEAD_R * 0.95);
  crossH.position.set(0, TORSO_Y + 0.06, HEAD_R * 0.95);
  group.add(crossV, crossH);

  const tubeMat = new THREE.MeshStandardMaterial({ color: '#3A4048', roughness: 0.4 });
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 8, 20, Math.PI * 1.3), tubeMat);
  collar.position.set(0, NECK_Y - 0.02, 0.015);
  collar.rotation.x = Math.PI / 2.1;
  group.add(collar);
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 6), tubeMat);
  drop.position.set(0, TORSO_Y + 0.12, HEAD_R * 0.95);
  group.add(drop);
  const chestpiece = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), tubeMat);
  chestpiece.position.set(0, TORSO_Y + 0.04, HEAD_R * 0.95);
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
  // The costume's own sleeves/coat fully cover the original shirt/arms, and
  // hair is hidden for every zone so it never coincidentally clashes with a
  // hat or headpiece color — the costume alone carries the identity now.
  if (token.userData.hairGroup) {
    token.userData.hairGroup.visible = false;
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
