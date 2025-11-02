import { NextResponse } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { kpiSummary, topCustomers } from "@/kpis/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const getKpiSummaryParams = z.object({ sinceDays: z.number().int().positive().max(365).default(30) });
const getTopCustomersParams = z.object({ limit: z.number().int().positive().max(50).default(10) });

export async function POST(req: Request) {
  // Optional guard: auth via cron secret header if you want to restrict
  // For now, allow public access; consider adding auth in production.

  // Fallback mode if no API key: return a simple, grounded answer
  if (!process.env.OPENAI_API_KEY) {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    const [kpis, customers] = await Promise.all([kpiSummary({ since }), topCustomers(5)]);
    const text = `Chat disabled (missing OPENAI_API_KEY). Here are current KPIs: Gross ${kpis.gross.toFixed(
      2,
    )}, Net ${kpis.net.toFixed(2)}, AOV ${kpis.aov.toFixed(2)}, Repeat Rate ${(kpis.repeatRate * 100).toFixed(
      1,
    )}%, ROAS ${kpis.roas.toFixed(2)}x. Top customers: ${customers
      .map((c) => `${c.email} (${c.orderCount} orders, $${c.totalNet.toFixed(2)})`)
      .join(", ")}.`;
    return NextResponse.json({ role: "assistant", content: text });
  }

  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system:
      "You are a precise analytics assistant for a commerce dashboard. Use tools to compute metrics from Postgres. Answer with concise, verifiable numbers and the date window used.",
    messages,
    tools: {
      getKpiSummary: {
        description: "Get gross, net, AOV, repeat rate, and ROAS for the last N days.",
        parameters: getKpiSummaryParams,
        execute: async ({ sinceDays }) => {
          const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * sinceDays);
          const res = await kpiSummary({ since });
          return { since: since.toISOString(), ...res };
        },
      },
      getTopCustomers: {
        description: "List top customers by total net revenue.",
        parameters: getTopCustomersParams,
        execute: async ({ limit }) => {
          const rows = await topCustomers(limit);
          return { rows };
        },
      },
    },
    toolExecution: "auto",
  });

  return result.toAIStreamResponse();
}

