import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const PARENT_PAGE_ID = "355a9cccdaa68186af9cf53fb8a0fb95";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "content required" });
    }

    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const t = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    const fullTitle = `📝 ${m}/${d} ${t} · ${title?.trim() || "빠른 메모"}`;

    const page = await notion.pages.create({
      parent: { page_id: PARENT_PAGE_ID },
      properties: {
        title: { title: [{ text: { content: fullTitle } }] },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content } }] },
        },
      ],
    });

    res.status(200).json({ success: true, pageId: page.id });
  } catch (error) {
    console.error("Work log error:", error);
    res.status(500).json({ error: error.message });
  }
}
