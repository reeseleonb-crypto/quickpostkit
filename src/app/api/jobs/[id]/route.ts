import { NextRequest, NextResponse } from "next/server";
import { findJobById } from "@/server/jobs";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; // Next.js 15 passes params as a Promise
    const job = await findJobById(id);
    if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const filename = job.filename;
    const isReady = Boolean(filename);

    return NextResponse.json({
      id: job.id,
      status: isReady ? "ready" : job.status,
      ...(filename ? { filename, download_url: `/api/download/${filename}` } : {})
    });
  } catch (err) {
    console.error("jobs_get_error", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
