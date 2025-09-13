import { Document, Packer, Paragraph, TextRun } from "docx";

export async function POST() {
  try {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "QuickPostKit  Custom Content Pack", bold: true, size: 28 })] }),
          new Paragraph("Smoke test file: if you see this, auto-download is working."),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="QuickPostKit_${new Date().toISOString().slice(0,10)}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    const fallback = new Document({ sections: [{ children: [ new Paragraph("QuickPostKit  Fallback Pack") ] }] });
    const buf = await Packer.toBuffer(fallback);
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="QuickPostKit_Fallback_${new Date().toISOString().slice(0,10)}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  }
}
