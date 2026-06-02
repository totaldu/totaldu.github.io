// client/src/utils/pokemonUtils.js
import koreanNames from '../data/pokemonKoreanNames.json';

export const getKoreanName = (name) => {
  if (!name) return '';
  if (koreanNames[name]) return koreanNames[name];
  const baseName = name.split('-')[0];
  return koreanNames[baseName] ?? name;
};
