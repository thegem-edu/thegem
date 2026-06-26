import { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";

const ADMIN_EMAIL = "corev125@gmail.com";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [screen, setScreen] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

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

  const handleReset = async () => {
    setResetError("");
    if (!resetEmail.trim()) {
      setResetError("이메일을 입력해 주세요.");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (e) {
      setResetError("등록되지 않은 이메일이거나 오류가 발생했습니다.");
    }
    setResetLoading(false);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gem-navy flex items-center justify-center">
        <div className="text-gem-gold text-lg tracking-widest">로딩 중...</div>
      </div>
    );
  }

  if (user && user.email === ADMIN_EMAIL) {
    return <AdminDashboard user={user} />;
  }

  if (user) {
    return <ClientDashboard user={user} />;
  }

  if (screen === "reset") {
    return (
      <div className="min-h-screen bg-gem-navy flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-widest text-gem-gold">THE GEM</h1>
            <p className="text-gray-400 text-sm mt-2 tracking-widest">비밀번호 재설정</p>
          </div>
          {resetSent ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="bg-white/5 rounded-2xl px-5 py-6 border border-gem-gold/20">
                <p className="text-gem-gold text-sm leading-relaxed">
                  비밀번호 재설정 이메일을 보냈습니다.<br />
                  받은 편지함을 확인해 주세요.
                </p>
              </div>
              <button
                onClick={() => {
                  setScreen("login");
                  setResetSent(false);
                  setResetEmail("");
                }}
                className="text-gem-gold text-sm tracking-wider underline underline-offset-4"
              >
                로그인으로 돌아가기
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                가입한 이메일을 입력하시면<br />
                비밀번호 재설정 링크를 보내드립니다.
              </p>
              <input
                type="email"
                placeholder="이메일"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className="bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gem-gold"
              />
              {resetError && (
                <p className="text-red-400 text-sm text-center">{resetError}</p>
              )}
              <button
                onClick={handleReset}
                disabled={resetLoading}
                className="bg-gem-gold text-gem-navy font-bold py-3 rounded-xl hover:opacity-90 transition"
              >
                {resetLoading ? "전송 중..." : "재설정 이메일 보내기"}
              </button>
              <button
                onClick={() => {
                  setScreen("login");
                  setResetError("");
                  setResetEmail("");
                }}
                className="text-gray-500 text-sm text-center tracking-wider"
              >
                로그인으로 돌아가기
              </button>
            </div>
          )}
        </div>
      </div>
    );
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
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-gem-gold text-gem-navy font-bold py-3 rounded-xl hover:opacity-90 transition"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
          <button
            onClick={() => {
              setScreen("reset");
              setError("");
            }}
            className="text-gray-500 text-sm text-center tracking-wider hover:text-gray-300 transition"
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>
      </div>
    </div>
  );
}