import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createBalloonTexture } from './textures.js';

function buildCar(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.38, 0.16, 0.19, 1, 0.04),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 }),
  );
  body.position.y = 0.13;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new RoundedBoxGeometry(0.2, 0.1, 0.15, 1, 0.03),
    new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.2, transparent: true, opacity: 0.85 }),
  );
  cabin.position.set(-0.02, 0.22, 0);
  group.add(cabin);

  const wheelMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.6 });
  const wheelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.055, 12);
  [[0.13, 0.06, 0.1], [0.13, 0.06, -0.1], [-0.13, 0.06, 0.1], [-0.13, 0.06, -0.1]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  return group;
}

function buildMotorcycle(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.26, 0.06, 0.06, 1, 0.02),
    new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2 }),
  );
  body.position.y = 0.1;
  group.add(body);

  const rider = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.036, 0.08, 4, 8),
    new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.6 }),
  );
  rider.position.set(0, 0.19, 0);
  group.add(rider);

  const wheelMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.6 });
  const wheelGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.032, 12);
  [[0.11, 0.056, 0], [-0.11, 0.056, 0]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  return group;
}

function buildBird(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), mat);
  group.add(body);

  const wingGeo = new THREE.ConeGeometry(0.011, 0.08, 4);
  const wingL = new THREE.Mesh(wingGeo, mat);
  wingL.rotation.z = Math.PI / 2;
  wingL.position.set(-0.04, 0, 0);
  group.add(wingL);
  const wingR = new THREE.Mesh(wingGeo, mat);
  wingR.rotation.z = -Math.PI / 2;
  wingR.position.set(0.04, 0, 0);
  group.add(wingR);

  group.userData.wings = [wingL, wingR];
  return group;
}

function buildBalloon(scale = 1) {
  const group = new THREE.Group();
  const tex = createBalloonTexture();
  const envelope = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 16),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }),
  );
  envelope.scale.set(1, 1.22, 1);
  envelope.castShadow = true;
  group.add(envelope);

  const basket = new THREE.Mesh(
    new RoundedBoxGeometry(0.1, 0.08, 0.1, 1, 0.015),
    new THREE.MeshStandardMaterial({ color: '#8a5a2b', roughness: 0.8 }),
  );
  basket.position.y = -0.36;
  basket.castShadow = true;
  group.add(basket);

  const ropeMat = new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.7 });
  [[0.065, 0.065], [0.065, -0.065], [-0.065, 0.065], [-0.065, -0.065]].forEach(([x, z]) => {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 4), ropeMat);
    rope.position.set(x, -0.22, z);
    group.add(rope);
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

  // car and motorcycle stay on separate lanes well inside the tile ring,
  // clear of the center buildings so they never clip through anything
  addLoop(buildCar('#FF5A36'), { radius: arenaRadius * 0.86, height: 0, speed: 0.16, phase: 0 });
  addLoop(buildMotorcycle('#2F5CFF'), { radius: arenaRadius * 0.97, height: 0, speed: 0.24, phase: Math.PI * 0.65 });

  addLoop(buildBird('#3a3a3a'), { radius: outerRadius * 0.55, height: 2.3, speed: 0.34, phase: 0 });
  addLoop(buildBird('#7a5a3a'), { radius: outerRadius * 0.7, height: 2.6, speed: -0.28, phase: Math.PI });

  addLoop(buildBalloon(0.85), {
    radius: outerRadius * 0.62, height: 3.5, speed: 0.045, phase: Math.PI * 0.3, bobAmp: 0.12, bobSpeed: 0.4, spin: false,
  });
  addLoop(buildBalloon(1.05), {
    radius: outerRadius * 0.88, height: 4.1, speed: -0.03, phase: Math.PI * 1.4, bobAmp: 0.15, bobSpeed: 0.32, spin: false,
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
