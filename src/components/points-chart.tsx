"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function PointsChart({ data }: { data: { label: string; points: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="pointsChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--inter-gold)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--inter-gold)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--foreground)", opacity: 0.5 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid rgba(127,127,127,0.15)",
            borderRadius: 12,
            fontSize: 12,
            color: "var(--heading)",
          }}
          labelStyle={{ color: "var(--heading)", fontWeight: 600 }}
          formatter={(value) => [`${Number(value).toFixed(2)} pt`, "Punti cumulati"]}
        />
        <Area
          type="monotone"
          dataKey="points"
          stroke="var(--heading)"
          strokeWidth={2}
          fill="url(#pointsChartFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
