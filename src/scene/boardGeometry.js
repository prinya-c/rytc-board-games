import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CELLS } from '../game/cells.js';
import { ZONES } from '../game/zones.js';
import { cellGridPosition, GRID_MAX, isCorner } from '../game/layout.js';
import { createTileTexture, createBoardBackdropTexture, createEmblemTexture, createTitlePlaqueTexture } from './textures.js';

export const CELL_SIZE = 1.2;
export const TILE_HEIGHT = 0.3;
const BOARD_EXTENT = GRID_MAX * CELL_SIZE;
const TRAY_THICKNESS = 0.55;
const TRAY_MARGIN = CELL_SIZE * 2.4;

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

function buildCenterEmblems() {
  const group = new THREE.Group();
  const zoneKeys = ['dig', 'rob', 'log', 'bio', 'med'];
  const radius = CELL_SIZE * 1.6;
  const emblemSize = CELL_SIZE * 1.15;

  zoneKeys.forEach((key, i) => {
    const angle = (i / zoneKeys.length) * Math.PI * 2 - Math.PI / 2;
    const zone = ZONES[key];
    const tex = createEmblemTexture({
      icon: { dig: '💻', rob: '🦾', log: '✈️', bio: '🧪', med: '🩺' }[key],
      label: zone.label,
      color: zone.color,
      soft: zone.soft,
    });
    const geo = new THREE.CylinderGeometry(emblemSize / 2, emblemSize / 2, 0.2, 32);
    const mat = [
      new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.7 }),
    ];
    const disc = new THREE.Mesh(geo, mat);
    disc.position.set(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);
  });

  // upright signpost with the game title, standing in the center
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.75, 12),
    new THREE.MeshStandardMaterial({ color: '#8a6a3a', roughness: 0.8 }),
  );
  post.position.y = 0.375;
  post.castShadow = true;
  group.add(post);

  const plaqueTex = createTitlePlaqueTexture('ตะลุยโลกอาชีพ', 'EEC New S-Curve Career Quest');
  const plaqueGeo = new THREE.PlaneGeometry(CELL_SIZE * 2.6, CELL_SIZE * 0.86);
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: plaqueTex,
    roughness: 0.55,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaque.position.set(0, 1.05, 0);
  plaque.castShadow = true;
  group.add(plaque);

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

function buildScenery() {
  const group = new THREE.Group();
  const outer = BOARD_EXTENT / 2 + TRAY_MARGIN * 0.34;

  const treeSpots = [
    [outer, outer, 1.1], [-outer, outer, 0.9], [outer, -outer, 0.95], [-outer, -outer, 1.15],
    [0, outer, 0.8], [0, -outer, 0.85],
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
