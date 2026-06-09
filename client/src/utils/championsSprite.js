// client/src/utils/championsSprite.js
// Champions sprites (Menu_CP_XXXX.png) URL 생성 유틸
// Bulbagarden Archives: URL = media/upload/{md5[0]}/{md5[0:2]}/{filename}
import SparkMD5 from 'spark-md5';
import nameToId from '@/data/pokemonNameToId.json';
import knownKeys from '@/data/championsSprites.json';

const BASE_URL = 'https://archives.bulbagarden.net/media/upload';
const KNOWN    = new Set(knownKeys);

const buildUrl = (filename) => {
  const hash = SparkMD5.hash(filename);
  return `${BASE_URL}/${hash[0]}/${hash.slice(0, 2)}/${filename}`;
};

/** key = "Menu_CP_" 뒤, ".png" 앞 문자열 (e.g. "0658-Mega") */
const tryKey = (key) => {
  if (!KNOWN.has(key)) return null;
  return buildUrl(`Menu_CP_${key}.png`);
};

/**
 * PokeAPI 폼명 전체 → 챔피언스 스프라이트 오버라이드
 * 일반 패턴(mega / 리전폼 / 1어절 접미사)으로 추론 불가능한 예외만 등록
 */
const NAME_OVERRIDE = {
  'floette-eternal':            { base: 'floette',   suffix: '-Eternal'       },
  'furfrou-la-reine':           { base: 'furfrou',   suffix: '-La_Reine'      },
  'gourgeist-super':            { base: 'gourgeist', suffix: '-Jumbo'         },
  'maushold-family-of-three':   { base: 'maushold',  suffix: '-Three'         },
  'tauros-paldea-combat-breed': { base: 'tauros',    suffix: '-Paldea_Combat' },
  'tauros-paldea-blaze-breed':  { base: 'tauros',    suffix: '-Paldea_Blaze'  },
  'tauros-paldea-aqua-breed':   { base: 'tauros',    suffix: '-Paldea_Aqua'   },
};

/**
 * PokeAPI 포켓몬/폼 이름 → Champions sprite URL
 * 스프라이트가 없으면 null 반환 → 호출 측에서 PokeAPI 스프라이트로 폴백
 *
 * 우선순위:
 *   1. nameToId 직접 조회 (기본 폼)
 *   2. NAME_OVERRIDE (예외 폼)
 *   3. 패턴 파싱 (mega / primal / 리전폼 / 일반 1어절 접미사)
 *      → championsSprites.json Set으로 존재 여부 검증
 */
export const getChampionsSpriteUrl = (pokemonName) => {
  if (!pokemonName) return null;

  // ── 1. 기본 폼 직접 조회 ──────────────────────────────────────────────────
  if (nameToId[pokemonName] !== undefined) {
    return tryKey(String(nameToId[pokemonName]).padStart(4, '0'));
  }

  // ── 2. 전체 이름 오버라이드 ───────────────────────────────────────────────
  if (NAME_OVERRIDE[pokemonName]) {
    const { base, suffix } = NAME_OVERRIDE[pokemonName];
    const dexNum = nameToId[base];
    if (dexNum === undefined) return null;
    return tryKey(String(dexNum).padStart(4, '0') + suffix);
  }

  // ── 3. 패턴 파싱 ─────────────────────────────────────────────────────────
  const parts = pokemonName.split('-');
  let champSuffix = '';
  let baseParts;
  let useBaseFallback = false; // 폼 스프라이트 없을 때 기본 폼으로 대체 허용 여부

  const megaIdx = parts.indexOf('mega');
  if (megaIdx !== -1) {
    const next  = parts[megaIdx + 1];
    champSuffix = next === 'x' ? '-Mega_X' : next === 'y' ? '-Mega_Y' : '-Mega';
    baseParts   = parts.slice(0, megaIdx);
    // 메가 전용 챔피언스 스프라이트가 없으면 기본 폼 스프라이트로 대체
    // (예: 라이츄 메가 X/Y는 Bulbagarden에 0026-Mega 파일이 없음 → 0026 기본 사용)
    useBaseFallback = true;

  } else if (parts.includes('primal')) {
    champSuffix = '-Primal';
    baseParts   = parts.filter(p => p !== 'primal');

  } else if (parts.includes('alola')) {
    champSuffix = '-Alola';
    baseParts   = parts.filter(p => p !== 'alola');

  } else if (parts.includes('galar')) {
    champSuffix = '-Galar';
    baseParts   = parts.filter(p => p !== 'galar');

  } else if (parts.includes('hisui')) {
    champSuffix = '-Hisui';
    baseParts   = parts.filter(p => p !== 'hisui');

  } else if (parts.includes('paldea')) {
    champSuffix = '-Paldea';
    baseParts   = parts.filter(p => p !== 'paldea');

  } else if (parts.length >= 2) {
    // 일반: nameToId에서 알려진 최장 prefix를 base로, 나머지를 폼 세그먼트로 분리
    //   castform-rainy → base[castform] + form[rainy] → -Rainy
    //   alcremie-ruby-cream → base[alcremie] + form[ruby,cream] → -Ruby_Cream
    //   vivillon-high-plains → base[vivillon] + form[high,plains] → -High_Plains
    let splitAt = -1;
    for (let i = parts.length - 1; i >= 1; i--) {
      if (nameToId[parts.slice(0, i).join('-')] !== undefined) { splitAt = i; break; }
    }
    if (splitAt === -1) return null;
    baseParts = parts.slice(0, splitAt);
    champSuffix = '-' + parts.slice(splitAt)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('_');
    useBaseFallback = true; // 해당 폼 스프라이트 없으면 기본 폼으로 대체

  } else {
    return null;
  }

  const baseName = baseParts.join('-');
  const dexNum   = nameToId[baseName];
  if (dexNum === undefined) return null;

  const padded = String(dexNum).padStart(4, '0');
  const result = tryKey(padded + champSuffix);
  if (result) return result;

  // 일반 패턴에서만: 폼 스프라이트 없을 때 기본 폼 스프라이트로 대체
  // (예: lycanroc-midday → 기본 lycanroc 스프라이트, gourgeist-average → 기본 gourgeist 스프라이트)
  if (useBaseFallback) return tryKey(padded);
  return null;
};
