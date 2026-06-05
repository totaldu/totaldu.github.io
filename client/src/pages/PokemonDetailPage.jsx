// client/src/pages/PokemonDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getKoreanName } from '../utils/pokemonUtils';
import { FORM_LABEL_KO } from '@/constants/formLabels';
import megaIcon from '@/assets/mega-icon.png';

/* ─────────────────────────────────────────────
   상수 / 유틸
───────────────────────────────────────────── */
const MAX_POKEMON_ID = 1025;
const BTN_SIZE       = 48;

const TYPE_COLORS = {
  normal:'#A8A77A', fire:'#EE8130', water:'#6390F0',
  grass:'#7AC74C', electric:'#F7D02C', ice:'#96D9D6',
  fighting:'#C22E28', poison:'#A33EA1', ground:'#E2BF65',
  flying:'#A98FF3', psychic:'#F95587', bug:'#A6B91A',
  rock:'#B6A136', ghost:'#735797', dragon:'#6F35FC',
  dark:'#705746', steel:'#B7B7CE', fairy:'#D685AD',
};
const TYPE_KO = {
  normal:'노말', fire:'불꽃', water:'물', grass:'풀',
  electric:'전기', ice:'얼음', fighting:'격투', poison:'독',
  ground:'땅', flying:'비행', psychic:'에스퍼', bug:'벌레',
  rock:'바위', ghost:'고스트', dragon:'드래곤', dark:'악',
  steel:'강철', fairy:'페어리',
};
const STAT_KO = {
  'hp':'HP', 'attack':'공격', 'defense':'방어',
  'special-attack':'특수공격', 'special-defense':'특수방어', 'speed':'스피드',
};
const HIDDEN_FORM_SUFFIXES = new Set([
  'busted','totem-busted','battle-bond',
  '50-power-construct','10',
  'orange-meteor','yellow-meteor','green-meteor',
  'blue-meteor','indigo-meteor','violet-meteor',
  'curly-mega','droopy-mega',
   'limited-build', 'sprinting-build',
  'swimming-build', 'gliding-build'
]);

const isHiddenForm = (formName) => {
  const suffix = formName.split('-').slice(1).join('-');
  return HIDDEN_FORM_SUFFIXES.has(suffix);
};
const FORM_NAME_OVERRIDE = {
  'eiscue-ice':    '아이스페이스',
  'calyrex-ice':   '백마 탄 모습',
};
const getFormLabel = (formName) => {
  if (FORM_NAME_OVERRIDE[formName]) return FORM_NAME_OVERRIDE[formName];
  const parts  = formName.split('-');
  if (parts.length === 1) return getKoreanName(formName);
  const suffix = parts.slice(1).join('-');
  return FORM_LABEL_KO[suffix] ?? suffix;
};
const getNameFontSize = (name) => {
  const len = name.length;
  if (len >= 7) return '1.05rem';
  if (len >= 5) return '1.3rem';
  if (len >= 4) return '1.5rem';
  return '1.875rem';
};
const getFormBadgeInfo = (formName) => {
  const suffix = formName.split('-').slice(1).join('-');
  if (suffix.startsWith('mega'))      return { type:'mega',      label:'MEGA',   color:'#8B5CF6', useSprite:true  };
  if (suffix.startsWith('gmax'))      return { type:'gmax',      label:'G-MAX',  color:'#DC2626', useSprite:false };
  if (suffix.startsWith('primal'))    return { type:'primal',    label:'PRIMAL', color:'#D97706', useSprite:false };
  if (suffix.startsWith('ultra'))     return { type:'ultra',     label:'ULTRA',  color:'#0EA5E9', useSprite:false };
  if (suffix.startsWith('eternamax')) return { type:'eternamax', label:'E-MAX',  color:'#DC2626', useSprite:false };
  return null;
};

/* ─────────────────────────────────────────────
   StatBar
───────────────────────────────────────────── */
const StatBar = ({ label, value, initialValue = 0 }) => {
  const MAX_STAT   = 255;
  const targetPct  = Math.min((value        / MAX_STAT) * 100, 100);
  const initialPct = Math.min((initialValue / MAX_STAT) * 100, 100);
  const [width, setWidth] = useState(initialPct);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const t = setTimeout(() => setWidth(targetPct), 20);
      return () => clearTimeout(t);
    });
    return () => cancelAnimationFrame(id);
  }, [targetPct]);                        // ✅ targetPct 변경 시 재애니메이션

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
        <div style={{
          height:'100%', borderRadius:'9999px',
          backgroundColor: getColor(value),
          width:`${width}%`,
          transition:'width 700ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   NavArrowButton
   ✅ left/right 값을 -36px → 카드 경계 가까이
───────────────────────────────────────────── */
const NavArrowButton = ({ direction, onClick, disabled }) => {
  const isLeft = direction === 'left';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position:       'absolute',
        top:            '50%',
        [isLeft ? 'left' : 'right']: '-36px',   // ✅ -56 → -36 (안쪽으로)
        transform:      'translateY(-50%)',
        width:          '44px',
        height:         '44px',
        borderRadius:   '50%',
        border:         '1.5px solid #E5E7EB',
        backgroundColor: disabled ? '#F9FAFB' : '#ffffff',
        boxShadow:      disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.10)',
        cursor:         disabled ? 'default' : 'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        color:          disabled ? '#D1D5DB' : '#374151',
        fontSize:       '1.3rem',
        fontWeight:     700,
        lineHeight:     1,
        transition:     'all 0.2s ease',
        zIndex:         20,
        opacity:        disabled ? 0.4 : 1,
        userSelect:     'none',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#F3F4F6';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
        }
      }}
    >
      {isLeft ? '‹' : '›'}
    </button>
  );
};

/* ─────────────────────────────────────────────
   PokemonDetailPage
───────────────────────────────────────────── */
const PokemonDetailPage = () => {
  const { id }          = useParams();
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const fromPage        = Number(searchParams.get('page')) || 1;
  const numericId       = parseInt(id, 10);

  const [pokemon,    setPokemon]    = useState(null);
  const [forms,      setForms]      = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  const [prevStats,  setPrevStats]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  /* ── 내비게이션 ── */
  const handleNav = useCallback((targetId) => {
    // ✅ 상태를 먼저 초기화하고 navigate
    setPokemon(null);
    setForms([]);
    setActiveForm(null);
    setPrevStats({});
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });   // ✅ 맨 위로 스크롤
    navigate(`/pokedex/${targetId}?page=${fromPage}`);
  }, [navigate, fromPage]);

  /* ── 데이터 페치 ── */
  useEffect(() => {
    // id 가 바뀔 때마다 새로 fetch
    let cancelled = false;

    setLoading(true);
    setError(null);
    setPokemon(null);
    setForms([]);
    setActiveForm(null);
    setPrevStats({});

    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then(async (data) => {
        if (cancelled) return;
        setPokemon(data);
        setActiveForm(data);

        const speciesRes  = await fetch(data.species.url);
        const speciesData = await speciesRes.json();

        if (cancelled) return;
        const varieties = speciesData.varieties;

        if (varieties.length > 1) {
          const formDetails = await Promise.all(
            varieties.map(v => fetch(v.pokemon.url).then(r => r.json()))
          );
          if (cancelled) return;
          const visibleForms = formDetails.filter(f => !isHiddenForm(f.name));
          setForms(visibleForms);
        } else {
          setForms([data]);
        }

        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError('포켓몬 정보를 불러오지 못했습니다.');
        setLoading(false);
      });

    return () => { cancelled = true; };   // ✅ 클린업: 이전 fetch 무시
  }, [id]);                               // ✅ id 변경 시마다 재실행

  /* ── 키보드 내비게이션 ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft'  && numericId > 1)              handleNav(numericId - 1);
      if (e.key === 'ArrowRight' && numericId < MAX_POKEMON_ID) handleNav(numericId + 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [numericId, handleNav]);

  /* ── 폼 변경 ── */
  const handleFormChange = (form) => {
    if (!activeForm || form.name === activeForm.name) return;
    const snapshot = {};
    activeForm.stats.forEach(s => { snapshot[s.stat.name] = s.base_stat; });
    setPrevStats(snapshot);
    setActiveForm(form);
  };

  /* ── 로딩 / 에러 ── */
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 font-bold animate-pulse">
      불러오는 중...
    </div>
  );
  if (error) return (
    <div className="p-6 text-red-500 font-bold text-center">{error}</div>
  );
  if (!activeForm) return null;  // ✅ activeForm 없으면 아무것도 렌더 안 함

  /* ── 파생 데이터 ── */
  const koreanName  = getKoreanName(activeForm.name);
  const displayName = koreanName || activeForm.name;
  const mainType    = activeForm.types[0]?.type?.name || 'normal';
  const subType     = activeForm.types[1]?.type?.name;
  const mainColor   = TYPE_COLORS[mainType] || '#A8A77A';
  const totalStats  = activeForm.stats.reduce((sum, s) => sum + s.base_stat, 0);

  const officialArt =
    activeForm.sprites?.other?.['official-artwork']?.front_default
    || activeForm.sprites?.front_default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeForm.id}.png`;

  const baseForm     = forms[0] ?? pokemon;
  const specialForms = forms.filter(f => getFormBadgeInfo(f.name) !== null);

  /* ── 렌더 ── */
  return (
    <div className="w-full flex flex-col gap-6">

      {/* 도감으로 돌아가기 */}
      <button
        onClick={() => navigate(`/pokedex?page=${fromPage}`)}
        className="inline-flex items-center gap-1 text-sm font-bold text-[#005596] hover:underline w-fit"
      >
        ← 도감으로 돌아가기
      </button>

      {/* 일반 폼 탭 */}
      {forms.filter(f => !getFormBadgeInfo(f.name)).length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {forms.map(form => {
            if (getFormBadgeInfo(form.name)) return null;
            return (
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
            );
          })}
        </div>
      )}

      {/* ── 카드 + 화살표 래퍼 ─────────────────── */}
      {/* ✅ px-10 으로 줄여서 화살표가 더 중앙 쪽에 위치 */}
      <div className="relative px-10">

        <NavArrowButton
          direction="left"
          onClick={() => handleNav(numericId - 1)}
          disabled={numericId <= 1}
        />
        <NavArrowButton
          direction="right"
          onClick={() => handleNav(numericId + 1)}
          disabled={numericId >= MAX_POKEMON_ID}
        />

        {/* ── 메인 카드 ── */}
        <div className="flex flex-col md:flex-row gap-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* ══ 좌측 이미지 패널 ══ */}
          <div
            className="md:w-80 flex flex-col items-center justify-center p-10 shrink-0"
            style={{
              background: subType
                ? `linear-gradient(135deg, ${mainColor}66 0%, ${mainColor}44 40%, ${TYPE_COLORS[subType] ?? '#aaa'}44 60%, ${TYPE_COLORS[subType] ?? '#aaa'}66 100%)`
                : `linear-gradient(135deg, ${mainColor}44, ${mainColor}11)`
            }}
          >
            {/* 이미지 + 오버레이 버튼 */}
            <div className="relative" style={{ width:'224px', height:'224px', overflow:'visible' }}>
              <img
                src={officialArt}
                alt={displayName}
                className="w-full h-full object-contain drop-shadow-xl"
              />

              {specialForms.length > 0 && (
                <div style={{
                  position:      'absolute',
                  top:           '-28px',
                  right:         '-28px',
                  display:       'flex',
                  flexDirection: 'row',
                  alignItems:    'center',
                  gap:           '8px',
                  zIndex:        10,
                }}>
                  {specialForms.map(form => {
                    const badge    = getFormBadgeInfo(form.name);
                    const isActive = activeForm.name === form.name;
                    return (
                      <button
                        key={form.name}
                        onClick={() => isActive ? handleFormChange(baseForm) : handleFormChange(form)}
                        title={isActive ? '기본 폼으로 돌아가기' : getFormLabel(form.name)}
                        style={{
                          width:           `${BTN_SIZE}px`,
                          height:          `${BTN_SIZE}px`,
                          borderRadius:    '50%',
                          backgroundColor: isActive ? `${badge.color}22` : 'rgba(255,255,255,0.95)',
                          border:          `2px solid ${badge.color}`,
                          backdropFilter:  'blur(6px)',
                          boxShadow:       isActive
                            ? `0 0 14px ${badge.color}99, 0 2px 8px rgba(0,0,0,0.12)`
                            : '0 2px 8px rgba(0,0,0,0.12)',
                          outline:         isActive ? `3px solid ${badge.color}` : 'none',
                          outlineOffset:   '2px',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                          cursor:          'pointer',
                          transition:      'all 0.2s ease',
                          padding:         0,
                          flexShrink:      0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {badge.useSprite ? (
                          <img src={megaIcon} alt="MEGA"
                            style={{ width:'42px', height:'42px', objectFit:'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize:'0.5rem', fontWeight:900, color:badge.color }}>
                            {badge.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 번호 / 이름 / 영문명 / 타입 */}
            <p className="text-xs text-gray-400 font-mono font-bold mt-4">
              #{String(activeForm.id).padStart(4, '0')}
            </p>
            <h1 className="font-black mt-1"
              style={{ whiteSpace:'nowrap', color:'#111827', fontSize:getNameFontSize(displayName) }}>
              {displayName}
            </h1>
            {koreanName && (
              <p className="text-sm text-gray-400 capitalize mt-0.5">{activeForm.name}</p>
            )}
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor:mainColor }}>
                {TYPE_KO[mainType] || mainType}
              </span>
              {subType && (
                <span className="px-3 py-1 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor:TYPE_COLORS[subType] || '#aaa' }}>
                  {TYPE_KO[subType] || subType}
                </span>
              )}
            </div>
          </div>

          {/* ══ 우측 스탯 패널 ══ */}
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
    </div>
  );
};

export default PokemonDetailPage;
