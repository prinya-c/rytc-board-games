import { ZONES, ZONE_ORDER } from '../game/zones.js';
import { playTick, playChing } from '../audio/audioEngine.js';

export const PLAYER_COLORS = ['#E4572E', '#3A6CF0', '#4E9E3E', '#F4B400', '#9B59B6', '#00B8A9'];

const ZONE_ICONS = { dig: '💻', rob: '🤖', log: '✈️', bio: '🧪', med: '🩺' };

export function renderSetupScreen(root, { onStart }) {
  let count = 1;

  function defaultPlayers(n) {
    return Array.from({ length: n }, (_, i) => ({
      name: '',
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    }));
  }

  let players = defaultPlayers(count);

  const zoneChipsHtml = ZONE_ORDER.map((key, i) => {
    const zone = ZONES[key];
    return `
      <div class="zone-chip-badge" style="--zc:${zone.color}; --zc-soft:${zone.soft}; animation-delay:${i * 0.35}s;">
        <span class="zone-chip-icon">${ZONE_ICONS[key]}</span>
        <span class="zone-chip-name">${zone.label}</span>
      </div>`;
  }).join('');

  function render() {
    root.innerHTML = `
      <div class="overlay scenic">
        <div class="setup-hero">
          <span class="setup-eyebrow">🚀 EEC New S-Curve Career Quest</span>
          <div class="zone-chip-row">${zoneChipsHtml}</div>
        </div>
        <div class="panel setup-panel">
          <h1>ตะลุยโลกอาชีพ</h1>
          <p class="subtitle">ค้นหาว่าคุณเหมาะกับอาชีพใดในอนาคต ผ่านการผจญภัย 32 ช่อง ครบ 5 อุตสาหกรรมแห่งอนาคตของ EEC</p>

          <div class="player-count-row" id="count-row"></div>
          <div class="player-form" id="player-form"></div>

          <button class="btn btn-primary" id="start-btn">เริ่มผจญภัย 🎲</button>
        </div>
      </div>
    `;

    const countRow = root.querySelector('#count-row');
    countRow.innerHTML = [1, 2, 3, 4].map((n) => (
      `<div class="count-chip ${n === count ? 'active' : ''}" data-count="${n}">${n} คน</div>`
    )).join('');
    countRow.querySelectorAll('.count-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        playTick();
        count = Number(chip.dataset.count);
        const existing = players.slice(0, count);
        while (existing.length < count) {
          const usedColors = existing.map((p) => p.color);
          const nextColor = PLAYER_COLORS.find((c) => !usedColors.includes(c)) ?? PLAYER_COLORS[0];
          existing.push({ name: '', color: nextColor });
        }
        players = existing;
        render();
      });
    });

    const form = root.querySelector('#player-form');
    form.innerHTML = players.map((p, i) => `
      <div class="player-row">
        <input type="text" maxlength="12" placeholder="ชื่อผู้เล่นคนที่ ${i + 1}" value="${p.name}" data-idx="${i}" class="name-input" />
        <div class="color-dots" data-idx="${i}">
          ${PLAYER_COLORS.map((c) => {
            const takenByOther = players.some((pp, j) => j !== i && pp.color === c);
            const selected = p.color === c;
            return `<button type="button" class="color-dot ${selected ? 'selected' : ''}" style="background:${c}" data-color="${c}" ${takenByOther ? 'disabled' : ''}></button>`;
          }).join('')}
        </div>
      </div>
    `).join('');

    form.querySelectorAll('.name-input').forEach((input) => {
      input.addEventListener('input', () => {
        players[Number(input.dataset.idx)].name = input.value;
        updateStartState();
      });
    });
    form.querySelectorAll('.color-dots').forEach((dotsWrap) => {
      dotsWrap.querySelectorAll('.color-dot').forEach((dot) => {
        dot.addEventListener('click', () => {
          if (dot.disabled) return;
          playTick();
          players[Number(dotsWrap.dataset.idx)].color = dot.dataset.color;
          render();
        });
      });
    });

    updateStartState();
  }

  function updateStartState() {
    const btn = root.querySelector('#start-btn');
    if (!btn) return;
    const allNamed = players.every((p) => p.name.trim().length > 0);
    btn.disabled = !allNamed;
    if (!btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        playChing();
        onStart(players.map((p, i) => ({
          id: i,
          name: p.name.trim(),
          color: p.color,
          position: 1,
          score: { dig: 0, rob: 0, log: 0, bio: 0, med: 0 },
          finished: false,
        })));
      });
    }
  }

  render();
}
