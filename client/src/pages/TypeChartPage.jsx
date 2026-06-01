// client/src/pages/TypeChartPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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

  // v3 (18x18) - 현재 (편집 가능)
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

  // v2 (17x17) - 편집 가능한 별도 매트릭스
  // (아래는 v3를 17x17로 잘라낸 값입니다. 직접 편집하세요.)
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

  // v1 (15x15) - 편집 가능한 별도 매트릭스
  // (아래는 v3를 15x15로 잘라낸 값입니다. 직접 편집하세요.)
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
    { id: 'type_table_v3', label: 'XY - Champions (최신)', size: 18, matrix: matrixV3 },
    { id: 'type_table_v2', label: 'GS - BW2', size: 17, matrix: matrixV2 },
    { id: 'type_table_v1', label: 'RGBY', size: 15, matrix: matrixV1 },
  ];

  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

  const currentVersion = versions[selectedVersionIndex];
  const currentSize = currentVersion.size;
  const currentTypes = baseTypes.slice(0, currentSize);
  const currentMatrix = currentVersion.matrix;

  const cellTextClass = 'text-[15px] md:text-[18px] font-extrabold';

  const getEffContent = (val) => {
    if (val === 2) return <span className="text-red-600">2</span>;
    if (val === 0.5) return <span className="text-blue-500">0.5</span>;
    if (val === 0) return <span className="text-gray-400">0</span>;
    return <span className="text-gray-900">1</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-10">
      <div className="max-w-[95rem] mx-auto bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <Link to="/battle" className="text-[#005596] font-bold mb-2 inline-block hover:underline">← 배틀 정보로 돌아가기</Link>
            <h1 className="text-3xl font-black text-gray-900">전체 타입 상성표</h1>
            <p className="text-sm text-gray-400 mt-1">{currentVersion.label}</p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <label className="text-sm text-gray-600 font-medium">버전</label>
            <select
              aria-label="타입 상성표 버전 선택"
              value={selectedVersionIndex}
              onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
              className="px-3 py-2 bg-white border rounded-md shadow-sm text-sm"
            >
              {versions.map((v, idx) => (
                <option key={v.id} value={idx}>
                  {v.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedVersionIndex((i) => Math.max(0, i - 1))}
                className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                aria-label="이전 버전"
              >
                ◀
              </button>
              <button
                onClick={() => setSelectedVersionIndex((i) => Math.min(versions.length - 1, i + 1))}
                className="px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
                aria-label="다음 버전"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <div className="w-full overflow-hidden border border-gray-200 rounded-xl shadow-inner">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="w-12 h-12 border border-gray-200 text-[11px] bg-white font-bold text-gray-400">공/방</th>
                {currentTypes.map(t => (
                  <th key={t.name} className="border border-gray-200 p-0 overflow-hidden">
                    <div className="h-12 flex items-center justify-center text-[12px] font-black text-white" style={{ backgroundColor: t.color }}>
                      {t.name[0]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTypes.map((rowType, rowIndex) => (
                <tr key={rowType.name} className="hover:bg-gray-50 transition-colors">
                  <td className="h-12 border border-gray-200 text-[12px] font-black text-white text-center" style={{ backgroundColor: rowType.color }}>
                    {rowType.name[0]}
                  </td>

                  {currentTypes.map((colType, colIndex) => (
                    <td key={`${colType.name}-${rowIndex}`} className={`h-12 border border-gray-200 text-center ${cellTextClass}`}>
                      {getEffContent(currentMatrix[rowIndex][colIndex])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[12px] text-gray-400 font-medium">
        </p>
      </div>
    </div>
  );
};

export default TypeChartPage;
