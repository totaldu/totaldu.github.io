import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Search, Menu, User, LogIn, ChevronRight, Info, BookOpen, Globe, FileText, Sparkles, Zap, Timer } from 'lucide-react';
import TypeChartPage from './pages/TypeChartPage';
import BattleLayout from './pages/BattleLayout';
import PokedexPage from './pages/PokedexPage';

// --- 1. 상세 페이지 컴포넌트들 ---

const PartyPage = () => (
  <div className="min-h-screen bg-white p-10 md:p-20">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-[#005596] font-bold mb-4 inline-block hover:underline">← 메인으로 돌아가기</Link>
      <h1 className="text-4xl font-black text-gray-900 mb-8 border-b-4 border-yellow-500 pb-4">추천 파티</h1>
      <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100 text-yellow-800 shadow-sm">
        현재 시즌 1위 파티 구성을 확인하세요.
      </div>
    </div>
  </div>
);

const BattlePage = () => (
  <div className="w-full h-full">
    <h1 className="text-2xl font-black text-gray-900 mb-2">배틀 정보</h1>
    <p className="text-gray-400 text-sm mb-8 font-medium">원하는 항목을 선택하세요.</p>

    {/* ✅ 2열 그리드로 카드를 화면 너비에 맞게 꽉 채움 */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

      <Link
        to="/battle/type-chart"
        className="group flex flex-col justify-between p-8 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 transition-all hover:shadow-md"
      >
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
          <Zap size={24} color="white" />
        </div>
        <div>
          <span className="font-black text-blue-900 text-xl block mb-2">타입 상성표</span>
          <span className="text-blue-600 text-sm font-medium">공격/방어 타입 상성을 한눈에 확인</span>
        </div>
        <ChevronRight className="mt-6 group-hover:translate-x-1 transition-transform text-blue-400" />
      </Link>

      <Link
        to="/battle/speed-rank"
        className="group flex flex-col justify-between p-8 bg-teal-50 hover:bg-teal-100 rounded-2xl border border-teal-100 transition-all hover:shadow-md"
      >
        <div className="w-12 h-12 bg-[#0a8d87] rounded-xl flex items-center justify-center mb-6">
          <Timer size={24} color="white" />
        </div>
        <div>
          <span className="font-black text-teal-900 text-xl block mb-2">스피드 종족값 순위</span>
          <span className="text-teal-600 text-sm font-medium">전 포켓몬 스피드 스탯 랭킹 조회</span>
        </div>
        <ChevronRight className="mt-6 group-hover:translate-x-1 transition-transform text-teal-400" />
      </Link>

    </div>
  </div>
);


// --- 신규 추가: 스피드 순위 상세 페이지 ---
const SpeedRankPage = () => (
  <div className="min-h-screen bg-white p-10 md:p-20">
    <div className="max-w-4xl mx-auto">
      <Link to="/battle" className="text-[#005596] font-bold mb-4 inline-block hover:underline">← 배틀 정보로 돌아가기</Link>
      <h1 className="text-4xl font-black text-gray-900 mb-8 border-b-4 border-[#0a8d87] pb-4">스피드 종족값 순위</h1>
      <div className="space-y-3">
        {[
          { rank: 1, name: "레지에레키", speed: 200 },
          { rank: 2, name: "테오키스(스피드)", speed: 180 },
          { rank: 3, name: "아이스크", speed: 160 },
        ].map(p => (
          <div key={p.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
            <span className="font-bold text-[#005596] w-12 text-xl">{p.rank}위</span>
            <span className="flex-1 font-bold text-gray-800">{p.name}</span>
            <span className="bg-[#0a8d87] text-white px-4 py-1 rounded-full font-mono">{p.speed}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CommunityPage = () => (
  <div className="min-h-screen bg-white p-10 md:p-20">
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-[#005596] font-bold mb-4 inline-block hover:underline">← 메인으로 돌아가기</Link>
      <h1 className="text-4xl font-black text-gray-900 mb-8 border-b-4 border-green-500 pb-4">커뮤니티</h1>
      <div className="text-gray-600 font-medium">자유로운 토론 게시판입니다.</div>
    </div>
  </div>
);

// --- 2. 메인 홈 화면 ---
const MainHome = ({ articles, searchQuery, setSearchQuery }) => (
  <>
    <section className="relative w-full bg-gradient-to-br from-[#0a8d87] via-[#15b291] to-[#005596] min-h-[calc(100vh-80px)] px-4 overflow-hidden flex items-center">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center w-full">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">무엇을 도와드릴까요?</h2>
        <p className="text-white/80 text-lg mb-12 font-medium">데이터 기반의 프라이빗 위키 시스템</p>

        <div className="relative group max-w-3xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-white rounded-[1.8rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="pl-8 text-gray-400"><Search size={24} strokeWidth={3} /></div>
            <input 
              type="text" 
              className="w-full py-6 px-6 text-xl text-gray-800 placeholder-gray-400 outline-none font-medium" 
              placeholder="포켓몬, 파티, 배틀 전략 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="mr-3 bg-[#005596] hover:bg-[#003d6d] text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-lg flex items-center gap-2">
              검색 <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['#실전_샘플', '#타입_상성', '#시즌24_랭킹', '#초보자_가이드'].map(tag => (
              <span key={tag} className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-semibold cursor-pointer hover:bg-white/20 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>

    <main className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0a8d87] rounded-xl flex items-center justify-center">
             <FileText color="white" size={20} />
          </div>
          최근 등록된 정보
        </h3>
        <button className="text-[#005596] font-bold flex items-center gap-1 hover:underline">
          전체보기 <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.length > 0 ? (
          articles.map(art => (
            <div key={art.id} className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
              <div className="mb-4 text-[#0a8d87] group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <h4 className="font-black text-xl text-gray-900 mb-3 group-hover:text-[#005596] transition-colors">{art.title}</h4>
              <p className="text-gray-500 leading-relaxed line-clamp-2">{art.content}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-400 font-medium border-2 border-dashed rounded-3xl">
            데이터를 불러오는 중이거나 등록된 정보가 없습니다.
          </div>
        )}
      </div>
    </main>
  </>
);

// --- 3. App 전체 로직 및 라우팅 설정 ---
const App = () => {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/articles')
      .then(res => res.json())
      .then(data => setArticles(data))
      .catch(err => console.error("API 연결 실패:", err));
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
            <Link to="/" className="text-2xl font-black text-[#005596] flex items-center gap-2">
              <span className="bg-[#005596] text-white px-3 py-1 rounded-xl text-sm tracking-widest uppercase">Private</span>
              <span>WIKI</span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-10 font-bold text-gray-600">
              <Link to="/pokedex" className="hover:text-[#005596] transition-colors">포켓몬 도감</Link>
              <Link to="/party" className="hover:text-[#005596] transition-colors">추천 파티</Link>
              <Link to="/battle" className="hover:text-[#005596] transition-colors">배틀 정보</Link>
              <Link to="/community" className="hover:text-[#005596] transition-colors">커뮤니티</Link>
            </nav>

            <div className="flex items-center gap-3">
               <button className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-200 hover:bg-gray-100 transition-all">
                 <LogIn size={16} /> 로그인
               </button>
               <button className="lg:hidden p-2 text-gray-600"><Menu size={28} /></button>
            </div>
          </div>
        </header>

        {/* 경로에 따른 페이지 렌더링 설정 */}
        <Routes>
          <Route path="/" element={<MainHome articles={articles} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
          <Route path="/pokedex" element={<PokedexPage />} />
          <Route path="/party" element={<PartyPage />} />

          {/* BattleLayout을 부모로 하고 하위 라우트를 중첩합니다 */}
          <Route path="/battle" element={<BattleLayout />}>
            <Route index element={<BattlePage />} />
            <Route path="type-chart" element={<TypeChartPage />} />
            <Route path="speed-rank" element={<SpeedRankPage />} />
          </Route>

          <Route path="/community" element={<CommunityPage />} />
        </Routes>

        <footer className="mt-auto py-12 bg-white text-center border-t border-gray-100">
          <p className="text-gray-400 text-sm font-medium">© 2024 TotalDU Private Wiki System. All Rights Reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
