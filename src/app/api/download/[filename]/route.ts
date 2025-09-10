export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ filename: string }> }
) {
  const { filename } = await ctx.params;
  const filePath = path.resolve(process.cwd(), ".next", "tmp", filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = fs.readFileSync(filePath);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(data.length),
      "Cache-Control": "no-store",
    },
  });
}