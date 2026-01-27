"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Foncier = {
  usage?: any;
};

interface Props {
  fonciers: Foncier[];
}

export default function InvestissementByUsageChart({ fonciers }: Props) {
  const [mode, setMode] = useState<"chart" | "table">("chart");

  const data = useMemo(() => {
    const map: Record<string, number> = {};

    fonciers.forEach((f) => {
      let usage = f.usage;

      if (!usage) usage = "Non défini";
      else if (typeof usage === "object")
        usage = usage.name || usage.label || "Non défini";
      else usage = String(usage);

      map[usage] = (map[usage] || 0) + 1;
    });

    // 🔽 Sort DESC
    return Object.entries(map)
      .map(([usage, total]) => ({ usage, total }))
      .sort((a, b) => b.total - a.total);
  }, [fonciers]);

  if (data.length === 0) {
    return <p className="p-4">Aucune donnée disponible</p>;
  }

  return (
    <div className="p-4 bg-white shadow rounded">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">
          Répartition des Fonciers par Usage
        </h2>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("chart")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "chart"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Graphique
          </button>

          <button
            onClick={() => setMode("table")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "table"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            Tableau
          </button>
        </div>
      </div>

      {/* CHART MODE */}
      {mode === "chart" && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <XAxis
              dataKey="usage"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={80}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" fill="#8884d8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* TABLE MODE */}
      {mode === "table" && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Usage</th>
                <th className="border p-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="border p-2">{row.usage}</td>
                  <td className="border p-2 text-center font-semibold">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
