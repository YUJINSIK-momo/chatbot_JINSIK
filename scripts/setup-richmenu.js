/**
 * LINE Rich Menu 4개 일괄 등록 스크립트
 *
 * 구조: 기본 메뉴(카테고리) + 전환 메뉴 3개(가이드/혜택/문의)
 *   - 각 메뉴는 6분할(2500x1686), 좌상/중상/우상/좌하/중하/우하
 *   - 4~5번째 칸: message action (사용자가 탭하면 챗봇에 텍스트 전송)
 *   - 5~6번째 칸: richmenuswitch action (다른 메뉴로 전환)
 *
 * 사용법:
 *   1) .env 또는 환경변수에 LINE_CHANNEL_ACCESS_TOKEN 설정
 *   2) scripts/richmenu-images/ 폴더에 4장의 이미지 배치
 *        - category.png  (또는 .jpg)
 *        - guide.png
 *        - benefit.png
 *        - support.png
 *      ※ 이미지 사양: 2500x1686, JPG/PNG, 1MB 이하
 *      ※ 이미지가 없으면 메뉴 등록까지만 진행하고 업로드는 건너뜀
 *   3) `node scripts/setup-richmenu.js` 실행
 *
 * 옵션:
 *   --reset       기존 모든 Rich Menu 삭제 후 재등록
 *   --no-upload   이미지 업로드 건너뜀(메뉴 정의만 등록)
 *   --no-default  기본 메뉴로 설정하지 않음
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('LINE_CHANNEL_ACCESS_TOKEN 환경변수가 설정되어 있지 않습니다.');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const RESET = args.has('--reset');
const SKIP_UPLOAD = args.has('--no-upload');
const SKIP_DEFAULT = args.has('--no-default');

const API = 'https://api.line.me/v2/bot';
const DATA_API = 'https://api-data.line.me/v2/bot';
const IMG_DIR = path.join(__dirname, 'richmenu-images');

const auth = { Authorization: `Bearer ${TOKEN}` };
const jsonHeaders = { ...auth, 'Content-Type': 'application/json' };

// 6분할 좌표 (2500 x 1686)
// 가로 3등분: 833 / 834 / 833, 세로 2등분: 843 / 843
const CELL = (col, row) => ({
  x: col === 0 ? 0 : col === 1 ? 833 : 1667,
  y: row === 0 ? 0 : 843,
  width: col === 1 ? 834 : 833,
  height: 843,
});

const ALIAS = {
  category: 'menu-category',
  guide: 'menu-guide',
  benefit: 'menu-benefit',
  support: 'menu-support',
};

const msg = (text) => ({ type: 'message', text });
const sw = (aliasId) => ({ type: 'richmenuswitch', richMenuAliasId: aliasId, data: `switch=${aliasId}` });

const MENUS = [
  {
    key: 'category',
    image: 'category',
    body: {
      size: { width: 2500, height: 1686 },
      selected: true,
      name: '카테고리 메뉴',
      chatBarText: '메뉴 열기',
      areas: [
        { bounds: CELL(0, 0), action: msg('귀걸이 추천') },
        { bounds: CELL(1, 0), action: msg('목걸이 길이') },
        { bounds: CELL(2, 0), action: msg('반지 사이즈') },
        { bounds: CELL(0, 1), action: msg('팔찌') },
        { bounds: CELL(1, 1), action: sw(ALIAS.guide) },
        { bounds: CELL(2, 1), action: sw(ALIAS.benefit) },
      ],
    },
  },
  {
    key: 'guide',
    image: 'guide',
    body: {
      size: { width: 2500, height: 1686 },
      selected: false,
      name: '가이드 메뉴',
      chatBarText: '메뉴 열기',
      areas: [
        { bounds: CELL(0, 0), action: msg('반지 사이즈') },
        { bounds: CELL(1, 0), action: msg('목걸이 길이') },
        { bounds: CELL(2, 0), action: msg('소재 안내') },
        { bounds: CELL(0, 1), action: msg('관리법') },
        { bounds: CELL(1, 1), action: sw(ALIAS.category) },
        { bounds: CELL(2, 1), action: sw(ALIAS.support) },
      ],
    },
  },
  {
    key: 'benefit',
    image: 'benefit',
    body: {
      size: { width: 2500, height: 1686 },
      selected: false,
      name: '혜택 메뉴',
      chatBarText: '메뉴 열기',
      areas: [
        { bounds: CELL(0, 0), action: msg('이벤트') },
        { bounds: CELL(1, 0), action: msg('쿠폰') },
        { bounds: CELL(2, 0), action: msg('신상품') },
        { bounds: CELL(0, 1), action: msg('베스트') },
        { bounds: CELL(1, 1), action: sw(ALIAS.category) },
        { bounds: CELL(2, 1), action: sw(ALIAS.guide) },
      ],
    },
  },
  {
    key: 'support',
    image: 'support',
    body: {
      size: { width: 2500, height: 1686 },
      selected: false,
      name: '문의 메뉴',
      chatBarText: '메뉴 열기',
      areas: [
        { bounds: CELL(0, 0), action: msg('상담 신청') },
        { bounds: CELL(1, 0), action: msg('FAQ') },
        { bounds: CELL(2, 0), action: msg('영업시간') },
        { bounds: CELL(0, 1), action: msg('매장 위치') },
        { bounds: CELL(1, 1), action: sw(ALIAS.category) },
        { bounds: CELL(2, 1), action: sw(ALIAS.benefit) },
      ],
    },
  },
];

async function api(method, url, { headers, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: headers ?? jsonHeaders,
    body: body && !(body instanceof Buffer) ? JSON.stringify(body) : body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

async function listRichMenus() {
  const r = await api('GET', `${API}/richmenu/list`);
  return r.richmenus ?? [];
}

async function listAliases() {
  const r = await api('GET', `${API}/richmenu/alias/list`);
  return r.aliases ?? [];
}

async function deleteRichMenu(id) {
  await api('DELETE', `${API}/richmenu/${id}`);
}

async function deleteAlias(aliasId) {
  await api('DELETE', `${API}/richmenu/alias/${aliasId}`);
}

async function createRichMenu(body) {
  const r = await api('POST', `${API}/richmenu`, { body });
  return r.richMenuId;
}

async function createAlias(richMenuId, richMenuAliasId) {
  await api('POST', `${API}/richmenu/alias`, { body: { richMenuId, richMenuAliasId } });
}

async function uploadImage(richMenuId, filePath) {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
  await api('POST', `${DATA_API}/richmenu/${richMenuId}/content`, {
    headers: { ...auth, 'Content-Type': contentType },
    body: buf,
  });
}

async function setDefault(richMenuId) {
  await api('POST', `${API}/user/all/richmenu/${richMenuId}`);
}

function findImage(baseName) {
  if (!fs.existsSync(IMG_DIR)) return null;
  for (const ext of ['.png', '.jpg', '.jpeg']) {
    const p = path.join(IMG_DIR, baseName + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function reset() {
  console.log('[reset] 기존 alias 삭제 중...');
  const aliases = await listAliases();
  for (const a of aliases) {
    try {
      await deleteAlias(a.richMenuAliasId);
      console.log('  - alias 삭제:', a.richMenuAliasId);
    } catch (e) {
      console.warn('  ! alias 삭제 실패:', a.richMenuAliasId, e.message);
    }
  }
  console.log('[reset] 기존 richmenu 삭제 중...');
  const menus = await listRichMenus();
  for (const m of menus) {
    try {
      await deleteRichMenu(m.richMenuId);
      console.log('  - richmenu 삭제:', m.richMenuId);
    } catch (e) {
      console.warn('  ! richmenu 삭제 실패:', m.richMenuId, e.message);
    }
  }
}

async function main() {
  console.log('=== LINE Rich Menu 4종 등록 시작 ===');
  if (RESET) await reset();

  const created = {};

  // 1) 메뉴 4개 등록
  for (const m of MENUS) {
    const id = await createRichMenu(m.body);
    created[m.key] = { id, image: m.image, aliasId: ALIAS[m.key] };
    console.log(`[create] ${m.body.name} → ${id}`);
  }

  // 2) 이미지 업로드
  if (!SKIP_UPLOAD) {
    for (const m of MENUS) {
      const file = findImage(m.image);
      if (!file) {
        console.warn(`[image] ${m.image} 이미지 없음 → 업로드 건너뜀 (scripts/richmenu-images/${m.image}.png 등)`);
        continue;
      }
      await uploadImage(created[m.key].id, file);
      console.log(`[image] ${m.image} ← ${path.basename(file)} 업로드 완료`);
    }
  }

  // 3) alias 등록 (richmenuswitch 액션이 alias를 참조하므로 메뉴 생성 이후 등록)
  for (const m of MENUS) {
    try {
      await createAlias(created[m.key].id, ALIAS[m.key]);
      console.log(`[alias] ${ALIAS[m.key]} → ${created[m.key].id}`);
    } catch (e) {
      console.warn(`[alias] ${ALIAS[m.key]} 등록 실패 (이미 존재할 수 있음):`, e.message);
    }
  }

  // 4) 기본 메뉴 설정 (모든 사용자에게 category 메뉴 노출)
  if (!SKIP_DEFAULT) {
    const hasImage = SKIP_UPLOAD ? false : !!findImage('category');
    if (!hasImage) {
      console.warn('[default] category 이미지가 없어서 기본 메뉴 설정을 건너뜁니다. (이미지 업로드 전에는 기본 메뉴 설정 불가)');
    } else {
      await setDefault(created.category.id);
      console.log(`[default] 기본 메뉴 = ${created.category.id} (카테고리)`);
    }
  }

  console.log('\n=== 완료 ===');
  console.log('등록된 richMenuId:');
  for (const k of Object.keys(created)) {
    console.log(`  ${k.padEnd(8)} ${created[k].id}  (alias: ${created[k].aliasId})`);
  }
  console.log('\n참고:');
  console.log('  - 이미지가 아직 없다면 scripts/richmenu-images/{category|guide|benefit|support}.png 를 넣고');
  console.log('    `node scripts/setup-richmenu.js --reset` 로 다시 실행하세요.');
  console.log('  - 특정 사용자에게만 보여주려면 POST /v2/bot/user/{userId}/richmenu/{richMenuId} 사용.');
}

main().catch((e) => {
  console.error('실행 실패:', e.message);
  process.exit(1);
});
