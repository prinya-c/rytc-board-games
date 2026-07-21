import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CELLS } from '../game/cells.js';
import { ZONES } from '../game/zones.js';
import { cellGridPosition, GRID_MAX, isCorner } from '../game/layout.js';
import { createTileTexture, createBoardBackdropTexture, createEmblemTexture, createFacadeTexture, createTitlePlaqueTexture, createLatticeTowerTexture } from './textures.js';

export const CELL_SIZE = 1.2;
export const TILE_HEIGHT = 0.3;
const BOARD_EXTENT = GRID_MAX * CELL_SIZE;
const TRAY_THICKNESS = 0.55;
const TRAY_MARGIN = CELL_SIZE * 2.4;

// Open floor radius inside the tile ring, safe for ambient traffic to loop
// within without ever clipping into the tiles or the center buildings.
export const ARENA_RADIUS = BOARD_EXTENT / 2 - CELL_SIZE * 0.65;

export function gridToWorld(x, y) {
  const half = BOARD_EXTENT / 2;
  return { x: x * CELL_SIZE - half, z: y * CELL_SIZE - half };
}

export function cellWorldPosition(id) {
  const { x, y } = cellGridPosition(id);
  const { x: wx, z: wz } = gridToWorld(x, y);
  return new THREE.Vector3(wx, TILE_HEIGHT, wz);
}

function buildBaseTray() {
  const size = BOARD_EXTENT + TRAY_MARGIN;
  const geo = new RoundedBoxGeometry(size, TRAY_THICKNESS, size, 3, 0.18);
  const topTex = createBoardBackdropTexture();
  const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.92 });
  const sideMat = new THREE.MeshStandardMaterial({ color: '#E0C98F', roughness: 0.85 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: '#B79A5E', roughness: 0.9 });
  // RoundedBoxGeometry inherits BoxGeometry's 6 face groups: px, nx, py, ny, pz, nz
  const materials = [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat];
  const mesh = new THREE.Mesh(geo, materials);
  mesh.position.y = -TRAY_THICKNESS / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function buildTile(cell) {
  const zone = ZONES[cell.zone];
  const corner = isCorner(cell.id);
  const size = corner ? CELL_SIZE * 1.15 : CELL_SIZE * 0.94;
  const geo = new RoundedBoxGeometry(size, TILE_HEIGHT, size, 2, size * 0.1);
  const sideMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.65 });
  const topTex = createTileTexture({
    icon: iconFor(cell),
    color: zone.color,
    soft: zone.soft,
    number: cell.id,
    type: cell.type,
  });
  const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.5 });
  // box material order: px, nx, py, ny, pz, nz
  const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
  const mesh = new THREE.Mesh(geo, materials);
  const pos = cellWorldPosition(cell.id);
  mesh.position.set(pos.x, TILE_HEIGHT / 2, pos.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.cellId = cell.id;
  return mesh;
}

const ICONS = {
  start: '🚩',
  finish: '🏆',
  event: '🎲',
  check: '📊',
};

function iconFor(cell) {
  if (ICONS[cell.type]) return ICONS[cell.type];
  return cell.options?.[0]?.icon ?? '❓';
}

// Rooftop details that hint at each industry, mounted on top of the tower.
function buildRoofAccent(key, zone) {
  const group = new THREE.Group();

  if (key === 'dig') {
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.02, 0.34, 8),
      new THREE.MeshStandardMaterial({ color: '#cfd6e0', roughness: 0.4, metalness: 0.5 }),
    );
    rod.position.y = 0.17;
    group.add(rod);
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 10),
      new THREE.MeshStandardMaterial({ color: '#8fb2ff', emissive: '#4f7dff', emissiveIntensity: 1.4, roughness: 0.3 }),
    );
    beacon.position.y = 0.35;
    group.add(beacon);
  } else if (key === 'rob') {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.07, 0.24, 10),
      new THREE.MeshStandardMaterial({ color: '#9a9a9a', roughness: 0.5, metalness: 0.4 }),
    );
    stack.position.set(-0.13, 0.12, 0);
    group.add(stack);
    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16),
      new THREE.MeshStandardMaterial({ color: '#e8e8e8', roughness: 0.4, metalness: 0.3 }),
    );
    dish.position.set(0.12, 0.16, 0);
    dish.rotation.z = 0.5;
    group.add(dish);
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#ffb27a', emissive: '#ff8a3a', emissiveIntensity: 1.3 }),
    );
    light.position.set(-0.13, 0.26, 0);
    group.add(light);
  } else if (key === 'log') {
    const cupola = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.18, 16),
      new THREE.MeshStandardMaterial({ map: createFacadeTexture(zone.color, 2, 6), roughness: 0.5 }),
    );
    cupola.position.y = 0.09;
    group.add(cupola);
    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.015, 16),
      new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.35, metalness: 0.2, side: THREE.DoubleSide }),
    );
    dish.position.set(0, 0.24, 0);
    dish.rotation.x = 0.9;
    group.add(dish);
  } else if (key === 'bio') {
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({
        color: '#bdf0a8', transparent: true, opacity: 0.65, roughness: 0.2, transmission: 0.15, metalness: 0,
      }),
    );
    group.add(dome);
  } else if (key === 'med') {
    const crossMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
    const vertical = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.28, 0.07, 1, 0.02), crossMat);
    vertical.position.y = 0.18;
    group.add(vertical);
    const horizontal = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.07, 0.07, 1, 0.02), crossMat);
    horizontal.position.y = 0.22;
    group.add(horizontal);
  }

  return group;
}

const BUILDING_HEIGHT = { dig: 1.55, rob: 1.1, log: 0.95, bio: 1.0, med: 1.3 };

function buildSimpleBlock(zone, footprint, h, baseY) {
  const facadeMat = new THREE.MeshStandardMaterial({ map: createFacadeTexture(zone.color), roughness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.5 });
  const geo = new RoundedBoxGeometry(footprint, h, footprint, 2, footprint * 0.12);
  const mats = [facadeMat, facadeMat, roofMat, roofMat, facadeMat, facadeMat];
  const mesh = new THREE.Mesh(geo, mats);
  mesh.position.y = baseY + h / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildZoneBuilding(key) {
  const zone = ZONES[key];
  const group = new THREE.Group();

  // base plaza: zone icon + curved label around the rim, kept clear of the
  // buildings so it stays legible no matter how tall the skyline gets.
  const emblemSize = CELL_SIZE * 1.35;
  const tex = createEmblemTexture({
    icon: { dig: '💻', rob: '🦾', log: '✈️', bio: '🧪', med: '🩺' }[key],
    label: zone.label,
    color: zone.color,
    soft: zone.soft,
  });
  const plazaGeo = new THREE.CylinderGeometry(emblemSize / 2, emblemSize / 2, 0.16, 36);
  const plazaMat = [
    new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.7 }),
  ];
  const plaza = new THREE.Mesh(plazaGeo, plazaMat);
  plaza.position.y = 0.08;
  plaza.castShadow = true;
  plaza.receiveShadow = true;
  group.add(plaza);

  // main tower, centered so the rim label stays uncovered from every angle
  const h = BUILDING_HEIGHT[key];
  const footprint = 0.56;
  const facadeMat = new THREE.MeshStandardMaterial({ map: createFacadeTexture(zone.color), roughness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.5 });
  const towerGeo = new RoundedBoxGeometry(footprint, h, footprint, 2, footprint * 0.1);
  const towerMats = [facadeMat, facadeMat, roofMat, roofMat, facadeMat, facadeMat];
  const tower = new THREE.Mesh(towerGeo, towerMats);
  tower.position.y = 0.16 + h / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  const accent = buildRoofAccent(key, zone);
  accent.position.set(0, 0.16 + h, 0);
  group.add(accent);

  // a shorter companion block for a fuller "mini skyline" silhouette
  const sideH = h * 0.55;
  const sideBlock = buildSimpleBlock(zone, 0.32, sideH, 0.16);
  sideBlock.position.x = footprint * 0.62 + 0.16;
  sideBlock.position.z = -footprint * 0.5;
  group.add(sideBlock);

  return group;
}

function buildLandmarkTower() {
  const group = new THREE.Group();
  const height = 2.5;

  const towerTex = createLatticeTowerTexture();
  const bodyGeo = new THREE.CylinderGeometry(0.045, 0.32, height, 4, 1, false);
  const bodyMat = new THREE.MeshStandardMaterial({ map: towerTex, roughness: 0.55 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = height / 2;
  body.rotation.y = Math.PI / 4;
  body.castShadow = true;
  group.add(body);

  const deckMat = new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.4 });
  const lowerDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.07, 4), deckMat);
  lowerDeck.position.y = height * 0.34;
  lowerDeck.rotation.y = Math.PI / 4;
  lowerDeck.castShadow = true;
  group.add(lowerDeck);

  const upperDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 4), deckMat);
  upperDeck.position.y = height * 0.74;
  upperDeck.rotation.y = Math.PI / 4;
  group.add(upperDeck);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.025, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: '#e2e2e2', metalness: 0.5, roughness: 0.3 }),
  );
  mast.position.y = height + 0.25;
  group.add(mast);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 10, 8),
    new THREE.MeshStandardMaterial({ color: '#ff5050', emissive: '#ff2020', emissiveIntensity: 1.6 }),
  );
  beacon.position.y = height + 0.52;
  group.add(beacon);

  const base = new THREE.Mesh(
    new RoundedBoxGeometry(0.62, 0.16, 0.62, 2, 0.07),
    new THREE.MeshStandardMaterial({ color: '#c9a45c', roughness: 0.8 }),
  );
  base.position.y = 0.08;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const plaqueTex = createTitlePlaqueTexture('ตะลุยโลกอาชีพ', 'EEC New S-Curve Career Quest');
  const plaqueGeo = new THREE.PlaneGeometry(CELL_SIZE * 1.7, CELL_SIZE * 0.56);
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: plaqueTex,
    roughness: 0.55,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaque.position.set(0, 0.56, 0.68);
  plaque.rotation.x = -0.12;
  group.add(plaque);

  return group;
}

function buildCenterEmblems() {
  const group = new THREE.Group();
  const zoneKeys = ['dig', 'rob', 'log', 'bio', 'med'];
  const radius = CELL_SIZE * 1.9;

  zoneKeys.forEach((key, i) => {
    const angle = (i / zoneKeys.length) * Math.PI * 2 - Math.PI / 2;
    const building = buildZoneBuilding(key);
    building.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    building.rotation.y = -angle;
    group.add(building);
  });

  group.add(buildLandmarkTower());

  return group;
}

function buildTree(scale = 1) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 0.32, 8),
    new THREE.MeshStandardMaterial({ color: '#8a5a2b', roughness: 0.85 }),
  );
  trunk.position.y = 0.16;
  trunk.castShadow = true;
  group.add(trunk);

  const foliageMat = new THREE.MeshStandardMaterial({ color: '#5FAE4A', roughness: 0.75 });
  const tiers = [
    { y: 0.42, r: 0.26, h: 0.34 },
    { y: 0.62, r: 0.2, h: 0.3 },
    { y: 0.8, r: 0.14, h: 0.26 },
  ];
  tiers.forEach(({ y, r, h }) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), foliageMat);
    cone.position.y = y;
    cone.castShadow = true;
    group.add(cone);
  });

  group.scale.setScalar(scale);
  return group;
}

function buildCloud(scale = 1) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.92 });
  const puffs = [[0, 0, 0, 0.26], [0.22, 0.03, 0, 0.19], [-0.22, 0.02, 0, 0.19], [0.06, 0.14, 0, 0.16]];
  puffs.forEach(([x, y, z, r]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat);
    puff.position.set(x, y, z);
    group.add(puff);
  });
  group.scale.setScalar(scale);
  return group;
}

export const SCENERY_RADIUS = BOARD_EXTENT / 2 + TRAY_MARGIN * 0.34;

function buildScenery() {
  const group = new THREE.Group();
  const outer = SCENERY_RADIUS;

  const treeSpots = [
    [outer, outer, 1.1], [-outer, outer, 0.9], [outer, -outer, 0.95], [-outer, -outer, 1.15],
    [0, outer, 0.8], [0, -outer, 0.85], [outer, 0, 0.9], [-outer, 0, 1.0],
    [outer * 0.55, outer, 0.7], [-outer * 0.55, outer, 0.75],
    [outer * 0.55, -outer, 0.8], [-outer * 0.55, -outer, 0.7],
    [outer, outer * 0.55, 0.85], [outer, -outer * 0.55, 0.75],
    [-outer, outer * 0.55, 0.8], [-outer, -outer * 0.55, 0.9],
  ];
  treeSpots.forEach(([x, z, scale]) => {
    const tree = buildTree(scale);
    tree.position.set(x, 0, z);
    group.add(tree);
  });

  const cloudSpots = [
    [-outer * 0.7, 3.4, -outer * 0.4, 1.1],
    [outer * 0.8, 3.9, outer * 0.2, 1.4],
    [outer * 0.1, 4.3, -outer * 0.9, 0.9],
  ];
  cloudSpots.forEach(([x, y, z, scale]) => {
    const cloud = buildCloud(scale);
    cloud.position.set(x, y, z);
    group.add(cloud);
  });

  return group;
}

export function buildBoard() {
  const group = new THREE.Group();
  group.add(buildBaseTray());
  CELLS.forEach((cell) => group.add(buildTile(cell)));
  group.add(buildCenterEmblems());
  group.add(buildScenery());
  return group;
}
