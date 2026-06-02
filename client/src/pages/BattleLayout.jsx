// src/pages/BattleLayout.jsx
import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Zap, Timer, ChevronRight } from 'lucide-react';

export default function BattleLayoutIntegratedSidebar() {
  const items = [
    { to: '', label: '개요', icon: Zap },
    { to: 'type-chart', label: '타입 상성표', icon: Zap },
    { to: 'speed-rank', label: '스피드 순위', icon: Timer },
  ];

  return (
    // ✅ w-full로 전체 너비 확보
    <div className="min-h-screen w-full bg-[#F9FAFB] flex">

      {/* ✅ 사이드바: 음수 마진 제거, 자연스러운 flex item으로 */}
      <aside
        aria-label="Battle sidebar"
        className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-gray-100 shadow-sm p-4 sticky top-0 h-screen overflow-auto"
      >
        <Link
          to="/battle"
          className="text-lg font-black text-[#005596] flex items-center gap-2 mb-4"
        >
          <span>⚔️ Battle</span>
        </Link>

        <nav className="mt-4 flex flex-col gap-2">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to || '.'}
                end={item.to === ''}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                   ${isActive
                     ? 'bg-[#E6F6F5] text-[#005596]'
                     : 'text-gray-700 hover:bg-gray-50'
                   }`
                }
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                <ChevronRight size={16} className="opacity-40" />
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* ✅ 메인 컨텐츠: flex-1로 나머지 공간 전부 차지 */}
      <main className="flex-1 p-8 overflow-auto">

        {/* 모바일용 상단 탭 내비 */}
        <div className="lg:hidden mb-4">
          <nav className="flex gap-2 overflow-x-auto">
            {items.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to || '.'}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border text-sm font-semibold whitespace-nowrap"
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
