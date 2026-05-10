import { useState, useEffect, useMemo } from "react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [logTitle, setLogTitle] = useState("");
  const [logContent, setLogContent] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logFeedback, setLogFeedback] = useState("");
  const [updatingItems, setUpdatingItems] = useState(new Set());

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = today.toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const fetchItems = () => {
    setLoading(true);
    fetch("/api/payments")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else { setItems(data.items || []); setError(null); }
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { fetchItems(); }, []);

  const toggleComplete = async (item) => {
    const prevStatus = item.status;
    const newCompleted = item.status !== "완료";
    setUpdatingItems((prev) => new Set(prev).add(item.id));
    setItems((prev) => prev.map((i) =>
      i.id === item.id ? { ...i, status: newCompleted ? "완료" : "예정" } : i
    ));

    try {
      const res = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: item.id, completed: newCompleted }),
      });
      const data = await res.json();
      if (data.error) {
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: prevStatus } : i));
        alert("상태 업데이트 실패: " + data.error);
      }
    } catch (err) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: prevStatus } : i));
      alert("상태 업데이트 실패: " + err.message);
    } finally {
      setUpdatingItems((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
    }
  };

  const submitLog = async () => {
    if (!logContent.trim()) return;
    setLogSubmitting(true);
    setLogFeedback("");
    try {
      const res = await fetch("/api/work-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: logTitle, content: logContent }),
      });
      const data = await res.json();
      if (data.error) {
        setLogFeedback("❌ " + data.error);
      } else {
        setLogFeedback("✅ 노션 사령탑에 저장됐어요");
        setLogTitle(""); setLogContent("");
        setTimeout(() => setLogFeedback(""), 3000);
      }
    } catch (err) {
      setLogFeedback("❌ " + err.message);
    } finally {
      setLogSubmitting(false);
    }
  };

  const calcDDay = (dateStr) => {
    if (!dateStr) return null;
    const t = new Date(dateStr);
    t.setHours(0, 0, 0, 0);
    return Math.round((t - today) / (1000 * 60 * 60 * 24));
  };

  const fmtAmount = (num) => {
    if (!num) return "0원";
    if (num >= 100000000) return `${(num / 100000000).toFixed(2)}억`;
    if (num >= 10000) return `${Math.round(num / 10000).toLocaleString("ko-KR")}만`;
    return num.toLocaleString("ko-KR") + "원";
  };

  const fmtDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) =>
      (i.title || "").toLowerCase().includes(q) ||
      (i.vendor || "").toLowerCase().includes(q) ||
      (i.category || "").toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const todayMonth = today.toISOString().substring(0, 7);
  const monthItems = filteredItems.filter((i) => i.date && i.date.startsWith(todayMonth));
  const monthDep = monthItems.filter((i) => i.type === "입금").reduce((s, i) => s + (i.amount || 0), 0);
  const monthWd = monthItems.filter((i) => i.type === "출금").reduce((s, i) => s + (i.amount || 0), 0);
  const monthNet = monthDep - monthWd;

  const missionTarget = 450000000;
  const missionDate = useMemo(() => { const d = new Date("2026-06-15"); d.setHours(0,0,0,0); return d; }, []);
  const missionDDay = Math.round((missionDate - today) / (1000 * 60 * 60 * 24));
  const missionPct = Math.min((monthDep / missionTarget) * 100, 100);

  const bucket = (min, max) =>
    filteredItems
      .filter((i) => { const d = calcDDay(i.date); return d !== null && d >= min && d <= max; })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

  const todayBucket = bucket(0, 0);
  const tomorrowBucket = bucket(1, 1);
  const thisWeekBucket = bucket(2, 7);
  const next15Bucket = bucket(8, 15);

  const calendar = useMemo(() => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const eventsByDate = {};
    items.forEach((item) => {
      if (!item.date) return;
      const d = new Date(item.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!eventsByDate[day]) eventsByDate[day] = { dep: 0, wd: 0 };
        if (item.type === "입금") eventsByDate[day].dep++;
        else eventsByDate[day].wd++;
      }
    });

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        events: eventsByDate[day] || { dep: 0, wd: 0 },
        isToday: day === today.getDate(),
      });
    }
    return { cells, monthName: today.toLocaleDateString("ko-KR", { month: "long" }) };
  }, [items, today]);

  const iconFor = (item) => {
    const t = (item.title || "").toLowerCase();
    const v = (item.vendor || "").toLowerCase();
    const c = item.category || "";
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
    if (t.includes("텐밀리언") || t.includes("마케팅")) return "📊";
    if (t.includes("lgu") || t.includes("인터넷")) return "📡";
    if (t.includes("cj") || t.includes("물류")) return "🚚";
    if (t.includes("나이스") || t.includes("세무")) return "🧾";
    if (c === "매출 정산") return "💰";
    if (c === "대출 상환") return "🏦";
    return "📌";
  };

  const renderItem = (item) => {
    const dday = calcDDay(item.date);
    const isIncome = item.type === "입금";
    const isDone = item.status === "완료";
    const isUpdating = updatingItems.has(item.id);
    const ddayLabel = dday === 0 ? "오늘" : dday === 1 ? "내일" : `D-${dday}`;
    const ddayColor = dday <= 1 ? "#ef4444" : dday <= 3 ? "#f59e0b" : "#64748b";

    return (
      <div key={item.id} style={{
        ...s.item,
        borderLeft: `3px solid ${isIncome ? "#10b981" : "#ef4444"}`,
        opacity: isDone ? 0.45 : 1,
        backgroundColor: isDone ? "#f8fafc" : "transparent",
      }}>
        <input type="checkbox" checked={isDone} onChange={() => toggleComplete(item)} disabled={isUpdating} style={s.checkbox} />
        <div style={s.itemIcon}>{iconFor(item)}</div>
        <div style={s.itemMain}>
          <div style={{ ...s.itemTitle, textDecoration: isDone ? "line-through" : "none", color: isDone ? "#94a3b8" : "#0f172a" }}>
            {item.title}
          </div>
          <div style={s.itemMeta}>
            <span style={{ ...s.itemDDay, color: ddayColor }}>{ddayLabel}</span>
            <span style={s.itemDot}>·</span>
            <span style={s.itemDate}>{fmtDate(item.date)}</span>
            {item.vendor && (<><span style={s.itemDot}>·</span><span style={s.itemVendor}>{item.vendor}</span></>)}
          </div>
        </div>
        <div style={{
          ...s.itemAmount,
          color: isDone ? "#94a3b8" : isIncome ? "#10b981" : "#ef4444",
          textDecoration: isDone ? "line-through" : "none",
        }}>
          {isIncome ? "+" : "−"}{fmtAmount(item.amount)}
        </div>
      </div>
    );
  };

  const renderSection = (title, list, emoji, alwaysShow = false) => {
    if (list.length === 0 && !alwaysShow) return null;
    const dep = list.filter((i) => i.type === "입금").reduce((sum, i) => sum + (i.amount || 0), 0);
    const wd = list.filter((i) => i.type === "출금").reduce((sum, i) => sum + (i.amount || 0), 0);

    return (
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            <span>{emoji}</span><span>{title}</span>
            {list.length > 0 && <span style={s.sectionCount}>{list.length}</span>}
          </div>
          <div style={s.sectionSummary}>
            {dep > 0 && <span style={s.sectionDep}>+{fmtAmount(dep)}</span>}
            {wd > 0 && <span style={s.sectionWd}>−{fmtAmount(wd)}</span>}
          </div>
        </div>
        {list.length === 0 ? (<div style={s.emptyState}>일정 없음</div>) : (<div style={s.itemList}>{list.map(renderItem)}</div>)}
      </section>
    );
  };

  return (
    <div style={s.container}>
      <div style={s.inner}>
        <header style={s.topbar}>
          <div>
            <h1 style={s.title}>🎯 앙투어솔레 사령탑</h1>
            <div style={s.date}>{todayStr}</div>
          </div>
          <div style={s.searchBox}>
            <input type="text" placeholder="🔍 거래처, 제목, 카테고리 검색..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={s.searchInput} />
            {searchQuery && <span style={s.searchCount}>{filteredItems.length}건</span>}
          </div>
        </header>

        {loading && <div style={s.loading}>노션에서 데이터 불러오는 중...</div>}
        {error && <div style={s.error}>⚠️ 오류: {error}</div>}

        {!loading && !error && (
          <>
            <section style={s.missionCard}>
              <div style={s.missionTopRow}>
                <div style={s.missionLeft}>
                  <div style={s.missionLabel}>🎯 6/15 미션 — 4억 5천만원</div>
                  <div style={s.progressBar}>
                    <div style={{ ...s.progressFill, width: `${missionPct}%` }} />
                  </div>
                </div>
                <div style={s.missionRight}>
                  <div style={s.missionPct}>{missionPct.toFixed(1)}%</div>
                  <div style={s.missionDDay}>D-{missionDDay}</div>
                </div>
              </div>
              <div style={s.missionStats}>
                <span>{fmtAmount(monthDep)} 들어옴</span>
                <span style={s.missionDot}>·</span>
                <span>{fmtAmount(missionTarget - monthDep)} 남음</span>
              </div>
            </section>

            <div style={s.grid}>
              <div style={s.colLeft}>
                <section style={s.section}>
                  <div style={s.sectionHeader}>
                    <div style={s.sectionTitle}><span>📅</span><span>{calendar.monthName} 캘린더</span></div>
                  </div>
                  <div style={s.calendar}>
                    <div style={s.calendarHeader}>
                      {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                        <div key={d} style={s.calendarDay}>{d}</div>
                      ))}
                    </div>
                    <div style={s.calendarGrid}>
                      {calendar.cells.map((cell, idx) => (
                        <div key={idx} style={{
                          ...s.calendarCell,
                          backgroundColor: cell?.isToday ? "#dbeafe" : "transparent",
                          color: cell?.isToday ? "#1e40af" : cell ? "#0f172a" : "transparent",
                          fontWeight: cell?.isToday ? 800 : 500,
                        }}>
                          {cell ? (
                            <>
                              <div>{cell.day}</div>
                              <div style={s.calendarDots}>
                                {cell.events.dep > 0 && <span style={s.depDot}></span>}
                                {cell.events.wd > 0 && <span style={s.wdDot}></span>}
                              </div>
                            </>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div style={s.calendarLegend}>
                      <span><span style={s.depDot}></span> 입금</span>
                      <span><span style={s.wdDot}></span> 출금</span>
                    </div>
                  </div>
                </section>
              </div>

              <div style={s.colMiddle}>
                {renderSection("오늘", todayBucket, "🔥", true)}
                {renderSection("내일", tomorrowBucket, "⏰", true)}
                {renderSection("이번 주", thisWeekBucket, "📅")}
                {renderSection("다음 주 (D-15)", next15Bucket, "📌")}
              </div>

              <div style={s.colRight}>
                <section style={s.section}>
                  <div style={s.sectionHeader}>
                    <div style={s.sectionTitle}><span>💰</span><span>이번 달 현금흐름</span></div>
                  </div>
                  <div style={s.stats}>
                    <div style={s.statRow}>
                      <span style={s.statLabel}>입금</span>
                      <span style={{ ...s.statValue, color: "#10b981" }}>+{fmtAmount(monthDep)}</span>
                    </div>
                    <div style={s.statRow}>
                      <span style={s.statLabel}>출금</span>
                      <span style={{ ...s.statValue, color: "#ef4444" }}>−{fmtAmount(monthWd)}</span>
                    </div>
                    <div style={{ ...s.statRow, ...s.statRowTotal }}>
                      <span style={s.statLabel}>순현금흐름</span>
                      <span style={{ ...s.statValue, color: monthNet >= 0 ? "#3b82f6" : "#f59e0b", fontSize: 18 }}>
                        {monthNet >= 0 ? "+" : ""}{fmtAmount(monthNet)}
                      </span>
                    </div>
                  </div>
                </section>

                <section style={s.section}>
                  <div style={s.sectionHeader}>
                    <div style={s.sectionTitle}><span>📝</span><span>빠른 메모</span></div>
                  </div>
                  <div style={s.logForm}>
                    <input type="text" placeholder="제목 (선택)" value={logTitle}
                      onChange={(e) => setLogTitle(e.target.value)} style={s.logInput} />
                    <textarea placeholder="미팅 내용·진행 사항·결정 사항..."
                      value={logContent} onChange={(e) => setLogContent(e.target.value)}
                      style={s.logTextarea} rows={5} />
                    <button onClick={submitLog} disabled={logSubmitting || !logContent.trim()}
                      style={{ ...s.logBtn, opacity: logSubmitting || !logContent.trim() ? 0.5 : 1 }}>
                      {logSubmitting ? "저장 중..." : "📌 노션에 기록"}
                    </button>
                    {logFeedback && <div style={s.logFeedback}>{logFeedback}</div>}
                  </div>
                </section>
              </div>
            </div>

            <footer style={s.footer}>
              📡 앙투어솔레 사령탑 ·{" "}
              {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 갱신
              {" · "}
              <button onClick={fetchItems} style={s.refreshBtn}>🔄 새로고침</button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif", backgroundColor: "#f1f5f9", minHeight: "100vh", padding: 16 },
  inner: { maxWidth: 1440, margin: "0 auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "8px 12px", flexWrap: "wrap", gap: 12 },
  title: { fontSize: 22, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" },
  date: { fontSize: 13, color: "#64748b", marginTop: 2, fontWeight: 500 },
  searchBox: { position: "relative", minWidth: 320, flex: "0 1 400px" },
  searchInput: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  searchCount: { position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: 8, fontWeight: 600 },
  missionCard: { background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", borderRadius: 14, padding: "18px 22px", marginBottom: 14, color: "#fff", boxShadow: "0 4px 14px rgba(59,130,246,0.25)" },
  missionTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 8 },
  missionLeft: { flex: 1, minWidth: 0 },
  missionRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  missionLabel: { fontSize: 13, fontWeight: 700, marginBottom: 8, opacity: 0.95 },
  progressBar: { height: 9, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 5, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#fff", transition: "width 0.5s ease", borderRadius: 5 },
  missionPct: { fontSize: 22, fontWeight: 800 },
  missionDDay: { fontSize: 13, fontWeight: 700, backgroundColor: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 12 },
  missionStats: { fontSize: 12, opacity: 0.9, fontWeight: 500, display: "flex", gap: 6 },
  missionDot: { opacity: 0.5 },
  grid: { display: "grid", gridTemplateColumns: "minmax(280px, 350px) 1fr minmax(280px, 360px)", gap: 12, alignItems: "start" },
  colLeft: { display: "flex", flexDirection: "column", gap: 12 },
  colMiddle: { display: "flex", flexDirection: "column", gap: 12 },
  colRight: { display: "flex", flexDirection: "column", gap: 12 },
  section: { backgroundColor: "#fff", borderRadius: 14, padding: "14px 14px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 },
  sectionCount: { fontSize: 11, fontWeight: 700, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: 10 },
  sectionSummary: { display: "flex", gap: 8, fontSize: 12, fontWeight: 700 },
  sectionDep: { color: "#10b981" },
  sectionWd: { color: "#ef4444" },
  itemList: { display: "flex", flexDirection: "column" },
  item: { display: "flex", alignItems: "center", gap: 8, padding: "8px 6px", borderBottom: "1px solid #f8fafc", transition: "all 0.2s ease" },
  checkbox: { width: 16, height: 16, cursor: "pointer", accentColor: "#3b82f6", flexShrink: 0 },
  itemIcon: { fontSize: 18, width: 24, flexShrink: 0, textAlign: "center" },
  itemMain: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 },
  itemMeta: { fontSize: 11, color: "#64748b", display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" },
  itemDDay: { fontWeight: 700 },
  itemDot: { color: "#cbd5e1" },
  itemDate: { color: "#94a3b8" },
  itemVendor: { color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemAmount: { fontSize: 13, fontWeight: 700, flexShrink: 0, textAlign: "right", letterSpacing: "-0.01em" },
  emptyState: { textAlign: "center", padding: "12px 8px", color: "#94a3b8", fontSize: 12 },
  calendar: { padding: "4px 0" },
  calendarHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 },
  calendarDay: { fontSize: 10, fontWeight: 700, color: "#64748b", textAlign: "center", padding: 4 },
  calendarGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
  calendarCell: { minHeight: 38, padding: "4px 2px", fontSize: 12, textAlign: "center", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 2 },
  calendarDots: { display: "flex", gap: 2, height: 6, alignItems: "center" },
  depDot: { display: "inline-block", width: 5, height: 5, borderRadius: "50%", backgroundColor: "#10b981" },
  wdDot: { display: "inline-block", width: 5, height: 5, borderRadius: "50%", backgroundColor: "#ef4444" },
  calendarLegend: { display: "flex", justifyContent: "center", gap: 12, marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#64748b" },
  stats: { padding: "4px 0" },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f8fafc" },
  statRowTotal: { paddingTop: 12, marginTop: 4, borderTop: "2px solid #e2e8f0", borderBottom: "none" },
  statLabel: { fontSize: 13, color: "#64748b", fontWeight: 600 },
  statValue: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" },
  logForm: { display: "flex", flexDirection: "column", gap: 8, padding: "4px 0 8px" },
  logInput: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" },
  logTextarea: { padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", minHeight: 80, lineHeight: 1.5, boxSizing: "border-box" },
  logBtn: { padding: "10px 16px", borderRadius: 8, border: "none", backgroundColor: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  logFeedback: { fontSize: 12, color: "#64748b", textAlign: "center", padding: "4px 0" },
  loading: { textAlign: "center", padding: 60, color: "#64748b", fontSize: 14 },
  error: { backgroundColor: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: 16, borderRadius: 10, marginBottom: 16, fontSize: 13 },
  footer: { marginTop: 16, paddingTop: 12, textAlign: "center", color: "#94a3b8", fontSize: 11 },
  refreshBtn: { background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 11, padding: 0, fontFamily: "inherit" },
};
