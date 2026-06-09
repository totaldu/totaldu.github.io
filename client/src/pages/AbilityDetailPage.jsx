// client/src/pages/AbilityDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import abilityKo from '@/data/abilityKoreanNames.json';
import abilityKoDescs from '@/data/abilityKoreanDescs.json';
import abilityKoDetailDescs from '@/data/abilityKoreanDetailDescs.json';
import abilityVersionOverrides from '@/data/abilityVersionOverrides.json';
import abilityRelated from '@/data/abilityRelated.json';
import abilityDetailExtras from '@/data/abilityDetailExtras.json';
import { getKoreanName } from '../utils/pokemonUtils';
import { getChampionsSpriteUrl } from '../utils/championsSprite';

// 이름에 하이픈이 포함되어 있지만 기본 폼인 포켓몬 목록
const HYPHENATED_BASE_NAMES = new Set([
  'mr-mime','mime-jr','mr-rime','ho-oh','porygon-z','type-null',
  'jangmo-o','hakamo-o','kommo-o',
  'tapu-koko','tapu-lele','tapu-bulu','tapu-fini',
  'wo-chien','chien-pao','ting-lu','chi-yu',
  'iron-treads','iron-bundle','iron-hands','iron-jugulis',
  'iron-moth','iron-thorns','iron-valiant','iron-leaves',
  'iron-boulder','iron-crown',
  'great-tusk','scream-tail','brute-bonnet','flutter-mane',
  'slither-wing','sandy-shocks','roaring-moon',
  'walking-wake','gouging-fire','raging-bolt',
]);

const REGIONAL_KEYWORDS = ['alola','galar','hisui','paldea'];

// PokeAPI 특성 데이터에 없는 챔피언스 전용 폼을 특성별로 수동 등록
// key: 특성 이름, value: 추가할 포켓몬 { id, name, is_hidden }
// (PokemonDetailPage의 FORM_ABILITIES와 대응)
const EXTRA_ABILITY_POKEMON = {
  'electric-surge': [{ id: 10304, name: 'raichu-mega-x', is_hidden: false }],
  'no-guard':       [{ id: 10305, name: 'raichu-mega-y', is_hidden: false }],
};

// 특성 목록에서 명시적으로 제외할 폼
const EXCLUDED_NAMES = new Set([
  'pikachu-alola-cap',        // 알로라캡 피카츄 — 리전폼이 아닌 의상 폼
  'maushold-family-of-three', // 파밀리쥐 세 식구 — 네 식구(기본)만 표시
]);

// 이름 패턴 기반 기본 판별 (nameMap 없이 바로 결정 가능한 것만)
const isDefinitelyBase = (pokemonName) => {
  if (EXCLUDED_NAMES.has(pokemonName)) return null;        // null → 명시적 제외
  if (!pokemonName.includes('-')) return true;             // 하이픈 없음 → 기본 폼
  if (HYPHENATED_BASE_NAMES.has(pokemonName)) return true; // 하이픈 포함 기본 폼
  if (pokemonName.includes('mega')) return true;           // 메가진화 → 항상 표시
  if (pokemonName.includes('primal')) return true;         // 원시회귀 (그란돈/가이오가)
  // 거다이맥스: 기본 폼과 동일 특성이지만 PokeAPI nameMap 조회 실패로 오노출되므로 명시 제외
  if (pokemonName.includes('gmax')) return null;
  if (REGIONAL_KEYWORDS.some(r => pokemonName.includes(r))) return true; // 리전폼
  return false; // false → nameMap으로 추가 판단 필요
};

// 전체 목록(nameMap)을 활용해 폼 변경 시 특성이 달라지는 폼도 포함
const buildPokemonList = (allEntries) => {
  // 이름 → 엔트리 맵 (기본 폼 특성 역할 비교용)
  const nameMap = Object.fromEntries(allEntries.map(p => [p.name, p]));

  return allEntries.filter(p => {
    const base = isDefinitelyBase(p.name);
    if (base === null) return false;   // 명시적 제외
    if (base === true)  return true;   // 확실한 표시 대상

    // base === false: 기타 폼 → nameMap으로 판단
    const baseName  = p.name.split('-')[0];
    const baseEntry = nameMap[baseName];

    if (!baseEntry) {
      // 기본 폼(baseName)이 이 특성을 아예 갖지 않음
      // → 이 폼만의 고유 특성 → 표시 (큐레무 블랙/화이트, 칼로스 빙마 등)
      return true;
    }

    // 기본 폼이 이 특성을 숨겨진 특성으로 갖고, 이 폼은 일반 특성으로 가짐
    // → 폼 변경 시 특성 역할이 달라짐 → 표시 (토네로스/썬더루스/랜드로스 영물폼 등)
    if (!p.is_hidden && baseEntry.is_hidden) return true;

    return false;
  });
};

// ─── 표시 이름 (메가진화 등 처리) ─────────────────────────────────────────────
const getDisplayName = (pokemonName) => {
  const parts   = pokemonName.split('-');
  const megaIdx = parts.indexOf('mega');
  if (megaIdx !== -1) {
    const baseKo    = getKoreanName(parts[0]) || parts[0];
    const variant   = parts[megaIdx + 1];
    const variantStr = ['x','y','z'].includes(variant) ? ` ${variant.toUpperCase()}` : '';
    return `메가${baseKo}${variantStr}`;
  }
  return getKoreanName(pokemonName) || pokemonName;
};

// ─── 포켓몬 카드 컴포넌트 ────────────────────────────────────────────────────
const PokemonCard = ({ p }) => {
  const komonName  = getDisplayName(p.name);
  const champUrl   = getChampionsSpriteUrl(p.name);
  const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;

  return (
    <Link
      to={`/pokedex/${p.id}`}
      className="flex flex-col items-center gap-1 p-2.5 bg-white rounded-2xl border border-gray-100
                 hover:border-[#005596] hover:shadow-md transition-all"
    >
      <img
        src={champUrl ?? fallbackUrl}
        alt={komonName}
        className="w-14 h-16 object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={e => { e.target.onerror = null; e.target.src = fallbackUrl; }}
      />
      <span className="text-[11px] font-bold text-gray-700 text-center leading-tight line-clamp-2">
        {komonName}
      </span>
    </Link>
  );
};

// 버전 그룹 출시 순서 (앞쪽일수록 오래된 버전)
const VERSION_GROUP_ORDER = [
  'red-blue', 'yellow',
  'gold-silver', 'crystal',
  'ruby-sapphire', 'firered-leafgreen', 'emerald',
  'diamond-pearl', 'platinum', 'heartgold-soulsilver',
  'black-white', 'black-2-white-2',
  'x-y', 'omega-ruby-alpha-sapphire',
  'sun-moon', 'ultra-sun-ultra-moon', 'lets-go-pikachu-lets-go-eevee',
  'sword-shield', 'the-isle-of-armor', 'the-crown-tundra',
  'scarlet-violet', 'the-teal-mask', 'the-indigo-disk',
];

const VERSION_GROUP_LABEL = {
  'ruby-sapphire':              'RS',
  'firered-leafgreen':          'FRLG',
  'emerald':                    'E',
  'diamond-pearl':              'DP',
  'platinum':                   'Pt',
  'heartgold-soulsilver':       'HGSS',
  'black-white':                'BW',
  'black-2-white-2':            'BW2',
  'x-y':                        'XY',
  'omega-ruby-alpha-sapphire':  'ORAS',
  'sun-moon':                   'SM',
  'ultra-sun-ultra-moon':       'USUM',
  'lets-go-pikachu-lets-go-eevee': 'LGPE',
  'sword-shield':               'SwSh',
  'the-isle-of-armor':          'SwSh 갑옷의 외딴섬',
  'the-crown-tundra':           'SwSh 왕관의 설원',
  'scarlet-violet':             'SV',
  'the-teal-mask':              'SV 벽록의 가면',
  'the-indigo-disk':            'SV 남청의 원반',
};

// flavor_text_entries 에서 가장 오래된 버전 그룹 추출
const getFirstVersionLabel = (flavorEntries) => {
  const groups = flavorEntries.map(e => e.version_group.name);
  const earliest = [...new Set(groups)].sort(
    (a, b) => VERSION_GROUP_ORDER.indexOf(a) - VERSION_GROUP_ORDER.indexOf(b)
  )[0];
  return earliest ? (VERSION_GROUP_LABEL[earliest] ?? null) : null;
};

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────
const AbilityDetailPage = () => {
  const { name } = useParams();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [showDetail, setShowDetail] = useState(false);

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
  const description = getDesc('ko') ?? abilityKoDescs[name] ?? getDesc('en') ?? '설명 없음';

  // 상세 설명: 한국어 상세 JSON 우선, 없으면 PokeAPI effect_entries 영어
  const getEffectEntry = (lang) =>
    data.effect_entries
      .find(e => e.language.name === lang)
      ?.effect
      ?.replace(/\n/g, ' ')
      .trim();
  const detailDescription = abilityKoDetailDescs[name] ?? getEffectEntry('en') ?? null;

  // 배울 수 있는 포켓몬: ID 순 정렬 후 필터
  const allPokemon = data.pokemon.map(p => {
    const url = p.pokemon.url;
    const id  = parseInt(url.split('/').filter(Boolean).pop(), 10);
    return { id, name: p.pokemon.name, is_hidden: p.is_hidden };
  });
  // 챔피언스 전용 폼(PokeAPI 특성 데이터 부재) 수동 추가 — 중복 제외
  const extra = (EXTRA_ABILITY_POKEMON[name] ?? [])
    .filter(e => !allPokemon.some(p => p.name === e.name));
  const pokemonList = buildPokemonList([...allPokemon, ...extra]).sort((a, b) => a.id - b.id);

  // normal / hidden 분리
  const regular = pokemonList.filter(p => !p.is_hidden);
  const hidden  = pokemonList.filter(p =>  p.is_hidden);

  return (
    <div className="w-full flex flex-col gap-6">
      <Link to="/pokedex/abilities" className="inline-flex items-center gap-1 text-sm font-bold text-[#005596] hover:underline w-fit">
        ← 특성 도감으로 돌아가기
      </Link>

      {/* 특성 정보 카드 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col gap-3">
        <div className="relative flex flex-col items-center text-center">
          <h1 className="text-2xl font-black text-gray-900">{koName}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{name}</p>
          {(() => {
            const label = abilityVersionOverrides[name] ?? getFirstVersionLabel(data.flavor_text_entries);
            return label ? (
              <span className="absolute right-0 top-0 text-xs font-bold text-white bg-[#005596] rounded-xl px-3 py-1.5 flex flex-col items-center leading-tight">
                <span>첫 등장</span>
                <span>{label}</span>
              </span>
            ) : null;
          })()}
        </div>
        <div className="bg-gray-50 rounded-xl px-5 py-4 text-sm text-gray-700 leading-relaxed">
          {description}
        </div>

        {detailDescription && (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowDetail(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span>상세 설명</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${showDetail ? 'rotate-180' : ''}`}
              />
            </button>
            {showDetail && (
              <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                <span>{detailDescription}</span>
                {abilityDetailExtras[name]?.map((extra, i) => (
                  <div key={i} className="flex flex-col gap-1.5 pt-3 border-t border-gray-200 items-start">
                    <span className="text-sm font-bold text-gray-700">{extra.title}</span>
                    <span className="text-sm text-gray-700">{extra.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {abilityRelated[name]?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">관련 특성</p>
            <div className="flex flex-wrap gap-2">
              {[...abilityRelated[name]].sort((a, b) => (abilityKo[a] ?? a).localeCompare(abilityKo[b] ?? b, 'ko')).map(relName => (
                <Link
                  key={relName}
                  to={`/pokedex/ability/${relName}`}
                  className="text-xs font-bold text-[#005596] bg-blue-50 hover:bg-blue-100 rounded-full px-3 py-1.5 transition-colors"
                >
                  {abilityKo[relName] ?? relName}
                </Link>
              ))}
            </div>
          </div>
        )}
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
