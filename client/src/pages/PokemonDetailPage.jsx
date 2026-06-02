// client/src/pages/PokemonDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import koreanNames from '../data/pokemonKoreanNames.json';

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

const STAT_KO = {
  "hp": "HP",
  "attack": "공격",
  "defense": "방어",
  "special-attack": "특수공격",
  "special-defense": "특수방어",
  "speed": "스피드",
};

// ✅ 위에 떠있던 data.stats.map() 블록 완전 삭제

const StatBar = ({ label, value }) => {
  const MAX_STAT = 255;
  const percentage = Math.min((value / MAX_STAT) * 100, 100);

  const getColor = (v) => {
    if (v >= 120) return "bg-green-500";
    if (v >= 80)  return "bg-blue-500";
    if (v >= 50)  return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="w-20 text-right text-sm text-gray-500 shrink-0">
        {label}
      </span>
      <span className="w-8 text-sm font-bold text-gray-800 shrink-0">
        {value}
      </span>
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${getColor(value)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const PokemonDetailPage = () => {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [forms, setForms] = useState([]);        // ✅ 폼 목록
  const [activeForm, setActiveForm] = useState(null); // ✅ 현재 선택된 폼
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 기본 포켓몬 + species(폼 목록) 동시 fetch
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(async (data) => {
        setPokemon(data);
        setActiveForm(data); // 기본 폼을 초기값으로

        // species에서 폼 목록 가져오기
        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();

        // varieties = 해당 포켓몬의 모든 폼 목록
        const varieties = speciesData.varieties;

        if (varieties.length > 1) {
          // 폼이 여러 개일 때만 목록 저장
          const formDetails = await Promise.all(
            varieties.map(v => fetch(v.pokemon.url).then(r => r.json()))
          );
          setForms(formDetails);
        } else {
          setForms([data]); // 폼이 하나뿐이면 기본값만
        }

        setLoading(false);
      })
      .catch(() => {
        setError('포켓몬 정보를 불러오지 못했습니다.');
        setLoading(false);
      });
  }, [id]);

  // ✅ activeForm 기준으로 렌더링 (pokemon 대신 activeForm 사용)
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 font-bold animate-pulse">
      불러오는 중...
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500 font-bold text-center">{error}</div>
  );

  const koreanName = getKoreanName(activeForm.name);
  const mainType = activeForm.types[0]?.type?.name || 'normal';
  const subType = activeForm.types[1]?.type?.name;
  const mainColor = TYPE_COLORS[mainType] || '#A8A77A';
  const totalStats = activeForm.stats.reduce((sum, s) => sum + s.base_stat, 0);

  const officialArt =
    activeForm.sprites?.other?.['official-artwork']?.front_default
    || activeForm.sprites?.front_default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeForm.id}.png`;

  return (
    <div className="w-full flex flex-col gap-6">

      <Link
        to="/pokedex"
        className="inline-flex items-center gap-1 text-sm font-bold text-[#005596] hover:underline w-fit"
      >
        ← 도감으로 돌아가기
      </Link>

      {/* ✅ 폼 전환 탭 — 폼이 2개 이상일 때만 표시 */}
      {forms.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {forms.map(form => (
            <button
              key={form.name}
              onClick={() => setActiveForm(form)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${
                activeForm.name === form.name
                  ? 'bg-[#005596] text-white border-[#005596]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#005596] hover:text-[#005596]'
              }`}
            >
              {getFormLabel(form.name)}
            </button>
          ))}
        </div>
      )}

      {/* 기존 메인 카드 — pokemon → activeForm 으로 교체 */}
      <div className="flex flex-col md:flex-row gap-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* ... 나머지 기존 코드 그대로, pokemon. → activeForm. 으로만 변경 ... */}
      </div>

    </div>
  );
};

export default PokemonDetailPage;
