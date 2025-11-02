import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const secret = process.env.VERCEL_CRON_SECRET;
  if (secret && req.headers.get("x-vercel-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.FB_ACCESS_TOKEN;
  const accountId = process.env.FB_AD_ACCOUNT_ID; // e.g., act_123
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const untilParam = url.searchParams.get("until");
  const since = sinceParam || new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
  const until = untilParam || new Date().toISOString().slice(0, 10);

  if (!token || !accountId) {
    return NextResponse.json({ error: "Missing FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID" }, { status: 500 });
  }

  const params = new URLSearchParams({
    fields: ["spend", "impressions", "clicks", "campaign_name", "date_start", "date_stop"].join(","),
    time_increment: "1",
    time_range: JSON.stringify({ since, until }),
    level: "campaign",
  });
  const endpoint = `https://graph.facebook.com/v18.0/${accountId}/insights?${params.toString()}`;
  const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return NextResponse.json({ error: "Meta request failed", status: res.status, body: body.slice(0, 500) }, { status: 502 });
  }
  const json = (await res.json()) as any;
  const rows: any[] = json.data || [];

  // Idempotent: clear existing platform rows in window then insert
  const startDate = new Date(since);
  const endDate = new Date(until);
  await prisma.adSpend.deleteMany({ where: { platform: "Facebook", date: { gte: startDate, lte: endDate } } });

  let inserted = 0;
  for (const r of rows) {
    const date = new Date(r.date_start);
    const spend = Number(r.spend || 0);
    const impressions = r.impressions != null ? Number(r.impressions) : undefined;
    const clicks = r.clicks != null ? Number(r.clicks) : undefined;
    await prisma.adSpend.create({
      data: {
        date,
        platform: "Facebook",
        campaign: r.campaign_name || null,
        spend: spend.toFixed(2),
        impressions,
        clicks,
      },
    });
    inserted += 1;
  }

  return NextResponse.json({ ok: true, inserted, since, until });
}
