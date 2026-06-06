// client/src/pages/PokedexLayout.jsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Sparkles, List } from 'lucide-react';

const navItems = [
  { to: '/pokedex',           label: '도감 목록',   icon: <List size={16} />,     end: true },
  { to: '/pokedex/abilities', label: '특성 도감',   icon: <Sparkles size={16} /> },
];

const PokedexLayout = () => {
  return (
    <div className="flex flex-1 w-full">

      {/* 사이드바 */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col pt-8 gap-1 px-3 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
        {/* 섹션 타이틀 */}
        <div className="flex items-center gap-2 px-3 pb-3 mb-2 border-b border-gray-100">
          <div className="w-7 h-7 bg-[#005596] rounded-lg flex items-center justify-center">
            <BookOpen size={14} color="white" />
          </div>
          <span className="font-black text-sm text-gray-800">포켓몬 도감</span>
        </div>

        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all
              ${isActive
                ? 'bg-[#005596]/10 text-[#005596]'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
};

export default PokedexLayout;
