// client/src/pages/PredictionPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Plus, Trash2, Target, ExternalLink } from 'lucide-react';
import gpr from '../data/lolGpr.json';

const STORAGE_KEY = 'lol_predictions';

const regionByKey = Object.fromEntries(gpr.regions.map((r) => [r.key, r]));
const maxScore = Math.max(...gpr.regions.map((r) => r.score));

// GPR 점수를 로지스틱으로 변환해 A팀 승률(%) 추정
const winProbFromScore = (a, b) => {
  const sa = regionByKey[a]?.score ?? 1000;
  const sb = regionByKey[b]?.score ?? 1000;
  // 400점 차이당 약 10배 우세 (Elo 유사)
  const p = 1 / (1 + Math.pow(10, (sb - sa) / 400));
  return Math.round(p * 100);
};

const loadPredictions = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

const RegionSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-2 py-2 rounded-lg bg-[#1e2328] border border-[#3c3c41] text-[#E8C77E] text-sm font-bold outline-none focus:border-[#C8963E]"
  >
    {gpr.regions.map((r) => (
      <option key={r.key} value={r.key}>{r.name}</option>
    ))}
  </select>
);

const resultMeta = {
  pending: { label: '대기', color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
  hit: { label: '적중', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  miss: { label: '실패', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
};

const PredictionPage = () => {
  const [predictions, setPredictions] = useState(loadPredictions);

  // 입력 폼 상태
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [regionA, setRegionA] = useState('LCK');
  const [regionB, setRegionB] = useState('LPL');
  const [pick, setPick] = useState('A');
  const [note, setNote] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
  }, [predictions]);

  const refProb = useMemo(() => winProbFromScore(regionA, regionB), [regionA, regionB]);

  const addPrediction = () => {
    if (!teamA.trim() || !teamB.trim()) return;
    const entry = {
      id: Date.now(),
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      regionA,
      regionB,
      pick, // 'A' | 'B'
      refProb,
      note: note.trim(),
      result: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setPredictions((prev) => [entry, ...prev]);
    setTeamA('');
    setTeamB('');
    setPick('A');
    setNote('');
  };

  const setResult = (id, result) =>
    setPredictions((prev) => prev.map((p) => (p.id === id ? { ...p, result } : p)));
  const remove = (id) => setPredictions((prev) => prev.filter((p) => p.id !== id));

  const stats = useMemo(() => {
    const decided = predictions.filter((p) => p.result !== 'pending');
    const hits = decided.filter((p) => p.result === 'hit').length;
    return {
      total: predictions.length,
      decided: decided.length,
      hits,
      rate: decided.length ? Math.round((hits / decided.length) * 100) : 0,
    };
  }, [predictions]);

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
          GPR <strong className="text-[#E8C77E]">{gpr.season}</strong> 지역 파워 점수를 기반으로 직접 예측하세요.
        </p>
        <a
          href={gpr.source}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/40 text-xs hover:text-[#E8C77E] inline-flex items-center gap-1 mb-8"
        >
          출처: lolesports.com Global Power Rankings <ExternalLink size={11} /> · 갱신 {gpr.fetchedAt}
        </a>

        {/* GPR 지역 점수 참고 */}
        <section className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">지역별 GPR 점수</h2>
          <div className="flex flex-col gap-2.5">
            {gpr.regions.map((r) => (
              <div key={r.key} className="flex items-center gap-3">
                <span className="w-16 text-sm font-black shrink-0" style={{ color: r.color }}>{r.name}</span>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2 text-[11px] font-black text-white/90"
                    style={{ width: `${(r.score / maxScore) * 100}%`, backgroundColor: r.color }}
                  >
                    {r.score}
                  </div>
                </div>
                <span className="w-24 text-xs text-white/40 shrink-0 hidden sm:block">{r.country}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 예측 입력 폼 */}
        <section className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-sm font-black text-[#E8C77E] mb-4 uppercase tracking-wider">새 예측 추가</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {[['A', teamA, setTeamA, regionA, setRegionA], ['B', teamB, setTeamB, regionB, setRegionB]].map(
              ([side, tv, setTv, rv, setRv]) => (
                <div key={side} className="flex gap-2">
                  <input
                    type="text"
                    value={tv}
                    onChange={(e) => setTv(e.target.value)}
                    placeholder={`팀 ${side} 이름`}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#1e2328] border border-[#3c3c41] text-white text-sm outline-none focus:border-[#C8963E] placeholder-white/30"
                  />
                  <RegionSelect value={rv} onChange={setRv} />
                </div>
              )
            )}
          </div>

          {/* GPR 기반 참고 승률 */}
          <div className="flex items-center gap-3 mb-4 text-sm">
            <span className="text-white/40 shrink-0">GPR 참고 승률</span>
            <div className="flex-1 h-7 rounded-lg overflow-hidden flex bg-white/5 text-[11px] font-black">
              <div className="flex items-center justify-start pl-2 bg-[#C8963E]/70" style={{ width: `${refProb}%` }}>
                {refProb}%
              </div>
              <div className="flex items-center justify-end pr-2 bg-[#0AC8B9]/50 flex-1">
                {100 - refProb}%
              </div>
            </div>
          </div>

          {/* 예측 선택 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-white/40 text-sm shrink-0">내 예측 승자</span>
            {['A', 'B'].map((side) => {
              const name = side === 'A' ? teamA : teamB;
              const active = pick === side;
              return (
                <button
                  key={side}
                  onClick={() => setPick(side)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-black transition-all border ${
                    active
                      ? 'bg-[#C8963E] text-[#1e2328] border-[#C8963E]'
                      : 'bg-transparent text-white/60 border-white/15 hover:border-white/40'
                  }`}
                >
                  {name.trim() || `팀 ${side}`}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예측 근거 메모 (선택)"
            className="w-full px-3 py-2 mb-4 rounded-lg bg-[#1e2328] border border-[#3c3c41] text-white text-sm outline-none focus:border-[#C8963E] placeholder-white/30"
          />

          <button
            onClick={addPrediction}
            disabled={!teamA.trim() || !teamB.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#C8963E] text-[#1e2328] font-black hover:bg-[#E8C77E] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> 예측 등록
          </button>
        </section>

        {/* 적중률 요약 */}
        {predictions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: '총 예측', value: stats.total },
              { label: '판정 완료', value: stats.decided },
              { label: '적중률', value: `${stats.rate}%` },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-2xl font-black text-[#E8C77E]">{s.value}</p>
                <p className="text-xs text-white/40 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* 예측 목록 */}
        <section className="flex flex-col gap-3">
          {predictions.map((p) => {
            const rm = resultMeta[p.result];
            const winnerName = p.pick === 'A' ? p.teamA : p.teamB;
            return (
              <div key={p.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
                    <div className="flex-1 text-right min-w-0">
                      <p className={`font-black truncate ${p.pick === 'A' ? 'text-[#E8C77E]' : 'text-white/70'}`}>
                        {p.pick === 'A' && <Trophy size={13} className="inline mr-1 -mt-0.5" />}{p.teamA}
                      </p>
                      <p className="text-[11px]" style={{ color: regionByKey[p.regionA]?.color }}>{p.regionA}</p>
                    </div>
                    <span className="text-white/30 font-black text-sm shrink-0">VS</span>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`font-black truncate ${p.pick === 'B' ? 'text-[#E8C77E]' : 'text-white/70'}`}>
                        {p.pick === 'B' && <Trophy size={13} className="inline mr-1 -mt-0.5" />}{p.teamB}
                      </p>
                      <p className="text-[11px]" style={{ color: regionByKey[p.regionB]?.color }}>{p.regionB}</p>
                    </div>
                  </div>
                  <button onClick={() => remove(p.id)} className="text-white/30 hover:text-[#F87171] shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded-lg font-bold" style={{ color: rm.color, backgroundColor: rm.bg }}>
                    {rm.label}
                  </span>
                  <span className="text-white/40">예측: <strong className="text-white/70">{winnerName}</strong> 승</span>
                  <span className="text-white/30">· GPR {p.refProb}%</span>
                  <span className="text-white/30">· {p.createdAt}</span>
                  {p.note && <span className="text-white/40 italic w-full mt-1">“{p.note}”</span>}
                </div>

                <div className="flex gap-2 mt-3">
                  {['hit', 'miss', 'pending'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setResult(p.id, r)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                        p.result === r ? 'border-current' : 'border-white/10 text-white/40 hover:text-white/70'
                      }`}
                      style={p.result === r ? { color: resultMeta[r].color, backgroundColor: resultMeta[r].bg } : {}}
                    >
                      {resultMeta[r].label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {predictions.length === 0 && (
            <div className="py-16 text-center text-white/30 font-medium border-2 border-dashed border-white/10 rounded-3xl">
              아직 등록한 예측이 없습니다. 위에서 첫 예측을 추가해보세요.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PredictionPage;
