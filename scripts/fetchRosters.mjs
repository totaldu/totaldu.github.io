// scripts/fetchRosters.mjs
// lolesports API에서 각 팀의 선수 로스터를 가져와 lolRosters.json 생성

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';

// short → lolesports team ID
const TEAM_IDS = {
  // LCK
  GEN: '100205573495116443',
  T1:  '98767991853197861',
  HLE: '100205573496804586',
  KT:  '99566404579461230',
  DK:  '100725845018863243',
  BFX: '100725845022060229',
  KRX: '99566404585387054',
  BRO: '105505619546859895',
  NS:  '102747101565183056',
  DNS: '99566404581868574',
  // LPL
  BLG: '99566404853854212',
  TES: '99566404854685458',
  JDG: '99566404852189289',
  AL:  '99566404856367466',
  WBG: '99566404853058754',
  NIP: '101388912914513220',
  IG:  '99566404848691211',
  WE:  '98767991887166787',
  LNG: '99566404850008779',
  TT:  '101388912911039804',
  LGD: '99566404846951820',
  EDG: '98767991882270868',
  UP:  '103461966986776720',
  OMG: '99566404845279652',
  // LEC
  G2:   '98767991926151025',
  FNC:  '98767991866488695',
  VIT:  '99322214695067838',
  KC:   '111692118851466302',
  SK:   '101383793567806688',
  GX:   '101383793572656373',
  MKOI: '103461966965149786',
  SHFT: '107563714667537640',
  TH:   '109637393694097670',
  NAVI: '114868016111590239',
  // LCS
  LYON: '99566405941863385',
  C9:   '98767991877340524',
  FLY:  '98926509892121852',
  TLAW: '98926509885559666',
  DIG:  '98926509883054987',
  DSG:  '110428362822825796',
  SR:   '111504538396430510',
  // LCP
  TSW: '113661839307879869',
  GAM: '98767991954244555',
  DCG: '107700204561086446',
  CFO: '107700199633958891',
  MVK: '107251245690956393',
  SHG: '103535282119620510',
  GZ:  '109675490370327425',
  DFM: '100285330168091787',
  // CBLOL
  FUR:  '100205576309502431',
  RED:  '99566408221961358',
  LOUD: '105397404796640412',
  PAIN: '99566408217955692',
  VKS:  '99566408219409348',
  LOS:  '109480204628225868',
  FX:   '109480056092207899',
  LEV:  '107598699275015260',
};

const ROLE_ORDER = ['top', 'jungle', 'mid', 'bottom', 'support'];

// 주전 판별용 리그 일정 (MyPredictionPage 와 동일)
const LEAGUE_IDS = [
  '98767991310872058',  // LCK
  '98767991314006698',  // LPL
  '98767991302996019',  // LEC
  '98767991299243165',  // LCS
  '98767991325878492',  // MSI
  '107898214974993351', // LCP
  '98767991332355509',  // CBLOL
];

const api = (path) =>
  fetch(`https://esports-api.lolesports.com/persisted/gw/${path}`, {
    headers: { 'x-api-key': API_KEY },
  }).then((r) => r.json());

async function fetchTeam(id) {
  const json = await api(`getTeams?hl=ko-KR&id=${id}`);
  return json?.data?.teams?.[0] ?? null;
}

// 모든 리그의 완료 경기를 모아 팀코드 → 최근 완료 matchId 맵 생성
// (일정 API의 팀 객체에는 id가 없고 code만 있으므로 code 기준으로 키 생성)
async function buildRecentMatchMap() {
  const recent = {}; // teamCode → { startTime, matchId }
  for (const lid of LEAGUE_IDS) {
    try {
      const json = await api(`getSchedule?hl=ko-KR&leagueId=${lid}`);
      const events = json?.data?.schedule?.events ?? [];
      for (const e of events) {
        if (e.type !== 'match' || e.state !== 'completed') continue;
        for (const t of e.match.teams) {
          if (!t.code) continue;
          const prev = recent[t.code];
          if (!prev || new Date(e.startTime) > new Date(prev.startTime)) {
            recent[t.code] = { startTime: e.startTime, matchId: e.match.id };
          }
        }
      }
    } catch (e) {
      console.log(`  schedule ${lid} ERROR: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  return recent;
}

// 라인업 소환사명에서 팀 코드 접두사 제거: "GEN Kiin"(공백) / "BLGBin"(공백 없음) 모두 처리
const stripCode = (n, code) => {
  if (code && n.startsWith(code + ' ')) return n.slice(code.length + 1).trim();
  if (code && n.startsWith(code)) return n.slice(code.length).trim();
  return n.replace(/^\S+\s+/, '').trim();
};

// 최근 경기 game1 라인업 → 해당 팀 주전 소환사명 Set
// 주의: getEventDetails 의 blue/red 와 livestats window 의 blue/red 배정이 서로 다르므로
//       side 매핑 대신 로스터 이름과 가장 많이 일치하는 블록을 주전 라인업으로 선택한다.
async function fetchStarters(matchId, teamCode, rosterNames) {
  const det = await api(`getEventDetails?hl=ko-KR&id=${matchId}`);
  const game = det?.data?.event?.match?.games?.find((g) => g.state === 'completed');
  if (!game) return null;
  const r = await fetch(`https://feed.lolesports.com/livestats/v1/window/${game.id}`, {
    headers: { 'x-api-key': API_KEY },
  });
  if (r.status !== 200) return null;
  const win = await r.json();
  const blocks = [win?.gameMetadata?.blueTeamMetadata, win?.gameMetadata?.redTeamMetadata];
  let best = null, bestCount = 0;
  for (const b of blocks) {
    const names = (b?.participantMetadata ?? []).map((p) => stripCode(p.summonerName, teamCode));
    const count = names.filter((n) => rosterNames.has(n)).length;
    if (count > bestCount) { bestCount = count; best = names; }
  }
  return best ? new Set(best) : null;
}

async function main() {
  console.log('Building recent match map...');
  const recentMatch = await buildRecentMatchMap();
  console.log(`  ${Object.keys(recentMatch).length} teams have recent matches\n`);

  const rosters = {};
  const shorts = Object.keys(TEAM_IDS);

  for (const short of shorts) {
    const id = TEAM_IDS[short];
    process.stdout.write(`Fetching ${short}...`);
    try {
      const team = await fetchTeam(id);
      if (!team) { console.log(' no data'); continue; }

      const rosterPlayers = (team.players ?? []).filter(p => ROLE_ORDER.includes(p.role));
      const rosterNames = new Set(rosterPlayers.map(p => p.summonerName));

      // 최근 경기 주전 라인업 판별 (팀 코드로 최근 경기 조회)
      let starters = null;
      const rm = recentMatch[team.code];
      if (rm) {
        try {
          starters = await fetchStarters(rm.matchId, team.code, rosterNames);
        } catch { /* 라인업 조회 실패 시 무시 */ }
      }

      const players = rosterPlayers
        .map(p => ({
          name: p.summonerName,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          role: p.role,
          image: p.image || '',
          starter: starters ? starters.has(p.summonerName) : false,
        }))
        // 역할 순서 → 같은 역할 내에서는 주전 먼저
        .sort((a, b) => {
          const r = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
          if (r !== 0) return r;
          return (b.starter ? 1 : 0) - (a.starter ? 1 : 0);
        });

      rosters[short] = { id, players };
      console.log(` ${players.length} players${starters ? ` (주전 ${players.filter(p => p.starter).length})` : ''}`);
    } catch (e) {
      console.log(` ERROR: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 80));
  }

  const out = {
    updatedAt: new Date().toISOString().slice(0, 10),
    rosters,
  };
  const outPath = resolve(__dirname, '../client/src/data/lolRosters.json');
  writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main();
