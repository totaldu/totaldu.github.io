// scripts/fetchGpr.mjs
// lolesports.com GPR 페이지(서버 렌더 HTML)에서 팀별 GPR 점수·전적을 추출해
// client/src/data/gprTeams.json 의 score/w/l 을 갱신한다. 브라우저 불필요(서버 fetch).
//
// 실행: node scripts/fetchGpr.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'client', 'src', 'data', 'gprTeams.json');
const URL = 'https://lolesports.com/ko-KR/gpr/2026/current';

// gprTeams.json 의 short 는 GPR 사이트 코드를 그대로 사용 → 별칭 불필요
const ALIAS = {};

const res = await fetch(URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  },
});
if (!res.ok) throw new Error(`GPR fetch 실패: HTTP ${res.status}`);
const html = await res.text();

// 페이지의 RSC 페이로드에서 TeamGPR 블록별로 추출
const chunks = html.split('"__typename":"TeamGPR"');
const gpr = {};
for (const raw of chunks.slice(1)) {
  const ch = raw.slice(0, 6000);
  const code = ch.match(/"code":"([^"]+)"/);
  const score = ch.match(/"currentTeamGPR":\{[^}]*?"gprScore":(\d+)/);
  const wl = ch.match(/"teamMatchRecord":\{"__typename":"WinLoss","(?:wins":(\d+),"losses":(\d+)|losses":(\d+),"wins":(\d+))\}/);
  const gwl = ch.match(/"teamGameRecord":\{"__typename":"WinLoss","(?:wins":(\d+),"losses":(\d+)|losses":(\d+),"wins":(\d+))\}/);
  if (!code || !score) continue;
  const key = ALIAS[code[1]] || code[1];
  if (gpr[key]) continue; // 첫 등장(현재 시즌)만
  gpr[key] = {
    score: Number(score[1]),
    w: wl ? Number(wl[1] ?? wl[4]) : null,
    l: wl ? Number(wl[2] ?? wl[3]) : null,
    gw: gwl ? Number(gwl[1] ?? gwl[4]) : null, // 세트(게임) 승
    gl: gwl ? Number(gwl[2] ?? gwl[3]) : null, // 세트(게임) 패
  };
}

const found = Object.keys(gpr).length;
console.log(`추출된 팀: ${found}`);
if (found < 50) throw new Error(`추출 팀 수 비정상(${found}). 페이지 구조 변경 가능성 — 갱신 중단.`);

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
let updated = 0;
const missing = [];
for (const t of data.teams) {
  const g = gpr[t.short];
  if (!g) { missing.push(t.short); continue; }
  if (t.score !== g.score || t.w !== g.w || t.l !== g.l || t.gw !== g.gw || t.gl !== g.gl) updated++;
  t.score = g.score;
  if (g.w != null) t.w = g.w;
  if (g.l != null) t.l = g.l;
  if (g.gw != null) t.gw = g.gw;
  if (g.gl != null) t.gl = g.gl;
}
if (missing.length) console.warn(`주의: GPR에서 못 찾은 팀 → ${missing.join(', ')}`);

data.updatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`gprTeams.json 갱신: ${updated}팀 변경, updatedAt=${data.updatedAt}`);
