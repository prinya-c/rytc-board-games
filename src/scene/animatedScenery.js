import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

function buildCar(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(0.32, 0.14, 0.16, 1, 0.035),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.15 }),
  );
  body.position.y = 0.12;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new RoundedBoxGeometry(0.17, 0.09, 0.13, 1, 0.03),
    new THREE.MeshStandardMaterial({ color: '#cfe8ff', roughness: 0.25, transparent: true, opacity: 0.85 }),
  );
  cabin.position.set(-0.02, 0.2, 0);
  group.add(cabin);

  const wheelMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.6 });
  const wheelGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12);
  [[0.11, 0.05, 0.09], [0.11, 0.05, -0.09], [-0.11, 0.05, 0.09], [-0.11, 0.05, -0.09]].forEach(([x, y, z]) => {
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
    new RoundedBoxGeometry(0.22, 0.055, 0.05, 1, 0.02),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
  );
  body.position.y = 0.09;
  group.add(body);

  const rider = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.032, 0.07, 4, 8),
    new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.6 }),
  );
  rider.position.set(0, 0.17, 0);
  group.add(rider);

  const wheelMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.6 });
  const wheelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.03, 12);
  [[0.095, 0.05, 0], [-0.095, 0.05, 0]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  return group;
}

function buildAirplane() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35, metalness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({ color: '#2F5CFF', roughness: 0.4 });

  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), bodyMat);
  fuselage.rotation.z = Math.PI / 2;
  group.add(fuselage);

  const wing = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.02, 0.44, 1, 0.01), accentMat);
  group.add(wing);

  const tailWing = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.02, 0.16, 1, 0.01), accentMat);
  tailWing.position.set(-0.15, 0.01, 0);
  group.add(tailWing);

  const tailFin = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.09, 0.02, 1, 0.01), accentMat);
  tailFin.position.set(-0.15, 0.05, 0);
  group.add(tailFin);

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

function buildDog() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#caa06a', roughness: 0.7 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.09, 4, 8), mat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.075;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), mat);
  head.position.set(0.09, 0.09, 0);
  group.add(head);

  const earGeo = new THREE.ConeGeometry(0.014, 0.03, 6);
  [-0.02, 0.02].forEach((dz) => {
    const ear = new THREE.Mesh(earGeo, mat);
    ear.position.set(0.085, 0.12, dz);
    group.add(ear);
  });

  const legGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.06, 6);
  [[-0.05, 0.03, 0.03], [-0.05, 0.03, -0.03], [0.05, 0.03, 0.03], [0.05, 0.03, -0.03]].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, mat);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.007, 0.08, 6), mat);
  tail.position.set(-0.09, 0.11, 0);
  tail.rotation.z = -0.7;
  group.add(tail);
  group.userData.tail = tail;

  return group;
}

export function createAnimatedScenery(outerRadius) {
  const group = new THREE.Group();
  const animations = [];

  function addLoop(mesh, opts) {
    group.add(mesh);
    animations.push({ mesh, type: 'loop', ...opts });
  }

  addLoop(buildCar('#e4572e'), { radius: outerRadius * 0.94, height: 0, speed: 0.16, phase: 0 });
  addLoop(buildMotorcycle('#2F5CFF'), { radius: outerRadius * 0.94, height: 0, speed: 0.26, phase: Math.PI * 0.65 });
  addLoop(buildAirplane(), { radius: outerRadius * 2.1, height: 3.7, speed: 0.07, phase: Math.PI * 0.2, bobAmp: 0.18, bobSpeed: 0.5 });
  addLoop(buildBird('#3a3a3a'), { radius: outerRadius * 0.55, height: 2.3, speed: 0.34, phase: 0 });
  addLoop(buildBird('#7a5a3a'), { radius: outerRadius * 0.7, height: 2.6, speed: -0.28, phase: Math.PI });

  const dog = buildDog();
  const dogHome = new THREE.Vector3(outerRadius * 0.68, 0, outerRadius * 0.32);
  dog.position.copy(dogHome);
  group.add(dog);
  animations.push({ mesh: dog, type: 'wander', home: dogHome, amp: 0.55, speed: 0.55 });

  function update(elapsed) {
    animations.forEach((a) => {
      if (a.type === 'loop') {
        const angle = elapsed * a.speed + a.phase;
        const x = Math.cos(angle) * a.radius;
        const z = Math.sin(angle) * a.radius;
        const y = a.height + (a.bobAmp ? Math.sin(elapsed * a.bobSpeed) * a.bobAmp : 0);
        a.mesh.position.set(x, y, z);
        a.mesh.rotation.y = -angle + Math.PI / 2 * Math.sign(a.speed || 1);
        const wings = a.mesh.userData.wings;
        if (wings) {
          const flap = Math.sin(elapsed * 11) * 0.7;
          wings[0].rotation.x = flap;
          wings[1].rotation.x = -flap;
        }
      } else if (a.type === 'wander') {
        const t = Math.sin(elapsed * a.speed);
        const dir = Math.cos(elapsed * a.speed);
        a.mesh.position.x = a.home.x + t * a.amp;
        a.mesh.rotation.y = dir >= 0 ? 0 : Math.PI;
        if (a.mesh.userData.tail) {
          a.mesh.userData.tail.rotation.z = -0.7 + Math.sin(elapsed * 7) * 0.3;
        }
      }
    });
  }

  return { group, update };
}
