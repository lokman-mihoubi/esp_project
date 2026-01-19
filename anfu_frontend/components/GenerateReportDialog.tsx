"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Box,
  LinearProgress,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled, useTheme } from "@mui/material/styles";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ===================== DIALOG STYLE ===================== */

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1.5),
  },
}));

/* ===================== TYPES ===================== */

type GenerateReportDialogProps = {
  wilayas: { code: string; name: string }[];
  types: string[];
  fonciers: any[];
};

/* ===================== IMAGE LOADER ===================== */

const loadImageAsBase64 = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas error");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = reject;
  });

/* ===================== COMPONENT ===================== */

export default function GenerateReportDialog({
  wilayas,
  types,
  fonciers,
}: GenerateReportDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"select" | "writing">("select");

  const [selectedWilayas, setSelectedWilayas] = React.useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  const [filteredFonciers, setFilteredFonciers] = React.useState<any[]>([]);
  const [summary, setSummary] = React.useState({
    totalSurface: 0,
    totalHa: 0,
    totalFonciers: 0,
  });

  const [reportLines, setReportLines] = React.useState<string[]>([]);
  const [animatedText, setAnimatedText] = React.useState("");
  const [currentLine, setCurrentLine] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  /* ===================== RESET ===================== */

  const handleClose = () => {
    setOpen(false);
    setStep("select");
    setAnimatedText("");
    setReportLines([]);
    setCurrentLine(0);
    setProgress(0);
    setFilteredFonciers([]);
    setSummary({ totalSurface: 0, totalHa: 0, totalFonciers: 0 });
  };

  /* ===================== GENERATE REPORT ===================== */

  const generateReport = () => {
    const filtered = fonciers.filter((f) => {
      const d = f.date_transmission ? new Date(f.date_transmission) : null;
      return (
        (!startDate || (d && d >= new Date(startDate))) &&
        (!endDate || (d && d <= new Date(endDate))) &&
        (selectedWilayas.length === 0 ||
          selectedWilayas.includes(f.wilaya)) &&
        (selectedTypes.length === 0 || selectedTypes.includes(f.type))
      );
    });

    const totalSurface = filtered.reduce(
      (s, f) => s + Number(f.surface || 0),
      0
    );

    setFilteredFonciers(filtered);
    setSummary({
      totalSurface,
      totalHa: totalSurface / 10000,
      totalFonciers: filtered.length,
    });

    const lines = [
      "--- Rapport foncier automatique ---",
      `Période : ${startDate || "—"} → ${endDate || "—"}`,
      `Wilayas : ${
        selectedWilayas.length
          ? selectedWilayas
              .map((c) => wilayas.find((w) => w.code === c)?.name || c)
              .join(", ")
          : "Toutes"
      }`,
      `Types : ${selectedTypes.length ? selectedTypes.join(", ") : "Tous"}`,
      "",
      `Total fonciers : ${filtered.length}`,
      `Surface totale : ${totalSurface.toFixed(2)} m² (${(
        totalSurface / 10000
      ).toFixed(4)} ha)`,
      "",
      ...filtered.map((f) => {
        const s = Number(f.surface || 0);
        return `• ${f.code} | ${f.wilaya} | ${f.type} | ${s.toFixed(
          2
        )} m² (${(s / 10000).toFixed(4)} ha)`;
      }),
    ];

    setReportLines(lines);
    setStep("writing");
    setAnimatedText("");
    setCurrentLine(0);
    setProgress(0);
  };

  /* ===================== TEXT ANIMATION ===================== */

  React.useEffect(() => {
    if (step !== "writing" || currentLine >= reportLines.length) return;

    const t = setTimeout(() => {
      setAnimatedText((p) => p + reportLines[currentLine] + "\n");
      setCurrentLine((c) => c + 1);
      setProgress(((currentLine + 1) / reportLines.length) * 100);
    }, 80);

    return () => clearTimeout(t);
  }, [step, currentLine, reportLines]);

  /* ===================== CHART ===================== */

  const chartData = React.useMemo(() => {
    const map: Record<string, number> = {};
    filteredFonciers.forEach((f) => {
      map[f.type] = (map[f.type] || 0) + Number(f.surface || 0);
    });
    return Object.entries(map).map(([type, surface]) => ({
      type,
      surface,
    }));
  }, [filteredFonciers]);

  /* ===================== PDF DOWNLOAD ===================== */

  const downloadPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const logo = await loadImageAsBase64("/anfu1.png");

    /* HEADER */
    doc.addImage(logo, "PNG", 14, 10, 30, 20);

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(
      "République Algérienne Démocratique et Populaire",
      105,
      14,
      { align: "center" }
    );

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(
      "Ministère de l'Habitat, de l'Urbanisme et de la Ville",
      105,
      20,
      { align: "center" }
    );

    doc.text(
      "et de l'Aménagement du Territoire",
      105,
      25,
      { align: "center" }
    );

    doc.setFont("times", "bold");
    doc.text(
      "Agence Nationale du Foncier Urbain",
      105,
      31,
      { align: "center" }
    );

    doc.line(14, 36, 196, 36);

    /* TITLE */
    doc.setFontSize(14);
    doc.text("Rapport foncier", 105, 45, { align: "center" });

    doc.setFontSize(10);
    doc.text(
      `Total : ${summary.totalFonciers} | ${summary.totalSurface.toFixed(
        2
      )} m² (${summary.totalHa.toFixed(4)} ha)`,
      14,
      55
    );

    /* TABLE */
    autoTable(doc, {
      startY: 62,
      head: [
        ["Code", "Wilaya", "Type", "Surface (m²)", "Surface (ha)", "Date"],
      ],
      body: filteredFonciers.map((f) => {
        const s = Number(f.surface || 0);
        return [
          f.code,
          f.wilaya,
          f.type,
          `${s.toFixed(2)}`,
          `${(s / 10000).toFixed(4)}`,
          f.date_transmission || "",
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 118, 210] },
    });

    doc.save("rapport_fonciers.pdf");
  };

  /* ===================== RENDER ===================== */

  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Générer Rapport
      </Button>

      <BootstrapDialog
        open={open}
        maxWidth="lg"
        fullWidth
        fullScreen={fullScreen}
      >
        <DialogTitle>
          {step === "select" ? "Sélection des critères" : "Rapport généré"}
          <IconButton
            onClick={handleClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {step === "select" && (
            <Box display="flex" flexWrap="wrap" gap={2}>
              <TextField
                select
                fullWidth
                label="Wilayas"
                SelectProps={{ multiple: true }}
                value={selectedWilayas}
                onChange={(e) =>
                  setSelectedWilayas(e.target.value as string[])
                }
              >
                {wilayas.map((w) => (
                  <MenuItem key={w.code} value={w.code}>
                    {w.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Types"
                SelectProps={{ multiple: true }}
                value={selectedTypes}
                onChange={(e) =>
                  setSelectedTypes(e.target.value as string[])
                }
              >
                {types.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                fullWidth
                label="Du"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <TextField
                type="date"
                fullWidth
                label="Au"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Box>
          )}

          {step === "writing" && (
            <>
              <LinearProgress value={progress} variant="determinate" />
              <Typography component="pre" sx={{ mt: 2 }}>
                {animatedText}
              </Typography>

              <Box height={300} mt={2}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="surface" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          {step === "select" ? (
            <Button onClick={generateReport} variant="contained">
              Générer
            </Button>
          ) : (
            <>
              <Button onClick={downloadPDF} variant="contained" color="success">
                Télécharger PDF
              </Button>
              <Button onClick={handleClose} variant="outlined">
                Fermer
              </Button>
            </>
          )}
        </DialogActions>
      </BootstrapDialog>
    </>
  );
}
