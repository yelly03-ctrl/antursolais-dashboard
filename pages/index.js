import { useState, useEffect, useMemo } from "react";
import Head from "next/head";

export default function Dashboard() {
  const [payments, setPayments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [todayData, setTodayData] = useState({ payments: [], tasks: [], deadlines: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/payments").then((r) => r.json()).catch(() => ({ items: [] })),
      fetch("/api/projects").then((r) => r.json()).catch(() => ({ items: [] })),
      fetch("/api/today").then((r) => r.json()).catch(() => ({ payments: [], tasks: [], deadlines: [] })),
    ])
      .then(([pay, proj, td]) => {
        setPayments(pay.items || []);
        setProjects(proj.items || []);
        setTodayData(td || { payments: [], tasks: [], deadlines: [] });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // ë‚ ì§œÂ·ìˆ«ìž í—¬í¼
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][today.getDay()];
  const dateLabel = `${yyyy}.${mm}.${dd} ${weekday}`;

  const getISOWeek = (d) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  };
  const currentWeek = getISOWeek(today);

  const dayOfYear = (() => {
    const start = new Date(today.getFullYear(), 0, 0);
    return Math.floor((today - start) / 86400000);
  })();

  const calcDDay = (dateStr) => {
    if (!dateStr) return null;
    const t = new Date(dateStr);
    t.setHours(0, 0, 0, 0);
    return Math.round((t - today) / 86400000);
  };

  const fmtMM = (num) => {
    // ë°±ë§Œì› ë‹¨ìœ„
    const v = num / 1000000;
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + "B";
    if (Math.abs(v) >= 100) return Math.round(v).toString();
    if (Math.abs(v) >= 10) return v.toFixed(0);
    return v.toFixed(1);
  };

  // í•  ì¼ DBëŠ” "ðŸ”´ ê¸´ê¸‰", ì§„í–‰ ì—…ë¬´ DBëŠ” "ðŸ”´ ì¦‰ì‹œ"
  const priorityRank = {
    "ðŸ”´ ì¦‰ì‹œ": 1,
    "ðŸ”´ ê¸´ê¸‰": 1,
    "ðŸŸ  ì´ë²ˆì£¼": 2,
    "ðŸŸ¡ ì´ë²ˆë‹¬": 3,
    "ðŸŸ¡ ë†’ìŒ": 2,
    "ðŸŸ¢ ì¤‘ê°„": 3,
    "ðŸ”µ ë‚®ìŒ": 4,
    "âšª ì¶”ì ": 4,
  };

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // í•µì‹¬ ë°ì´í„° ê°€ê³µ
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

  // ì˜¤ëŠ˜ì˜ ê²°ì • â€” ðŸ”´ ì¦‰ì‹œ + ê°€ìž¥ ê°€ê¹Œìš´ ë§ˆê° 1ê±´
  const heroDecision = useMemo(() => {
    if (projects.length === 0) return null;
    const urgent = projects.filter((p) => priorityRank[p.priority] === 1 && p.status !== "ì™„ë£Œ");
    const pool = urgent.length > 0 ? urgent : projects.filter((p) => p.status !== "ì™„ë£Œ");
    return [...pool].sort((a, b) => {
      const da = a.deadline ? calcDDay(a.deadline) : 999;
      const db = b.deadline ? calcDDay(b.deadline) : 999;
      return da - db;
    })[0];
  }, [projects]);

  // 3ê°œ ì•Œë¦¼
  const alerts = useMemo(() => {
    const heroId = heroDecision?.id;
    return projects
      .filter((p) => p.id !== heroId && p.status !== "ì™„ë£Œ" && p.deadline)
      .sort((a, b) => {
        const ra = priorityRank[a.priority] || 5;
        const rb = priorityRank[b.priority] || 5;
        if (ra !== rb) return ra - rb;
        return calcDDay(a.deadline) - calcDDay(b.deadline);
      })
      .slice(0, 3);
  }, [projects, heroDecision]);

  // KPI â€” ì´ë²ˆ ì£¼
  const weekStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [today]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const thisWeekPayments = useMemo(() => {
    return payments.filter((p) => {
      if (!p.date) return false;
      const d = new Date(p.date);
      return d >= weekStart && d <= weekEnd;
    });
  }, [payments, weekStart, weekEnd]);

  const weeklyInflow = thisWeekPayments
    .filter((p) => p.type === "ìž…ê¸ˆ")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const weeklyOutflow = thisWeekPayments
    .filter((p) => p.type === "ì¶œê¸ˆ")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const activeProjectsCount = projects.filter(
    (p) => p.status === "ì§„í–‰ ì¤‘" || p.status === "ê²€í†  ì¤‘"
  ).length;

  const todayTaskCount = (todayData.tasks || []).filter((t) => t.status !== "ì™„ë£Œ").length;

  // í”„ë¡œì íŠ¸ ì¹´ë“œ 6ê°œ
  const topProjects = useMemo(() => {
    return [...projects]
      .filter((p) => p.status !== "ì™„ë£Œ")
      .sort((a, b) => {
        const ra = priorityRank[a.priority] || 5;
        const rb = priorityRank[b.priority] || 5;
        if (ra !== rb) return ra - rb;
        const da = a.deadline ? calcDDay(a.deadline) : 999;
        const db = b.deadline ? calcDDay(b.deadline) : 999;
        return da - db;
      })
      .slice(0, 6);
  }, [projects]);

  // CFOR 12ì£¼
  const cforWeeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < 12; i++) {
      const wStart = new Date(weekStart);
      wStart.setDate(wStart.getDate() + i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      const wp = payments.filter((p) => {
        if (!p.date) return false;
        const d = new Date(p.date);
        return d >= wStart && d <= wEnd;
      });
      const inflow = wp.filter((p) => p.type === "ìž…ê¸ˆ").reduce((s, p) => s + (p.amount || 0), 0);
      const outflow = wp.filter((p) => p.type === "ì¶œê¸ˆ").reduce((s, p) => s + (p.amount || 0), 0);
      const net = inflow - outflow;
      result.push({
        weekNum: getISOWeek(wStart),
        net,
        netMM: net / 1000000,
        isCurrent: i === 0,
      });
    }
    const maxAbs = Math.max(...result.map((w) => Math.abs(w.netMM)), 1);
    return result.map((w) => ({
      ...w,
      height: Math.max(8, (Math.abs(w.netMM) / maxAbs) * 45),
    }));
  }, [payments, weekStart]);

  const cfor12wTotal = cforWeeks.reduce((s, w) => s + w.netMM, 0);

  // ì˜¤ëŠ˜ì˜ ìž‘ì€ í•  ì¼ (ðŸ”´ ê¸´ê¸‰ë§Œ)
  const todayQuickTasks = useMemo(() => {
    return (todayData.tasks || [])
      .filter((t) => priorityRank[t.priority] === 1)
      .slice(0, 5);
  }, [todayData.tasks]);

  // ìƒíƒœ í´ëž˜ìŠ¤Â·ë¼ë²¨
  const statusClass = (s) => {
    if (s === "ì§„í–‰ ì¤‘") return "status-active";
    if (s === "ê²€í†  ì¤‘") return "status-active";
    if (s === "ëŒ€ê¸° ì¤‘") return "status-wait";
    if (s === "ë³´ë¥˜") return "status-risk";
    return "status-wait";
  };
  const statusLabel = (s) => {
    if (s === "ì§„í–‰ ì¤‘") return "ACTIVE";
    if (s === "ê²€í†  ì¤‘") return "REVIEW";
    if (s === "ëŒ€ê¸° ì¤‘") return "WAIT";
    if (s === "ë³´ë¥˜") return "RISK";
    if (s === "ì™„ë£Œ") return "DONE";
    return "â€”";
  };
  const projectProgress = (p) => {
    if (p.status === "ì™„ë£Œ") return 100;
    if (p.status === "ë³´ë¥˜") return 30;
    if (p.status === "ëŒ€ê¸° ì¤‘") return 25;
    if (p.status === "ê²€í†  ì¤‘") return 60;
    if (p.status === "ì§„í–‰ ì¤‘") return 75;
    return 50;
  };
  const progressBg = (p) => {
    if (p.status === "ë³´ë¥˜") return "#9E3F2D";
    if (p.status === "ëŒ€ê¸° ì¤‘") return "#8C6A24";
    return "#1E4A38";
  };

  const tagForPriority = (priority) => {
    if (priorityRank[priority] === 1) return { cls: "urgent", label: "ê¸´ê¸‰" };
    if (priorityRank[priority] === 2) return { cls: "review", label: "ê²€í† " };
    return { cls: "decide", label: "ê²°ì •" };
  };

  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  // ë Œë”
  // â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
  return (
    <>
      <Head>
        <title>An TÃºr Solais â€” CEO Console</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </Head>

      <style jsx global>{`
        :root {
          --paper: #f6f2ea;
          --paper-2: #efe9dd;
          --ink: #18170f;
          --ink-soft: #45413a;
          --ink-mute: #8a8579;
          --rule: #d9d2c2;
          --rule-soft: #e6dfcd;
          --emerald: #1e4a38;
          --emerald-deep: #133326;
          --gold: #8c6a24;
          --brick: #9e3f2d;
          --brick-soft: #c7715e;
          --moss: #5c6a3c;
          --serif: "Fraunces", "Noto Serif KR", serif;
          --sans: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
          --mono: "JetBrains Mono", "SF Mono", Menlo, monospace;
        }
        * {
          box-sizing: border-box;
        }
        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--paper);
          color: var(--ink);
          font-family: var(--sans);
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(circle at 15% 20%, rgba(30, 74, 56, 0.04), transparent 40%),
            radial-gradient(circle at 85% 80%, rgba(140, 106, 36, 0.05), transparent 45%);
          pointer-events: none;
        }
        .container {
          position: relative;
          z-index: 1;
          max-width: 1320px;
          margin: 0 auto;
          padding: 36px 48px 80px;
        }
        .masthead {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 22px;
          border-bottom: 2px solid var(--ink);
          margin-bottom: 28px;
        }
        .masthead-left {
          display: flex;
          align-items: baseline;
          gap: 18px;
        }
        .wordmark {
          font-family: var(--serif);
          font-weight: 500;
          font-size: 34px;
          letter-spacing: -0.02em;
          line-height: 1;
          font-style: italic;
        }
        .wordmark-sub {
          font-family: var(--serif);
          font-size: 13px;
          font-weight: 400;
          color: var(--ink-mute);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding-bottom: 4px;
        }
        .masthead-right {
          display: flex;
          gap: 28px;
          align-items: flex-end;
          font-size: 12px;
          color: var(--ink-soft);
          letter-spacing: 0.05em;
        }
        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .meta-label {
          font-size: 10px;
          color: var(--ink-mute);
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        .meta-value {
          font-family: var(--mono);
          font-size: 13px;
          color: var(--ink);
        }
        .hero {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 0;
          margin-bottom: 44px;
          border: 1px solid var(--ink);
          background: var(--paper-2);
        }
        .hero-primary {
          padding: 30px 34px 28px;
          border-right: 1px solid var(--ink);
          position: relative;
          background: linear-gradient(135deg, rgba(158, 63, 45, 0.04), transparent 60%);
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--brick);
          margin-bottom: 14px;
        }
        .hero-badge::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brick);
          box-shadow: 0 0 0 4px rgba(158, 63, 45, 0.15);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(158, 63, 45, 0.15); }
          50% { box-shadow: 0 0 0 8px rgba(158, 63, 45, 0.05); }
        }
        .hero-title {
          font-family: var(--serif);
          font-size: 26px;
          font-weight: 500;
          line-height: 1.3;
          letter-spacing: -0.015em;
          margin: 0 0 10px;
          color: var(--ink);
        }
        .hero-title em {
          font-style: italic;
          color: var(--brick);
        }
        .hero-desc {
          font-size: 14px;
          line-height: 1.65;
          color: var(--ink-soft);
          margin-bottom: 18px;
          max-width: 580px;
        }
        .hero-countdown {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 14px 0;
          border-top: 1px dashed var(--rule);
          border-bottom: 1px dashed var(--rule);
          margin-bottom: 16px;
        }
        .countdown-big {
          font-family: var(--mono);
          font-weight: 600;
          font-size: 44px;
          color: var(--brick);
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .countdown-unit {
          font-family: var(--serif);
          font-style: italic;
          font-size: 16px;
          color: var(--ink-mute);
        }
        .countdown-target {
          font-size: 12px;
          color: var(--ink-soft);
          margin-left: auto;
        }
        .countdown-target b {
          font-family: var(--mono);
          color: var(--ink);
          font-weight: 500;
        }
        .hero-actions {
          display: flex;
          gap: 10px;
        }
        .btn {
          padding: 9px 16px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.04em;
          border: 1px solid var(--ink);
          background: var(--ink);
          color: var(--paper);
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: var(--sans);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .btn:hover {
          background: var(--paper);
          color: var(--ink);
        }
        .btn.ghost {
          background: transparent;
          color: var(--ink);
        }
        .btn.ghost:hover {
          background: var(--ink);
          color: var(--paper);
        }
        .hero-secondary {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .alert-item {
          padding: 14px 0;
          border-bottom: 1px solid var(--rule-soft);
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .alert-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .alert-item:first-child {
          padding-top: 0;
        }
        .alert-marker {
          font-family: var(--serif);
          font-style: italic;
          font-size: 13px;
          color: var(--ink-mute);
          padding-top: 1px;
          min-width: 22px;
        }
        .alert-content {
          flex: 1;
        }
        .alert-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--ink);
          margin-bottom: 3px;
          line-height: 1.35;
        }
        .alert-sub {
          font-size: 11.5px;
          color: var(--ink-mute);
          line-height: 1.5;
        }
        .alert-tag {
          display: inline-block;
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 2px 6px;
          margin-left: 6px;
          color: var(--paper);
        }
        .alert-tag.urgent { background: var(--brick); }
        .alert-tag.review { background: var(--gold); }
        .alert-tag.decide { background: var(--emerald); }
        .section-rule {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 0 0 22px;
        }
        .section-rule-num {
          font-family: var(--serif);
          font-style: italic;
          font-size: 14px;
          color: var(--ink-mute);
        }
        .section-rule-title {
          font-family: var(--serif);
          font-size: 21px;
          font-weight: 400;
          letter-spacing: -0.01em;
          color: var(--ink);
        }
        .section-rule-title em {
          font-style: italic;
          color: var(--emerald);
        }
        .section-rule-line {
          flex: 1;
          height: 1px;
          background: var(--rule);
        }
        .section-rule-meta {
          font-size: 11px;
          color: var(--ink-mute);
          font-family: var(--mono);
          letter-spacing: 0.05em;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          margin-bottom: 52px;
          border: 1px solid var(--ink);
        }
        .kpi {
          padding: 24px 22px 22px;
          border-right: 1px solid var(--rule);
          position: relative;
          min-height: 168px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: background 0.2s ease;
        }
        .kpi:last-child { border-right: none; }
        .kpi:hover { background: var(--paper-2); }
        .kpi-label {
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-mute);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .kpi-period {
          font-family: var(--mono);
          font-size: 9.5px;
          color: var(--ink-mute);
          font-weight: 400;
          letter-spacing: 0.05em;
        }
        .kpi-value {
          font-family: var(--serif);
          font-weight: 500;
          font-size: 36px;
          line-height: 1;
          letter-spacing: -0.025em;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .kpi-value-unit {
          font-size: 16px;
          color: var(--ink-mute);
          font-weight: 400;
          margin-left: 2px;
          font-style: italic;
        }
        .kpi-context {
          font-size: 11px;
          color: var(--ink-soft);
          margin-top: 10px;
          line-height: 1.5;
          font-style: italic;
        }
        .project-board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 48px;
        }
        .project-card {
          background: var(--paper-2);
          border: 1px solid var(--rule);
          padding: 20px 22px 18px;
          position: relative;
          transition: all 0.2s ease;
        }
        .project-card:hover {
          border-color: var(--ink);
          transform: translateY(-2px);
          box-shadow: 6px 6px 0 var(--rule-soft);
        }
        .project-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .project-title {
          font-family: var(--serif);
          font-size: 17px;
          font-weight: 500;
          line-height: 1.3;
          letter-spacing: -0.01em;
          color: var(--ink);
          max-width: 70%;
          margin: 0;
        }
        .project-status {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 7px;
          border: 1px solid;
          white-space: nowrap;
        }
        .status-active {
          color: var(--emerald);
          border-color: var(--emerald);
          background: rgba(30, 74, 56, 0.05);
        }
        .status-wait {
          color: var(--gold);
          border-color: var(--gold);
          background: rgba(140, 106, 36, 0.05);
        }
        .status-risk {
          color: var(--brick);
          border-color: var(--brick);
          background: rgba(158, 63, 45, 0.05);
        }
        .project-next {
          font-size: 12.5px;
          color: var(--ink-soft);
          line-height: 1.55;
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px dashed var(--rule);
        }
        .project-next b {
          color: var(--ink);
          font-weight: 500;
        }
        .project-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--ink-mute);
        }
        .project-due {
          font-family: var(--mono);
          color: var(--ink);
          font-weight: 500;
        }
        .project-due.imminent {
          color: var(--brick);
        }
        .project-progress {
          height: 2px;
          background: var(--rule);
          margin-top: 12px;
          position: relative;
          overflow: hidden;
        }
        .project-progress-fill {
          height: 100%;
          transition: width 0.6s ease;
        }
        .cfor-strip {
          background: var(--ink);
          color: var(--paper);
          padding: 22px 28px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 32px;
          align-items: center;
          margin-bottom: 36px;
        }
        .cfor-label {
          font-family: var(--serif);
          font-style: italic;
          font-size: 16px;
        }
        .cfor-label small {
          display: block;
          font-family: var(--sans);
          font-style: normal;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(246, 242, 234, 0.55);
          margin-bottom: 2px;
        }
        .cfor-weeks {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          height: 50px;
        }
        .week-bar {
          flex: 1;
          background: rgba(246, 242, 234, 0.15);
          position: relative;
          transition: background 0.2s ease;
          cursor: pointer;
          min-height: 4px;
        }
        .week-bar:hover {
          background: rgba(246, 242, 234, 0.35);
        }
        .week-bar.positive {
          background: rgba(120, 180, 140, 0.55);
        }
        .week-bar.negative {
          background: rgba(200, 113, 94, 0.65);
        }
        .week-bar.current {
          outline: 1px solid var(--paper);
          outline-offset: 2px;
        }
        .cfor-summary {
          text-align: right;
          font-family: var(--mono);
        }
        .cfor-summary-big {
          font-size: 18px;
          font-weight: 500;
          line-height: 1;
          margin-bottom: 4px;
        }
        .cfor-summary-small {
          font-size: 10px;
          color: rgba(246, 242, 234, 0.6);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 28px;
        }
        .footer-block {
          border-top: 1px solid var(--ink);
          padding-top: 18px;
        }
        .footer-title {
          font-family: var(--serif);
          font-style: italic;
          font-size: 14px;
          color: var(--ink-mute);
          margin-bottom: 14px;
        }
        .quick-item {
          display: flex;
          gap: 12px;
          padding: 8px 0;
          font-size: 13px;
          align-items: center;
          border-bottom: 1px solid var(--rule-soft);
        }
        .quick-item:last-child { border-bottom: none; }
        .quick-check {
          width: 14px;
          height: 14px;
          border: 1.5px solid var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 10px;
          line-height: 1;
        }
        .quick-check.done {
          background: var(--ink);
          color: var(--paper);
        }
        .quick-text {
          flex: 1;
          color: var(--ink-soft);
          line-height: 1.4;
        }
        .quick-text.done {
          text-decoration: line-through;
          color: var(--ink-mute);
        }
        .quick-cat {
          font-family: var(--mono);
          font-size: 10px;
          color: var(--ink-mute);
          letter-spacing: 0.05em;
        }
        .insight-card {
          background: var(--paper-2);
          padding: 18px 20px;
          border-left: 3px solid var(--emerald);
        }
        .insight-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--emerald);
          margin-bottom: 8px;
        }
        .insight-text {
          font-family: var(--serif);
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--ink);
          font-style: italic;
          margin: 0;
        }
        .insight-text strong {
          font-style: normal;
          font-weight: 600;
          color: var(--emerald-deep);
        }
        .colophon {
          text-align: center;
          margin-top: 60px;
          padding-top: 24px;
          border-top: 1px solid var(--rule);
          font-family: var(--serif);
          font-style: italic;
          font-size: 12px;
          color: var(--ink-mute);
        }
        .colophon-rule {
          letter-spacing: 0.3em;
          font-size: 10px;
          text-transform: uppercase;
          font-style: normal;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .loading-state, .error-state {
          padding: 80px 20px;
          text-align: center;
          font-family: var(--serif);
          font-style: italic;
          color: var(--ink-mute);
        }
        .error-state { color: var(--brick); }
        @media (max-width: 900px) {
          .container { padding: 24px 20px 60px; }
          .hero { grid-template-columns: 1fr; }
          .hero-primary { border-right: none; border-bottom: 1px solid var(--ink); }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .kpi:nth-child(2) { border-right: none; }
          .kpi:nth-child(-n+2) { border-bottom: 1px solid var(--rule); }
          .project-board { grid-template-columns: 1fr; }
          .cfor-strip { grid-template-columns: 1fr; gap: 16px; }
          .cfor-summary { text-align: left; }
          .footer-grid { grid-template-columns: 1fr; }
          .masthead { flex-direction: column; align-items: flex-start; gap: 12px; }
          .masthead-right { flex-wrap: wrap; gap: 18px; }
        }
      `}</style>

      <div className="container">
        {/* â”â”â” MASTHEAD â”â”â” */}
        <header className="masthead">
          <div className="masthead-left">
            <div className="wordmark">An TÃºr Solais</div>
            <div className="wordmark-sub">CEO Console Â· ê¹€ë¯¼ìž¬</div>
          </div>
          <div className="masthead-right">
            <div className="meta-item">
              <span className="meta-label">Date</span>
              <span className="meta-value">{dateLabel}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Week</span>
              <span className="meta-value">W{currentWeek} / 52</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">FY Day</span>
              <span className="meta-value">{dayOfYear} / 365</span>
            </div>
          </div>
        </header>

        {loading && <div className="loading-state">ë…¸ì…˜ ë°ì´í„° ë¶ˆëŸ¬ì˜¤ëŠ” ì¤‘â€¦</div>}
        {error && <div className="error-state">âš  ë°ì´í„° ì˜¤ë¥˜: {error}</div>}

        {!loading && !error && (
          <>
            {/* â”â”â” HERO: TODAY'S DECISION â”â”â” */}
            {heroDecision && (
              <section className="hero">
                <div className="hero-primary">
                  <div className="hero-badge">Today's One Decision</div>
                  <h1 className="hero-title">{heroDecision.title}</h1>
                  <p className="hero-desc">
                    {heroDecision.nextAction || heroDecision.progress || "ë‹¤ìŒ ì•¡ì…˜ì„ ë…¸ì…˜ ì§„í–‰ ì—…ë¬´ DBì— ì ì–´ì£¼ì„¸ìš”."}
                  </p>
                  <div className="hero-countdown">
                    <span className="countdown-big">
                      {heroDecision.deadline ? Math.abs(calcDDay(heroDecision.deadline)) : "â€”"}
                    </span>
                    <span className="countdown-unit">
                      {heroDecision.deadline
                        ? calcDDay(heroDecision.deadline) >= 0
                          ? "days remaining"
                          : "days overdue"
                        : "no deadline"}
                    </span>
                    {heroDecision.deadline && (
                      <span className="countdown-target">
                        to <b>{heroDecision.deadline}</b>
                      </span>
                    )}
                  </div>
                  <div className="hero-actions">
                    {heroDecision.url && (
                      <a className="btn" href={heroDecision.url} target="_blank" rel="noreferrer">
                        ë…¸ì…˜ì—ì„œ ì—´ê¸°
                      </a>
                    )}
                    <button className="btn ghost" onClick={() => window.location.reload()}>
                      ìƒˆë¡œê³ ì¹¨
                    </button>
                  </div>
                </div>

                <div className="hero-secondary">
                  {alerts.length === 0 ? (
                    <div style={{ color: "var(--ink-mute)", fontStyle: "italic", fontFamily: "var(--serif)", fontSize: 13 }}>
                      D-7 ì´ë‚´ ë‹¤ë¥¸ ì•ˆê±´ ì—†ìŒ
                    </div>
                  ) : (
                    alerts.map((a, i) => {
                      const tag = tagForPriority(a.priority);
                      const dd = calcDDay(a.deadline);
                      return (
                        <div className="alert-item" key={a.id}>
                          <span className="alert-marker">{["i.", "ii.", "iii."][i]}</span>
                          <div className="alert-content">
                            <div className="alert-title">
                              {a.title}
                              <span className={`alert-tag ${tag.cls}`}>{tag.label}</span>
                            </div>
                            <div className="alert-sub">
                              {a.nextAction
                                ? `${a.nextAction} Â· D${dd >= 0 ? "-" : "+"}${Math.abs(dd)}`
                                : `D${dd >= 0 ? "-" : "+"}${Math.abs(dd)} Â· ${a.category || ""}`}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* â”â”â” KPI â”â”â” */}
            <div className="section-rule">
              <span className="section-rule-num">I.</span>
              <span className="section-rule-title">
                ì´ë²ˆ ì£¼ <em>í•µì‹¬ ì§€í‘œ</em>
              </span>
              <span className="section-rule-line"></span>
              <span className="section-rule-meta">W{currentWeek}</span>
            </div>

            <section className="kpi-grid">
              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    ì´ë²ˆ ì£¼ ìž…ê¸ˆ <span className="kpi-period">W{currentWeek}</span>
                  </div>
                  <div className="kpi-value">
                    {fmtMM(weeklyInflow)}
                    <span className="kpi-value-unit">ë°±ë§Œì›</span>
                  </div>
                </div>
                <div className="kpi-context">
                  {thisWeekPayments.filter((p) => p.type === "ìž…ê¸ˆ").length}ê±´ ì˜ˆì •Â·ì‹¤ìˆ˜ë ¹
                </div>
              </div>

              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    ì´ë²ˆ ì£¼ ì¶œê¸ˆ <span className="kpi-period">W{currentWeek}</span>
                  </div>
                  <div className="kpi-value">
                    {fmtMM(weeklyOutflow)}
                    <span className="kpi-value-unit">ë°±ë§Œì›</span>
                  </div>
                </div>
                <div className="kpi-context">
                  {thisWeekPayments.filter((p) => p.type === "ì¶œê¸ˆ").length}ê±´ ê²°ì œÂ·ìžë™ì´ì²´
                </div>
              </div>

              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    ì§„í–‰ í”„ë¡œì íŠ¸ <span className="kpi-period">í˜„ìž¬</span>
                  </div>
                  <div className="kpi-value">
                    {activeProjectsCount}
                    <span className="kpi-value-unit">ê±´</span>
                  </div>
                </div>
                <div className="kpi-context">ì§„í–‰ ì¤‘ + ê²€í†  ì¤‘ í•©ì‚°</div>
              </div>

              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    ì˜¤ëŠ˜ì˜ í•  ì¼ <span className="kpi-period">ë¯¸ì™„ë£Œ</span>
                  </div>
                  <div className="kpi-value">
                    {todayTaskCount}
                    <span className="kpi-value-unit">ê±´</span>
                  </div>
                </div>
                <div className="kpi-context">CEO í™”ë©´ ê¸°ì¤€ (ì§ì› ë‹´ë‹¹ ì œì™¸)</div>
              </div>
            </section>

            {/* â”â”â” PROJECT BOARD â”â”â” */}
            <div className="section-rule">
              <span className="section-rule-num">II.</span>
              <span className="section-rule-title">
                ì§„í–‰ ì¤‘ <em>í”„ë¡œì íŠ¸</em>
              </span>
              <span className="section-rule-line"></span>
              <span className="section-rule-meta">
                {topProjects.length} OF {projects.filter((p) => p.status !== "ì™„ë£Œ").length}
              </span>
            </div>

            <section className="project-board">
              {topProjects.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--ink-mute)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                  ì§„í–‰ ì¤‘ì¸ í”„ë¡œì íŠ¸ê°€ ì—†ìŠµë‹ˆë‹¤
                </div>
              ) : (
                topProjects.map((p) => {
                  const dd = p.deadline ? calcDDay(p.deadline) : null;
                  return (
                    <article className="project-card" key={p.id}>
                      <div className="project-head">
                        <h3 className="project-title">{p.title}</h3>
                        <span className={`project-status ${statusClass(p.status)}`}>
                          {statusLabel(p.status)}
                        </span>
                      </div>
                      <div className="project-next">
                        <b>Next.</b> {p.nextAction || p.progress || "ë‹¤ìŒ ì•¡ì…˜ì„ ì •í•´ì£¼ì„¸ìš”"}
                      </div>
                      <div className="project-meta">
                        <span>{p.vendor || p.category || "â€”"}</span>
                        {dd !== null && (
                          <span className={`project-due ${dd <= 7 ? "imminent" : ""}`}>
                            {dd >= 0 ? `D-${dd}` : `D+${Math.abs(dd)}`}
                          </span>
                        )}
                      </div>
                      <div className="project-progress">
                        <div
                          className="project-progress-fill"
                          style={{ width: `${projectProgress(p)}%`, background: progressBg(p) }}
                        ></div>
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            {/* â”â”â” CFOR 12W â”â”â” */}
            <div className="section-rule">
              <span className="section-rule-num">III.</span>
              <span className="section-rule-title">
                12ì£¼ <em>ìºì‹œí”Œë¡œìš° ì˜ˆì¸¡</em>
              </span>
              <span className="section-rule-line"></span>
              <span className="section-rule-meta">
                W{currentWeek}â€“W{currentWeek + 11}
              </span>
            </div>

            <section className="cfor-strip">
              <div className="cfor-label">
                <small>Net Weekly</small>
                í˜„ê¸ˆ íë¦„ ì¶”ì´
              </div>
              <div className="cfor-weeks">
                {cforWeeks.map((w, i) => (
                  <div
                    key={i}
                    className={`week-bar ${w.net >= 0 ? "positive" : "negative"} ${w.isCurrent ? "current" : ""}`}
                    style={{ height: `${w.height}px` }}
                    title={`W${w.weekNum}: ${w.net >= 0 ? "+" : ""}${fmtMM(w.net)}MM`}
                  ></div>
                ))}
              </div>
              <div className="cfor-summary">
                <div className="cfor-summary-big">
                  {cfor12wTotal >= 0 ? "+ " : "âˆ’ "}
                  {fmtMM(Math.abs(cfor12wTotal * 1000000))} MM
                </div>
                <div className="cfor-summary-small">12W net projection</div>
              </div>
            </section>

            {/* â”â”â” FOOTER â”â”â” */}
            <section className="footer-grid">
              <div className="footer-block">
                <div className="footer-title">â€” ì˜¤ëŠ˜ì˜ ê¸´ê¸‰ í•  ì¼</div>
                {todayQuickTasks.length === 0 ? (
                  <div style={{ color: "var(--ink-mute)", fontStyle: "italic", fontSize: 13, padding: "10px 0" }}>
                    ðŸ”´ ê¸´ê¸‰ ìš°ì„ ìˆœìœ„ í•  ì¼ì´ ì—†ìŠµë‹ˆë‹¤.
                  </div>
                ) : (
                  todayQuickTasks.map((t) => (
                    <div className="quick-item" key={t.id}>
                      <span className={`quick-check ${t.status === "ì™„ë£Œ" ? "done" : ""}`}>
                        {t.status === "ì™„ë£Œ" ? "âœ“" : ""}
                      </span>
                      <span className={`quick-text ${t.status === "ì™„ë£Œ" ? "done" : ""}`}>{t.title}</span>
                      <span className="quick-cat">{t.category || ""}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="footer-block">
                <div className="footer-title">â€” ì´ë²ˆ ì£¼ ë©”ëª¨</div>
                <div className="insight-card">
                  <div className="insight-label">Weekly Note</div>
                  <p className="insight-text">
                    ì´ ì˜ì—­ì—ëŠ” ë§¤ì£¼ ë³¸ì¸ì´ ì§ì ‘ ì ëŠ” <strong>ì´ë²ˆ ì£¼ ì¸ì‚¬ì´íŠ¸Â·ê´€ì°°</strong>ì´ ë“¤ì–´ê°ˆ ìžë¦¬ìž…ë‹ˆë‹¤.
                    ì¶”í›„ ë…¸ì…˜ íŽ˜ì´ì§€ì™€ ì—°ê²°í•˜ì‹¤ ìˆ˜ ìžˆë„ë¡ ë³„ë„ ì•ˆë‚´ë“œë¦´ê²Œìš”.
                  </p>
                </div>
              </div>
            </section>

            <div className="colophon">
              <div className="colophon-rule">â€” FIN â€”</div>
              An TÃºr Solais Â· ê¹€ë¯¼ìž¬ ëŒ€í‘œ Â· ë§¤ì¼ ì•„ì¹¨ 6ì‹œ ìžë™ ê°±ì‹ 
            </div>
          </>
        )}
      </div>
    </>
  );
}

