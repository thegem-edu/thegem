import { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

// ── 보석 색상 데이터 ──────────────────────────────────────────
const GEM_COLORS = { diamond:[147,197,253], ruby:[248,113,113], alexandrite:[192,132,252], paraiba:[94,234,212], emerald:[52,211,153] };
const GEM_DARK   = { diamond:[20,60,180], ruby:[140,15,15], alexandrite:[90,15,170], paraiba:[8,90,110], emerald:[4,80,50] };
const GEM_MID    = { diamond:[90,150,240], ruby:[210,60,60], alexandrite:[155,80,220], paraiba:[50,180,160], emerald:[25,160,100] };
const GEM_HI     = { diamond:[220,240,255], ruby:[255,210,210], alexandrite:[235,205,255], paraiba:[185,255,245], emerald:[175,255,215] };
const GEM_LABELS = { diamond:"다이아몬드", ruby:"루비", alexandrite:"알렉산드라이트", paraiba:"파라이바", emerald:"에메랄드" };
const GEM_SUBTITLES = { diamond:"활발한 백수정", ruby:"단단한 가넷", alexandrite:"섬세한 자수정", paraiba:"신비한 오팔", emerald:"우직한 비취" };

// ── 다이아몬드 24주 커리큘럼 데이터 (코드 내장) ──────────────
const DIAMOND_CURRICULUM = [
  { weekNumber:1, weekTheme:"연결", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 자기 감정을 말로 표현하는 것이 낯섭니다. 감정이 있어도 언어로 꺼내는 통로가 없습니다. 1주차 미션은 그 통로를 만드는 것입니다. 날씨 카드로 오늘 기분을 표현하는 것 — 이것이 경청의 시작입니다.",
    childMission:"저녁 식사 전, 오늘 기분이 어떤 날씨인지 하나만 말합니다 (맑음/흐림/비/천둥/바람). 말하기 어려운 날은 카드를 손가락으로 가리키기만 해도 충분합니다. 가리키는 것 자체가 이미 자기 기분을 느끼고 표현한 것입니다.",
    parentMission:"\"오늘 천둥이었구나\" 한 마디만. 판단·해결 금지.",
    schoolConnection:"자기 마음을 말하는 힘 — 입학 후 선생님께 처음으로 자기 상태를 알리는 준비입니다.",
    gemTip:"이 미션의 핵심은 부모의 반응입니다. 카드를 가리켰을 때 '왜?'라고 묻거나 해결하려 하면 다음엔 말하지 않습니다. '천둥이었구나' 한 마디로 끝내세요.",
    gongPoint:"받아줬다는 경험이 쌓여야 다음 주가 됩니다.",
    parentCare:"아이가 감정을 말하지 않아서 답답하셨을 겁니다. 이 아이는 감정이 없는 게 아닙니다. 감정을 꺼내는 방법을 모르는 것입니다. 오늘 카드 한 장을 가리켰다면, 그 아이가 처음으로 자기 안에 있는 것을 밖으로 꺼낸 것입니다.",
    nextWeekPreview:"[응답] 이름이 불렸을 때 멈추고 반응하는 연습으로 이어집니다 — 입학 후 출석 부를 때 '네!' 답하는 힘이 여기서 시작됩니다." },

  { weekNumber:2, weekTheme:"응답", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 이름을 불러도 반응이 없습니다. 집중하던 것을 멈추기 어렵기 때문입니다. 학교에서 선생님이 이름을 불렀을 때 즉각 반응하는 것 — 이것이 훈련됩니다.",
    childMission:"부모가 이름을 부르면 하던 것을 멈추고 부모 쪽을 봅니다. '네' 한 마디면 충분합니다. 하루 3회, 자연스러운 상황에서 연습합니다.",
    parentMission:"이름 부른 후 짧은 말 이어가기. '엄마가 뭐라고 했어?' 확인 질문 (처음엔 2가지, 익숙해지면 3가지). 테스트처럼 만들지 않기.",
    schoolConnection:"이름이 불렸을 때 반응하는 힘 — 입학 후 선생님 말씀을 듣는 첫 번째 준비입니다.",
    gemTip:"'다 들었어?' 대신 '엄마가 뭐라고 했어?' — 실제로 들었는지 확인 가능합니다. yes/no 질문이 아니라 재현 질문입니다.",
    gongPoint:"불러도 안 돌아보는 것이 무시처럼 느껴지셨을 겁니다. 이 아이는 무시하는 게 아닙니다. 지금 하는 것에 완전히 빠져있는 것입니다.",
    parentCare:"오늘 멈추고 돌아봤다면, 그 아이가 처음으로 자기 집중을 스스로 끊은 것입니다.",
    nextWeekPreview:"[조화] 나가기 전 체크리스트를 스스로 확인하는 연습으로 이어집니다 — 입학 후 수업 준비하는 힘이 여기서 시작됩니다." },

  { weekNumber:3, weekTheme:"조화", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 아침에 나가기 전 준비가 가장 힘듭니다. 부모가 챙겨주지 않으면 빠뜨리고, 챙겨주면 잔소리처럼 들립니다. 체크리스트가 벽에 붙어 있으면 아이가 기억하는 게 아니라 구조가 기억해줍니다.",
    childMission:"나가기 전 현관 벽 체크리스트 3가지를 순서대로 확인합니다: ①가방 멨나 ②신발 맞게 신었나 ③문 앞에 섰나. 손가락으로 하나씩 짚어가며 확인합니다.",
    parentMission:"\"가방\", \"신발\", \"나가자\" 세 마디만. 빠뜨린 것 있어도 현관 나서기 전까지 알려주지 않기.",
    schoolConnection:"세 가지 다 확인하고 나왔네. 입학 후 수업 준비할 때도 그 손이 기억할 거야.",
    gemTip:"체크리스트가 벽에 붙어 있으면 아이가 기억하는 게 아니라 구조가 기억해줍니다. 부모가 말하지 않아도 되는 구조를 만드는 것이 핵심입니다.",
    gongPoint:"매일 아침 챙겨줘야 하는 것이 지치셨을 겁니다.",
    parentCare:"오늘 체크리스트를 스스로 확인했다면, 그 아이가 처음으로 부모 말 없이 스스로 준비한 것입니다.",
    nextWeekPreview:"[성찰] 오늘 스스로 한 것을 돌아보는 연습으로 이어집니다 — 입학 후 회복력의 뿌리가 됩니다." },

  { weekNumber:4, weekTheme:"성찰", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 실수 후 하루 전체를 '망했어'로 판정합니다. 오늘 잘한 것 하나를 스스로 말하는 것 — 이것이 회복력의 뿌리입니다.",
    childMission:"저녁 식사 중 또는 자기 전, 오늘 스스로 한 것 하나를 말합니다. 아주 작은 것이어도 괜찮습니다.",
    parentMission:"평가 없이 그대로 반복. '가방 스스로 멨구나.' 딱 그것만.",
    schoolConnection:"오늘 네가 한 것을 네가 알고 있네. 입학 후 실수 후에도 무너지지 않는 힘이 여기서 만들어집니다.",
    gemTip:"'잘했어'라고 칭찬하지 마세요. 칭찬은 평가입니다. '가방 스스로 멨구나'처럼 사실을 반복해주세요. 사실 확인이 이 아이에게 더 강한 동기가 됩니다.",
    gongPoint:"실수가 있었던 날도 잘한 것 하나를 말했다면, 그 아이가 처음으로 하루를 성취로 끝낸 것입니다.",
    parentCare:"실수 후에도 무너지지 않는 힘이 여기서 만들어집니다.",
    nextWeekPreview:"[자제] 영상 없이 기다리는 연습으로 이어집니다 — 입학 후 선생님 오실 때까지 기다리는 힘이 됩니다." },

  { weekNumber:5, weekTheme:"자제", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이에게 기다림은 가장 어려운 것입니다. 외출 준비가 끝날 때까지 영상 없이 기다리는 것 — 이것이 학교에서 선생님 오실 때까지 기다리는 힘이 됩니다.",
    childMission:"외출 준비가 끝나면 신발장에서 영상 없이 기다립니다. 기다리는 동안 할 것을 미리 하나 정해둡니다. '가자' 소리가 들리면 출발합니다.",
    parentMission:"기다리는 동안 영상 주지 않기. '가자' 신호 전까지 말 걸지 않기. 처음엔 1분→3분→5분.",
    schoolConnection:"영상 없이 기다렸네. 입학 후 선생님 오실 때까지 그렇게 기다릴 수 있습니다.",
    gemTip:"기다리는 동안 할 것을 아이가 미리 정하게 하세요. '뭐 하고 기다릴까?'라고 물어보면 됩니다. 자기가 정한 것을 하면서 기다리는 것은 수동적 기다림이 아닙니다.",
    gongPoint:"영상 없이는 1분도 못 기다리는 것이 걱정되셨을 겁니다.",
    parentCare:"오늘 영상 없이 기다렸다면, 그 아이가 처음으로 자극 없이 시간을 버틴 것입니다.",
    nextWeekPreview:"[신중] 말하기 전에 한 번 멈추는 연습으로 이어집니다 — 입학 후 수업 시간에 손들기 전에 생각하는 힘이 됩니다." },

  { weekNumber:6, weekTheme:"신중", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 생각이 입보다 빠릅니다. 질문을 받으면 바로 답합니다. 숨을 한 번 쉬고 말하는 것 — 이것이 수업 시간에 손들기 전에 생각하는 힘이 됩니다.",
    childMission:"질문을 받으면 숨을 한 번 쉬고 말합니다. 부모가 하루 3번 간단한 질문을 던져줍니다.",
    parentMission:"바로 말하면 '숨 한 번'이라고만 말하고 기다리기.",
    schoolConnection:"숨 쉬고 말했네. 입학 후 수업 시간에 손들기 전에도 그렇게 하면 됩니다.",
    gemTip:"다이아몬드는 먼저 멈추는 것이 필요합니다. 숨 한 번이 생각의 공간을 만듭니다.",
    gongPoint:"말이 너무 빠르거나 엉뚱한 답이 나오는 것이 걱정되셨을 겁니다.",
    parentCare:"오늘 숨 한 번 쉬고 말했다면, 그 아이가 처음으로 자기 빠름을 스스로 늦춘 것입니다.",
    nextWeekPreview:"[전환] Stage 2 시작 — 타이머로 놀이를 멈추는 연습으로 이어집니다." },

  { weekNumber:7, weekTheme:"전환", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 놀이나 영상을 멈추는 것이 가장 어렵습니다. 타이머가 울려도 '조금만'이 반복됩니다. 타이머를 아이가 직접 설정하면 구조가 시키는 것이 됩니다. 부모가 시키는 것이 아닙니다.",
    childMission:"놀이나 영상을 시작하기 전에 타이머를 직접 설정합니다 (30분 이내). 타이머가 울리면 '마무리 중'이라고 말합니다.",
    parentMission:"'잘했어' 대신 '마무리 중이네' — 칭찬하면 협상 시작, 사실 확인엔 협상 없음.",
    schoolConnection:"타이머 소리 듣고 멈췄네. 입학 후 학교 종소리도 그렇게 들을 수 있습니다.",
    gemTip:"'마무리 중이네'는 칭찬이 아닌 사실 확인입니다. 이 아이에게 칭찬은 협상의 시작입니다. '잘했어'라고 하면 '조금만 더'가 나옵니다.",
    gongPoint:"타이머가 울려도 멈추지 않아서 매번 전쟁 같았을 겁니다.",
    parentCare:"오늘 타이머 소리에 멈췄다면, 그 아이가 처음으로 자기 욕구보다 구조를 따른 것입니다.",
    nextWeekPreview:"[시도] 틀렸을 때 짜증 대신 다시 시도하는 연습으로 이어집니다." },

  { weekNumber:8, weekTheme:"시도", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 틀렸을 때 즉각적으로 짜증이 납니다. '다시 해'가 아니라 '한 번 더'라고 말하는 것 — 이것이 학교에서 틀려도 포기하지 않는 힘이 됩니다.",
    childMission:"틀렸을 때 짜증 대신 '한 번 더'라고 말하고 다시 시도합니다. 말하기 어려우면 손가락 하나를 세워도 됩니다.",
    parentMission:"결과 칭찬→다음엔 시도 안 함. 과정 확인→계속 시도. '다시 했네' 한 마디면 충분.",
    schoolConnection:"짜증 대신 다시 했네. 입학 후 학교에서 틀려도 그 힘이 나올 거야.",
    gemTip:"결과를 칭찬하면 이 아이는 다음엔 틀릴까봐 시도하지 않습니다. '다시 했네'처럼 시도 자체를 확인하세요.",
    gongPoint:"틀렸을 때 짜증이 폭발하는 것이 걱정되셨을 겁니다.",
    parentCare:"오늘 '한 번 더'가 나왔다면, 그 아이가 처음으로 짜증보다 시도를 선택한 것입니다.",
    nextWeekPreview:"[해결] 실수 후 사과하고 해결책을 묻는 연습으로 이어집니다." },

  { weekNumber:9, weekTheme:"해결", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 에너지가 강해서 실수도 큽니다. 사과는 할 수 있습니다. 그런데 '어떻게 해주면 좋을까?'까지 가는 아이는 드뭅니다. 이 한 마디가 관계를 살리는 것입니다.",
    childMission:"가족에게 실수를 했을 때 '미안해. 내가 어떻게 해주면 좋을까?'라고 말합니다. 말하기 어려우면 '미안해'라고만 해도 됩니다.",
    parentMission:"아이가 실수했을 때 바로 해결해주지 않는다. 사과가 나오면 '어떻게 하면 될 것 같아?'라고 먼저 묻는다.",
    schoolConnection:"미안하다고 하고 어떻게 해줄지 물었네. 입학 후 친구 관계를 살리는 힘이 됩니다.",
    gemTip:"'미안해. 내가 어떻게 해주면 좋을까?' 이 한 문장을 집에서 먼저 연습하면 학교에서 자동으로 나옵니다.",
    gongPoint:"실수가 잦은 아이를 키우는 것은 지칩니다.",
    parentCare:"오늘 사과 후 '어떻게 해주면 좋을까?'가 나왔다면, 그 아이가 처음으로 자기 실수를 자기가 수습하려 한 것입니다.",
    nextWeekPreview:"[중심] 소음이 있는 환경에서도 한 가지에 집중하는 연습으로 이어집니다." },

  { weekNumber:10, weekTheme:"중심", gemType:"diamond",
    whyMission:"교실은 항상 시끄럽습니다. 다이아몬드 기질 아이에게 모든 소리가 동등하게 들어옵니다. 집에서 소음이 있는 환경에서 부모 목소리에 집중하는 연습 — 이것이 교실에서 선생님 목소리를 듣는 힘이 됩니다.",
    childMission:"TV나 부엌 소리가 있는 환경에서 부모가 짧은 이야기를 합니다. 끝까지 듣고 기억나는 것 한 가지를 말합니다. 처음에는 30초, 익숙해지면 1분으로 늘립니다.",
    parentMission:"배경 소음이 있는 자연스러운 상황을 활용한다. 짧고 명확하게 말한다. 아이가 기억한 것이 전부가 아니어도 '기억했네'라고만 한다.",
    schoolConnection:"소리가 많은데도 엄마 말 기억했네. 입학 후 교실에서도 그렇게 들을 수 있습니다.",
    gemTip:"30초부터 시작하세요. 이 아이는 기억한 것을 말할 때 자랑스러워합니다. 그 순간이 다음번 집중의 동기가 됩니다.",
    gongPoint:"말을 해도 못 들은 척하는 것 같아서 답답하셨을 겁니다. 이 아이는 못 들은 척이 아닙니다. 모든 소리가 동시에 들어와서 어느 것에 집중해야 할지 모르는 것입니다.",
    parentCare:"오늘 소음 속에서 집중했다면, 그 아이가 처음으로 자기 주의를 스스로 선택한 것입니다.",
    nextWeekPreview:"[수용] 계획이 바뀌었을 때 당황하지 않는 연습으로 이어집니다." },

  { weekNumber:11, weekTheme:"수용", gemType:"diamond",
    whyMission:"체육이 갑자기 취소됩니다. 좋아하는 급식 메뉴가 바뀝니다. 다이아몬드 기질 아이는 이 순간 즉각적으로 반응합니다. '그럴 수도 있지' 한 마디 — 이것이 돌발 상황에서 무너지지 않는 힘입니다.",
    childMission:"계획이 바뀌었을 때 '그럴 수도 있지'라고 말합니다. 그 다음 '그럼 뭐 하지?'가 나오면 더 좋습니다. '그럴 수도 있지' 한 마디만 나와도 이번 주는 완성입니다.",
    parentMission:"계획을 바꿀 때 이유를 길게 설명하지 않는다. '오늘 저녁 메뉴 바뀌었어'라고만 말하고 기다린다. 대안을 부모가 먼저 제시하지 않는다.",
    schoolConnection:"'그럴 수도 있지' 했네. 입학 후 학교에서 갑자기 체육이 취소돼도 그렇게 할 수 있습니다.",
    gemTip:"계획이 바뀔 때 이유를 길게 설명하지 마세요. 설명이 길수록 이 아이는 협상을 시작합니다.",
    gongPoint:"계획이 바뀔 때마다 전쟁 같은 하루가 됩니다.",
    parentCare:"오늘 '그럴 수도 있지'가 나왔다면, 그 아이가 처음으로 바뀐 상황을 받아들이고 앞을 본 것입니다.",
    nextWeekPreview:"[정돈] 귀가 후 물건을 정해진 자리에 두는 연습으로 이어집니다." },

  { weekNumber:12, weekTheme:"정돈", gemType:"diamond",
    whyMission:"귀가 후 가방을 정해진 자리에 두고, 알림장을 꺼내고, 물통을 씻으러 보내는 것 — 이것이 매일 안 되면 다음날 학교 준비가 엉망이 됩니다.",
    childMission:"귀가 후 현관에서 돌아오기 체크리스트 3가지를 확인합니다: ①가방을 정해진 자리에 두기 ②알림장을 꺼내서 눈에 보이는 곳에 놓기 ③물통을 씻으러 보내기. 현관 벽에 붙여두고 손가락으로 하나씩 짚습니다.",
    parentMission:"귀가하면 '체크리스트'라고만 말한다. 3가지 완료 후 영상 허용. 순서가 바뀌어도 괜찮다.",
    schoolConnection:"집에 오자마자 3가지 됐네. 입학 후 학교 사물함도 그렇게 할 수 있습니다.",
    gemTip:"귀가 후 체크리스트가 끝나면 영상을 허용하세요. 이 아이에게 영상은 가장 강한 동기입니다.",
    gongPoint:"매일 가방이 현관에 나뒹굴고, 알림장은 가방 안에 있던 날들이 있었을 겁니다.",
    parentCare:"체크리스트가 벽에 붙어 있으면 아이가 기억하는 게 아니라 구조가 기억해줍니다.",
    nextWeekPreview:"[안목] Stage 3 시작 — 감정 카드로 친구 표정을 읽는 연습이 시작됩니다." },

  { weekNumber:13, weekTheme:"안목", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 자기 에너지에 집중하느라 친구의 표정과 감정을 놓칩니다. 감정 카드로 타인의 감정을 읽는 것 — 이번 주부터 키트의 감정 카드가 활성화됩니다.",
    childMission:"저녁 식사 후 또는 자기 전, 감정 카드 한 장을 꺼냅니다. '이 사람은 지금 어떤 기분일까?'라고 생각해봅니다.",
    parentMission:"카드를 꺼내는 것은 부모가 한다. '이 친구는 어떤 기분인 것 같아?'라고 묻는다. 정답을 알려주지 않는다.",
    schoolConnection:"표정을 보고 마음을 읽으려 했네. 입학 후 친구 얼굴 볼 때도 그렇게 해봐.",
    gemTip:"정답을 맞히는 것이 목표가 아닙니다. 표정을 보고 마음을 생각해보는 것 자체가 훈련입니다.",
    gongPoint:"친구에게 계속 달려들다가 관계가 틀어지는 것을 옆에서 보는 것이 마음 아프셨을 겁니다.",
    parentCare:"오늘 카드 한 장의 표정을 보고 마음을 생각했다면, 그 아이가 처음으로 타인의 내면을 들여다본 것입니다.",
    nextWeekPreview:"[경청] 상대의 말이 끝날 때까지 기다리며 듣는 연습으로 이어집니다." },

  { weekNumber:14, weekTheme:"경청", gemType:"diamond",
    whyMission:"선생님이 '교과서 47페이지 펴고, 3번 문제부터'라고 말씀하시는데 '교과서'에서 이미 움직이는 아이 — 결과적으로 다른 페이지를 펴고 있습니다. 말이 끝날 때까지 기다리는 것이 훈련됩니다.",
    childMission:"부모가 짧은 지시 2가지를 한 번에 말합니다. 말 끝나면 '엄마가 뭐라고 했어?'라고 확인. 아이가 2가지를 다 말하면 그대로 하게 합니다.",
    parentMission:"아이가 끊으면 '다 말하고 나서'라고만 하고 계속 말한다. 하나만 말하면 '하나 더 있었는데'라고만 한다.",
    schoolConnection:"다 말할 때까지 기다렸네. 입학 후 선생님 지시도 그렇게 들으면 하나도 안 빠뜨려.",
    gemTip:"처음엔 2가지, 익숙해지면 3가지로 늘리세요.",
    gongPoint:"말하는 도중에 끊기는 것이 매일 반복되면 지칩니다.",
    parentCare:"오늘 한 번이라도 끝까지 기다렸다면, 그 아이의 브레이크가 조금 더 강해진 것입니다.",
    nextWeekPreview:"[팀워크] 집안일에서 자기 역할을 골라서 끝까지 완수하는 연습으로 이어집니다." },

  { weekNumber:15, weekTheme:"팀워크", gemType:"diamond",
    whyMission:"모둠 활동에서 자기 역할을 끝까지 하는 아이가 친구들에게 신뢰를 얻습니다. 집안일에서 자기 역할을 골라서 끝까지 완수하는 연습 — 이것이 모둠 활동에서 믿을 수 있는 아이를 만듭니다.",
    childMission:"주 시작 전, 일주일 동안 매일 할 집안일 하나를 고릅니다. 일주일 동안 매일 같은 것을 합니다. 완료하면 부모에게 '다 했어요'라고 말합니다.",
    parentMission:"목록을 미리 만들어 보여준다. 아이가 직접 고르게 한다. 일주일 동안 바꾸지 않는다는 것을 미리 말한다.",
    schoolConnection:"자기가 고른 일을 끝까지 했네. 입학 후 모둠에서도 그렇게 하면 친구들이 믿어.",
    gemTip:"같은 것을 일주일 동안 매일 하는 것 — 이것이 모둠 활동에서 자기 역할을 끝까지 하는 힘이 됩니다.",
    gongPoint:"시작만 하고 중간에 사라지는 것이 반복되면 지칩니다.",
    parentCare:"오늘 고른 일을 끝까지 했다면, 그 아이가 처음으로 자극을 이기고 완료를 선택한 것입니다.",
    nextWeekPreview:"[신뢰] 실수를 숨기지 않고 먼저 말하는 연습으로 이어집니다." },

  { weekNumber:16, weekTheme:"신뢰", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 에너지가 빠릅니다. 실수도 빠르게 지나가고 싶어합니다. 신뢰는 실수 없는 아이가 아니라 실수를 말하는 아이에게 쌓입니다.",
    childMission:"가족에게 실수를 했을 때 숨기거나 모른 척하지 않고 먼저 말합니다. '제가 실수했어요' 또는 '사실 이랬어요'라고 말하면 됩니다.",
    parentMission:"아이가 먼저 말했을 때 혼내지 않는다. '말해줘서 고마워'를 반드시 먼저 말한다. 아이가 말하기 전에 알아채도 모른 척하고 기다리기.",
    schoolConnection:"실수했다고 먼저 말해줬네. 입학 후 선생님이 가장 믿는 아이가 됩니다.",
    gemTip:"혼내면 다음엔 더 숨깁니다. '말해줘서 고마워'가 먼저 나와야 다음번에도 말합니다.",
    gongPoint:"실수를 숨기는 것을 발견했을 때 화가 나셨을 겁니다.",
    parentCare:"오늘 먼저 말했다면, 그 아이가 빠르게 넘어가고 싶은 충동을 이기고 멈춘 것입니다.",
    nextWeekPreview:"[관용] 친구의 실수를 지적하지 않고 기다리는 연습으로 이어집니다." },

  { weekNumber:17, weekTheme:"관용", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 빠르고 정확합니다. 그래서 친구나 동생이 실수하면 바로 지적합니다. 지적받는 쪽은 창피하고 위축됩니다. 지적하지 않고 기다려주는 아이가 친구들이 옆에 있고 싶어하는 아이가 됩니다.",
    childMission:"동생이나 부모가 실수를 했을 때 바로 지적하지 않고 기다립니다. 말하고 싶을 때는 속으로 셋을 셉니다. 그래도 말하고 싶으면 '내가 도와줄까?'라고만 말합니다.",
    parentMission:"의도적으로 작은 실수를 한다. 아이가 지적하지 않고 기다리면 '기다려줘서 고마워'라고 말한다.",
    schoolConnection:"말하고 싶었는데 기다렸네. 입학 후 친구들이 네 옆에 있고 싶어하는 이유야.",
    gemTip:"'셋 세고 말하기'와 '도와줄까?'는 지적 충동을 행동으로 바꾸는 출구입니다. 억압이 아니라 방향 전환입니다.",
    gongPoint:"친구들에게 지적하다가 관계가 틀어지는 것을 옆에서 보는 것이 마음 아프셨을 겁니다.",
    parentCare:"오늘 셋을 세고 기다렸다면, 그 아이가 처음으로 자신의 빠름을 스스로 늦춘 것입니다.",
    nextWeekPreview:"[조율] 의견이 다를 때 순서를 만드는 연습으로 이어집니다." },

  { weekNumber:18, weekTheme:"조율", gemType:"diamond",
    whyMission:"쉬는 시간에 친구는 술래잡기를 하고 싶고 이 아이는 축구를 하고 싶습니다. '이번엔 네 거, 다음엔 내 거' — 이 한 문장이 관계를 살립니다. 양보가 아닙니다. 내 차례를 만드는 것입니다.",
    childMission:"부모와 의견이 다를 때 '이번엔 엄마 것 하고, 다음엔 내가 생각한 걸로 해보자'라고 말합니다.",
    parentMission:"엄마 것을 먼저 한다. 반드시 다음 차례를 지킨다. 약속을 어기면 다시는 양보하지 않는다.",
    schoolConnection:"이번엔 엄마 거 하고 다음엔 00이 거 했네. 입학 후 친구 관계를 오래 가게 하는 힘이야.",
    gemTip:"'양보해'라고 하면 이 아이는 억울합니다. '이번엔 네 거, 다음엔 내 거'는 양보가 아니라 순서입니다.",
    gongPoint:"매번 자기 것을 고집하다가 친구와 싸우는 것이 걱정되셨을 겁니다.",
    parentCare:"오늘 '이번엔 엄마 거'가 나왔다면, 그 아이가 처음으로 자기 에너지를 관계 안에서 조율한 것입니다.",
    nextWeekPreview:"[확신] Stage 4 시작 — 자기 강점을 언어로 표현하는 연습이 시작됩니다." },

  { weekNumber:19, weekTheme:"확신", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 에너지는 강한데 자기 강점을 언어로 표현하는 것은 어색합니다. 자기 강점을 언어로 표현하는 것 — 이것이 발표 시간에 손을 드는 힘이 됩니다.",
    childMission:"저녁 식사 중 또는 자기 전, 오늘 내가 잘한 것 하나를 말합니다. '나는 ___을 잘해' 또는 '오늘 ___을 잘했어'라고 말하면 됩니다.",
    parentMission:"아이가 말하면 평가하지 않는다. '맞아, 잘하더라'라고만 한다. 부모도 하나 말한다.",
    schoolConnection:"자기가 잘하는 것을 말했네. 입학 후 선생님이 '잘하는 사람?' 물으면 그 손이 올라갈 거야.",
    gemTip:"부모가 먼저 말해주세요. '엄마는 오늘 저녁을 잘했어'처럼 작은 것도 됩니다.",
    gongPoint:"에너지는 넘치는데 정작 자신에 대해서는 말을 못 하는 것이 신기하게 느껴지셨을 겁니다.",
    parentCare:"오늘 하나라도 말했다면, 그 아이가 처음으로 자기 안에 있는 것을 밖으로 꺼낸 것입니다.",
    nextWeekPreview:"[자립] 스스로 결정하고 그 결정을 끝까지 지키는 연습으로 이어집니다." },

  { weekNumber:20, weekTheme:"자립", gemType:"diamond",
    whyMission:"귀가 후 해야 할 일이 많습니다. 체크리스트에서 가장 힘든 것 하나를 타이머로 연습합니다. 자기가 정한 시간을 자기가 지키는 것 — 이것이 학교에서 스스로 관리하는 힘이 됩니다.",
    childMission:"귀가 후 체크리스트 중 가장 힘든 일과 하나를 주 시작 전에 정합니다. 아이가 직접 타이머를 맞춥니다. 타이머가 울릴 때까지 시도합니다.",
    parentMission:"주 시작 전 체크리스트를 보여주고 아이가 직접 고르게 한다. 매일 같은 시간에 '시간 됐어'라고만 알려준다.",
    schoolConnection:"네가 정한 시간에 타이머 맞추고 시작했네. 입학 후 학교에서도 그렇게 할 수 있어.",
    gemTip:"사람이 시키면 저항하고 타이머가 시키면 따릅니다. 타이머 소리만 믿으세요.",
    gongPoint:"매일 숙제 전쟁이 반복되면 지칩니다.",
    parentCare:"오늘 타이머를 스스로 맞추고 시작했다면, 그 아이가 처음으로 자기 결정을 자기가 지킨 것입니다.",
    nextWeekPreview:"[소신] 어려운 상황에서도 자기 생각을 말하는 연습으로 이어집니다." },

  { weekNumber:21, weekTheme:"소신", gemType:"diamond",
    whyMission:"친구가 '그거 하지 마'라고 할 때, 선생님이 '누가 했어?'라고 물을 때 — 이 순간에 자기 생각을 말하는 것이 훈련됩니다.",
    childMission:"가족 중 누군가가 '그렇게 하면 안 돼'라고 할 때 '나는 이렇게 생각해'라고 한 번 말해봅니다. 말하기 어려우면 '나는 다르게 생각해'라고만 해도 됩니다.",
    parentMission:"아이가 '나는 이렇게 생각해'라고 말하면 반박하지 않는다. '그렇게 생각했구나'라고만 한다.",
    schoolConnection:"'나는 이렇게 생각해' 했네. 입학 후 친구 압력에 자기 생각을 유지하는 힘이 됩니다.",
    gemTip:"이 말 한 마디가 또래 압력에서 자기를 지키는 힘이 됩니다.",
    gongPoint:"친구 말에 쉽게 휩쓸리는 것이 걱정되셨을 겁니다.",
    parentCare:"오늘 '나는 다르게 생각해'가 나왔다면, 그 아이가 처음으로 자기 생각을 지킨 것입니다.",
    nextWeekPreview:"[몰입] 한 가지를 정해서 끝까지 하는 연습으로 이어집니다." },

  { weekNumber:22, weekTheme:"몰입", gemType:"diamond",
    whyMission:"다이아몬드 기질 아이는 여러 가지를 동시에 시작합니다. 하나를 정해서 끝까지 — 이것이 수업 시간에 한 가지에 집중하는 힘이 됩니다.",
    childMission:"주 시작 전 이번 주에 끝낼 것 하나를 정합니다. 그것만 합니다. 다른 것이 하고 싶어지면 '이번 주는 이거야'라고 스스로 말하고 돌아옵니다.",
    parentMission:"아이가 정한 것을 적어서 눈에 보이는 곳에 붙여준다. 다른 것을 시작하려 하면 '이번 주는 뭐라고 했지?'라고만 한다.",
    schoolConnection:"하나 정하고 끝까지 했네. 입학 후 수업 시간에 한 가지에 집중하는 힘이 됩니다.",
    gemTip:"여러 개 동시에 시작하는 것이 이 아이의 패턴입니다. 눈에 보이는 곳에 '이번 주 목표'를 붙여두면 구조가 기억해줍니다.",
    gongPoint:"시작만 하고 끝내지 못하는 것이 반복되면 지칩니다.",
    parentCare:"오늘 하나를 끝까지 했다면, 그 아이가 처음으로 분산된 에너지를 한 방향으로 모은 것입니다.",
    nextWeekPreview:"[유능감] 잘하는 것과 연습 중인 것을 동시에 아는 자기 인식의 완성으로 이어집니다." },

  { weekNumber:23, weekTheme:"유능감", gemType:"diamond",
    whyMission:"23주차는 한 단계 깊어집니다. 잘하는 것과 아직 연습 중인 것을 동시에 아는 것 — 자기 인식의 완성입니다. '못해'가 아니라 '연습 중이야' — 이 말이 나오면 약점이 부끄러운 것이 아니라 성장 중인 것이 됩니다.",
    childMission:"저녁 식사 중 또는 자기 전, 잘하는 것 하나와 연습 중인 것 하나를 말합니다. '나는 ___은 잘하고, ___은 연습 중이야'라고 말하면 됩니다.",
    parentMission:"부모도 함께 말한다. 아이가 연습 중인 것을 말했을 때 '그렇구나, 연습 중이구나'라고만 받아준다.",
    schoolConnection:"잘하는 것도 알고 연습 중인 것도 아네. 입학 후 모르는 것을 손들고 물어보는 아이가 됩니다.",
    gemTip:"부모가 먼저 '엄마도 연습 중이야'라고 말해주세요. 그 순간 아이에게 약점을 말하는 것이 안전해집니다.",
    gongPoint:"못하는 것을 인정하지 않으려는 모습이 걱정되셨을 겁니다.",
    parentCare:"오늘 '연습 중이야'가 나왔다면, 그 아이가 처음으로 자기 약점을 안전하게 꺼낸 것입니다.",
    nextWeekPreview:"[명예] 다음 주가 마지막 24주차입니다. 24주 동안 함께 다듬어온 것들이 완성되는 주입니다." },

  { weekNumber:24, weekTheme:"명예 (수료)", gemType:"diamond",
    whyMission:"24주가 끝났습니다. 1주차에 날씨 카드로 기분을 말하던 아이가 지금은 자기 강점을 말하고, 타이머를 맞추고, 실수를 먼저 말하고, 친구 압력에 자기 생각을 유지합니다. 오늘은 미션이 없습니다. 아이가 스스로 달라진 것을 말하는 날입니다.",
    childMission:"1주차부터 지금까지 세공 공방을 함께 펼쳐봅니다. 아이가 기억나는 미션 하나를 직접 고릅니다. '나는 ___이 달라졌어'라고 말하면 됩니다.",
    parentMission:"아이가 말하기 전에 먼저 말하지 않는다. 부모도 달라진 것 하나를 말한다. '엄마도 ___이 달라졌어.' 오늘은 평가하지 않는다.",
    schoolConnection:"24주 동안 네가 달라진 것을 네가 알고 있네. 그게 다이아몬드야.",
    gemTip:"오늘은 아무것도 시키지 마세요. 아이가 말할 때까지 기다리세요. 이 아이는 자기가 한 것을 눈으로 보면 기억합니다.",
    gongPoint:"24주 동안 쉽지 않으셨을 겁니다. 미션이 안 되는 날, 아이가 거부하는 날이 있었을 겁니다. 그런데 여기까지 왔습니다.",
    parentCare:"오늘 아이가 '나는 ___이 달라졌어'라고 말했다면, 그 말은 아이가 자기 성장을 스스로 인식한 것입니다. 그리고 그 성장의 절반은 부모가 바뀐 것입니다.",
    nextWeekPreview:"원석이 다이아몬드가 되었습니다. 아이 이름이 새겨진 수료 보석 배지와 심층 분석 리포트 최종본이 전달됩니다." }
];

// gemType별 커리큘럼 맵
const CURRICULUM_MAP = { diamond: DIAMOND_CURRICULUM };

function getCurriculumWeek(gemType, weekNumber) {
  const data = CURRICULUM_MAP[gemType];
  if (data) return data.find(w => w.weekNumber === weekNumber) || null;
  return null;
}

// ── Canvas 보석 렌더러 ──────────────────────────────────────────
function lp(a,b,t){return a.map((v,i)=>Math.round(v+(b[i]-v)*t));}
function rc(c,a){return `rgba(${c[0]},${c[1]},${c[2]},${a??1})`;}

function drawGem(canvas,gemType,size,filled){
  if(!canvas)return;
  const dpr=window.devicePixelRatio||2;
  const W=size,H=size*0.9;
  canvas.width=W*dpr; canvas.height=H*dpr;
  canvas.style.width=W+"px"; canvas.style.height=H+"px";
  const ctx=canvas.getContext("2d");
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  if(!filled){
    ctx.beginPath();
    ctx.moveTo(W*.18,0);ctx.lineTo(W*.82,0);ctx.lineTo(W,H*.44);
    ctx.lineTo(W*.5,H);ctx.lineTo(0,H*.44);ctx.closePath();
    ctx.fillStyle="rgba(255,255,255,0.03)";ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,0.2)";ctx.lineWidth=0.8;ctx.stroke();
    ctx.beginPath();ctx.moveTo(W*.18,0);ctx.lineTo(W*.82,0);
    ctx.strokeStyle="rgba(255,255,255,0.2)";ctx.lineWidth=0.8;ctx.stroke();
    return;
  }
  const b=GEM_COLORS[gemType]||GEM_COLORS.diamond;
  const d=GEM_DARK[gemType]||GEM_DARK.diamond;
  const m=GEM_MID[gemType]||GEM_MID.diamond;
  const hi=GEM_HI[gemType]||GEM_HI.diamond;
  const tL={x:W*.18,y:0},tR={x:W*.82,y:0};
  const gL={x:0,y:H*.44},gR={x:W,y:H*.44};
  const tip={x:W*.5,y:H},ctr={x:W*.5,y:H*.44};
  const tbL={x:W*.3,y:H*.22},tbR={x:W*.7,y:H*.22};
  function face(pts,g){
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.closePath();ctx.fillStyle=g;ctx.fill();
  }
  let g=ctx.createLinearGradient(gL.x,gL.y,tip.x,tip.y);
  g.addColorStop(0,rc(lp(d,[0,0,0],.2)));g.addColorStop(1,rc(lp(d,[0,0,0],.65)));
  face([gL,ctr,tip],g);
  g=ctx.createLinearGradient(gR.x,gR.y,tip.x,tip.y);
  g.addColorStop(0,rc(m));g.addColorStop(0.5,rc(lp(m,d,.5)));g.addColorStop(1,rc(lp(d,[0,0,0],.35)));
  face([gR,ctr,tip],g);
  g=ctx.createLinearGradient(tL.x,0,gL.x,H*.44);
  g.addColorStop(0,rc(lp(b,[255,255,255],.55)));g.addColorStop(0.45,rc(m));g.addColorStop(1,rc(lp(m,d,.45)));
  face([tL,gL,ctr,tbL],g);
  g=ctx.createLinearGradient(tR.x,0,gR.x,H*.44);
  g.addColorStop(0,rc(lp(m,[255,255,255],.12)));g.addColorStop(0.55,rc(lp(d,b,.45)));g.addColorStop(1,rc(lp(d,[0,0,0],.28)));
  face([tR,gR,ctr,tbR],g);
  g=ctx.createLinearGradient(W*.5,tbL.y,W*.5,H*.44);
  g.addColorStop(0,rc(lp(b,[255,255,255],.5)));g.addColorStop(1,rc(m,.95));
  face([tbL,tbR,ctr],g);
  g=ctx.createLinearGradient(tL.x,0,tR.x,tbR.y);
  g.addColorStop(0,rc([255,255,255],0));g.addColorStop(0.06,rc(hi,.9));
  g.addColorStop(0.3,rc(lp(b,[255,255,255],.6)));g.addColorStop(0.65,rc(b));g.addColorStop(1,rc(lp(b,d,.2)));
  face([tL,tR,tbR,tbL],g);
  [[tL,tbL],[tR,tbR],[tbL,tbR],[tbL,ctr],[tbR,ctr],[tL,gL],[tR,gR],[gL,ctr],[gR,ctr],[gL,tip],[gR,tip]].forEach(([a,b2])=>{
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b2.x,b2.y);
    ctx.strokeStyle=rc([255,255,255],.16);ctx.lineWidth=0.5;ctx.stroke();
  });
  [[tL,tbL],[tL,gL]].forEach(([a,b2])=>{
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b2.x,b2.y);
    ctx.strokeStyle=rc(hi,.5);ctx.lineWidth=0.8;ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(tL.x,0);ctx.lineTo(tR.x,0);ctx.lineTo(gR.x,gR.y);ctx.lineTo(tip.x,tip.y);ctx.lineTo(gL.x,gL.y);ctx.closePath();
  ctx.strokeStyle=rc(lp(b,[255,255,255],.55),.88);ctx.lineWidth=1.2;ctx.stroke();
  [{x:W*.62,y:H*.09,r:W*.045},{x:W*.42,y:H*.20,r:W*.028},{x:W*.68,y:H*.30,r:W*.032}].forEach(({x,y,r})=>{
    const sg=ctx.createRadialGradient(x,y,0,x,y,r);
    sg.addColorStop(0,"rgba(255,255,255,0.88)");sg.addColorStop(0.5,"rgba(255,255,255,0.25)");sg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=sg;ctx.fill();
  });
  const sh=ctx.createRadialGradient(tL.x+W*.1,H*.05,0,tL.x+W*.1,H*.05,W*.35);
  sh.addColorStop(0,"rgba(255,255,255,0.88)");sh.addColorStop(0.2,"rgba(255,255,255,0.38)");
  sh.addColorStop(0.6,"rgba(255,255,255,0.05)");sh.addColorStop(1,"rgba(255,255,255,0)");
  face([tL,{x:W*.6,y:0},tbR,tbL],sh);
  ctx.save();ctx.globalCompositeOperation="lighter";
  const ls=ctx.createLinearGradient(tL.x,0,W*.6,0);
  ls.addColorStop(0,"rgba(255,255,255,0.55)");ls.addColorStop(1,"rgba(255,255,255,0)");
  ctx.strokeStyle=ls;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(tL.x,0);ctx.lineTo(W*.6,0);ctx.stroke();
  ctx.restore();
}

function GemIcon({gemType="diamond",size=28,filled=false}){
  const ref=useRef(null);
  const b=GEM_COLORS[gemType]||GEM_COLORS.diamond;
  useEffect(()=>{drawGem(ref.current,gemType,size,filled);},[gemType,size,filled]);
  return(
    <canvas ref={ref} style={{display:"block",
      filter:filled?`drop-shadow(0 0 ${size*.07}px rgba(${b},1)) drop-shadow(0 0 ${size*.16}px rgba(${b},.65)) drop-shadow(0 2px ${size*.1}px rgba(${b},.4))`:"none"
    }}/>
  );
}

// ── UI 컴포넌트 ────────────────────────────────────────────────
function SectionLabel({children}){return <p className="text-xs tracking-[0.2em] uppercase text-gem-gold font-medium mb-3">{children}</p>;}
function GoldBox({children,className=""}){return <div className={`rounded-2xl border border-gem-gold/30 p-5 ${className}`}>{children}</div>;}
function GongPoint({children}){return <div className="border-l-2 border-gem-gold pl-4 py-1 text-sm text-white/80 leading-relaxed">{children}</div>;}

function ProgressBar({current,total,gemType}){
  const pct=Math.round((current/total)*100);
  const b=GEM_COLORS[gemType]||GEM_COLORS.diamond;
  return(
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/50 mb-1"><span>{current}주 완료</span><span>{total}주</span></div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,backgroundColor:`rgb(${b})`}}/>
      </div>
    </div>
  );
}

function GemstoneGrid({completedWeeks=0,gemType="diamond"}){
  return(
    <GoldBox>
      <SectionLabel>젬스톤 수집</SectionLabel>
      <p className="text-xs text-white/40 mb-4">주차 미션을 완료하면 보석이 채워집니다</p>
      <div className="grid grid-cols-8 gap-2">
        {Array.from({length:24},(_,i)=>(
          <div key={i} className="flex items-center justify-center" title={`${i+1}주차`}>
            <GemIcon gemType={gemType} size={28} filled={i<completedWeeks}/>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/30 mt-3 text-right">{completedWeeks} / 24 완료</p>
    </GoldBox>
  );
}

function MissionSection({data}){
  if(!data)return null;
  const{weekNumber,weekTheme,whyMission,childMission,childMissionAlt,parentMission,schoolConnection,gemTip,gongPoint,parentCare,nextWeekPreview,gemType}=data;
  const b=GEM_COLORS[gemType]||GEM_COLORS.diamond;
  const color=`rgb(${b})`;
  const label=GEM_LABELS[gemType]||"다이아몬드";
  return(
    <div className="space-y-4">
      <div className="rounded-2xl p-5 flex items-center justify-between"
        style={{background:`linear-gradient(135deg,rgba(${b},0.12) 0%,transparent 100%)`,border:`1px solid rgba(${b},0.35)`}}>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{color}}>Week {weekNumber}</p>
          <h2 className="text-xl font-semibold text-white">{weekTheme}</h2>
          <p className="text-xs text-white/40 mt-0.5">{label} · {GEM_SUBTITLES[gemType]}</p>
        </div>
        <GemIcon gemType={gemType} size={48} filled/>
      </div>
      <GoldBox><SectionLabel>왜 이 미션인가</SectionLabel><p className="text-sm text-white/75 leading-relaxed">{whyMission}</p></GoldBox>
      <GoldBox><SectionLabel>아이 미션</SectionLabel><p className="text-sm text-white/85 leading-relaxed">{childMission}</p></GoldBox>
      {childMissionAlt&&<GoldBox><SectionLabel>아이 미션 · 대체</SectionLabel><p className="text-sm text-white/75 leading-relaxed">{childMissionAlt}</p></GoldBox>}
      <GoldBox><SectionLabel>부모 미션</SectionLabel><p className="text-sm text-white/85 leading-relaxed">{parentMission}</p></GoldBox>
      {schoolConnection&&<GoldBox><SectionLabel>입학 연결</SectionLabel><p className="text-sm text-white/75 leading-relaxed">{schoolConnection}</p></GoldBox>}
      {gemTip&&(
        <div className="rounded-2xl p-5" style={{background:`rgba(${b},0.08)`,border:`1px solid rgba(${b},0.25)`}}>
          <p className="text-xs tracking-[0.2em] uppercase font-medium mb-3" style={{color}}>💎 {label} 기질 아이라면</p>
          <p className="text-sm leading-relaxed" style={{color:`rgba(${b},0.9)`}}>{gemTip}</p>
        </div>
      )}
      {gongPoint&&<div className="px-1"><GongPoint>{gongPoint}</GongPoint></div>}
      {parentCare&&<GoldBox><SectionLabel>부모 마음 케어</SectionLabel><p className="text-sm text-white/75 leading-relaxed italic">{parentCare}</p></GoldBox>}
      {nextWeekPreview&&(
        <GoldBox>
          <SectionLabel>다음 주 예고</SectionLabel>
          <p className="text-sm text-white/75 leading-relaxed">{nextWeekPreview}</p>
        </GoldBox>
      )}
    </div>
  );
}

// ── Q&A ──────────────────────────────────────────────────────
function getSubmitStatus(){
  const day=new Date().getDay();
  if(day===2)return{canSubmit:true,notice:"today"};
  if(day===3)return{canSubmit:false,notice:"waiting"};
  if(day===4)return{canSubmit:false,notice:"answerDay"};
  return{canSubmit:false,notice:"nextTuesday"};
}
function formatDate(timestamp){
  if(!timestamp)return"";
  const d=timestamp.toDate?timestamp.toDate():new Date(timestamp);
  return`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}
function NoticeBanner({notice}){
  const config={
    today:{text:"오늘(화요일) 자정까지 질문을 제출하세요. 목요일 자정까지 답변드립니다.",color:"#C9A84C",bg:"rgba(201,168,76,0.1)"},
    waiting:{text:"질문이 접수되었습니다. 목요일 자정까지 답변드립니다.",color:"#93C5FD",bg:"rgba(147,197,253,0.08)"},
    answerDay:{text:"오늘(목요일)은 답변일입니다. 아래에서 답변을 확인하세요.",color:"#34D399",bg:"rgba(52,211,153,0.08)"},
    nextTuesday:{text:"질문 제출은 매주 화요일 자정까지입니다.",color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.04)"},
  };
  const c=config[notice]||config.nextTuesday;
  return<div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{background:c.bg,color:c.color,border:`1px solid ${c.color}30`}}>{c.text}</div>;
}
function QnACard({item}){
  const[open,setOpen]=useState(false);
  const hasAnswer=!!item.answer;
  return(
    <div className="rounded-2xl border overflow-hidden"
      style={{borderColor:hasAnswer?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.08)",background:hasAnswer?"rgba(201,168,76,0.04)":"rgba(255,255,255,0.02)"}}>
      <button className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left" onClick={()=>setOpen(!open)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-medium tracking-wider px-2 py-0.5 rounded-full"
              style={hasAnswer?{background:"rgba(201,168,76,0.2)",color:"#C9A84C"}:{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.35)"}}>
              {hasAnswer?"답변 완료":"답변 대기"}
            </span>
            <span className="text-[10px] text-white/25">{item.weekNumber&&`${item.weekNumber}주차 ·`} {formatDate(item.createdAt)}</span>
          </div>
          <p className="text-sm text-white/80 leading-snug line-clamp-2">{item.question}</p>
        </div>
        <span className="text-white/30 text-xs mt-1 flex-shrink-0" style={{transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
      </button>
      {open&&(
        <div className="px-5 pb-4">
          {hasAnswer?(
            <div className="border-t border-white/5 pt-4">
              <p className="text-[10px] tracking-wider text-gem-gold/60 mb-2">해온 코치 · {formatDate(item.answeredAt)}</p>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{item.answer}</p>
            </div>
          ):(
            <div className="border-t border-white/5 pt-4"><p className="text-xs text-white/25 italic">목요일 자정까지 답변드립니다.</p></div>
          )}
        </div>
      )}
    </div>
  );
}
function QnATab({clientId,currentWeek=1}){
  const[question,setQuestion]=useState("");
  const[submitting,setSubmitting]=useState(false);
  const[submitted,setSubmitted]=useState(false);
  const[error,setError]=useState("");
  const[qnaList,setQnaList]=useState([]);
  const[loading,setLoading]=useState(true);
  const{canSubmit,notice}=getSubmitStatus();
  useEffect(()=>{
    if(!clientId){setLoading(false);return;}
    const q=query(collection(db,"clients",clientId,"qna"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{setQnaList(snap.docs.map(d=>({id:d.id,...d.data()})));setLoading(false);},()=>setLoading(false));
    return()=>unsub();
  },[clientId]);
  const handleSubmit=async()=>{
    if(!question.trim()||!clientId)return;
    if(question.trim().length<5){setError("질문을 5자 이상 입력해주세요.");return;}
    setSubmitting(true);setError("");
    try{
      await addDoc(collection(db,"clients",clientId,"qna"),{question:question.trim(),createdAt:serverTimestamp(),answer:null,answeredAt:null,weekNumber:currentWeek});
      setQuestion("");setSubmitted(true);setTimeout(()=>setSubmitted(false),4000);
    }catch{setError("제출 중 오류가 발생했습니다. 다시 시도해주세요.");}
    finally{setSubmitting(false);}
  };
  const answered=qnaList.filter(q=>q.answer);
  const pending=qnaList.filter(q=>!q.answer);
  return(
    <div className="space-y-5">
      <NoticeBanner notice={notice}/>
      <div className="rounded-2xl border p-5" style={{borderColor:"rgba(201,168,76,0.3)"}}>
        <SectionLabel>질문 제출</SectionLabel>
        <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-gem-gold/50 transition-colors" rows={4}
          placeholder={canSubmit?"이번 주 미션 중 궁금하신 점을 남겨주세요.":"질문 제출은 매주 화요일에 가능합니다."}
          value={question} onChange={e=>{setQuestion(e.target.value);setError("");}} disabled={!canSubmit||submitting} maxLength={500}/>
        <p className="text-right text-[10px] text-white/20 mt-1">{question.length} / 500</p>
        {error&&<p className="text-xs text-red-400/80 mt-1">{error}</p>}
        <button onClick={handleSubmit} disabled={!canSubmit||!question.trim()||submitting}
          className="mt-3 w-full py-3 rounded-xl text-sm font-medium tracking-wider transition-all"
          style={{background:canSubmit&&question.trim()&&!submitting?"linear-gradient(135deg,#C9A84C,#a07c30)":"rgba(255,255,255,0.05)",
            color:canSubmit&&question.trim()&&!submitting?"#0A0F1E":"rgba(255,255,255,0.2)",
            cursor:canSubmit&&question.trim()&&!submitting?"pointer":"default"}}>
          {submitting?"제출 중...":submitted?"제출 완료 ✓":"질문 제출하기"}
        </button>
      </div>
      {pending.length>0&&<div className="space-y-3"><p className="text-xs tracking-[0.15em] uppercase text-white/30 font-medium">답변 대기 · {pending.length}건</p>{pending.map(item=><QnACard key={item.id} item={item}/>)}</div>}
      {answered.length>0&&<div className="space-y-3"><p className="text-xs tracking-[0.15em] uppercase text-white/30 font-medium">답변 완료 · {answered.length}건</p>{answered.map(item=><QnACard key={item.id} item={item}/>)}</div>}
      {!loading&&qnaList.length===0&&<div className="text-center py-12"><p className="text-white/20 text-sm">아직 제출된 질문이 없습니다.</p><p className="text-white/15 text-xs mt-1">매주 화요일에 질문을 제출하시면 목요일에 답변드립니다.</p></div>}
      {loading&&<div className="text-center py-8 text-white/20 text-sm">불러오는 중...</div>}
    </div>
  );
}

// ── 메인 대시보드 ────────────────────────────────────────────
export default function ClientDashboard({user}){
  const[activeTab,setActiveTab]=useState("mission");
  const[clientData,setClientData]=useState(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    const fetchData=async()=>{
      try{
        if(!user?.uid)return;
        const snap=await getDoc(doc(db,"clients",user.uid));
        if(snap.exists()) setClientData(snap.data());
      }catch(e){console.error(e);}
      finally{setLoading(false);}
    };
    fetchData();
  },[user]);

  const gemType=clientData?.gemType||"diamond";
  const childName=clientData?.childName||"아이";
  const currentWeek=clientData?.currentWeek||1;
  const completedWeeks=clientData?.completedWeeks||0;
  const b=GEM_COLORS[gemType];

  // Firestore weeks 대신 코드 내장 데이터 사용
  const weekData=getCurriculumWeek(gemType,currentWeek);

  if(loading)return(
    <div className="min-h-screen bg-gem-navy flex items-center justify-center">
      <div className="text-center space-y-3"><GemIcon gemType="diamond" size={40} filled/><p className="text-white/40 text-sm tracking-widest">로딩 중</p></div>
    </div>
  );

  return(
    <div className="min-h-screen bg-gem-navy text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5" style={{background:"rgba(10,15,30,0.92)"}}>
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GemIcon gemType={gemType} size={22} filled/>
            <div>
              <p className="text-xs text-white/35 tracking-[0.15em]">THE GEM</p>
              <p className="text-sm font-semibold tracking-wide text-white/90">{childName}의 세공 공방</p>
            </div>
          </div>
          <button onClick={()=>signOut(auth)} className="text-xs text-white/30 hover:text-white/60 transition-colors tracking-wider">로그아웃</button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-6 pb-24 space-y-6">

        {/* 보석 카드 */}
        <div className="rounded-2xl p-6"
          style={{background:`linear-gradient(135deg,rgba(${b},0.14) 0%,rgba(10,15,30,0) 70%)`,border:`1px solid rgba(${b},0.3)`}}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-white/35 mb-1">{childName}의 보석</p>
              <h1 className="text-3xl font-bold tracking-wide" style={{color:`rgb(${b})`}}>{GEM_LABELS[gemType]}</h1>
              <p className="text-sm text-white/40 mt-1">{GEM_SUBTITLES[gemType]}</p>
            </div>
            <GemIcon gemType={gemType} size={64} filled/>
          </div>
          <ProgressBar current={completedWeeks} total={24} gemType={gemType}/>
          <p className="text-xs text-white/25 mt-2 text-right">{currentWeek}주차 진행 중</p>
        </div>

        {/* 젬스톤 수집 */}
        <GoldBox>
          <SectionLabel>젬스톤 수집</SectionLabel>
          <p className="text-xs text-white/40 mb-4">미션을 완료하면 보석이 하나씩 채워집니다</p>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({length:24},(_,i)=>(
              <div key={i} className="flex items-center justify-center" title={`${i+1}주차`}>
                <GemIcon gemType={gemType} size={28} filled={i<completedWeeks}/>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-3 text-right">{completedWeeks} / 24 완료</p>
        </GoldBox>

        {/* 탭 */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5">
          {[{key:"mission",label:"이번 주 미션"},{key:"qna",label:"Q&A"}].map(tab=>(
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={activeTab===tab.key?{background:`rgb(${b})`,color:"#0A0F1E"}:{color:"rgba(255,255,255,0.4)"}}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab==="mission"?<MissionSection data={weekData}/>:<QnATab clientId={user?.uid} currentWeek={currentWeek}/>}
      </div>
    </div>
  );
}