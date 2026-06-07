// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Search, Menu, User, LogIn, ChevronRight, Info, BookOpen, Globe, FileText, Sparkles, Zap, Timer } from 'lucide-react';
import TypeChartPage from './pages/TypeChartPage';
import BattleLayout from './pages/BattleLayout';
import PokedexLayout from './pages/PokedexLayout';
import PokedexPage from './pages/PokedexPage';
import PokemonDetailPage from './pages/PokemonDetailPage';
import AbilityListPage from './pages/AbilityListPage';
import AbilityDetailPage from './pages/AbilityDetailPage';

const API_BASE = import.meta.env.DEV
  ? "http://localhost:4000"
  : "https://down-up17-github-io.vercel.app";

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
        to="/battle/attack-order"
        className="group flex flex-col justify-between p-8 bg-teal-50 hover:bg-teal-100 rounded-2xl border border-teal-100 transition-all hover:shadow-md"
      >
        <div className="w-12 h-12 bg-[#0a8d87] rounded-xl flex items-center justify-center mb-6">
          <Timer size={24} color="white" />
        </div>
        <div>
          <span className="font-black text-teal-900 text-xl block mb-2">포켓몬 공격 순서</span>
          <span className="text-teal-600 text-sm font-medium">우선도·스피드·트릭룸 등 행동 순서 규칙</span>
        </div>
        <ChevronRight className="mt-6 group-hover:translate-x-1 transition-transform text-teal-400" />
      </Link>
    </div>
  </div>
);

const PRIORITY_TIERS = [
  {
    value: '+4',
    color: '#7C3AED',
    bg: '#EDE9FE',
    moves: ['도움'],
    note: '더블배틀 전용. 아군의 다음 기술 위력을 1.5배로 높인다.',
  },
  {
    value: '+3',
    color: '#2563EB',
    bg: '#DBEAFE',
    moves: ['매직코트', '스내치'],
    note: '상대의 변화 기술을 반사하거나 빼앗는다.',
  },
  {
    value: '+2',
    color: '#0891B2',
    bg: '#CFFAFE',
    moves: ['극속', '방어', '탐지', '버티기', '방어막류'],
    note: '극속은 공격 기술 중 최상위 우선도. 방어 계열은 모두 +2.',
  },
  {
    value: '+1',
    color: '#059669',
    bg: '#D1FAE5',
    moves: ['선제공격', '탄환펀치', '그림자침', '아쿠아젯', '얼음뭉치', '불릿펀치', '진공파', '물수리검', '퍼스트임프레션', '액셀록'],
    note: '가장 흔한 선제 기술 군. 스피드가 낮아도 일반 기술보다 먼저 발동.',
  },
  {
    value: '0',
    color: '#6B7280',
    bg: '#F3F4F6',
    moves: ['대부분의 기술'],
    note: '기본값. 스피드로 순서가 결정된다.',
  },
  {
    value: '-1',
    color: '#D97706',
    bg: '#FEF3C7',
    moves: ['역습'],
    note: '상대보다 늦게 발동하여 빈틈을 노린다.',
  },
  {
    value: '-2',
    color: '#EA580C',
    bg: '#FFEDD5',
    moves: ['집중펀치', '부리캐논', '껍질박기'],
    note: '준비 후 발동. 집중펀치는 피격 시 실패.',
  },
  {
    value: '-3',
    color: '#DC2626',
    bg: '#FEE2E2',
    moves: ['카운터', '미러코트'],
    note: '상대 공격을 받은 뒤 반격. 항상 상대보다 늦게 발동.',
  },
  {
    value: '-6',
    color: '#9F1239',
    bg: '#FFE4E6',
    moves: ['트릭룸', '선풍', '드래곤테일', '원시의힘', '텔레포트'],
    note: '필드 전체에 영향을 주는 기술. 트릭룸은 속도 역전 효과.',
  },
];

const SPEED_MODIFIERS = [
  { category: '상태이상', name: '마비', effect: '스피드 ×0.5', color: '#F59E0B', detail: '6~8세대 이전은 ×0.25 (25% 감소)' },
  { category: '날씨/필드', name: '순풍 (Tailwind)', effect: '스피드 ×2', color: '#3B82F6', detail: '4턴간 자신과 아군 전원에게 적용' },
  { category: '특성', name: '쾌속수영', effect: '비·강우에서 ×2', color: '#0EA5E9', detail: '전기도마뱀·체크', },
  { category: '특성', name: '엽록소', effect: '쨍쨍에서 ×2', color: '#16A34A', detail: '햇빛 날씨 한정' },
  { category: '특성', name: '모래헤치기', effect: '모래바람에서 ×2', color: '#D97706', detail: '쏘콘 계열·고로우크 등' },
  { category: '특성', name: '전기엔진', effect: '전기 기술 피격 시 ×2', color: '#EAB308', detail: '면역이면서 스피드 상승' },
  { category: '특성', name: '스쿠릇트', effect: '전기장에서 ×2', color: '#A855F7', detail: '서지서퍼 포함. 전기장 전용' },
  { category: '특성', name: '갑각의각오', effect: '배틀 중 스피드 1랭크↑', color: '#64748B', detail: '능력치 하강 시 발동' },
  { category: '도구', name: '구애스카프', effect: '스피드 ×1.5', color: '#EF4444', detail: '기술이 1가지로 고정되는 단점' },
  { category: '도구', name: '파워계열 아이템', effect: '스피드 -절반 (EV훈련용)', color: '#6B7280', detail: '배틀 중에도 적용되므로 주의' },
];

const AttackOrderPage = () => (
  <div className="w-full max-w-3xl flex flex-col gap-10">

    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">포켓몬 공격 순서</h1>
      <p className="text-gray-400 text-sm font-medium">배틀에서 누가 먼저 행동하는지 결정하는 규칙</p>
    </div>

    {/* 결정 흐름 */}
    <section className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
      <h2 className="text-base font-black text-blue-900 mb-4">공격 순서 결정 흐름</h2>
      <div className="flex flex-col gap-3">
        {[
          { step: '1', title: '우선도 비교', desc: '우선도(Priority) 수치가 높은 기술이 먼저 발동됩니다. 우선도가 다르면 스피드는 무관합니다.' },
          { step: '2', title: '스피드 비교', desc: '우선도가 같을 때, 스피드 실수치가 높은 포켓몬이 먼저 행동합니다.' },
          { step: '3', title: '동속도 처리', desc: '스피드 실수치가 완전히 같으면 50% 확률로 무작위 결정됩니다 (스피드 동점).' },
        ].map(item => (
          <div key={item.step} className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{item.step}</span>
            <div>
              <span className="font-bold text-blue-900 text-sm">{item.title}</span>
              <p className="text-blue-700 text-sm mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* 우선도 표 */}
    <section>
      <h2 className="text-lg font-black text-gray-900 mb-1">우선도 (Priority)</h2>
      <p className="text-sm text-gray-400 mb-4">수치가 높을수록 스피드와 무관하게 먼저 발동합니다. 같은 우선도끼리는 스피드로 결정.</p>
      <div className="flex flex-col gap-2">
        {PRIORITY_TIERS.map(tier => (
          <div key={tier.value}
            className="flex items-start gap-3 p-3 rounded-xl border"
            style={{ backgroundColor: tier.bg, borderColor: tier.color + '33' }}
          >
            <span
              className="text-sm font-black shrink-0 w-8 text-center"
              style={{ color: tier.color }}
            >{tier.value}</span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1 mb-1">
                {tier.moves.map(m => (
                  <span key={m}
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: tier.color }}
                  >{m}</span>
                ))}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{tier.note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* 스피드 계산 */}
    <section>
      <h2 className="text-lg font-black text-gray-900 mb-1">스피드 실수치 계산</h2>
      <p className="text-sm text-gray-400 mb-4">배틀에서 비교되는 값은 종족값이 아닌 <strong className="text-gray-600">실수치</strong>입니다.</p>
      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 font-mono text-sm text-center mb-4">
        <span className="text-gray-500">실수치 = </span>
        <span className="text-[#005596] font-black">⌊(종족값×2 + 개체값 + ⌊노력치÷4⌋) × 레벨÷100 + 5⌋</span>
        <span className="text-gray-500"> × 성격보정</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {[
          { label: '느긋·얌전 등', effect: '×0.9', color:'#EF4444' },
          { label: '성격 보정 없음', effect: '×1.0', color:'#6B7280' },
          { label: '쾌활·명랑 등', effect: '×1.1', color:'#16A34A' },
        ].map(n => (
          <div key={n.label} className="p-3 rounded-xl bg-white border text-center">
            <p className="text-xs text-gray-400 mb-1">{n.label}</p>
            <p className="font-black text-lg" style={{ color: n.color }}>{n.effect}</p>
          </div>
        ))}
      </div>
    </section>

    {/* 스피드 수정 요인 */}
    <section>
      <h2 className="text-lg font-black text-gray-900 mb-1">스피드 수정 요인</h2>
      <p className="text-sm text-gray-400 mb-4">실수치에 추가로 곱해지는 배율 요인들입니다. 중복 적용 가능.</p>
      {['상태이상', '날씨/필드', '특성', '도구'].map(cat => {
        const items = SPEED_MODIFIERS.filter(m => m.category === cat);
        return (
          <div key={cat} className="mb-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
            <div className="flex flex-col gap-2">
              {items.map(item => (
                <div key={item.name} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                  <span className="text-xs font-black px-2 py-1 rounded-lg text-white shrink-0"
                    style={{ backgroundColor: item.color }}>
                    {item.effect}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    {item.detail && <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>

    {/* 트릭룸 */}
    <section className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔮</span>
        <h2 className="text-base font-black text-purple-900">트릭룸 (Trick Room)</h2>
      </div>
      <div className="flex flex-col gap-2 text-sm text-purple-800">
        <p>스피드 순서를 <strong>역전</strong>시키는 필드 기술입니다. 5턴간 지속되며, 우선도 <strong>–6</strong>으로 발동합니다.</p>
        <ul className="list-disc list-inside space-y-1 text-purple-700">
          <li>트릭룸 중에는 <strong>스피드가 낮은 포켓몬이 먼저</strong> 행동합니다.</li>
          <li>우선도 자체는 여전히 적용됩니다. (+1 선제기는 트릭룸 안에서도 먼저 발동)</li>
          <li>트릭룸 상태에서 다시 트릭룸을 사용하면 즉시 해제됩니다.</li>
          <li>구애스카프·순풍 등 스피드 상승 요인이 오히려 불리해질 수 있습니다.</li>
        </ul>
      </div>
    </section>

    {/* 스피드 동점 */}
    <section className="p-5 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🎲</span>
        <h2 className="text-base font-black text-gray-800">스피드 동점 (Speed Tie)</h2>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        두 포켓몬의 스피드 실수치가 완전히 동일하면 <strong>50% 확률</strong>로 행동 순서가 무작위 결정됩니다.
        같은 종·같은 레벨·같은 스피드 조정 환경에서 발생하며, 더블배틀에서는 각 포켓몬 간 독립적으로 판정합니다.
      </p>
    </section>

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

const App = () => {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/articles`)
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
              <span className="bg-[#005596] text-white px-3 py-1 rounded-xl text-sm tracking-widest uppercase">Total</span>
              <span>DU</span>
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

        <Routes>
          <Route path="/" element={<MainHome articles={articles} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />

          {/* ✅ PokedexLayout 중첩 라우트 */}
          <Route path="/pokedex" element={<PokedexLayout />}>
            <Route index element={<PokedexPage />} />
            <Route path="abilities" element={<AbilityListPage />} />
            <Route path="ability/:name" element={<AbilityDetailPage />} />
            <Route path=":id" element={<PokemonDetailPage />} />
          </Route>

          <Route path="/party" element={<PartyPage />} />

          <Route path="/battle" element={<BattleLayout />}>
            <Route index element={<BattlePage />} />
            <Route path="type-chart" element={<TypeChartPage />} />
            <Route path="attack-order" element={<AttackOrderPage />} />
          </Route>

          <Route path="/community" element={<CommunityPage />} />
        </Routes>

        <footer className="mt-auto py-12 bg-white text-center border-t border-gray-100">
          <p className="text-gray-400 text-sm font-medium">2026 TotalDU</p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
