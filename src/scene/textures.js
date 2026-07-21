import * as THREE from 'three';

function ctx2d(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return { canvas, ctx: canvas.getContext('2d') };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const TYPE_BADGE = {
  A: { label: 'ตัวเอง', bg: '#ffffffcc' },
  B: { label: 'อาชีพ', bg: '#ffffffcc' },
  C: { label: 'ผสาน', bg: '#ffffffcc' },
  event: { label: 'เหตุการณ์', bg: '#fff3c4dd' },
  check: { label: 'จุดพัก', bg: '#ffffffdd' },
  start: { label: 'START', bg: '#ffffffdd' },
  finish: { label: 'FINISH', bg: '#ffffffdd' },
};

export function createTileTexture({ icon, color, soft, number, type }) {
  const { canvas, ctx } = ctx2d(256);
  const s = 256;
  ctx.fillStyle = soft || '#ffffff';
  ctx.fillRect(0, 0, s, s);

  roundRectPath(ctx, 6, 6, s - 12, s - 12, 26);
  ctx.fillStyle = color;
  ctx.fill();
  roundRectPath(ctx, 18, 18, s - 36, s - 36, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fill();

  // cell number chip
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(String(number).padStart(2, '0'), 22, 18);

  // big icon
  ctx.font = `${Math.round(s * 0.42)}px "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, s / 2, s / 2 + 12);

  // type badge
  const badge = TYPE_BADGE[type];
  if (badge) {
    ctx.font = '700 20px system-ui, sans-serif';
    const textW = ctx.measureText(badge.label).width;
    const bw = textW + 24;
    roundRectPath(ctx, s / 2 - bw / 2, s - 44, bw, 30, 14);
    ctx.fillStyle = badge.bg;
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.label, s / 2, s - 29);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createDicePipTexture(value) {
  const { canvas, ctx } = ctx2d(200);
  const s = 200;
  const faceGrad = ctx.createRadialGradient(s * 0.35, s * 0.3, 10, s * 0.5, s * 0.5, s * 0.75);
  faceGrad.addColorStop(0, '#ffffff');
  faceGrad.addColorStop(1, '#f3ede0');
  ctx.fillStyle = faceGrad;
  roundRectPath(ctx, 2, 2, s - 4, s - 4, 34);
  ctx.fill();

  const pip = (x, y) => {
    const pipGrad = ctx.createRadialGradient(x - 5, y - 5, 1, x, y, 17);
    if (value === 1) {
      pipGrad.addColorStop(0, '#ef6b7e');
      pipGrad.addColorStop(1, '#c93752');
    } else {
      pipGrad.addColorStop(0, '#4a4a4a');
      pipGrad.addColorStop(1, '#1c1c1c');
    }
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fillStyle = pipGrad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
  };
  const L = 46, C = 100, R = 154;
  const T = 46, M = 100, B = 154;
  const layouts = {
    1: [[C, M]],
    2: [[L, T], [R, B]],
    3: [[L, T], [C, M], [R, B]],
    4: [[L, T], [R, T], [L, B], [R, B]],
    5: [[L, T], [R, T], [C, M], [L, B], [R, B]],
    6: [[L, T], [R, T], [L, M], [R, M], [L, B], [R, B]],
  };
  layouts[value].forEach(([x, y]) => pip(x, y));

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBoardBackdropTexture(gridSide, cellSize) {
  const s = 1024;
  const { canvas, ctx } = ctx2d(s);
  const grad = ctx.createLinearGradient(0, 0, 0, s);
  grad.addColorStop(0, '#7cc8f7');
  grad.addColorStop(0.45, '#bdedb0');
  grad.addColorStop(1, '#7fd65c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);

  // soft clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const clouds = [[130, 110, 46], [190, 130, 34], [820, 150, 40], [900, 190, 28], [760, 90, 30]];
  clouds.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.9, y + 6, r * 0.75, 0, Math.PI * 2);
    ctx.arc(x - r * 0.9, y + 8, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  });

  // scattered ground dots (grassy texture)
  for (let i = 0; i < 320; i++) {
    const x = Math.random() * s;
    const y = s * 0.55 + Math.random() * s * 0.45;
    ctx.fillStyle = `rgba(30,120,40,${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.arc(x, y, 3 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createEmblemTexture({ icon, label, color, soft }) {
  const { canvas, ctx } = ctx2d(256);
  const s = 256;
  ctx.fillStyle = soft;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.font = `${Math.round(s * 0.38)}px "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon, s / 2, s / 2 - 18);

  ctx.font = '700 26px "Noto Sans Thai", system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(label, s / 2, s / 2 + 62);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFacadeTexture(color, rows = 5, cols = 4) {
  const s = 256;
  const { canvas, ctx } = ctx2d(s);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, s, s);
  // subtle vertical shading for a wall-like feel
  const shade = ctx.createLinearGradient(0, 0, s, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.12)');
  shade.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  shade.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, s, s);

  const padX = s * 0.12;
  const padY = s * 0.1;
  const cellW = (s - padX * 2) / cols;
  const cellH = (s - padY * 2) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = padX + c * cellW + cellW * 0.16;
      const wy = padY + r * cellH + cellH * 0.18;
      const ww = cellW * 0.68;
      const wh = cellH * 0.6;
      const lit = Math.random() > 0.35;
      ctx.fillStyle = lit ? 'rgba(255,246,200,0.88)' : 'rgba(20,30,45,0.35)';
      roundRectPath(ctx, wx, wy, ww, wh, Math.min(ww, wh) * 0.22);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTitlePlaqueTexture(title, subtitle) {
  const w = 900, h = 300;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  roundRectPath(ctx, 10, 10, w - 20, h - 20, 40);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ffe9a8');
  grad.addColorStop(1, '#ffcf5c');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#c77e00';
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#7a3e00';
  ctx.font = '800 76px "Noto Sans Thai", system-ui, sans-serif';
  ctx.fillText(title, w / 2, h / 2 - 26);
  ctx.font = '600 34px "Noto Sans Thai", system-ui, sans-serif';
  ctx.fillText(subtitle, w / 2, h / 2 + 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
