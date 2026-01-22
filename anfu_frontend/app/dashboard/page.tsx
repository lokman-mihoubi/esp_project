"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import CalendrierCRM from "@/components/CalendrierCRM";
import Navbar from "@/components/Navbar";
import CircularProgressWithLabel from "@/components/CircularProgressWithLabel";
import Historique from "@/components/Historique";
import LeftMap from "@/components/LeftMap";

/* ---------------- TYPES ---------------- */

export interface Foncier {
  id: number;
  code: string;
  commune: string;
  type?: string;
  surface?: number;
  geojson_file?: string;
}

/* ---------------- PAGE ---------------- */

export default function DashboardPage() {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState("promotion");
  const [rows, setRows] = useState<Foncier[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newItem, setNewItem] = useState<Omit<Foncier, "id">>({
    code: "",
    commune: "",
    type: "",
    surface: 0,
    geojson_file: "",
  });

  /* -------- TEST HANDLERS -------- */

  const handleAdd = () => {
    const item: Foncier = {
      id: Date.now(),
      ...newItem,
    };

    setRows((prev) => [...prev, item]);
    setDialogOpen(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left map */}
        <div className="w-1/3 border-r">
          <LeftMap />
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 space-y-6">
          <h1 className="text-2xl font-bold">Dashboard (Test Page)</h1>

          {/* Progress example */}
          <div className="w-40">
            <CircularProgressWithLabel value={60} />
          </div>

          {/* Calendar */}
          <CalendrierCRM />

          {/* History */}
          <Historique />

          {/* Test controls */}
          <div className="bg-white p-4 rounded shadow space-y-3">
            <h2 className="font-semibold">Test Add Foncier</h2>

            <input
              placeholder="Code"
              value={newItem.code}
              onChange={(e) =>
                setNewItem({ ...newItem, code: e.target.value })
              }
              className="border p-2 rounded w-full"
            />

            <input
              placeholder="Commune"
              value={newItem.commune}
              onChange={(e) =>
                setNewItem({ ...newItem, commune: e.target.value })
              }
              className="border p-2 rounded w-full"
            />

            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Row
            </button>
          </div>

          {/* Debug list */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Rows</h2>

            {rows.length === 0 ? (
              <p>No data yet</p>
            ) : (
              <ul className="space-y-1">
                {rows.map((r) => (
                  <li key={r.id}>
                    {r.code} — {r.commune}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import CalendrierCRM from "@/components/CalendrierCRM";
import Navbar from "@/components/Navbar";
import CircularProgressWithLabel from "@/components/CircularProgressWithLabel";
import Historique from "@/components/Historique";
import LeftMap from "@/components/LeftMap";

/* ---------------- TYPES ---------------- */

export interface Foncier {
  id: number;
  code: string;
  commune: string;
  type?: string;
  surface?: number;
  geojson_file?: string;
}

/* ---------------- PAGE ---------------- */

export default function DashboardPage() {
  const router = useRouter();

  const [selectedType, setSelectedType] = useState("promotion");
  const [rows, setRows] = useState<Foncier[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newItem, setNewItem] = useState<Omit<Foncier, "id">>({
    code: "",
    commune: "",
    type: "",
    surface: 0,
    geojson_file: "",
  });

  /* -------- TEST HANDLERS -------- */

  const handleAdd = () => {
    const item: Foncier = {
      id: Date.now(),
      ...newItem,
    };

    setRows((prev) => [...prev, item]);
    setDialogOpen(false);
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1">
        {/* Left map */}
        <div className="w-1/3 border-r">
          <LeftMap />
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 space-y-6">
          <h1 className="text-2xl font-bold">Dashboard (Test Page)</h1>

          {/* Progress example */}
          <div className="w-40">
            <CircularProgressWithLabel value={60} />
          </div>

          {/* Calendar */}
          <CalendrierCRM />

          {/* History */}
          <Historique />

          {/* Test controls */}
          <div className="bg-white p-4 rounded shadow space-y-3">
            <h2 className="font-semibold">Test Add Foncier</h2>

            <input
              placeholder="Code"
              value={newItem.code}
              onChange={(e) =>
                setNewItem({ ...newItem, code: e.target.value })
              }
              className="border p-2 rounded w-full"
            />

            <input
              placeholder="Commune"
              value={newItem.commune}
              onChange={(e) =>
                setNewItem({ ...newItem, commune: e.target.value })
              }
              className="border p-2 rounded w-full"
            />

            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Row
            </button>
          </div>

          {/* Debug list */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Rows</h2>

            {rows.length === 0 ? (
              <p>No data yet</p>
            ) : (
              <ul className="space-y-1">
                {rows.map((r) => (
                  <li key={r.id}>
                    {r.code} — {r.commune}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
