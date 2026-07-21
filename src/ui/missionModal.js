import { ZONES } from '../game/zones.js';
import { computeProfile } from '../game/scoring.js';

const TYPE_LABEL = {
  A: 'ค้นหาตัวเอง',
  B: 'ค้นหาอาชีพ',
  C: 'ภารกิจผสาน',
  event: 'เหตุการณ์พิเศษ',
  check: 'จุดพักสรุปผล',
  start: 'เริ่มเกม',
  finish: 'เส้นชัย',
};

export function showMission(root, cell, { onResolve, player }) {
  const zone = ZONES[cell.zone];

  const optionsHtml = (cell.options || []).map((opt, i) => `
    <button type="button" class="mission-option" data-idx="${i}">
      <span class="icon">${opt.icon}</span>
      <span class="text">${opt.text}</span>
    </button>
  `).join('');

  const checkpointBars = cell.mechanic === 'checkpoint' && player
    ? `<div class="bars" style="margin-top:14px;">${computeProfile(player.score).map((p) => `
        <div class="bar-row">
          <span class="bar-label" style="color:${p.zone.color}">${p.zone.label}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${p.percent}%; background:${p.zone.color}"></span></span>
          <span class="bar-val">${p.percent}%</span>
        </div>`).join('')}</div>`
    : '';

  const bodyHtml = cell.options
    ? `<div class="mission-options">${optionsHtml}</div>`
    : `<div class="mission-mechanic">${mechanicText(cell)}</div>
       ${checkpointBars}
       <button type="button" class="btn btn-primary" id="mission-continue" style="margin-top:16px;">ไปต่อ</button>`;

  root.innerHTML = `
    <div class="overlay dim">
      <div class="panel mission-panel">
        <span class="mission-tag" style="background:${zone.soft}; color:${zone.color}">${TYPE_LABEL[cell.type] ?? ''}</span>
        <h2 class="mission-title">${cell.title}</h2>
        <p class="mission-scenario">${cell.scenario}</p>
        ${bodyHtml}
      </div>
    </div>
  `;

  if (cell.options) {
    root.querySelectorAll('.mission-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const opt = cell.options[Number(btn.dataset.idx)];
        close();
        onResolve(opt);
      });
    });
  } else {
    root.querySelector('#mission-continue').addEventListener('click', () => {
      close();
      onResolve(null);
    });
  }

  function close() {
    root.innerHTML = '';
  }
}

function mechanicText(cell) {
  if (cell.type === 'start') return '👋 กรอกชื่อและเลือกสีหมากเรียบร้อยแล้ว พร้อมออกเดินทาง!';
  if (cell.type === 'finish') return '🎉 คุณเดินทางถึงหอคอยอาชีพในฝันแล้ว มาดูผลลัพธ์กัน!';
  return cell.scenario;
}

export function hideMission(root) {
  root.innerHTML = '';
}
