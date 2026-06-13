// scripts/fetchStandings.mjs
// lolesports.com 공식 API에서 각 리그의 "현재 스플릿 정규시즌" 순위와 일정을 받아
// client/src/data/lolStandings.json 을 갱신한다.
//
// 핵심: 순위(rank·시리즈 W-L)는 getStandingsV3 의 regular_season 스테이지에서 가져오므로
//   토너먼트 스테이지·플레이오프·플레이인·결승은 구조적으로 제외된다.
//   세트(게임) 승패 gw/gl 은 일정 경기에서 집계하되, 위 포스트시즌 블록을 키워드로 걸러낸다.
//   집계한 시리즈 W-L 이 공식 순위와 다르면 경고하고 gw/gl 은 비워 둔다(잘못된 값 방지).
//
// 실행: node scripts/fetchStandings.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '..', 'client', 'src', 'data', 'lolStandings.json');

const API = 'https://esports-api.lolesports.com/persisted/gw';
const KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';
const HL = 'ko-KR';

// 갱신 대상: 국내(지역) 정규리그 6개. 국제전(FST·MSI·Worlds)은 정규시즌 개념이 없어 제외.
// key = lolStandings.json 의 리그 키, sub = 세부대회 키(PredictionPage SUBTAB_DEFAULT 와 일치해야 함).
const LEAGUES = [
  { key: 'lck', sub: 'LCK', id: '98767991310872058', groups: true },
  { key: 'lpl', sub: 'Split 2', id: '98767991314006698' },
  { key: 'lec', sub: 'Summer', id: '98767991302996019' },
  { key: 'lcp', sub: 'Split 2', id: '113476371197627891' },
  { key: 'lcs', sub: 'Summer', id: '98767991299243165' },
  { key: 'cblol', sub: 'Split 2', id: '98767991332355509' },
];

// 포스트시즌(정규시즌 이후) — 순위표 성적에서 제외. 블록명/스테이지명/슬러그에 키워드 포함 검사.
const POSTSEASON = [
  '토너먼트', '플레이오프', '플레이-인', '플레이 인', '플레이인', '결승', '승강', '승격', '선발',
  'playoff', 'play_in', 'play-in', 'play in', 'playin', 'knockout', 'final', 'bracket',
  'gauntlet', 'promotion', 'relegation', 'road_to', 'road to',
];
const isPostseason = (s) => {
  const b = (s || '').toLowerCase();
  return POSTSEASON.some((k) => b.includes(k));
};

// 포스트시즌 스테이지의 columns(브래킷)를 대진표 데이터로 변환.
// 그래프 기반 판정(포맷 무관): 매치 승자가 이후 매치에 안 쓰이면 '진출(msi=금)',
//   쓰이면 '라운드 승리(win=파랑)'. 패자가 이후에 안 쓰이면 '탈락(elim=빨강)'.
function bracketFromColumns(columns) {
  const roundOf = {};            // structuralId → 라운드명
  const referenced = new Set();  // `${structuralId}#${slot}` (1=승자, 2=패자)
  const all = [];
  for (const col of columns) for (const cell of col.cells || []) for (const m of cell.matches || []) {
    roundOf[m.structuralId] = cell.name;
    all.push(m);
  }
  for (const m of all) for (const t of m.teams || []) {
    const o = t.origin;
    if (o && o.type === 'match') referenced.add(`${o.structuralId}#${o.slot}`);
  }
  const adv = (sid, slot) => referenced.has(`${sid}#${slot}`);
  const labelOf = (t) => {
    const o = t.origin;
    if (!o) return '';
    if (o.type === 'seeding') return `${o.slot}위`;
    if (o.type === 'match') return `${roundOf[o.structuralId] || ''} ${o.slot === 1 ? '승자' : '패자'}`.trim();
    return '';
  };
  const slotOf = (m, t) => {
    if (!t) return { seed: '' };
    const done = m.state === 'completed';
    const win = t.result?.outcome === 'win';
    let flag = {};
    if (done) {
      if (win) flag = adv(m.structuralId, 1) ? { win: true } : { msi: true };
      else flag = adv(m.structuralId, 2) ? {} : { elim: true };
    }
    const o = { seed: labelOf(t) };
    if (t.code && t.code !== 'TBD') o.short = t.code; // 미정 슬롯(TBD)은 라벨만
    if (done && t.result?.gameWins != null) o.score = t.result.gameWins;
    return { ...o, ...flag };
  };
  const rounds = [];
  for (const col of columns) {
    const matches = [];
    for (const cell of col.cells || []) for (const m of cell.matches || []) {
      const [a, b] = m.teams || [];
      matches.push({ title: cell.name, a: slotOf(m, a), b: slotOf(m, b) });
    }
    if (matches.length) rounds.push({ title: '', matches });
  }
  return rounds;
}

async function api(endpoint, params) {
  const url = `${API}/${endpoint}?` + new URLSearchParams({ hl: HL, ...params });
  const res = await fetch(url, { headers: { 'x-api-key': KEY } });
  if (!res.ok) throw new Error(`${endpoint} 실패: HTTP ${res.status}`);
  return res.json();
}

// 현재(또는 가장 최근 시작된) 2026 토너먼트 선택
function pickCurrentTournament(tournaments) {
  const today = new Date().toISOString().slice(0, 10);
  const y2026 = tournaments.filter((t) => t.endDate >= '2026-01-01');
  const ongoing = y2026.filter((t) => t.startDate <= today && t.endDate >= today);
  const pool = ongoing.length ? ongoing : y2026.filter((t) => t.startDate <= today);
  return pool.sort((a, b) => (a.startDate < b.startDate ? 1 : -1))[0] || null;
}

// 일정 페이지를 토너먼트 시작일까지 거슬러 받아 정규시즌 완료 경기만 모은다
async function collectRegularMatches(leagueId, tour) {
  const matches = [];
  let token = null;
  for (let guard = 0; guard < 20; guard++) {
    const params = { leagueId };
    if (token) params.pageToken = token;
    const { data } = await api('getSchedule', params);
    const events = data.schedule.events || [];
    for (const e of events) {
      if (e.type !== 'match' || e.state !== 'completed') continue;
      const day = (e.startTime || '').slice(0, 10);
      if (day < tour.startDate || day > tour.endDate) continue; // 다른 스플릿 제외
      if (isPostseason(e.blockName)) continue;                   // 포스트시즌 제외
      matches.push(e.match);
    }
    const oldest = events[0]?.startTime?.slice(0, 10);
    token = data.schedule.pages?.older;
    if (!token || (oldest && oldest < tour.startDate)) break;    // 토너먼트 시작 이전이면 중단
  }
  return matches;
}

async function buildLeague(lg) {
  const tjson = await api('getTournamentsForLeague', { leagueId: lg.id });
  const tour = pickCurrentTournament(tjson.data.leagues[0].tournaments);
  if (!tour) throw new Error(`${lg.label}: 현재 토너먼트 없음`);

  const sjson = await api('getStandingsV3', { tournamentId: tour.id });
  const standing = sjson.data.standings[0];
  // 정규시즌 스테이지 = 포스트시즌이 아니면서 순위가 가장 많은 스테이지(정규 리그/그룹 스테이지)
  const regCandidates = standing.stages
    .filter((s) => !isPostseason(s.slug) && !isPostseason(s.name))
    .map((s) => ({ s, n: s.sections.reduce((a, x) => a + x.rankings.length, 0) }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n);
  if (!regCandidates.length) throw new Error(`${lg.label}: 정규시즌 스테이지 없음`);
  const reg = regCandidates[0].s;
  // 섹션이 2개 이상이면 그룹 스테이지 → 섹션명을 그룹으로 사용
  const multi = reg.sections.length > 1;

  // 세트 승패 집계 (정규시즌 완료 경기)
  const set = {}; // code -> {gw, gl, sw, sl}  (sw/sl = 시리즈 검증용)
  const bump = (c) => (set[c] = set[c] || { gw: 0, gl: 0, sw: 0, sl: 0 });
  const matches = await collectRegularMatches(lg.id, tour);
  for (const m of matches) {
    const [a, b] = m.teams;
    if (!a?.code || !b?.code) continue;
    const A = bump(a.code), B = bump(b.code);
    A.gw += a.result.gameWins; A.gl += b.result.gameWins;
    B.gw += b.result.gameWins; B.gl += a.result.gameWins;
    if (a.result.outcome === 'win') { A.sw++; B.sl++; } else { B.sw++; A.sl++; }
  }

  // 공식 순위 + 집계 세트로 행 구성. 시리즈 W-L 불일치 시 gw/gl 생략.
  let mismatches = 0;
  const rows = [];
  for (const sec of reg.sections) {
    for (const r of sec.rankings) {
      for (const t of r.teams) {
        const s = set[t.code];
        const w = t.record.wins, l = t.record.losses;
        const ok = s && s.sw === w && s.sl === l;
        if (!ok) mismatches++;
        const row = { rank: r.ordinal, team: t.code, w, l };
        if (ok) { row.gw = s.gw; row.gl = s.gl; }
        if (multi) row.group = sec.name;
        rows.push(row);
      }
    }
  }
  rows.sort((a, b) => (a.group || '').localeCompare(b.group || '') || a.rank - b.rank);
  // LCK는 단일 섹션이지만 포맷상 상위5 레전드 / 하위5 라이즈로 분할
  if (lg.groups && !multi) rows.forEach((row, i) => { row.group = i < 5 ? 'Legend' : 'Rise'; });

  // LCK 진행 단계 라벨: 정규 1·2R(팀당 18경기) → MSI 선발전(Road to MSI) → 정규 3·4R 순.
  //   18경기 이하면 아직 1·2R 단계(MSI 선발전 후 3·4R 예정)임을 명시.
  let stage = `${standing.name} 정규시즌`;
  if (lg.key === 'lck') {
    const maxG = Math.max(...rows.map((r) => r.w + r.l));
    stage = maxG <= 18
      ? `${standing.name} · 정규 1·2R (MSI 선발전 후 3·4R 진행)`
      : `${standing.name} · 정규 3·4R`;
  }

  // 포스트시즌 브래킷(LCK Road to MSI 등) — columns 있는 비정규 스테이지를 대진표로 변환
  let road = null;
  if (lg.key === 'lck') {
    const rs = standing.stages.find((s) => s.slug === 'road_to_msi');
    const cols = rs?.sections?.[0]?.columns;
    if (cols?.length) {
      const top6 = [...rows].sort((a, b) => a.rank - b.rank).slice(0, 6)
        .map(({ group, ...r }) => r); // 진출 6팀(그룹 라벨 제거)
      road = {
        stage: `${standing.name} · MSI 선발전 (상위 6팀)`,
        rows: top6,
        bracket: {
          desc: '상위 6팀 사다리식 · 전 경기 Bo5 · 금색=MSI 진출, 파랑=라운드 승리, 빨강=탈락',
          rounds: bracketFromColumns(cols),
        },
      };
    }
  }
  return { tour, rows, mismatches, stage, road };
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.standings = data.standings || {};
data.source = data.source || {};

for (const lg of LEAGUES) {
  try {
    const { tour, rows, mismatches, stage, road } = await buildLeague(lg);
    // 기존 수동 키(Road to MSI 등)를 보존하기 위해 통째로 덮어쓰지 않고 병합
    const prev = data.standings[lg.key] || {};
    data.standings[lg.key] = { ...prev, [lg.sub]: { stage, rows } };
    if (road) data.standings[lg.key]['Road to MSI'] = road; // 대진표 자동 갱신
    data.source[lg.key] = `https://lolesports.com/ko-KR/leagues/${lg.key === 'cblol' ? 'cblol-brazil' : lg.key}`;
    const warn = mismatches ? ` ⚠️ 세트 불일치 ${mismatches}팀(gw/gl 생략)` : '';
    const br = road ? ` · 대진표 ${road.bracket.rounds.length}R` : '';
    console.log(`${lg.key.toUpperCase()}: ${tour.slug} · ${rows.length}팀 · 1위 ${rows[0].team} ${rows[0].w}-${rows[0].l}${warn}${br}`);
  } catch (e) {
    console.warn(`${lg.label} 실패 — 기존 값 유지: ${e.message}`);
  }
}

data.updatedAt = new Date().toISOString().slice(0, 10);
data.note = '리그별 → 세부대회별 공식 현재 순위표(정규시즌만, 토너먼트/플레이오프 제외). 있으면 우선 사용, 없으면 GPR 전적으로 대체. gw/gl은 세트(게임) 승-패.';
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('lolStandings.json 갱신 완료');
