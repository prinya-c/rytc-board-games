// EEC New S-Curve career zones used throughout the game.
export const ZONES = {
  start: { key: 'start', label: 'START', color: '#FFD54F', soft: '#FFF6DA' },
  dig: {
    key: 'dig',
    label: 'Digital',
    name: 'มหานครดิจิทัล',
    color: '#3A6CF0',
    soft: '#DCE6FF',
    careers: ['นักพัฒนาแอป', 'Data Analyst', 'UX/UI Designer', 'Cybersecurity'],
  },
  rob: {
    key: 'rob',
    label: 'Robotics',
    name: 'โรงงานแห่งอนาคต',
    color: '#E07A2C',
    soft: '#FFE6D1',
    careers: ['วิศวกรหุ่นยนต์', 'ช่างเทคนิคระบบอัตโนมัติ', 'นักออกแบบแขนกล'],
  },
  log: {
    key: 'log',
    label: 'Logistics',
    name: 'ท่าอากาศยาน & โลจิสติกส์',
    color: '#189C92',
    soft: '#D2F2EE',
    careers: ['นักบิน', 'นักวางแผนโลจิสติกส์', 'ช่างซ่อมบำรุงอากาศยาน'],
  },
  bio: {
    key: 'bio',
    label: 'Bio-chem',
    name: 'ห้องแล็บสีเขียว',
    color: '#4E9E3E',
    soft: '#DEF2D6',
    careers: ['นักวิจัยไบโอพลาสติก', 'นักวิทยาศาสตร์เคมี', 'วิศวกรกระบวนการผลิต'],
  },
  med: {
    key: 'med',
    label: 'Medical',
    name: 'ศูนย์การแพทย์แห่งอนาคต',
    color: '#D8465F',
    soft: '#FBDCE1',
    careers: ['แพทย์', 'นักเทคนิคการแพทย์', 'นักกายภาพบำบัด'],
  },
  finish: { key: 'finish', label: 'FINISH', color: '#FFD54F', soft: '#FFF6DA' },
};

export const ZONE_ORDER = ['dig', 'rob', 'log', 'bio', 'med'];

export function emptyScore() {
  return { dig: 0, rob: 0, log: 0, bio: 0, med: 0 };
}
