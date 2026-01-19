"use client";

import * as React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  MenuItem,
  Box,
  Typography,
  LinearProgress,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled, useTheme } from "@mui/material/styles";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1.5) },
}));

type Foncier = {
  id: number;
  type?: string;
  wilaya?: string;
  surface?: number;
  predicted_surface?: number;
  date_transmission?: string;
};

type AISummaryDialogProps = {
  fonciers: Foncier[];
  wilayas: { code: string; name: string }[];
  types: string[];
};

export default function AISummaryDialog({ fonciers, wilayas, types }: AISummaryDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = React.useState(false);
  const [summary, setSummary] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [selectedWilayas, setSelectedWilayas] = React.useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [filteredFonciers, setFilteredFonciers] = React.useState<Foncier[]>([]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSummary("");
    setFilteredFonciers([]);
    setLoading(false);
  };

  const filterFonciers = () => {
    const filtered = fonciers.filter((f) => {
      const d = f.date_transmission ? new Date(f.date_transmission) : null;
      return (
        (!startDate || (d && d >= new Date(startDate))) &&
        (!endDate || (d && d <= new Date(endDate))) &&
        (selectedWilayas.length === 0 || selectedWilayas.includes(f.wilaya || "")) &&
        (selectedTypes.length === 0 || selectedTypes.includes(f.type || ""))
      );
    });
    setFilteredFonciers(filtered);
    return filtered;
  };

  const generateAISummary = async () => {
    const filtered = filterFonciers();
    if (!filtered.length) {
      setSummary("Aucun foncier correspondant aux critères.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/ai-summary/`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fonciers: filtered }),
      });
      const data = await response.json();
      setSummary(data.summary || "Aucune donnée renvoyée par le backend.");
      setFilteredFonciers(data.data || filtered);
    } catch (error) {
      console.error(error);
      setSummary(`Erreur lors de la génération du résumé AI: ${error}`);
    }
    setLoading(false);
  };

  const chartData = React.useMemo(() => {
    return filteredFonciers.map((f) => ({
      type: f.type || "Autre",
      surface: f.surface || 0,
      predicted_surface: f.predicted_surface || 0,
    }));
  }, [filteredFonciers]);

  return (
    <>
      <Button variant="contained" onClick={handleOpen}>Générer Résumé AI</Button>

      <BootstrapDialog open={open} maxWidth="lg" fullWidth fullScreen={fullScreen}>
        <DialogTitle>
          Résumé AI
          <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
            <TextField
              select
              label="Wilayas"
              fullWidth
              SelectProps={{ multiple: true }}
              value={selectedWilayas}
              onChange={(e) => setSelectedWilayas(e.target.value as string[])}
            >
              {wilayas.map((w) => <MenuItem key={w.code} value={w.code}>{w.name}</MenuItem>)}
            </TextField>

            <TextField
              select
              label="Types"
              fullWidth
              SelectProps={{ multiple: true }}
              value={selectedTypes}
              onChange={(e) => setSelectedTypes(e.target.value as string[])}
            >
              {types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>

            <TextField type="date" label="Du" fullWidth InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <TextField type="date" label="Au" fullWidth InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Box>

          {loading && <LinearProgress />}
          {summary && <Typography component="pre" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>{summary}</Typography>}

          {filteredFonciers.length > 0 && (
            <Box height={300} mt={2}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="surface" fill="#1976d2" name="Réelle" />
                  <Bar dataKey="predicted_surface" fill="#ff9800" name="Prédite" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={generateAISummary} variant="contained">Générer</Button>
          <Button onClick={handleClose} variant="outlined">Fermer</Button>
        </DialogActions>
      </BootstrapDialog>
    </>
  );
}
