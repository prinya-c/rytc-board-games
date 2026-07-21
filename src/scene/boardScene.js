import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildBoard, SCENERY_RADIUS, ARENA_RADIUS, cellWorldPosition } from './boardGeometry.js';
import { createAnimatedScenery } from './animatedScenery.js';

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function createBoardScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#7cc8f7');
  scene.fog = new THREE.Fog('#7cc8f7', 16, 28);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 9.5, 8.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 5;
  controls.maxDistance = 16;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.set(0, 0, 0);
  controls.update();

  const hemi = new THREE.HemisphereLight('#ffffff', '#2f6b2a', 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fffaf0', 2.1);
  sun.position.set(6, 10, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#bfe0ff', 0.55);
  fill.position.set(-7, 6, -5);
  scene.add(fill);
  const rim = new THREE.PointLight('#ffe8b0', 0.6, 20, 2);
  rim.position.set(0, 4, -6);
  scene.add(rim);

  const board = buildBoard();
  scene.add(board);

  const scenery = createAnimatedScenery(ARENA_RADIUS, SCENERY_RADIUS);
  scene.add(scenery.group);
  const clock = new THREE.Clock();

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 300));

  function render() {
    controls.update();
    scenery.update(clock.getElapsedTime());
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  render();

  function panCamera(fromPos, toPos, fromTarget, toTarget, duration, onDone) {
    const start = performance.now();
    function tick(now) {
      const eased = easeInOutQuad(Math.min(1, (now - start) / duration));
      camera.position.lerpVectors(fromPos, toPos, eased);
      controls.target.lerpVectors(fromTarget, toTarget, eased);
      if (eased < 1) {
        requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    }
    requestAnimationFrame(tick);
  }

  // Continuous camera-follow while a token walks: begin tracking as soon as
  // it starts hopping, re-center the look-at point on it every frame, then
  // once it arrives, settle exactly onto the landed cell, hold, and pan back
  // to the saved overview before the mission popup opens.
  let followState = null;

  function beginTokenFollow() {
    followState = {
      overviewCamPos: camera.position.clone(),
      overviewTarget: controls.target.clone(),
      savedMinDistance: controls.minDistance,
    };
    controls.enabled = false;
    controls.minDistance = Math.min(controls.minDistance, 2.5);
  }

  function trackTokenPosition(pos) {
    if (!followState) return;
    // Gentle horizontal trailing (soft chase-cam) so the pan reads as smooth
    // rather than snapping to the token; vertical is even gentler so the
    // hop's little up-and-down arc doesn't make the camera bob with it.
    controls.target.x += (pos.x - controls.target.x) * 0.14;
    controls.target.z += (pos.z - controls.target.z) * 0.14;
    controls.target.y += (pos.y - controls.target.y) * 0.05;
  }

  function endTokenFollow(cellId, { holdMs = 1100, duration = 500, onDone } = {}) {
    if (!followState) {
      onDone?.();
      return;
    }
    const cellPos = cellWorldPosition(cellId);
    const settledCamPos = camera.position.clone();
    const settledTarget = controls.target.clone();

    // snap the look-at point precisely onto the cell center (follow lerp
    // leaves a small trailing offset), then hold, then return to overview.
    panCamera(settledCamPos, settledCamPos, settledTarget, cellPos, 260, () => {
      setTimeout(() => {
        const { overviewCamPos, overviewTarget, savedMinDistance } = followState;
        panCamera(camera.position.clone(), overviewCamPos, cellPos, overviewTarget, duration, () => {
          controls.minDistance = savedMinDistance;
          controls.enabled = true;
          followState = null;
          onDone?.();
        });
      }, holdMs);
    });
  }

  // Hero reveal for the token's career transformation at FINISH: a tighter
  // zoom than the normal per-cell focus, a slow orbit around it while a
  // glowing ring + warm highlight light make it unmistakably the center of
  // attention, then a pan back to the overview.
  function celebrateFinish(cellId, color, { zoomDuration = 800, orbitDuration = 2400, returnDuration = 800, onDone } = {}) {
    if (!followState) {
      onDone?.();
      return;
    }
    const cellPos = cellWorldPosition(cellId);
    const lookAt = cellPos.clone().add(new THREE.Vector3(0, 0.5, 0));
    const startCamPos = camera.position.clone();
    const startTarget = controls.target.clone();

    controls.minDistance = Math.min(controls.minDistance, 1.6);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.62, 40),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cellPos.x, cellPos.y + 0.02, cellPos.z);
    ring.scale.setScalar(0.4);
    scene.add(ring);

    const highlight = new THREE.PointLight(color, 0, 6, 2);
    highlight.position.set(cellPos.x, cellPos.y + 1.6, cellPos.z);
    scene.add(highlight);

    const closeRadius = 2.1;
    const closeHeight = lookAt.y + 1.25;
    const dir0 = startCamPos.clone().sub(cellPos);
    const startAngle = Math.atan2(dir0.z, dir0.x);
    const closeCamPos = new THREE.Vector3(
      cellPos.x + Math.cos(startAngle) * closeRadius,
      closeHeight,
      cellPos.z + Math.sin(startAngle) * closeRadius,
    );

    const introStart = performance.now();
    function introTick(now) {
      const eased = easeInOutQuad(Math.min(1, (now - introStart) / zoomDuration));
      camera.position.lerpVectors(startCamPos, closeCamPos, eased);
      controls.target.lerpVectors(startTarget, lookAt, eased);
      ring.scale.setScalar(0.4 + eased * 0.8);
      ring.material.opacity = 0.55 * eased;
      highlight.intensity = 1.8 * eased;
      if (eased < 1) {
        requestAnimationFrame(introTick);
      } else {
        orbit();
      }
    }
    requestAnimationFrame(introTick);

    function orbit() {
      const orbitStart = performance.now();
      const sweep = Math.PI * 0.34;
      function orbitTick(now) {
        const eased = easeInOutQuad(Math.min(1, (now - orbitStart) / orbitDuration));
        const angle = startAngle + sweep * eased;
        camera.position.set(
          cellPos.x + Math.cos(angle) * closeRadius,
          closeHeight,
          cellPos.z + Math.sin(angle) * closeRadius,
        );
        controls.target.copy(lookAt);
        ring.rotation.z += 0.01;
        if (eased < 1) {
          requestAnimationFrame(orbitTick);
        } else {
          outro();
        }
      }
      requestAnimationFrame(orbitTick);
    }

    function outro() {
      const { overviewCamPos, overviewTarget, savedMinDistance } = followState;
      const fromCamPos = camera.position.clone();
      const fromTarget = controls.target.clone();
      const outroStart = performance.now();
      function outroTick(now) {
        const eased = easeInOutQuad(Math.min(1, (now - outroStart) / returnDuration));
        camera.position.lerpVectors(fromCamPos, overviewCamPos, eased);
        controls.target.lerpVectors(fromTarget, overviewTarget, eased);
        ring.material.opacity = 0.55 * (1 - eased);
        ring.scale.setScalar(1.2 - eased * 0.4);
        highlight.intensity = 1.8 * (1 - eased);
        if (eased < 1) {
          requestAnimationFrame(outroTick);
        } else {
          scene.remove(ring);
          scene.remove(highlight);
          controls.minDistance = savedMinDistance;
          controls.enabled = true;
          followState = null;
          onDone?.();
        }
      }
      requestAnimationFrame(outroTick);
    }
  }

  return { scene, camera, renderer, controls, board, beginTokenFollow, trackTokenPosition, endTokenFollow, celebrateFinish };
}
