// scripts/simulateLol.mjs
// GPR 팀별 점수를 Elo식 승률로 변환해 각 리그를 몬테카를로로 시뮬레이션하고,
// client/src/data/lolSim.json 의 대회별 데이터를 채운다. FST는 실제 결과로 채운다.
//
// 실행: node scripts/simulateLol.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'client', 'src', 'data');

const gpr = JSON.parse(fs.readFileSync(path.join(dataDir, 'gprTeams.json'), 'utf8'));
const sim = JSON.parse(fs.readFileSync(path.join(dataDir, 'lolSim.json'), 'utf8'));
const standingsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'lolStandings.json'), 'utf8'));

const ITER = 100000;
const ELO_SCALE = 400;          // 점수차 400 = 약 10배 우세
const PLAYOFF_TEAMS = 6;        // 단순화: 상위 6팀 플레이오프
const GENERATED_AT = new Date().toISOString(); // 시:분까지 — 페이지에서 KST로 표시

// 시드 고정 PRNG (mulberry32) — 같은 입력이면 같은 결과 → 불필요한 커밋 방지
let _seed = 0x9e3779b9;
const rng = () => {
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// 단판 승률
const gameProb = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / ELO_SCALE));

// 다전제(Bo n) 승률 — 게임별 시뮬레이션
const simSeries = (a, b, need) => {
  let wa = 0, wb = 0;
  const p = gameProb(a.score, b.score);
  while (wa < need && wb < need) (rng() < p ? wa++ : wb++);
  return wa === need ? a : b;
};

// Bo n 승률 해석식 (a 기준) — 표시용
const seriesProb = (pa, need) => {
  // need=2 (Bo3), need=3 (Bo5)
  const q = 1 - pa;
  if (need === 2) return pa * pa * (1 + 2 * q);
  return pa * pa * pa * (1 + 3 * q + 6 * q * q);
};

const pct = (x) => Math.round(x * 10000) / 100; // 소수2자리 %

function simulateLeague(teams) {
  const n = teams.length;
  const idx = teams.map((_, i) => i);
  const stat = teams.map(() => ({ sumRank: 0, rank1: 0, top6: 0, champ: 0, finalApp: 0 }));

  for (let it = 0; it < ITER; it++) {
    const wins = new Array(n).fill(0);
    // 싱글 라운드로빈 Bo3
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const w = simSeries(teams[i], teams[j], 2);
        if (w === teams[i]) wins[i]++; else wins[j]++;
      }
    }
    // 순위 (승수 desc, 동률은 무작위)
    const order = idx.slice().sort((a, b) => (wins[b] - wins[a]) || (rng() - 0.5));
    order.forEach((teamIdx, rank) => {
      stat[teamIdx].sumRank += rank + 1;
      if (rank === 0) stat[teamIdx].rank1++;
      if (rank < PLAYOFF_TEAMS) stat[teamIdx].top6++;
    });

    // 플레이오프 (상위 6, 1·2시드 부전승)
    const s = order.slice(0, PLAYOFF_TEAMS).map((i) => teams[i]);
    const qf1 = simSeries(s[2], s[5], 3);
    const qf2 = simSeries(s[3], s[4], 3);
    const sf1 = simSeries(s[0], qf2, 3);
    const sf2 = simSeries(s[1], qf1, 3);
    const champ = simSeries(sf1, sf2, 3);
    stat[teams.indexOf(sf1)].finalApp++;
    stat[teams.indexOf(sf2)].finalApp++;
    stat[teams.indexOf(champ)].champ++;
  }

  const standings = teams
    .map((t, i) => ({
      team: t.short,
      name: t.name,
      rating: t.score,
      avgRank: stat[i].sumRank / ITER,
      champ: pct(stat[i].champ / ITER),
      advance: pct(stat[i].top6 / ITER),
      rank1: pct(stat[i].rank1 / ITER),
    }))
    .sort((a, b) => b.champ - a.champ || a.avgRank - b.avgRank);

  // 상황별 확률 (자동 생성)
  const byChamp = [...standings];
  const seedByRating = [...teams].sort((a, b) => b.score - a.score);
  const top = byChamp[0], second = byChamp[1];
  const worstAdvance = [...standings].sort((a, b) => a.advance - b.advance)[0];
  const situations = [
    { label: `${top.team} 정규시즌 1위`, prob: top.rank1 },
    { label: `${top.team} 우승`, prob: top.champ },
    { label: `${second.team} 우승`, prob: second.champ },
    { label: `${worstAdvance.team} 플레이오프 진출`, prob: worstAdvance.advance },
  ];

  // 대진별 예측 — GPR 시드 기준 플레이오프 1라운드 + 예상 결승
  const seeds = seedByRating;
  const mk = (a, b) => {
    const pa = seriesProb(gameProb(a.score, b.score), 3);
    return { a: a.short, b: b.short, pA: Math.round(pa * 100), winner: pa >= 0.5 ? a.short : b.short };
  };
  const matches = [
    mk(seeds[2], seeds[5]),
    mk(seeds[3], seeds[4]),
    mk(seeds[0], seeds[1]),
  ];

  return { standings, situations, matches, seeds };
}

// ---- 2026 LCK 전용 시뮬레이션 ----
// 정규시즌 4라운드(Bo3): 1~2R 10팀 더블 라운드로빈 → 상위5 레전드/하위5 라이즈 분할,
//   3~4R 그룹 내 더블 라운드로빈(승수 연계). 최종 순위는 레전드 1~5위, 라이즈 6~10위.
// 플레이인(Bo5, 4팀: 레전드5·라이즈1~3): 1경기 승자 직행, 최종전 승자 직행 → 2팀.
// 플레이오프(Bo5, 6팀 더블 엘리미네이션): 시드 1~4 직행 + 플레이인 2팀(5·6시드).
//   '지목=더 낮은 시드 선택' 가정 → 표준 시드 대진(3v6, 4v5, 1·2시드 UB R2 부전승).
// fixed: { [short]: { w, group } } — 현재까지(정규 1·2R) 결과를 고정하고 잔여 경기만 시뮬.
//   주어지면 그룹 배정과 누적 승수를 실제 순위표로 고정하고 3·4R부터 시뮬레이션한다.
function simulateLCK(teams, fixed) {
  const n = teams.length; // 10
  const ti = (obj) => teams.indexOf(obj);
  const stat = teams.map(() => ({ sumRank: 0, rank1: 0, piPlus: 0, playoff: 0, worlds: 0, champ: 0, finalApp: 0 }));

  // 그룹 내 더블 라운드로빈(쌍별 2시리즈) — 누적 wins에 가산
  const roundRobin = (groupIdx, wins) => {
    for (let a = 0; a < groupIdx.length; a++)
      for (let b = a + 1; b < groupIdx.length; b++)
        for (let g = 0; g < 2; g++) {
          const i = groupIdx[a], j = groupIdx[b];
          if (simSeries(teams[i], teams[j], 2) === teams[i]) wins[i]++; else wins[j]++;
        }
  };

  // 고정 모드 사전 계산: 그룹 멤버 인덱스 + 1·2R 누적 승수(시작값)
  const idxAll = teams.map((_, i) => i);
  const fixedLegend = fixed && idxAll.filter((i) => fixed[teams[i].short]?.group === 'Legend');
  const fixedRise = fixed && idxAll.filter((i) => fixed[teams[i].short]?.group === 'Rise');
  const startWins = fixed && teams.map((t) => fixed[t.short]?.w ?? 0);

  for (let it = 0; it < ITER; it++) {
    let wins, legend, rise;

    if (fixed) {
      // 정규 1·2R 결과 고정: 그룹·누적 승수를 실제 순위표에서 가져오고 3·4R만 시뮬
      wins = startWins.slice();
      legend = fixedLegend;
      rise = fixedRise;
      roundRobin(legend, wins);
      roundRobin(rise, wins);
    } else {
      wins = new Array(n).fill(0);
      const idx = idxAll.slice();
      // 1~2R: 10팀 더블 라운드로빈
      roundRobin(idx, wins);
      // 1~2R 성적으로 그룹 분할 (상위5 레전드 / 하위5 라이즈), 동률 무작위
      const order12 = idx.slice().sort((a, b) => (wins[b] - wins[a]) || (rng() - 0.5));
      legend = order12.slice(0, 5);
      rise = order12.slice(5);
      // 3~4R: 그룹 내 더블 라운드로빈 (1~2R 승수 연계)
      roundRobin(legend, wins);
      roundRobin(rise, wins);
    }

    // 최종 순위 — 그룹 내 누적 승수 기준 (레전드 1~5위, 라이즈 6~10위)
    const legOrder = legend.slice().sort((a, b) => (wins[b] - wins[a]) || (rng() - 0.5));
    const riseOrder = rise.slice().sort((a, b) => (wins[b] - wins[a]) || (rng() - 0.5));
    legOrder.forEach((tIdx, k) => {
      stat[tIdx].sumRank += k + 1;
      if (k === 0) stat[tIdx].rank1++;
      stat[tIdx].piPlus++; // 레전드 1~5위: 플옵 직행 또는 플레이인 → PI+
    });
    riseOrder.forEach((tIdx, k) => {
      stat[tIdx].sumRank += 6 + k;
      if (k < 3) stat[tIdx].piPlus++; // 라이즈 1~3위: 플레이인 → PI+
    });

    // 플레이인 (Bo5): L5 vs R1 → 승자 직행 / 패자 최종전, R2 vs R3 → 승자 최종전
    const L5 = teams[legOrder[4]], R1 = teams[riseOrder[0]], R2 = teams[riseOrder[1]], R3 = teams[riseOrder[2]];
    const pin1W = simSeries(L5, R1, 3);
    const pin1L = pin1W === L5 ? R1 : L5;
    const pin2W = simSeries(R2, R3, 3);
    const finalW = simSeries(pin1L, pin2W, 3); // 최종전 승자 → 직행

    // 6팀 시드: 1~4 레전드 직행, 5 = 플레이인 1경기 승자, 6 = 최종전 승자
    const s1 = teams[legOrder[0]], s2 = teams[legOrder[1]], s3 = teams[legOrder[2]], s4 = teams[legOrder[3]];
    const s5 = pin1W, s6 = finalW;
    [s1, s2, s3, s4, s5, s6].forEach((t) => { stat[ti(t)].playoff++; });
    const seedNum = new Map([[s1, 1], [s2, 2], [s3, 3], [s4, 4], [s5, 5], [s6, 6]]);
    const seedOf = (t) => seedNum.get(t);

    // 플레이오프 — 6팀 더블 엘리미네이션 (Bo5)
    // 승자조 R1: 3v6, 4v5
    const ub1m1W = simSeries(s3, s6, 3), ub1m1L = ub1m1W === s3 ? s6 : s3;
    const ub1m2W = simSeries(s4, s5, 3), ub1m2L = ub1m2W === s4 ? s5 : s4;
    // 1위가 더 낮은 시드를 지목 → 승자조 R2 대진
    const lowW = seedOf(ub1m1W) > seedOf(ub1m2W) ? ub1m1W : ub1m2W;
    const highW = seedOf(ub1m1W) > seedOf(ub1m2W) ? ub1m2W : ub1m1W;
    const ub2m1W = simSeries(s1, lowW, 3), ub2m1L = ub2m1W === s1 ? lowW : s1;
    const ub2m2W = simSeries(s2, highW, 3), ub2m2L = ub2m2W === s2 ? highW : s2;
    // 승자조 R3 → 승자 그랜드파이널 직행, 패자 로어파이널
    const ub3W = simSeries(ub2m1W, ub2m2W, 3), ub3L = ub3W === ub2m1W ? ub2m2W : ub2m1W;
    // 패자조: UB R2 패자 중 시드 높은 팀 → LB R3, 낮은 팀 → LB R2
    const ub2lHigh = seedOf(ub2m1L) < seedOf(ub2m2L) ? ub2m1L : ub2m2L;
    const ub2lLow = seedOf(ub2m1L) < seedOf(ub2m2L) ? ub2m2L : ub2m1L;
    const lb1W = simSeries(ub1m1L, ub1m2L, 3);
    const lb2W = simSeries(ub2lLow, lb1W, 3);
    const lb3W = simSeries(ub2lHigh, lb2W, 3);
    const lowerFinalsW = simSeries(ub3L, lb3W, 3);
    // 그랜드파이널
    const champ = simSeries(ub3W, lowerFinalsW, 3);
    stat[ti(ub3W)].finalApp++;
    stat[ti(lowerFinalsW)].finalApp++;
    stat[ti(champ)].champ++;

    // Worlds 진출 = 최종 3위 이내 (우승 / 그랜드파이널 패자 / 로어파이널 패자)
    const gfLoser = ub3W === champ ? lowerFinalsW : ub3W;
    const lfLoser = lowerFinalsW === ub3L ? lb3W : ub3L;
    [champ, gfLoser, lfLoser].forEach((t) => { stat[ti(t)].worlds++; });
  }

  const standings = teams
    .map((t, i) => ({
      team: t.short,
      name: t.name,
      rating: t.score,
      avgRank: stat[i].sumRank / ITER,
      champ: pct(stat[i].champ / ITER),
      worlds: pct(stat[i].worlds / ITER),
      advance: pct(stat[i].playoff / ITER),
      piPlus: pct(stat[i].piPlus / ITER),
      rank1: pct(stat[i].rank1 / ITER),
    }))
    .sort((a, b) => b.champ - a.champ || a.avgRank - b.avgRank);

  // 상황별 확률
  const byChamp = [...standings];
  const top = byChamp[0], second = byChamp[1];
  const worstAdvance = [...standings].filter((s) => s.advance > 0).sort((a, b) => a.advance - b.advance)[0];
  const situations = [
    { label: `${top.team} 정규시즌 1위`, prob: top.rank1 },
    { label: `${top.team} 우승`, prob: top.champ },
    { label: `${second.team} 우승`, prob: second.champ },
    { label: `${worstAdvance.team} 플레이오프 진출`, prob: worstAdvance.advance },
  ];

  // 대진별 예측 — GPR 레이팅 시드 기준 플레이오프 대진(3v6 / 4v5 / 1v2 예상)
  const seeds = [...teams].sort((a, b) => b.score - a.score);
  const mk = (a, b) => {
    const pa = seriesProb(gameProb(a.score, b.score), 3);
    return { a: a.short, b: b.short, pA: Math.round(pa * 100), winner: pa >= 0.5 ? a.short : b.short };
  };
  const matches = [mk(seeds[2], seeds[5]), mk(seeds[3], seeds[4]), mk(seeds[0], seeds[1])];

  return { standings, situations, matches };
}

// ---- 6개 리그 시뮬레이션 ----
// 인자로 리그를 지정하면 그 리그만 재계산하고 나머지는 기존 lolSim.json 값을 유지한다.
//   예: node scripts/simulateLol.mjs LCK LPL  → LCK·LPL만 시뮬. 인자 없으면 전체.
const ALL_LEAGUES = ['LCK', 'LPL', 'LEC', 'LCP', 'LCS', 'CBLOL'];
const argLeagues = process.argv.slice(2).map((s) => s.toUpperCase());
const leagues = argLeagues.length ? ALL_LEAGUES.filter((l) => argLeagues.includes(l)) : ALL_LEAGUES;
// LCK 현재 순위표(정규 1·2R 완료)를 고정 입력으로 사용 → 잔여 경기만 시뮬
const lckRows = standingsData.standings?.lck?.LCK?.rows;
const lckFixed = lckRows && Object.fromEntries(
  lckRows.map((r) => [r.team, { w: r.w, group: r.group }])
);

for (const lg of leagues) {
  const teams = gpr.teams.filter((t) => t.league === lg);
  const isLck = lg === 'LCK';
  const { standings, situations, matches } = isLck ? simulateLCK(teams, lckFixed) : simulateLeague(teams);
  const comp = sim.competitions.find((c) => c.key === lg.toLowerCase());
  comp.ready = true;
  comp.status = 'ongoing';
  comp.stage = isLck
    ? (lckFixed
        ? '정규 3·4라운드 → 플레이인 → 플레이오프 (1·2R 결과 고정)'
        : '정규시즌 → 플레이인 → 플레이오프 (시즌 전체)')
    : '정규시즌 + 플레이오프 (시즌 전체)';
  comp.format = isLck
    ? '정규 4R Bo3(2R 후 레전드/라이즈 분할) → 플레이인·플레이오프 6팀 더블 엘리미네이션 Bo5'
    : '싱글 라운드로빈 Bo3 → 상위 6팀 Bo5 플레이오프';
  comp.iterations = ITER;
  comp.generatedAt = GENERATED_AT;
  comp.teams = teams.map((t) => ({ name: t.name, short: t.short, rating: t.score }));
  comp.standings = standings;
  comp.situations = situations;
  comp.matches = matches;
  console.log(`${lg}: 우승1위 ${standings[0].team} ${standings[0].champ}% / 팀수 ${teams.length}`);
}

// ---- FST 2026 (종료) 실제 결과 ----
const fstTeams = gpr.teams.filter((t) => t.fst).sort((a, b) => a.fst - b.fst);
const fst = sim.competitions.find((c) => c.key === 'fst');
fst.ready = true;
fst.status = 'finished';
fst.stage = '2026 First Stand (시즌 첫 국제전)';
fst.format = '8개 지역 대표 · 더블 엘리미네이션';
fst.finalResult = {
  champion: fstTeams[0].name,
  runnerUp: fstTeams[1].name,
  standings: fstTeams.map((t) => ({
    rank: t.fst,
    team: t.name,
    note: `${t.league}${t.fst === 1 ? ' · 우승' : t.fst === 2 ? ' · 준우승' : ''}`,
  })),
};
console.log(`FST: 우승 ${fstTeams[0].name}`);

sim.updatedAt = new Date().toISOString(); // 시간까지 포함(페이지에서 KST로 표시)
fs.writeFileSync(path.join(dataDir, 'lolSim.json'), JSON.stringify(sim, null, 2) + '\n');
console.log('lolSim.json 갱신 완료');
