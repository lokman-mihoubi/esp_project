"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import axios from "axios";

interface Foncier {
  id: number;
  title: string;
  description: string;
  type: string;
  wilaya: string;
}

interface Task {
  id: number;
  title: string;
  is_done: boolean;
  priority: string;
}

interface Step {
  id: number;
  title: string;
  order: number;
  is_completed: boolean;
  tasks: Task[];
}

export default function Tasks() {
  const [fonciers, setFonciers] = useState<Foncier[]>([]);
  const [selectedFoncier, setSelectedFoncier] = useState<Foncier | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:8000/auth/fonciers/").then((res) => setFonciers(res.data));
  }, []);

  const fetchSteps = async (foncierId: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/auth/fonciers/${foncierId}/steps/`);
      setSteps(res.data);
    } catch (err) {
      console.error("Error fetching steps:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFoncierClick = (foncier: Foncier) => {
    setSelectedFoncier(foncier);
    setDialogOpen(true);
    fetchSteps(foncier.id);
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 4, p: 2 }}>
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
            🏗️ Gestion des Fonciers & Tâches
          </Typography>
        }
      />
      <CardContent>
        {fonciers.length === 0 ? (
          <Typography align="center" sx={{ color: "gray" }}>
            Aucun foncier trouvé.
          </Typography>
        ) : (
          <List>
            {fonciers.map((f) => (
              <ListItem
                key={f.id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  boxShadow: 1,
                  bgcolor: "#f9f9f9",
                  "&:hover": { bgcolor: "#e3f2fd" },
                }}
                secondaryAction={
                  <IconButton edge="end" color="primary">
                    <ArrowForwardIosIcon />
                  </IconButton>
                }
              >
                <ListItemButton
                  onClick={() => handleFoncierClick(f)}
                  sx={{ borderRadius: 2, p: 1 }}
                >
                  <AssignmentIcon sx={{ mr: 2, color: "#1976d2" }} />
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: "bold" }}>{f.title}</Typography>}
                    secondary={
                      <Box display="flex" gap={1}>
                        <Chip size="small" label={f.type} color="info" />
                        <Chip size="small" label={f.wilaya} color="success" />
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      {/* Dialog for steps + tasks */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#1976d2" }}>
          {selectedFoncier?.title} – Étapes & Tâches
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box display="flex" gap={3} mt={1}>
              {/* Left = Steps */}
              <Box
                width="30%"
                borderRight="2px solid #e0e0e0"
                pr={2}
                sx={{ bgcolor: "#fafafa", borderRadius: 2 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                  📌 Étapes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {steps.map((s) => (


<ListItem
  key={s.id}
  sx={{
    borderRadius: 2,
    mb: 1,
  }}
  disablePadding={false} // optional, but default is false anyway
>
  <ListItemButton
    selected={selectedStep?.id === s.id}
    onClick={() => setSelectedStep(s)}
    sx={{
      borderRadius: 2,
      "&.Mui-selected": {
        bgcolor: "#1976d2",
        color: "white",
        "&:hover": { bgcolor: "#1565c0" },
      },
    }}
  >
    <ListItemText
      primary={`${s.order}. ${s.title}`}
      secondary={
        s.is_completed ? (
          <Box display="flex" alignItems="center" gap={1} color="green">
            <CheckCircleIcon fontSize="small" /> Complétée
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={1} color="orange">
            <HourglassBottomIcon fontSize="small" /> En cours
          </Box>
        )
      }
    />
  </ListItemButton>
</ListItem>

                   

                  
                  ))}
                </List>
              </Box>

              {/* Right = Tasks of selected step */}
              <Box flex={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                  ✅ Tâches
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {selectedStep ? (
                  <List>
                    {selectedStep.tasks.map((t) => (
                      <ListItem
                        key={t.id}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: "#f5f5f5",
                          "&:hover": { bgcolor: "#e3f2fd" },
                        }}
                      >
                        <ListItemText
                          primary={t.title}
                          secondary={`Priorité: ${t.priority}`}
                          sx={{
                            textDecoration: t.is_done ? "line-through" : "none",
                            color: t.is_done ? "gray" : "inherit",
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    👉 Sélectionnez une étape pour voir les tâches.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
