/**
 * LINE Rich Menu 이미지 4장 자동 생성
 * - 출력: scripts/richmenu-images/{category|guide|benefit|support}.png
 * - 사양: 2500 x 1686, PNG, 6분할 (3x2)
 * - SVG → PNG 변환 (sharp)
 *
 * 사용법:
 *   node scripts/generate-richmenu-images.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'richmenu-images');
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 2500;
const H = 1686;
const COLS = [0, 833, 1667, 2500];
const ROWS = [0, 843, 1686];

// 셀 영역 좌표
function cell(c, r) {
  return { x: COLS[c], y: ROWS[r], w: COLS[c + 1] - COLS[c], h: ROWS[r + 1] - ROWS[r] };
}

// 4개 메뉴 디자인
// 각 셀: { label, sub, icon, type: 'item' | 'switch' }
const MENUS = [
  {
    file: 'category.png',
    title: '카테고리',
    palette: { bg: '#0F172A', card: '#1E293B', accent: '#60A5FA', text: '#F8FAFC', sub: '#94A3B8', switchBg: '#334155' },
    cells: [
      { label: '귀걸이', sub: 'Earrings', icon: '◆', type: 'item' },
      { label: '목걸이', sub: 'Necklace', icon: '○', type: 'item' },
      { label: '반지', sub: 'Ring', icon: '◎', type: 'item' },
      { label: '팔찌·브로치', sub: 'Bracelet', icon: '∞', type: 'item' },
      { label: '가이드', sub: 'Guide', icon: '›', type: 'switch' },
      { label: '혜택', sub: 'Benefit', icon: '›', type: 'switch' },
    ],
  },
  {
    file: 'guide.png',
    title: '가이드',
    palette: { bg: '#1E1B4B', card: '#312E81', accent: '#A78BFA', text: '#F5F3FF', sub: '#C7D2FE', switchBg: '#4338CA' },
    cells: [
      { label: '반지 사이즈', sub: 'Ring size', icon: '◯', type: 'item' },
      { label: '목걸이 길이', sub: 'Length', icon: '⇕', type: 'item' },
      { label: '소재 안내', sub: 'Material', icon: '✦', type: 'item' },
      { label: '관리법', sub: 'Care', icon: '✿', type: 'item' },
      { label: '카테고리', sub: 'Home', icon: '‹', type: 'switch' },
      { label: '문의', sub: 'Support', icon: '›', type: 'switch' },
    ],
  },
  {
    file: 'benefit.png',
    title: '혜택',
    palette: { bg: '#7C2D12', card: '#9A3412', accent: '#FBBF24', text: '#FFF7ED', sub: '#FDBA74', switchBg: '#B45309' },
    cells: [
      { label: '이벤트', sub: 'Event', icon: '★', type: 'item' },
      { label: '쿠폰', sub: 'Coupon', icon: '%', type: 'item' },
      { label: '신상품', sub: 'New', icon: '✨', type: 'item' },
      { label: '베스트', sub: 'Best', icon: '♥', type: 'item' },
      { label: '카테고리', sub: 'Home', icon: '‹', type: 'switch' },
      { label: '가이드', sub: 'Guide', icon: '›', type: 'switch' },
    ],
  },
  {
    file: 'support.png',
    title: '문의',
    palette: { bg: '#064E3B', card: '#065F46', accent: '#34D399', text: '#ECFDF5', sub: '#A7F3D0', switchBg: '#047857' },
    cells: [
      { label: '상담 신청', sub: 'Consult', icon: '✉', type: 'item' },
      { label: 'FAQ', sub: 'Help', icon: '?', type: 'item' },
      { label: '영업시간', sub: 'Hours', icon: '◷', type: 'item' },
      { label: '매장 위치', sub: 'Location', icon: '◉', type: 'item' },
      { label: '카테고리', sub: 'Home', icon: '‹', type: 'switch' },
      { label: '혜택', sub: 'Benefit', icon: '›', type: 'switch' },
    ],
  },
];

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function svgFor(menu) {
  const { palette, cells, title } = menu;
  const gap = 12;
  let rects = '';
  let labels = '';

  cells.forEach((c, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const { x, y, w, h } = cell(col, row);
    const isSwitch = c.type === 'switch';
    const bg = isSwitch ? palette.switchBg : palette.card;

    // 셀 배경 (gap만큼 안쪽으로)
    rects += `<rect x="${x + gap}" y="${y + gap}" width="${w - gap * 2}" height="${h - gap * 2}" rx="24" ry="24" fill="${bg}"/>`;

    // 아이콘 (큰 글자)
    const cx = x + w / 2;
    const iconY = y + h * 0.42;
    const labelY = y + h * 0.68;
    const subY = y + h * 0.82;

    labels += `<text x="${cx}" y="${iconY}" font-size="180" text-anchor="middle" fill="${palette.accent}" font-family="Segoe UI, Apple SD Gothic Neo, Malgun Gothic, sans-serif" font-weight="700">${escapeXml(c.icon)}</text>`;
    labels += `<text x="${cx}" y="${labelY}" font-size="74" text-anchor="middle" fill="${palette.text}" font-family="Segoe UI, Apple SD Gothic Neo, Malgun Gothic, sans-serif" font-weight="700">${escapeXml(c.label)}</text>`;
    labels += `<text x="${cx}" y="${subY}" font-size="34" text-anchor="middle" fill="${palette.sub}" font-family="Segoe UI, sans-serif" font-weight="400" letter-spacing="4">${escapeXml(c.sub.toUpperCase())}</text>`;

    // switch 셀에는 상단에 작은 라벨
    if (isSwitch) {
      labels += `<text x="${x + 36}" y="${y + 64}" font-size="28" fill="${palette.sub}" font-family="Segoe UI, sans-serif" font-weight="600" letter-spacing="6">SWITCH</text>`;
    }
  });

  // 상단 타이틀 띠 (작게)
  const banner = `<text x="48" y="56" font-size="32" fill="${palette.sub}" font-family="Segoe UI, sans-serif" font-weight="700" letter-spacing="8">ACCESSORY · ${escapeXml(title.toUpperCase())}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${palette.bg}"/>
  ${banner}
  ${rects}
  ${labels}
</svg>`;
}

async function main() {
  for (const m of MENUS) {
    const svg = svgFor(m);
    const out = path.join(OUT_DIR, m.file);
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
    const { size } = fs.statSync(out);
    console.log(`[ok] ${m.file}  ${(size / 1024).toFixed(1)} KB`);
  }
  console.log(`\n출력 폴더: ${OUT_DIR}`);
}

main().catch((e) => {
  console.error('실패:', e.message);
  process.exit(1);
});
