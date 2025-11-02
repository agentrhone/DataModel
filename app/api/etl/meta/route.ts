import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const secret = process.env.VERCEL_CRON_SECRET;
  if (secret && req.headers.get("x-vercel-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Fetch Meta Ads spend or parse CSV and upsert
  return NextResponse.json({ ok: true, source: "meta" });
}
