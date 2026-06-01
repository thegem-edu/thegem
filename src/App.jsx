import { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import ClientDashboard from "./ClientDashboard";

const ADMIN_EMAIL = "corev125@gmail.com";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gem-navy flex items-center justify-center">
        <div className="text-gem-gold text-lg">로딩 중...</div>
      </div>
    );
  }

  if (user && user.email === ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-gem-navy text-white flex flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-3xl font-bold text-gem-gold tracking-widest">THE GEM</h1>
        <p className="text-gray-300 text-sm">관리자 대시보드</p>
        <div className="bg-white/5 border border-gem-gold/30 rounded-2xl p-6 w-full max-w-sm text-center">
          <p className="text-gem-gold font-semibold mb-1">대표님 관리 화면</p>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <p className="text-gray-500 text-xs mt-3">관리자 기능은 다음 단계에서 제작됩니다</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-gray-500 text-sm underline hover:text-gray-300"
        >
          로그아웃
        </button>
      </div>
    );
  }

  if (user) {
    return <ClientDashboard user={user} />;
  }

  return (
    <div className="min-h-screen bg-gem-navy flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-widest text-gem-gold">THE GEM</h1>
          <p className="text-gray-400 text-sm mt-2 tracking-widest">세공 공방</p>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gem-gold"
          />
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gem-gold"
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            >
              {showPw ? "숨기기" : "보기"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-gem-gold text-gem-navy font-bold py-3 rounded-xl hover:opacity-90 transition"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}