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
  // Example: recompute simple aggregates
  const orders = await prisma.order.aggregate({ _sum: { grossTotal: true }, _count: { id: true } });
  const aov = orders._count.id ? (Number(orders._sum.grossTotal ?? 0) / orders._count.id) : 0;
  return NextResponse.json({ ok: true, aov });
}
