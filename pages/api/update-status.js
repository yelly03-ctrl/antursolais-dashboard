import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { pageId, completed } = req.body;
    if (!pageId) return res.status(400).json({ error: "pageId required" });

    await notion.pages.update({
      page_id: pageId,
      properties: {
        "상태": {
          select: { name: completed ? "완료" : "예정" },
        },
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: error.message });
  }
}
