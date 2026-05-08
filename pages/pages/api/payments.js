import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const PAYMENT_DB_ID = "f751f699-849a-4885-96c5-2e327621a180";

export default async function handler(req, res) {
  try {
    const response = await notion.databases.query({
      database_id: PAYMENT_DB_ID,
      page_size: 100,
    });

    const items = response.results.map((page) => {
      const props = page.properties;
      return {
        id: page.id,
        title: props["제목"]?.title?.[0]?.plain_text || "",
        date: props["예정일"]?.date?.start || null,
        amount: props["원금액"]?.number || 0,
        type: props["입출 구분"]?.select?.name || "",
        status: props["상태"]?.select?.name || "",
        vendor: props["거래처"]?.rich_text?.[0]?.plain_text || "",
        category: props["결제 유형"]?.select?.name || "",
        memo: props["비고"]?.rich_text?.[0]?.plain_text || "",
      };
    });

    res.status(200).json({ items });
  } catch (error) {
    console.error("Notion API error:", error);
    res.status(500).json({ error: error.message });
  }
}
