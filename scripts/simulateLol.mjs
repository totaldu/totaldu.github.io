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

const ITER = 20000;
const ELO_SCALE = 400;          // 점수차 400 = 약 10배 우세
const PLAYOFF_TEAMS = 6;        // 단순화: 상위 6팀 플레이오프
const GENERATED_AT = '2026-06-11';

// 단판 승률
const gameProb = (ra, rb) => 1 / (1 + Math.pow(10, (rb - ra) / ELO_SCALE));

// 다전제(Bo n) 승률 — 게임별 시뮬레이션
const simSeries = (a, b, need) => {
  let wa = 0, wb = 0;
  const p = gameProb(a.score, b.score);
  while (wa < need && wb < need) (Math.random() < p ? wa++ : wb++);
  return wa === need ? a : b;
};

// Bo n 승률 해석식 (a 기준) — 표시용
const seriesProb = (pa, need) => {
  // need=2 (Bo3), need=3 (Bo5)
  const q = 1 - pa;
  if (need === 2) return pa * pa * (1 + 2 * q);
  return pa * pa * pa * (1 + 3 * q + 6 * q * q);
};

const pct = (x) => Math.round(x * 1000) / 10; // 소수1자리 %

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
    const order = idx.slice().sort((a, b) => (wins[b] - wins[a]) || (Math.random() - 0.5));
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

// ---- 6개 리그 시뮬레이션 ----
const leagues = ['LCK', 'LPL', 'LEC', 'LCP', 'LCS', 'CBLOL'];
for (const lg of leagues) {
  const teams = gpr.teams.filter((t) => t.league === lg);
  const { standings, situations, matches } = simulateLeague(teams);
  const comp = sim.competitions.find((c) => c.key === lg.toLowerCase());
  comp.ready = true;
  comp.status = 'ongoing';
  comp.stage = '정규시즌 + 플레이오프 (시즌 전체)';
  comp.format = '싱글 라운드로빈 Bo3 → 상위 6팀 Bo5 플레이오프';
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

fs.writeFileSync(path.join(dataDir, 'lolSim.json'), JSON.stringify(sim, null, 2) + '\n');
console.log('lolSim.json 갱신 완료');
