import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildBoard, SCENERY_RADIUS } from './boardGeometry.js';
import { createAnimatedScenery } from './animatedScenery.js';

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

  const scenery = createAnimatedScenery(SCENERY_RADIUS);
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

  return { scene, camera, renderer, controls, board };
}
