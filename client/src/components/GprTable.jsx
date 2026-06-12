// client/src/components/GprTable.jsx
// GPR 팀별 점수(레이팅) 전체 랭킹 표 — 다크 배경 카드 안에서 사용
import React from 'react';
import gpr from '../data/lolGpr.json';
import gprTeams from '../data/gprTeams.json';
import { textOn, lighten } from '../utils/colorContrast';

const leagueColor = Object.fromEntries(gpr.regions.map((r) => [r.key, r.color]));
// 일부 리그는 GPR 바 색을 로고 색으로 사용 (LEC 민트, LCP 골드오렌지)
const BAR_LOGO_COLOR = { LEC: '#00E0B0', LCP: '#F08040' };
const gprRanked = [...gprTeams.teams].sort((a, b) => b.score - a.score);
const gprMaxScore = Math.max(...gprRanked.map((t) => t.score));

// 로고 (로드 실패 시 숨김)
export const TeamLogo = ({ src, size = 20 }) =>
  src ? (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="object-contain shrink-0"
      style={{ width: size, height: size }}
      onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
    />
  ) : (
    <span className="shrink-0" style={{ width: size, height: size }} />
  );

const GprTable = ({ showIntro = true }) => (
  <div className="flex flex-col gap-4">
    {showIntro && (
      <p className="text-sm text-white/50">
        lolesports GPR 팀별 점수(레이팅) 전체 랭킹입니다. 이 점수가 시뮬레이션 승률 산출의 기준입니다.
      </p>
    )}
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-white/40 text-xs border-b border-white/10">
            <th className="text-center font-bold py-2 px-2 w-10">#</th>
            <th className="text-left font-bold py-2 pr-2">팀</th>
            <th className="text-center font-bold py-2 px-2">리그</th>
            <th className="text-center font-bold py-2 px-3 w-1/3">GPR 점수</th>
            <th className="text-center font-bold py-2 px-2">전적</th>
          </tr>
        </thead>
        <tbody>
          {gprRanked.map((t, i) => {
            const col = leagueColor[t.league] || '#888';
            const barCol = BAR_LOGO_COLOR[t.league] || col; // LEC·LCP는 로고 색 바
            return (
              <tr key={t.short} className="border-b border-white/5">
                <td className="py-2 px-2 text-center text-white/40 font-mono">{i + 1}</td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo src={t.logo} />
                    <span className="font-bold text-white/90 truncate">{t.name}</span>
                    <span className="text-white/40 text-xs shrink-0">{t.short}</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className="text-xs font-black px-2 py-0.5 rounded"
                    style={{ color: textOn(col), backgroundColor: col }}
                  >
                    {t.league}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3.5 bg-white/5 rounded-full overflow-hidden min-w-[60px]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(t.score / gprMaxScore) * 100}%`, backgroundColor: barCol }}
                      />
                    </div>
                    <span className="font-mono font-black tabular-nums w-10 text-right" style={{ color: lighten(barCol) }}>
                      {t.score}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center text-white/50 font-mono whitespace-nowrap">
                  {t.w != null ? `${t.w}-${t.l}` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default GprTable;
