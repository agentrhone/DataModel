import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.VERCEL_CRON_SECRET;
  if (secret && req.headers.get("x-vercel-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: Fetch Stripe charges/refunds/fees and upsert
  return NextResponse.json({ ok: true, source: "stripe" });
}

