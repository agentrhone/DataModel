"use client";
import { KPI } from "@/components/kpi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { date: "Mon", gross: 1200, repeatRate: 0.22 },
  { date: "Tue", gross: 980, repeatRate: 0.20 },
  { date: "Wed", gross: 1430, repeatRate: 0.24 },
  { date: "Thu", gross: 1100, repeatRate: 0.21 },
  { date: "Fri", gross: 1650, repeatRate: 0.28 },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Gross Sales" value="$12,340" />
        <KPI label="Net Sales" value="$10,980" />
        <KPI label="AOV" value="$84" />
        <KPI label="Repeat Rate" value="23%" />
      </section>
      <section className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 text-sm font-medium text-gray-600">Revenue (Last 5 Days)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 12, right: 12, top: 4, bottom: 4 }}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="gross" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

