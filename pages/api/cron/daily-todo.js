// pages/api/cron/daily-todo.js
// 매일 새벽 6시(KST) 자동 실행 - 오늘 할 일 자동 생성
import { Client } from '@notionhq/client';
 
const notion = new Client({ auth: process.env.NOTION_TOKEN });
 
const PAYMENT_DB_ID  = '53e312183ab2425dbebf9cb41a4b6928';
const PROGRESS_DB_ID = 'd6a2c6681ee349c0ba0a483391cab615';
const TODO_DB_ID     = 'c709b76c63b94f03883f7051d089d343';
 
function kstDate(offsetDays = 0) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setDate(kst.getDate() + offsetDays);
  return kst.toISOString().split('T')[0];
}
 
const CATEGORY_MAP = {
  '해외 진출': '영업',
  '국내 B2B':  '영업',
  '매장':      '영업',
  '신규 SKU':  '제품',
  '공급사':    '거래처',
  '운영':      '기타',
  '기타':      '기타',
};
 
function decidePriority(targetDate, today, tomorrow) {
  if (targetDate <= today)     return '🔴 긴급';
  if (targetDate === tomorrow) return '🟡 높음';
  return '🟢 중간';
}
 
function formatAmount(amount) {
  if (!amount) return '';
  const abs = Math.abs(amount);
  if (abs >= 10000) {
    return (amount / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 }) + '만';
  }
  return amount.toLocaleString('ko-KR');
}
 
export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
 
  const today    = kstDate(0);
  const tomorrow = kstDate(1);
  const yesterday = kstDate(-1);
  const dayAfter = kstDate(2);
 
  const candidates = [];
  const log = { date: today, sources: {} };
 
  try {
    // [1] 결제 스케줄 DB
    const payments = await notion.databases.query({
      database_id: PAYMENT_DB_ID,
      filter: {
        and: [
          { property: '예정일', date: { on_or_after: today } },
          { property: '예정일', date: { on_or_before: dayAfter } },
          { property: '상태',   select: { does_not_equal: '완료' } },
        ],
      },
    });
    log.sources.payments = payments.results.length;
 
    for (const page of payments.results) {
      const p = page.properties;
      const title   = p['제목']?.title?.[0]?.plain_text || '결제';
      const amount  = p['원금액']?.number || 0;
      const inOut   = p['입출 구분']?.select?.name || '';
      const dueDate = p['예정일']?.date?.start || today;
      const company = p['거래처']?.rich_text?.[0]?.plain_text || '';
      const payType = p['결제 유형']?.select?.name || '';
 
      const icon = inOut === '출금' ? '💸' : '💰';
      const sign = inOut === '출금' ? '-' : '+';
      const amt  = amount ? ` ${sign}${formatAmount(amount)}` : '';
 
      candidates.push({
        title: `${icon} ${title}${amt}`,
        dueDate,
        priority: decidePriority(dueDate, today, tomorrow),
        category: '자금',
        memo: `[결제 자동] ${payType}${company ? ` · ${company}` : ''}${inOut ? ` · ${inOut}` : ''}`.substring(0, 200),
        relatedTo: company,
      });
    }
 
    // [2] 진행 중인 업무 DB
    const progress = await notion.databases.query({
      database_id: PROGRESS_DB_ID,
      filter: {
        and: [
          { property: '마감일', date: { on_or_after: today } },
          { property: '마감일', date: { on_or_before: dayAfter } },
          { property: '상태',   select: { does_not_equal: '완료' } },
          { property: '상태',   select: { does_not_equal: '보류' } },
        ],
      },
    });
    log.sources.progress = progress.results.length;
 
    for (const page of progress.results) {
      const p = page.properties;
      const title   = p['제목']?.title?.[0]?.plain_text || '업무';
      const dueDate = p['마감일']?.date?.start || today;
      const nextAct = p['다음 액션']?.rich_text?.[0]?.plain_text || '';
      const cat     = p['카테고리']?.select?.name || '기타';
      const region  = p['지역/거래처']?.rich_text?.[0]?.plain_text || '';
 
      candidates.push({
        title: `🚧 ${title}`,
        dueDate,
        priority: decidePriority(dueDate, today, tomorrow),
        category: CATEGORY_MAP[cat] || '기타',
        memo: `[진행업무 자동] ${nextAct.substring(0, 180)}`,
        relatedTo: region,
      });
    }
 
    // [3] 어제 미완료 항목 자동 이월
    const carryover = await notion.databases.query({
      database_id: TODO_DB_ID,
      filter: {
        and: [
          { property: '마감일', date: { equals: yesterday } },
          {
            or: [
              { property: '상태', select: { equals: '예정' } },
              { property: '상태', select: { equals: '진행중' } },
            ],
          },
        ],
      },
    });
    log.sources.carryover = carryover.results.length;
 
    for (const page of carryover.results) {
      const p = page.properties;
      const title   = p['제목']?.title?.[0]?.plain_text || '이월';
      const memo    = p['메모']?.rich_text?.[0]?.plain_text || '';
      const related = p['관련 거래처']?.rich_text?.[0]?.plain_text || '';
      const cat     = p['카테고리']?.select?.name || '기타';
 
      candidates.push({
        title: `⏭️ ${title}`,
        dueDate: today,
        priority: '🔴 긴급',
        category: cat,
        memo: `[어제 이월] ${memo}`.substring(0, 200),
        relatedTo: related,
      });
    }
 
    // [4] 중복 방지
    const existing = await notion.databases.query({
      database_id: TODO_DB_ID,
      filter: { property: '마감일', date: { equals: today } },
    });
    const existingTitles = new Set(
      existing.results.map((p) => {
        const t = p.properties['제목']?.title?.[0]?.plain_text || '';
        return t.replace(/^[\W_]+/, '').trim().substring(0, 50);
      })
    );
 
    // [5] 할 일 DB에 박기
    const created = [];
    const skipped = [];
 
    for (const c of candidates) {
      const key = c.title.replace(/^[\W_]+/, '').trim().substring(0, 50);
      if (existingTitles.has(key)) {
        skipped.push(c.title);
        continue;
      }
 
      try {
        const newPage = await notion.pages.create({
          parent: { database_id: TODO_DB_ID },
          properties: {
            '제목':     { title: [{ text: { content: c.title } }] },
            '마감일':   { date: { start: c.dueDate } },
            '우선순위': { select: { name: c.priority } },
            '카테고리': { select: { name: c.category } },
            '상태':     { select: { name: '예정' } },
            ...(c.memo && {
              '메모': { rich_text: [{ text: { content: c.memo } }] },
            }),
            ...(c.relatedTo && {
              '관련 거래처': { rich_text: [{ text: { content: c.relatedTo } }] },
            }),
          },
        });
        created.push({ id: newPage.id, title: c.title });
        existingTitles.add(key);
      } catch (e) {
        console.error('Failed:', c.title, e.message);
      }
    }
 
    log.created = created.length;
    log.skipped = skipped.length;
    log.candidates = candidates.length;
 
    return res.status(200).json({
      success: true,
      ...log,
      created_titles: created.map((c) => c.title),
      skipped_titles: skipped,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack?.substring(0, 500),
    });
  }
}
