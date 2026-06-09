// client/src/pages/PokedexPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getChoseong } from 'es-hangul';
import { getKoreanName } from '../utils/pokemonUtils';
import { hasChampionsForm } from '../utils/championsSprite';
import championsLogo from '@/assets/champions-logo.png';

/* ─────────────────────────────────────────────
   상수
───────────────────────────────────────────── */
const ITEMS_PER_PAGE = 30;

const TYPE_COLORS = {
  normal:   '#A8A77A', fire:     '#EE8130', water:   '#6390F0',
  grass:    '#7AC74C', electric: '#F7D02C', ice:     '#96D9D6',
  fighting: '#C22E28', poison:   '#A33EA1', ground:  '#E2BF65',
  flying:   '#A98FF3', psychic:  '#F95587', bug:     '#A6B91A',
  rock:     '#B6A136', ghost:    '#735797', dragon:  '#6F35FC',
  dark:     '#705746', steel:    '#B7B7CE', fairy:   '#D685AD',
};
const TYPE_KO = {
  normal:   '노말',    fire:     '불꽃',   water:    '물',      grass:    '풀',
  electric: '전기',    ice:      '얼음',   fighting: '격투',    poison:   '독',
  ground:   '땅',      flying:   '비행',   psychic:  '에스퍼',  bug:      '벌레',
  rock:     '바위',    ghost:    '고스트', dragon:   '드래곤',  dark:     '악',
  steel:    '강철',    fairy:    '페어리',
};

/* ─────────────────────────────────────────────
   배경 그라디언트 헬퍼
   - 타입 1개: 기존 단색 그라디언트
   - 타입 2개: 두 타입 색을 135deg로 절반씩
───────────────────────────────────────────── */
const getBgStyle = (mainColor, subColor) => {
  if (subColor) {
    return {
      background: `linear-gradient(135deg, ${mainColor}66 0%, ${mainColor}44 40%, ${subColor}44 60%, ${subColor}66 100%)`,
    };
  }
  return {
    background: `linear-gradient(135deg, ${mainColor}44, ${mainColor}11)`,
  };
};

/* ─────────────────────────────────────────────
   PokemonCard
───────────────────────────────────────────── */
const PokemonCard = React.memo(({ pokemon, currentPage }) => {
  const mainType   = pokemon.types[0]?.type?.name || 'normal';
  const subType    = pokemon.types[1]?.type?.name;
  const mainColor  = TYPE_COLORS[mainType] || '#A8A77A';
  const subColor   = subType ? (TYPE_COLORS[subType] || '#aaa') : null;
  const koreanName  = getKoreanName(pokemon.name);
  const artworkSrc  =
    pokemon.sprites?.other?.['official-artwork']?.front_default
    || pokemon.sprites?.front_default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  const isChampions = hasChampionsForm(pokemon.name);

  return (
    <Link
      to={`/pokedex/${pokemon.id}?page=${currentPage}`}
      className="group relative flex flex-col items-center rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden cursor-pointer bg-white"
    >
      {/* ✅ 배경: 타입 2개면 두 색 절반씩, 1개면 단색 그라디언트 */}
      <div
        className="w-full h-24 flex items-center justify-center transition-all relative"
        style={getBgStyle(mainColor, subColor)}
      >
        {isChampions && (
          <img
            src={championsLogo}
            alt="Pokémon Champions"
            className="absolute top-1 left-1 z-10"
            style={{ width: '40px', height: 'auto' }}
          />
        )}
        <img
          src={artworkSrc}
          alt={koreanName || pokemon.name}
          className="h-20 w-20 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
          loading="lazy"
        />
      </div>

      <div className="w-full px-3 py-2 text-center">
        <p className="text-[11px] text-gray-400 font-mono font-bold">
          #{String(pokemon.id).padStart(4, '0')}
        </p>
        <p className="text-sm font-black text-gray-800 truncate">
          {koreanName || pokemon.name}
        </p>
        {koreanName && (
          <p className="text-[10px] text-gray-400 capitalize truncate -mt-0.5">
            {pokemon.name}
          </p>
        )}
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
              style={{ backgroundColor: subColor }}
            >
              {TYPE_KO[subType] || subType}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

/* ─────────────────────────────────────────────
   SkeletonCard
───────────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse bg-white">
    <div className="h-24 bg-gray-100" />
    <div className="p-3 flex flex-col items-center gap-2">
      <div className="h-3 w-10 bg-gray-200 rounded" />
      <div className="h-4 w-20 bg-gray-200 rounded" />
      <div className="h-3 w-16 bg-gray-200 rounded" />
      <div className="h-4 w-14 bg-gray-200 rounded-full" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   PokedexPage
───────────────────────────────────────────── */
const PokedexPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get('page')) || 1;

  const [allPokemon,    setAllPokemon]    = useState([]);
  const [pageData,      setPageData]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error,         setError]         = useState(null);
  const [currentPage,   setCurrentPage]   = useState(urlPage);
  const [searchQuery,   setSearchQuery]   = useState('');

  /* ── ① URL page 변경 감지 → state 동기화 */
  useEffect(() => {
    if (urlPage !== currentPage) setCurrentPage(urlPage);
  }, [urlPage]); // eslint-disable-line

  /* ── ② 전체 목록 최초 1회 fetch */
  useEffect(() => {
    setLoading(true);
    fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { setAllPokemon(data.results); setLoading(false); })
      .catch(() => {
        setError('포켓몬 데이터를 불러오지 못했습니다. 네트워크를 확인해 주세요.');
        setLoading(false);
      });
  }, []);

  /* ── ③ 필터링 */
  // 겹자음을 분리 초성으로 확장
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

  const filteredPokemon = useMemo(() => {
    if (!searchQuery) return allPokemon;
    const query        = searchQuery.toLowerCase();
    const expandedQuery = expandConsonants(query);
    return allPokemon.filter(p => {
      const ko       = getKoreanName(p.name);
      const en       = p.name.toLowerCase();
      const choseong = ko ? getChoseong(ko) : '';
      return (
        en.includes(query)
        || ko.includes(query)
        || choseong.includes(query)
        || choseong.includes(expandedQuery)
      );
    });
  }, [allPokemon, searchQuery]);

  const totalPages = Math.ceil(filteredPokemon.length / ITEMS_PER_PAGE);

  /* ── ④ 현재 슬라이스 */
  const currentSlice = useMemo(() => (
    filteredPokemon.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage       * ITEMS_PER_PAGE,
    )
  ), [filteredPokemon, currentPage]);

  /* ── ⑤ 상세 데이터 fetch */
  useEffect(() => {
    if (currentSlice.length === 0) { setPageData([]); return; }
    let cancelled = false;
    setDetailLoading(true);
    Promise.all(currentSlice.map(p => fetch(p.url).then(r => r.json())))
      .then(results => {
        if (cancelled) return;
        setPageData(results);
        setDetailLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError('상세 데이터를 불러오지 못했습니다.');
        setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentSlice]);

  /* ── ⑥ 검색 핸들러 */
  const handleSearch = useCallback((e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setSearchParams({ page: '1' }, { replace: true });
  }, [setSearchParams]);

  /* ── ⑦ 페이지 이동 */
  const goToPage = useCallback((page) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    setSearchParams({ page: String(p) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages, setSearchParams]);

  /* ── ⑧ 페이지 번호 범위 */
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) range.push(i);
    return range;
  }, [currentPage, totalPages]);

  /* ── 렌더 */
  return (
    <div className="w-full flex flex-col gap-6">

      {/* 헤더 + 검색창 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
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
            placeholder="이름으로 검색 (한글/영문/초성)..."
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

      {/* 카드 그리드 */}
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
            : pageData.map(pokemon => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  currentPage={currentPage}
                />
              ))
          }
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">

          <button
            onClick={() => goToPage(1)} disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >«</button>

          <button
            onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          ><ChevronLeft size={16} /></button>

          {pageNumbers[0] > 1 && (
            <>
              <button onClick={() => goToPage(1)}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >1</button>
              {pageNumbers[0] > 2 && <span className="px-1 text-gray-400 text-sm font-bold">…</span>}
            </>
          )}

          {pageNumbers.map(num => (
            <button key={num} onClick={() => goToPage(num)}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                num === currentPage
                  ? 'bg-[#005596] text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >{num}</button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="px-1 text-gray-400 text-sm font-bold">…</span>
              )}
              <button onClick={() => goToPage(totalPages)}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >{totalPages}</button>
            </>
          )}

          <button
            onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          ><ChevronRight size={16} /></button>

          <button
            onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
          >»</button>

        </div>
      )}
    </div>
  );
};

export default PokedexPage;
