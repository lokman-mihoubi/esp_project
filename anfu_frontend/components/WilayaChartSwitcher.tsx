"use client";

import { useState, useMemo } from "react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import Wilaya3DChart from "@/components/Wilaya3DChart";
import { WILAYA_TYPE_COLORS } from "@/constants/wilayaColors";

interface WilayaChartSwitcherProps {
  wilayaData: any[];
}

export default function WilayaChartSwitcher({
  wilayaData,
}: WilayaChartSwitcherProps) {
  const [mode, setMode] = useState<"2d" | "3d">("2d");

  /* ✅ Normalize data so 3D shows ALL wilayas */
  const normalizedData = useMemo(() => {
    return wilayaData.map((w) => ({
      name: w.name,
      types: {
        promotion: w.types?.promotion ?? 0,
        investissement: w.types?.investissement ?? 0,
        logement: w.types?.logement ?? 0,
        favoris: w.types?.favoris ?? 0,
      },
    }));
  }, [wilayaData]);

  return (
    <div className=" shadow rounded bg-white col-span-2">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        {/* <h2 className="font-semibold">Fonciers par Wilaya</h2> */}

        {/* SWITCH */}
        <div className="flex border rounded overflow-hidden">
          <button
            onClick={() => setMode("2d")}
            className={`px-4 py-1 text-sm transition ${
              mode === "2d"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            2D
          </button>
          <button
            onClick={() => setMode("3d")}
            className={`px-4 py-1 text-sm transition ${
              mode === "3d"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            3D
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {mode === "2d" ? (
        <ResponsiveContainer width="100%" height={400}>
          <ReBarChart data={normalizedData}>
            <XAxis
              dataKey="name"
              interval={0}
              angle={-35}
              textAnchor="end"
              height={90}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />

            <Bar
              dataKey="types.promotion"
              stackId="a"
              fill={WILAYA_TYPE_COLORS.promotion}
              name="Promotion"
            />
            <Bar
              dataKey="types.investissement"
              stackId="a"
              fill={WILAYA_TYPE_COLORS.investissement}
              name="Investissement"
            />
            <Bar
              dataKey="types.logement"
              stackId="a"
              fill={WILAYA_TYPE_COLORS.logement}
              name="Logements & équipements"
            />
            {/* <Bar
              dataKey="types.favoris"
              stackId="a"
              fill={WILAYA_TYPE_COLORS.favoris}
              name="Favoris"
            /> */}
          </ReBarChart>
        </ResponsiveContainer>
      ) : (
        <Wilaya3DChart
          wilayaData={normalizedData}
          colors={WILAYA_TYPE_COLORS}
        />
      )}
    </div>
  );
}
