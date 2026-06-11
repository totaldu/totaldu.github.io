// client/src/pages/PredictionPage.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Target, Trophy, ExternalLink, Globe, Flag, Crown, Hourglass } from 'lucide-react';
import sim from '../data/lolSim.json';
import gpr from '../data/lolGpr.json';

const statusMeta = {
  finished: { label: '종료', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  ongoing: { label: '진행중', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  upcoming: { label: '예정', color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
};

const ScopeIcon = ({ scope, ...rest }) => (scope === 'intl' ? <Globe {...rest} /> : <Flag {...rest} />);

// 막대형 확률 행
const ProbRow = ({ label, value, color, sub }) => (
  <div className="flex items-center gap-3">
    <span className="w-28 sm:w-36 text-sm font-bold text-white/80 shrink-0 truncate">{label}</span>
    <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full flex items-center justify-end pr-2 text-[11px] font-black text-white/90"
        style={{ width: `${Math.max(value, 4)}%`, backgroundColor: color }}
      >
        {value}%
      </div>
    </div>
    {sub != null && <span className="w-10 text-xs text-white/40 shrink-0 text-right">{sub}</span>}
  </div>
);

// 시뮬레이션 결과(예측) 렌더
const SimulationView = ({ comp }) => (
  <div className="flex flex-col gap-8">
    {/* 메타 */}
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      {comp.stage && <span className="text-white/50">단계: <strong className="text-white/80">{comp.stage}</strong></span>}
      {comp.format && <span className="text-white/50">형식: <strong className="text-white/80">{comp.format}</strong></span>}
      {comp.iterations > 0 && <span className="text-white/50">반복: <strong className="text-white/80">{comp.iterations.toLocaleString()}회</strong></span>}
      {comp.generatedAt && <span className="text-white/50">생성: <strong className="text-white/80">{comp.generatedAt}</strong></span>}
    </div>

    {/* 상황별 확률 */}
    {comp.situations?.length > 0 && (
      <section>
        <h3 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">상황별 확률</h3>
        <div className="flex flex-col gap-2.5">
          {comp.situations.map((s, i) => (
            <ProbRow key={i} label={s.label} value={s.prob} color={comp.color} />
          ))}
        </div>
      </section>
    )}

    {/* 예상 순위 / 우승·진출 확률 */}
    {comp.standings?.length > 0 && (
      <section>
        <h3 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">예상 순위 & 우승 확률</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-white/40 text-xs border-b border-white/10">
                <th className="text-left font-bold py-2 pr-2">#</th>
                <th className="text-left font-bold py-2 pr-2">팀</th>
                <th className="text-right font-bold py-2 px-2">평균순위</th>
                <th className="text-right font-bold py-2 px-2">우승%</th>
                <th className="text-right font-bold py-2 pl-2">진출%</th>
              </tr>
            </thead>
            <tbody>
              {comp.standings.map((t, i) => (
                <tr key={t.team} className="border-b border-white/5">
                  <td className="py-2 pr-2 text-white/40 font-mono">{i + 1}</td>
                  <td className="py-2 pr-2 font-bold text-white/90">{t.team}</td>
                  <td className="py-2 px-2 text-right text-white/60 font-mono">{t.avgRank?.toFixed(1)}</td>
                  <td className="py-2 px-2 text-right font-black" style={{ color: comp.color }}>{t.champ ?? '-'}{t.champ != null && '%'}</td>
                  <td className="py-2 pl-2 text-right text-white/70 font-mono">{t.advance ?? '-'}{t.advance != null && '%'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )}

    {/* 대진별 예측 */}
    {comp.matches?.length > 0 && (
      <section>
        <h3 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">대진별 예측</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {comp.matches.map((m, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
              <span className={`flex-1 text-right font-bold truncate ${m.winner === m.a ? 'text-[#E8C77E]' : 'text-white/60'}`}>
                {m.winner === m.a && <Trophy size={12} className="inline mr-1 -mt-0.5" />}{m.a}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-black text-white/70 shrink-0">{m.pA}%</span>
              <span className={`flex-1 text-left font-bold truncate ${m.winner === m.b ? 'text-[#E8C77E]' : 'text-white/60'}`}>
                {m.b}{m.winner === m.b && <Trophy size={12} className="inline ml-1 -mt-0.5" />}
              </span>
            </div>
          ))}
        </div>
      </section>
    )}
  </div>
);

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

const PredictionPage = () => {
  const comps = sim.competitions;
  const [activeKey, setActiveKey] = useState(comps[0].key);
  const comp = useMemo(() => comps.find((c) => c.key === activeKey), [comps, activeKey]);
  const st = statusMeta[comp.status] || statusMeta.upcoming;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#1e2328] to-[#0a1428] p-6 md:p-12 text-white">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="text-[#E8C77E] font-bold mb-4 inline-block hover:underline">
          ← 메인으로 돌아가기
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 bg-[#C8963E] rounded-xl flex items-center justify-center shrink-0">
            <Target color="white" size={22} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black">LoL 승부예측</h1>
        </div>
        <p className="text-white/50 text-sm font-medium mb-1">
          9개 대회의 몬테카를로 시뮬레이션 예측과 종료 대회의 실제 결과를 한곳에서.
        </p>
        <a
          href={sim.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 text-xs hover:text-[#E8C77E] inline-flex items-center gap-1 mb-8"
        >
          레이팅 출처: lolesports.com Global Power Rankings <ExternalLink size={11} /> · 갱신 {sim.updatedAt}
        </a>

        {/* 대회 선택 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {comps.map((c) => {
            const active = c.key === activeKey;
            return (
              <button
                key={c.key}
                onClick={() => setActiveKey(c.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-black border transition-all ${
                  active ? 'text-[#1e2328]' : 'text-white/60 border-white/15 hover:border-white/40 bg-transparent'
                }`}
                style={active ? { backgroundColor: c.color, borderColor: c.color } : {}}
              >
                <ScopeIcon scope={c.scope} size={14} />
                {c.name.replace('2026 ', '')}
              </button>
            );
          })}
        </div>

        {/* 선택된 대회 카드 */}
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: comp.color }}>
                <ScopeIcon scope={comp.scope} size={18} color="white" />
              </div>
              <div>
                <h2 className="text-xl font-black">{comp.name}</h2>
                <p className="text-xs text-white/40">{comp.scope === 'intl' ? '국제 대회' : '지역 리그'}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-black" style={{ color: st.color, backgroundColor: st.bg }}>
              {st.label}
            </span>
          </div>

          {!comp.ready ? (
            <NotReady comp={comp} />
          ) : comp.status === 'finished' ? (
            <ResultView comp={comp} />
          ) : (
            <SimulationView comp={comp} />
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
                  <span className="w-14 text-sm font-black shrink-0" style={{ color: r.color }}>{r.name}</span>
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
      </div>
    </div>
  );
};

export default PredictionPage;
