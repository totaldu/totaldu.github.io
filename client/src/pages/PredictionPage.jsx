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
  '정규시즌': { cols: { diff: true }, matches: false, heading: '정규시즌 순위', desc: '현재까지 확정된 정규시즌 순위입니다.' },
  '플레이-인': { cols: { piPlus: true, advance: true }, matches: false, heading: '플레이-인 예측', desc: '레전드 5위 + 라이즈 1~3위가 겨루는 플레이-인 단계. PI+/플레이오프 진출 확률.' },
  '플레이오프': { cols: { advance: true, worlds: true, champ: true }, matches: true, heading: '플레이오프 예측', desc: '플레이오프 진출·우승·Worlds 진출 확률과 예상 대진.' },
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
  const groups = grouped
    ? [...new Set(current.map((t) => t.group))].map((name, gi) => ({
        name: GROUP_META[name]?.label ?? name,
        badge: GROUP_META[name]?.badge ?? FALLBACK_BADGES[gi % FALLBACK_BADGES.length],
        rows: current.filter((t) => t.group === name).map((t, i) => withProb(t, i + 1)),
      }))
    : [{ name: null, rows: current.map((t, i) => withProb(t, t.rank ?? i + 1)) }];

  return (
    <div className="flex flex-col gap-8">
      {/* 메타 */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {comp.stage && <span className="text-white/50">단계: <strong className="text-white/80">{comp.stage}</strong></span>}
        {comp.format && <span className="text-white/50">형식: <strong className="text-white/80">{comp.format}</strong></span>}
        {comp.iterations > 0 && <span className="text-white/50">반복: <strong className="text-white/80">{comp.iterations.toLocaleString()}회</strong></span>}
        {comp.generatedAt && <span className="text-white/50">생성: <strong className="text-white/80">{fmtUpdated(comp.generatedAt)}</strong></span>}
      </div>

      {/* 현재 순위 / 단계별 예측 */}
      {current.length > 0 && (
        <section className="flex flex-col gap-5">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-sm font-black text-[#E8C77E] uppercase tracking-wider">{cfg?.heading || '현재 순위'}</h3>
            {(cfg?.desc || official?.stage) && <span className="text-xs text-white/40">{cfg?.desc || official?.stage}</span>}
          </div>
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

      {/* 대진별 예측 (단계 미선택 또는 플레이오프 단계에서만) */}
    {(!cfg || cfg.matches) && comp.matches?.length > 0 && (
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
  lck: ['LCK CUP', 'LCK'],
  lpl: ['Split 1', 'Split 2', 'Split 3'],
  lec: ['Versus', 'Spring', 'Summer'],
  lcp: ['Split 1', 'Split 2', 'Split 3'],
  lcs: ['Lock-In', 'Spring', 'Summer'],
  cblol: ['Copa', 'Split 1', 'Split 2'],
};
// 세부 대회 기본 선택(현재 진행 중)
const SUBTAB_DEFAULT = { lck: 'LCK', lpl: 'Split 2', lec: 'Summer', lcp: 'Split 2', lcs: 'Summer', cblol: 'Split 2' };

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
      <div className="max-w-5xl mx-auto">
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

              {!comp.ready ? (
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
