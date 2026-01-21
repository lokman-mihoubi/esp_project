"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type Foncier = {
  id: number;
  code: string;
  commune: string;
  description: string;
  wilaya?: string; 
  coordinates?: string;
  coordinates_dms?: string;   
  geojson_file: File | null;
  usage?: string;
  progress_viabilisation?: number;
  surface?: number | string;  // could be string from backend                 
  is_transmis?: boolean;               
  date_transmission?: string | null;   
  is_completed?: boolean; 
  POS?: string;
  Ref_Cadastre_Section?: string;
  Ref_Cadastre_Ilot?: string;
  is_published?: boolean;
};

interface Props {
  fonciers: Foncier[];
}

export default function SurfaceProjetsDailyTotal({ fonciers }: Props) {
  const dailyData = useMemo(() => {
    const map = new Map<string, { day: string; surface: number; projets: number }>();

    fonciers.forEach((f) => {
      // Only include projects that are transmitted AND completed
      if (!f.is_transmis || !f.is_completed || !f.date_transmission) return;

      // Keep only the date (YYYY-MM-DD) to aggregate properly
      const dayKey = f.date_transmission.split("T")[0];

      if (!map.has(dayKey)) {
        map.set(dayKey, { day: dayKey, surface: 0, projets: 0 });
      }

      const entry = map.get(dayKey)!;
      entry.surface += Number(f.surface) || 0; // convert string to number
      entry.projets += 1;                        // count of completed & transmitted projects
    });

    // Sort by actual Date object to ensure chronological order
    return [...map.values()].sort(
      (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
    );
  }, [fonciers]);

  // Debug: check totals in console
  console.log("Surface et projets complétés par date :", dailyData);

  return (
    <div className="p-4 shadow rounded bg-white">
      <h2 className="font-semibold mb-2 text-center">
        Surface Totale & Nombre de Projets Complétés et Transmis par Jour
      </h2>

      {dailyData.length === 0 ? (
        <p className="text-center">Aucun projet complété et transmis enregistré.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={dailyData}
            margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
          >
            <XAxis 
              dataKey="day"
              tickFormatter={(date) =>
                new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
              }
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              label={{ value: "Surface (m²)", angle: -90, position: "insideLeft" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "Nombre de Projets", angle: 90, position: "insideRight" }}
            />
           <Tooltip
  formatter={(value) =>
    new Intl.NumberFormat("fr-FR").format(Number(value) || 0)
  }
/>

            <Legend />

            {/* Line: Total surface */}
            <Line
              yAxisId="left"
              dataKey="surface"
              name="Surface Totale"
              stroke="#82ca9d"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

            {/* Line: Number of projects */}
            <Line
              yAxisId="right"
              dataKey="projets"
              name="Nombre de Projets"
              stroke="#8884d8"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
