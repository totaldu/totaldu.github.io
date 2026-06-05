// client/src/pages/TypeChartPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const TypeChartPage = () => {
  const baseTypes = [
    { name: '노말', color: '#A8A77A' },
    { name: '불꽃', color: '#EE8130' },
    { name: '물', color: '#6390F0' },
    { name: '풀', color: '#7AC74C' },
    { name: '전기', color: '#F7D02C' },
    { name: '얼음', color: '#96D9D6' },
    { name: '격투', color: '#C22E28' },
    { name: '독', color: '#A33EA1' },
    { name: '땅', color: '#E2BF65' },
    { name: '비행', color: '#A98FF3' },
    { name: '에스퍼', color: '#F95587' },
    { name: '벌레', color: '#A6B91A' },
    { name: '바위', color: '#B6A136' },
    { name: '고스트', color: '#735797' },
    { name: '드래곤', color: '#6F35FC' },
    { name: '악', color: '#705746' },
    { name: '강철', color: '#B7B7CE' },
    { name: '페어리', color: '#D685AD' }
  ];

  const matrixV3 = [
    [1,1,1,1,1,1,1,1,1,1,1,1,0.5,0,1,1,0.5,1],
    [1,0.5,0.5,2,1,2,1,1,1,1,1,2,0.5,1,0.5,1,2,1],
    [1,2,0.5,0.5,1,1,1,1,2,1,1,1,2,1,0.5,1,1,1],
    [1,0.5,2,0.5,1,1,1,0.5,2,0.5,1,0.5,2,1,0.5,1,0.5,1],
    [1,1,2,0.5,0.5,1,1,1,0,2,1,1,1,1,0.5,1,1,1],
    [1,0.5,0.5,2,1,0.5,1,1,2,2,1,1,1,1,2,1,0.5,1],
    [2,1,1,1,1,2,1,0.5,1,0.5,0.5,0.5,2,0,1,2,2,0.5],
    [1,1,1,2,1,1,1,0.5,0.5,1,1,1,0.5,0.5,1,1,0,2],
    [1,2,1,0.5,2,1,1,2,1,0,1,0.5,2,1,1,1,2,1],
    [1,1,1,2,0.5,1,2,1,1,1,1,2,0.5,1,1,1,0.5,1],
    [1,1,1,1,1,1,2,2,1,1,0.5,1,1,1,1,0,0.5,1],
    [1,0.5,1,2,1,1,0.5,0.5,1,0.5,2,1,1,0.5,1,2,0.5,0.5],
    [1,2,1,1,1,2,0.5,1,0.5,2,1,2,1,1,1,1,0.5,1],
    [0,1,1,1,1,1,1,1,1,1,2,1,1,2,1,0.5,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,0.5,0],
    [1,1,1,1,1,1,0.5,1,1,1,2,1,1,2,1,0.5,1,0.5],
    [1,0.5,0.5,1,0.5,2,1,1,1,1,1,1,2,1,1,1,0.5,2],
    [1,0.5,1,1,1,1,2,0.5,1,1,1,1,1,1,2,2,0.5,1],
  ];

  const matrixV2 = [
    [1,1,1,1,1,1,1,1,1,1,1,1,0.5,0,1,1,0.5],
    [1,0.5,0.5,2,1,2,1,1,1,1,1,2,0.5,1,0.5,1,2],
    [1,2,0.5,0.5,1,1,1,1,2,1,1,1,2,1,0.5,1,1],
    [1,0.5,2,0.5,1,1,1,0.5,2,0.5,1,0.5,2,1,0.5,1,0.5],
    [1,1,2,0.5,0.5,1,1,1,0,2,1,1,1,1,0.5,1,1],
    [1,0.5,0.5,2,1,0.5,1,1,2,2,1,1,1,1,2,1,0.5],
    [2,1,1,1,1,2,1,0.5,1,0.5,0.5,0.5,2,0,1,2,2],
    [1,1,1,2,1,1,1,0.5,0.5,1,1,1,0.5,0.5,1,1,0],
    [1,2,1,0.5,2,1,1,2,1,0,1,0.5,2,1,1,1,2],
    [1,1,1,2,0.5,1,2,1,1,1,1,2,0.5,1,1,1,0.5],
    [1,1,1,1,1,1,2,2,1,1,0.5,1,1,1,1,0,0.5],
    [1,0.5,1,2,1,1,0.5,0.5,1,0.5,2,1,1,0.5,1,2,0.5],
    [1,2,1,1,1,2,0.5,1,0.5,2,1,2,1,1,1,1,0.5],
    [0,1,1,1,1,1,1,1,1,1,2,1,1,2,1,0.5,0.5],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,0.5],
    [1,1,1,1,1,1,0.5,1,1,1,2,1,1,2,1,0.5,0.5],
    [1,0.5,0.5,1,0.5,2,1,1,1,1,1,1,2,1,1,1,0.5],
  ];

  const matrixV1 = [
    [1,1,1,1,1,1,1,1,1,1,1,1,0.5,0,1],
    [1,0.5,0.5,2,1,2,1,1,1,1,1,2,0.5,1,0.5],
    [1,2,0.5,0.5,1,1,1,1,2,1,1,1,2,1,0.5],
    [1,0.5,2,0.5,1,1,1,0.5,2,0.5,1,0.5,2,1,0.5],
    [1,1,2,0.5,0.5,1,1,1,0,2,1,1,1,1,0.5],
    [1,1,0.5,2,1,0.5,1,1,2,2,1,1,1,1,2],
    [2,1,1,1,1,2,1,0.5,1,0.5,0.5,0.5,2,0,1],
    [1,1,1,2,1,1,1,0.5,0.5,1,1,2,0.5,0.5,1],
    [1,2,1,0.5,2,1,1,2,1,0,1,0.5,2,1,1],
    [1,1,1,2,0.5,1,2,1,1,1,1,2,0.5,1,1],
    [1,1,1,1,1,1,2,2,1,1,0.5,1,1,1,1],
    [1,0.5,1,2,1,1,0.5,2,1,0.5,2,1,1,0.5,1],
    [1,2,1,1,1,2,0.5,1,0.5,2,1,2,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0,1,1,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],
  ];

  const versions = [
    { id: 'type_table_v1', label: 'RGBY',                  size: 15, matrix: matrixV1 },
    { id: 'type_table_v2', label: 'GS - BW2',              size: 17, matrix: matrixV2 },
    { id: 'type_table_v3', label: 'XY - Champions (최신)', size: 18, matrix: matrixV3 },
  ];

  const [selectedVersionIndex, setSelectedVersionIndex] = useState(versions.length - 1);

  const currentVersion = versions[selectedVersionIndex];
  const currentSize = currentVersion.size;
  const currentTypes = baseTypes.slice(0, currentSize);
  const currentMatrix = currentVersion.matrix;

  const getEffContent = (val) => {
    if (val === 2)   return <span className="text-red-600 font-extrabold">2</span>;
    if (val === 0.5) return <span className="text-blue-500 font-extrabold">½</span>;
    if (val === 0)   return <span className="text-gray-300 font-extrabold">0</span>;
    return <span className="text-gray-200 font-extrabold select-none"> </span>; // 1은 점으로 표시 (노이즈 감소)
  };

  return (
    // ✅ 핵심: min-h-screen, max-w, p-4 등 전부 제거 → w-full h-full로 BattleLayout에 완전히 위임
    <div className="w-full h-full flex flex-col gap-6">

      {/* 상단 헤더 영역 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link to="/battle" className="text-[#005596] text-sm font-bold mb-1 inline-block hover:underline">
            ← 배틀 정보로 돌아가기
          </Link>
          <h1 className="text-2xl font-black text-gray-900">전체 타입 상성표</h1>
          <p className="text-sm text-gray-400 mt-0.5">{currentVersion.label}</p>
        </div>

        {/* 버전 선택기 */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 font-medium">버전</label>
          <select
            aria-label="타입 상성표 버전 선택"
            value={selectedVersionIndex}
            onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium"
          >
            {versions.map((v, idx) => (
              <option key={v.id} value={idx}>{v.label}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => setSelectedVersionIndex((i) => Math.max(0, i - 1))}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              aria-label="이전 버전"
            >◀</button>
            <button
              onClick={() => setSelectedVersionIndex((i) => Math.min(versions.length - 1, i + 1))}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              aria-label="다음 버전"
            >▶</button>
          </div>
        </div>
      </div>

      {/* ✅ 테이블 영역: w-full + overflow-x-auto로 화면 전체 활용 */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full table-fixed border-collapse text-center">
          <thead>
            <tr>
              {/* 좌상단 코너셀 */}
              <th className="sticky left-0 z-20 bg-gray-50 border border-gray-200 text-[10px] text-gray-400 font-bold w-10 h-10">
                공↓방→
              </th>
              {currentTypes.map(t => (
                <th key={t.name} className="border border-gray-200 p-0 w-10 h-10">
                  <div
                    className="w-full h-10 flex items-center justify-center text-[11px] font-black text-white"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.name[0]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentTypes.map((rowType, rowIndex) => (
              <tr key={rowType.name} className="hover:bg-gray-50 transition-colors">
                {/* 행 헤더 (타입 이름 첫 글자) */}
                <td
                  className="sticky left-0 z-10 border border-gray-200 text-[11px] font-black text-white text-center h-10 w-10"
                  style={{ backgroundColor: rowType.color }}
                >
                  {rowType.name[0]}
                </td>

                {currentTypes.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-100 text-center h-10 w-10 text-[13px]"
                  >
                    {getEffContent(currentMatrix[rowIndex][colIndex])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
        <span className="flex items-center gap-1.5"><span className="text-red-600 font-extrabold text-base">2</span> 효과 굉장함</span>
        <span className="flex items-center gap-1.5"><span className="text-blue-500 font-extrabold text-base">½</span> 효과 별로</span>
        <span className="flex items-center gap-1.5"><span className="text-gray-300 font-extrabold text-base">0</span> 효과 없음</span>
        <span className="flex items-center gap-1.5"><span className="text-gray-200 font-extrabold text-base">·</span> 보통</span>
      </div>

    </div>
  );
};

export default TypeChartPage;
