"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { date: "Mon", gross: 1200 },
  { date: "Tue", gross: 980 },
  { date: "Wed", gross: 1430 },
  { date: "Thu", gross: 1100 },
  { date: "Fri", gross: 1650 },
];

export default function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 12, right: 12, top: 4, bottom: 4 }}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="gross" stroke="#2563eb" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

