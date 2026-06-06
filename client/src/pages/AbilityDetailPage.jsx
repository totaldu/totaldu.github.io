// client/src/pages/AbilityDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import abilityKo from '@/data/abilityKoreanNames.json';
import { getKoreanName } from '../utils/pokemonUtils';

const AbilityDetailPage = () => {
  const { name } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`https://pokeapi.co/api/v2/ability/${name}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('특성 정보를 불러오지 못했습니다.'); setLoading(false); });
  }, [name]);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 font-bold animate-pulse">
      불러오는 중...
    </div>
  );
  if (error) return (
    <div className="p-6 text-red-500 font-bold text-center">{error}</div>
  );

  const koName = abilityKo[name] ?? name;

  // 설명문: 한국어 우선, 없으면 영어 — 가장 최신 텍스트
  const getDesc = (lang) =>
    data.flavor_text_entries
      .filter(e => e.language.name === lang)
      .pop()
      ?.flavor_text
      ?.replace(/[\n\f]/g, ' ')
      .trim();
  const description = getDesc('ko') ?? getDesc('en') ?? '설명 없음';

  // 배울 수 있는 포켓몬: ID 순 정렬, 중복 base name 제거
  const pokemonList = data.pokemon
    .map(p => {
      const url = p.pokemon.url;
      const id  = parseInt(url.split('/').filter(Boolean).pop(), 10);
      return { id, name: p.pokemon.name, is_hidden: p.is_hidden };
    })
    .sort((a, b) => a.id - b.id);

  // normal / hidden 분리
  const regular = pokemonList.filter(p => !p.is_hidden);
  const hidden  = pokemonList.filter(p =>  p.is_hidden);

  const PokemonCard = ({ p }) => {
    const komonName = getKoreanName(p.name) || p.name;
    return (
      <Link
        to={`/pokedex/${p.id}`}
        className="flex flex-col items-center gap-1 p-2.5 bg-white rounded-2xl border border-gray-100
                   hover:border-[#005596] hover:shadow-md transition-all"
      >
        <img
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
          alt={komonName}
          className="w-14 h-14 object-contain"
          loading="lazy"
        />
        <span className="text-[11px] font-bold text-gray-700 text-center leading-tight line-clamp-2">
          {komonName}
        </span>
      </Link>
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <Link to="/pokedex/abilities" className="inline-flex items-center gap-1 text-sm font-bold text-[#005596] hover:underline w-fit">
        ← 특성 도감으로 돌아가기
      </Link>

      {/* 특성 정보 카드 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{koName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{name}</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-5 py-4 text-sm text-gray-700 leading-relaxed">
          {description}
        </div>
      </div>

      {/* 포켓몬 목록 */}
      <div className="flex flex-col gap-5">
        {regular.length > 0 && (
          <div>
            <h2 className="text-base font-black text-gray-900 mb-3">
              일반 특성 포켓몬
              <span className="text-gray-400 text-sm font-bold ml-2">({regular.length}마리)</span>
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
              {regular.map(p => <PokemonCard key={p.name} p={p} />)}
            </div>
          </div>
        )}

        {hidden.length > 0 && (
          <div>
            <h2 className="text-base font-black text-gray-900 mb-3">
              숨겨진 특성 포켓몬
              <span className="text-gray-400 text-sm font-bold ml-2">({hidden.length}마리)</span>
            </h2>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
              {hidden.map(p => <PokemonCard key={p.name} p={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AbilityDetailPage;
