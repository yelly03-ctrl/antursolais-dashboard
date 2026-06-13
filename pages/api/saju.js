import { computeSaju } from "../../lib/saju/index.mjs";

// GET/POST  /api/saju?year=1990&month=5&day=15&hour=8&minute=30&longitude=126.978&tz=540
export default function handler(req, res) {
  try {
    const q = req.method === "POST" ? req.body || {} : req.query;
    const num = (v, d) => (v === undefined || v === "" || v === null ? d : Number(v));

    const year = num(q.year);
    const month = num(q.month);
    const day = num(q.day);
    if (!year || !month || !day) {
      return res.status(400).json({ error: "year, month, day는 필수입니다." });
    }

    const result = computeSaju({
      year,
      month,
      day,
      hour: num(q.hour, 12),
      minute: num(q.minute, 0),
      tzOffsetMinutes: num(q.tz, 540),
      longitude: q.longitude === undefined || q.longitude === "" ? null : Number(q.longitude),
    });

    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
}
