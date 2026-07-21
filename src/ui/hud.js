import { playPop } from '../audio/audioEngine.js';

export function renderHud(root, { onRoll }) {
  root.innerHTML = `
    <div id="hud">
      <div class="turn-banner" id="turn-banner"></div>
      <div class="bottom-bar">
        <button class="roll-btn" id="roll-btn">
          ทอยลูกเต๋า 🎲
          <span class="last-roll" id="last-roll"></span>
        </button>
      </div>
    </div>
    <div class="zone-chip" id="zone-chip"></div>
  `;

  root.querySelector('#roll-btn').addEventListener('click', () => {
    playPop();
    onRoll();
  });

  function update({ player, canRoll, lastRoll, zoneLabel }) {
    const banner = root.querySelector('#turn-banner');
    banner.innerHTML = `<span class="dot" style="background:${player.color}"></span> ตาของ ${player.name}`;
    const rollBtn = root.querySelector('#roll-btn');
    rollBtn.disabled = !canRoll;
    root.querySelector('#last-roll').textContent = lastRoll ? `ได้แต้ม ${lastRoll}` : '';
    const zoneChip = root.querySelector('#zone-chip');
    zoneChip.textContent = zoneLabel ?? '';
    zoneChip.style.display = zoneLabel ? 'block' : 'none';
  }

  return { update };
}
