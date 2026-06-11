// client/src/utils/colorContrast.js
// 다크 배경/색 칩 위 글자가 묻히지 않도록 대비 색을 계산하는 헬퍼

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex) => {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// 색 칩(배경) 위 글자색: 밝은 칩일 때만 어두운 글자, 그 외엔 흰색
export const textOn = (hex) => (lum(hex) > 150 ? '#1e2328' : '#ffffff');

// 어두운 배경 위 글자색: 원색을 흰색 쪽으로 밝혀 가독성 확보
export const lighten = (hex, amt = 0.45) => {
  const [r, g, b] = rgb(hex).map((c) => Math.round(c + (255 - c) * amt));
  return `rgb(${r}, ${g}, ${b})`;
};
