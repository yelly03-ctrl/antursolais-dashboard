import { useState, useEffect } from "react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setItems(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

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

  const todayMonth = today.toISOString().substring(0, 7);
  const monthItems = items.filter((i) => i.date && i.date.startsWith(todayMonth));
  const monthDep = monthItems.filter((i) => i.type === "입금").reduce((s, i) => s + (i.amount || 0), 0);
  const monthWd = monthItems.filter((i) => i.type === "출금").reduce((s, i) => s + (i.amount || 0), 0);
  const monthNet = monthDep - monthWd;

  const missionTarget = 450000000;
  const missionDate = new Date("2026-06-15");
  missionDate.setHours(0, 0, 0, 0);
  const missionDDay = Math.round((missionDate - today) / (1000 * 60 * 60 * 24));
  const missionPct = Math.min((monthDep / missionTarget) * 100, 100);

  const bucket = (min, max) =>
    items
      .filter((i) => {
        const d = calcDDay(i.date);
        return d !== null && d >= min && d <= max;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

  const todayBucket = bucket(0, 0);
  const tomorrowBucket = bucket(1, 1);
  const thisWeekBucket = bucket(2, 7);
  const next15Bucket = bucket(8, 15);

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
    const ddayLabel = dday === 0 ? "오늘" : dday === 1 ? "내일" : `D-${dday}`;
    const ddayColor = dday <= 1 ? "#ef4444" : dday <= 3 ? "#f59e0b" : "#64748b";

    return (
      <div
        key={item.id}
        style={{ ...s.item, borderLeft: `3px solid ${isIncome ? "#10b981" : "#ef4444"}` }}
      >
        <div style={s.itemIcon}>{iconFor(item)}</div>
        <div style={s.itemMain}>
          <div style={s.itemTitle}>{item.title}</div>
          <div style={s.itemMeta}>
            <span style={{ ...s.itemDDay, color: ddayColor }}>{ddayLabel}</span>
            <span style={s.itemDot}>·</span>
            <span style={s.itemDate}>{fmtDate(item.date)}</span>
            {item.vendor && (
              <>
                <span style={s.itemDot}>·</span>
                <span style={s.itemVendor}>{item.vendor}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ ...s.itemAmount, color: isIncome ? "#10b981" : "#ef4444" }}>
          {isIncome ? "+" : "−"}
          {fmtAmount(item.amount)}
        </div>
      </div>
    );
  };

  const renderSection = (title, list, emoji, alwaysShow = false) => {
    if (list.length === 0 && !alwaysShow) return null;
    const dep = list.filter((i) => i.type === "입금").reduce((s, i) => s + (i.amount || 0), 0);
    const wd = list.filter((i) => i.type === "출금").reduce((s, i) => s + (i.amount || 0), 0);

    return (
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>
            <span>{emoji}</span>
            <span>{title}</span>
            {list.length > 0 && <span style={s.sectionCount}>{list.length}</span>}
          </div>
          <div style={s.sectionSummary}>
            {dep > 0 && <span style={s.sectionDep}>+{fmtAmount(dep)}</span>}
            {wd > 0 && <span style={s.sectionWd}>−{fmtAmount(wd)}</span>}
          </div>
        </div>
        {list.length === 0 ? (
          <div style={s.emptyState}>일정 없음 — 여유롭게</div>
        ) : (
          <div style={s.itemList}>{list.map(renderItem)}</div>
        )}
      </section>
    );
  };

  return (
    <div style={s.container}>
      <div style={s.inner}>
        <header style={s.header}>
          <h1 style={s.title}>🎯 앙투어솔레 사령탑</h1>
          <div style={s.date}>{todayStr}</div>
        </header>

        {loading && <div style={s.loading}>노션에서 데이터 불러오는 중...</div>}

        {error && (
          <div style={s.error}>
            ⚠️ 오류: {error}
            <br />
            <small>NOTION_TOKEN 또는 통합 권한 부여 확인</small>
          </div>
        )}

        {!loading && !error && (
          <>
            <section style={s.missionCard}>
              <div style={s.missionLabel}>6/15 미션</div>
              <div style={s.missionTarget}>4.5억</div>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${missionPct}%` }} />
              </div>
              <div style={s.missionMeta}>
                <span style={s.missionPct}>{missionPct.toFixed(1)}%</span>
                <span style={s.missionDDay}>D-{missionDDay}</span>
              </div>
              <div style={s.missionCurrent}>
                {fmtAmount(monthDep)} 들어옴 · {fmtAmount(missionTarget - monthDep)} 남음
              </div>
            </section>

            <section style={s.statsRow}>
              <div style={{ ...s.statCard, borderTop: "3px solid #10b981" }}>
                <div style={s.statLabel}>이번 달 입금</div>
                <div style={{ ...s.statValue, color: "#10b981" }}>{fmtAmount(monthDep)}</div>
              </div>
              <div style={{ ...s.statCard, borderTop: "3px solid #ef4444" }}>
                <div style={s.statLabel}>이번 달 출금</div>
                <div style={{ ...s.statValue, color: "#ef4444" }}>{fmtAmount(monthWd)}</div>
              </div>
              <div
                style={{
                  ...s.statCard,
                  borderTop: `3px solid ${monthNet >= 0 ? "#3b82f6" : "#f59e0b"}`,
                }}
              >
                <div style={s.statLabel}>순현금흐름</div>
                <div
                  style={{ ...s.statValue, color: monthNet >= 0 ? "#3b82f6" : "#f59e0b" }}
                >
                  {monthNet >= 0 ? "+" : ""}
                  {fmtAmount(monthNet)}
                </div>
              </div>
            </section>

            {renderSection("오늘", todayBucket, "🔥", true)}
            {renderSection("내일", tomorrowBucket, "⏰", true)}
            {renderSection("이번 주", thisWeekBucket, "📅")}
            {renderSection("다음 주 (D-15 이내)", next15Bucket, "📌")}

            <footer style={s.footer}>
              📡 앙투어솔레 사령탑 노션 DB ·{" "}
              {new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 갱신
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  container: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "16px 12px 40px",
  },
  inner: { maxWidth: 720, margin: "0 auto" },
  header: { marginBottom: 18, padding: "8px 4px" },
  title: { fontSize: 22, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" },
  date: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 },

  missionCard: {
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    borderRadius: 16,
    padding: "18px 20px 16px",
    marginBottom: 12,
    color: "#fff",
    boxShadow: "0 4px 14px rgba(59,130,246,0.25)",
  },
  missionLabel: { fontSize: 12, fontWeight: 600, opacity: 0.9, letterSpacing: "0.04em" },
  missionTarget: { fontSize: 30, fontWeight: 800, margin: "2px 0 12px", letterSpacing: "-0.02em" },
  progressBar: {
    height: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#fff", transition: "width 0.5s ease", borderRadius: 5 },
  missionMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  missionPct: { fontSize: 16, fontWeight: 700 },
  missionDDay: {
    fontSize: 13,
    fontWeight: 600,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "3px 10px",
    borderRadius: 12,
  },
  missionCurrent: { fontSize: 12, opacity: 0.9, fontWeight: 500 },

  statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 18 },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: "12px 8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    textAlign: "center",
  },
  statLabel: { fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" },

  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: "14px 14px 6px",
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: 700,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: 10,
  },
  sectionSummary: { display: "flex", gap: 8, fontSize: 12, fontWeight: 700 },
  sectionDep: { color: "#10b981" },
  sectionWd: { color: "#ef4444" },

  itemList: { display: "flex", flexDirection: "column" },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 8px",
    borderBottom: "1px solid #f8fafc",
  },
  itemIcon: { fontSize: 20, width: 28, flexShrink: 0, textAlign: "center" },
  itemMain: { flex: 1, minWidth: 0 },
  itemTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginBottom: 2,
  },
  itemMeta: { fontSize: 11, color: "#64748b", display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" },
  itemDDay: { fontWeight: 700 },
  itemDot: { color: "#cbd5e1" },
  itemDate: { color: "#94a3b8" },
  itemVendor: { color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemAmount: { fontSize: 13, fontWeight: 700, flexShrink: 0, textAlign: "right", letterSpacing: "-0.01em" },

  emptyState: { textAlign: "center", padding: "16px 8px", color: "#94a3b8", fontSize: 12 },
  loading: { textAlign: "center", padding: 40, color: "#64748b", fontSize: 14 },
  error: {
    backgroundColor: "#fee2e2",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 13,
  },
  footer: { marginTop: 18, paddingTop: 14, textAlign: "center", color: "#94a3b8", fontSize: 11 },
};
