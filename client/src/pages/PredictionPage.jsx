// client/src/pages/PredictionPage.jsx
import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Target, Trophy, ExternalLink, Globe, Flag, Crown, Hourglass, BarChart3 } from 'lucide-react';
import sim from '../data/lolSim.json';
import gpr from '../data/lolGpr.json';
import gprTeams from '../data/gprTeams.json';
import officialStandings from '../data/lolStandings.json';
import GprTable, { TeamLogo } from '../components/GprTable';
import { textOn, lighten } from '../utils/colorContrast';

const statusMeta = {
  finished: { label: '종료', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  ongoing: { label: '진행중', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  upcoming: { label: '예정', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
};

const ScopeIcon = ({ scope, ...rest }) => (scope === 'intl' ? <Globe {...rest} /> : <Flag {...rest} />);

// 팀 short → 실제 전적(GPR 기준). gw/gl = 세트(게임) 승-패
const recordByShort = Object.fromEntries(
  gprTeams.teams.map((t) => [t.short, { w: t.w ?? 0, l: t.l ?? 0, gw: t.gw, gl: t.gl }])
);
// 팀 short → 로고 / 풀네임
const logoByShort = Object.fromEntries(gprTeams.teams.map((t) => [t.short, t.logo]));
const nameByShort = Object.fromEntries(gprTeams.teams.map((t) => [t.short, t.name]));

// 대진표 슬롯 — 시드가 확정된 팀이면 로고+이름, 아니면 시드/출처 라벨(미정)
const BracketSlot = ({ slot }) => (
  <div className="flex items-center gap-1.5 px-2 py-1.5 min-h-[30px]">
    {slot.short ? (
      <>
        <TeamLogo src={logoByShort[slot.short]} size={16} />
        <span className="truncate text-xs font-bold text-white/90">{nameByShort[slot.short] || slot.short}</span>
      </>
    ) : (
      <span className="truncate text-xs text-white/40">{slot.seed}</span>
    )}
  </div>
);
const Bracket = ({ rounds }) => (
  <div className="flex gap-4 overflow-x-auto pb-1">
    {rounds.map((r, ri) => (
      <div key={ri} className="flex flex-col justify-around gap-5 min-w-[170px]">
        <p className="text-[11px] font-black text-white/40 uppercase tracking-wider">{r.title}</p>
        {r.matches.map((m, mi) => (
          <div key={mi} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <BracketSlot slot={m.a} />
            <div className="h-px bg-white/10" />
            <BracketSlot slot={m.b} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

// Road to MSI(선발전) 사다리식 대진표 — 실제 점수·진출/MSI 결과 표기
const MsiSlot = ({ s }) => {
  // MSI(토너먼트) 진출 = 금색, 하위 라운드 승자 = 파랑, 탈락 = 빨강 배경
  const accent = s?.msi ? '#E8C77E' : s?.win ? '#60A5FA' : null;
  const bg = s?.msi ? 'rgba(232,199,126,0.16)' : s?.win ? 'rgba(96,165,250,0.14)' : s?.elim ? 'rgba(248,113,113,0.18)' : 'transparent';
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 min-h-[36px]" style={{ backgroundColor: bg }}>
      <span className="text-[10px] text-white/40 w-9 shrink-0 truncate">{s?.seed || s?.label || ''}</span>
      {s?.short ? (
        <>
          <TeamLogo src={logoByShort[s.short]} size={16} />
          <span className="text-xs font-bold truncate" style={{ color: accent || 'rgba(255,255,255,0.88)' }}>{s.short}</span>
        </>
      ) : (
        <span className="text-xs text-white/30">미정</span>
      )}
      <span className="ml-auto text-sm font-black font-mono shrink-0" style={{ color: accent || 'rgba(255,255,255,0.45)' }}>
        {s?.score != null ? s.score : ''}
      </span>
    </div>
  );
};
const MsiBracket = ({ rounds }) => (
  <div className="flex gap-4 overflow-x-auto pb-1">
    {rounds.map((r, ri) => (
      <div key={ri} className="flex flex-col justify-center gap-5 min-w-[200px]">
        <p className="text-[11px] font-black text-white/40 uppercase tracking-wider">{r.title}</p>
        {r.matches.map((m, mi) => (
          <div key={mi} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-2.5 py-1.5 bg-white/10 text-[11px] font-black text-white/70">{m.title}</div>
            <MsiSlot s={m.a} />
            <div className="h-px bg-white/10" />
            <MsiSlot s={m.b} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

// 현재 순위 표 (그룹 단위로 재사용) — 승률 대신 예측 확률(PI+/PO/Worlds/우승)을 표기
// cols 가 주어지면 그 컬럼만 표시(단계별 뷰), 없으면 데이터 유무로 자동 판단
const StandingsTable = ({ rows, color, hasDiff, cols }) => {
  const showDiff = cols ? !!cols.diff : hasDiff;
  const hasPiPlus = cols ? !!cols.piPlus : rows.some((r) => r.prob?.piPlus != null);
  const hasAdvance = cols ? !!cols.advance : rows.some((r) => r.prob);
  const hasChamp = cols ? !!cols.champ : rows.some((r) => r.prob);
  const hasWorlds = cols ? !!cols.worlds : rows.some((r) => r.prob?.worlds != null);
  // 확률 셀 (소수 2자리) — 값 + 막대 바
  const prob = (v, c, strong) => (
    <td className="py-2 px-2">
      <div className="flex items-center gap-2 justify-end">
        <div className="hidden sm:block w-14 h-1.5 rounded-full bg-white/5 overflow-hidden shrink-0">
          {v != null && (
            <div className="h-full rounded-full" style={{ width: `${Math.min(v, 100)}%`, backgroundColor: c }} />
          )}
        </div>
        <span className="font-mono tabular-nums w-16 text-right whitespace-nowrap"
          style={{ color: v != null ? c : '#6B7280', fontWeight: strong ? 800 : 500 }}>
          {v != null ? `${v.toFixed(2)}%` : '-'}
        </span>
      </div>
    </td>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-white/40 text-xs border-b border-white/10">
            <th className="text-center font-bold py-2 px-2 w-10">#</th>
            <th className="text-left font-bold py-2 pr-2">팀</th>
            <th className="text-center font-bold py-2 px-2">승-패</th>
            {showDiff && <th className="text-center font-bold py-2 px-2">득실차</th>}
            {hasPiPlus && <th className="text-right font-bold py-2 px-2">PI+ 진출</th>}
            {hasAdvance && <th className="text-right font-bold py-2 px-2">PO 진출</th>}
            {hasWorlds && <th className="text-right font-bold py-2 px-2">Worlds 진출</th>}
            {hasChamp && <th className="text-right font-bold py-2 px-2">우승</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.short} className="border-b border-white/5">
              <td className="py-2 px-2 text-center text-white/40 font-mono">{t.rank}</td>
              <td className="py-2 pr-2">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamLogo src={logoByShort[t.short]} />
                  <span className="font-bold text-white/90 truncate">{nameByShort[t.short] || t.short}</span>
                </div>
              </td>
              <td className="py-2 px-2 text-center text-white/70 font-mono">{t.games ? `${t.w}-${t.l}` : '-'}</td>
              {showDiff && (
                <td className="py-2 px-2 text-center font-mono"
                  style={{ color: t.gd > 0 ? '#34D399' : t.gd < 0 ? '#F87171' : '#9CA3AF' }}>
                  {t.gd != null ? `${t.gd > 0 ? '+' : ''}${t.gd}` : '-'}
                </td>
              )}
              {hasPiPlus && prob(t.prob?.piPlus, '#9CA3AF')}
              {hasAdvance && prob(t.prob?.advance, lighten(color))}
              {hasWorlds && prob(t.prob?.worlds, '#60A5FA')}
              {hasChamp && prob(t.prob?.champ, '#E8C77E', true)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 갱신 시각을 KST(시:분까지)로 표시. 날짜만 들어와도 그대로 출력
const fmtUpdated = (v) => {
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }) + ' KST';
};

// 단계별 뷰 설정 (LCK→LCK 에서 정규시즌/플레이-인/플레이오프 선택 시)
const STAGE_CFG = {
  '정규시즌': { cols: { diff: true, piPlus: true, advance: true, worlds: true, champ: true }, matches: false, heading: '정규시즌 순위', desc: '현재 순위 + 예상 진출·우승 확률.' },
  '플레이-인': { cols: { piPlus: true, advance: true }, matches: false, heading: '플레이-인 예측', desc: '레전드 5위 + 라이즈 1~3위가 겨루는 플레이-인 단계. PI+/플레이오프 진출 확률.' },
  '플레이오프': { cols: { advance: true, worlds: true, champ: true }, matches: false, heading: '플레이오프 예측', desc: '플레이오프 진출·우승·Worlds 진출 확률. 확정 시드 기준 대진표.' },
};

// 시뮬레이션 결과(예측) 렌더
const SimulationView = ({ comp, sub, stage }) => {
  const cfg = stage ? STAGE_CFG[stage] : null;
  // 현재 순위 — 해당 세부대회 공식 순위표가 있으면 우선, 없으면 GPR 전적으로 산출
  const leagueStd = officialStandings.standings[comp.key];
  const official = leagueStd ? leagueStd[sub] : null;
  const setDiff = (gw, gl) => (gw != null && gl != null ? gw - gl : null);
  const current = official
    ? official.rows.map((r) => {
        const g = r.w + r.l;
        return { short: r.team, w: r.w, l: r.l, group: r.group, games: g, winRate: g ? r.w / g : 0, gd: setDiff(r.gw, r.gl) };
      })
    : (comp.teams || [])
        .map((t) => {
          const { w, l, gw, gl } = recordByShort[t.short] || { w: 0, l: 0 };
          const g = w + l;
          return { ...t, w, l, games: g, winRate: g ? w / g : 0, gd: setDiff(gw, gl) };
        })
        .sort((a, b) => b.winRate - a.winRate || b.w - a.w || (b.gd ?? -99) - (a.gd ?? -99) || b.rating - a.rating);
  const hasDiff = current.some((t) => t.gd != null);
  // Road to MSI(MSI 선발전): 정규 2R 기준 진출 6팀 명단만 표기, 시즌 예측 확률 컬럼은 생략
  const roadToMsi = comp.key === 'lck' && sub === 'Road to MSI';
  // 팀 약칭 → 시뮬 예측 확률 (현재 순위표에 합쳐 표기)
  const probByShort = Object.fromEntries((comp.standings || []).map((s) => [s.team, s]));
  // 그룹이 있으면 그룹별로 분리하고 각 그룹 내 1위부터 재번호
  const grouped = !!official && current.some((t) => t.group);
  const withProb = (t, rank) => ({ ...t, rank, prob: probByShort[t.short] });
  // 그룹명 → 표시 라벨·배지. 알려진 LCK 그룹은 고정색, 그 외(LPL 그룹 스테이지 등)는 기본 팔레트 순환.
  const GROUP_META = {
    Legend: { label: '레전드 그룹', badge: { color: '#E8C77E', bg: 'rgba(200,150,62,0.2)' } },
    Rise: { label: '라이즈 그룹', badge: { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' } },
  };
  const FALLBACK_BADGES = [
    { color: '#E8C77E', bg: 'rgba(200,150,62,0.2)' },
    { color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
    { color: '#7EC8E8', bg: 'rgba(62,150,200,0.2)' },
  ];
  // LCK 플레이-인/플레이오프: 확정 시드만 표기한 대진표 (정규시즌 종료 전이면 미정)
  let bracket = null;
  let groups;
  const lckBracketStage = comp.key === 'lck' && grouped && (stage === '플레이-인' || stage === '플레이오프');
  // 정규시즌 종료 전이면 진출팀 미정 → 참가팀 표는 비워둠
  const seedsPending = lckBracketStage && !official?.seedsLocked;
  if (lckBracketStage) {
    const legend = current.filter((t) => t.group === 'Legend'); // L1~L5 (순위순)
    const rise = current.filter((t) => t.group === 'Rise'); // R1~R5
    const playin = [legend[4], rise[0], rise[1], rise[2]].filter(Boolean); // L5, R1~R3
    const direct = legend.slice(0, 4); // L1~L4 플레이오프 직행
    const locked = !!official?.seedsLocked; // 정규시즌 종료 → 시드 확정
    // 시드 슬롯: 확정(locked)일 때만 팀 표기, 아니면 라벨만(미정)
    const slot = (seed, team) => ({ seed, short: locked && team ? team.short : null });
    if (stage === '플레이-인') {
      groups = locked ? [{ name: null, rows: playin.map((t, i) => withProb(t, i + 1)) }] : [];
      bracket = {
        desc: '레전드 5위 + 라이즈 1~3위 · 승자 2팀 플레이오프 진출 · 전 경기 Bo5',
        sections: [{
          name: null,
          rounds: [
            { title: '플레이-인 1R', matches: [
              { a: slot('레전드 5위', legend[4]), b: slot('라이즈 1위', rise[0]) },
              { a: slot('라이즈 2위', rise[1]), b: slot('라이즈 3위', rise[2]) },
            ] },
            { title: '최종전', matches: [
              { a: slot('1경기 패자'), b: slot('2경기 승자') },
            ] },
          ],
        }],
      };
    } else {
      groups = locked ? [{ name: null, rows: direct.map((t, i) => withProb(t, i + 1)) }] : [];
      // 6팀 더블 엘리미네이션 — 1~4시드 레전드 직행, 5·6시드 플레이인 통과(미정)
      bracket = {
        desc: '레전드 1~4위 직행 + 플레이-인 통과 2팀 · 6팀 더블 엘리미네이션 · 전 경기 Bo5',
        sections: [
          { name: '승자조 (Upper Bracket)', rounds: [
            { title: 'UB R1', matches: [
              { a: slot('레전드 3위', legend[2]), b: slot('플레이인 진출') },
              { a: slot('레전드 4위', legend[3]), b: slot('플레이인 진출') },
            ] },
            { title: 'UB R2', matches: [
              { a: slot('레전드 1위', legend[0]), b: slot('UB R1 승자') },
              { a: slot('레전드 2위', legend[1]), b: slot('UB R1 승자') },
            ] },
            { title: 'UB R3', matches: [
              { a: slot('UB R2 M1 승자'), b: slot('UB R2 M2 승자') },
            ] },
            { title: '그랜드 파이널', matches: [
              { a: slot('승자조 우승'), b: slot('로어 파이널 승자') },
            ] },
          ] },
          { name: '패자조 (Lower Bracket)', rounds: [
            { title: 'LB R1', matches: [
              { a: slot('UB R1 M1 패자'), b: slot('UB R1 M2 패자') },
            ] },
            { title: 'LB R2', matches: [
              { a: slot('UB R2 패자 (낮은 시드)'), b: slot('LB R1 승자') },
            ] },
            { title: 'LB R3', matches: [
              { a: slot('UB R2 패자 (높은 시드)'), b: slot('LB R2 승자') },
            ] },
            { title: '로어 파이널', matches: [
              { a: slot('UB R3 패자'), b: slot('LB R3 승자') },
            ] },
          ] },
        ],
      };
    }
  } else {
    groups = grouped
      ? [...new Set(current.map((t) => t.group))].map((name, gi) => ({
          name: GROUP_META[name]?.label ?? name,
          badge: GROUP_META[name]?.badge ?? FALLBACK_BADGES[gi % FALLBACK_BADGES.length],
          rows: current.filter((t) => t.group === name).map((t, i) => withProb(t, i + 1)),
        }))
      : [{ name: null, rows: current.map((t, i) => (roadToMsi ? { ...t, rank: t.rank ?? i + 1 } : withProb(t, t.rank ?? i + 1))) }];
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 메타 */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {(comp.stage || comp.format) && (
          <span className="text-white/50">형식: <strong className="text-white/80">{[comp.stage, comp.format].filter(Boolean).join(' · ')}</strong></span>
        )}
        {comp.iterations > 0 && <span className="text-white/50">반복: <strong className="text-white/80">{comp.iterations.toLocaleString()}회</strong></span>}
        {comp.generatedAt && <span className="text-white/50">생성: <strong className="text-white/80">{fmtUpdated(comp.generatedAt)}</strong></span>}
      </div>

      {/* 현재 순위 / 단계별 예측 */}
      {current.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-sm font-black text-[#E8C77E] uppercase tracking-wider">{cfg?.heading || (roadToMsi ? '진출 팀' : '현재 순위')}</h3>
            {(cfg?.desc || official?.stage) && <span className="text-xs text-white/40">{cfg?.desc || official?.stage}</span>}
          </div>
          {seedsPending && (
            <p className="text-sm text-white/40 py-3 px-4 rounded-xl bg-white/5 border border-white/10">
              진출팀은 정규시즌 종료 후 확정됩니다. (현재 미정)
            </p>
          )}
          {groups.map((grp) => (
            <div key={grp.name || 'all'}>
              {grp.name && (
                <span className="inline-block text-xs font-black px-2 py-0.5 rounded mb-2"
                  style={{ color: grp.badge.color, backgroundColor: grp.badge.bg }}>
                  {grp.name}
                </span>
              )}
              <StandingsTable rows={grp.rows} color={comp.color} hasDiff={hasDiff} cols={cfg?.cols} />
            </div>
          ))}
        </section>
      )}

      {/* 대진표 (LCK 플레이-인/플레이오프) — 확정 시드만 표기 */}
      {bracket && (
        <section>
          <div className="flex items-baseline gap-2 flex-wrap mb-4">
            <h3 className="text-sm font-black text-[#E8C77E] uppercase tracking-wider">대진표</h3>
            <span className="text-xs text-white/40">{bracket.desc}</span>
          </div>
          <div className="flex flex-col gap-6">
            {bracket.sections.map((sec, si) => (
              <div key={si}>
                {sec.name && (
                  <p className="text-xs font-black text-white/55 mb-3">{sec.name}</p>
                )}
                <Bracket rounds={sec.rounds} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Road to MSI(선발전) 대진표 — 실제 결과 */}
      {roadToMsi && official?.bracket && (
        <section>
          <div className="flex items-baseline gap-2 flex-wrap mb-4">
            <h3 className="text-sm font-black text-[#E8C77E] uppercase tracking-wider">대진표</h3>
            {official.bracket.desc && <span className="text-xs text-white/40">{official.bracket.desc}</span>}
          </div>
          <MsiBracket rounds={official.bracket.rounds} />
          <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-white/50">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(96,165,250,0.6)' }} /> 2026 MSI 진출</span>
          </div>
        </section>
      )}

      {/* 대진별 예측 — 진행중인 리그에서만 (단계별 대진표가 있으면 생략) */}
    {comp.status === 'ongoing' && (!cfg || cfg.matches) && !bracket && !roadToMsi && comp.matches?.length > 0 && (
      <section>
        <h3 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">대진별 예측</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {comp.matches.map((m, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
              <span className={`flex-1 flex items-center justify-end gap-1.5 font-bold truncate ${m.winner === m.a ? 'text-[#E8C77E]' : 'text-white/60'}`}>
                {m.winner === m.a && <Trophy size={12} className="shrink-0" />}
                <span className="truncate">{nameByShort[m.a] || m.a}</span>
                <TeamLogo src={logoByShort[m.a]} size={18} />
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-black text-white/70 shrink-0">{m.pA}%</span>
              <span className={`flex-1 flex items-center justify-start gap-1.5 font-bold truncate ${m.winner === m.b ? 'text-[#E8C77E]' : 'text-white/60'}`}>
                <TeamLogo src={logoByShort[m.b]} size={18} />
                <span className="truncate">{nameByShort[m.b] || m.b}</span>
                {m.winner === m.b && <Trophy size={12} className="shrink-0" />}
              </span>
            </div>
          ))}
        </div>
      </section>
      )}
    </div>
  );
};

// 종료된 대회의 실제 결과 렌더
const ResultView = ({ comp }) => {
  const fr = comp.finalResult;
  return (
    <div className="flex flex-col gap-8">
      {fr?.champion && (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#C8963E]/20 to-transparent border border-[#C8963E]/30">
          <Crown size={32} className="text-[#E8C77E] shrink-0" />
          <div>
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">우승</p>
            <p className="text-2xl font-black text-[#E8C77E]">{fr.champion}</p>
            {fr.runnerUp && <p className="text-sm text-white/50 mt-0.5">준우승 {fr.runnerUp}</p>}
          </div>
        </div>
      )}

      {fr?.standings?.length > 0 && (
        <section>
          <h3 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">최종 순위</h3>
          <div className="flex flex-col gap-2">
            {fr.standings.map((row, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="w-7 text-center font-black text-white/40 font-mono shrink-0">{row.rank ?? i + 1}</span>
                <span className="font-bold text-white/90">{row.team}</span>
                {row.note && <span className="ml-auto text-xs text-white/40">{row.note}</span>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const NotReady = ({ comp }) => (
  <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-3xl">
    <Hourglass size={28} className="mx-auto text-white/30 mb-3" />
    <p className="text-white/50 font-bold mb-1">
      {comp.status === 'finished' ? '결과 정리 중' : '시뮬레이션 준비 중'}
    </p>
    <p className="text-white/30 text-sm">
      {comp.status === 'finished'
        ? '종료된 대회의 실제 결과를 곧 게재합니다.'
        : 'GPR 팀별 점수를 반영한 몬테카를로 예측을 곧 게재합니다.'}
    </p>
  </div>
);

const GPR_TAB = { key: 'gpr', name: 'GPR 순위', scope: 'data', color: '#E8C77E' };

// 탭 로고 (LoL Esports / 각 대회). 출처: static.lolesports.com
const LOLESPORTS_LOGO = 'https://static.lolesports.com/leagues/1693555886600_lolesports_icon_ice-01.png';
const COMP_LOGO = {
  lck: 'https://static.lolesports.com/leagues/lck-color-on-black.png',
  lpl: 'https://static.lolesports.com/leagues/1592516115322_LPL-01-FullonDark.png',
  lec: 'https://static.lolesports.com/leagues/1592516184297_LEC-01-FullonDark.png',
  lcp: 'https://static.lolesports.com/leagues/1733468139601_lcp-color-golden.png',
  lcs: 'https://static.lolesports.com/leagues/1706356907418_LCSNew-01-FullonDark.png',
  cblol: 'https://static.lolesports.com/leagues/cblol-logo-symbol-offwhite.png',
  fst: 'https://static.lolesports.com/leagues/1740042025201_RG_LOL_FIRST_STAND_LOGO_VOLT_ALPHA.png',
  msi: 'https://static.lolesports.com/leagues/1592594634248_MSIDarkBG.png',
  worlds: 'https://static.lolesports.com/leagues/1592594612171_WorldsDarkBG.png',
};
const tabLogo = (key) => (key === 'gpr' ? LOLESPORTS_LOGO : COMP_LOGO[key]);

// 지역 리그별 세부 대회 (2026 기준)
const SUBTABS = {
  lck: ['LCK CUP', 'LCK', 'Road to MSI'],
  lpl: ['Split 1', 'Split 2', 'Split 3'],
  lec: ['Versus', 'Spring', 'Summer'],
  lcp: ['Split 1', 'Split 2', 'Split 3'],
  lcs: ['Lock-In', 'Spring', 'Summer'],
  cblol: ['Copa', 'Split 1', 'Split 2'],
};
// 세부 대회 기본 선택(현재 진행/직전 완료된 대회)
const SUBTAB_DEFAULT = { lck: 'Road to MSI', lpl: 'Split 2', lec: 'Spring', lcp: 'Split 2', lcs: 'Spring', cblol: 'Split 1' };
// 아직 시작하지 않은 세부 대회 → "예정" 표시
const SUB_UPCOMING = {
  lpl: ['Split 3'],
  lec: ['Summer'],
  lcp: ['Split 3'],
  lcs: ['Summer'],
  cblol: ['Split 2'],
};

const PredictionPage = () => {
  const comps = sim.competitions;
  const tabs = [GPR_TAB, ...comps];
  const validKeys = useMemo(() => [GPR_TAB.key, ...comps.map((c) => c.key)], [comps]);

  // 탭 = URL 경로(/lol/prediction/:tab), 세부 대회 = 쿼리(?sub=) → 새로고침해도 유지
  const { tab } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeKey = tab && validKeys.includes(tab) ? tab : 'gpr';
  // 알 수 없는 탭 경로는 기본 탭으로 정리
  useEffect(() => {
    if (tab && !validKeys.includes(tab)) navigate('/lol/prediction/gpr', { replace: true });
  }, [tab, validKeys, navigate]);

  const setActiveKey = (key) => navigate(`/lol/prediction/${key}`);

  const isGpr = activeKey === 'gpr';
  const comp = useMemo(() => comps.find((c) => c.key === activeKey), [comps, activeKey]);
  const st = comp ? (statusMeta[comp.status] || statusMeta.upcoming) : null;
  const subTabs = comp ? SUBTABS[comp.key] : null;
  const subParam = searchParams.get('sub');
  const activeSub = subTabs
    ? (subParam && subTabs.includes(subParam) ? subParam : (SUBTAB_DEFAULT[comp.key] || subTabs[0]))
    : null;
  const setActiveSub = (s) => setSearchParams({ sub: s }, { replace: true });
  const subUpcoming = !!(comp && activeSub && SUB_UPCOMING[comp.key]?.includes(activeSub));
  // 제목 접미사: 점(·) 없이 공백으로 이어붙이되, 리그명이 sub에 중복되면 제거
  // 예) LPL+'Split 2' → "Split 2", LCK+'LCK' → "", LCK+'LCK CUP' → "CUP"
  const subSuffix = (() => {
    if (!subTabs || !activeSub) return '';
    const lg = comp.name.replace('2026 ', '');
    if (activeSub === lg) return '';
    const t = activeSub.startsWith(lg + ' ') ? activeSub.slice(lg.length + 1) : activeSub;
    return ` ${t}`;
  })();
  // CBLOL 예외 표기: "CBLOL 2026" 기준, Copa는 앞에 → "Copa CBLOL 2026", 그 외 세부는 뒤에
  const title = (() => {
    if (comp?.key === 'cblol') {
      const base = 'CBLOL 2026';
      if (activeSub === 'Copa') return `Copa ${base}`;
      if (activeSub && activeSub !== 'CBLOL') return `${base} ${activeSub}`;
      return base;
    }
    return `${comp?.name ?? ''}${subSuffix}`;
  })();
  // LCK→LCK 일 때만 단계(정규시즌/플레이-인/플레이오프) 선택
  const LCK_STAGES = ['정규시즌', '플레이-인', '플레이오프'];
  const showStages = comp?.key === 'lck' && activeSub === 'LCK';
  const activeStage = showStages
    ? (LCK_STAGES.includes(searchParams.get('stage')) ? searchParams.get('stage') : '정규시즌')
    : null;
  const setActiveStage = (s) =>
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set('stage', s); return n; }, { replace: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#1e2328] to-[#0a1428] p-6 md:p-12 text-white">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-[#C8963E] rounded-xl flex items-center justify-center shrink-0">
            <Target color="white" size={22} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">LoL 승부예측</h1>
        </div>

        {/* 탭 선택 (GPR 순위 + 9개 대회) */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((c) => {
            const active = c.key === activeKey;
            return (
              <button
                key={c.key}
                onClick={() => setActiveKey(c.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-black border transition-all ${
                  active ? '' : 'text-white/60 border-white/15 hover:border-white/40 bg-transparent'
                }`}
                style={active ? { backgroundColor: c.color, borderColor: c.color, color: textOn(c.color) } : {}}
              >
                <TeamLogo src={tabLogo(c.key)} size={18} />
                {c.name.replace('2026 ', '')}
              </button>
            );
          })}
        </div>

        {/* 선택된 탭 카드 */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8">
          {isGpr ? (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#C8963E]">
                  <BarChart3 size={18} color="#1e2328" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">GPR 팀 랭킹</h2>
                  <p className="text-xs text-white/40">Global Power Rankings · {gprTeams.teams.length}팀 · 갱신 {gprTeams.updatedAt}</p>
                </div>
              </div>
              <GprTable />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: comp.color }}>
                    <ScopeIcon scope={comp.scope} size={18} color={textOn(comp.color)} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{title}</h2>
                    <p className="text-xs text-white/40">{comp.scope === 'intl' ? '국제 대회' : '지역 리그'}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-black" style={{ color: st.color, backgroundColor: st.bg }}>
                  {st.label}
                </span>
              </div>

              {/* 세부 대회 선택 */}
              {subTabs && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {subTabs.map((s) => {
                    const on = s === activeSub;
                    return (
                      <button
                        key={s}
                        onClick={() => setActiveSub(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          on ? 'bg-white/15 text-white border-white/30' : 'text-white/45 border-white/10 hover:border-white/30 hover:text-white/70'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 단계 선택 (LCK→LCK 전용) */}
              {showStages && (
                <div className="inline-flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
                  {LCK_STAGES.map((s) => {
                    const on = s === activeStage;
                    return (
                      <button
                        key={s}
                        onClick={() => setActiveStage(s)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                          on ? 'bg-[#C8963E] text-[#1e2328]' : 'text-white/50 hover:text-white/80'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              )}

              {subUpcoming ? (
                <div className="py-16 text-center border-2 border-dashed border-white/10 rounded-3xl">
                  <Hourglass size={28} className="mx-auto text-white/30 mb-3" />
                  <p className="text-white/50 font-bold mb-1">아직 시작하지 않은 대회입니다</p>
                  <p className="text-white/30 text-sm">{activeSub}가 시작되면 순위·예측을 게재합니다.</p>
                </div>
              ) : !comp.ready ? (
                <NotReady comp={comp} />
              ) : comp.status === 'finished' ? (
                <ResultView comp={comp} />
              ) : (
                <SimulationView comp={comp} sub={activeSub} stage={activeStage} />
              )}
            </>
          )}
        </div>

        {/* GPR 지역 점수 참고 */}
        <section className="mt-8 p-5 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">참고 · 지역별 GPR 점수</h2>
          <div className="flex flex-col gap-2">
            {gpr.regions.map((r) => {
              const max = Math.max(...gpr.regions.map((x) => x.score));
              return (
                <div key={r.key} className="flex items-center gap-3">
                  <span className="w-14 text-sm font-black shrink-0" style={{ color: lighten(r.color) }}>{r.name}</span>
                  <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full flex items-center justify-end pr-2 text-[10px] font-black text-white/90"
                      style={{ width: `${(r.score / max) * 100}%`, backgroundColor: r.color }}>
                      {r.score}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 안내 · 레이팅 출처 (하단) */}
        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-white/50 text-sm font-medium mb-1">
            9개 대회의 몬테카를로 시뮬레이션 예측과 종료 대회의 실제 결과를 한곳에서.
          </p>
          <a
            href={sim.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 text-xs hover:text-[#E8C77E] inline-flex items-center gap-1"
          >
            레이팅 출처: lolesports.com Global Power Rankings <ExternalLink size={11} /> · 갱신 {fmtUpdated(sim.updatedAt)}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;
