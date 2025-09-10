export type JobStatus = "working" | "ready" | "failed";

export interface JobRecord {
  id: string;
  sessionId: string;
  status: JobStatus;
  filename?: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory stores (sufficient for single-instance Next.js; swap to Redis later if needed)
const byId = new Map<string, JobRecord>();
const bySession = new Map<string, string>();

function rid(n = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < n; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function createJob(sessionId: string): JobRecord {
  // idempotent guard — if session already has a job, return that one
  const existingId = bySession.get(sessionId);
  if (existingId) return byId.get(existingId)!;

  const id = `job_${rid(8)}`;
  const now = Date.now();
  const rec: JobRecord = {
    id,
    sessionId,
    status: "working",
    createdAt: now,
    updatedAt: now,
  };
  byId.set(id, rec);
  bySession.set(sessionId, id);
  return rec;
}

export function findJobById(id: string): JobRecord | undefined {
  return byId.get(id);
}

export function findJobBySession(sessionId: string): JobRecord | undefined {
  const id = bySession.get(sessionId);
  return id ? byId.get(id) : undefined;
}

export function updateJob(id: string, patch: Partial<JobRecord>): JobRecord | undefined {
  const rec = byId.get(id);
  if (!rec) return undefined;
  const next = { ...rec, ...patch, updatedAt: Date.now() };
  byId.set(id, next);
  return next;
}