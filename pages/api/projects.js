import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PROJECTS_DB_ID = "d6a2c6681ee349c0ba0a483391cab615";

export default async function handler(req, res) {
  try {
    const response = await notion.databases.query({
      database_id: PROJECTS_DB_ID,
      page_size: 100,
    });

    const items = response.results.map((page) => {
      const p = page.properties;
      return {
        id: page.id,
        title: p["제목"]?.title?.[0]?.plain_text || "",
        category: p["카테고리"]?.select?.name || "",
        status: p["상태"]?.select?.name || "",
        priority: p["우선순위"]?.select?.name || "",
        nextAction: p["다음 액션"]?.rich_text?.[0]?.plain_text || "",
        deadline: p["마감일"]?.date?.start || null,
        progress: p["진행 사항"]?.rich_text?.[0]?.plain_text || "",
        vendor: p["지역/거래처"]?.rich_text?.[0]?.plain_text || "",
        url: page.url,
      };
    });

    res.status(200).json({ items });
  } catch (error) {
    console.error("Projects error:", error);
    res.status(500).json({ error: error.message });
  }
}
