import { useState, useEffect, useMemo } from "react";
 
export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [logTitle, setLogTitle] = useState("");
  const [logContent, setLogContent] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logFeedback, setLogFeedback] = useState("");
 
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
 
  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/payments").then(r => r.json()).catch(e => ({ error: e.message, items: [] })),
      fetch("/api/projects").then(r => r.json()).catch(e => ({ error: e.message, items: [] })),
      fetch("/api/today").then(r => r.json()).catch(e => ({ error: e.message })),
    ]).then(([payData, projData, todayRes]) => {
      if (payData.error) setError(payData.error);
      else { setItems(payData.items || []); setError(null); }
      setProjects(projData.items || []);
      if (todayRes && !todayRes.error) setTodayData(todayRes);
      else setTodayData(null);
      setLoading(false);
    }).catch(err => { setError(err.message); setLoading(false); });
  };
 
  useEffect(() => { fetchAll(); }, []);
 
  const toggleComplete = async (item) => {
    const prev = item.status;
    const newDone = item.status !== "완료";
    setUpdatingItems(p => new Set(p).add(item.id));
    setItems(p => p.map(i => i.id === item.id ? { ...i, status: newDone ? "완료" : "예정" } : i));
    // V6.3 — todayData 옵티미스틱 업데이트 (할 일 체크박스 즉시 반영)
    setTodayData(prev => prev ? {
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === item.id ? { ...t, status: newDone ? "완료" : "예정" } : t),
      payments: (prev.payments || []).map(p => p.id === item.id ? { ...p, status: newDone ? "완료" : "예정" } : p),
      deadlines: (prev.deadlines || []).map(d => d.id === item.id ? { ...d, status: newDone ? "완료" : "예정" } : d),
    } : prev);
    try {
      const res = await fetch("/api/update-status", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: item.id, completed: newDone }),
      });
      const d = await res.json();
      if (d.error) { setItems(p => p.map(i => i.id === item.id ? { ...i, status: prev } : i)); alert("실패: " + d.error); }
    } catch (err) { setItems(p => p.map(i => i.id === item.id ? { ...i, status: prev } : i)); alert("실패: " + err.message); }
    finally { setUpdatingItems(p => { const n = new Set(p); n.delete(item.id); return n; }); }
  };
 
  const submitLog = async () => {
    if (!logContent.trim()) return;
    setLogSubmitting(true); setLogFeedback("");
    try {
      const res = await fetch("/api/work-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: logTitle, content: logContent }) });
      const d = await res.json();
      if (d.error) setLogFeedback("❌ " + d.error);
      else { setLogFeedback("✅ 노션 CEO SAAS에 저장됐어요"); setLogTitle(""); setLogContent(""); setTimeout(() => { setLogFeedback(""); setModal(null); }, 1500); }
    } catch (err) { setLogFeedback("❌ " + err.message); }
    finally { setLogSubmitting(false); }
  };
 
  const submitAddPayment = async () => {
    if (!modalData.title || !modalData.date) { alert("제목과 날짜는 필수"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/create-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(modalData) });
      const d = await res.json();
      if (d.error) alert("저장 실패: " + d.error);
      else { setModal(null); setModalData({}); fetchAll(); }
    } catch (err) { alert("저장 실패: " + err.message); }
    finally { setSubmitting(false); }
  };
 
  const submitEditProject = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/update-project", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(modalData) });
      const d = await res.json();
      if (d.error) alert("저장 실패: " + d.error);
      else { setModal(null); setModalData({}); fetchAll(); }
    } catch (err) { alert("저장 실패: " + err.message); }
    finally { setSubmitting(false); }
  };
 
  const calcDDay = (dateStr) => { if (!dateStr) return null; const t = new Date(dateStr); t.setHours(0,0,0,0); return Math.round((t - today) / 86400000); };
  const fmtAmount = (num) => { if (!num) return "0"; if (num >= 100000000) return `${(num/100000000).toFixed(2)}억`; if (num >= 10000) return `${Math.round(num/10000).toLocaleString("ko-KR")}만`; return num.toLocaleString("ko-KR"); };
  const fmtDate = (dateStr) => { if (!dateStr) return ""; const d = new Date(dateStr); return `${d.getMonth()+1}/${d.getDate()}`; };
 
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => (i.title||"").toLowerCase().includes(q) || (i.vendor||"").toLowerCase().includes(q) || (i.category||"").toLowerCase().includes(q));
  }, [items, searchQuery]);
 
  const todayMonth = today.toISOString().substring(0, 7);
  const monthItems = filteredItems.filter(i => i.date && i.date.startsWith(todayMonth));
  const monthDep = monthItems.filter(i => i.type === "입금").reduce((s,i) => s + (i.amount||0), 0);
  const monthWd = monthItems.filter(i => i.type === "출금").reduce((s,i) => s + (i.amount||0), 0);
  const monthNet = monthDep - monthWd;
  const monthUpcomingDep = monthItems.filter(i => i.type === "입금" && i.status !== "완료" && calcDDay(i.date) >= 0).reduce((s,i) => s + (i.amount||0), 0);
  const monthUpcomingWd = monthItems.filter(i => i.type === "출금" && i.status !== "완료" && calcDDay(i.date) >= 0).reduce((s,i) => s + (i.amount||0), 0);
 
  const missionTarget = 450000000;
  const missionDate = useMemo(() => { const d = new Date("2026-06-15"); d.setHours(0,0,0,0); return d; }, []);
  const missionDDay = Math.round((missionDate - today) / 86400000);
  const missionPct = Math.min((monthDep / missionTarget) * 100, 100);
 
  const bucket = (min, max) => filteredItems.filter(i => { const d = calcDDay(i.date); return d !== null && d >= min && d <= max; }).sort((a,b) => new Date(a.date) - new Date(b.date));
  const tomorrowBucket = bucket(1, 1);
  const thisWeekBucket = bucket(2, 7);
  const next15Bucket = bucket(8, 15);
 
  const calendar = useMemo(() => {
    const year = today.getFullYear(); const month = today.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const eventsByDate = {};
    items.forEach(item => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!eventsByDate[day]) eventsByDate[day] = [];
        eventsByDate[day].push(item);
      }
    });
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, events: eventsByDate[day] || [], isToday: day === today.getDate(), date: `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}` });
    }
    return { cells, monthName: today.toLocaleDateString("ko-KR", { year: "numeric", month: "long" }) };
  }, [items, today]);
 
  const iconFor = (item) => {
    const t = (item.title||"").toLowerCase(); const v = (item.vendor||"").toLowerCase(); const c = item.category||"";
    if (t.includes("자사몰") || v.includes("자사몰")) return "🛒";
    if (t.includes("푸드메이커스") || v.includes("푸드메이커스")) return "🏭";
    if (t.includes("스마트스토어")) return "🏪";
    if (t.includes("롯데홈쇼핑") || t.includes("우리홈쇼핑")) return "📺";
    if (t.includes("인스타") || t.includes("공구")) return "📣";
    if (t.includes("소원상사")) return "📦";
    if (t.includes("key-biz")) return "🔄";
    if (t.includes("청년창업") || t.includes("정책자금")) return "🏛️";
    if (t.includes("kb") || t.includes("하나카드") || t.includes("기업bc")) return "💳";
    if (t.includes("임대료") || t.includes("관리비")) return "🏢";
    if (t.includes("급여") || t.includes("곽영") || t.includes("4대보험")) return "👤";
    if (t.includes("쿠콘") || t.includes("렌탈")) return "🖥️";
    if (t.includes("텐밀리언") || t.includes("ppl") || t.includes("유튜")) return "🎬";
    if (t.includes("마케팅")) return "📊";
    if (t.includes("lgu") || t.includes("인터넷")) return "📡";
    if (t.includes("cj") || t.includes("물류")) return "🚚";
    if (t.includes("나이스") || t.includes("세무")) return "🧾";
    if (c === "매출 정산") return "💰"; if (c === "대출 상환") return "🏦";
    return "📌";
  };
 
  // V6 — 압축형 항목 렌더 (한 줄에 빽빽이)
  const renderItemCompact = (item) => {
    const dday = calcDDay(item.date); const isIncome = item.type === "입금";
    const isDone = item.status === "완료"; const isUpdating = updatingItems.has(item.id);
    const ddayLabel = dday === 0 ? "오늘" : dday === 1 ? "내일" : `D-${dday}`;
    const ddayColor = dday <= 1 ? "#ef4444" : dday <= 3 ? "#f59e0b" : "#94a3b8";
    return (
      <div key={item.id} style={{ ...s.itemCompact, borderLeft: `3px solid ${isIncome ? "#10b981" : "#ef4444"}`, opacity: isDone ? 0.4 : 1 }}>
        <input type="checkbox" checked={isDone} onChange={() => toggleComplete(item)} disabled={isUpdating} style={s.checkbox} />
        <div style={s.itemCompactIcon}>{iconFor(item)}</div>
        <div style={s.itemCompactMain}>
          <div style={{ ...s.itemCompactTitle, textDecoration: isDone ? "line-through" : "none", color: isDone ? "#94a3b8" : "#0f172a" }}>{item.title}</div>
          <div style={s.itemCompactMeta}>
            <span style={{ color: ddayColor, fontWeight: 700 }}>{ddayLabel}</span>
            <span style={s.itemDot}>·</span><span>{fmtDate(item.date)}</span>
            {item.vendor && (<><span style={s.itemDot}>·</span><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.vendor}</span></>)}
          </div>
        </div>
        <div style={{ ...s.itemCompactAmount, color: isDone ? "#94a3b8" : isIncome ? "#10b981" : "#ef4444", textDecoration: isDone ? "line-through" : "none" }}>
          {isIncome ? "+" : "−"}{fmtAmount(item.amount)}
        </div>
      </div>
    );
  };
 
  const renderBucketBox = (title, list, emoji, accentColor) => {
    const dep = list.filter(i => i.type === "입금").reduce((sum,i) => sum + (i.amount||0), 0);
    const wd = list.filter(i => i.type === "출금").reduce((sum,i) => sum + (i.amount||0), 0);
    return (
      <section style={s.bucketBox}>
        <div style={s.bucketHeader}>
          <div style={s.bucketTitle}>
            <span style={{ ...s.bucketDot, backgroundColor: accentColor }} />
            <span style={s.bucketTitleText}>{emoji} {title}</span>
            <span style={s.bucketCount}>{list.length}</span>
          </div>
          <div style={s.bucketSummary}>
            {dep > 0 && <span style={{ color: "#10b981", fontWeight: 700 }}>+{fmtAmount(dep)}</span>}
            {wd > 0 && <span style={{ color: "#ef4444", fontWeight: 700 }}>−{fmtAmount(wd)}</span>}
          </div>
        </div>
        {list.length === 0 ? (<div style={s.bucketEmpty}>일정 없음</div>) : (<div style={s.bucketList}>{list.map(renderItemCompact)}</div>)}
      </section>
    );
  };
 
  const categoryColor = { "해외 진출": "#3b82f6", "국내 B2B": "#10b981", "매장": "#f97316", "신규 SKU": "#a855f7", "공급사": "#ec4899", "운영": "#eab308", "기타": "#64748b" };
  const statusColor = { "진행 중": "#10b981", "검토 중": "#eab308", "대기 중": "#94a3b8", "완료": "#3b82f6", "보류": "#ef4444" };
 
  const renderProject = (p) => (
    <div key={p.id} style={s.projectCard} onClick={() => { setModalData({ pageId: p.id, ...p }); setModal("edit-project"); }}>
      <div style={s.projectHeader}>
        <div style={s.projectTitle}>{p.title}</div>
        {p.priority && <div style={s.projectPriority}>{p.priority}</div>}
      </div>
      <div style={s.projectBadges}>
        <span style={{ ...s.projectBadge, backgroundColor: categoryColor[p.category] || "#64748b" }}>{p.category}</span>
        <span style={{ ...s.projectStatus, color: statusColor[p.status] || "#64748b", borderColor: statusColor[p.status] || "#64748b" }}>● {p.status}</span>
      </div>
      {p.nextAction && <div style={s.projectNext}>→ {p.nextAction}</div>}
    </div>
  );
 
  const renderHeroToday = () => {
    const safe = todayData || { payments: [], tasks: [], deadlines: [] };
    const { payments, tasks, deadlines } = safe;
 
    // V6.3 — 시간 추출 (제목에서 "9시", "11시 30분" 같은 패턴)
    const extractTime = (title) => {
      const m = (title || "").match(/(\d{1,2})시(?:\s*(\d{1,2})분)?/);
      if (!m) return null;
      return m[2] ? `${m[1]}:${m[2].padStart(2, "0")}` : `${m[1]}시`;
    };
 
    // V6.3 — 메모에서 자동/이월 칩 추출
    const extractChips = (memo) => {
      if (!memo) return [];
      const chips = [];
      if (memo.includes("[결제 자동]") || memo.includes("[진행업무 자동]")) chips.push({ label: "🤖 자동", color: "rgba(59,130,246,0.85)" });
      if (memo.includes("[어제 이월]")) chips.push({ label: "⏭️ 어제 이월", color: "rgba(245,158,11,0.85)" });
      return chips;
    };
 
    // V6.3 — 카테고리별 그룹핑 (현금 흐름 우선 순서)
    const categoryOrder = ["자금", "영업", "거래처", "생산", "제품", "마케팅", "인증규제", "HR", "기타"];
    const categoryIcons = { "자금": "💰", "영업": "🏪", "거래처": "🤝", "생산": "🏭", "제품": "📦", "마케팅": "📣", "인증규제": "📋", "HR": "👥", "기타": "📌" };
    const tasksByCategory = {};
    tasks.forEach(t => {
      const cat = t.category || "기타";
      if (!tasksByCategory[cat]) tasksByCategory[cat] = [];
      tasksByCategory[cat].push(t);
    });
 
    // V6.3 — 통계 (예정/완료/이월/자동)
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === "완료").length;
    const pendingTasks = totalTasks - doneTasks;
    const carriedOver = tasks.filter(t => t.memo && t.memo.includes("[어제 이월]")).length;
    const autoCreated = tasks.filter(t => t.memo && (t.memo.includes("[결제 자동]") || t.memo.includes("[진행업무 자동]"))).length;
 
    return (
      <section style={s.heroToday}>
        <div style={s.heroHeader}>
          <div>
            <div style={s.heroTitle}>🔥 오늘 — {todayStr}</div>
            <div style={s.heroSubtitle}>
              할 일 {pendingTasks}건 진행 중 · 완료 {doneTasks}건 · 어제 이월 {carriedOver}건 · 🤖 자동 박힌 항목 {autoCreated}건
            </div>
          </div>
          <div style={s.heroDday}>D-{missionDDay} · 6/15 미션 {missionPct.toFixed(0)}%</div>
        </div>
 
        <div style={s.heroGrid}>
          {/* ━━━ 💰 결제 컬럼 — 시간순 (예정 위, 완료 아래) ━━━ */}
          <div style={s.heroCol}>
            <div style={s.heroColTitle}>💰 오늘 결제 ({payments.length})</div>
            {payments.length === 0 ? <div style={s.heroEmpty}>없음</div> : payments.map(p => (
              <div key={p.id} style={s.heroItem}>
                <div style={s.heroItemRow}>
                  <span style={{ ...s.heroAmt, color: p.type === "입금" ? "#16a34a" : "#dc2626" }}>
                    {p.type === "입금" ? "+" : "−"}{fmtAmount(p.amount)}
                  </span>
                  <span style={s.heroItemTitle}>{p.title}</span>
                </div>
                {p.vendor && <div style={s.heroSub}>{p.vendor}</div>}
              </div>
            ))}
          </div>
 
          {/* ━━━ ✅ 할 일 컬럼 — 카테고리 그룹 + 체크박스 + 칩 + 시간 ━━━ */}
          <div style={s.heroCol}>
            <div style={s.heroColTitle}>✅ 오늘 할 일 ({pendingTasks} / {totalTasks})</div>
            {tasks.length === 0 ? <div style={s.heroEmpty}>없음</div> :
              categoryOrder.filter(cat => tasksByCategory[cat]).map(cat => (
                <div key={cat} style={s.heroCategorySection}>
                  <div style={s.heroCategoryHeader}>
                    {categoryIcons[cat] || "📌"} {cat} ({tasksByCategory[cat].length})
                  </div>
                  {tasksByCategory[cat].map(t => {
                    const isDone = t.status === "완료";
                    const isUpdating = updatingItems.has(t.id);
                    const time = extractTime(t.title);
                    const chips = extractChips(t.memo);
                    const displayTitle = t.title.replace(/^(\d{1,2})시(?:\s*\d{1,2}분)?\s*/, "");
                    return (
                      <div key={t.id} style={s.heroTaskItem}>
                        <input
                          type="checkbox"
                          checked={isDone}
                          disabled={isUpdating}
                          onChange={() => toggleComplete({ id: t.id, status: t.status })}
                          style={s.heroCheckbox}
                        />
                        <div style={s.heroTaskBody}>
                          <div style={s.heroTaskTopRow}>
                            {time && <span style={s.heroTimeBadge}>{time}</span>}
                            {t.priority && <span style={s.heroPriority}>{t.priority}</span>}
                            <span style={{ ...s.heroTaskTitle, textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.5 : 1 }}>
                              {displayTitle || t.title}
                            </span>
                          </div>
                          {chips.length > 0 && (
                            <div style={s.heroChipRow}>
                              {chips.map((c, i) => (
                                <span key={i} style={{ ...s.heroChip, background: c.color }}>{c.label}</span>
                              ))}
                            </div>
                          )}
                          {t.relatedTo && <div style={s.heroSubMeta}>→ {t.relatedTo}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            }
          </div>
 
          {/* ━━━ 🚧 마감 업무 컬럼 ━━━ */}
          <div style={s.heroCol}>
            <div style={s.heroColTitle}>🚧 오늘 마감 업무 ({deadlines.length})</div>
            {deadlines.length === 0 ? <div style={s.heroEmpty}>없음</div> : deadlines.map(d => (
              <div key={d.id} style={s.heroItem}>
                <div style={s.heroItemRow}>
                  {d.priority && <span style={s.heroPriority}>{d.priority}</span>}
                  <span style={s.heroItemTitle}>{d.title}</span>
                </div>
                {d.nextAction && <div style={s.heroSub}>→ {d.nextAction}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };
 
  return (
    <div style={s.container}>
      <div style={s.inner}>
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 헤더 — 슬림 / 타이틀 + 검색 + 액션 버튼 한 줄                    */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <header style={s.topbar}>
          <div style={s.topbarLeft}>
            <h1 style={s.title}>🎯 앙투어솔레 CEO SAAS</h1>
            <div style={s.date}>{todayStr}</div>
          </div>
          <div style={s.topbarRight}>
            <div style={s.searchBox}>
              <input type="text" placeholder="🔍 거래처·제목·카테고리..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={s.searchInput} />
              {searchQuery && <span style={s.searchCount}>{filteredItems.length}건</span>}
            </div>
            <button style={s.iconBtn} onClick={() => setModal("memo")} title="빠른 메모">📝</button>
            <button style={s.iconBtn} onClick={() => { setModalData({ date: today.toISOString().substring(0,10), title: "", amount: 0, type: "출금" }); setModal("add-payment"); }} title="새 일정 추가">➕</button>
            <button style={s.iconBtn} onClick={fetchAll} title="새로고침">🔄</button>
          </div>
        </header>
 
        {loading && <div style={s.loading}>노션에서 데이터 불러오는 중...</div>}
        {error && <div style={s.error}>⚠️ 오류: {error}</div>}
 
        {!loading && !error && (
          <>
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* 1단 — 좌(🔥 오늘) / 우(📅 캘린더) 가로 분할                  */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div style={s.row1}>
              <div style={s.row1Left}>
                {renderHeroToday()}
              </div>
              <div style={s.row1Right}>
                <section style={s.calendarSection}>
                  <div style={s.sectionHeaderSlim}>
                    <div style={s.sectionTitleSmall}><span>📅</span><span>{calendar.monthName}</span></div>
                    <span style={s.calendarHint}>날짜 클릭 → 일정 추가</span>
                  </div>
                  <div style={s.calendarBig}>
                    <div style={s.calendarHeader}>
                      {["일","월","화","수","목","금","토"].map(d => (<div key={d} style={s.calendarDay}>{d}</div>))}
                    </div>
                    <div style={s.calendarGridBig}>
                      {calendar.cells.map((cell, idx) => (
                        <div key={idx} style={{ ...s.calendarCellBig, backgroundColor: cell?.isToday ? "#eff6ff" : cell ? "#fff" : "transparent", borderColor: cell?.isToday ? "#3b82f6" : "#f1f5f9", cursor: cell ? "pointer" : "default" }}
                          onClick={() => { if (cell) { setModalData({ date: cell.date, title: "", amount: 0, type: "출금" }); setModal("add-payment"); } }}>
                          {cell && (
                            <>
                              <div style={{ ...s.calendarDayNum, color: cell.isToday ? "#1e40af" : "#0f172a", fontWeight: cell.isToday ? 800 : 600 }}>{cell.day}</div>
                              <div style={s.calendarEvents}>
                                {cell.events.slice(0, 3).map(ev => {
                                  const inc = ev.type === "입금"; const done = ev.status === "완료";
                                  return (
                                    <div key={ev.id} style={{ ...s.calendarEvent, backgroundColor: inc ? "#dcfce7" : "#fee2e2", color: inc ? "#166534" : "#991b1b", textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }} title={`${ev.title} · ${fmtAmount(ev.amount)}`}>
                                      {inc ? "+" : "−"}{fmtAmount(ev.amount)} {ev.title.slice(0, 7)}
                                    </div>
                                  );
                                })}
                                {cell.events.length > 3 && <div style={s.calendarMore}>+{cell.events.length - 3}건</div>}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
 
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* 2단 — 진행 중인 업무 (가로 전체 / 3열 압축)                  */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section style={s.section}>
              <div style={s.sectionHeaderSlim}>
                <div style={s.sectionTitleSmall}><span>🚧</span><span>진행 중인 업무</span><span style={s.sectionCount}>{projects.length}</span></div>
                <span style={s.calendarHint}>카드 클릭 → 업데이트</span>
              </div>
              <div style={s.projectGridV6}>
                {projects.length === 0 ? (<div style={s.emptyState}>진행 중인 업무 없음</div>) : projects.map(renderProject)}
              </div>
            </section>
 
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {/* 3단 — 4박스 가로 분할 (내일 · 이번주 · D-15 · 자금)           */}
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <div style={s.row3}>
              {renderBucketBox("내일", tomorrowBucket, "⏰", "#f59e0b")}
              {renderBucketBox("이번 주", thisWeekBucket, "📅", "#3b82f6")}
              {renderBucketBox("D-15 이내", next15Bucket, "📌", "#a855f7")}
              <section style={s.bucketBox}>
                <div style={s.bucketHeader}>
                  <div style={s.bucketTitle}>
                    <span style={{ ...s.bucketDot, backgroundColor: "#10b981" }} />
                    <span style={s.bucketTitleText}>💰 이번 달 자금</span>
                  </div>
                </div>
                <div style={s.fundList}>
                  <div style={s.fundRow}>
                    <span style={s.fundLabel}>입금</span>
                    <span style={{ ...s.fundValue, color: "#10b981" }}>+{fmtAmount(monthDep)}</span>
                  </div>
                  <div style={s.fundRow}>
                    <span style={s.fundLabel}>출금</span>
                    <span style={{ ...s.fundValue, color: "#ef4444" }}>−{fmtAmount(monthWd)}</span>
                  </div>
                  <div style={s.fundDiv} />
                  <div style={s.fundRow}>
                    <span style={s.fundLabel}>순흐름</span>
                    <span style={{ ...s.fundValue, color: monthNet >= 0 ? "#3b82f6" : "#f97316", fontSize: 16 }}>
                      {monthNet >= 0 ? "+" : ""}{fmtAmount(monthNet)}
                    </span>
                  </div>
                  <div style={s.fundDiv} />
                  <div style={s.fundRow}>
                    <span style={s.fundLabelSmall}>입금 예정</span>
                    <span style={{ ...s.fundValueSmall, color: "#84cc16" }}>+{fmtAmount(monthUpcomingDep)}</span>
                  </div>
                  <div style={s.fundRow}>
                    <span style={s.fundLabelSmall}>출금 예정</span>
                    <span style={{ ...s.fundValueSmall, color: "#f97316" }}>−{fmtAmount(monthUpcomingWd)}</span>
                  </div>
                  <div style={s.fundMissionBar}>
                    <div style={s.fundMissionLabel}>6/15 미션 {missionPct.toFixed(0)}% · {fmtAmount(missionTarget - monthDep)} 남음</div>
                    <div style={s.fundMissionBarBg}>
                      <div style={{ ...s.fundMissionBarFill, width: `${missionPct}%` }} />
                    </div>
                  </div>
                </div>
              </section>
            </div>
 
            <footer style={s.footer}>
              📡 앙투어솔레 CEO SAAS · {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 갱신
            </footer>
          </>
        )}
 
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 모달 — 새 일정 / 업무 수정 / 빠른 메모                          */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {modal === "add-payment" && (
          <div style={s.modalOverlay} onClick={() => setModal(null)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h2 style={s.modalTitle}>📅 새 일정 추가 — {modalData.date}</h2>
              <div style={s.modalForm}>
                <label style={s.modalLabel}>제목 *</label>
                <input type="text" value={modalData.title || ""} onChange={e => setModalData({ ...modalData, title: e.target.value })} style={s.modalInput} placeholder="예: 자사몰 정산, 소원상사 결제 등" />
                <label style={s.modalLabel}>입출 구분</label>
                <select value={modalData.type || "출금"} onChange={e => setModalData({ ...modalData, type: e.target.value })} style={s.modalInput}>
                  <option value="입금">💵 입금</option>
                  <option value="출금">💸 출금</option>
                </select>
                <label style={s.modalLabel}>금액 (원)</label>
                <input type="number" value={modalData.amount || ""} onChange={e => setModalData({ ...modalData, amount: e.target.value })} style={s.modalInput} placeholder="예: 10000000" />
                <label style={s.modalLabel}>거래처</label>
                <input type="text" value={modalData.vendor || ""} onChange={e => setModalData({ ...modalData, vendor: e.target.value })} style={s.modalInput} placeholder="예: 자사몰, 소원상사" />
                <label style={s.modalLabel}>결제 유형</label>
                <select value={modalData.category || ""} onChange={e => setModalData({ ...modalData, category: e.target.value })} style={s.modalInput}>
                  <option value="">선택 안함</option>
                  <option value="정기-고정">정기-고정</option>
                  <option value="정기-변동">정기-변동</option>
                  <option value="변동-건별">변동-건별</option>
                  <option value="대출 상환">대출 상환</option>
                  <option value="매출 정산">매출 정산</option>
                  <option value="임대료·관리비">임대료·관리비</option>
                </select>
                <label style={s.modalLabel}>비고</label>
                <textarea value={modalData.memo || ""} onChange={e => setModalData({ ...modalData, memo: e.target.value })} style={{ ...s.modalInput, minHeight: 60, fontFamily: "inherit" }} placeholder="추가 메모..." />
              </div>
              <div style={s.modalBtns}>
                <button onClick={() => setModal(null)} style={s.modalBtnSecondary}>취소</button>
                <button onClick={submitAddPayment} disabled={submitting} style={{ ...s.modalBtnPrimary, opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? "저장 중..." : "📌 노션에 저장"}
                </button>
              </div>
            </div>
          </div>
        )}
 
        {modal === "edit-project" && (
          <div style={s.modalOverlay} onClick={() => setModal(null)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h2 style={s.modalTitle}>{modalData.title}</h2>
              <div style={s.modalForm}>
                <label style={s.modalLabel}>상태</label>
                <select value={modalData.status || ""} onChange={e => setModalData({ ...modalData, status: e.target.value })} style={s.modalInput}>
                  <option value="진행 중">진행 중</option>
                  <option value="검토 중">검토 중</option>
                  <option value="대기 중">대기 중</option>
                  <option value="완료">완료</option>
                  <option value="보류">보류</option>
                </select>
                <label style={s.modalLabel}>우선순위</label>
                <select value={modalData.priority || ""} onChange={e => setModalData({ ...modalData, priority: e.target.value })} style={s.modalInput}>
                  <option value="🔴 즉시">🔴 즉시</option>
                  <option value="🟠 이번주">🟠 이번주</option>
                  <option value="🟡 이번달">🟡 이번달</option>
                  <option value="⚪ 추적">⚪ 추적</option>
                </select>
                <label style={s.modalLabel}>다음 액션</label>
                <textarea value={modalData.nextAction || ""} onChange={e => setModalData({ ...modalData, nextAction: e.target.value })} style={{ ...s.modalInput, minHeight: 60, fontFamily: "inherit" }} placeholder="다음에 할 일..." />
                <label style={s.modalLabel}>진행 사항 (긴 메모)</label>
                <textarea value={modalData.progress || ""} onChange={e => setModalData({ ...modalData, progress: e.target.value })} style={{ ...s.modalInput, minHeight: 100, fontFamily: "inherit" }} placeholder="진행 상황·미팅 메모·결정 사항..." />
                {modalData.url && <a href={modalData.url} target="_blank" rel="noreferrer" style={s.modalLink}>📓 노션에서 열기</a>}
              </div>
              <div style={s.modalBtns}>
                <button onClick={() => setModal(null)} style={s.modalBtnSecondary}>취소</button>
                <button onClick={submitEditProject} disabled={submitting} style={{ ...s.modalBtnPrimary, opacity: submitting ? 0.5 : 1 }}>
                  {submitting ? "저장 중..." : "💾 저장"}
                </button>
              </div>
            </div>
          </div>
        )}
 
        {modal === "memo" && (
          <div style={s.modalOverlay} onClick={() => setModal(null)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h2 style={s.modalTitle}>📝 빠른 메모 — 노션 CEO SAAS에 저장</h2>
              <div style={s.modalForm}>
                <label style={s.modalLabel}>제목 (선택)</label>
                <input type="text" placeholder="제목 (생략 가능)" value={logTitle} onChange={e => setLogTitle(e.target.value)} style={s.modalInput} />
                <label style={s.modalLabel}>내용</label>
                <textarea placeholder="미팅 내용·진행 사항·결정 사항·아이디어..." value={logContent} onChange={e => setLogContent(e.target.value)} style={{ ...s.modalInput, minHeight: 160, fontFamily: "inherit" }} autoFocus />
                {logFeedback && <div style={s.logFeedback}>{logFeedback}</div>}
              </div>
              <div style={s.modalBtns}>
                <button onClick={() => setModal(null)} style={s.modalBtnSecondary}>취소</button>
                <button onClick={submitLog} disabled={logSubmitting || !logContent.trim()} style={{ ...s.modalBtnPrimary, opacity: logSubmitting || !logContent.trim() ? 0.5 : 1 }}>
                  {logSubmitting ? "저장 중..." : "📌 노션 기록"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// V6 스타일 — 인지과학 4단계 위계 / 노트북 가로 폭 활용 / 3색 시스템
// 위계: 18(L1 타이틀) · 14(L2 섹션) · 12(L3 본문) · 10(L4 메타)
// 색상: 빨강(위험·출금) / 초록(안전·입금) / 파랑(정보) / 회색(중립)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const s = {
  container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif", backgroundColor: "#f1f5f9", minHeight: "100vh", padding: 16 },
  inner: { maxWidth: 1920, margin: "0 auto" },
 
  // 헤더 — 슬림, 좌우 분리
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "6px 8px", gap: 10 },
  topbarLeft: { display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 },
  topbarRight: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  title: { fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em", whiteSpace: "nowrap" },
  date: { fontSize: 12, color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" },
  searchBox: { position: "relative", width: 280 },
  searchInput: { width: "100%", padding: "7px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, backgroundColor: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  searchCount: { position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 6px", borderRadius: 6, fontWeight: 600 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", cursor: "pointer", fontSize: 16, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
 
  // V6.3: 위(🔥 오늘 — 100% 폭) + 아래(📅 캘린더 — 가운데 정렬)
  row1: { display: "block", marginBottom: 12 },
  row1Left: { display: "block", width: "100%", marginBottom: 12 },
  row1Right: { display: "block", width: "100%", maxWidth: 1200, margin: "0 auto" },
 
  // Hero 오늘 박스 — 본인이 가장 먼저 보는 곳, 색상 강도 최고
  heroToday: { background: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)", borderRadius: 16, padding: "20px 22px", color: "#fff", boxShadow: "0 6px 20px rgba(220,38,38,0.25)", boxSizing: "border-box" },
  heroHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.2)", flexWrap: "wrap", gap: 8 },
  heroTitle: { fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 2 },
  heroSubtitle: { fontSize: 12, opacity: 0.95, fontWeight: 500, lineHeight: 1.5 },
  heroDday: { fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 10, whiteSpace: "nowrap" },
  heroGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.8fr) minmax(0, 1.1fr)", gap: 16, flex: 1 },
  heroCol: { background: "#ffffff", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", maxHeight: 720, overflowY: "auto", color: "#1f2937", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  heroColTitle: { fontSize: 13, fontWeight: 800, marginBottom: 12, paddingBottom: 10, borderBottom: "2px solid #f1f5f9", letterSpacing: "-0.01em", color: "#0f172a" },
  heroItem: { fontSize: 12, marginBottom: 8, lineHeight: 1.5, padding: "10px 12px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8 },
  heroItemRow: { display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" },
  heroAmt: { fontWeight: 800, flexShrink: 0, fontSize: 13 },
  heroPriority: { fontSize: 11, flexShrink: 0 },
  heroItemTitle: { fontWeight: 600, flex: 1, minWidth: 0, wordBreak: "keep-all", color: "#0f172a" },
  heroSub: { fontSize: 11, color: "#64748b", marginTop: 4, fontWeight: 500 },
  heroEmpty: { fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "24px 0", fontStyle: "italic" },
 
  // V6.3 신규 — 카테고리 그룹핑 + 체크박스 + 칩 + 시간 배지
  heroCategorySection: { marginBottom: 14 },
  heroCategoryHeader: { fontSize: 12, fontWeight: 800, color: "#1e293b", marginBottom: 8, padding: "7px 12px", background: "#f1f5f9", borderLeft: "4px solid #f97316", borderRadius: "4px 6px 6px 4px", letterSpacing: "-0.01em" },
  heroTaskItem: { display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start", padding: "10px 12px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8, transition: "all 0.15s ease" },
  heroCheckbox: { width: 18, height: 18, cursor: "pointer", accentColor: "#dc2626", flexShrink: 0, marginTop: 1 },
  heroTaskBody: { flex: 1, minWidth: 0 },
  heroTaskTopRow: { display: "flex", gap: 5, alignItems: "baseline", flexWrap: "wrap", lineHeight: 1.4 },
  heroTimeBadge: { fontSize: 10, fontWeight: 800, background: "#1e40af", color: "#fff", padding: "2px 8px", borderRadius: 4, flexShrink: 0, letterSpacing: "0.02em" },
  heroTaskTitle: { fontSize: 13, fontWeight: 600, wordBreak: "keep-all", flex: 1, minWidth: 0, color: "#0f172a", lineHeight: 1.4 },
  heroChipRow: { display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" },
  heroChip: { fontSize: 10, fontWeight: 700, color: "#fff", padding: "2.5px 8px", borderRadius: 4, letterSpacing: "0.01em", lineHeight: 1.3 },
  heroSubMeta: { fontSize: 11, color: "#64748b", marginTop: 5, fontWeight: 500 },
 
  // 캘린더 — 한 눈에 5월 전체
  calendarSection: { backgroundColor: "#fff", borderRadius: 12, padding: "12px 14px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" },
  calendarBig: { padding: "2px 0", flex: 1, display: "flex", flexDirection: "column" },
  calendarHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 },
  calendarDay: { fontSize: 10, fontWeight: 700, color: "#64748b", textAlign: "center", padding: 3 },
  calendarGridBig: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, flex: 1, gridAutoRows: "1fr" },
  calendarCellBig: { minHeight: 78, padding: "4px 5px", border: "1px solid #f1f5f9", borderRadius: 6, fontSize: 11, display: "flex", flexDirection: "column", gap: 2, transition: "all 0.15s ease", overflow: "hidden" },
  calendarDayNum: { fontSize: 11, fontWeight: 600, marginBottom: 1 },
  calendarEvents: { display: "flex", flexDirection: "column", gap: 1.5 },
  calendarEvent: { fontSize: 9, padding: "1px 4px", borderRadius: 3, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 },
  calendarMore: { fontSize: 9, color: "#94a3b8", fontWeight: 600, textAlign: "center", padding: "1px 0" },
  calendarHint: { fontSize: 10, color: "#94a3b8", fontWeight: 500 },
 
  // 공통 섹션 (진행 업무 등)
  section: { backgroundColor: "#fff", borderRadius: 12, padding: "10px 14px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 10 },
  sectionHeaderSlim: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f1f5f9" },
  sectionTitleSmall: { fontSize: 13, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 },
  sectionCount: { fontSize: 10, fontWeight: 700, color: "#64748b", backgroundColor: "#f1f5f9", padding: "1px 7px", borderRadius: 8 },
 
  // 진행 업무 — 3열 그리드, 카드 컴팩트
  projectGridV6: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: "2px 0 4px" },
  projectCard: { padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, backgroundColor: "#fff", cursor: "pointer", transition: "all 0.15s ease" },
  projectHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 6 },
  projectTitle: { fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1.3, flex: 1 },
  projectPriority: { fontSize: 10, fontWeight: 700, flexShrink: 0 },
  projectBadges: { display: "flex", gap: 5, marginBottom: 6, flexWrap: "wrap" },
  projectBadge: { fontSize: 9, fontWeight: 700, color: "#fff", padding: "2px 7px", borderRadius: 9 },
  projectStatus: { fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 9, border: "1px solid", backgroundColor: "#fff" },
  projectNext: { fontSize: 11, color: "#475569", lineHeight: 1.4 },
 
  // 3단 — 4박스 가로 분할
  row3: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10, alignItems: "stretch" },
  bucketBox: { backgroundColor: "#fff", borderRadius: 12, padding: "10px 12px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", minHeight: 0 },
  bucketHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, paddingBottom: 5, borderBottom: "1px solid #f1f5f9" },
  bucketTitle: { fontSize: 12, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 5, minWidth: 0 },
  bucketDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  bucketTitleText: { whiteSpace: "nowrap" },
  bucketCount: { fontSize: 10, fontWeight: 700, color: "#64748b", backgroundColor: "#f1f5f9", padding: "1px 6px", borderRadius: 8 },
  bucketSummary: { display: "flex", gap: 5, fontSize: 10, fontWeight: 700, flexShrink: 0 },
  bucketList: { display: "flex", flexDirection: "column", flex: 1 },
  bucketEmpty: { textAlign: "center", padding: "16px 4px", color: "#94a3b8", fontSize: 11, fontStyle: "italic" },
 
  // 압축형 항목 (V6) — 한 줄에 빽빽이
  itemCompact: { display: "flex", alignItems: "center", gap: 6, padding: "5px 4px 5px 6px", borderBottom: "1px solid #f8fafc" },
  checkbox: { width: 14, height: 14, cursor: "pointer", accentColor: "#3b82f6", flexShrink: 0 },
  itemCompactIcon: { fontSize: 14, width: 18, flexShrink: 0, textAlign: "center" },
  itemCompactMain: { flex: 1, minWidth: 0 },
  itemCompactTitle: { fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 },
  itemCompactMeta: { fontSize: 10, color: "#64748b", display: "flex", gap: 3, alignItems: "center", flexWrap: "nowrap", overflow: "hidden" },
  itemDot: { color: "#cbd5e1" },
  itemCompactAmount: { fontSize: 11, fontWeight: 700, flexShrink: 0, textAlign: "right", letterSpacing: "-0.01em" },
 
  // 자금 박스 (3단 우측)
  fundList: { display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" },
  fundRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline" },
  fundLabel: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  fundValue: { fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em" },
  fundLabelSmall: { fontSize: 10, color: "#94a3b8", fontWeight: 500 },
  fundValueSmall: { fontSize: 11, fontWeight: 700 },
  fundDiv: { height: 1, backgroundColor: "#f1f5f9", margin: "2px 0" },
  fundMissionBar: { marginTop: 6, padding: "8px 10px", backgroundColor: "#eff6ff", borderRadius: 6, border: "1px solid #dbeafe" },
  fundMissionLabel: { fontSize: 10, fontWeight: 700, color: "#1e40af", marginBottom: 5 },
  fundMissionBarBg: { height: 6, backgroundColor: "#dbeafe", borderRadius: 3, overflow: "hidden" },
  fundMissionBarFill: { height: "100%", background: "linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)", borderRadius: 3, transition: "width 0.5s ease" },
 
  emptyState: { textAlign: "center", padding: "16px 8px", color: "#94a3b8", fontSize: 12 },
 
  // 모달
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal: { backgroundColor: "#fff", borderRadius: 16, padding: "24px 24px 20px", width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 17, fontWeight: 800, margin: "0 0 16px", color: "#0f172a", letterSpacing: "-0.02em" },
  modalForm: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: 700, color: "#475569", marginTop: 8, marginBottom: 4 },
  modalInput: { padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", width: "100%" },
  modalLink: { fontSize: 12, color: "#3b82f6", marginTop: 12, textDecoration: "none", fontWeight: 600 },
  modalBtns: { display: "flex", gap: 8, justifyContent: "flex-end" },
  modalBtnSecondary: { padding: "9px 16px", borderRadius: 8, border: "1px solid #e2e8f0", backgroundColor: "#fff", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  modalBtnPrimary: { padding: "9px 16px", borderRadius: 8, border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
 
  loading: { textAlign: "center", padding: 60, color: "#64748b", fontSize: 14 },
  error: { backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: 16, borderRadius: 10, marginBottom: 16, fontSize: 13 },
  logFeedback: { fontSize: 12, color: "#10b981", textAlign: "center", padding: "6px 0", fontWeight: 600 },
  footer: { marginTop: 12, paddingTop: 10, textAlign: "center", color: "#94a3b8", fontSize: 10 },
};
