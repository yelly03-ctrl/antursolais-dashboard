import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { pageId, status, priority, nextAction, progress } = req.body;

    if (!pageId) {
      return res.status(400).json({ error: "pageId required" });
    }

    const properties = {};
    if (status) properties["상태"] = { select: { name: status } };
    if (priority) properties["우선순위"] = { select: { name: priority } };
    if (nextAction !== undefined) properties["다음 액션"] = { rich_text: [{ text: { content: nextAction } }] };
    if (progress !== undefined) properties["진행 사항"] = { rich_text: [{ text: { content: progress } }] };

    await notion.pages.update({
      page_id: pageId,
      properties,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: error.message });
  }
}
