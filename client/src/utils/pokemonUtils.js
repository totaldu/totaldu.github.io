// client/src/utils/pokemonUtils.js
import koreanNames from '../data/pokemonKoreanNames.json';

export const getKoreanName = (name) => {
  if (!name) return '';
  if (koreanNames[name]) return koreanNames[name];
  const baseName = name.split('-')[0];
  return koreanNames[baseName] ?? name;

  export const TYPE_COLORS = {
  normal:'#A8A77A', fire:'#EE8130', water:'#6390F0',
  // ... (이미 두 파일에 중복 선언된 객체)
};

export const getTypeBgStyle = (mainColor, subColor) => {
  if (subColor) {
    return {
      background: `linear-gradient(135deg, ${mainColor}55 0%, ${mainColor}55 50%, ${subColor}55 50%, ${subColor}55 100%)`,
    };
  }
  return {
    background: `linear-gradient(135deg, ${mainColor}33, ${mainColor}11)`,
  };
};
};
