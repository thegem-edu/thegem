import { useState, useEffect } from "react";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, orderBy, onSnapshot, serverTimestamp
} from "firebase/firestore";

const GEM_COLORS = { diamond:[147,197,253], ruby:[248,113,113], alexandrite:[192,132,252], paraiba:[94,234,212], emerald:[52,211,153] };
const GEM_LABELS = { diamond:"다이아몬드", ruby:"루비", alexandrite:"알렉산드라이트", paraiba:"파라이바", emerald:"에메랄드" };
const GEM_SUBTITLES = { diamond:"활발한 백수정", ruby:"단단한 가넷", alexandrite:"섬세한 자수정", paraiba:"신비한 오팔", emerald:"우직한 비취" };

function rc(c,a){return `rgba(${c[0]},${c[1]},${c[2]},${a??1})`;}

function SectionLabel({children}){
  return <p className="text-xs tracking-[0.2em] uppercase text-gem-gold font-medium mb-3">{children}</p>;
}
function GoldBox({children,className=""}){
  return <div className={`rounded-2xl border border-gem-gold/30 p-5 ${className}`}>{children}</div>;
}
function Badge({gemType}){
  const b=GEM_COLORS[gemType]||GEM_COLORS.diamond;
  return(
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{background:`rgba(${b},0.15)`,color:`rgb(${b})`}}>
      {GEM_LABELS[gemType]}
    </span>
  );
}

// ── 새 클라이언트 추가 모달 ──────────────────────────────────
function AddClientModal({onClose, onSuccess}){
  const[childName,setChildName]=useState("");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[gemType,setGemType]=useState("diamond");
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");

  const handleAdd=async()=>{
    if(!childName.trim()||!email.trim()||!password.trim()){
      setError("모든 항목을 입력해주세요."); return;
    }
    if(password.length<6){setError("비밀번호는 6자 이상이어야 합니다."); return;}
    setLoading(true); setError("");
    try{
      // Firebase Auth 계정 생성
      const cred=await createUserWithEmailAndPassword(auth,email.trim(),password);
      const uid=cred.user.uid;
      // Firestore 문서 생성
      await setDoc(doc(db,"clients",uid),{
        childName:childName.trim(),
        email:email.trim(),
        gemType,
        currentWeek:1,
        completedWeeks:0,
        createdAt:serverTimestamp(),
      });
      onSuccess();
      onClose();
    }catch(e){
      if(e.code==="auth/email-already-in-use") setError("이미 사용 중인 이메일입니다.");
      else if(e.code==="auth/invalid-email") setError("올바른 이메일 형식이 아닙니다.");
      else setError("오류가 발생했습니다: "+e.message);
    }
    finally{setLoading(false);}
  };

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{background:"rgba(0,0,0,0.7)"}}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{background:"#0d1426",border:"1px solid rgba(201,168,76,0.3)"}}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">새 클라이언트 추가</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">✕</button>
        </div>

        {/* 아이 이름 */}
        <div>
          <SectionLabel>아이 이름</SectionLabel>
          <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gem-gold/50"
            placeholder="예: 김지수" value={childName} onChange={e=>setChildName(e.target.value)}/>
        </div>

        {/* 기질 선택 */}
        <div>
          <SectionLabel>기질 보석</SectionLabel>
          <div className="grid grid-cols-5 gap-2">
            {Object.keys(GEM_LABELS).map(g=>{
              const b=GEM_COLORS[g];
              return(
                <button key={g} onClick={()=>setGemType(g)}
                  className="py-2 rounded-xl text-xs font-medium transition-all"
                  style={gemType===g
                    ?{background:`rgba(${b},0.25)`,color:`rgb(${b})`,border:`1px solid rgba(${b},0.6)`}
                    :{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.4)",border:"1px solid rgba(255,255,255,0.08)"}}>
                  {GEM_LABELS[g].replace("알렉산드라이트","알렉")}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-white/30 mt-2">{GEM_LABELS[gemType]} · {GEM_SUBTITLES[gemType]}</p>
        </div>

        {/* 이메일 */}
        <div>
          <SectionLabel>로그인 이메일</SectionLabel>
          <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gem-gold/50"
            placeholder="예: jisu@example.com" type="email"
            value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>

        {/* 비밀번호 */}
        <div>
          <SectionLabel>임시 비밀번호</SectionLabel>
          <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gem-gold/50"
            placeholder="6자 이상" type="password"
            value={password} onChange={e=>setPassword(e.target.value)}/>
        </div>

        {error&&<p className="text-xs text-red-400/80">{error}</p>}

        <button onClick={handleAdd} disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-medium tracking-wider transition-all"
          style={{background:loading?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#C9A84C,#a07c30)",
            color:loading?"rgba(255,255,255,0.3)":"#0A0F1E"}}>
          {loading?"생성 중...":"클라이언트 추가"}
        </button>
      </div>
    </div>
  );
}

// ── 주차 변경 모달 ────────────────────────────────────────────
function WeekModal({client, onClose, onSuccess}){
  const[week,setWeek]=useState(client.currentWeek||1);
  const[completed,setCompleted]=useState(client.completedWeeks||0);
  const[loading,setLoading]=useState(false);

  const handleSave=async()=>{
    setLoading(true);
    try{
      await updateDoc(doc(db,"clients",client.uid),{
        currentWeek:Number(week),
        completedWeeks:Number(completed),
      });
      onSuccess(); onClose();
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{background:"rgba(0,0,0,0.7)"}}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{background:"#0d1426",border:"1px solid rgba(201,168,76,0.3)"}}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{client.childName} · 주차 변경</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">✕</button>
        </div>

        <div>
          <SectionLabel>현재 진행 주차</SectionLabel>
          <div className="flex items-center gap-3">
            <button onClick={()=>setWeek(Math.max(1,week-1))}
              className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20">−</button>
            <span className="text-2xl font-bold text-white w-16 text-center">{week}주</span>
            <button onClick={()=>setWeek(Math.min(24,week+1))}
              className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20">+</button>
          </div>
        </div>

        <div>
          <SectionLabel>완료된 주차 수</SectionLabel>
          <div className="flex items-center gap-3">
            <button onClick={()=>setCompleted(Math.max(0,completed-1))}
              className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20">−</button>
            <span className="text-2xl font-bold text-white w-16 text-center">{completed}주</span>
            <button onClick={()=>setCompleted(Math.min(24,completed+1))}
              className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20">+</button>
          </div>
        </div>

        <button onClick={handleSave} disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-medium tracking-wider"
          style={{background:"linear-gradient(135deg,#C9A84C,#a07c30)",color:"#0A0F1E"}}>
          {loading?"저장 중...":"저장"}
        </button>
      </div>
    </div>
  );
}

// ── Q&A 답변 모달 ─────────────────────────────────────────────
function QnAModal({client, onClose}){
  const[qnaList,setQnaList]=useState([]);
  const[loading,setLoading]=useState(true);
  const[answers,setAnswers]=useState({});
  const[saving,setSaving]=useState({});

  useEffect(()=>{
    const q=query(collection(db,"clients",client.uid,"qna"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{
      setQnaList(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return()=>unsub();
  },[client.uid]);

  const handleAnswer=async(qid)=>{
    if(!answers[qid]?.trim())return;
    setSaving(s=>({...s,[qid]:true}));
    try{
      await updateDoc(doc(db,"clients",client.uid,"qna",qid),{
        answer:answers[qid].trim(),
        answeredAt:serverTimestamp(),
      });
      setAnswers(a=>({...a,[qid]:""}));
    }catch(e){console.error(e);}
    finally{setSaving(s=>({...s,[qid]:false}));}
  };

  const formatDate=(ts)=>{
    if(!ts)return"";
    const d=ts.toDate?ts.toDate():new Date(ts);
    return`${d.getMonth()+1}/${d.getDate()}`;
  };

  const pending=qnaList.filter(q=>!q.answer);
  const answered=qnaList.filter(q=>q.answer);

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{background:"rgba(0,0,0,0.7)"}}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        style={{background:"#0d1426",border:"1px solid rgba(201,168,76,0.3)"}}>
        <div className="flex items-center justify-between sticky top-0 pb-2"
          style={{background:"#0d1426"}}>
          <h2 className="text-lg font-semibold text-white">{client.childName} · Q&A</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">✕</button>
        </div>

        {loading&&<p className="text-white/30 text-sm text-center py-8">불러오는 중...</p>}

        {!loading&&qnaList.length===0&&(
          <p className="text-white/25 text-sm text-center py-8">아직 질문이 없습니다.</p>
        )}

        {/* 답변 대기 */}
        {pending.length>0&&(
          <div className="space-y-4">
            <p className="text-xs tracking-wider text-gem-gold/70 font-medium">답변 대기 · {pending.length}건</p>
            {pending.map(item=>(
              <div key={item.id} className="rounded-xl p-4 space-y-3"
                style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">{item.weekNumber&&`${item.weekNumber}주차`}</span>
                  <span className="text-xs text-white/20">{formatDate(item.createdAt)}</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{item.question}</p>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-gem-gold/50"
                  rows={3} placeholder="답변을 입력하세요..."
                  value={answers[item.id]||""}
                  onChange={e=>setAnswers(a=>({...a,[item.id]:e.target.value}))}/>
                <button onClick={()=>handleAnswer(item.id)}
                  disabled={!answers[item.id]?.trim()||saving[item.id]}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{background:answers[item.id]?.trim()&&!saving[item.id]?"linear-gradient(135deg,#C9A84C,#a07c30)":"rgba(255,255,255,0.05)",
                    color:answers[item.id]?.trim()&&!saving[item.id]?"#0A0F1E":"rgba(255,255,255,0.25)"}}>
                  {saving[item.id]?"저장 중...":"답변 등록"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 답변 완료 */}
        {answered.length>0&&(
          <div className="space-y-3">
            <p className="text-xs tracking-wider text-white/30 font-medium">답변 완료 · {answered.length}건</p>
            {answered.map(item=>(
              <div key={item.id} className="rounded-xl p-4 space-y-2"
                style={{background:"rgba(201,168,76,0.04)",border:"1px solid rgba(201,168,76,0.15)"}}>
                <p className="text-xs text-white/30">{item.weekNumber&&`${item.weekNumber}주차`} · {formatDate(item.createdAt)}</p>
                <p className="text-sm text-white/65">{item.question}</p>
                <div className="border-t border-white/5 pt-2">
                  <p className="text-xs text-gem-gold/50 mb-1">답변 · {formatDate(item.answeredAt)}</p>
                  <p className="text-sm text-white/55 leading-relaxed">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 클라이언트 카드 ───────────────────────────────────────────
function ClientCard({client, onWeekChange, onQnA, onRefresh}){
  const b=GEM_COLORS[client.gemType]||GEM_COLORS.diamond;
  const pct=Math.round(((client.completedWeeks||0)/24)*100);

  return(
    <div className="rounded-2xl p-5 space-y-4"
      style={{background:`linear-gradient(135deg,rgba(${b},0.08) 0%,rgba(10,15,30,0) 100%)`,
        border:`1px solid rgba(${b},0.2)`}}>
      {/* 상단 */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/35 mb-0.5">{client.email}</p>
          <h3 className="text-lg font-bold text-white">{client.childName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge gemType={client.gemType}/>
            <span className="text-xs text-white/35">{client.currentWeek||1}주차 진행 중</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold" style={{color:`rgb(${b})`}}>{client.completedWeeks||0}</p>
          <p className="text-xs text-white/30">/ 24주</p>
        </div>
      </div>

      {/* 진행바 */}
      <div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{width:`${pct}%`,backgroundColor:`rgb(${b})`}}/>
        </div>
        <p className="text-xs text-white/25 mt-1 text-right">{pct}% 완료</p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <button onClick={()=>onWeekChange(client)}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
          style={{background:`rgba(${b},0.15)`,color:`rgb(${b})`}}>
          주차 변경
        </button>
        <button onClick={()=>onQnA(client)}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all relative"
          style={{background:"rgba(201,168,76,0.12)",color:"#C9A84C"}}>
          Q&A 답변
          {(client.pendingQnA||0)>0&&(
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
              style={{background:"#C9A84C",color:"#0A0F1E"}}>
              {client.pendingQnA}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── 메인 관리자 대시보드 ──────────────────────────────────────
export default function AdminDashboard({user}){
  const[clients,setClients]=useState([]);
  const[loading,setLoading]=useState(true);
  const[showAdd,setShowAdd]=useState(false);
  const[weekModal,setWeekModal]=useState(null);
  const[qnaModal,setQnaModal]=useState(null);

  const fetchClients=async()=>{
    try{
      const snap=await getDocs(collection(db,"clients"));
      const list=await Promise.all(snap.docs.map(async d=>{
        const data={uid:d.id,...d.data()};
        // 미답변 Q&A 개수 확인
        try{
          const qsnap=await getDocs(collection(db,"clients",d.id,"qna"));
          data.pendingQnA=qsnap.docs.filter(q=>!q.data().answer).length;
        }catch{}
        return data;
      }));
      setClients(list.sort((a,b)=>(a.childName||"").localeCompare(b.childName||"")));
    }catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  useEffect(()=>{fetchClients();},[]);

  const totalPending=clients.reduce((s,c)=>s+(c.pendingQnA||0),0);

  return(
    <div className="min-h-screen bg-gem-navy text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5"
        style={{background:"rgba(10,15,30,0.92)"}}>
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/35 tracking-[0.15em]">THE GEM</p>
            <p className="text-sm font-semibold text-white/90">관리자 대시보드</p>
          </div>
          <div className="flex items-center gap-3">
            {totalPending>0&&(
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{background:"rgba(201,168,76,0.2)",color:"#C9A84C"}}>
                미답변 {totalPending}건
              </span>
            )}
            <button onClick={()=>signOut(auth)}
              className="text-xs text-white/30 hover:text-white/60 transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-6 pb-24 space-y-6">

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {label:"전체 클라이언트",value:`${clients.length}명`},
            {label:"진행 중",value:`${clients.filter(c=>(c.currentWeek||1)<24).length}명`},
            {label:"미답변 Q&A",value:`${totalPending}건`,highlight:totalPending>0},
          ].map(({label,value,highlight})=>(
            <GoldBox key={label} className="text-center">
              <p className="text-xs text-white/35 mb-1">{label}</p>
              <p className={`text-xl font-bold ${highlight?"text-gem-gold":"text-white"}`}>{value}</p>
            </GoldBox>
          ))}
        </div>

        {/* 새 클라이언트 추가 버튼 */}
        <button onClick={()=>setShowAdd(true)}
          className="w-full py-4 rounded-2xl text-sm font-medium tracking-wider transition-all"
          style={{background:"linear-gradient(135deg,#C9A84C,#a07c30)",color:"#0A0F1E"}}>
          + 새 클라이언트 추가
        </button>

        {/* 클라이언트 목록 */}
        {loading?(
          <div className="text-center py-12 text-white/25 text-sm">불러오는 중...</div>
        ):(
          <div className="space-y-4">
            <SectionLabel>클라이언트 목록 · {clients.length}명</SectionLabel>
            {clients.length===0?(
              <div className="text-center py-12 text-white/20 text-sm">
                <p>아직 클라이언트가 없습니다.</p>
                <p className="text-xs mt-1">위 버튼으로 첫 번째 클라이언트를 추가해보세요.</p>
              </div>
            ):(
              clients.map(client=>(
                <ClientCard key={client.uid} client={client}
                  onWeekChange={setWeekModal}
                  onQnA={setQnaModal}
                  onRefresh={fetchClients}/>
              ))
            )}
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showAdd&&(
        <AddClientModal
          onClose={()=>setShowAdd(false)}
          onSuccess={fetchClients}/>
      )}
      {weekModal&&(
        <WeekModal client={weekModal}
          onClose={()=>setWeekModal(null)}
          onSuccess={fetchClients}/>
      )}
      {qnaModal&&(
        <QnAModal client={qnaModal}
          onClose={()=>setQnaModal(null)}/>
      )}
    </div>
  );
}
