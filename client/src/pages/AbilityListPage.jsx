// client/src/pages/AbilityListPage.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getChoseong } from 'es-hangul';
import abilityKo from '@/data/abilityKoreanNames.json';

// 겹자음 → 분리 초성 확장 (PokedexPage와 동일)
const expandConsonants = (q) => q
  .replace(/ㄳ/g, 'ㄱㅅ')
  .replace(/ㄵ/g, 'ㄴㅈ')
  .replace(/ㄶ/g, 'ㄴㅎ')
  .replace(/ㄺ/g, 'ㄹㄱ')
  .replace(/ㄻ/g, 'ㄹㅁ')
  .replace(/ㄼ/g, 'ㄹㅂ')
  .replace(/ㄽ/g, 'ㄹㅅ')
  .replace(/ㄾ/g, 'ㄹㅌ')
  .replace(/ㄿ/g, 'ㄹㅍ')
  .replace(/ㅀ/g, 'ㄹㅎ')
  .replace(/ㅄ/g, 'ㅂㅅ');

const AbilityListPage = () => {
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    const entries = Object.entries(abilityKo)
      .sort((a, b) => a[1].localeCompare(b[1], 'ko'));
    if (!search.trim()) return entries;

    const q            = search.trim().toLowerCase();
    const expandedQ    = expandConsonants(q);

    return entries.filter(([en, ko]) => {
      const choseong = getChoseong(ko);
      return (
        ko.includes(q)
        || en.toLowerCase().includes(q)
        || choseong.includes(q)
        || choseong.includes(expandedQ)
      );
    });
  }, [search]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">특성 도감</h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">총 {Object.keys(abilityKo).length}개 특성</p>
      </div>

      {/* 검색창 */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="특성 이름 검색 (한글/영문/초성)..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#005596] bg-white"
        />
      </div>

      {/* 특성 목록 */}
      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm font-medium text-center py-12">검색 결과가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {sorted.map(([en, ko]) => (
            <Link
              key={en}
              to={`/pokedex/ability/${en}`}
              className="px-4 py-2.5 bg-white rounded-xl border border-gray-100 text-sm font-semibold text-gray-700
                         hover:border-[#005596] hover:text-[#005596] transition-all shadow-sm text-center"
            >
              {ko}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AbilityListPage;
