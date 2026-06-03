// client/src/pages/PokemonDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getKoreanName } from '../utils/pokemonUtils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FORM_LABEL_KO } from '@/constants/formLabels';

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

const HIDDEN_FORM_SUFFIXES = new Set([
  'busted',
  'totem-busted',
  'battle-bond',
  '50-power-construct',
  '10',
  'orange-meteor',
  'yellow-meteor',
  'green-meteor',
  'blue-meteor',
  'indigo-meteor',
  'violet-meteor',
  'curly-mega',
  'droopy-mega',
]);

const isHiddenForm = (formName) => {
  const parts = formName.split('-');
  const suffix = parts.slice(1).join('-');
  return HIDDEN_FORM_SUFFIXES.has(suffix);
};

const getFormLabel = (formName) => {
  const parts = formName.split('-');
  if (parts.length === 1) return getKoreanName(formName);
  const suffix = parts.slice(1).join('-');
  return FORM_LABEL_KO[suffix] ?? suffix;
};

// ✅ 이름 길이에 따른 폰트 크기 계산
const getNameFontSize = (name) => {
  const len = name.length;
  if (len >= 7) return '1.05rem';
  if (len >= 5) return '1.3rem';
  if (len >= 4) return '1.5rem';
  return '1.875rem';
};

const StatBar = ({ label, value, initialValue = 0 }) => {
  const MAX_STAT = 255;
  const targetPct  = Math.min((value        / MAX_STAT) * 100, 100);
  const initialPct = Math.min((initialValue / MAX_STAT) * 100, 100);

  const [width, setWidth] = useState(initialPct);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const timer = setTimeout(() => setWidth(targetPct), 20);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const getColor = (v) => {
    if (v >= 120) return '#22c55e';
    if (v >= 80)  return '#3b82f6';
    if (v >= 50)  return '#facc15';
    return '#ef4444';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-sm text-gray-500 shrink-0">{label}</span>
      <span className="w-8 text-sm font-bold text-gray-800 shrink-0">{value}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          style={{
            height: '100%',
            borderRadius: '9999px',
            backgroundColor: getColor(value),
            width: `${width}%`,
            transition: 'width 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
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
  const [prevStats, setPrevStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromPage = Number(searchParams.get('page')) || 1;

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
        setPrevStats({});
        setActiveForm(data);

        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        const varieties = speciesData.varieties;

        if (varieties.length > 1) {
          const formDetails = await Promise.all(
            varieties.map(v => fetch(v.pokemon.url).then(r => r.json()))
          );
          const visibleForms = formDetails.filter(f => !isHiddenForm(f.name));
          setForms(visibleForms);
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

  const handleFormChange = (form) => {
    if (!activeForm || form.name === activeForm.name) return;
    const snapshot = {};
    activeForm.stats.forEach(s => { snapshot[s.stat.name] = s.base_stat; });
    setPrevStats(snapshot);
    setActiveForm(form);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 font-bold animate-pulse">
      불러오는 중...
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-500 font-bold text-center">{error}</div>
  );

  const koreanName = getKoreanName(activeForm.name);
  const displayName = koreanName || activeForm.name; // ✅ 변수로 분리
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

      <button
        onClick={() => navigate(`/pokedex?page=${fromPage}`)}
        className="inline-flex items-center gap-1 text-sm font-bold text-[#005596] hover:underline w-fit"
      >
        ← 도감으로 돌아가기
      </button>

      {forms.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {forms.map(form => (
            <button
              key={form.name}
              onClick={() => handleFormChange(form)}
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

      <div className="flex flex-col md:flex-row gap-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

        <div
          className="md:w-80 flex flex-col items-center justify-center p-10 shrink-0"
          style={{ background: `linear-gradient(135deg, ${mainColor}33, ${mainColor}11)` }}
        >
          <img
            src={officialArt}
            alt={displayName}
            className="w-56 h-56 object-contain drop-shadow-xl"
          />
          <p className="text-xs text-gray-400 font-mono font-bold mt-4">
            #{String(activeForm.id).padStart(4, '0')}
          </p>

          {/* ✅ 핵심 수정: whiteSpace를 인라인 style로 이동 + 길이별 fontSize */}
          <h1
            className="font-black mt-1"
            style={{
              whiteSpace: 'nowrap',        /* ← Tailwind 클래스 대신 인라인으로 확실하게 */
              color: '#111827',
              fontSize: getNameFontSize(displayName),
            }}
          >
            {displayName}
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
                  key={`${activeForm.name}-${s.stat.name}`}
                  label={STAT_KO[s.stat.name] ?? s.stat.name}
                  value={s.base_stat}
                  initialValue={prevStats[s.stat.name] ?? 0}
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
