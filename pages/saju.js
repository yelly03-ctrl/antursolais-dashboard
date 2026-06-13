import { useState } from "react";

const PILLAR_LABELS = [
  ["hour", "시주"],
  ["day", "일주"],
  ["month", "월주"],
  ["year", "연주"],
];

export default function SajuPage() {
  const [form, setForm] = useState({
    year: 1990, month: 5, day: 15, hour: 8, minute: 30, longitude: 126.978,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null); setData(null);
    try {
      const p = new URLSearchParams(form).toString();
      const r = await fetch(`/api/saju?${p}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "계산 실패");
      setData(j);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <h1 style={S.h1}>🦊 구미호 사주</h1>
        <p style={S.sub}>운명이 아니라 기질의 지도. 생년월일시를 넣어보세요.</p>

        <form onSubmit={onSubmit} style={S.form}>
          <div style={S.row}>
            <Field label="연" value={form.year} onChange={set("year")} w={84} />
            <Field label="월" value={form.month} onChange={set("month")} w={64} />
            <Field label="일" value={form.day} onChange={set("day")} w={64} />
          </div>
          <div style={S.row}>
            <Field label="시 (0-23)" value={form.hour} onChange={set("hour")} w={84} />
            <Field label="분" value={form.minute} onChange={set("minute")} w={64} />
            <Field label="경도(동경)" value={form.longitude} onChange={set("longitude")} w={110} />
          </div>
          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? "계산 중…" : "사주 뽑기"}
          </button>
        </form>

        {error && <div style={S.error}>⚠️ {error}</div>}

        {data && (
          <div style={S.result}>
            <div style={S.pillars}>
              {PILLAR_LABELS.map(([k, label]) => {
                const p = data.pillars[k];
                return (
                  <div key={k} style={S.pillar}>
                    <div style={S.pLabel}>{label}</div>
                    <div style={S.pStem}>{p.stem}</div>
                    <div style={S.pBranch}>{p.branch}</div>
                    <div style={S.pKo}>{p.ganjiKo}</div>
                  </div>
                );
              })}
            </div>

            <div style={S.card}>
              <b>일간(자아의 핵심):</b> {data.dayMaster.stemKo} ({data.dayMaster.element}/{data.dayMaster.yinYang})
            </div>

            <div style={S.card}>
              <b>오행 분포</b>
              <div style={S.elems}>
                {data.elements.map((e) => (
                  <span key={e.name} style={{
                    ...S.elem,
                    opacity: e.count === 0 ? 0.3 : 1,
                    fontWeight: e.dominant ? 800 : 400,
                  }}>
                    {e.name} {e.count}
                    {e.excess ? " 🔥" : ""}{e.absent ? " ·없음" : ""}
                  </span>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <b>십신</b>
              <div style={S.tengods}>
                {Object.entries(data.tenGods).map(([pos, g]) => (
                  <span key={pos} style={S.tg}><i style={S.tgPos}>{pos}</i> {g}</span>
                ))}
              </div>
            </div>

            <div style={S.note}>
              태양황경 {data.meta.sunLongitude}° · {data.meta.note}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, w }) {
  return (
    <label style={S.fieldWrap}>
      <span style={S.fieldLabel}>{label}</span>
      <input value={value} onChange={onChange} style={{ ...S.input, width: w }} inputMode="numeric" />
    </label>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#0d0b1a", color: "#ece9f5", fontFamily: "ui-sans-serif, system-ui, 'Apple SD Gothic Neo', sans-serif", padding: "40px 16px" },
  wrap: { maxWidth: 560, margin: "0 auto" },
  h1: { fontSize: 30, margin: "0 0 6px" },
  sub: { color: "#a59ec9", margin: "0 0 24px", fontSize: 14 },
  form: { background: "#171430", borderRadius: 16, padding: 20, border: "1px solid #2a2350" },
  row: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 4 },
  fieldLabel: { fontSize: 12, color: "#a59ec9" },
  input: { background: "#0d0b1a", border: "1px solid #3a3268", borderRadius: 8, color: "#fff", padding: "8px 10px", fontSize: 15 },
  btn: { width: "100%", marginTop: 6, background: "linear-gradient(90deg,#7b5cff,#c44fd0)", border: 0, color: "#fff", padding: "12px", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer" },
  error: { marginTop: 16, background: "#3a1020", border: "1px solid #7a2540", padding: 12, borderRadius: 10, color: "#ffb3c4" },
  result: { marginTop: 24 },
  pillars: { display: "flex", gap: 10, justifyContent: "space-between" },
  pillar: { flex: 1, background: "#171430", border: "1px solid #2a2350", borderRadius: 12, padding: "12px 6px", textAlign: "center" },
  pLabel: { fontSize: 11, color: "#a59ec9", marginBottom: 6 },
  pStem: { fontSize: 30, fontWeight: 800, color: "#ffd86b", lineHeight: 1.1 },
  pBranch: { fontSize: 30, fontWeight: 800, color: "#7bd6ff", lineHeight: 1.1 },
  pKo: { fontSize: 12, color: "#cfc8ee", marginTop: 6 },
  card: { marginTop: 14, background: "#171430", border: "1px solid #2a2350", borderRadius: 12, padding: 14, fontSize: 15 },
  elems: { display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" },
  elem: { fontSize: 15 },
  tengods: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" },
  tg: { fontSize: 13, background: "#0d0b1a", border: "1px solid #3a3268", borderRadius: 8, padding: "4px 8px" },
  tgPos: { color: "#a59ec9", fontStyle: "normal", marginRight: 4 },
  note: { marginTop: 14, fontSize: 11, color: "#6f6896", lineHeight: 1.5 },
};
