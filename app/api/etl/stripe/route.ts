import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toDecimalString(n: number): string { return n.toFixed(2); }

export async function POST(req: Request) {
  const secret = process.env.VERCEL_CRON_SECRET;
  if (secret && req.headers.get("x-vercel-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

  const url = new URL(req.url);
  const afterParam = url.searchParams.get("after");
  const since = afterParam ? new Date(afterParam) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);

  // Pull charges incrementally; expand balance_transaction to read fees
  let starting_after: string | undefined = undefined;
  let updated = 0;

  while (true) {
    const params = new URLSearchParams({ limit: "100", expand: ["data.balance_transaction"].join(",") });
    if (starting_after) params.set("starting_after", starting_after);
    params.set("created[gte]", Math.floor(since.getTime() / 1000).toString());
    const endpoint = `https://api.stripe.com/v1/charges?${params.toString()}`;
    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${sk}` } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json({ error: "Stripe request failed", status: res.status, body: body.slice(0, 500) }, { status: 502 });
    }
    const json = await res.json() as any;
    const data = json.data as any[];
    if (!Array.isArray(data) || data.length === 0) break;

    for (const ch of data) {
      starting_after = ch.id;
      const bt = ch.balance_transaction;
      const fee = bt && typeof bt.fee === "number" ? bt.fee / 100 : 0; // cents → dollars
      const refunded = ch.amount_refunded ? ch.amount_refunded / 100 : 0;
      const orderId = ch.metadata?.order_id || ch.metadata?.orderId || null;
      if (!orderId) continue; // cannot map without an order id link

      await prisma.order.updateMany({
        where: { id: String(orderId) },
        data: {
          feesTotal: toDecimalString(fee),
          refundTotal: toDecimalString(refunded),
        },
      });
      updated += 1;
    }

    if (!json.has_more) break;
  }

  return NextResponse.json({ ok: true, chargesProcessed: updated, since: since.toISOString() });
}
