// client/src/pages/PokedexPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0',
  grass: '#7AC74C', electric: '#F7D02C', ice: '#96D9D6',
  fighting: '#C22E28', poison: '#A33EA1', ground: '#E2BF65',
  flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC',
  dark: '#705746', steel: '#B7B7CE', fairy: '#D685AD',
};

const TYPE_KO = {
  normal: '노말', fire: '불꽃', water: '물', grass: '풀',
  electric: '전기', ice: '얼음', fighting: '격투', poison: '독',
  ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
  rock: '바위', ghost: '고스트', dragon: '드래곤', dark: '악',
  steel: '강철', fairy: '페어리',
};

// ✅ 30마리 (6열 × 5줄)
const ITEMS_PER_PAGE = 30;

const PokemonCard = ({ pokemon }) => {
  const mainType = pokemon.types[0]?.type?.name || 'normal';
  const subType = pokemon.types[1]?.type?.name;
  const mainColor = TYPE_COLORS[mainType] || '#A8A77A';

  return (
    <div className="group relative flex flex-col items-center rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden cursor-pointer bg-white">
      <div
        className="w-full h-24 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${mainColor}33, ${mainColor}11)` }}
      >
        <img
          src={
            pokemon.sprites?.other?.['official-artwork']?.front_default
            || pokemon.sprites?.front_default
            || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
          }
          alt={pokemon.name}
          className="h-20 w-20 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
          loading="lazy"
        />
      </div>
      <div className="w-full px-3 py-2 text-center">
        <p className="text-[11px] text-gray-400 font-mono font-bold">
          #{String(pokemon.id).padStart(4, '0')}
        </p>
        <p className="text-sm font-black text-gray-800 capitalize truncate">
          {pokemon.name}
        </p>
        <div className="flex justify-center gap-1 mt-1.5 mb-1">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: mainColor }}
          >
            {TYPE_KO[mainType] || mainType}
          </span>
          {subType && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: TYPE_COLORS[subType] || '#aaa' }}
            >
              {TYPE_KO[subType] || subType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse bg-white">
    <div className="h-24 bg-gray-100" />
    <div className="p-3 flex flex-col items-center gap-2">
      <div className="h-3 w-10 bg-gray-200 rounded" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-4 w-14 bg-gray-200 rounded-full" />
    </div>
  </div>
);

const PokedexPage = () => {
  const [allPokemon, setAllPokemon] = useState([]);
  const [pageData, setPageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 최초 마운트: 전체 목록 fetch
  useEffect(() => {
    setLoading(true);
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0')
      .then(res => res.json())
      .then(data => {
        setAllPokemon(data.results);
        setLoading(false);
      })
      .catch(() => {
        setError('포켓몬 데이터를 불러오지 못했습니다. 네트워크를 확인해 주세요.');
        setLoading(false);
      });
  }, []);

  // 필터링 + 페이지 슬라이스
  const filteredPokemon = allPokemon.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredPokemon.length / ITEMS_PER_PAGE);
  const currentSlice = filteredPokemon.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 2. 페이지/검색/전체목록 로드 시 상세 fetch
  useEffect(() => {
    if (currentSlice.length === 0) { setPageData([]); return; }
    setDetailLoading(true);
    Promise.all(currentSlice.map(p => fetch(p.url).then(res => res.json())))
      .then(results => {
        setPageData(results);
        setDetailLoading(false);
      })
      .catch(() => {
        setError('상세 데이터를 불러오지 못했습니다.');
        setDetailLoading(false);
      });
  }, [currentPage, searchQuery, allPokemon.length]); // ✅ 첫 진입 버그 픽스 포함

  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="w-full flex flex-col gap-6">

      {/* 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-[#005596] text-sm font-bold mb-1 inline-block hover:underline">
            ← 메인으로 돌아가기
          </Link>
          <h1 className="text-2xl font-black text-gray-900">포켓몬 도감</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            총 <span className="font-bold text-[#005596]">{filteredPokemon.length}</span>마리
            {searchQuery && ` — "${searchQuery}" 검색 결과`}
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="포켓몬 이름 검색 (영문)..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0a8d87]/40 shadow-sm"
          />
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ✅ 그리드: 항상 6열 고정 */}
      {loading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredPokemon.length === 0 ? (
        <div className="py-20 text-center text-gray-400 border-2 border-dashed rounded-2xl">
          <p className="text-lg font-bold">검색 결과가 없습니다</p>
          <p className="text-sm mt-2">"{searchQuery}"에 해당하는 포켓몬을 찾을 수 없어요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-3">
          {detailLoading
            ? Array.from({ length: currentSlice.length }).map((_, i) => <SkeletonCard key={i} />)
            : pageData.map(pokemon => <PokemonCard key={pokemon.id} pokemon={pokemon} />)
          }
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >«</button>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          ><ChevronLeft size={16} /></button>

          {getPageNumbers().map(num => (
            <button
              key={num}
              onClick={() => goToPage(num)}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors
                ${num === currentPage
                  ? 'bg-[#005596] text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
            >{num}</button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          ><ChevronRight size={16} /></button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >»</button>
        </div>
      )}
    </div>
  );
};

export default PokedexPage;
