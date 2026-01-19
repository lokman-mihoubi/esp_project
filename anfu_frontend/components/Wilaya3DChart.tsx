"use client";

import ReactECharts from "echarts-for-react";
import "echarts-gl";
import { WILAYA_TYPE_COLORS } from "@/constants/wilayaColors";

export default function Wilaya3DChart({ wilayaData }: any) {
  const option = {
    tooltip: {},
    xAxis3D: {
      type: "category",
      data: wilayaData.map((w: any) => w.name),
      name: "Wilaya",
    },
    yAxis3D: {
      type: "category",
      data: ["promotion", "investissement", "logement"],
      name: "Type",
    },
    zAxis3D: {
      type: "value",
      name: "Nombre",
    },
    grid3D: {
      boxWidth: 400,   // bigger width
      boxDepth: 150,   // bigger depth
      viewControl: {
        autoRotate: true,
        projection: "perspective",
        distance: 250, // closer/further
        alpha: 25,     // vertical angle
        beta: 30,      // horizontal rotation
      },
      light: {
        main: { intensity: 1.5 },
        ambient: { intensity: 0.5 },
      },
    },
    series: [
      {
        type: "bar3D",
        shading: "lambert",
        barSize: 20, // make bars thicker
        data: wilayaData.flatMap((w: any) => [
          ["promotion", w.name, w.types.promotion],
          ["investissement", w.name, w.types.investissement],
          ["logement", w.name, w.types.logement],
        ]).map(([type, name, value]: any) => ({
          value: [name, type, value],
          itemStyle: { color: WILAYA_TYPE_COLORS[type] },
        })),
      },
    ],
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      {/* <h2 className="font-semibold text-center mb-4 text-lg md:text-2xl">
        Fonciers par Wilaya – Diagramme 3D
      </h2> */}
      <ReactECharts option={option} style={{ height: 700, width: "100%" }} />
    </div>
  );
}
