import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildBoard, SCENERY_RADIUS, ARENA_RADIUS } from './boardGeometry.js';
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

  function endTokenFollow(tokenPos, { holdMs = 1100, duration = 500, onDone } = {}) {
    if (!followState) {
      onDone?.();
      return;
    }
    const cellPos = tokenPos.clone();
    const settledCamPos = camera.position.clone();
    const settledTarget = controls.target.clone();

    // snap the look-at point precisely onto the token itself (follow lerp
    // leaves a small trailing offset — and cell center isn't quite right
    // either, since a token can sit off-center within its cell when sharing
    // a tile with other players), then hold, then return to overview.
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

  // Hero reveal for the token's career transformation at FINISH: zoom in
  // dead-on to the token's own facing direction, hold it centered and
  // static for a couple seconds so its costume is easy to actually look at
  // (a glowing ring + warm highlight light keep it the center of attention),
  // then pan back to the overview.
  function celebrateFinish(tokenPos, color, facingAngle, { zoomDuration = 850, holdMs = 2600, returnDuration = 800, onDone } = {}) {
    if (!followState) {
      onDone?.();
      return;
    }
    // Aim at the token's own position, not the cell center — tokens sitting
    // on a shared FINISH tile are offset from the tile's middle, and at this
    // close a zoom that gap is very visible if ignored.
    const cellPos = tokenPos.clone();
    const lookAt = cellPos.clone().add(new THREE.Vector3(0, 0.52, 0));
    const startCamPos = camera.position.clone();
    const startTarget = controls.target.clone();

    controls.minDistance = Math.min(controls.minDistance, 1.0);

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

    // Stand directly in front of the token's actual facing direction (not
    // wherever the free-roam camera happened to be) so the "front" really is
    // its front, and keep it dead-centered in frame the whole time.
    const closeRadius = 1.35;
    const closeHeight = 0.78;
    const front = new THREE.Vector3(Math.sin(facingAngle), 0, Math.cos(facingAngle));
    const closeCamPos = new THREE.Vector3(
      cellPos.x + front.x * closeRadius,
      closeHeight,
      cellPos.z + front.z * closeRadius,
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
        // Static hold, dead-on and centered — no orbiting — so the costume
        // is actually easy to look at instead of sliding past in motion.
        camera.position.copy(closeCamPos);
        controls.target.copy(lookAt);
        setTimeout(outro, holdMs);
      }
    }
    requestAnimationFrame(introTick);

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
