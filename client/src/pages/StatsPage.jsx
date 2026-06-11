// client/src/pages/StatsPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Trophy } from 'lucide-react';
import statsData from '../data/championsStats.json';

const RULES = [
  { key: 'single', label: '싱글배틀' },
  { key: 'double', label: '더블배틀' },
];

const spriteUrl = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

const rankBadge = (rank) => {
  if (rank === 1) return { bg: '#FEF3C7', color: '#B45309', ring: '#F59E0B' };
  if (rank === 2) return { bg: '#F1F5F9', color: '#475569', ring: '#94A3B8' };
  if (rank === 3) return { bg: '#FFEDD5', color: '#9A3412', ring: '#FB923C' };
  return { bg: '#F9FAFB', color: '#6B7280', ring: '#E5E7EB' };
};

const StatsPage = () => {
  const [rule, setRule] = useState('single');
  const list = statsData[rule] || [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="text-[#005596] font-bold mb-4 inline-block hover:underline">
          ← 메인으로 돌아가기
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 bg-[#005596] rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 color="white" size={22} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900">포켓몬 사용률 통계</h1>
        </div>
        <p className="text-gray-400 text-sm font-medium mb-1">
          랭크배틀 시즌 <strong className="text-gray-600">{statsData.season}</strong> 사용률 랭킹
        </p>
        <p className="text-gray-400 text-xs mb-6">
          출처:{' '}
          <a
            href={statsData.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#005596] hover:underline"
          >
            バトルデータベース チャンピオンズ
          </a>
          {' '}· 갱신 {statsData.fetchedAt}
        </p>

        {/* 룰 토글 */}
        <div className="inline-flex bg-gray-100 rounded-2xl p-1 mb-8">
          {RULES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRule(r.key)}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                rule === r.key
                  ? 'bg-white text-[#005596] shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* 랭킹 리스트 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((p) => {
            const badge = rankBadge(p.rank);
            return (
              <div
                key={`${p.rank}-${p.dex}-${p.form}`}
                className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 font-mono border"
                  style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.ring }}
                >
                  {p.rank}
                </span>
                <img
                  src={spriteUrl(p.id)}
                  alt={p.ko}
                  loading="lazy"
                  className="w-12 h-12 object-contain shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.visibility = 'hidden';
                  }}
                />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{p.ko}</p>
                  <p className="text-xs text-gray-400 truncate">
                    No.{String(p.dex).padStart(4, '0')} · {p.jp}
                  </p>
                </div>
                {p.rank <= 3 && (
                  <Trophy size={16} className="ml-auto shrink-0" style={{ color: badge.ring }} />
                )}
              </div>
            );
          })}
        </div>

        {list.length === 0 && (
          <div className="py-20 text-center text-gray-400 font-medium border-2 border-dashed rounded-3xl">
            데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;
