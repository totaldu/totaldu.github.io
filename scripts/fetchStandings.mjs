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
const MSI_LEAGUE_ID = '98767991325878492'; // MSI 리그 ID
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
  // structuralId → {colIdx, matchIdx} (connector 계산용)
  const matchPos = {};
  for (let ci = 0; ci < columns.length; ci++) {
    let mi = 0;
    for (const cell of columns[ci].cells || []) {
      for (const m of cell.matches || []) { matchPos[m.structuralId] = { ci, mi }; mi++; }
    }
  }

  const rounds = [];
  const connectors = [];
  let roundIdx = 0;
  for (let ci = 0; ci < columns.length; ci++) {
    const matches = [];
    let mi = 0;
    for (const cell of columns[ci].cells || []) {
      for (const m of cell.matches || []) {
        const [a, b] = m.teams || [];
        matches.push({ title: cell.name, a: slotOf(m, a), b: slotOf(m, b) });
        // origin이 다른 match인 팀 슬롯 → connector 생성
        for (const [t, slot] of [[a, 'a'], [b, 'b']]) {
          const o = t?.origin;
          if (o?.type === 'match' && matchPos[o.structuralId] != null) {
            const src = matchPos[o.structuralId];
            connectors.push([src.ci, src.mi, 'mid', ci, mi, slot]);
          }
        }
        mi++;
      }
    }
    if (matches.length) { rounds.push({ title: '', matches }); roundIdx++; }
  }
  return { rounds, connectors };
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
        else if (!s && w === 0 && l === 0) { row.gw = 0; row.gl = 0; } // 미시작 → 득실차 0 표기
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
  let roadMsiTeam = null; // Road to MSI 우승팀 (LCK MSI 플레이-인 진출)
  if (lg.key === 'lck') {
    const rs = standing.stages.find((s) => s.slug === 'road_to_msi');
    const cols = rs?.sections?.[0]?.columns;
    if (cols?.length) {
      const top6 = [...rows].sort((a, b) => a.rank - b.rank).slice(0, 6)
        .map(({ group, ...r }) => r); // 진출 6팀(그룹 라벨 제거)
      const { rounds: apiRounds, connectors: apiConnectors } = bracketFromColumns(cols);
      // MSI 우승팀 추출 (msi: true 플래그) — API rounds에서 직접 추출
      for (const r of apiRounds) for (const m of r.matches) {
        if (m.a?.msi && m.a?.short) roadMsiTeam = m.a.short;
        if (m.b?.msi && m.b?.short) roadMsiTeam = m.b.short;
      }
      // 기존 bracket 구조 보존: API가 컬럼을 1:1로 매핑(예: 5열)하더라도
      // lolStandings.json에 이미 "컴팩트 구조"(열 합산, totalRows 포함)가 있으면
      // startRow/totalRows/connectors는 유지하고 경기 결과만 갱신한다.
      const prevBracket = data.standings.lck?.['Road to MSI']?.bracket;
      const isCompact = prevBracket?.rounds && prevBracket.rounds.length < apiRounds.length;
      let bracketRounds, bracketConnectors, bracketTotalRows;
      if (isCompact) {
        const apiByTitle = {};
        for (const r of apiRounds) for (const m of r.matches) {
          if (m.title) apiByTitle[m.title] = m;
        }
        bracketRounds = prevBracket.rounds.map((r) => ({
          ...r,
          matches: r.matches.map((m) => {
            const fresh = m.title ? apiByTitle[m.title] : null;
            return fresh ? { ...fresh, startRow: m.startRow } : m;
          }),
        }));
        bracketConnectors = prevBracket.connectors;
        bracketTotalRows = prevBracket.totalRows;
      } else {
        bracketRounds = apiRounds;
        bracketConnectors = apiConnectors;
        bracketTotalRows = undefined;
      }
      road = {
        stage: `${standing.name} · MSI 선발전 (상위 6팀)`,
        rows: top6,
        bracket: {
          desc: '상위 6팀 사다리식 · 전 경기 Bo5 · 금색=MSI 진출, 파랑=라운드 승리, 빨강=탈락',
          ...(bracketTotalRows != null ? { totalRows: bracketTotalRows } : {}),
          rounds: bracketRounds,
          connectors: bracketConnectors,
        },
      };
    }
  }

  return { tour, rows, mismatches, stage, road, roadMsiTeam };
}

// MSI 진출팀 갱신: getStandingsV3로 각 스테이지의 확정 팀을 가져와
// lolStandings.json 의 msi[stage].qualifiers 를 업데이트한다.
// 미확정(TBD) 슬롯은 기존 label 표기를 유지한다.
async function buildMsiQualifiers(prevMsi) {
  const tjson = await api('getTournamentsForLeague', { leagueId: MSI_LEAGUE_ID });
  // pickCurrentTournament 은 진행 중/과거만 보므로 MSI는 별도로 선택.
  // 올해(2026) 대회를 우선 선택하되, 아직 시작 전(미래)이어도 허용.
  const today = new Date().toISOString().slice(0, 10);
  const all = tjson.data.leagues[0].tournaments || [];
  const y2026 = all.filter((t) => t.endDate >= '2026-01-01' && t.startDate <= '2026-12-31');
  // 가장 가까운 2026 대회 (진행 중 우선, 없으면 다음 예정)
  const tour = y2026.sort((a, b) => {
    const da = Math.abs(new Date(a.startDate) - new Date(today));
    const db = Math.abs(new Date(b.startDate) - new Date(today));
    return da - db;
  })[0] || null;
  if (!tour) return null;

  const sjson = await api('getStandingsV3', { tournamentId: tour.id });
  const standing = sjson.data.standings[0];
  const result = {};

  for (const stage of standing.stages || []) {
    const slug = (stage.slug || stage.name || '').toLowerCase();
    const stageKey = slug.includes('play') ? '플레이-인 스테이지' : '브래킷 스테이지';
    const prevStage = prevMsi[stageKey];
    if (!prevStage) continue;

    const prevQual = prevStage.qualifiers || [];
    const slots = [];

    // 1) 순위표 기반 (그룹 스테이지)
    for (const sec of stage.sections || []) {
      const ranked = [...(sec.rankings || [])].sort((a, b) => a.ordinal - b.ordinal);
      for (const r of ranked) {
        for (const t of r.teams || []) {
          slots.push(t.code && t.code !== 'TBD' ? { short: t.code } : null);
        }
      }
    }

    // 2) 브래킷 시딩 기반 (순위표 없을 때)
    if (!slots.length) {
      const seen = new Map(); // seed → code
      for (const sec of stage.sections || []) {
        for (const col of sec.columns || []) {
          for (const cell of col.cells || []) {
            for (const m of cell.matches || []) {
              for (const t of m.teams || []) {
                if (t.origin?.type === 'seeding') {
                  const seed = t.origin.slot;
                  if (!seen.has(seed)) seen.set(seed, t.code && t.code !== 'TBD' ? t.code : null);
                }
              }
            }
          }
        }
      }
      [...seen.keys()].sort((a, b) => a - b).forEach((s) => {
        const code = seen.get(s);
        slots.push(code ? { short: code } : null);
      });
    }

    if (!slots.length) continue;

    // API 슬롯이 prevQual보다 짧을 수 있으므로 prevQual 길이 기준으로 iterate
    // null 슬롯 또는 범위 초과 슬롯 → 기존 label 유지
    const qualifiers = Array.from({ length: prevQual.length }, (_, i) => {
      const s = i < slots.length ? slots[i] : null;
      return s ?? prevQual[i] ?? null;
    }).filter(Boolean);

    result[stageKey] = qualifiers;
    const confirmed = qualifiers.filter((q) => q.short).length;
    const names = qualifiers.filter((q) => q.short).map((q) => q.short).join(', ');
    console.log(`MSI ${stageKey}: ${confirmed}/${qualifiers.length}팀 확정 (${names || '없음'})`);
  }

  return Object.keys(result).length ? result : null;
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
data.standings = data.standings || {};
data.source = data.source || {};

// 리그별 Road to MSI 우승팀 수집: lgKey → team code
const roadMsiByLeague = {};

for (const lg of LEAGUES) {
  try {
    const { tour, rows, mismatches, stage, road, roadMsiTeam } = await buildLeague(lg);
    // 기존 수동 키(Road to MSI 등)를 보존하기 위해 통째로 덮어쓰지 않고 병합
    const prev = data.standings[lg.key] || {};
    data.standings[lg.key] = { ...prev, [lg.sub]: { stage, rows } };
    if (road) data.standings[lg.key]['Road to MSI'] = road; // 대진표 자동 갱신
    data.source[lg.key] = `https://lolesports.com/ko-KR/leagues/${lg.key === 'cblol' ? 'cblol-brazil' : lg.key}`;
    const warn = mismatches ? ` ⚠️ 세트 불일치 ${mismatches}팀(gw/gl 생략)` : '';
    const br = road ? ` · 대진표 ${road.bracket.rounds.length}R` : '';
    console.log(`${lg.key.toUpperCase()}: ${tour.slug} · ${rows.length}팀 · 1위 ${rows[0].team} ${rows[0].w}-${rows[0].l}${warn}${br}`);
    if (roadMsiTeam) roadMsiByLeague[lg.key] = roadMsiTeam;
  } catch (e) {
    console.warn(`${lg.label} 실패 — 기존 값 유지: ${e.message}`);
  }
}

// MSI 진출팀 갱신 — 두 단계로 시도:
// 1) label 텍스트의 "리그 · 팀A vs 팀B 승자/패자" 패턴으로 스케줄 직접 조회 (즉시 반영)
// 2) MSI API 직접 조회 (대회 시작 후 순위표가 생기면 반영)

// 리그명(한글/영문 prefix) → LEAGUES leagueId 맵
const LABEL_TO_LEAGUE = Object.fromEntries(
  LEAGUES.map((lg) => [lg.key.toUpperCase(), lg.id])
);

// label에서 "리그 · TEAM1 vs TEAM2 승자/패자" 파싱
// 단순형: team1+team2 직접 반환
// 괄호형 "(T1·T2 승자/패자) vs TEAM3": parenTeam1/2/Want + team2 반환
function parseMsiLabel(label) {
  // 단순 패턴: "LEAGUE · TEAM1 vs TEAM2 승자/패자"
  const simple = label.match(/^([A-Z]+)\s·\s+(\w+)\s+vs\s+(\w+)\s+(승자|패자)$/);
  if (simple) return { lgKey: simple[1], team1: simple[2], team2: simple[3], want: simple[4] };

  // 괄호형 패턴: "LEAGUE · (TEAM1·TEAM2 승자/패자) vs TEAM3 승자/패자"
  const paren = label.match(/^([A-Z]+)\s·\s+\((\w+)·(\w+)\s+(승자|패자)\)\s+vs\s+(\w+)\s+(승자|패자)$/);
  if (paren) return { lgKey: paren[1], parenTeam1: paren[2], parenTeam2: paren[3], parenWant: paren[4], team2: paren[5], want: paren[6] };

  return null;
}

// 해당 리그 스케줄에서 특정 매치 결과 조회
// team1+team2 둘 다 주어지면 두 팀 모두 포함된 경기만 찾음
// afterDate(ISO 문자열)가 있으면 그 날짜 이후 경기만 인정
async function findMatchResult(leagueId, team1, team2, afterDate = null) {
  let token = null;
  for (let guard = 0; guard < 6; guard++) {
    const params = { leagueId };
    if (token) params.pageToken = token;
    const { data: d } = await api('getSchedule', params);
    const events = d.schedule.events || [];
    for (const e of events) {
      if (e.type !== 'match' || e.state !== 'completed') continue;
      if (afterDate && e.startTime && e.startTime < afterDate) continue;
      const teams = e.match?.teams || [];
      const codes = teams.map((t) => t.code);
      if (team1 && team2) {
        if (!codes.includes(team1) || !codes.includes(team2)) continue;
      } else {
        if (!codes.includes(team2)) continue;
      }
      const winner = teams.find((t) => t.result?.outcome === 'win')?.code;
      const loser  = teams.find((t) => t.result?.outcome === 'loss')?.code;
      if (winner && loser) return { winner, loser };
    }
    token = d.schedule.pages?.older;
    if (!token) break;
  }
  return null;
}

try {
  const prevMsi = data.standings.msi || {};
  let anyChanged = false;

  for (const stageKey of ['플레이-인 스테이지', '브래킷 스테이지']) {
    const prevStage = prevMsi[stageKey];
    if (!prevStage?.qualifiers) continue;

    for (let i = 0; i < prevStage.qualifiers.length; i++) {
      const q = prevStage.qualifiers[i];
      if (q.short || !q.label) continue;

      // "리그 · TEAM1 vs TEAM2 승자/패자" 패턴 → 스케줄 직접 조회
      const parsed = parseMsiLabel(q.label);
      if (!parsed) continue;
      const leagueId = LABEL_TO_LEAGUE[parsed.lgKey];
      if (!leagueId) continue;

      if (!parsed.team1) {
        // 괄호형: 선행 경기(parenTeam1 vs parenTeam2) 결과로 team1 확정 후 최종 경기 조회
        if (!parsed.parenTeam1) continue;
        const preResult = await findMatchResult(leagueId, parsed.parenTeam1, parsed.parenTeam2, q.after);
        if (!preResult) continue; // 선행 경기 미완료
        const resolvedTeam1 = parsed.parenWant === '승자' ? preResult.winner : preResult.loser;
        if (!resolvedTeam1) continue;
        const result = await findMatchResult(leagueId, resolvedTeam1, parsed.team2, q.after);
        if (!result) continue;
        const code = parsed.want === '승자' ? result.winner : result.loser;
        if (code) { prevStage.qualifiers[i] = { short: code }; anyChanged = true; }
        continue;
      }
      const result = await findMatchResult(leagueId, parsed.team1, parsed.team2, q.after);
      if (!result) continue;

      const code = parsed.want === '승자' ? result.winner : result.loser;
      if (code) { prevStage.qualifiers[i] = { short: code }; anyChanged = true; }
    }
  }

  if (anyChanged) {
    data.standings.msi = prevMsi;
    for (const stageKey of ['플레이-인 스테이지', '브래킷 스테이지']) {
      const confirmed = (prevMsi[stageKey]?.qualifiers || [])
        .filter((q) => q.short).map((q) => q.short).join(', ');
      if (confirmed) console.log(`MSI ${stageKey}: ${confirmed}`);
    }
  }
} catch (e) {
  console.warn(`MSI 진출팀 갱신 실패 — 기존 값 유지: ${e.message}`);
}

// 2단계: MSI API 직접 조회 (대회 시작 후 순위표가 생기면 반영)
try {
  const prevMsi = data.standings.msi || {};
  const msiQual = await buildMsiQualifiers(prevMsi);
  if (msiQual) {
    for (const [stageKey, qualifiers] of Object.entries(msiQual)) {
      if (prevMsi[stageKey]) prevMsi[stageKey] = { ...prevMsi[stageKey], qualifiers };
    }
    data.standings.msi = prevMsi;
  }
} catch (e) {
  console.warn(`MSI API 갱신 실패 — 기존 값 유지: ${e.message}`);
}

data.updatedAt = new Date().toISOString().slice(0, 10);
data.note = '리그별 → 세부대회별 공식 현재 순위표(정규시즌만, 토너먼트/플레이오프 제외). 있으면 우선 사용, 없으면 GPR 전적으로 대체. gw/gl은 세트(게임) 승-패.';
fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('lolStandings.json 갱신 완료');
