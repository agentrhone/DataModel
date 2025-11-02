import { KPI } from "@/components/kpi";
import { kpiSummary } from "@/kpis/queries";
import dynamic from "next/dynamic";

const RevenueChart = dynamic(() => import("@/components/revenue-chart"), { ssr: false });

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default async function Page() {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // last 30 days
  const { gross, net, aov, repeatRate } = await kpiSummary({ since });

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Gross Sales" value={formatCurrency(gross)} />
        <KPI label="Net Sales" value={formatCurrency(net)} />
        <KPI label="AOV" value={formatCurrency(aov)} />
        <KPI label="Repeat Rate" value={`${Math.round(repeatRate * 100)}%`} />
      </section>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-600">Revenue (Sample)</h2>
        <div className="h-64 w-full">
          <RevenueChart />
        </div>
      </section>
    </main>
  );
}
