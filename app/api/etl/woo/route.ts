import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type WooOrder = {
  id: number;
  date_created: string;
  total: string; // numeric string
  total_refunded?: string;
  billing?: { email?: string | null };
  customer_id?: number | null;
  coupon_lines?: Array<{ code: string; discount: string }>;
  fee_lines?: Array<{ total: string }>;
};

function parseMoney(n?: string | number | null): number {
  if (n == null) return 0;
  const v = typeof n === "string" ? parseFloat(n) : n;
  return isFinite(v) ? v : 0;
}

function toDecimalString(n: number): string {
  // Convert to string for Prisma Decimal fields to preserve precision
  return n.toFixed(2);
}

export async function POST(req: Request) {
  const secret = process.env.VERCEL_CRON_SECRET;
  if (secret && req.headers.get("x-vercel-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.WOO_BASE_URL;
  const key = process.env.WOO_CONSUMER_KEY;
  const sec = process.env.WOO_CONSUMER_SECRET;
  if (!base || !key || !sec) {
    return NextResponse.json(
      { error: "Missing WOO_* env vars" },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const full = url.searchParams.get("full") === "1";
  const afterParam = url.searchParams.get("after");

  // Determine incremental window: use latest order createdAt minus 1 day as overlap
  let startDate: Date;
  if (full && !afterParam) {
    startDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365); // 1 year backfill
  } else if (afterParam) {
    const d = new Date(afterParam);
    startDate = isNaN(d.getTime()) ? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) : d;
  } else {
    const latest = await prisma.order.findFirst({
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    startDate = latest ? new Date(latest.createdAt.getTime() - 1000 * 60 * 60 * 24) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);
  }

  const startISO = startDate.toISOString();
  const auth = `consumer_key=${encodeURIComponent(key)}&consumer_secret=${encodeURIComponent(sec)}`;

  let page = 1;
  const perPage = 100;
  let totalOrders = 0;
  const customerAgg = new Map<
    string,
    {
      idKey: string;
      email: string;
      first: Date;
      last: Date;
      count: number;
      spent: number;
      refunds: number;
      net: number;
    }
  >();

  while (true) {
    const endpoint = `${base.replace(/\/$/, "")}/wp-json/wc/v3/orders?per_page=${perPage}&page=${page}&orderby=date&order=asc&after=${encodeURIComponent(
      startISO,
    )}&${auth}`;

    const res = await fetch(endpoint, { headers: { Accept: "application/json" }, next: { revalidate: 0 } });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Woo request failed", status: res.status, body: text.slice(0, 500) },
        { status: 502 },
      );
    }
    const orders = (await res.json()) as WooOrder[];
    if (!Array.isArray(orders) || orders.length === 0) break;

    for (const o of orders) {
      const id = String(o.id);
      const createdAt = new Date(o.date_created);
      const gross = parseMoney(o.total);
      const refunded = parseMoney(o.total_refunded);
      const fees = (o.fee_lines || []).reduce((acc, f) => acc + parseMoney(f.total), 0);
      const net = Math.max(0, gross - refunded - fees);
      const emailRaw = (o.billing?.email || "").trim().toLowerCase();
      const email = emailRaw || (o.customer_id ? `woo-${o.customer_id}@example.invalid` : `guest-${id}@example.invalid`);
      const idKey = emailRaw || (o.customer_id ? `woo:${o.customer_id}` : `guest:${id}`);

      await prisma.order.upsert({
        where: { id },
        create: {
          id,
          customerEmail: email,
          createdAt,
          grossTotal: toDecimalString(gross),
          netTotal: toDecimalString(net),
          refundTotal: toDecimalString(refunded),
          feesTotal: toDecimalString(fees),
        },
        update: {
          customerEmail: email,
          createdAt,
          grossTotal: toDecimalString(gross),
          netTotal: toDecimalString(net),
          refundTotal: toDecimalString(refunded),
          feesTotal: toDecimalString(fees),
        },
      });

      // Coupon usage: replace existing records for this order to keep idempotent
      try {
        await prisma.couponUsage.deleteMany({ where: { orderId: id } });
        for (const c of o.coupon_lines || []) {
          if (!c.code) continue;
          await prisma.couponUsage.create({
            data: {
              orderId: id,
              code: c.code,
              discount: toDecimalString(parseMoney(c.discount)),
              customerEmail: emailRaw || null,
            },
          });
        }
      } catch (_) {
        // Ignore coupon issues to not fail the whole run
      }

      // Aggregate per-customer
      const prev = customerAgg.get(idKey);
      if (!prev) {
        customerAgg.set(idKey, {
          idKey,
          email,
          first: createdAt,
          last: createdAt,
          count: 1,
          spent: gross,
          refunds: refunded,
          net: net,
        });
      } else {
        prev.first = createdAt < prev.first ? createdAt : prev.first;
        prev.last = createdAt > prev.last ? createdAt : prev.last;
        prev.count += 1;
        prev.spent += gross;
        prev.refunds += refunded;
        prev.net += net;
      }

      totalOrders += 1;
    }

    if (orders.length < perPage) break;
    page += 1;
  }

  // Upsert customers from aggregates
  for (const agg of customerAgg.values()) {
    const ltvEstimate = agg.net; // simple placeholder; refine with margin if desired
    const id = agg.email || agg.idKey;
    await prisma.customer.upsert({
      where: { id },
      create: {
        id,
        email: agg.email,
        firstOrderDate: agg.first,
        lastOrderDate: agg.last,
        orderCount: agg.count,
        totalSpent: toDecimalString(agg.spent),
        totalRefunds: toDecimalString(agg.refunds),
        totalNet: toDecimalString(agg.net),
        ltvEstimate: toDecimalString(ltvEstimate),
      },
      update: {
        email: agg.email,
        firstOrderDate: agg.first,
        lastOrderDate: agg.last,
        orderCount: agg.count,
        totalSpent: toDecimalString(agg.spent),
        totalRefunds: toDecimalString(agg.refunds),
        totalNet: toDecimalString(agg.net),
        ltvEstimate: toDecimalString(ltvEstimate),
      },
    });
  }

  return NextResponse.json({ ok: true, importedOrders: totalOrders, startISO });
}
