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
  hp: 'HP',
  attack: '공격',
  defense: '방어',
  'special-attack': '특공',
  'special-defense': '특방',
  speed: '스피드',
};

// 능력치 최대값 기준 (바 길이 계산용)
const STAT_MAX = {
  hp: 255, attack: 190, defense: 230,
  'special-attack': 194, 'special-defense': 230, speed: 200,
};

const StatBar = ({ label, value }) => {
  const MAX_STAT = 255;
  const percentage = Math.min((value / MAX_STAT) * 100, 100); // 최대 100%로 클램핑

  const getColor = (v) => {
    if (v >= 120) return "bg-green-500";
    if (v >= 80)  return "bg-blue-500";
    if (v >= 50)  return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-3 mb-2">
      {/* 라벨 */}
      <span className="w-20 text-right text-sm text-gray-500 shrink-0">
        {label}
      </span>

      {/* 수치 */}
      <span className="w-8 text-sm font-bold text-gray-800 shrink-0">
        {value}
      </span>

      {/* 막대 — 전체 너비 기준으로 percentage만큼 채움 */}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(data => {
        setPokemon(data);
        setLoading(false);
      })
      .catch(() => {
        setError('포켓몬 정보를 불러오지 못했습니다.');
        setLoading(false);
      });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 font-bold animate-pulse">
      불러오는 중...
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500 font-bold text-center">{error}</div>
  );

  const koreanName = koreanNames[pokemon.name];
  const mainType = pokemon.types[0]?.type?.name || 'normal';
  const subType = pokemon.types[1]?.type?.name;
  const mainColor = TYPE_COLORS[mainType] || '#A8A77A';

  const officialArt =
    pokemon.sprites?.other?.['official-artwork']?.front_default
    || pokemon.sprites?.front_default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;

  const totalStats = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);

  return (
    <div className="w-full flex flex-col gap-6">

      {/* 뒤로가기 */}
      <Link
        to="/pokedex"
        className="inline-flex items-center gap-1 text-sm font-bold text-[#005596] hover:underline w-fit"
      >
        ← 도감으로 돌아가기
      </Link>

      {/* 메인 카드 */}
      <div className="flex flex-col md:flex-row gap-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

        {/* 좌측: 일러스트 */}
        <div
          className="md:w-80 flex flex-col items-center justify-center p-10 shrink-0"
          style={{ background: `linear-gradient(135deg, ${mainColor}33, ${mainColor}11)` }}
        >
          <img
            src={officialArt}
            alt={koreanName || pokemon.name}
            className="w-56 h-56 object-contain drop-shadow-xl"
          />
          <p className="text-xs text-gray-400 font-mono font-bold mt-4">
            #{String(pokemon.id).padStart(4, '0')}
          </p>
          <h1 className="text-3xl font-black text-gray-900 mt-1">
            {koreanName || pokemon.name}
          </h1>
          {koreanName && (
            <p className="text-sm text-gray-400 capitalize mt-0.5">{pokemon.name}</p>
          )}
          <div className="flex gap-2 mt-3">
            <span
              className="px-3 py-1 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: mainColor }}
            >
              {TYPE_KO[mainType] || mainType}
            </span>
            {subType && (
              <span
                className="px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: TYPE_COLORS[subType] || '#aaa' }}
              >
                {TYPE_KO[subType] || subType}
              </span>
            )}
          </div>
        </div>

        {/* 우측: 능력치 */}
        <div className="flex-1 p-8 flex flex-col justify-center gap-6">

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-400 font-bold mb-1">키</p>
              <p className="text-xl font-black text-gray-800">{(pokemon.height / 10).toFixed(1)}m</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-400 font-bold mb-1">몸무게</p>
              <p className="text-xl font-black text-gray-800">{(pokemon.weight / 10).toFixed(1)}kg</p>
            </div>
          </div>

          {/* 종족값 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">종족값</h2>
              <span className="text-sm font-bold text-gray-400">
                합계 <span className="text-[#005596] text-base">{totalStats}</span>
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {pokemon.stats.map(s => (
                <StatBar
                  key={s.stat.name}
                  statName={s.stat.name}
                  value={s.base_stat}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PokemonDetailPage;
