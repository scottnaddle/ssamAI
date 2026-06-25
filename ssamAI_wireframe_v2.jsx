import { useState } from "react";

const C = {
  bg: "#FBF8F3",
  sidebar: "#FFFDF9",
  primary: "#3D6B4F",
  primaryLight: "#EAF2EC",
  primaryMid: "#5A8F6E",
  accent: "#D97B3A",
  accentLight: "#FDF0E6",
  text: "#2C2C2C",
  textMid: "#5C5C5C",
  textLight: "#9A9A9A",
  border: "#E8E2D9",
  white: "#FFFFFF",
  tagBlue: "#E8F0FE",
  tagGreen: "#E6F4EA",
  tagOrange: "#FEF3E8",
  tagPurple: "#F3E8FD",
  userBubble: "#EAF2EC",
};

const Avatar = ({ name, size = 32, color = C.accent }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: `linear-gradient(135deg, ${color}, #E8A87C)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.44, color: "#fff", fontWeight: 700, flexShrink: 0,
  }}>{name[0]}</div>
);

const NavItem = ({ icon, label, active, badge, onClick }) => (
  <div onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
    borderRadius: 10, cursor: "pointer", marginBottom: 2,
    background: active ? C.primaryLight : "transparent",
    color: active ? C.primary : C.textMid,
    fontWeight: active ? 600 : 400, fontSize: 13.5,
  }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ flex: 1 }}>{label}</span>
    {badge && <span style={{ background: C.accent, color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{badge}</span>}
  </div>
);

// ─── Chat View ──────────────────────────────────────────
function ChatView() {
  const msgs = [
    { role: "user", text: "3학년 2반 광합성 단원 PPT 만들어줘. 실험 활동 포함, 15장.", time: "2:30" },
    { role: "ai", text: "작년 광반응 실험 활동지 스타일 참고해서 구성할게요. 슬라이드 15장으로 잡았습니다.", time: "2:31", card: true },
    { role: "user", text: "8번 슬라이드에 실험 사진도 넣어줘.", time: "2:33", file: "실험_사진_2023.jpg" },
    { role: "ai", text: "8번 슬라이드에 사진 삽입 완료! 관찰 결과 기록란도 추가했어요.", time: "2:34" },
  ];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Chat column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
              {m.role === "ai" && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🌿</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.primary }}>ssamAI</span>
                  <span style={{ fontSize: 11, color: C.textLight }}>{m.time}</span>
                </div>
              )}
              {m.file && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.accentLight, border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px", marginBottom: 5, fontSize: 12 }}>
                  🖼 {m.file}
                </div>
              )}
              <div style={{
                maxWidth: "76%", background: m.role === "user" ? C.userBubble : C.white,
                border: m.role === "ai" ? `1px solid ${C.border}` : "none",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "10px 14px", fontSize: 13.5, lineHeight: 1.6, color: C.text,
                boxShadow: m.role === "ai" ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
              }}>
                {m.text}
                {m.card && (
                  <div style={{ marginTop: 10, background: C.bg, borderRadius: 9, padding: "10px 12px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 6 }}>📊 슬라이드 구성 (15장)</div>
                    {["1–2장. 도입 & 탐구 질문", "3–5장. 광합성 개념 + 반응식", "6–8장. 실험 설계 & 관찰", "9–11장. 결과 분석 워크시트", "12–15장. 정리 & 심화 토론"].map((s, j) => (
                      <div key={j} style={{ fontSize: 11.5, color: C.textMid, padding: "3px 0", borderBottom: j < 4 ? `1px solid ${C.border}` : "none" }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "ai" && m.card && (
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {["📥 PPT 다운로드", "🔗 커뮤니티에 공유", "✏️ 추가 수정"].map((b, j) => (
                    <button key={j} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 18, padding: "5px 12px", fontSize: 11.5, color: C.text, cursor: "pointer", fontWeight: 500 }}>{b}</button>
                  ))}
                </div>
              )}
              {m.role === "user" && <span style={{ fontSize: 11, color: C.textLight, marginTop: 3 }}>{m.time}</span>}
            </div>
          ))}
        </div>
        {/* Input */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, background: C.white }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {["📊 PPT 만들기", "✏️ 자료 수정", "📝 행정 문서", "🔗 공유 자료 가져오기"].map((c, i) => (
              <button key={i} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 18, padding: "4px 11px", fontSize: 11.5, color: C.textMid, cursor: "pointer" }}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: C.bg, borderRadius: 13, border: `1.5px solid ${C.border}`, padding: "9px 12px" }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMid }}>📎</button>
            <textarea placeholder="수업 자료 생성, 수정, 질문을 자유롭게 입력하세요..." style={{ flex: 1, border: "none", background: "transparent", resize: "none", fontSize: 13.5, color: C.text, outline: "none", lineHeight: 1.5, minHeight: 40, fontFamily: "inherit" }} rows={2} />
            <button style={{ background: C.primary, border: "none", borderRadius: 9, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15, color: "#fff" }}>↑</button>
          </div>
        </div>
      </div>
      {/* Right panel */}
      <div style={{ width: 252, borderLeft: `1px solid ${C.border}`, background: C.sidebar, overflowY: "auto", padding: "18px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, marginBottom: 8, letterSpacing: 0.5 }}>🧠 ssamAI가 기억하는 나</div>
        {[["담당 과목", "과학 (3·4학년)"], ["교육 스타일", "실험·탐구 중심"], ["현재 학급", "3학년 2반 (28명)"]].map(([l, v], i) => (
          <div key={i} style={{ background: C.primaryLight, borderRadius: 8, padding: "6px 10px", marginBottom: 5 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.primaryMid }}>{l}</div>
            <div style={{ fontSize: 12, color: C.text }}>{v}</div>
          </div>
        ))}
        <div style={{ marginTop: 18, marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.textLight, letterSpacing: 0.5 }}>📂 연관 자료</div>
        {[["📊", "광합성_실험_2023.pptx", "PPT"], ["📄", "광반응_활동지.hwp", "HWP"], ["📊", "생태계_단원.pptx", "PPT"]].map(([ic, nm, tag], i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 7, cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>{ic}</span>
            <span style={{ flex: 1, fontSize: 12, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nm}</span>
            <span style={{ background: tag === "PPT" ? C.tagBlue : C.tagGreen, color: tag === "PPT" ? "#1967D2" : "#137333", borderRadius: 5, padding: "1px 7px", fontSize: 10, fontWeight: 600 }}>{tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Community View ───────────────────────────────────────
function CommunityView() {
  const [subTab, setSubTab] = useState("feed");

  const posts = [
    { teacher: "박준호", school: "OO중학교", subject: "수학", file: "2학기_이차함수_실생활연결.pptx", tag: "PPT", desc: "교과서 개념을 실생활 사례로 풀어낸 PPT예요. 함수 단원 첫 차시에 써보세요!", likes: 48, saves: 21, comments: 7, time: "2시간 전", color: "#4A7CBF" },
    { teacher: "이수진", school: "OO초등학교", subject: "국어", file: "독서_토론_활동지_4학년.hwp", tag: "HWP", desc: "그림책 읽고 토론하는 활동지입니다. 의견 나누기 + 근거 쓰기 포함.", likes: 33, saves: 15, comments: 4, time: "어제", color: "#8B5E9E" },
    { teacher: "최민준", school: "OO고등학교", subject: "영어", file: "수능_독해전략_마인드맵.pptx", tag: "PPT", desc: "EBS 지문 기반 독해 전략 시각화 자료. 3학년 수능 대비 수업에 활용 중!", likes: 62, saves: 38, comments: 12, time: "2일 전", color: "#4A7CBF" },
  ];

  const dms = [
    { name: "이수진", preview: "혹시 광합성 단원 자료 공유해 주실 수 있나요?", time: "10분 전", unread: 2, color: "#8B5E9E" },
    { name: "박준호", preview: "[공동편집 초대] 2학기 통합 수행평가 계획서", time: "1시간 전", unread: 0, color: "#4A7CBF" },
    { name: "최민준", preview: "피드 자료 정말 도움됐습니다 감사해요 😊", time: "어제", unread: 0, color: "#3D7A6B" },
  ];

  const collab = [
    { title: "2학기 과학 단원 통합 수업 계획서", members: ["김지영", "박준호", "이수진"], status: "편집 중", updated: "방금 전" },
    { title: "1학기 체험학습 가정통신문 (공동)", members: ["김지영", "최민준"], status: "검토 대기", updated: "어제" },
  ];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Sub tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.white, padding: "0 20px" }}>
          {[["feed", "🌐 피드"], ["collab", "✏️ 공동작업"], ["messages", "💬 메시지"]].map(([id, label]) => (
            <div key={id} onClick={() => setSubTab(id)} style={{
              padding: "10px 16px", fontSize: 13, cursor: "pointer",
              fontWeight: subTab === id ? 700 : 400,
              color: subTab === id ? C.primary : C.textMid,
              borderBottom: subTab === id ? `2px solid ${C.primary}` : "2px solid transparent",
              marginBottom: -1,
            }}>{label}</div>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{ background: C.primary, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#fff", cursor: "pointer", margin: "auto 0", fontWeight: 600 }}>+ 자료 공유하기</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>

          {subTab === "feed" && (
            <>
              {/* Filter bar */}
              <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
                {["전체", "초등", "중학교", "고등학교", "과학", "수학", "국어", "영어"].map((f, i) => (
                  <button key={i} style={{ border: `1px solid ${i === 0 ? C.primary : C.border}`, background: i === 0 ? C.primaryLight : C.white, borderRadius: 18, padding: "5px 13px", fontSize: 12, color: i === 0 ? C.primary : C.textMid, cursor: "pointer", fontWeight: i === 0 ? 600 : 400 }}>{f}</button>
                ))}
              </div>

              {posts.map((p, i) => (
                <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <Avatar name={p.teacher} color={p.color} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{p.teacher} 선생님</div>
                      <div style={{ fontSize: 11.5, color: C.textLight }}>{p.school} · {p.subject} · {p.time}</div>
                    </div>
                    <span style={{ background: p.tag === "PPT" ? C.tagBlue : C.tagGreen, color: p.tag === "PPT" ? "#1967D2" : "#137333", borderRadius: 6, padding: "2px 9px", fontSize: 11, fontWeight: 600 }}>{p.tag}</span>
                  </div>
                  {/* File card */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.bg, borderRadius: 10, padding: "10px 14px", marginBottom: 9 }}>
                    <span style={{ fontSize: 22 }}>{p.tag === "PPT" ? "📊" : "📄"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.file}</div>
                    </div>
                    <button style={{ background: C.primary, border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11.5, color: "#fff", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>내 자료로 가져오기</button>
                  </div>
                  <p style={{ fontSize: 13, color: C.textMid, margin: "0 0 12px", lineHeight: 1.5 }}>{p.desc}</p>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {[`❤️ ${p.likes}`, `🔖 ${p.saves}`, `💬 ${p.comments}`].map((btn, j) => (
                      <button key={j} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 18, padding: "4px 11px", fontSize: 12, color: C.textMid, cursor: "pointer" }}>{btn}</button>
                    ))}
                    <button style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 18, padding: "4px 11px", fontSize: 12, color: C.primary, cursor: "pointer", marginLeft: "auto", fontWeight: 500 }}>🤖 이 자료로 AI 조교에게 질문</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {subTab === "collab" && (
            <>
              <div style={{ marginBottom: 16, fontSize: 14, color: C.textMid }}>함께 편집 중인 자료를 확인하고 AI 제안을 수락/거절하세요.</div>
              {collab.map((c, i) => (
                <div key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 26, flexShrink: 0 }}>📝</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{c.title}</div>
                      <div style={{ display: "flex", gap: -6, marginBottom: 8 }}>
                        {c.members.map((m, j) => (
                          <div key={j} style={{ width: 26, height: 26, borderRadius: "50%", background: [C.primary, C.accent, "#8B5E9E"][j % 3], border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, marginLeft: j > 0 ? -6 : 0 }}>{m[0]}</div>
                        ))}
                        <span style={{ fontSize: 12, color: C.textLight, marginLeft: 10, lineHeight: "26px" }}>{c.members.join(", ")}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: c.status === "편집 중" ? C.primaryLight : C.accentLight, color: c.status === "편집 중" ? C.primary : C.accent, borderRadius: 6, padding: "2px 9px", fontSize: 11.5, fontWeight: 600 }}>{c.status}</span>
                        <span style={{ fontSize: 11.5, color: C.textLight }}>업데이트: {c.updated}</span>
                      </div>
                    </div>
                    <button style={{ background: C.primary, border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, color: "#fff", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>편집 열기</button>
                  </div>
                  {c.status === "편집 중" && (
                    <div style={{ marginTop: 12, background: C.bg, borderRadius: 10, padding: "10px 12px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.primaryMid, marginBottom: 6 }}>🤖 AI 조교 제안 (3건 대기 중)</div>
                      <div style={{ fontSize: 12.5, color: C.text, marginBottom: 8 }}>3페이지 — "학습 목표" 문구를 학생 친화적으로 수정 제안</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={{ background: C.primary, border: "none", borderRadius: 7, padding: "4px 12px", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 600 }}>✓ 수락</button>
                        <button style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 12px", fontSize: 12, color: C.textMid, cursor: "pointer" }}>✕ 거절</button>
                        <button style={{ background: "none", border: "none", color: C.primaryMid, fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>전체 제안 보기 →</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button style={{ width: "100%", border: `2px dashed ${C.border}`, background: "none", borderRadius: 14, padding: "16px", fontSize: 13.5, color: C.textMid, cursor: "pointer" }}>+ 새 공동 작업 시작</button>
            </>
          )}

          {subTab === "messages" && (
            <>
              <div style={{ marginBottom: 14 }}>
                <input placeholder="선생님 검색..." style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13.5, outline: "none", background: C.bg, boxSizing: "border-box" }} />
              </div>
              {dms.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.white, border: `1px solid ${C.border}`, borderRadius: 13, marginBottom: 8, cursor: "pointer" }}>
                  <Avatar name={d.name} color={d.color} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{d.name} 선생님</div>
                    <div style={{ fontSize: 12.5, color: C.textMid, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.preview}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: C.textLight }}>{d.time}</span>
                    {d.unread > 0 && <span style={{ background: C.accent, color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{d.unread}</span>}
                  </div>
                </div>
              ))}
              <button style={{ width: "100%", border: `2px dashed ${C.border}`, background: "none", borderRadius: 13, padding: "14px", fontSize: 13, color: C.textMid, cursor: "pointer", marginTop: 4 }}>+ 새 메시지</button>
            </>
          )}
        </div>
      </div>

      {/* Community right panel */}
      <div style={{ width: 230, borderLeft: `1px solid ${C.border}`, background: C.sidebar, overflowY: "auto", padding: "18px 14px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, marginBottom: 10, letterSpacing: 0.5 }}>👥 교원 네트워크</div>
        {[{ name: "이수진", sub: "초등 국어", follow: true, color: "#8B5E9E" }, { name: "박준호", sub: "중등 수학", follow: false, color: "#4A7CBF" }, { name: "최민준", sub: "고등 영어", follow: false, color: "#3D7A6B" }].map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <Avatar name={t.name} size={30} color={t.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{t.name}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{t.sub}</div>
            </div>
            <button style={{ border: `1px solid ${t.follow ? C.border : C.primary}`, background: t.follow ? C.primaryLight : "none", borderRadius: 7, padding: "3px 9px", fontSize: 11, color: t.follow ? C.primary : C.primary, cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>{t.follow ? "팔로잉" : "팔로우"}</button>
          </div>
        ))}
        <div style={{ marginTop: 18, marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.textLight, letterSpacing: 0.5 }}>🔥 인기 자료 태그</div>
        {["#광합성", "#이차함수", "#독서토론", "#수능독해", "#행정서식"].map((tag, i) => (
          <span key={i} style={{ display: "inline-block", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 18, padding: "3px 10px", fontSize: 11.5, color: C.textMid, marginRight: 5, marginBottom: 5, cursor: "pointer" }}>{tag}</span>
        ))}
        <div style={{ marginTop: 18, padding: "12px 14px", background: C.accentLight, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 4 }}>💡 AI 추천</div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>오늘 만든 광합성 PPT,<br />커뮤니티에 공유해볼까요?<br />비슷한 과목 선생님 12명이 관심 가질 것 같아요.</div>
          <button style={{ width: "100%", marginTop: 8, background: C.accent, border: "none", borderRadius: 8, padding: "7px", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 600 }}>공유하기</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function ssamAIApp() {
  const [activeNav, setActiveNav] = useState("chat");

  const navItems = [
    { id: "chat", icon: "💬", label: "AI 조교" },
    { id: "community", icon: "🌐", label: "커뮤니티", badge: "5" },
    { id: "library", icon: "📚", label: "자료 라이브러리" },
    { id: "persona", icon: "🎓", label: "내 페르소나" },
    { id: "settings", icon: "⚙️", label: "설정" },
  ];

  const chatHistory = [
    { label: "3학년 과학 - 광합성 수업", time: "오늘" },
    { label: "가정통신문 - 현장학습 안내", time: "어제" },
    { label: "2학기 수행평가 계획서", time: "6.19" },
    { label: "1학기 기말 문제지 초안", time: "6.15" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif", color: C.text }}>

      {/* Sidebar */}
      <div style={{ width: 235, background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryMid})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🌿</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: C.primary, letterSpacing: -0.3 }}>ssamAI</div>
              <div style={{ fontSize: 10, color: C.textLight }}>AI 교원 조교</div>
            </div>
          </div>
        </div>

        {/* New chat button */}
        <div style={{ padding: "12px 12px 6px" }}>
          <button style={{ width: "100%", padding: "8px 0", background: C.primary, color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <span>+</span> 새 대화 시작
          </button>
        </div>

        {/* Nav */}
        <div style={{ padding: "4px 9px" }}>
          {navItems.map(item => <NavItem key={item.id} {...item} active={activeNav === item.id} onClick={() => setActiveNav(item.id)} />)}
        </div>

        {/* Recent chats */}
        {activeNav === "chat" && (
          <div style={{ padding: "10px 12px 6px", flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: C.textLight, marginBottom: 7, letterSpacing: 0.5 }}>최근 대화</div>
            {chatHistory.map((item, i) => (
              <div key={i} style={{ padding: "6px 7px", borderRadius: 7, cursor: "pointer", marginBottom: 1 }}
                onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ fontSize: 12, color: C.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                <div style={{ fontSize: 10.5, color: C.textLight }}>{item.time}</div>
              </div>
            ))}
          </div>
        )}

        {/* Profile */}
        <div style={{ padding: "11px 13px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9, marginTop: "auto" }}>
          <Avatar name="김" size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>김지영 선생님</div>
            <div style={{ fontSize: 11, color: C.textLight }}>중학교 · 과학</div>
          </div>
          <div style={{ fontSize: 15, color: C.textLight, cursor: "pointer" }}>⋯</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "13px 22px", borderBottom: `1px solid ${C.border}`, background: C.white, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700 }}>
              {activeNav === "chat" && "3학년 과학 — 광합성 수업 자료"}
              {activeNav === "community" && "교원 커뮤니티"}
              {activeNav === "library" && "자료 라이브러리"}
              {activeNav === "persona" && "내 페르소나"}
            </div>
            <div style={{ fontSize: 11.5, color: C.textLight, marginTop: 1 }}>
              {activeNav === "chat" && "오늘 오후 2:34 · Claude Sonnet 사용 중"}
              {activeNav === "community" && "함께 만들고 나누는 교육 자료 공간"}
            </div>
          </div>
          {activeNav === "chat" && (
            <div style={{ display: "flex", gap: 7 }}>
              {["📎 파일 첨부", "🔗 공유"].map((b, i) => (
                <button key={i} style={{ border: `1px solid ${C.border}`, background: C.white, borderRadius: 7, padding: "6px 13px", fontSize: 12, color: C.textMid, cursor: "pointer" }}>{b}</button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs for chat */}
        {activeNav === "chat" && (
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.white, padding: "0 22px" }}>
            {[["💬 대화"], ["🖼 미리보기"], ["📋 수정 이력"]].map(([label], i) => (
              <div key={i} style={{ padding: "10px 16px", fontSize: 13, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? C.primary : C.textMid, borderBottom: i === 0 ? `2px solid ${C.primary}` : "2px solid transparent", cursor: "pointer", marginBottom: -1 }}>{label}</div>
            ))}
          </div>
        )}

        {activeNav === "chat" && <ChatView />}
        {activeNav === "community" && <CommunityView />}
        {(activeNav === "library" || activeNav === "persona") && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textLight, fontSize: 14 }}>
            {activeNav === "library" ? "📚 자료 라이브러리 화면" : "🎓 페르소나 설정 화면"}
          </div>
        )}
      </div>
    </div>
  );
}
