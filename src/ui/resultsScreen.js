import { computeTop3, computeProfile } from '../game/scoring.js';
import { playChing } from '../audio/audioEngine.js';

export function showPersonalResult(root, player, { onContinue, isLast }) {
  const top3 = computeTop3(player.score);
  const profile = computeProfile(player.score);

  root.innerHTML = `
    <div class="overlay dim">
      <div class="panel results-panel">
        <h1>🎉 ${player.name} ถึงเส้นชัยแล้ว!</h1>
        <p class="subtitle">นี่คือสายอาชีพที่เหมาะกับคุณที่สุดจากการผจญภัยครั้งนี้</p>

        <div class="top3-list">
          ${top3.map((t) => `
            <div class="top3-card" style="border-color:${t.zone.color}; background:${t.zone.soft}">
              <div class="rank" style="color:${t.zone.color}">อันดับ ${t.rank} · ${t.zone.label}</div>
              <h4>${t.careers[0]}</h4>
              <p>${t.reason} · ตัวอย่างอาชีพอื่น: ${t.careers.slice(1).join(', ')}</p>
              <p class="rytc-majors">มาเรียนกับเราที่วิทยาลัยเทคนิคระยอง มีสาขาที่เกี่ยวข้องกับอาชีพนี้ ดังนี้ ${(t.zone.majors || []).map((m) => `<a href="https://join.rytc.ac.th" target="_blank" rel="noopener">${m}</a>`).join(', ')}</p>
            </div>
          `).join('')}
        </div>

        <div class="bars">
          ${profile.map((p) => `
            <div class="bar-row">
              <span class="bar-label" style="color:${p.zone.color}">${p.zone.label}</span>
              <span class="bar-track"><span class="bar-fill" style="width:${p.percent}%; background:${p.zone.color}"></span></span>
              <span class="bar-val">${p.percent}%</span>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary" id="result-continue">${isLast ? 'ดูสรุปผลทุกคน' : 'ผู้เล่นคนถัดไป'}</button>
      </div>
    </div>
  `;

  root.querySelector('#result-continue').addEventListener('click', () => {
    playChing();
    root.innerHTML = '';
    onContinue();
  });
}

export function showFinalSummary(root, players, { onRestart }) {
  const rows = players.map((p) => {
    const top1 = computeTop3(p.score)[0];
    return { p, top1 };
  });

  root.innerHTML = `
    <div class="overlay dim">
      <div class="panel results-panel">
        <h1>🏁 สรุปผลทุกคน</h1>
        <p class="subtitle">ขอบคุณที่ร่วมผจญภัยตะลุยโลกอาชีพ!</p>

        <div class="summary-list">
          ${rows.map(({ p, top1 }) => `
            <div class="summary-row">
              <span class="dot" style="background:${p.color}"></span>
              <span class="name">${p.name}</span>
              <span class="career" style="color:${top1.zone.color}">${top1.careers[0]}</span>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-primary" id="restart-btn">เล่นใหม่อีกครั้ง</button>
      </div>
    </div>
  `;

  root.querySelector('#restart-btn').addEventListener('click', () => {
    playChing();
    root.innerHTML = '';
    onRestart();
  });
}
