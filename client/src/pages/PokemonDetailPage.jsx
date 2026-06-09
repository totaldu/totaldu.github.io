// client/src/pages/PokemonDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getKoreanName } from '../utils/pokemonUtils';
import { getChampionsSpriteUrl } from '../utils/championsSprite';
import { FORM_LABEL_KO } from '@/constants/formLabels';
import { GEN1_SPECIAL }  from '@/constants/gen1Special';
import { LAST_VERSION }  from '@/constants/lastVersion';
import { FIRST_VERSION } from '@/constants/firstVersion';
import { STAT_CHANGES, FORM_STAT_CHANGES, GEN_LAST_VERSION, GEN_FIRST_VERSION, CHAMPIONS_AVG_STATS } from '@/constants/statChanges';
import abilityKo from '@/data/abilityKoreanNames.json';
import abilityKoDescs from '@/data/abilityKoreanDescs.json';
import megaIcon from '@/assets/mega-icon.png';
import championsKeys from '@/data/championsSprites.json';
import championsLogo from '@/assets/champions-logo.png';

const CHAMPIONS_BASE_IDS = new Set(championsKeys.filter(k => !k.includes('-')));

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
  'special':'특수',
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

const blendWhite = (hex, a) => {
  const h = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
  return `rgb(${Math.round(r*a+255*(1-a))},${Math.round(g*a+255*(1-a))},${Math.round(b*a+255*(1-a))})`;
};
// 항상 4-stop 불투명 그라데이션 → 브라우저가 색상 보간 가능
const computeBg = (mainColor, subType) => {
  const m1 = blendWhite(mainColor, 0.40);
  const m2 = blendWhite(mainColor, 0.27);
  const sub = subType ? (TYPE_COLORS[subType] ?? '#aaaaaa') : mainColor;
  const s1  = blendWhite(sub, subType ? 0.27 : 0.10);
  const s2  = blendWhite(sub, subType ? 0.40 : 0.10);
  return `linear-gradient(135deg, ${m1} 0%, ${m2} 40%, ${s1} 60%, ${s2} 100%)`;
};

const isHiddenForm = (formName) => {
  const suffix = formName.split('-').slice(1).join('-');
  return HIDDEN_FORM_SUFFIXES.has(suffix);
};

// 클릭 토글로 기본 폼 복귀가 불가능한 리전 폼 판별
const isRegionalForm = (formName) =>
  ['alola', 'galar', 'hisui', 'paldea'].some(r => formName.includes(r));

// 특수 폼이 기본 폼이 아닌 특정 폼에서만 전환되어야 하는 경우
// key: 특수 폼 이름, value: 부모 폼 이름
// value: 이 특수 폼으로 진입 가능한 부모 폼 이름(들)
// 단일 문자열 또는 문자열 배열 지원
const SPECIAL_FORM_PARENT = {
  'floette-mega':              'floette-eternal',
  'necrozma-ultra':            ['necrozma-dusk', 'necrozma-dawn'], // 황혼의 갈기·새벽의 날개에서만 진입
  'zygarde-mega':              'zygarde-complete',                 // 퍼펙트폼에서만 진입
  'urshifu-single-strike-gmax':'urshifu-single-strike',           // 일격의 모습에서만 진입
  'urshifu-rapid-strike-gmax': 'urshifu-rapid-strike',            // 연격의 모습에서만 진입
};

// SPECIAL_FORM_PARENT 값을 배열로 정규화
const getFormParents = (formName) => {
  const p = SPECIAL_FORM_PARENT[formName];
  if (!p) return [];
  return Array.isArray(p) ? p : [p];
};

// PokeAPI에 특성 데이터가 없는 챔피언스 전용 폼 하드코딩 (폴백)
// { ability: { name } , is_hidden, slot } — PokeAPI 구조와 동일
const FORM_ABILITIES = {
  'raichu-mega-x': [{ ability: { name: 'electric-surge' }, is_hidden: false, slot: 1 }],
  'raichu-mega-y': [{ ability: { name: 'no-guard'       }, is_hidden: false, slot: 1 }],
};

// PokeAPI 데이터와 무관하게 항상 이 특성으로 강제 표시
const FORCED_FORM_ABILITIES = {
  'darmanitan-zen':       [{ ability: { name: 'zen-mode' }, is_hidden: false, slot: 1 }],
  'darmanitan-galar-zen': [{ ability: { name: 'zen-mode' }, is_hidden: false, slot: 1 }],
};

// activeForm 특성 배열 반환 (강제 override → PokeAPI → 하드코딩 fallback)
const getFormAbilities = (form) =>
  FORCED_FORM_ABILITIES[form?.name]
  ?? (form?.abilities?.length ? form.abilities : (FORM_ABILITIES[form?.name] ?? []));
const FORM_NAME_OVERRIDE = {
  'eiscue-ice':      '아이스페이스',
  'calyrex-ice':     '백마 탄 모습',
  'lycanroc-dusk':    '황혼의 모습',
  'necrozma-dusk':    '황혼의 갈기',
  'zacian-crowned':   '검왕',
  'zamazenta-crowned':'방패왕',
  'greninja-ash':     '지우개굴닌자',
};
const getFormLabel = (formName) => {
  if (FORM_NAME_OVERRIDE[formName]) return FORM_NAME_OVERRIDE[formName];
  const parts = formName.split('-');
  if (parts.length === 1) return getKoreanName(formName);

  // 메가진화: 이름에 'mega'가 포함된 경우 → 메가[한국어이름] (X/Y/Z)
  const megaIdx = parts.indexOf('mega');
  if (megaIdx !== -1) {
    const baseKo    = getKoreanName(parts[0]) || parts[0];
    const middle    = parts.slice(1, megaIdx).join('-');
    const middleStr = middle ? ` (${FORM_LABEL_KO[middle] ?? middle})` : '';
    const variant   = parts[megaIdx + 1];
    const variantStr = ['x','y','z'].includes(variant) ? ` ${variant.toUpperCase()}` : '';
    return `메가${baseKo}${middleStr}${variantStr}`;
  }

  // 거다이맥스: 이름에 'gmax'가 포함된 경우 → 거다이맥스[한국어이름]
  const gmaxIdx = parts.indexOf('gmax');
  if (gmaxIdx !== -1) {
    const baseKo    = getKoreanName(parts[0]) || parts[0];
    const middle    = parts.slice(1, gmaxIdx).join('-');
    const middleStr = middle ? ` (${FORM_LABEL_KO[middle] ?? middle})` : '';
    return `거다이맥스 ${baseKo}${middleStr}`;
  }

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
  const parts  = formName.split('-');
  const suffix = parts.slice(1).join('-');
  if (suffix.startsWith('mega'))    return { type:'mega',   label:'MEGA',   color:'#8B5CF6', useSprite:true  };
  if (parts.includes('gmax'))       return { type:'gmax',   label:'G-MAX',  color:'#DC2626', useSprite:false };
  if (suffix.startsWith('primal'))  return { type:'primal', label:'PRIMAL', color:'#D97706', useSprite:false };
  if (suffix.startsWith('ultra'))   return { type:'ultra',  label:'ULTRA',  color:'#0EA5E9', useSprite:false };
  // eternamax는 일반 폼 탭으로 표시
  return null;
};

/* ─────────────────────────────────────────────
   StatBar
───────────────────────────────────────────── */
const StatBar = ({ label, value, initialValue = 0, showScale = false, avgValue, showAvg = false }) => {
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

  const avgPct = (avgValue != null) ? Math.min((avgValue / MAX_STAT) * 100, 100) : null;

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-sm text-gray-500 shrink-0">{label}</span>
      <span className="w-8 text-sm font-bold text-gray-800 shrink-0">{value}</span>
      <div className="flex-1 flex flex-col gap-0.5">
        {showScale && (
          <div className="flex justify-between">
            <span className="text-[10px] text-gray-400 leading-none">0</span>
            <span className="text-[10px] text-gray-400 leading-none">255</span>
          </div>
        )}
        <div className="relative">
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div style={{
              height:'100%', borderRadius:'9999px',
              backgroundColor: getColor(value),
              width:`${width}%`,
              transition:'width 700ms cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          {showAvg && avgPct != null && (
            <div
              title={`챔피언스 평균: ${avgValue}`}
              style={{
                position:        'absolute',
                top:             '-3px',
                left:            `${avgPct}%`,
                height:          'calc(100% + 6px)',
                width:           '2px',
                backgroundColor: '#374151',
                transform:       'translateX(-50%)',
                borderRadius:    '1px',
                pointerEvents:   'none',
                opacity:         0.65,
              }}
            />
          )}
        </div>
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
   진화 트리
───────────────────────────────────────────── */
const ITEM_KO = {
  'water-stone':'물의돌',      'fire-stone':'불꽃의돌',    'thunder-stone':'천둥의돌',
  'leaf-stone':'풀잎의돌',     'moon-stone':'달의돌',      'sun-stone':'태양의돌',
  'shiny-stone':'빛나는돌',    'dusk-stone':'어둠의돌',    'dawn-stone':'각성의돌',
  'ice-stone':'얼음의돌',      'oval-stone':'타원돌',
  'kings-rock':'왕의징표석',   'metal-coat':'메탈코트',    'dragon-scale':'용의비늘',
  'up-grade':'업그레이드',     'prism-scale':'프리즘비늘',
  'deep-sea-tooth':'심해의이빨','deep-sea-scale':'심해의비늘',
  'protector':'방호조끼',      'electirizer':'일렉티라이저','magmarizer':'마그마라이저',
  'dubious-disc':'의심스러운CD','reaper-cloth':'저승의천',
  'razor-claw':'예리한손톱',   'razor-fang':'예리한송곳니',
  'black-augurite':'흑요석',   'peat-block':'진흙탄',
  'linking-cord':'통신케이블', 'scroll-of-darkness':'암흑두루마리',
  'scroll-of-waters':'물의두루마리','sachet':'포푸리','whipped-dream':'휘핑드림',
  'tart-apple':'새콤한사과',   'sweet-apple':'달콤한사과',
  'cracked-pot':'금간주전자',  'chipped-pot':'이빠진주전자',
  'auspicious-armor':'길조의갑옷','malicious-armor':'흉조의갑옷',
  'syrupy-apple':'즙많은사과', 'galarica-cuff':'갈라르망초팔찌',
  'galarica-wreath':'갈라르망초화환',
};

const getEvoCondition = (details) => {
  if (!details?.length) return '';
  const d = details[0];
  const parts = [];

  if (d.gender === 1) parts.push('♀');
  if (d.gender === 2) parts.push('♂');

  const trigger = d.trigger?.name;
  if (trigger === 'use-item') {
    parts.push(ITEM_KO[d.item?.name] ?? d.item?.name ?? '아이템');
  } else if (trigger === 'trade') {
    if (d.held_item)          parts.push(`${ITEM_KO[d.held_item.name] ?? d.held_item.name} 교환`);
    else if (d.trade_species) parts.push('교환');
    else                      parts.push('통신교환');
  } else if (trigger === 'shed')               parts.push('탈피');
  else if   (trigger === 'spin')               parts.push('회전');
  else if   (trigger === 'three-critical-hits')parts.push('급소 3회');
  else if   (trigger === 'take-damage')        parts.push('49 이상 피해');
  else if   (trigger === 'other')              parts.push('특별 조건');
  else {
    if      (d.min_level)                      parts.push(`Lv.${d.min_level}`);
    else if (d.min_happiness)                  parts.push('친밀도 ↑');
    else if (d.min_beauty)                     parts.push('아름다움 ↑');
    else if (d.known_move)                     parts.push('기술 습득');
    else if (d.known_move_type)                parts.push('특정 타입 기술');
    else if (d.relative_physical_stats === 1)  parts.push('공격 > 방어');
    else if (d.relative_physical_stats === -1) parts.push('공격 < 방어');
    else if (d.relative_physical_stats === 0)  parts.push('공격 = 방어');
    else                                       parts.push('레벨업');
  }

  if (d.held_item && trigger !== 'trade') parts.push(`${ITEM_KO[d.held_item.name] ?? d.held_item.name} 소지`);
  if (d.time_of_day === 'day')   parts.push('낮');
  if (d.time_of_day === 'night') parts.push('밤');
  if (d.time_of_day === 'dusk')  parts.push('황혼');
  if (d.needs_overworld_rain)    parts.push('비');
  if (d.turn_upside_down)        parts.push('뒤집기');
  if (d.location)                parts.push('특정 장소');
  if (d.party_species)           parts.push('파티 조건');
  if (d.party_type)              parts.push('파티 타입');

  return parts.join(' · ');
};

const EvoNode = ({ node, currentSpeciesId }) => {
  const speciesId   = parseInt(node.species.url.split('/').filter(Boolean).pop(), 10);
  const isCurrent   = speciesId === currentSpeciesId;
  const koName      = getKoreanName(node.species.name) || node.species.name;
  const champUrl    = getChampionsSpriteUrl(node.species.name);
  const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;
  const sprite      = champUrl ?? fallbackUrl;

  // 포켓몬 버블 (공통)
  const bubble = (
    <Link
      to={`/pokedex/${speciesId}`}
      className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 transition-all hover:shadow-md
        ${isCurrent
          ? 'border-[#005596] bg-blue-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-[#005596]'}`}
      style={{ minWidth:'84px' }}
    >
      <img
        src={sprite}
        alt={koName}
        className="w-16 h-16 object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={e => { e.target.onerror = null; e.target.src = fallbackUrl; }}
      />
      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight"
            style={{ maxWidth:'76px', wordBreak:'keep-all' }}>
        {koName}
      </span>
      <span className="text-[9px] text-gray-400 font-mono">
        #{String(speciesId).padStart(3,'0')}
      </span>
    </Link>
  );

  // 진화 없음
  if (node.evolves_to.length === 0) return bubble;

  // ── 분기 3개 이상 → 그리드 레이아웃 ─────────────────────────────────────
  if (node.evolves_to.length >= 3) {
    const cols      = node.evolves_to.length <= 3 ? 3 : 4;
    const gridStyle = { display:'grid', gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`, gap:'16px 0' };
    return (
      <div className="flex items-center gap-6">
        {bubble}
        <div style={gridStyle}>
          {node.evolves_to.map((evo, i) => {
            const cond        = getEvoCondition(evo.evolution_details);
            const isLastInRow = (i + 1) % cols === 0 || i === node.evolves_to.length - 1;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5"
                style={{
                  padding:     '0 8px',
                  borderRight: isLastInRow ? 'none' : '1px solid #E5E7EB',
                }}>
                {cond && (
                  <span className="text-[9px] text-gray-500 text-center leading-tight"
                        style={{ maxWidth:'80px', wordBreak:'keep-all' }}>
                    {cond}
                  </span>
                )}
                <span className="text-gray-300 text-xl leading-none">↓</span>
                <EvoNode node={evo} currentSpeciesId={currentSpeciesId} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 분기 1~2개 → 기존 인라인 레이아웃 ───────────────────────────────────
  return (
    <div className="flex items-center gap-1">
      {bubble}
      <div className="flex flex-col">
        {node.evolves_to.map((evo, i) => {
          const cond = getEvoCondition(evo.evolution_details);
          return (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{
                  height:'1px',
                  background:'linear-gradient(to right, transparent, #E5E7EB 15%, #E5E7EB 85%, transparent)',
                  margin:'6px 0',
                }} />
              )}
              <div className="flex items-center gap-1">
                <div className="flex flex-col items-center justify-center gap-0.5 px-1"
                     style={{ minWidth:'64px' }}>
                  {cond && (
                    <span className="text-[9px] text-gray-500 text-center leading-tight"
                          style={{ maxWidth:'64px', wordBreak:'keep-all' }}>
                      {cond}
                    </span>
                  )}
                  <span className="text-gray-300 text-xl leading-none">→</span>
                </div>
                <EvoNode node={evo} currentSpeciesId={currentSpeciesId} />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const EvolutionChainDisplay = ({ chain, currentSpeciesId }) => {
  if (!chain?.evolves_to?.length) return null;
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-black text-gray-900 mb-4">진화</h2>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex items-center min-w-max">
          <EvoNode node={chain} currentSpeciesId={currentSpeciesId} />
        </div>
      </div>
    </div>
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
  const [bgOverlay,   setBgOverlay]  = useState(null);  // 구 배경 fade-out
  const [bgFading,    setBgFading]   = useState(false);
  const [genView,     setGenView]    = useState('modern'); // 'modern' | 'gen1'
  const [showAvgLine,  setShowAvgLine]  = useState(false);  // 챔피언스 평균선
  const [abilityDescs, setAbilityDescs] = useState({});    // 특성 설명 캐시
  const [evolutionChain, setEvolutionChain] = useState(null); // 진화 체인

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

        // 폼 목록 + 진화 체인 병렬 fetch
        const [formResults, chainData] = await Promise.all([
          varieties.length > 1
            ? Promise.all(varieties.map(v => fetch(v.pokemon.url).then(r => r.json())))
            : Promise.resolve([data]),
          fetch(speciesData.evolution_chain.url).then(r => r.json()),
        ]);

        if (cancelled) return;
        const visibleForms = formResults.filter(f => !isHiddenForm(f.name));
        // 크기 폼(소·중·대·특대과종) 순서 정렬
        const SIZE_ORDER = ['small', 'average', 'large', 'super'];
        const getSizeIdx = (name) => {
          const idx = SIZE_ORDER.indexOf(name.split('-').pop());
          return idx === -1 ? Infinity : idx;
        };
        const base = visibleForms.length > 0 ? visibleForms : [data];
        const hasSizeForm = base.some(f => getSizeIdx(f.name) !== Infinity);
        const finalForms  = hasSizeForm
          ? [...base].sort((a, b) => getSizeIdx(a.name) - getSizeIdx(b.name))
          : base;
        setForms(finalForms);
        // 크기 폼이 있으면 소과종(index 0)을 기본으로 표시
        if (hasSizeForm) setActiveForm(finalForms[0]);
        setEvolutionChain(chainData.chain);
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

  /* 포켓몬 변경 시 상태 초기화 */
  useEffect(() => {
    setBgOverlay(null);
    setBgFading(false);
    setGenView('modern');
    setAbilityDescs({});
    setEvolutionChain(null);
  }, [id]);

  /* 폼(activeForm) 변경 시 특성 설명 fetch */
  useEffect(() => {
    const abilities = getFormAbilities(activeForm);
    if (!abilities.length) return;
    let cancelled = false;
    Promise.all(
      abilities.map(a =>
        fetch(`https://pokeapi.co/api/v2/ability/${a.ability.name}`)
          .then(r => r.json())
          .then(d => {
            const get = (lang) =>
              d.flavor_text_entries
                .filter(e => e.language.name === lang)
                .pop()
                ?.flavor_text
                ?.replace(/[\n\f]/g, ' ')
                .trim();
            return [a.ability.name, get('ko') ?? abilityKoDescs[a.ability.name] ?? get('en') ?? null];
          })
          .catch(() => [a.ability.name, abilityKoDescs[a.ability.name] ?? null])
      )
    ).then(results => {
      if (cancelled) return;
      setAbilityDescs(Object.fromEntries(results.filter(([, v]) => v)));
    });
    return () => { cancelled = true; };
  }, [activeForm?.name]);

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

    // 현재(구) 배경을 오버레이로 캡처해 fade-out
    const oldBg = computeBg(
      TYPE_COLORS[activeForm.types[0]?.type?.name || 'normal'] || '#A8A77A',
      activeForm.types[1]?.type?.name
    );
    setBgOverlay(oldBg);
    setBgFading(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setBgFading(true)));

    setActiveForm(form);  // 패널 배경은 즉시 새 색상으로 전환
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
  // 메가진화·거다이맥스만 이름 앞에 접두어 표시, 나머지는 기본 한국어 이름
  const formParts   = activeForm.name.split('-');
  const displayName = (formParts.includes('mega') || formParts.includes('gmax'))
    ? getFormLabel(activeForm.name)
    : (koreanName || activeForm.name);
  const mainType    = activeForm.types[0]?.type?.name || 'normal';
  const subType     = activeForm.types[1]?.type?.name;
  const mainColor   = TYPE_COLORS[mainType] || '#A8A77A';

  const isGen1Pokemon = numericId >= 1 && numericId <= 151;
  const showGen1View  = isGen1Pokemon && genView === 'gen1';
  const gen1Special   = GEN1_SPECIAL[numericId];

  // Gen 1 모드에서는 special-attack·special-defense를 특수 하나로 교체
  const displayStats = (() => {
    if (showGen1View) {
      // Gen 1 뷰에서도 STAT_CHANGES 적용 (6~9세대에 변경된 HP·공격·방어·스피드 보정)
      const change = FORM_STAT_CHANGES[activeForm.name] ?? STAT_CHANGES[numericId];
      const correctedStats = activeForm.stats.map(s => ({
        ...s,
        base_stat: change?.oldStats[s.stat.name] ?? s.base_stat,
      }));
      return [
        ...correctedStats.filter(s => s.stat.name !== 'special-attack' && s.stat.name !== 'special-defense'),
        { stat: { name: 'special' }, base_stat: gen1Special },
      ].sort((a, b) => {
        const order = ['hp','attack','defense','special','speed'];
        return order.indexOf(a.stat.name) - order.indexOf(b.stat.name);
      });
    }
    if (genView === 'oldStat') {
      const change = FORM_STAT_CHANGES[activeForm.name] ?? STAT_CHANGES[numericId];
      if (change) {
        return activeForm.stats.map(s => ({
          ...s,
          base_stat: change.oldStats[s.stat.name] ?? s.base_stat,
        }));
      }
    }
    return activeForm.stats;
  })();
  const totalStats = displayStats.reduce((sum, s) => sum + s.base_stat, 0);

  const officialArt =
    activeForm.sprites?.other?.['official-artwork']?.front_default
    || activeForm.sprites?.front_default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${activeForm.id}.png`;

  const baseForm     = forms[0] ?? pokemon;
  const specialForms = forms.filter(f => getFormBadgeInfo(f.name) !== null);

  /* ── 렌더 ── */
  return (
    <div className="w-full flex flex-col gap-6">

      {/* 도감으로 돌아가기 — 해당 포켓몬의 도감번호 기준 페이지로 이동 */}
      <button
        onClick={() => navigate(`/pokedex?page=${Math.ceil(numericId / 30)}`)}
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
                onClick={() => {
                  if (activeForm.name === form.name && !isRegionalForm(form.name)) {
                    handleFormChange(baseForm);
                  } else {
                    handleFormChange(form);
                  }
                }}
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
            style={{ position: 'relative', background: computeBg(mainColor, subType) }}
          >
            {CHAMPIONS_BASE_IDS.has(String(numericId).padStart(4, '0')) && (
              <img
                src={championsLogo}
                alt="Pokémon Champions"
                style={{ position: 'absolute', top: '12px', left: '12px', width: '64px', height: 'auto', zIndex: 2 }}
              />
            )}
            {bgOverlay && (
              <div
                style={{
                  position: 'absolute', inset: 0, zIndex: 0,
                  background: bgOverlay,
                  opacity: bgFading ? 0 : 1,
                  transition: 'opacity 0.6s ease',
                  pointerEvents: 'none',
                }}
                onTransitionEnd={() => { setBgOverlay(null); setBgFading(false); }}
              />
            )}
            {/* 이미지 + 오버레이 버튼 */}
            <div className="relative" style={{ width:'224px', height:'224px', overflow:'visible', zIndex: 1 }}>
              <img
                src={officialArt}
                alt={displayName}
                className="w-full h-full object-contain drop-shadow-xl"
              />

              {(() => {
                if (!specialForms.length) return null;

                // 실제로 표시될 버튼이 하나라도 있는지 먼저 확인
                const hasVisible = specialForms.some(form => {
                  const isActive = activeForm.name === form.name;
                  if (isActive) return true;
                  const parents = getFormParents(form.name);
                  if (!parents.length) {
                    // 부모 제한 없음 → 기본 폼·특수 폼 상태에서 표시
                    return activeForm.name === baseForm.name
                        || activeForm.name === 'magearna-original'
                        || getFormBadgeInfo(activeForm.name) !== null;
                  }
                  return parents.includes(activeForm.name);
                });
                if (!hasVisible) return null;

                return (
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
                    const parents  = getFormParents(form.name);
                    // 부모 폼이 지정된 경우 해당 폼(들) 또는 자기 자신일 때만 표시
                    if (parents.length && !parents.includes(activeForm.name) && !isActive) return null;
                    const returnTo = parents.length
                      ? (forms.find(f => parents.includes(f.name)) ?? baseForm)
                      : baseForm;
                    return (
                      <button
                        key={form.name}
                        onClick={() => isActive ? handleFormChange(returnTo) : handleFormChange(form)}
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
                );
              })()}
            </div>

            {/* 번호 / 이름 / 영문명 / 타입 */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
            </div>{/* 텍스트 wrapper 닫기 */}
          </div>

          {/* ══ 우측 스탯 패널 ══ */}
          <div className="flex-1 p-8 flex flex-col justify-center gap-6">

            {/* 특성 */}
            {(() => {
              const abilities = getFormAbilities(activeForm);
              const regular = abilities.filter(a => !a.is_hidden);
              const hidden  = abilities.find(a => a.is_hidden);

              const renderPill = (a, isHidden) => {
                const desc = abilityDescs[a.ability.name];
                return (
                  <div key={a.ability.name} className="relative group">
                    <Link
                      to={`/pokedex/ability/${a.ability.name}`}
                      className={`px-3 py-1 bg-white border rounded-full text-sm font-semibold text-gray-700
                        hover:border-[#005596] hover:text-[#005596] transition-all flex items-center gap-1.5
                        ${isHidden ? 'border-dashed border-gray-300' : 'border-gray-200 shadow-sm'}`}
                    >
                      {isHidden && (
                        <span className="text-[10px] font-bold text-gray-700 leading-none">숨겨진</span>
                      )}
                      {abilityKo[a.ability.name] ?? a.ability.name}
                    </Link>
                    {desc && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block z-50 pointer-events-none"
                           style={{ width: '220px' }}>
                        <div className="bg-white text-gray-700 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-200 leading-relaxed break-keep">
                          {desc}
                        </div>
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="bg-gray-50 rounded-2xl px-4 pt-2 pb-4">
                  <p className="text-xs text-gray-400 font-bold text-center mb-3">특성</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {regular.map(a => renderPill(a, false))}
                    {hidden && renderPill(hidden, true)}
                  </div>
                </div>
              );
            })()}

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-black text-gray-900">종족값</h2>
                  {(() => {
                    const lastVer  = LAST_VERSION[numericId]  ?? 'SV';
                    const firstVer = FIRST_VERSION[numericId] ?? 'RGBY';
                    const isBase   = activeForm.name === baseForm.name;
                    const formChange = FORM_STAT_CHANGES[activeForm.name];
                    const change   = formChange ?? (isBase ? STAT_CHANGES[numericId] : null);

                    const GEN_OPTIONS = [];
                    if (isBase && isGen1Pokemon) {
                      GEN_OPTIONS.push({ value: 'gen1', label: 'RGBY' });
                    }
                    if (change) {
                      const prevGen  = change.changedInGen - 1;
                      const lastOld  = change.lastOldVersion ?? GEN_LAST_VERSION[prevGen] ?? 'BW2';
                      const firstNew = GEN_FIRST_VERSION[change.changedInGen] ?? 'XY';
                      const oldFirst = formChange?.firstVersion
                        ?? (isGen1Pokemon ? 'GSC' : firstVer);
                      GEN_OPTIONS.push({
                        value: 'oldStat',
                        label: oldFirst === lastOld ? oldFirst : `${oldFirst} - ${lastOld}`,
                      });
                      GEN_OPTIONS.push({
                        value: 'modern',
                        label: firstNew === lastVer ? `${firstNew} (최신)` : `${firstNew} - ${lastVer} (최신)`,
                      });
                    } else if (isBase && isGen1Pokemon) {
                      GEN_OPTIONS.push({
                        value: 'modern',
                        label: `GSC - ${lastVer} (최신)`,
                      });
                    }

                    if (GEN_OPTIONS.length < 2) return null;

                    const safeView = GEN_OPTIONS.some(o => o.value === genView) ? genView : GEN_OPTIONS[GEN_OPTIONS.length - 1].value;
                    const idx = GEN_OPTIONS.findIndex(o => o.value === safeView);

                    const changeView = (newView) => {
                      const snapshot = {};
                      displayStats.forEach(s => { snapshot[s.stat.name] = s.base_stat; });
                      setPrevStats(snapshot);
                      setGenView(newView);
                    };

                    return (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeView(GEN_OPTIONS[Math.max(0, idx - 1)].value)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                          aria-label="이전 버전"
                        >◀</button>
                        <select
                          value={safeView}
                          onChange={e => changeView(e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium shadow-sm"
                        >
                          {GEN_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => changeView(GEN_OPTIONS[Math.min(GEN_OPTIONS.length - 1, idx + 1)].value)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
                          aria-label="다음 버전"
                        >▶</button>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => setShowAvgLine(v => !v)}
                      className={`text-xs px-2 py-0.5 rounded border font-medium transition-all ${
                        showAvgLine
                          ? 'bg-gray-700 text-white border-gray-700'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-500 hover:text-gray-600'
                      }`}
                    >
                      평균
                    </button>
                    {/* 말풍선 툴팁 */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-white text-gray-700 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-200 text-center"
                        style={{ whiteSpace: 'nowrap' }}>
                        pokémon champions에 등장하는<br />
                        포켓몬들의 종족값 평균입니다.
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-400">
                    합계 <span className="text-[#005596] text-base">{totalStats}</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {displayStats.map(s => (
                  <StatBar
                    key={`${activeForm.name}-${s.stat.name}`}
                    label={STAT_KO[s.stat.name] ?? s.stat.name}
                    value={s.base_stat}
                    initialValue={prevStats[s.stat.name] ?? 0}
                    showScale={s.stat.name === 'hp'}
                    avgValue={CHAMPIONS_AVG_STATS[s.stat.name]}
                    showAvg={showAvgLine}
                  />
                ))}
              </div>
            </div>

            {/* 키 / 몸무게 */}
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

          </div>

        </div>
      </div>

      {/* 진화 트리 */}
      {evolutionChain && (
        <EvolutionChainDisplay chain={evolutionChain} currentSpeciesId={numericId} />
      )}

    </div>
  );
};

export default PokemonDetailPage;
