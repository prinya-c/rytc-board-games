import * as THREE from 'three';
import { CELLS } from '../game/cells.js';
import { ZONES } from '../game/zones.js';
import { cellGridPosition, GRID_MAX, isCorner } from '../game/layout.js';
import { createTileTexture, createBoardBackdropTexture, createEmblemTexture, createTitlePlaqueTexture } from './textures.js';

export const CELL_SIZE = 1.2;
const TILE_HEIGHT = 0.16;
const BOARD_EXTENT = GRID_MAX * CELL_SIZE;

export function gridToWorld(x, y) {
  const half = BOARD_EXTENT / 2;
  return { x: x * CELL_SIZE - half, z: y * CELL_SIZE - half };
}

export function cellWorldPosition(id) {
  const { x, y } = cellGridPosition(id);
  const { x: wx, z: wz } = gridToWorld(x, y);
  return new THREE.Vector3(wx, TILE_HEIGHT, wz);
}

function buildBackdrop() {
  const size = BOARD_EXTENT + CELL_SIZE * 2.2;
  const geo = new THREE.PlaneGeometry(size, size);
  const tex = createBoardBackdropTexture();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.02;
  mesh.receiveShadow = true;
  return mesh;
}

function buildTile(cell) {
  const zone = ZONES[cell.zone];
  const corner = isCorner(cell.id);
  const size = corner ? CELL_SIZE * 1.15 : CELL_SIZE * 0.94;
  const geo = new THREE.BoxGeometry(size, TILE_HEIGHT, size);
  const sideMat = new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.7 });
  const topTex = createTileTexture({
    icon: iconFor(cell),
    color: zone.color,
    soft: zone.soft,
    number: cell.id,
    type: cell.type,
  });
  const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.55 });
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
    const geo = new THREE.CylinderGeometry(emblemSize / 2, emblemSize / 2, 0.1, 32);
    const mat = [
      new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: zone.color, roughness: 0.7 }),
    ];
    const disc = new THREE.Mesh(geo, mat);
    disc.position.set(Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius);
    disc.castShadow = true;
    disc.receiveShadow = true;
    group.add(disc);
  });

  // title plaque hovering above the center
  const plaqueTex = createTitlePlaqueTexture('ตะลุยโลกอาชีพ', 'EEC New S-Curve Career Quest');
  const plaqueGeo = new THREE.PlaneGeometry(CELL_SIZE * 3.1, CELL_SIZE * 1.03);
  const plaqueMat = new THREE.MeshStandardMaterial({ map: plaqueTex, roughness: 0.6, transparent: true });
  const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaque.position.set(0, 0.06, 0);
  plaque.rotation.x = -Math.PI / 2;
  group.add(plaque);

  return group;
}

export function buildBoard() {
  const group = new THREE.Group();
  group.add(buildBackdrop());
  CELLS.forEach((cell) => group.add(buildTile(cell)));
  group.add(buildCenterEmblems());
  return group;
}
