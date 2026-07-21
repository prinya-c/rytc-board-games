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

  // Cinematic zoom onto a cell when a token lands, then back out to the
  // overview before the mission popup opens — a beat that shows off which
  // cell was landed on without permanently changing the player's view.
  function focusOnCell(cellId, { holdMs = 1100, zoomDistance = 3.4, duration = 750, onDone } = {}) {
    const overviewCamPos = camera.position.clone();
    const overviewTarget = controls.target.clone();
    const savedMinDistance = controls.minDistance;

    const cellPos = cellWorldPosition(cellId);
    const dir = overviewCamPos.clone().sub(overviewTarget).normalize();
    const focusCamPos = cellPos.clone().addScaledVector(dir, zoomDistance);

    controls.enabled = false;
    controls.minDistance = Math.min(savedMinDistance, zoomDistance - 0.5);

    panCamera(overviewCamPos, focusCamPos, overviewTarget, cellPos, duration, () => {
      setTimeout(() => {
        panCamera(focusCamPos, overviewCamPos, cellPos, overviewTarget, duration, () => {
          controls.minDistance = savedMinDistance;
          controls.enabled = true;
          onDone?.();
        });
      }, holdMs);
    });
  }

  return { scene, camera, renderer, controls, board, focusOnCell };
}
