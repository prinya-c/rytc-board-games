import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createBalloonTexture, createWickerTexture } from './textures.js';

// ---------------- Cars ----------------

function buildWheel(radius, width) {
  const group = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 14),
    new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.7 }),
  );
  tire.rotation.z = Math.PI / 2;
  group.add(tire);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.52, radius * 0.52, width * 1.06, 10),
    new THREE.MeshStandardMaterial({ color: '#d8d8d8', roughness: 0.4, metalness: 0.5 }),
  );
  hub.rotation.z = Math.PI / 2;
  group.add(hub);
  return group;
}

function addHeadTailLights(group, halfLength, halfWidth, y) {
  const headMat = new THREE.MeshStandardMaterial({ color: '#fff6c8', emissive: '#ffe89a', emissiveIntensity: 1 });
  const tailMat = new THREE.MeshStandardMaterial({ color: '#ff5050', emissive: '#ff2020', emissiveIntensity: 1 });
  [halfWidth * 0.65, -halfWidth * 0.65].forEach((z) => {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), headMat);
    head.position.set(halfLength, y, z);
    group.add(head);
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), tailMat);
    tail.position.set(-halfLength, y, z);
    group.add(tail);
  });
}

function addMirrors(group, x, halfWidth, y, color) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
  [halfWidth + 0.02, -(halfWidth + 0.02)].forEach((z) => {
    const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.02, 0.025, 1, 0.006), mat);
    mirror.position.set(x, y, z);
    group.add(mirror);
  });
}

function buildSedan(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.38, 0.16, 0.19, 1, 0.04),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.25 }),
  );
  body.position.y = 0.13;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new RoundedBoxGeometry(0.2, 0.1, 0.15, 1, 0.03),
    new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }),
  );
  cabin.position.set(-0.02, 0.22, 0);
  group.add(cabin);

  const bumperMat = new THREE.MeshStandardMaterial({ color: '#262626', roughness: 0.5 });
  const frontBumper = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.09, 0.2, 1, 0.015), bumperMat);
  frontBumper.position.set(0.195, 0.09, 0);
  group.add(frontBumper);
  const rearBumper = frontBumper.clone();
  rearBumper.position.x = -0.195;
  group.add(rearBumper);

  addHeadTailLights(group, 0.205, 0.19, 0.115);
  addMirrors(group, 0.06, 0.095, 0.2, color);

  [[0.13, 0.06, 0.1], [0.13, 0.06, -0.1], [-0.13, 0.06, 0.1], [-0.13, 0.06, -0.1]].forEach(([x, y, z]) => {
    const wheel = buildWheel(0.05, 0.055);
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  return group;
}

function buildVan(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.34, 0.24, 0.2, 1, 0.045),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
  );
  body.position.y = 0.17;
  body.castShadow = true;
  group.add(body);

  const roofAccent = new THREE.Mesh(
    new RoundedBoxGeometry(0.3, 0.045, 0.19, 1, 0.02),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 }),
  );
  roofAccent.position.y = 0.3;
  group.add(roofAccent);

  const windshield = new THREE.Mesh(
    new RoundedBoxGeometry(0.055, 0.13, 0.17, 1, 0.02),
    new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85 }),
  );
  windshield.position.set(0.15, 0.23, 0);
  group.add(windshield);

  const bumperMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.5 });
  const frontBumper = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.1, 0.21, 1, 0.015), bumperMat);
  frontBumper.position.set(0.175, 0.11, 0);
  group.add(frontBumper);
  const rearBumper = frontBumper.clone();
  rearBumper.position.x = -0.175;
  group.add(rearBumper);

  addHeadTailLights(group, 0.185, 0.2, 0.15);
  addMirrors(group, 0.09, 0.1, 0.22, '#ffffff');

  [[0.12, 0.07, 0.11], [0.12, 0.07, -0.11], [-0.12, 0.07, 0.11], [-0.12, 0.07, -0.11]].forEach(([x, y, z]) => {
    const wheel = buildWheel(0.06, 0.06);
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  return group;
}

function buildSportsCar(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 0.1, 0.19, 1, 0.035),
    new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.4 }),
  );
  body.position.y = 0.09;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new RoundedBoxGeometry(0.17, 0.07, 0.15, 1, 0.025),
    new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.3, transparent: true, opacity: 0.85 }),
  );
  cabin.position.set(0.03, 0.15, 0);
  group.add(cabin);

  const spoiler = new THREE.Mesh(
    new RoundedBoxGeometry(0.03, 0.05, 0.21, 1, 0.01),
    new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4 }),
  );
  spoiler.position.set(-0.2, 0.15, 0);
  group.add(spoiler);

  addHeadTailLights(group, 0.205, 0.19, 0.095);

  [[0.16, 0.048, 0.1], [0.16, 0.048, -0.1], [-0.15, 0.048, 0.1], [-0.15, 0.048, -0.1]].forEach(([x, y, z]) => {
    const wheel = buildWheel(0.048, 0.05);
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  return group;
}

// ---------------- Motorcycles ----------------

function buildMotorcycle(color, accent = '#1a1a1a') {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.25 });
  const darkMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 });

  const tank = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.06, 0.065, 1, 0.02), frameMat);
  tank.position.set(0.02, 0.14, 0);
  group.add(tank);

  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.13, 0.03, 0.055, 1, 0.014), darkMat);
  seat.position.set(-0.07, 0.16, 0);
  group.add(seat);

  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.15, 6), darkMat);
  fork.position.set(0.135, 0.1, 0);
  fork.rotation.z = 0.4;
  group.add(fork);

  const handlebar = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.015, 0.14, 1, 0.006), darkMat);
  handlebar.position.set(0.17, 0.195, 0);
  group.add(handlebar);

  const headlight = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#fff6c8', emissive: '#ffdb70', emissiveIntensity: 0.9 }),
  );
  headlight.position.set(0.195, 0.13, 0);
  group.add(headlight);

  const exhaust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 0.15, 8),
    new THREE.MeshStandardMaterial({ color: '#cfcfcf', metalness: 0.6, roughness: 0.3 }),
  );
  exhaust.rotation.z = Math.PI / 2;
  exhaust.position.set(-0.03, 0.075, 0.048);
  group.add(exhaust);

  // lower frame rail so the wheels read as connected to the bike, not floating
  const rail = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.018, 0.02, 1, 0.008), darkMat);
  rail.position.set(0.02, 0.085, 0);
  rail.rotation.z = -0.06;
  group.add(rail);

  const mirrorMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.4 });
  [0.03, -0.03].forEach((z) => {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 6), mirrorMat);
    stalk.position.set(0.165, 0.21, z);
    group.add(stalk);
    const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.018, 0.012, 0.02, 1, 0.004), mirrorMat);
    mirror.position.set(0.17, 0.225, z * 1.6);
    group.add(mirror);
  });

  const tailLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#ff5050', emissive: '#ff2020', emissiveIntensity: 1 }),
  );
  tailLight.position.set(-0.145, 0.145, 0);
  group.add(tailLight);

  const footpeg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), darkMat);
  footpeg.rotation.x = Math.PI / 2;
  footpeg.position.set(-0.01, 0.1, 0);
  group.add(footpeg);

  const rider = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.075, 4, 8), darkMat);
  rider.position.set(-0.02, 0.21, 0);
  rider.rotation.z = -0.28;
  group.add(rider);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.029, 10, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3 }),
  );
  helmet.position.set(0.025, 0.275, 0);
  group.add(helmet);

  const wheelMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.6 });
  const wheelGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.036, 16);
  const hubMat = new THREE.MeshStandardMaterial({ color: '#c8c8c8', roughness: 0.4, metalness: 0.5 });
  const hubGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.038, 8);
  [[0.165, 0.062, 0], [-0.135, 0.062, 0]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(x, y, z);
    group.add(hub);
  });

  return group;
}

// ---------------- Balloons ----------------

function buildBalloon(scale, palette) {
  const group = new THREE.Group();
  const tex = createBalloonTexture(palette);
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 16),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }),
  );
  envelope.scale.set(1, 1.22, 1);
  envelope.position.y = 0.06;
  envelope.castShadow = true;
  group.add(envelope);

  // tapered neck so the envelope reads as an onion shape, not a plain ball
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.03, 0.09, 16),
    new THREE.MeshStandardMaterial({ color: palette[0], roughness: 0.5 }),
  );
  neck.position.y = -0.2;
  group.add(neck);

  const burner = new THREE.Mesh(
    new THREE.ConeGeometry(0.02, 0.045, 8),
    new THREE.MeshStandardMaterial({ color: '#ffcf6b', emissive: '#ff8a1a', emissiveIntensity: 1.4 }),
  );
  burner.position.y = -0.27;
  group.add(burner);

  const wickerTex = createWickerTexture();
  const basket = new THREE.Mesh(
    new RoundedBoxGeometry(0.1, 0.08, 0.1, 1, 0.012),
    new THREE.MeshStandardMaterial({ map: wickerTex, roughness: 0.85 }),
  );
  basket.position.y = -0.36;
  basket.castShadow = true;
  group.add(basket);

  const rimMat = new THREE.MeshStandardMaterial({ color: '#6b4423', roughness: 0.7 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.006, 6, 16), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -0.32;
  group.add(rim);

  const ropeMat = new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.7 });
  [[0.065, 0.065], [0.065, -0.065], [-0.065, 0.065], [-0.065, -0.065]].forEach(([x, z]) => {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 4), ropeMat);
    rope.position.set(x * 0.7, -0.24, z * 0.7);
    group.add(rope);
  });

  group.scale.setScalar(scale);
  return group;
}

const BALLOON_PALETTES = [
  ['#FF5A5F', '#FFC72C', '#FF8A3A', '#EF3A5C'],
  ['#2F5CFF', '#00A99D', '#3FAE2A', '#8FD9FF'],
  ['#A24FE0', '#FF5A5F', '#FFC72C', '#2F5CFF'],
];

// ---------------- Clouds ----------------

const CLOUD_TEMPLATES = [
  [[0, 0, 0, 0.26], [0.22, 0.03, 0, 0.19], [-0.22, 0.02, 0, 0.19], [0.06, 0.14, 0, 0.16]],
  [[0, 0, 0, 0.2], [0.28, 0, 0.04, 0.16], [-0.26, 0.02, -0.03, 0.17], [0.1, 0.12, 0.02, 0.13], [-0.12, 0.1, -0.02, 0.12]],
  [[0, 0, 0, 0.24], [0.18, -0.02, 0.1, 0.15], [-0.2, 0.01, -0.08, 0.16], [0, 0.16, 0, 0.14], [0.15, 0.1, -0.08, 0.11]],
  [[0, 0, 0, 0.16], [0.16, 0.02, 0, 0.13], [-0.16, 0.02, 0, 0.13], [0.32, 0.01, 0, 0.1], [-0.32, 0.01, 0, 0.1]],
];

function buildCloud(templateIdx, scale) {
  const group = new THREE.Group();
  const topMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.92 });
  const underMat = new THREE.MeshStandardMaterial({ color: '#dfe6ec', roughness: 1, transparent: true, opacity: 0.9 });
  const puffs = CLOUD_TEMPLATES[templateIdx % CLOUD_TEMPLATES.length];
  puffs.forEach(([x, y, z, r]) => {
    const jx = x + (Math.random() - 0.5) * 0.03;
    const jy = y + (Math.random() - 0.5) * 0.02;
    const jz = z + (Math.random() - 0.5) * 0.03;
    const jr = r * (0.94 + Math.random() * 0.12);
    const puff = new THREE.Mesh(new THREE.SphereGeometry(jr, 12, 10), topMat);
    puff.position.set(jx, jy, jz);
    group.add(puff);
    // small shaded underside wisp for a touch of volume
    const wisp = new THREE.Mesh(new THREE.SphereGeometry(jr * 0.6, 8, 6), underMat);
    wisp.position.set(jx, jy - jr * 0.55, jz);
    group.add(wisp);
  });
  group.scale.setScalar(scale);
  return group;
}

export function createAnimatedScenery(arenaRadius, outerRadius) {
  const group = new THREE.Group();
  const animations = [];

  function addLoop(mesh, opts) {
    group.add(mesh);
    animations.push({ mesh, type: 'loop', ...opts });
  }

  // cars and motorcycles each get their own concentric lane (so same-type
  // vehicles can never collide with each other), all confined to a band
  // that clears both the center buildings and the tile ring
  addLoop(buildMotorcycle('#2F5CFF', '#1a1a1a'), { radius: arenaRadius * 0.846, height: 0, speed: 0.26, phase: Math.PI * 0.65 });
  addLoop(buildSedan('#FF5A36'), { radius: arenaRadius * 0.871, height: 0, speed: 0.16, phase: 0 });
  addLoop(buildMotorcycle('#EF3A5C', '#2a2a2a'), { radius: arenaRadius * 0.896, height: 0, speed: -0.2, phase: Math.PI * 1.6 });
  addLoop(buildVan('#3FAE2A'), { radius: arenaRadius * 0.92, height: 0, speed: -0.12, phase: Math.PI * 0.45 });
  addLoop(buildMotorcycle('#FFC72C', '#333333'), { radius: arenaRadius * 0.945, height: 0, speed: 0.3, phase: Math.PI * 0.15 });
  addLoop(buildSportsCar('#A24FE0'), { radius: arenaRadius * 0.97, height: 0, speed: 0.22, phase: Math.PI * 1.1 });

  addLoop(buildBalloon(0.85, BALLOON_PALETTES[0]), {
    radius: outerRadius * 0.6, height: 3.5, speed: 0.05, phase: Math.PI * 0.3, bobAmp: 0.16, bobSpeed: 0.4, spin: false,
  });
  addLoop(buildBalloon(1.05, BALLOON_PALETTES[1]), {
    radius: outerRadius * 0.88, height: 4.1, speed: -0.035, phase: Math.PI * 1.4, bobAmp: 0.2, bobSpeed: 0.32, spin: false,
  });
  addLoop(buildBalloon(0.7, BALLOON_PALETTES[2]), {
    radius: outerRadius * 0.42, height: 3.1, speed: 0.065, phase: Math.PI * 1.0, bobAmp: 0.13, bobSpeed: 0.48, spin: false,
  });

  // kept high and well beyond the tray so they read as sky, not as
  // something sitting on the ground, even when their orbit swings near
  // the camera
  const cloudSpots = [
    { idx: 0, radius: outerRadius * 1.15, height: 7.0, speed: 0.014, phase: Math.PI * 0.1, scale: 1.2 },
    { idx: 1, radius: outerRadius * 1.3, height: 7.6, speed: -0.011, phase: Math.PI * 0.9, scale: 1.5 },
    { idx: 2, radius: outerRadius * 1.0, height: 8.2, speed: 0.017, phase: Math.PI * 1.5, scale: 1.0 },
    { idx: 3, radius: outerRadius * 1.45, height: 7.3, speed: -0.013, phase: Math.PI * 0.55, scale: 1.3 },
  ];
  cloudSpots.forEach(({ idx, radius, height, speed, phase, scale }) => {
    addLoop(buildCloud(idx, scale), { radius, height, speed, phase, bobAmp: 0.06, bobSpeed: 0.25, spin: false });
  });

  function update(elapsed) {
    animations.forEach((a) => {
      const angle = elapsed * a.speed + a.phase;
      const x = Math.cos(angle) * a.radius;
      const z = Math.sin(angle) * a.radius;
      const y = a.height + (a.bobAmp ? Math.sin(elapsed * a.bobSpeed) * a.bobAmp : 0);
      a.mesh.position.set(x, y, z);
      if (a.spin !== false) {
        a.mesh.rotation.y = -angle + (Math.PI / 2) * Math.sign(a.speed || 1);
      }
      const wings = a.mesh.userData.wings;
      if (wings) {
        const flap = Math.sin(elapsed * 11) * 0.7;
        wings[0].rotation.x = flap;
        wings[1].rotation.x = -flap;
      }
    });
  }

  return { group, update };
}
