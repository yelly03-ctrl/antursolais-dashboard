import { useState, useEffect } from "react";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  const todayStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  const todayISO = today.toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/payments")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setItems(data.items || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const calcDDay = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const thisMonth = todayISO.substring(0, 7);
  const monthItems = items.filter(
    (item) => item.date && item.date.startsWith(thisMonth)
  );

  const monthDeposits = monthItems
    .filter((item) => item.type === "입금")
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const monthWithdrawals = monthItems
    .filter((item) => item.type === "출금")
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  const upcoming = items
    .filter((item) => {
      const dday = calcDDay(item.date);
      return dday !== null && dday >= 0 && dday <= 15;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const missionTarget = 450000000;
  const missionDate = new Date("2026-06-15");
  const missionDDay = Math.ceil((missionDate - today) / (1000 * 60 * 60 * 24));
  const missionProgress = Math.min((monthDeposits / missionTarget) * 100, 100);

  const fmt = (num) => num.toLocaleString("ko-KR");

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎯 앙투어솔레 사령탑</h1>
        <div style={styles.date}>{todayStr}</div>
      </header>

      {loading && <div style={styles.loading}>노션에서 데이터 불러오는 중...</div>}

      {error && (
        <div style={styles.error}>
          ⚠️ 오류: {error}
          <br />
          <small>환경 변수 NOTION_TOKEN 확인 + 결제 스케줄 DB에 통합 권한 부여 확인</small>
        </div>
      )}

      {!loading && !error && (
        <>
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>🎯 6/15 미션 — 4억 5천만원</h2>
            <div style={styles.progressBar}>
              <div style={{...styles.progressFill, width: `${missionProgress}%`}} />
            </div>
            <div style={styles.progressText}>
              {missionProgress.toFixed(1)}% · {fmt(monthDeposits)}원 / {fmt(missionTarget)}원
              <br />
              <span style={styles.dDay}>D-{missionDDay}</span>
            </div>
          </section>

          <section style={styles.cardRow}>
            <div style={{...styles.miniCard, borderLeft: "4px solid #10b981"}}>
              <div style={styles.miniLabel}>이번 달 입금</div>
              <div style={styles.miniValue}>{fmt(monthDeposits)}원</div>
            </div>
            <div style={{...styles.miniCard, borderLeft: "4px solid #ef4444"}}>
              <div style={styles.miniLabel}>이번 달 출금</div>
              <div style={styles.miniValue}>{fmt(monthWithdrawals)}원</div>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.cardTitle}>🚨 가까운 중요 일정 — D-15 이내</h2>
            {upcoming.length === 0 ? (
              <div style={styles.empty}>D-15 이내 일정 없음</div>
            ) : (
              <ul style={styles.list}>
                {upcoming.map((item) => {
                  const dday = calcDDay(item.date);
                  const ddayColor = dday <= 3 ? "#ef4444" : dday <= 7 ? "#f59e0b" : "#10b981";
                  const typeIcon = item.type === "입금" ? "💵" : "💸";
                  return (
                    <li key={item.id} style={styles.listItem}>
                      <span style={{...styles.dDayBadge, backgroundColor: ddayColor}}>
                        D-{dday}
                      </span>
                      <span style={styles.itemDate}>{item.date}</span>
                      <span style={styles.itemTitle}>
                        {typeIcon} {item.title}
                      </span>
                      <span style={styles.itemAmount}>{fmt(item.amount)}원</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <footer style={styles.footer}>
            <small>📡 데이터: 앙투어솔레 사령탑 노션 DB · 마지막 갱신: {today.toLocaleTimeString("ko-KR")}</small>
          </footer>
        </>
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif", maxWidth: 720, margin: "0 auto", padding: "24px 16px", backgroundColor: "#fafafa", minHeight: "100vh" },
  header: { marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #e5e5e5" },
  title: { fontSize: 24, fontWeight: 700, margin: 0, color: "#111" },
  date: { fontSize: 14, color: "#666", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  cardTitle: { fontSize: 16, fontWeight: 600, margin: "0 0 12px", color: "#111" },
  cardRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  miniCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  miniLabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  miniValue: { fontSize: 18, fontWeight: 700, color: "#111" },
  progressBar: { height: 12, backgroundColor: "#e5e5e5", borderRadius: 6, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#3b82f6", transition: "width 0.3s" },
  progressText: { fontSize: 14, color: "#444" },
  dDay: { fontWeight: 600, color: "#3b82f6" },
  list: { listStyle: "none", margin: 0, padding: 0 },
  listItem: { display: "grid", gridTemplateColumns: "60px 90px 1fr 120px", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #f0f0f0", fontSize: 13 },
  dDayBadge: { color: "#fff", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: 600, textAlign: "center" },
  itemDate: { color: "#666" },
  itemTitle: { fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemAmount: { textAlign: "right", color: "#111", fontWeight: 500 },
  empty: { color: "#999", fontSize: 14, padding: "16px 0", textAlign: "center" },
  loading: { textAlign: "center", padding: 40, color: "#666" },
  error: { backgroundColor: "#fee", border: "1px solid #fcc", color: "#c00", padding: 16, borderRadius: 8, marginBottom: 16, fontSize: 14 },
  footer: { marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e5e5", textAlign: "center", color: "#999" },
};
