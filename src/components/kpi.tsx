type Props = { label: string; value: string };

export function KPI({ label, value }: Props) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

