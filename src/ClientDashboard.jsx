import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

const GEM_TYPES = {
  diamond: { name: "다이아몬드", sub: "활발한 백수정", emoji: "💎" },
  ruby: { name: "루비", sub: "단단한 가넷", emoji: "🔴" },
  alexandrite: { name: "알렉산드라이트", sub: "섬세한 자수정", emoji: "💜" },
  paraiba: { name: "파라이바", sub: "신비한 오팔", emoji: "🩵" },
  emerald: { name: "에메랄드", sub: "우직한 비취", emoji: "💚" },
};

export default function ClientDashboard({ user }) {
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "clients", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setClientData(snap.data());
        } else {
          setClientData({
            childName: "아이",
            gemType: "diamond",
            currentWeek: 1,
            totalWeeks: 24,
            gems: [],
            mission: {
              child: "아직 미션이 등록되지 않았습니다.",
              parent: "아직 미션이 등록되지 않았습니다.",
            },
          });
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gem-navy flex items-center justify-center">
        <div className="text-gem-gold text-lg">로딩 중...</div>
      </div>
    );
  }

  const gem = GEM_TYPES[clientData.gemType] || GEM_TYPES.diamond;
  const progress = Math.round((clientData.currentWeek / clientData.totalWeeks) * 100);
  const collectedGems = clientData.gems?.length || 0;

  return (
    <div className="min-h-screen bg-gem-navy text-white pb-16">
      <div className="flex items-center justify-between px-6 pt-10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gem-gold tracking-widest">THE GEM</h1>
          <p className="text-gray-400 text-xs mt-1">세공 공방</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-500 text-xs border border-gray-700 rounded-lg px-3 py-1.5 hover:border-gray-500"
        >
          로그아웃
        </button>
      </div>

      <div className="px-6 flex flex-col gap-5 max-w-lg mx-auto">

        <div className="bg-white/5 border border-gem-gold/30 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{gem.emoji}</div>
            <div>
              <p className="text-gem-gold font-bold text-lg">{gem.name}</p>
              <p className="text-gray-400 text-sm">{gem.sub}</p>
              <p className="text-gray-300 text-sm mt-1">
                <span className="text-white font-semibold">{clientData.childName}</span> 어린이
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-300 font-semibold">세공 진행률</p>
            <p className="text-gem-gold text-sm font-bold">
              {clientData.currentWeek}주차 / {clientData.totalWeeks}주
            </p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gem-gold h-3 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-gray-500 mt-2">{progress}% 완료</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-300 font-semibold">젬스톤 수집</p>
            <p className="text-gem-gold text-sm">{collectedGems} / 24</p>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
                  ${i < collectedGems
                    ? "bg-gem-gold text-gem-navy font-bold"
                    : "bg-white/10 text-gray-600"
                  }`}
              >
                {i < collectedGems ? "✦" : "○"}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-gem-gold/20 rounded-2xl p-5">
          <p className="text-gem-gold font-bold text-sm mb-4">
            ✦ {clientData.currentWeek}주차 미션
          </p>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">아이 미션</p>
            <div className="border-l-2 border-gem-gold pl-4">
              <p className="text-gray-200 text-sm leading-relaxed">
                {clientData.mission?.child}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">부모 미션</p>
            <div className="border-l-2 border-gem-gold/50 pl-4">
              <p className="text-gray-200 text-sm leading-relaxed">
                {clientData.mission?.parent}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-200">주간 Q&A</p>
            <p className="text-xs text-gray-500 mt-1">화요일 자정까지 제출</p>
          </div>
          <button className="bg-gem-gold text-gem-navy text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90">
            제출하기
          </button>
        </div>

      </div>
    </div>
  );
}