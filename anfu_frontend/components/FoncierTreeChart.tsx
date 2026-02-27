"use client";

import * as React from "react";
import { TreeView, TreeItem } from "@mui/lab";
import {
  Box,
  Typography,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Foncier } from "@/types";
import { WILAYAS } from "@/types/wilayas";

/* ------------ HELPERS ------------ */
const branch = (type: "mid" | "last", length = 22) =>
  `${type === "last" ? "└" : "├"}${"─".repeat(length)}`;

type FoncierTreeChartProps = {
  fonciers: Foncier[];
};

export default function FoncierTreeChart({ fonciers }: FoncierTreeChartProps) {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [selectedType, setSelectedType] = React.useState("all");
  const [selectedWilaya, setSelectedWilaya] = React.useState("all");
  const [viabilisationRange, setViabilisationRange] = React.useState<number[]>([0, 100]);

  const treeRef = React.useRef<HTMLDivElement>(null);

  /* ------------ FILTERED DATA ------------ */
  const filteredFonciers = React.useMemo(() => {
    return fonciers.filter((f) => {
      if (selectedType !== "all" && f.type !== selectedType) return false;
      if (selectedWilaya !== "all" && f.wilaya !== selectedWilaya) return false;
      const v = f.progress_viabilisation ?? 0;
      return v >= viabilisationRange[0] && v <= viabilisationRange[1];
    });
  }, [fonciers, selectedType, selectedWilaya, viabilisationRange]);

  /* ------------ GROUP DATA ------------ */
  const grouped = React.useMemo(() => {
    const result: Record<
      string,
      Record<string, { total: number; transmis: number; publie: number; termine: number }>
    > = {};

    filteredFonciers.forEach((f) => {
      if (!f.type || !f.wilaya) return;

      result[f.type] ??= {};
      result[f.type][f.wilaya] ??= { total: 0, transmis: 0, publie: 0, termine: 0 };

      const s = result[f.type][f.wilaya];
      s.total++;
      if (f.is_transmis) s.transmis++;
      if (f.is_published) s.publie++;
      if (f.is_completed) s.termine++;
    });

    return result;
  }, [filteredFonciers]);

  /* ------------ DOWNLOAD PDF ------------ */
  const downloadPDF = async () => {
    if (!treeRef.current) return;

    const canvas = await html2canvas(treeRef.current, { scale: 2, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 10, pageWidth, imgHeight);
    pdf.save("foncier-tree.pdf");
  };

  return (
    <Box>
      {/* ------------ FILTERS ------------ */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Type</InputLabel>
          <Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {[...new Set(fonciers.map((f) => f.type))].map(
              (type) => type && <MenuItem key={type} value={type}>{type}</MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Wilaya</InputLabel>
          <Select value={selectedWilaya} onChange={(e) => setSelectedWilaya(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {WILAYAS.map((w) => (
              <MenuItem key={w.code} value={w.code}>{w.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ width: 260 }}>
          <Typography gutterBottom>Viabilisation (%)</Typography>
          <Slider
            value={viabilisationRange}
            onChange={(_, v) => setViabilisationRange(v as number[])}
            valueLabelDisplay="auto"
            min={0}
            max={100}
          />
        </Box>

        <Button variant="contained" onClick={downloadPDF}>
          Download PDF
        </Button>
      </Box>

      {/* ------------ TREE ------------ */}
      <Box ref={treeRef}>
        <TreeView
          expanded={expandedItems}
          onNodeToggle={(_, items) => setExpandedItems(items)}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          <TreeItem nodeId="foncier-root" label="🏗️ Foncier">
            {Object.entries(grouped).map(([type, wilayas], i, tArr) => {
              const isLastType = i === tArr.length - 1;
              const typeId = `type-${type}`;

              return (
                <TreeItem key={typeId} nodeId={typeId} label={<Label text={type} type={isLastType ? "last" : "mid"} indent={1} />}>
                  {Object.entries(wilayas).map(([wilayaCode, stats], j, wArr) => {
                    const isLastWilaya = j === wArr.length - 1;
                    const wilayaName = WILAYAS.find(w => w.code === wilayaCode)?.name || wilayaCode;
                    const wilayaId = `${typeId}-wilaya-${wilayaCode}`;

                    return (
                      <TreeItem key={wilayaId} nodeId={wilayaId} label={<Label text={`${wilayaName} (${stats.total})`} type={isLastWilaya ? "last" : "mid"} indent={2} />}>
                        <Branch label="Transmis" value={stats.transmis} parentId={wilayaId} />
                        <Branch label="Publié" value={stats.publie} parentId={wilayaId} />
                        <Branch label="Terminé" value={stats.termine} parentId={wilayaId} />

                        {/* Viabilisation */}
                        <TreeItem nodeId={`${wilayaId}-viabilisation`} label={<Label text="🧪 Taux de viabilisation" type="last" indent={3} />}>
                          {[
                            { label: "0%", min: 0, max: 0 },
                            { label: "1–30%", min: 1, max: 30 },
                            { label: "31–70%", min: 31, max: 70 },
                            { label: "71–100%", min: 71, max: 100 },
                          ].map((r, idx) => {
                            const count = filteredFonciers.filter(
                              f => f.type === type && f.wilaya === wilayaCode && (f.progress_viabilisation ?? 0) >= r.min && (f.progress_viabilisation ?? 0) <= r.max
                            ).length;
                            return <Branch key={`${wilayaId}-${r.label}`} label={r.label} value={count} parentId={`${wilayaId}-viabilisation`} type={idx === 3 ? "last" : "mid"} indent={4} />;
                          })}
                        </TreeItem>
                      </TreeItem>
                    );
                  })}
                </TreeItem>
              );
            })}
          </TreeItem>
        </TreeView>
      </Box>
    </Box>
  );
}

/* ------------ BRANCH COMPONENT ------------ */
function Branch({ label, value, parentId, type = "mid", indent = 3 }: {
  label: string;
  value: number;
  parentId: string;
  type?: "mid" | "last";
  indent?: number;
}) {
  return (
    <TreeItem
      nodeId={`${parentId}-${label}`}
      label={
        <Box
          sx={{
            fontFamily: "monospace",
            ml: indent,
            display: "flex",
            justifyContent: "space-between",
            width: 420,
            transition: "all 0.2s ease",
            "&:hover": { backgroundColor: "#f5f5f5", transform: "scale(1.02)" },
          }}
        >
          <span>{branch(type, 16)} {label}</span>
          <strong>({value})</strong>
        </Box>
      }
    />
  );
}

/* ------------ LABEL HELPER ------------ */
function Label({ text, type = "mid", indent = 0 }: { text: string; type?: "mid" | "last"; indent?: number }) {
  return (
    <Box sx={{ fontFamily: "monospace", ml: indent * 2 }}>
      {branch(type, 20)} {text}
    </Box>
  );
}
