// client/src/pages/PokemonDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import koreanNames from '../data/pokemonKoreanNames.json';
import { getKoreanName } from '../utils/pokemonUtils';
import { useSearchParams, useNavigate } from 'react-router-dom';

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

  // 피카츄
  'rock-star':   '하드록',
  'belle':       '마담',
  'pop-star':    '아이돌',
  'phd':         '닥터',
  'libre':       '마스크드',
  'cosplay':     '명탐정',
  'original-cap': '오리지널캡',
  'hoenn-cap':   '호연캡',
  'sinnoh-cap':  '신오캡',
  'unova-cap':   '하나캡',
  'kalos-cap':   '칼로스캡',
  'alola-cap':   '알로라캡',
  'partner-cap': '너로정했다캡',
  'starter':     '파트너',
  'world-cap':   '월드캡',

  // 마임맨
  'mime':        '마임맨',
  'mime-galar':  '가라르의 모습',

  // 켄타로스
  'paldea-combat-breed': '팔데아의 모습-컴뱃종',
  'paldea-blaze-breed':  '팔데아의 모습-블레이즈종',
  'paldea-aqua-breed':   '팔데아의 모습-워터종',

  // 캐스퐁
  'sunny':       '태양의 모습',
  'rainy':       '빗방울의 모습',
  'snowy':       '설운의 모습',

  // 가이오가, 그란돈
  'primal':      '원시회귀',
  
  // 테오키스
  'normal':      '노멀폼',
  'attack':      '어택폼',
  'defense':     '디펜스폼',
  'speed':       '스피드',

  // 불비달마
  'standard':       '노말모드',
  'zen':            '달마모드',
  'galar-standard': '가라르의 모습-노말모드',
  'galar-zen':      '가라르의 모습-달마모드',

  // 토네로스, 볼트로스, 랜드로스
  'incarnate':      '화신폼',
  'therian':        '영물폼',

  // 케르디오
  'ordinary':  '통상의 모습',
  'resolute':  '각오의 모습',
  
  // 디아루가, 펄기아, 기라티나
  'origin':    '오리진폼',
  'altered':   '어나더폼',
  
  // 쉐이미
  'land':      '랜드폼',
  'sky':       '스카이폼',

  // 로토무
  'heat':      '히트로토무',
  'wash':      '워시로토무',
  'frost':     '프로스트로토무',
  'fan':       '스핀로토무',
  'mow':       '커트로토무',

  // 메로엣타
  'aria':      '보이스폼',
  'pirouette': '스텝폼',

  // 큐레무
  'black':     '블랙큐레무',
  'white':     '화이트큐레무',

  // 개굴닌자
  'battle-bond': '일러스트2',
  'ash':         '지우개굴닌자',

  // 킬가르도
  'shield':      '실드폼',
  'blade':       '블레이드폼',

  // 지가르데
  '50':                 '50%폼',
  '10-power-construct': '10%폼',
  '50-power-construct': '50%폼',
  'complete':           '퍼펙트폼',
  '10':                 '10%폼',

  // 후파
  'unbound':            '굴레를 벗어난 후파',

  // 춤추새
  'baile':     '이글이글스타일',
  'pom-pom':   '파칙파칙스타일',
  'pau':       '훌라훌라스타일',
  'sensu':     '하늘하늘스타일',

  // 루가루암
  'midday':    '한낮의 모습',
  'midnight':  '한밤중의 모습',

  // 약어리
  'solo':      '단독의 모습',
  'school':    '군집의 모습',

  // 메테노
  'red-meteor':      '유성의 모습',
  'orange-meteor':   '유성의 모습',
  'yellow-meteor':   '유성의 모습',
  'green-meteor':      '유성의 모습',
  'blue-meteor':     '유성의 모습',
  'indigo-meteor':   '유성의 모습',
  'violet-meteor':   '유성의 모습',
  'red':             '빨간색 코어',
  'orange':          '주황색 코어',
  'yellow':          '노란색 코어',
  'green':           '초록색 코어',
  'blue':            '파랑색 코어',
  'indigo':          '옥색 코어',
  'violet':          '보라색 코어',

  // 따라큐
  'disguised':       '둔갑한 모습',
  'busted':          '들킨 모습',
  'totem-disguised': '주인 포켓몬-둔갑한 모습',
  'totem-busted':    '주인 포켓몬-들킨 모습',

  // 네크로즈마
  'dawn':            '새벽',
  'ultra':           '울트라네크로즈마',

  // 마기아나
  'original':        '500년 전의 색',
  'original-mega':   '500년 전의 색-메가진화',

  // 윽우지
  'gulping':        '그대로 삼킨 모습',
  'gorging':        '통째로 삼킨 모습',

  // 스트린더
  'amped':          '하이한 모습',
  'low-key':        '로우한 모습',
  'amped-gmax':     '하이한 모습-거다이맥스',
  'low-key-gmax':   '로우한 모습-거다이맥스',

  // 빙큐보
  'noice':          '나이스페이스',

  // 모르페코
  'full-belly':     '배부른 모양',
  'hangry':         '배고픈 모양',

  // 자시안, 자마젠타
  'crowned':        '검왕/방패왕',

  // 우라오스
  'single-strike':      '일격의 모습',
  'rapid-strike':       '연격의 모습',
  'single-strike-gmax': '일격의 모습-거다이맥스',
  'rapid-strike-gmax':  '연격의 모습-거다이맥스',

  // 무한다이노
  'eternamax': '무한다이맥스',

   // 자루도
  'dada':               '아빠',

  // 버드렉스
  'shadow':             '흑마 탄 모습',

  // 다투곰
  'bloodmoon':          '붉은 달',

  // 파밀리쥐
  'family-of-four':     '네 식구',
  'family-of-three':    '세 식구',

  // 시비꼬
  'green-plumage':      '그린 페더',
  'blue-plumage':       '블루 페더',
  'yellow-plumage':     '옐로 페더',
  'white-plumage':      '화이트 페더',

  // 돌핀맨
  'zero':               '나이브폼',
  'hero':               '마이티폼',

  // 싸리용
  'curvy':              '젖힌 모습',
  'droopy':             '늘어진 모습',
  'stretchy':           '뻗은 모습',
  'curvy-mega':         '젖힌 모습-메가진화',
  'droopy-mega':        '늘어진 모습-메가진화',
  'stretchy-mega':      '뻗은 모습-메가진화',

  // 노고고치
  'two-segment':        '두 마디폼',
  'three-segment':      '세 마디폼',

  // 모으령
  'roaming':            '도보폼',

  // 오거폰
  'wellspring-mask':    '우물의 가면',
  'heartflame-mask':    '화덕의 가면',
  'cornerstone-mask':   '주춧돌의 가면',

  // 테라파고스
  'terastal':           '테라스탈폼',
  'stellar':            '스텔라폼',

  // 성별
  'male':        '수컷의 모습',
  'female':      '암컷의 모습',

  // 주인 포켓몬
  'totem':       '주인 포켓몬',
  
  // 리전폼
  'alola':      '알로라의 모습',
  'galar':      '가라르의 모습',
  'hisui':      '히스이의 모습',
  'paldea':     '팔데아의 모습',
  
  // 배틀 기믹
  'mega': '메가진화',
  'mega-x': '메가진화-X',
  'mega-y': '메가진화-Y',
  'mega-z': '메가진화-Z',
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

      <button
        onClick={() => navigate(`/pokedex?page=${fromPage}`)}
        className="inline-flex items-center gap-1 text-sm font-bold text-[#005596] hover:underline w-fit"
      >
        ← 도감으로 돌아가기
      </button>

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
