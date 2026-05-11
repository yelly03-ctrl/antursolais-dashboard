import { Client } from "@notionhq/client";
 
const notion = new Client({ auth: process.env.NOTION_TOKEN });
 
const PAYMENT_DB_ID = "53e312183ab2425dbebf9cb41a4b6928";
const PROGRESS_DB_ID = "d6a2c6681ee349c0ba0a483391cab615";
const TODO_DB_ID = "c709b76c63b94f03883f7051d089d343";
 
// V6.6: KST 기준 yyyy-mm-dd
function kstDate(offset = 0) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() + offset);
  return kst.toISOString().split("T")[0];
}
 
function fmtAmount(amount) {
  if (!amount) return "";
  const sign = amount >= 0 ? "+" : "-";
  const abs = Math.abs(amount);
  if (abs >= 100000000) return sign + (abs / 100000000).toFixed(1) + "억";
  if (abs >= 10000) return sign + (abs / 10000).toFixed(0) + "만";
  return sign + abs.toLocaleString();
}
 
function getText(rt) {
  if (!rt) return "";
  if (Array.isArray(rt)) return rt.map(t => t.plain_text || "").join("");
  return "";
}
 
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
 
  try {
    const today = kstDate(0);
    const yesterday = kstDate(-1);
 
    // ─────────────────────────────────────────────────────
    // 1. 오늘 결제 (V6.6: "예정일" = 오늘만 / 상태 != 완료)
    // ─────────────────────────────────────────────────────
    const paymentsRes = await notion.databases.query({
      database_id: PAYMENT_DB_ID,
      filter: {
        and: [
          { property: "예정일", date: { equals: today } },
          { property: "상태", select: { does_not_equal: "완료" } },
        ],
      },
    });
    const payments = paymentsRes.results;
 
    // ─────────────────────────────────────────────────────
    // 2. 오늘 마감 진행 업무 (완료·보류 제외)
    // ─────────────────────────────────────────────────────
    const progressRes = await notion.databases.query({
      database_id: PROGRESS_DB_ID,
      filter: {
        and: [
          { property: "마감일", date: { equals: today } },
          { property: "상태", select: { does_not_equal: "완료" } },
          { property: "상태", select: { does_not_equal: "보류" } },
        ],
      },
    });
    const progress = progressRes.results;
 
    // ─────────────────────────────────────────────────────
    // 3. 어제 미완료 이월 (할 일 DB에서 어제 마감, 미완료)
    // ─────────────────────────────────────────────────────
    const carryoverRes = await notion.databases.query({
      database_id: TODO_DB_ID,
      filter: {
        and: [
          { property: "마감일", date: { equals: yesterday } },
          { property: "상태", select: { does_not_equal: "완료" } },
        ],
      },
    });
    const carryover = carryoverRes.results;
 
    // ─────────────────────────────────────────────────────
    // 4. 오늘 이미 박힌 할 일 (V6.6: ID 기반 중복 검사)
    // ─────────────────────────────────────────────────────
    const existingRes = await notion.databases.query({
      database_id: TODO_DB_ID,
      filter: { property: "마감일", date: { equals: today } },
    });
 
    const existingPaymentIds = new Set();
    const existingProgressIds = new Set();
    const existingTitles = new Set();
    existingRes.results.forEach(p => {
      const title = getText(p.properties["제목"]?.title).trim();
      if (title) existingTitles.add(title);
      const memo = getText(p.properties["메모"]?.rich_text);
      const pMatch = memo.match(/\[결제 ID: ([a-f0-9-]+)\]/);
      if (pMatch) existingPaymentIds.add(pMatch[1]);
      const gMatch = memo.match(/\[진행 ID: ([a-f0-9-]+)\]/);
      if (gMatch) existingProgressIds.add(gMatch[1]);
    });
 
    let created = 0, skipped = 0;
    const createdTitles = [], skippedTitles = [];
 
    // ─────────────────────────────────────────────────────
    // 5. 결제 → 할 일 박기 (ID 매칭 / 제목 매칭 이중)
    // ─────────────────────────────────────────────────────
    for (const p of payments) {
      if (existingPaymentIds.has(p.id)) {
        skipped++;
        skippedTitles.push(`[ID중복] ${getText(p.properties["제목"]?.title)}`);
        continue;
      }
      const title = getText(p.properties["제목"]?.title);
      const amount = p.properties["원금액"]?.number || 0;
      const type = p.properties["입출 구분"]?.select?.name || "출금";
      const vendor = getText(p.properties["거래처"]?.rich_text);
      const signedAmount = type === "입금" ? amount : -amount;
      const newTitle = `💰 ${title} ${fmtAmount(signedAmount)}`;
 
      if (existingTitles.has(newTitle.trim())) {
        skipped++;
        skippedTitles.push(`[제목중복] ${newTitle}`);
        continue;
      }
 
      await notion.pages.create({
        parent: { database_id: TODO_DB_ID },
        properties: {
          "제목": { title: [{ text: { content: newTitle } }] },
          "마감일": { date: { start: today } },
          "상태": { select: { name: "예정" } },
          "우선순위": { select: { name: "🔴 긴급" } },
          "카테고리": { select: { name: "자금" } },
          "관련 거래처": { rich_text: [{ text: { content: vendor } }] },
          "메모": { rich_text: [{ text: { content: `[결제 ID: ${p.id}] [결제 자동] ${vendor} · ${type}` } }] },
        },
      });
      created++;
      createdTitles.push(newTitle);
    }
 
    // ─────────────────────────────────────────────────────
    // 6. 진행 업무 → 할 일 박기
    // ─────────────────────────────────────────────────────
    const catMap = { "해외 진출": "영업", "국내 B2B": "영업", "매장": "영업", "신규 SKU": "제품", "공급사": "거래처", "운영": "거래처", "기타": "기타" };
    const prioMap = { "🔴 즉시": "🔴 긴급", "🟠 이번주": "🟡 높음", "🟡 이번달": "🟢 중간", "⚪ 추적": "🔵 낮음" };
 
    for (const w of progress) {
      if (existingProgressIds.has(w.id)) {
        skipped++;
        skippedTitles.push(`[ID중복] ${getText(w.properties["제목"]?.title)}`);
        continue;
      }
      const title = getText(w.properties["제목"]?.title);
      const nextAction = getText(w.properties["다음 액션"]?.rich_text);
      const vendor = getText(w.properties["지역/거래처"]?.rich_text);
      const category = w.properties["카테고리"]?.select?.name || "기타";
      const priority = w.properties["우선순위"]?.select?.name || "🟡 이번달";
      const newTitle = `🚧 ${title}`;
 
      if (existingTitles.has(newTitle.trim())) {
        skipped++;
        skippedTitles.push(`[제목중복] ${newTitle}`);
        continue;
      }
 
      await notion.pages.create({
        parent: { database_id: TODO_DB_ID },
        properties: {
          "제목": { title: [{ text: { content: newTitle } }] },
          "마감일": { date: { start: today } },
          "상태": { select: { name: "예정" } },
          "우선순위": { select: { name: prioMap[priority] || "🟢 중간" } },
          "카테고리": { select: { name: catMap[category] || "기타" } },
          "관련 거래처": { rich_text: [{ text: { content: vendor } }] },
          "메모": { rich_text: [{ text: { content: `[진행 ID: ${w.id}] [진행업무 자동] D-Day${nextAction ? ' · ' + nextAction : ''}` } }] },
        },
      });
      created++;
      createdTitles.push(newTitle);
    }
 
    // ─────────────────────────────────────────────────────
    // 7. 어제 미완료 이월 (V6.6: 새 페이지 안 만들고 마감일만 변경)
    // ─────────────────────────────────────────────────────
    for (const c of carryover) {
      const title = getText(c.properties["제목"]?.title);
      const existingMemo = getText(c.properties["메모"]?.rich_text);
      const newMemo = existingMemo.includes("[어제 이월]")
        ? existingMemo
        : `[어제 이월] ${existingMemo}`.trim();
 
      await notion.pages.update({
        page_id: c.id,
        properties: {
          "마감일": { date: { start: today } },
          "메모": { rich_text: [{ text: { content: newMemo } }] },
        },
      });
      created++;
      createdTitles.push(`[이월] ${title}`);
    }
 
    return res.status(200).json({
      success: true,
      version: "V6.6",
      date: today,
      sources: { payments: payments.length, progress: progress.length, carryover: carryover.length },
      created,
      skipped,
      candidates: payments.length + progress.length + carryover.length,
      created_titles: createdTitles.slice(0, 12),
      skipped_titles: skippedTitles.slice(0, 12),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack?.split('\n').slice(0, 6).join('\n') });
  }
}
