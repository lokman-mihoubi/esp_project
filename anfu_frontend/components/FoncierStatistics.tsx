"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import Wilaya3DChart from "@/components/Wilaya3DChart";
import WilayaChartSwitcher from "@/components/WilayaChartSwitcher";
import { ComposedChart} from "recharts";
import SurfaceProjetDualAxisChart from "@/components/SurfaceProjetDualAxisChart";
import GenerateReportDialog from "@/components/GenerateReportDialog";
import AIReportDialog from "@/components/AIReportDialog";
import MonthlySurfaceCalendarChart from "@/components/MonthlySurfaceCalendarChart";

/* ------------------ CONSTANTS ------------------- */

const WILAYA_NAMES: Record<string, string> = {
  "01": "Adrar", "02": "Chlef", "03": "Laghouat", "04": "Oum El Bouaghi",
  "05": "Batna", "06": "Béjaïa", "07": "Biskra", "08": "Béchar",
  "09": "Blida", "10": "Bouira", "11": "Tamanrasset", "12": "Tébessa",
  "13": "Tlemcen", "14": "Tiaret", "15": "Tizi Ouzou", "16": "Alger",
  "17": "Djelfa", "18": "Jijel", "19": "Sétif", "20": "Saïda",
  "21": "Skikda", "22": "Sidi Bel Abbès", "23": "Annaba", "24": "Guelma",
  "25": "Constantine", "26": "Médéa", "27": "Mostaganem",
  "28": "M’Sila", "29": "Mascara", "30": "Ouargla",
  "31": "Oran", "32": "El Bayadh", "33": "Illizi",
  "34": "Bordj Bou Arreridj", "35": "Boumerdès", "36": "El Tarf",
  "37": "Tindouf", "38": "Tissemsilt", "39": "El Oued",
  "40": "Khenchela", "41": "Souk Ahras", "42": "Tipaza",
  "43": "Mila", "44": "Aïn Defla", "45": "Naama",
  "46": "Aïn Témouchent", "47": "Ghardaïa", "48": "Relizane",
  "49": "Timimoun", "50": "Bordj Badji Mokhtar",
  "51": "Ouled Djellal", "52": "Béni Abbès",
  "53": "In Salah", "54": "In Guezzam",
  "55": "Touggourt", "56": "Djanet",
  "57": "El M’Ghair", "58": "El Menia",
};

const TYPE_COLORS: Record<string, string> = {
  promotion: "#8884d8",
  investissement: "#82ca9d",
  logement: "#ffc658",
  // favoris: "#ff7f50",
};

const TYPES = ["promotion", "investissement", "logement","Logements & équipements"];

export default function FoncierStatistics() {
  const [stats, setStats] = useState<any>(null);
  const [wilayaData, setWilayaData] = useState<any[]>([]);
  const [fonciers, setFonciers] = useState<any[]>([]);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a4de6c"];

  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  /* ------------------ FETCH DATA ------------------- */
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/statistics/`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/wilaya-stats/`)
      .then((r) => r.json())
      .then((data) =>
        setWilayaData(
          data.wilayas_distribution.map((w: any) => ({
            name: WILAYA_NAMES[w.wilaya] || w.wilaya,
            value: w.total || 0,
            types: {
              promotion: w.promotion || 0,
              investissement: w.investissement || 0,
              logement: w.logement || 0,
            },
          }))
        )
      )
      .catch(console.error);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then(setFonciers)
      .catch(console.error);
  }, [accessToken]);

  /* ------------------ BAR DATA ------------------- */
  const barData = stats?.by_type.map((i: any) => ({
    name: i.type,
    value: i.total,
  })) || [];
  const investissementStatusData = useMemo(() => {
    let transmis = 0;
    let published = 0;

    fonciers.forEach((f) => {
      if (f.type === "investissement") {
        if (f.is_transmis) transmis++;
        if (f.is_published) published++;
      }
    });

    return [
      { name: "Transmis", value: transmis },
      { name: "Publié", value: published },
    ];
  }, [fonciers]);

  /* ------------------ MONTHLY TRANSMISSION CURVE ------------------- */
  const transmisCurveData = useMemo(() => {
    const map = new Map<string, any>();
    fonciers.forEach((f) => {
      if (!f.is_transmis || !f.date_transmission) return;
      const d = new Date(f.date_transmission);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, {
          month: d.toLocaleString("default", { month: "short", year: "numeric" }),
          promotion: 0,
          investissement: 0,
          logement: 0,
        });
      }
      if (TYPES.includes(f.type)) {
        map.get(key)[f.type]++;
      }
    });
    return [...map.values()].sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [fonciers]);
  
  /* ------------------ EQUIPMENT & PROMOTION STATUS DATA ------------------- */
const equipementStatusData = useMemo(() => {
  let transmis = 0;
  let published = 0;

  fonciers.forEach((f) => {
    if (f.type === "equipement") {
      if (f.is_transmis) transmis++;
      if (f.is_published) published++;
    }
  });

  return [
    { name: "Transmis", value: transmis },
    { name: "Publié", value: published },
  ];
}, [fonciers]);

const promotionStatusData = useMemo(() => {
  let transmis = 0;
  let published = 0;

  fonciers.forEach((f) => {
    if (f.type === "promotion") {
      if (f.is_transmis) transmis++;
      if (f.is_published) published++;
    }
  });

  return [
    { name: "Transmis", value: transmis },
    { name: "Publié", value: published },
  ];
}, [fonciers]);


/* ------------------ MONTHLY TRANSMISSION CURVE BY TYPE ------------------- */
const monthlyDataByType = useMemo(() => {
  const map: Record<string, { date: Date; promotion: number; investissement: number; logement: number }> = {};

  fonciers.forEach((f) => {
    if (!f.is_transmis || !f.date_transmission) return;
    const d = new Date(f.date_transmission);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!map[key]) {
      map[key] = { date: d, promotion: 0, investissement: 0, logement: 0 };
    }

    // if (TYPES.includes(f.type)) {
    //   map[key][f.type]++;
    // }
  });

  // Sort by date
  return Object.values(map).sort((a, b) => a.date.getTime() - b.date.getTime());
}, [fonciers]);


/* ------------------ DATA FOR DUAL AXIS ------------------- */
const dualAxisData = useMemo(() => {
  const map = new Map<string, any>();

  fonciers.forEach((f) => {
    if (!f.date_transmission) return; // use all dates
    const d = new Date(f.date_transmission);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!map.has(key)) {
      map.set(key, {
        month: d.toLocaleString("default", { month: "short", year: "numeric" }),
        surface: 0,
        projets: 0,
      });
    }

    map.get(key).surface += f.surface || 0; // total surface transmitted
    map.get(key).projets += 1; // total number of projects
  });

  return [...map.values()].sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );
}, [fonciers]);



/* ------------------ SURFACE & NOMBRE DE PROJETS CURVE ------------------- */
const surfaceAndProjetData = useMemo(() => {
  const map = new Map<string, any>();

  fonciers.forEach((f) => {
    if (!f.date_transmission) return; // include all fonciers
    const d = new Date(f.date_transmission);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!map.has(key)) {
      map.set(key, {
        month: d.toLocaleString("default", { month: "short", year: "numeric" }),
        surface: 0,
        projets: 0,
      });
    }

    map.get(key).surface += f.surface || 0; // total surface for the month
    map.get(key).projets += 1; // total number of projects for the month
  });

  return [...map.values()].sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );
}, [fonciers]);



  /* ------------------ RENDER ------------------- */
  if (!stats) return <p className="p-4">Chargement...</p>;
  /* ------------------ INVESTISSEMENT TRANSMIS / PUBLIE ------------------- */
  

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">

      {/* TOTAL */}
      {/* STACKED BAR: Fonciers par Wilaya */}
<div className="col-span-2  shadow rounded bg-white">

  {/* <Wilaya3DChart wilayaData={wilayaData} /> */}
  <WilayaChartSwitcher wilayaData={wilayaData} />

</div>
     <div className="col-span-2 flex  gap-4">
    <GenerateReportDialog
      wilayas={Object.entries(WILAYA_NAMES).map(([code, name]) => ({ code, name }))}
      types={TYPES}
      fonciers={fonciers}
    />
     <AIReportDialog
    wilayas={Object.entries(WILAYA_NAMES).map(([code, name]) => ({ code, name }))}
    types={TYPES}
    fonciers={fonciers}
  />

  </div>
      <div className="p-4 shadow rounded bg-white">
        <h2 className="font-semibold">Total Fonciers</h2>
        <p className="text-2xl font-bold">{stats.total_fonciers}</p>
      </div>

      {/* WILAYA PIE + TABLE */}
      <div className="col-span-2 p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-4">Répartition par Wilaya</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={700}>
          <ReBarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </ReBarChart>
        </ResponsiveContainer>

          {/* Styled Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 rounded-t-lg">
                <tr>
                  <th className="border p-3 text-left">Wilaya</th>
                  <th className="border p-3 text-center">Total</th>
                  <th className="border p-3 text-center">Promotion</th>
                  <th className="border p-3 text-center">Investissement</th>
                  <th className="border p-3 text-center">Logement</th>
                  {/* <th className="border p-3 text-center">Favoris</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {wilayaData.map((w, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="border p-3 font-medium">{w.name}</td>
                    <td className="border p-3 text-center font-bold">{w.value}</td>
                    <td className="border p-3 text-center">{w.types.promotion}</td>
                    <td className="border p-3 text-center">{w.types.investissement}</td>
                    <td className="border p-3 text-center">{w.types.logement}</td>
                    {/* <td className="border p-3 text-center">{w.types.favoris}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MONTHLY TRANSMISSION CURVE */}
     {/* MONTHLY TRANSMISSION CURVE */}
{/* PROMOTION CURVE */}
{/* PROMOTION CURVE */}
<div className="col-span-2 p-4 bg-white shadow rounded">
  <h2 className="font-semibold mb-2">Évolution Mensuelle – Promotion</h2>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={monthlyDataByType}>
      <XAxis
        dataKey="date"
        tickFormatter={(date) =>
          new Date(date).toLocaleString("default", { month: "short", year: "numeric" })
        }
      />
      <YAxis allowDecimals={false} />
      <Tooltip
        labelFormatter={(date) =>
          new Date(date).toLocaleString("default", { month: "long", year: "numeric" })
        }
      />
      <Legend />
      <Line
        type="monotone"
        dataKey="promotion"
        stroke={TYPE_COLORS["promotion"]}
        strokeWidth={3}
        dot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

{/* INVESTISSEMENT CURVE */}
<div className="col-span-2 p-4 bg-white shadow rounded">
  <h2 className="font-semibold mb-2">Évolution Mensuelle – Investissement</h2>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={monthlyDataByType}>
      <XAxis
        dataKey="date"
        tickFormatter={(date) =>
          new Date(date).toLocaleString("default", { month: "short", year: "numeric" })
        }
      />
      <YAxis allowDecimals={false} />
      <Tooltip
        labelFormatter={(date) =>
          new Date(date).toLocaleString("default", { month: "long", year: "numeric" })
        }
      />
      <Legend />
      <Line
        type="monotone"
        dataKey="investissement"
        stroke={TYPE_COLORS["investissement"]}
        strokeWidth={3}
        dot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>

{/* LOGEMENT CURVE */}
<div className="col-span-2 p-4 bg-white shadow rounded">
  <h2 className="font-semibold mb-2">Évolution Mensuelle – Logement</h2>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={monthlyDataByType}>
      <XAxis
        dataKey="date"
        tickFormatter={(date) =>
          new Date(date).toLocaleString("default", { month: "short", year: "numeric" })
        }
      />
      <YAxis allowDecimals={false} />
      <Tooltip
        labelFormatter={(date) =>
          new Date(date).toLocaleString("default", { month: "long", year: "numeric" })
        }
      />
      <Legend />
      <Line
        type="monotone"
        dataKey="logement"
        stroke={TYPE_COLORS["logement"]}
        strokeWidth={3}
        dot={{ r: 4 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>



      {/* PROMOTION – TRANSMIS vs PUBLIE */}
      <div className="p-4 shadow rounded bg-white">
        <h2 className="font-semibold mb-3 text-center">
          Promotion – Transmis vs Publié
        </h2>
        <p className="text-center text-sm mb-3 text-gray-600">
          Foncier urbain destiné au PICC publié sur la plateforme du promoteur
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={promotionStatusData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              <Cell fill="#82ca9d" /> {/* Transmis */}
              <Cell fill="#8884d8" /> {/* Publié */}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
      {/* INVESTISSEMENT TRANSMIS / PUBLIE BAR */}
      <div className="p-4 shadow rounded bg-white">
        <h2 className="font-semibold mb-3 text-center">
          Investissement – Transmis vs Publié
        </h2>
        <p className="text-center text-sm mb-3 text-gray-600">
    Foncier destiné à l'investissement publié sur la plateforme de l'investisseur
  </p>

        <ResponsiveContainer width="100%" height={300}>
          <ReBarChart data={investissementStatusData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              <Cell fill="#82ca9d" /> {/* Transmis */}
              <Cell fill="#8884d8" /> {/* Publié */}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </div>
      {/* EQUIPEMENT – TRANSMIS vs PUBLIE */}
<div className="p-4 shadow rounded bg-white">
  <h2 className="font-semibold mb-3 text-center">
    Equipement – Transmis vs Publié
  </h2>

  <ResponsiveContainer width="100%" height={300}>
    <ReBarChart data={equipementStatusData}>
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
        <Cell fill="#82ca9d" /> {/* Transmis */}
        <Cell fill="#8884d8" /> {/* Publié */}
      </Bar>
    </ReBarChart>
  </ResponsiveContainer>
</div>
<div className="col-span-2">
  <MonthlySurfaceCalendarChart fonciers={fonciers} />
</div>


<div>
      {/* Other charts ... */}
<SurfaceProjetDualAxisChart fonciers={fonciers} />
    </div>
    </div>
  );
}
