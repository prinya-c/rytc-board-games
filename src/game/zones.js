// EEC New S-Curve career zones used throughout the game.
export const ZONES = {
  start: { key: 'start', label: 'START', color: '#FFC72C', soft: '#FFF6DA' },
  dig: {
    key: 'dig',
    label: 'Digital',
    name: 'มหานครดิจิทัล',
    color: '#2F5CFF',
    soft: '#DCE6FF',
    careers: ['นักพัฒนาแอป', 'Data Analyst', 'UX/UI Designer', 'Cybersecurity'],
  },
  rob: {
    key: 'rob',
    label: 'Robotics',
    name: 'โรงงานแห่งอนาคต',
    color: '#F0731A',
    soft: '#FFE6D1',
    careers: ['วิศวกรหุ่นยนต์', 'ช่างเทคนิคระบบอัตโนมัติ', 'นักออกแบบแขนกล'],
  },
  log: {
    key: 'log',
    label: 'Logistics',
    name: 'ท่าอากาศยาน & โลจิสติกส์',
    color: '#00A99D',
    soft: '#D2F2EE',
    careers: ['ช่างซ่อมบำรุงอากาศยาน', 'นักวางแผนโลจิสติกส์', 'นักบิน'],
  },
  bio: {
    key: 'bio',
    label: 'Bio-chem',
    name: 'ห้องแล็บสีเขียว',
    color: '#3FAE2A',
    soft: '#DEF2D6',
    careers: ['นักวิจัยไบโอพลาสติก', 'นักวิทยาศาสตร์เคมี', 'วิศวกรกระบวนการผลิต'],
  },
  med: {
    key: 'med',
    label: 'Medical',
    name: 'ศูนย์การแพทย์แห่งอนาคต',
    color: '#EF3A5C',
    soft: '#FBDCE1',
    careers: ['ผู้ประสานงานท่องเที่ยวเชิงสุขภาพ', 'นักควบคุมคุณภาพเวชภัณฑ์', 'นักเทคนิคการแพทย์'],
  },
  finish: { key: 'finish', label: 'FINISH', color: '#FFC72C', soft: '#FFF6DA' },
};

export const ZONE_ORDER = ['dig', 'rob', 'log', 'bio', 'med'];

export function emptyScore() {
  return { dig: 0, rob: 0, log: 0, bio: 0, med: 0 };
}
