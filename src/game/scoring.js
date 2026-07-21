import { ZONE_ORDER, ZONES, emptyScore } from './zones.js';

export function applyOption(scoreState, option, weight = 1) {
  const next = { ...scoreState };
  for (const key of Object.keys(option.scores || {})) {
    next[key] = (next[key] || 0) + option.scores[key] * weight;
  }
  return next;
}

export function boostTopCategory(scoreState, amount = 2) {
  const topKey = ZONE_ORDER.reduce((best, key) =>
    scoreState[key] > (scoreState[best] || 0) ? key : best, ZONE_ORDER[0]);
  return { ...scoreState, [topKey]: (scoreState[topKey] || 0) + amount };
}

export function computeProfile(scoreState) {
  // Some choices carry a negative score (a clearly wrong/harmful answer), so
  // clamp each category at 0 for display — a "wrong pick" should never show
  // up as a negative bar or skew another category's percentage.
  const clamped = ZONE_ORDER.reduce((acc, key) => {
    acc[key] = Math.max(0, scoreState[key] || 0);
    return acc;
  }, {});
  const total = ZONE_ORDER.reduce((sum, key) => sum + clamped[key], 0) || 1;
  return ZONE_ORDER
    .map((key) => ({
      key,
      zone: ZONES[key],
      value: clamped[key],
      percent: Math.round((clamped[key] / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

const REASON_TEMPLATES = {
  dig: 'เลือกใช้เทคโนโลยีและข้อมูลแก้ปัญหาบ่อยที่สุด',
  rob: 'ชอบลงมือประกอบ ควบคุม และแก้ปัญหาเชิงกลไก',
  log: 'ถนัดวางแผน จัดลำดับ และประสานงานให้ทันเวลา',
  bio: 'สนใจการทดลอง วิทยาศาสตร์ และสิ่งแวดล้อม',
  med: 'ให้ความสำคัญกับการดูแลและช่วยเหลือผู้อื่น',
};

export function computeTop3(scoreState) {
  const profile = computeProfile(scoreState);
  return profile.slice(0, 3).map((entry, i) => ({
    rank: i + 1,
    ...entry,
    careers: entry.zone.careers,
    reason: REASON_TEMPLATES[entry.key],
  }));
}

export { emptyScore };
