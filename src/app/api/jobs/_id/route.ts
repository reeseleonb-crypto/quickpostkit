export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { findJobById } from "@/server/jobs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = findJobById(params.id);
    if (!job) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      filename: job.filename ?? null,
      updatedAt: job.updatedAt,
    });
  } catch (e) {
    console.error("jobs_get_error", e);
    return NextResponse.json({ error: "jobs_failed" }, { status: 500 });
  }
}
