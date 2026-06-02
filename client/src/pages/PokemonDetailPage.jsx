// client/src/pages/PokemonDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import koreanNames from '../data/pokemonKoreanNames.json';
import { getKoreanName } from '../utils/pokemonUtils';

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

const FORM_LABEL_KO = {

  //피카츄
  'rock-star': '하드록',
  'belle':     '마담',
  'pop-star':  '아이돌',
  'phd':       '닥',
  'libre':     '마스크',
  'cosplay':   '명탐정/ client/src/pages/PokemonDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import koreanNames from '../data/pokemonKoreanNames.json';
import { getKoreanName } from '../utils/pokemonUtils';

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

const FORM_LABEL_KO = {

  //피카츄
  'rock-star':   '하드록',
  'belle':       '마담',
  'pop-star':    '아이돌',
  'phd':         '닥',
  'libre':       '마스크',
  'cosplay':     '명탐정',
  'original-cap':     '오리지널캡',
  'hoenn-cap':   '호연캡',
  'sinnoh-cap':  '신오캡',
  'unova-cap':   '하나캡',
  'kalos-cap':   '칼로스캡',
  'alola-cap':   '알로라캡',
  'partner-cap': '너로정했다캡',
  'starter':     '파트',
  'world-cap':   '월드캡',
  
  // 테오키스
  'normal':    '노말',
  'attack':    '어택',
  'defense':   '디펜스',
  'speed':     '스피드',

  //케르디오
  'ordinary':  '통상',
  'resolute':  '각오',
  
  // 디아루가, 펄기아, 기라티나
  'origin':    '오리진',
  'altered':   '어나더',
  
  // 쉐이미
  'land':      '랜드',
  'sky':       '스카이',

  //쉐이미
  'heat':      '히트',
  'wash':      '워시',
  'frost':     '프로스트',
  'fan':       '스핀',
  'mow':       '커트',

  // 메로엣타
  'aria':      '보이스',
  'pirouette': '스텝',

  // 춤추새
  'baile':     '이글이글',
  'pom-pom':   '파칙파칙',
  'pau':       '훌라훌라',
  'sensu':     '하늘하늘',

  //루가루암
  'midnight':  '한밤',
  'dusk':      '황혼',
  'dawn':      '여명',

  // 무한다이노
  'eternamax': '무한다이맥스'
  
  // 리전폼
  'alola':      '알로라',
  'galar':      '가라르',
  'hisui':      '히스이',
  'paldea':     '팔데아',
  
  // 배틀 기믹
  'mega': '메가',
  'mega-x': '메가-X',
  'mega-y': '메가-Y',
  'gmax': '거다이맥스',
};

const getFormLabel = (formName) => {
  const parts = formName.split('-');
  if (parts.length === 1) return getKoreanName(formName);
  const suffix = parts.slice(1).join('-');
  return FORM_LABEL_KO[suffix] ?? suffix;
};

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
  const [forms, setForms] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
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
      .then(async (data) => {
        setPokemon(data);
        setActiveForm(data);

        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        const varieties = speciesData.varieties;

        if (varieties.length > 1) {
          const formDetails = await Promise.all(
            varieties.map(v => fetch(v.pokemon.url).then(r => r.json()))
          );
          setForms(formDetails);
        } else {
          setForms([data]);
        }

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

      {/* 폼 전환 탭 — 2개 이상일 때만 표시 */}
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

      {/* 메인 카드 */}
      <div className="flex flex-col md:flex-row gap-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

        {/* 왼쪽: 이미지 + 이름 + 타입 */}
        <div
          className="md:w-80 flex flex-col items-center justify-center p-10 shrink-0"
          style={{ background: `linear-gradient(135deg, ${mainColor}33, ${mainColor}11)` }}
        >
          <img
            src={officialArt}
            alt={koreanName || activeForm.name}
            className="w-56 h-56 object-contain drop-shadow-xl"
          />
          <p className="text-xs text-gray-400 font-mono font-bold mt-4">
            #{String(activeForm.id).padStart(4, '0')}
          </p>
          <h1 className="text-3xl font-black text-gray-900 mt-1">
            {koreanName || activeForm.name}
          </h1>
          {koreanName && (
            <p className="text-sm text-gray-400 capitalize mt-0.5">{activeForm.name}</p>
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

        {/* 오른쪽: 키/몸무게 + 종족값 */}
        <div className="flex-1 p-8 flex flex-col justify-center gap-6">

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-400 font-bold mb-1">키</p>
              <p className="text-xl font-black text-gray-800">{(activeForm.height / 10).toFixed(1)}m</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-400 font-bold mb-1">몸무게</p>
              <p className="text-xl font-black text-gray-800">{(activeForm.weight / 10).toFixed(1)}kg</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">종족값</h2>
              <span className="text-sm font-bold text-gray-400">
                합계 <span className="text-[#005596] text-base">{totalStats}</span>
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {activeForm.stats.map(s => (
                <StatBar
                  key={s.stat.name}
                  label={STAT_KO[s.stat.name] ?? s.stat.name}
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
