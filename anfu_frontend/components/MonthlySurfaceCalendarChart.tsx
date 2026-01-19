"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Props = {
  fonciers: any[];
};

const TYPES = ["promotion", "investissement", "logement"];
const TYPE_COLORS: Record<string, string> = {
  promotion: "#8884d8",
  investissement: "#82ca9d",
  logement: "#ffc658",
};

/* ---------------- 3D CYLINDER SHAPE ---------------- */
const Cylinder3DBar = (props: any) => {
  const { x, y, width, height, fill } = props;

  const gradientId = `grad-${Math.random()}`; // unique gradient for each bar

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.8} />
          <stop offset="100%" stopColor={fill} stopOpacity={1} />
        </linearGradient>
      </defs>

      {/* Top ellipse */}
      <ellipse
        cx={x + width / 2}
        cy={y}
        rx={width / 2}
        ry={6}
        fill={`url(#${gradientId})`}
      />
      {/* Body */}
      <rect x={x} y={y} width={width} height={height} fill={`url(#${gradientId})`} />
      {/* Bottom ellipse */}
      <ellipse
        cx={x + width / 2}
        cy={y + height}
        rx={width / 2}
        ry={6}
        fill={`url(#${gradientId})`}
        opacity={0.85}
      />
    </g>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function MonthlySurfaceByType3DCylinderChart({ fonciers }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, Record<string, number>>();

    fonciers.forEach((f) => {
      if (!f.date_transmission || !f.surface) return;

      const d = new Date(f.date_transmission);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;

      const surface = parseFloat(f.surface ?? "0");

      if (!map.has(key)) {
        map.set(key, {
          promotion: 0,
          investissement: 0,
          logement: 0,
          total: 0,
        });
      }

      const monthData = map.get(key)!;

      if (TYPES.includes(f.type)) {
        monthData[f.type] += surface;
      }

      monthData.total += surface;
    });

    return Array.from(map.entries())
      .map(([key, values]) => {
        const [year, month] = key.split("-").map(Number);
        return {
          month: new Date(year, month - 1).toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          ...values,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.month).getTime() - new Date(b.month).getTime()
      );
  }, [fonciers]);

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="font-semibold mb-3">
        Surface transmise par type par mois 
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(v) => `${v.toLocaleString()} m²`} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.05)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const row = payload[0].payload;
                return (
                  <div className="bg-white p-2 shadow rounded border text-sm">
                    <strong>{row.month}</strong>
                    {TYPES.map((type) => (
                      <div key={type}>
                        {type}: {row[type].toLocaleString()} m²
                      </div>
                    ))}
                    <div>Total: {row.total.toLocaleString()} m²</div>
                  </div>
                );
              }
              return null;
            }}
          />

          {TYPES.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="a"
              shape={<Cylinder3DBar />}
              fill={TYPE_COLORS[type]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <p className="text-xs text-gray-500 mt-3">
        Cylindre coloré = surface transmise par type (3D effet)
      </p>
    </div>
  );
}
