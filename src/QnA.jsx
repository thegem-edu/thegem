import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";

export default function QnA({ user }) {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qnaList, setQnaList] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQnA();
  }, [user]);

  const fetchQnA = async () => {
    try {
      const q = query(
        collection(db, "qna"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setQnaList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "qna"), {
        userId: user.uid,
        userEmail: user.email,
        question: question.trim(),
        answer: null,
        createdAt: Timestamp.now(),
      });
      setQuestion("");
      setSubmitted(true);
      setShowForm(false);
      fetchQnA();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">

      {/* 제출 버튼 or 폼 */}
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setSubmitted(false); }}
          className="bg-gem-gold text-gem-navy font-bold py-3 rounded-xl hover:opacity-90 transition"
        >
          + 질문 제출하기
        </button>
      ) : (
        <div className="bg-white/5 border border-gem-gold/30 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-gem-gold font-bold text-sm">질문 작성</p>
          <p className="text-gray-500 text-xs">화요일 자정까지 제출 · 목요일 자정까지 답변</p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="궁금한 점을 자유롭게 작성해 주세요."
            rows={5}
            className="bg-white/10 text-white placeholder-gray-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-gem-gold resize-none text-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-600 text-gray-400 py-2 rounded-xl text-sm"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className="flex-1 bg-gem-gold text-gem-navy font-bold py-2 rounded-xl text-sm hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "제출 중..." : "제출하기"}
            </button>
          </div>
        </div>
      )}

      {/* 제출 완료 메시지 */}
      {submitted && (
        <div className="bg-white/5 border border-gem-gold/20 rounded-xl px-4 py-3 text-center">
          <p className="text-gem-gold text-sm">✦ 질문이 제출됐습니다</p>
          <p className="text-gray-500 text-xs mt-1">목요일 자정까지 답변 드리겠습니다</p>
        </div>
      )}

      {/* Q&A 목록 */}
      {qnaList.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500 uppercase tracking-widest">질문 내역</p>
          {qnaList.map((item) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="border-l-2 border-gem-gold pl-3">
                <p className="text-xs text-gray-500 mb-1">질문</p>
                <p className="text-gray-200 text-sm leading-relaxed">{item.question}</p>
              </div>
              {item.answer ? (
                <div className="border-l-2 border-gem-gold/40 pl-3">
                  <p className="text-xs text-gem-gold mb-1">THE GEM 답변</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.answer}</p>
                </div>
              ) : (
                <div className="border-l-2 border-gray-700 pl-3">
                  <p className="text-xs text-gray-600">답변 대기 중...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}