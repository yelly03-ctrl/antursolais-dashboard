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

  // \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
  // \ub0a0\uc9dc\u00b7\uc22b\uc790 \ud5ec\ud37c
  // \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
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
    // \ubc31\ub9cc\uc6d0 \ub2e8\uc704
    const v = num / 1000000;
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + "B";
    if (Math.abs(v) >= 100) return Math.round(v).toString();
    if (Math.abs(v) >= 10) return v.toFixed(0);
    return v.toFixed(1);
  };

  // \ud560 \uc77c DB\ub294 "\ud83d\udd34 \uae34\uae09", \uc9c4\ud589 \uc5c5\ubb34 DB\ub294 "\ud83d\udd34 \uc989\uc2dc"
  const priorityRank = {
    "\ud83d\udd34 \uc989\uc2dc": 1,
    "\ud83d\udd34 \uae34\uae09": 1,
    "\ud83d\udfe0 \uc774\ubc88\uc8fc": 2,
    "\ud83d\udfe1 \uc774\ubc88\ub2ec": 3,
    "\ud83d\udfe1 \ub192\uc74c": 2,
    "\ud83d\udfe2 \uc911\uac04": 3,
    "\ud83d\udd35 \ub0ae\uc74c": 4,
    "\u26aa \ucd94\uc801": 4,
  };

  // \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
  // \ud575\uc2ec \ub370\uc774\ud130 \uac00\uacf5
  // \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

  // \uc624\ub298\uc758 \uacb0\uc815 \u2014 \ud83d\udd34 \uc989\uc2dc + \uac00\uc7a5 \uac00\uae4c\uc6b4 \ub9c8\uac10 1\uac74
  const heroDecision = useMemo(() => {
    if (projects.length === 0) return null;
    const urgent = projects.filter((p) => priorityRank[p.priority] === 1 && p.status !== "\uc644\ub8cc");
    const pool = urgent.length > 0 ? urgent : projects.filter((p) => p.status !== "\uc644\ub8cc");
    return [...pool].sort((a, b) => {
      const da = a.deadline ? calcDDay(a.deadline) : 999;
      const db = b.deadline ? calcDDay(b.deadline) : 999;
      return da - db;
    })[0];
  }, [projects]);

  // 3\uac1c \uc54c\ub9bc
  const alerts = useMemo(() => {
    const heroId = heroDecision?.id;
    return projects
      .filter((p) => p.id !== heroId && p.status !== "\uc644\ub8cc" && p.deadline)
      .sort((a, b) => {
        const ra = priorityRank[a.priority] || 5;
        const rb = priorityRank[b.priority] || 5;
        if (ra !== rb) return ra - rb;
        return calcDDay(a.deadline) - calcDDay(b.deadline);
      })
      .slice(0, 3);
  }, [projects, heroDecision]);

  // KPI \u2014 \uc774\ubc88 \uc8fc
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
    .filter((p) => p.type === "\uc785\uae08")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const weeklyOutflow = thisWeekPayments
    .filter((p) => p.type === "\ucd9c\uae08")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const activeProjectsCount = projects.filter(
    (p) => p.status === "\uc9c4\ud589 \uc911" || p.status === "\uac80\ud1a0 \uc911"
  ).length;

  const todayTaskCount = (todayData.tasks || []).filter((t) => t.status !== "\uc644\ub8cc").length;

  // \ud504\ub85c\uc81d\ud2b8 \uce74\ub4dc 6\uac1c
  const topProjects = useMemo(() => {
    return [...projects]
      .filter((p) => p.status !== "\uc644\ub8cc")
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

  // CFOR 12\uc8fc
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
      const inflow = wp.filter((p) => p.type === "\uc785\uae08").reduce((s, p) => s + (p.amount || 0), 0);
      const outflow = wp.filter((p) => p.type === "\ucd9c\uae08").reduce((s, p) => s + (p.amount || 0), 0);
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

  // \uc624\ub298\uc758 \uc791\uc740 \ud560 \uc77c (\ud83d\udd34 \uae34\uae09\ub9cc)
  const todayQuickTasks = useMemo(() => {
    return (todayData.tasks || [])
      .filter((t) => priorityRank[t.priority] === 1)
      .slice(0, 5);
  }, [todayData.tasks]);

  // \uc0c1\ud0dc \ud074\ub798\uc2a4\u00b7\ub77c\ubca8
  const statusClass = (s) => {
    if (s === "\uc9c4\ud589 \uc911") return "status-active";
    if (s === "\uac80\ud1a0 \uc911") return "status-active";
    if (s === "\ub300\uae30 \uc911") return "status-wait";
    if (s === "\ubcf4\ub958") return "status-risk";
    return "status-wait";
  };
  const statusLabel = (s) => {
    if (s === "\uc9c4\ud589 \uc911") return "ACTIVE";
    if (s === "\uac80\ud1a0 \uc911") return "REVIEW";
    if (s === "\ub300\uae30 \uc911") return "WAIT";
    if (s === "\ubcf4\ub958") return "RISK";
    if (s === "\uc644\ub8cc") return "DONE";
    return "\u2014";
  };
  const projectProgress = (p) => {
    if (p.status === "\uc644\ub8cc") return 100;
    if (p.status === "\ubcf4\ub958") return 30;
    if (p.status === "\ub300\uae30 \uc911") return 25;
    if (p.status === "\uac80\ud1a0 \uc911") return 60;
    if (p.status === "\uc9c4\ud589 \uc911") return 75;
    return 50;
  };
  const progressBg = (p) => {
    if (p.status === "\ubcf4\ub958") return "#9E3F2D";
    if (p.status === "\ub300\uae30 \uc911") return "#8C6A24";
    return "#1E4A38";
  };

  const tagForPriority = (priority) => {
    if (priorityRank[priority] === 1) return { cls: "urgent", label: "\uae34\uae09" };
    if (priorityRank[priority] === 2) return { cls: "review", label: "\uac80\ud1a0" };
    return { cls: "decide", label: "\uacb0\uc815" };
  };

  // \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
  // \ub80c\ub354
  // \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
  return (
    <>
      <Head>
        <title>An T\u00far Solais \u2014 CEO Console</title>
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
        {/* \u2501\u2501\u2501 MASTHEAD \u2501\u2501\u2501 */}
        <header className="masthead">
          <div className="masthead-left">
            <div className="wordmark">An T\u00far Solais</div>
            <div className="wordmark-sub">CEO Console \u00b7 \uae40\ubbfc\uc7ac</div>
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

        {loading && <div className="loading-state">\ub178\uc158 \ub370\uc774\ud130 \ubd88\ub7ec\uc624\ub294 \uc911\u2026</div>}
        {error && <div className="error-state">\u26a0 \ub370\uc774\ud130 \uc624\ub958: {error}</div>}

        {!loading && !error && (
          <>
            {/* \u2501\u2501\u2501 HERO: TODAY'S DECISION \u2501\u2501\u2501 */}
            {heroDecision && (
              <section className="hero">
                <div className="hero-primary">
                  <div className="hero-badge">Today's One Decision</div>
                  <h1 className="hero-title">{heroDecision.title}</h1>
                  <p className="hero-desc">
                    {heroDecision.nextAction || heroDecision.progress || "\ub2e4\uc74c \uc561\uc158\uc744 \ub178\uc158 \uc9c4\ud589 \uc5c5\ubb34 DB\uc5d0 \uc801\uc5b4\uc8fc\uc138\uc694."}
                  </p>
                  <div className="hero-countdown">
                    <span className="countdown-big">
                      {heroDecision.deadline ? Math.abs(calcDDay(heroDecision.deadline)) : "\u2014"}
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
                        \ub178\uc158\uc5d0\uc11c \uc5f4\uae30
                      </a>
                    )}
                    <button className="btn ghost" onClick={() => window.location.reload()}>
                      \uc0c8\ub85c\uace0\uce68
                    </button>
                  </div>
                </div>

                <div className="hero-secondary">
                  {alerts.length === 0 ? (
                    <div style={{ color: "var(--ink-mute)", fontStyle: "italic", fontFamily: "var(--serif)", fontSize: 13 }}>
                      D-7 \uc774\ub0b4 \ub2e4\ub978 \uc548\uac74 \uc5c6\uc74c
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
                                ? `${a.nextAction} \u00b7 D${dd >= 0 ? "-" : "+"}${Math.abs(dd)}`
                                : `D${dd >= 0 ? "-" : "+"}${Math.abs(dd)} \u00b7 ${a.category || ""}`}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* \u2501\u2501\u2501 KPI \u2501\u2501\u2501 */}
            <div className="section-rule">
              <span className="section-rule-num">I.</span>
              <span className="section-rule-title">
                \uc774\ubc88 \uc8fc <em>\ud575\uc2ec \uc9c0\ud45c</em>
              </span>
              <span className="section-rule-line"></span>
              <span className="section-rule-meta">W{currentWeek}</span>
            </div>

            <section className="kpi-grid">
              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    \uc774\ubc88 \uc8fc \uc785\uae08 <span className="kpi-period">W{currentWeek}</span>
                  </div>
                  <div className="kpi-value">
                    {fmtMM(weeklyInflow)}
                    <span className="kpi-value-unit">\ubc31\ub9cc\uc6d0</span>
                  </div>
                </div>
                <div className="kpi-context">
                  {thisWeekPayments.filter((p) => p.type === "\uc785\uae08").length}\uac74 \uc608\uc815\u00b7\uc2e4\uc218\ub839
                </div>
              </div>

              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    \uc774\ubc88 \uc8fc \ucd9c\uae08 <span className="kpi-period">W{currentWeek}</span>
                  </div>
                  <div className="kpi-value">
                    {fmtMM(weeklyOutflow)}
                    <span className="kpi-value-unit">\ubc31\ub9cc\uc6d0</span>
                  </div>
                </div>
                <div className="kpi-context">
                  {thisWeekPayments.filter((p) => p.type === "\ucd9c\uae08").length}\uac74 \uacb0\uc81c\u00b7\uc790\ub3d9\uc774\uccb4
                </div>
              </div>

              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    \uc9c4\ud589 \ud504\ub85c\uc81d\ud2b8 <span className="kpi-period">\ud604\uc7ac</span>
                  </div>
                  <div className="kpi-value">
                    {activeProjectsCount}
                    <span className="kpi-value-unit">\uac74</span>
                  </div>
                </div>
                <div className="kpi-context">\uc9c4\ud589 \uc911 + \uac80\ud1a0 \uc911 \ud569\uc0b0</div>
              </div>

              <div className="kpi">
                <div>
                  <div className="kpi-label">
                    \uc624\ub298\uc758 \ud560 \uc77c <span className="kpi-period">\ubbf8\uc644\ub8cc</span>
                  </div>
                  <div className="kpi-value">
                    {todayTaskCount}
                    <span className="kpi-value-unit">\uac74</span>
                  </div>
                </div>
                <div className="kpi-context">CEO \ud654\uba74 \uae30\uc900 (\uc9c1\uc6d0 \ub2f4\ub2f9 \uc81c\uc678)</div>
              </div>
            </section>

            {/* \u2501\u2501\u2501 PROJECT BOARD \u2501\u2501\u2501 */}
            <div className="section-rule">
              <span className="section-rule-num">II.</span>
              <span className="section-rule-title">
                \uc9c4\ud589 \uc911 <em>\ud504\ub85c\uc81d\ud2b8</em>
              </span>
              <span className="section-rule-line"></span>
              <span className="section-rule-meta">
                {topProjects.length} OF {projects.filter((p) => p.status !== "\uc644\ub8cc").length}
              </span>
            </div>

            <section className="project-board">
              {topProjects.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--ink-mute)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
                  \uc9c4\ud589 \uc911\uc778 \ud504\ub85c\uc81d\ud2b8\uac00 \uc5c6\uc2b5\ub2c8\ub2e4
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
                        <b>Next.</b> {p.nextAction || p.progress || "\ub2e4\uc74c \uc561\uc158\uc744 \uc815\ud574\uc8fc\uc138\uc694"}
                      </div>
                      <div className="project-meta">
                        <span>{p.vendor || p.category || "\u2014"}</span>
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

            {/* \u2501\u2501\u2501 CFOR 12W \u2501\u2501\u2501 */}
            <div className="section-rule">
              <span className="section-rule-num">III.</span>
              <span className="section-rule-title">
                12\uc8fc <em>\uce90\uc2dc\ud50c\ub85c\uc6b0 \uc608\uce21</em>
              </span>
              <span className="section-rule-line"></span>
              <span className="section-rule-meta">
                W{currentWeek}\u2013W{currentWeek + 11}
              </span>
            </div>

            <section className="cfor-strip">
              <div className="cfor-label">
                <small>Net Weekly</small>
                \ud604\uae08 \ud750\ub984 \ucd94\uc774
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
                  {cfor12wTotal >= 0 ? "+ " : "\u2212 "}
                  {fmtMM(Math.abs(cfor12wTotal * 1000000))} MM
                </div>
                <div className="cfor-summary-small">12W net projection</div>
              </div>
            </section>

            {/* \u2501\u2501\u2501 FOOTER \u2501\u2501\u2501 */}
            <section className="footer-grid">
              <div className="footer-block">
                <div className="footer-title">\u2014 \uc624\ub298\uc758 \uae34\uae09 \ud560 \uc77c</div>
                {todayQuickTasks.length === 0 ? (
                  <div style={{ color: "var(--ink-mute)", fontStyle: "italic", fontSize: 13, padding: "10px 0" }}>
                    \ud83d\udd34 \uae34\uae09 \uc6b0\uc120\uc21c\uc704 \ud560 \uc77c\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.
                  </div>
                ) : (
                  todayQuickTasks.map((t) => (
                    <div className="quick-item" key={t.id}>
                      <span className={`quick-check ${t.status === "\uc644\ub8cc" ? "done" : ""}`}>
                        {t.status === "\uc644\ub8cc" ? "\u2713" : ""}
                      </span>
                      <span className={`quick-text ${t.status === "\uc644\ub8cc" ? "done" : ""}`}>{t.title}</span>
                      <span className="quick-cat">{t.category || ""}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="footer-block">
                <div className="footer-title">\u2014 \uc774\ubc88 \uc8fc \uba54\ubaa8</div>
                <div className="insight-card">
                  <div className="insight-label">Weekly Note</div>
                  <p className="insight-text">
                    \uc774 \uc601\uc5ed\uc5d0\ub294 \ub9e4\uc8fc \ubcf8\uc778\uc774 \uc9c1\uc811 \uc801\ub294 <strong>\uc774\ubc88 \uc8fc \uc778\uc0ac\uc774\ud2b8\u00b7\uad00\ucc30</strong>\uc774 \ub4e4\uc5b4\uac08 \uc790\ub9ac\uc785\ub2c8\ub2e4.
                    \ucd94\ud6c4 \ub178\uc158 \ud398\uc774\uc9c0\uc640 \uc5f0\uacb0\ud558\uc2e4 \uc218 \uc788\ub3c4\ub85d \ubcc4\ub3c4 \uc548\ub0b4\ub4dc\ub9b4\uac8c\uc694.
                  </p>
                </div>
              </div>
            </section>

            <div className="colophon">
              <div className="colophon-rule">\u2014 FIN \u2014</div>
              An T\u00far Solais \u00b7 \uae40\ubbfc\uc7ac \ub300\ud45c \u00b7 \ub9e4\uc77c \uc544\uce68 6\uc2dc \uc790\ub3d9 \uac31\uc2e0
            </div>
          </>
        )}
      </div>
    </>
  );
}
