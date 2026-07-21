import { ZONES } from '../game/zones.js';

const PROPS = {
  dig: '💻',
  rob: '🦾',
  log: '✈️',
  bio: '🧪',
  med: '🩺',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStar(ctx, cx, cy, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
    ctx.lineTo(cx + Math.cos(a2) * r * 0.42, cy + Math.sin(a2) * r * 0.42);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCharacter(ctx, x, y, scale, shirtColor, pose) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath();
  ctx.ellipse(0, 96, 46, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.fillStyle = '#3a3a3a';
  const legOffset = pose === 'cheer' ? 22 : 16;
  roundRect(ctx, -legOffset, 55, 16, 42, 8);
  ctx.fill();
  roundRect(ctx, legOffset - 16, 55, 16, 42, 8);
  ctx.fill();

  // body
  ctx.fillStyle = shirtColor;
  roundRect(ctx, -32, 8, 64, 58, 22);
  ctx.fill();

  // arms
  ctx.fillStyle = shirtColor;
  if (pose === 'wave') {
    roundRect(ctx, -46, -6, 16, 46, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(-38, -6);
    ctx.rotate(-0.6);
    roundRect(ctx, -8, -30, 16, 34, 8);
    ctx.fill();
    ctx.restore();
  } else if (pose === 'cheer') {
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.translate(side * 30, 14);
      ctx.rotate(side * -0.9);
      roundRect(ctx, -8, -40, 16, 44, 8);
      ctx.fill();
      ctx.restore();
    });
  } else if (pose === 'point') {
    roundRect(ctx, -46, 10, 16, 40, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(30, 14);
    ctx.rotate(-0.35);
    roundRect(ctx, -8, -8, 44, 16, 8);
    ctx.fill();
    ctx.restore();
  } else {
    // think: hand near chin
    roundRect(ctx, -46, 10, 16, 40, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(28, -2);
    ctx.rotate(-1.9);
    roundRect(ctx, -8, -10, 16, 34, 8);
    ctx.fill();
    ctx.restore();
  }

  // head
  ctx.fillStyle = '#F4C89B';
  ctx.beginPath();
  ctx.arc(0, -30, 34, 0, Math.PI * 2);
  ctx.fill();

  // hair
  ctx.fillStyle = '#3B2A20';
  ctx.beginPath();
  ctx.arc(0, -34, 36, Math.PI, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, -36, -40, 10, 28, 5);
  ctx.fill();
  roundRect(ctx, 26, -40, 10, 28, 5);
  ctx.fill();

  // face
  ctx.fillStyle = '#2A2118';
  const eyeY = pose === 'cheer' ? -30 : -28;
  ctx.beginPath();
  ctx.arc(-12, eyeY, 3.4, 0, Math.PI * 2);
  ctx.arc(12, eyeY, 3.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2A2118';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (pose === 'cheer' || pose === 'wave') {
    ctx.arc(0, -20, 12, 0.15 * Math.PI, 0.85 * Math.PI);
  } else {
    ctx.arc(0, -22, 9, 0.2 * Math.PI, 0.8 * Math.PI);
  }
  ctx.stroke();

  // cheeks
  ctx.fillStyle = 'rgba(230,120,110,0.35)';
  ctx.beginPath();
  ctx.arc(-20, -18, 5, 0, Math.PI * 2);
  ctx.arc(20, -18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function poseFor(cell) {
  if (cell.type === 'start') return 'wave';
  if (cell.type === 'finish') return 'cheer';
  if (cell.options) return 'point';
  return 'think';
}

export function renderSceneDataUrl(cell, playerColor) {
  const w = 640;
  const h = 300;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const zone = ZONES[cell.zone] ?? ZONES.dig;

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#bfe3f7');
  sky.addColorStop(1, zone.soft);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // soft glow behind scene
  const glow = ctx.createRadialGradient(w * 0.62, h * 0.5, 10, w * 0.62, h * 0.5, 230);
  glow.addColorStop(0, 'rgba(255,255,255,0.55)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // ground band
  ctx.fillStyle = zone.color;
  ctx.globalAlpha = 0.16;
  ctx.fillRect(0, h - 78, w, 78);
  ctx.globalAlpha = 1;

  // decorative circles (clouds/bubbles)
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  [[70, 56, 22], [120, 40, 14], [560, 46, 18], [600, 70, 12]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  if (cell.type === 'event') {
    for (let i = 0; i < 10; i++) {
      const cx = w * 0.5 + Math.cos((i / 10) * Math.PI * 2) * 160;
      const cy = h * 0.42 + Math.sin((i / 10) * Math.PI * 2) * 100;
      drawStar(ctx, cx, cy, 6 + (i % 3) * 3, '#FFD24D', 0.75);
    }
  }
  if (cell.type === 'finish') {
    const confettiColors = ['#FFD24D', zone.color, '#4E9E3E', '#D8465F', '#3A6CF0'];
    for (let i = 0; i < 26; i++) {
      const cx = (i * 53) % w;
      const cy = (i * 91) % (h - 40);
      ctx.fillStyle = confettiColors[i % confettiColors.length];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((i * 37) % 6);
      ctx.fillRect(-4, -6, 8, 12);
      ctx.restore();
    }
  }

  // prop emoji, large, right side — a per-cell override takes priority so the
  // art matches that cell's specific mission story, not just its zone.
  const prop = cell.prop ?? PROPS[cell.zone] ?? { start: '🗺️', finish: '🏆' }[cell.type] ?? '❓';
  ctx.font = '150px "Noto Color Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillText(prop, w * 0.74, h * 0.5 + 6);
  ctx.restore();

  // character, left-center
  drawCharacter(ctx, w * 0.32, h * 0.62, 1.15, playerColor ?? zone.color, poseFor(cell));

  // mission-type cue bubble
  const cueIcon = { A: '💭', B: '🔎', C: '⚡', event: '🎲', check: '📊' }[cell.type];
  if (cueIcon) {
    ctx.font = '30px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(w * 0.32 + 58, h * 0.62 - 96, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '26px "Noto Color Emoji", "Apple Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cueIcon, w * 0.32 + 58, h * 0.62 - 94);
  }

  return canvas.toDataURL('image/png');
}
