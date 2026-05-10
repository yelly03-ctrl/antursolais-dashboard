import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAYMENT_DB_ID = "53e312183ab2425dbebf9cb41a4b6928";
const TASKS_DB_ID = "c709b76c63b94f03883f7051d089d343";
const PROJECTS_DB_ID = "d6a2c6681ee349c0ba0a483391cab615";

export default async function handler(req, res) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const today = formatter.format(new Date());

    const [paymentsRes, tasksRes, projectsRes] = await Promise.all([
      notion.databases.query({
        database_id: PAYMENT_DB_ID,
        filter: { property: "예정일", date: { equals: today } },
        page_size: 50,
      }),
      notion.databases.query({
        database_id: TASKS_DB_ID,
        filter: { property: "마감일", date: { equals: today } },
        page_size: 50,
      }),
      notion.databases.query({
        database_id: PROJECTS_DB_ID,
        filter: { property: "마감일", date: { equals: today } },
        page_size: 50,
      }),
    ]);

    const payments = paymentsRes.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        title: p["제목"]?.title?.[0]?.plain_text || "",
        amount: p["원금액"]?.number || 0,
        type: p["입출 구분"]?.select?.name || "",
        vendor: p["거래처"]?.rich_text?.[0]?.plain_text || "",
        status: p["상태"]?.select?.name || "",
      };
    });

    const tasks = tasksRes.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        title: p["제목"]?.title?.[0]?.plain_text || "",
        category: p["카테고리"]?.select?.name || "",
        priority: p["우선순위"]?.select?.name || "",
        status: p["상태"]?.select?.name || "",
      };
    });

    const deadlines = projectsRes.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        title: p["제목"]?.title?.[0]?.plain_text || "",
        category: p["카테고리"]?.select?.name || "",
        priority: p["우선순위"]?.select?.name || "",
        nextAction: p["다음 액션"]?.rich_text?.[0]?.plain_text || "",
        status: p["상태"]?.select?.name || "",
      };
    });

    res.status(200).json({ today, payments, tasks, deadlines });
  } catch (error) {
    console.error("Today API error:", error);
    res.status(500).json({ error: error.message });
  }
}
