"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Menu,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";

import FullCalendar from "@fullcalendar/react";
import { EventInput, DateSelectArg, EventClickArg, EventChangeArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import frLocale from "@fullcalendar/core/locales/fr";

const REGIONS = [
  { value: "ouest", label: "Ouest" },
  { value: "centre", label: "Centre" },
  { value: "est", label: "Est" },
  { value: "sud_est", label: "Sud-Est" },
  { value: "sud_ouest", label: "Sud-Ouest" },
  { value: "grand_sud", label: "Grand Sud" },
];

const REGION_COLORS: Record<string, string> = {
  ouest: "#1C5844",
  centre: "#2a76d2",
  est: "#e67e22",
  sud_est: "#c0392b",
  sud_ouest: "#8e44ad",
  grand_sud: "#16a085",
};

export default function CalendrierCRM() {
  const mainColor = "#164a39";
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access") : null;

  const [events, setEvents] = useState<EventInput[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [newEvent, setNewEvent] = useState("");
  const [region, setRegion] = useState<string>("centre");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventInput | null>(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "error" | "success",
  });

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    eventId: string | null;
  } | null>(null);

  const getRegionLabel = (value: string) =>
    REGIONS.find((r) => r.value === value)?.label || value;

  // ✅ Fetch Events
  useEffect(() => {
    if (!API_URL || !token) return;

    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/events/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setEvents(
          data.map((event: any) => ({
            id: String(event.id),
            title: String(event.title),
            date: event.date,
            backgroundColor: REGION_COLORS[event.region],
            borderColor: REGION_COLORS[event.region],
            textColor: "#ffffff",
            extendedProps: { region: event.region },
          }))
        );
      } catch {
        setSnackbar({
          open: true,
          message: "❌ Impossible de récupérer les événements",
          severity: "error",
        });
      }
    };

    fetchEvents();
  }, [API_URL, token]);

  // ✅ Select Date to Create New Event
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.startStr);
    setNewEvent("");
    setRegion("centre");
    setEditingId(null);
    setOpenDialog(true);
  };

  // ✅ Click Event to Edit
  const handleEventClick = (clickInfo: EventClickArg) => {
    const ev = clickInfo.event;
    setEditingId(ev.id);
    setSelectedDate(ev.startStr);
    setNewEvent(ev.title);
    setRegion((ev.extendedProps as any)?.region || "centre");
    setOpenDialog(true);
  };

  // ✅ Right-Click → Context Menu
  const handleEventRightClick = (info: any) => {
    info.jsEvent.preventDefault();
    setContextMenu({
      mouseX: info.jsEvent.clientX,
      mouseY: info.jsEvent.clientY,
      eventId: info.event.id,
    });
  };

  const handleEditFromMenu = () => {
    if (!contextMenu?.eventId) return;
    const ev = events.find((e) => e.id === contextMenu.eventId);
    if (!ev) return;
    setEditingId(ev.id as string);
    setSelectedDate(ev.date as string);
    setNewEvent(ev.title as string);
    setRegion((ev as any).extendedProps?.region || "centre");
    setOpenDialog(true);
    setContextMenu(null);
  };

  const handleDeleteFromMenu = () => {
    if (!contextMenu?.eventId) return;
    const ev = events.find((e) => e.id === contextMenu.eventId);
    if (ev) {
      setEventToDelete(ev);
      setDeleteDialogOpen(true);
    }
    setContextMenu(null);
  };

  // ✅ Save (Add + Update)
  const handleSave = async () => {
    if (!newEvent.trim() || !region) {
      setSnackbar({
        open: true,
        message: "⚠️ Veuillez remplir tous les champs",
        severity: "error",
      });
      return;
    }

    if (!API_URL || !token) return;

    try {
      if (editingId) {
        await fetch(`${API_URL}/auth/events/${editingId}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newEvent, date: selectedDate, region }),
        });

        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === editingId
              ? {
                  ...ev,
                  title: newEvent,
                  date: selectedDate,
                  backgroundColor: REGION_COLORS[region],
                  borderColor: REGION_COLORS[region],
                  textColor: "#ffffff",
                  extendedProps: { region },
                }
              : ev
          )
        );

        setSnackbar({ open: true, message: "✅ Modifié", severity: "success" });
      } else {
        const res = await fetch(`${API_URL}/auth/events/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newEvent, date: selectedDate, region }),
        });

        const saved = await res.json();

        setEvents((prev) => [
          ...prev,
          {
            id: String(saved.id),
            title: saved.title,
            date: saved.date,
            backgroundColor: REGION_COLORS[region],
            borderColor: REGION_COLORS[region],
            textColor: "#ffffff",
            extendedProps: { region: saved.region },
          },
        ]);

        setSnackbar({ open: true, message: "✅ Ajouté", severity: "success" });
      }

      setOpenDialog(false);
      setEditingId(null);
    } catch {
      setSnackbar({
        open: true,
        message: "❌ Erreur de sauvegarde",
        severity: "error",
      });
    }
  };

  // ✅ Delete
  const confirmDeleteEvent = async () => {
    if (!eventToDelete || !API_URL || !token) return;

    try {
      await fetch(`${API_URL}/auth/events/${eventToDelete.id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
      setSnackbar({ open: true, message: "🗑️ Supprimé", severity: "success" });
      setDeleteDialogOpen(false);
    } catch {
      setSnackbar({
        open: true,
        message: "❌ Erreur de suppression",
        severity: "error",
      });
    }
  };

  // ✅ Drag-Drop updates date
  const handleEventChange = async (changeInfo: EventChangeArg) => {
    const id = changeInfo.event.id;
    const newDate = changeInfo.event.startStr;

    if (!API_URL || !token) return;

    try {
      await fetch(`${API_URL}/auth/events/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: newDate }),
      });

      setSnackbar({ open: true, message: "✅ Déplacé", severity: "success" });
    } catch {
      setSnackbar({
        open: true,
        message: "❌ Déplacement impossible",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f9fafb", borderRadius: 3 }}>
      <Typography sx={{ fontWeight: 600, color: mainColor, mb: 2 }}>
        📅 Calendrier CRM
      </Typography>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        selectable
        editable
        events={events}
        locale={frLocale}
        height="80vh"
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventChange={handleEventChange}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        eventDidMount={(info) => {
          info.el.addEventListener("contextmenu", (e) =>
            handleEventRightClick({ jsEvent: e, event: info.event })
          );

          const region = (info.event.extendedProps as any)?.region;

          if (region) {
            const sub = document.createElement("div");
            sub.style.fontSize = "0.7em";
            sub.innerText = `(${getRegionLabel(region)})`;
            info.el.appendChild(sub);
          }
        }}
      />

      {/* ✅ Right Click Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            backgroundColor: "white",
            borderRadius: 2,
            boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        <MenuItem onClick={handleEditFromMenu}>✏️ Modifier</MenuItem>
        <MenuItem onClick={handleDeleteFromMenu}>🗑️ Supprimer</MenuItem>
      </Menu>

      {/* ✅ Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editingId ? "Modifier l'événement" : "Nouvel événement"}
        </DialogTitle>
        <DialogContent>
          <Typography>📅 {selectedDate}</Typography>

          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Titre"
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
          />

          <TextField
            fullWidth
            select
            sx={{ mt: 2 }}
            label="Région"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {REGIONS.map((reg) => (
              <MenuItem key={reg.value} value={reg.value}>
                {reg.label}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button variant="contained" sx={{ background: mainColor }} onClick={handleSave}>
            {editingId ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Delete confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Supprimer cet événement ?</DialogTitle>
        <DialogContent>
          <Typography><strong>{eventToDelete?.title}</strong></Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" sx={{ background: mainColor }} onClick={confirmDeleteEvent}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
