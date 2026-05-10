import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const PAYMENT_DB_ID = "53e312183ab2425dbebf9cb41a4b6928";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, date, amount, type, vendor, category, memo } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: "title과 date는 필수" });
    }

    const properties = {
      "제목": { title: [{ text: { content: title } }] },
      "예정일": { date: { start: date } },
      "원금액": { number: Number(amount) || 0 },
      "상태": { select: { name: "예정" } },
    };

    if (type) properties["입출 구분"] = { select: { name: type } };
    if (vendor) properties["거래처"] = { rich_text: [{ text: { content: vendor } }] };
    if (category) properties["결제 유형"] = { select: { name: category } };
    if (memo) properties["비고"] = { rich_text: [{ text: { content: memo } }] };

    const page = await notion.pages.create({
      parent: { database_id: PAYMENT_DB_ID },
      properties,
    });

    res.status(200).json({ success: true, pageId: page.id });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({ error: error.message });
  }
}
