import React from 'react';
import { Link } from 'react-router-dom';

const PokedexPage = () => (
  <div className="min-h-screen bg-white p-10 md:p-20">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-[#005596] font-bold mb-4 inline-block hover:underline">← 메인으로 돌아가기</Link>
      <h1 className="text-4xl font-black text-gray-900 mb-8 border-b-4 border-red-500 pb-4">포켓몬 도감</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {['#001 이상해꽃', '#004 리자몽', '#007 거북왕'].map(item => (
          <div key={item} className="p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">{item}</div>
        ))}
      </div>
    </div>
  </div>
);

export default PokedexPage;
