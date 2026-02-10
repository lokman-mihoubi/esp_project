"use client";
import React from "react";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { User, Foncier, Document, Task, StepType,Usage  } from '@/types';

import {Box,TextField,Button,Stack,Typography,Snackbar,Alert,Dialog,DialogTitle,
  DialogContent,DialogActions,IconButton,Stepper,Step,StepLabel,LinearProgress} from '@mui/material';
import UndoIcon from "@mui/icons-material/Undo";
import DocumentViewButton from "@/components/DocumentViewButton";
import { Checkbox, FormControlLabel ,ListSubheader,Tooltip} from '@mui/material';

import FoncierStatistics from '@/components/FoncierStatistics';
import Settings from '@/components/Settings';
import Tasks from '@/components/Tasks';
import { WILAYAS } from '@/types/wilayas';

import * as XLSX from "xlsx";
import dynamic from 'next/dynamic';
import { DataGrid, GridColDef, GridActionsCellItem, GridRenderCellParams,GridCellParams,GridRowParams } from '@mui/x-data-grid';
import FoncierGridSkeleton from "@/components/FoncierGridSkeleton";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import FilterAltIcon from '@mui/icons-material/FilterAlt';

import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import RoomIcon from '@mui/icons-material/Room';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlaceIcon from '@mui/icons-material/Place';
import EditIcon from '@mui/icons-material/Edit';
import Chip from "@mui/material/Chip";
import { MessageCircle } from "lucide-react";
import MapIcon from "@mui/icons-material/Map";
import BlockIcon from '@mui/icons-material/Block'; // 🚫 or use ErrorOutlineIcon

import { Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';

import { MenuItem, Select, InputLabel, FormControl ,Popover} from '@mui/material';
import axios from 'axios';
import Chat from '@/components/Chat';
import Messagerie from "@/components/Messagerie";
import CalendrierCRM from "@/components/CalendrierCRM";
import Navbar from "@/components/Navbar";
import CircularProgressWithLabel from "@/components/CircularProgressWithLabel";
import Historique from "@/components/Historique";
import LeftMap from "@/components/LeftMap";


export default function DashboardPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('promotion');
  const [rows, setRows] = useState<Foncier[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<Foncier, 'id'> & { id?: number }>({
  id: undefined,  // optional id
  code: '',
  commune: '',
  description: '',
  coordinates: '',
  coordinates_dms: '',
  wilaya: '',
  geojson_file: null,
  usage: 'lgmts',
  progress_viabilisation: 0,
  surface: 0,
  is_transmis: false,
  date_transmission: null,
  is_completed: false,
  is_published: false,
  is_favorited: false,
  POS: '',
  Ref_Cadastre_Section: '',
  Ref_Cadastre_Ilot: '',
  region: "DG",

  // ✅ Fichiers locaux
  duac_file: null,
  dccf_file: null,
  domaine_file: null,

  // ✅ Fichiers en bytes pour prévisualisation
  duac_file_bytes: null,
  dccf_file_bytes: null,
  domaine_file_bytes: null,

  // ✅ Fichiers déjà uploadés sur serveur
  duac_file_url: null,
  dccf_file_url: null,
  domaine_file_url: null,

  // ✅ CONFIRMATION FIELDS
  is_confirmed_by_duac: null,
  is_confirmed_by_DCCF: null,
  is_confirmed_by_Domaine: null,
});
  useEffect(() => {
  const duac = newItem.is_confirmed_by_duac === true;
  const dccf = newItem.is_confirmed_by_DCCF === true;
  const domaine = newItem.is_confirmed_by_Domaine === true;

  const isMobilised = duac && (dccf || domaine);

  setNewItem((prev) => ({
    ...prev,
    is_completed: isMobilised,
  }));
}, [
  newItem.is_confirmed_by_duac,
  newItem.is_confirmed_by_DCCF,
  newItem.is_confirmed_by_Domaine,
]);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [viewMode, setViewMode] = useState<
  'list' | 'details' | 'rapport' | 'statistics' | 'settings' | 'tasks' | 'chat'| 'calendrier'| 'historique'
>('list');

const LeftMap = dynamic(
  () => import("@/components/LeftMap"),
  { ssr: false }
);
const RapportComponent = dynamic(
  () => import('@/components/RapportComponent'),
  { ssr: false }
);
  const [selectedItem, setSelectedItem] = useState<Foncier | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] =
   useState<number[]>([]);
  const [selectedTaskUsers, setSelectedTaskUsers] = useState<number[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');
  const [steps, setSteps] = useState<StepType[]>([]);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  const [isEdit, setIsEdit] = useState(false);
  const [selectedFoncierId, setSelectedFoncierId] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
  const userRole = localStorage.getItem("role");
  setUsername(localStorage.getItem("username"));
  setRole(userRole);
}, []);

// 🧩 State definitions
const [canWrite, setCanWrite] = useState(false);
const [canView, setCanView] = useState(false);

useEffect(() => {
  // ✅ Retrieve permissions from localStorage
  const writePermission = localStorage.getItem('can_write') === 'true';
  const viewPermission = localStorage.getItem('can_view') === 'true';

  setCanWrite(writePermission);
  setCanView(viewPermission);
}, []);

useEffect(() => {
  if (selectedItem) fetchSteps(selectedItem.id);
}, [refresh]);

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [comments, setComments] = useState<{ id: number; content: string; author: string; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState('');


  const [taskDocuments, setTaskDocuments] = useState<Document[]>([]);


const [usages, setUsages] = useState<Usage[]>([]);

const [accessToken, setAccessToken] = useState<string | null>(null);
const [isDG, setIsDG] = useState(false);

useEffect(() => {
  setAccessToken(localStorage.getItem('access'));
  setIsDG(localStorage.getItem("isDG") === "true");
}, []);

useEffect(() => {
  if (selectedType && accessToken) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/usages/?parent_type=${selectedType}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text(); // get raw response
          console.error("Error response:", text);
          throw new Error("Failed to fetch usages");
        }
        return res.json();
      })
      .then((data) => setUsages(data))
      .catch((err) => console.error("Error fetching usages:", err));
  }
}, [selectedType, accessToken]);



useEffect(() => {
  const fetchTaskDocuments = async () => {
    if (!selectedTask) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${selectedTask.id}/documents/`);
      setTaskDocuments(res.data);
    } catch {
    }
  };

  fetchTaskDocuments();
  const fetchComments = async () => {
  if (!selectedTask) return;
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${selectedTask.id}/comments/`);
    setComments(res.data);
  } catch {
    showMessage('Erreur lors du chargement des commentaires', 'error');
  }
};


fetchComments();

}, [selectedTask]);

  const showMessage = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
  const token = localStorage.getItem('access');
  if (!token) router.push('/');
}, [router]);


  useEffect(() => {
    if (viewMode === 'list') {
      fetchFonciers();
    }
  }, [selectedType, viewMode]);

 const fetchFonciers = async () => {
  try {
    setLoading(true);

    const accessToken = localStorage.getItem("access"); // ✅ get token from storage
    if (!accessToken) {
      showMessage("Vous n'êtes pas authentifié", "error");
      return;
    }

    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/?type=${selectedType}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`, // must include "Bearer "
        },
      }
    );

    console.log("API response:", res.data); // check data
    setRows(res.data);
  } catch (error: any) {
    console.error("Fetch fonciers error:", error.response || error);
    showMessage("Impossible de charger les données", "error");
  } finally {
    setLoading(false);
  }
};

const renderBoolStatus = (value?: boolean | null) => {
  if (value === undefined || value === null) return "⏳ En attente";
  return value ? "✅ Oui" : "❌ Non";
};

 const [selectedGeojson, setSelectedGeojson] = useState(null);
 const [open, setOpen] = useState(false);
 // 🔹 Handler to show GeoJSON in Dialog

 const handleShowOnMap = async (foncier: Foncier) => {
  const file = foncier.geojson_file;

  if (!file) {
    alert("Aucun fichier GeoJSON disponible pour ce foncier.");
    return;
  }

  try {
    let geojson: any;

    if (typeof file === "string") {
      // If it's a string (URL or path)
      const url = file.startsWith("http")
        ? file
        : `${process.env.NEXT_PUBLIC_API_URL}${file}`;

      const response = await fetch(url);
      geojson = await response.json();
    } else if (file instanceof File) {
      // If it's a File object (e.g., uploaded by user)
      geojson = await new Response(file).json(); // convert File to JSON
    } else {
      throw new Error("Type de fichier GeoJSON non supporté");
    }

    setSelectedGeojson(geojson);
    setOpen(true);
  } catch (err) {
    console.error("GeoJSON Error:", err);
    alert("Impossible de charger le fichier GeoJSON.");
  }
};



  const handleClose = () => {
    setOpen(false);
    setSelectedGeojson(null);
  };
  const fetchSteps = async (foncierId: number) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/${foncierId}/steps/`);
      setSteps(res.data);
    } catch {
      showMessage('Échec du chargement des étapes', 'error');
    }
  };
  useEffect(() => {
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/`);
      setUsers(res.data);
    } catch {
      showMessage('Erreur lors du chargement des utilisateurs', 'error');
    }
  };
  fetchUsers();
}, []);

const [newUsageName, setNewUsageName] = useState("");

const handleDeleteTask = async (taskId: number) => {
  try {
    const accessToken = localStorage.getItem("access"); // ✅ get token
    if (!accessToken) {
      showMessage("Vous n'êtes pas authentifié", "error");
      return;
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`, // ✅ include token
    };

    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${taskId}/delete/`,
      { headers }
    );

    // Update tasks in steps
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({
        ...step,
        tasks: step.tasks.filter((t) => t.id !== taskId),
      }))
    );

    showMessage("Tâche supprimée avec succès", "success");

  } catch (err) {
    console.error(err);
    showMessage("Erreur lors de la suppression", "error");
  }
};

const toggleFavorite = async (row: any) => {
  try {
    const token = localStorage.getItem("access");

    await axios.patch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/${row.id}/`,
      {
        is_favorited: !row.is_favorited,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // ✅ Update DataGrid state AFTER success
    setRows((prev: any[]) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, is_favorited: !r.is_favorited } : r
      )
    );
  } catch (error) {
    console.error("Failed to toggle favorite", error);
  }
};

// ================= MODE =================
const [mode, setMode] = useState<"lecture" | "ecriture">("lecture");

// ================= ROLE =================


// ================= MODE HELPERS =================
const isLecture = mode === "lecture";
const isEcriture = mode === "ecriture";

// ================= RULES =================

// 👤 USER
// - lecture → يقدر يعدل الحقول العادية
// - ecriture → ما يقدرش يدير والو
const canEditNormalFields = isLecture && !isDG;

// 👤 USER يقدر يكمل فقط في lecture
const canUserComplete = isLecture && !isDG;

// 🏢 DG
// - lecture → قراءة فقط
// - ecriture → يقدر transmit / publish
// - BUT فقط إذا is_completed = true
const canDGTransmitOrPublish =
  isDG && isEcriture && newItem.is_completed;

// ================= MODE AUTO SWITCH =================
useEffect(() => {
  if (newItem.is_completed) {
    setMode("ecriture");
  } else {
    setMode("lecture");
  }
}, [newItem.is_completed]);


const handleAdd = async () => {
  try {
    // ================= AUTH CHECK =================
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      showMessage("Vous n'êtes pas authentifié", "error");
      return;
    }

    // ================= VALIDATIONS =================
    if (newItem.is_confirmed_by_duac && !newItem.duac_file) {
      showMessage("Veuillez joindre le fichier DUAC avant confirmation", "error");
      return;
    }

    if (newItem.is_confirmed_by_DCCF && !newItem.dccf_file) {
      showMessage("Veuillez joindre le fichier DCCF avant confirmation", "error");
      return;
    }

    if (newItem.is_confirmed_by_Domaine && !newItem.domaine_file) {
      showMessage("Veuillez joindre le fichier Domaine avant confirmation", "error");
      return;
    }

    // ================= CREATE FORM DATA =================
    const formData = new FormData();

    // Basic fields
    formData.append("code", newItem.code || "");
    formData.append("commune", newItem.commune || "");
    formData.append("description", newItem.description || "");
    formData.append("coordinates", newItem.coordinates || "");
    formData.append("coordinates_dms", newItem.coordinates_dms || "");
    formData.append("type", selectedType || "");
    formData.append("wilaya", newItem.wilaya || "");
    formData.append("region", localStorage.getItem("abrv_str") || "DG");
    formData.append("POS", newItem.POS || "");
    formData.append("Ref_Cadastre_Section", newItem.Ref_Cadastre_Section || "");
    formData.append("Ref_Cadastre_Ilot", newItem.Ref_Cadastre_Ilot || "");
    formData.append("surface", String(newItem.surface || 0));
    formData.append("progress_viabilisation", String(newItem.progress_viabilisation || 0));

    // Status flags
    formData.append("is_completed", String(newItem.is_completed ?? false));
    formData.append("is_published", String(newItem.is_published ?? false));
    formData.append("is_favorited", String(newItem.is_favorited ?? false));
    formData.append("is_transmis", String(newItem.is_transmis ?? false));

    if (newItem.is_transmis && newItem.date_transmission) {
      formData.append("date_transmission", newItem.date_transmission);
    }

    // Confirmations
    formData.append("is_confirmed_by_duac", String(newItem.is_confirmed_by_duac ?? false));
    formData.append("is_confirmed_by_DCCF", String(newItem.is_confirmed_by_DCCF ?? false));
    formData.append("is_confirmed_by_Domaine", String(newItem.is_confirmed_by_Domaine ?? false));

    // Files
    if (newItem.geojson_file) formData.append("geojson_file", newItem.geojson_file);
    if (newItem.duac_file) formData.append("duac_file", newItem.duac_file);
    if (newItem.dccf_file) formData.append("dccf_file", newItem.dccf_file);
    if (newItem.domaine_file) formData.append("domaine_file", newItem.domaine_file);

    // Usage
    if (newItem.usage && newItem.usage !== 'null') {
      formData.append("usage", newItem.usage);
    }

    // ================= API CALL =================
    const headers = {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${accessToken}`,
    };

    if (isEdit && selectedFoncierId) {
      // PATCH existing foncier
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/${selectedFoncierId}/`,
        formData,
        { headers }
      );
      showMessage("Foncier mis à jour avec succès", "success");
    } else {
      // POST new foncier
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/`,
        formData,
        { headers }
      );
      showMessage("Foncier ajouté avec succès", "success");
    }

    // ================= RESET FORM =================
    setDialogOpen(false);
    setNewItem({
      code: "",
      commune: "",
      description: "",
      coordinates: "",
      coordinates_dms: "",
      geojson_file: null,
      duac_file: null,
      dccf_file: null,
      domaine_file: null,
      wilaya: "",
      usage: 'null',
      progress_viabilisation: 0,
      surface: 0,
      is_transmis: false,
      date_transmission: null,
      is_completed: false,
      is_published: false,
      is_favorited: false,
      POS: "",
      mode: "ecriture",
      Ref_Cadastre_Section: "",
      Ref_Cadastre_Ilot: "",
      is_confirmed_by_duac: false,
      is_confirmed_by_DCCF: false,
      is_confirmed_by_Domaine: false,
    });

    setIsEdit(false);
    setSelectedFoncierId(null);
    fetchFonciers();

  } catch (error: any) {
    console.error(error.response || error);
    showMessage(
      isEdit ? "Échec de la mise à jour" : "Échec de l’ajout",
      "error"
    );
  }
};


const handleRemoveUser = async (taskId: number, userId: number) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${taskId}/remove-user/${userId}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to remove user");

    const data = await res.json();
    setSelectedTask((prev: any) => ({
      ...prev,
      assigned_users_info: data.assigned_users_info,
    }));
  } catch (error) {
    console.error("Error removing user:", error);
  }
};
// Convert Excel to PDF



const openPdfViewer = async (documentId: number) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/documents/${documentId}/bytes/`,
      { responseType: "blob" }
    );

    if (res.data.type !== "application/pdf") {
      throw new Error("Backend must return PDF for viewing");
    }

    if (typeof window !== "undefined") {
      const pdfBlob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(url);
      setPdfViewerOpen(true);
    }
  } catch (error) {
    showMessage("Erreur lors du chargement du fichier PDF", "error");
    console.error(error);
  }
};

const confirmationBoxStyle = {
  border: "1px dashed #c4c4c4",
  borderRadius: 2,
  padding: 1,
  display: "flex",
  flexDirection: "column",
  gap: 1.5,
};
const handleDeleteAll = async () => {
  const confirmDelete = window.confirm(
    "⚠️ Cette action supprimera tous les fonciers. Continuer ?"
  );

  if (!confirmDelete) return;

  try {
    const accessToken = localStorage.getItem("access");

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/delete-all/`,
      { headers }
    );

    showMessage("Tous les fonciers ont été supprimés", "success");
    fetchFonciers();
  } catch (error) {
    console.error(error);
    showMessage("Suppression globale échouée", "error");
  }
};



const handleDelete = async (id: number) => {
  try {
    const accessToken = localStorage.getItem("access");
    const headers = {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${accessToken}`, // ✅ include token
    };

    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/${id}/`, { headers });
    showMessage('Item deleted', 'success');
    fetchFonciers();
  } catch (error) {
    console.error(error);
    showMessage('Delete failed', 'error');
  }
};

 const handleCreateStep = async () => {
  try {
    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      showMessage("Vous n'êtes pas authentifié", "error");
      return;
    }

    if (!selectedItem) {
      showMessage("Aucun élément sélectionné", "error");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/${selectedItem.id}/steps/create/`,
      { title: newStepTitle },
      { headers }
    );

    showMessage("Étape ajoutée avec succès", "success");

    setNewStepTitle("");
    setStepDialogOpen(false);
    fetchSteps(selectedItem.id);

  } catch (error: any) {
    console.error(error.response || error);
    showMessage("Échec de l’ajout de l’étape", "error");
  }
};

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <PictureAsPdfIcon color="error" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <ImageIcon color="primary" />;
    case 'doc':
    case 'docx':
      return <ImageIcon color="info" />;
    default:
      return <InsertDriveFileIcon />;
  }
};

const downloadDocument = async (documentId: number, filename: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/documents/${documentId}/download/`);

    if (!response.ok) throw new Error("Erreur de téléchargement");

    const blob = await response.blob();

    // ✅ Protect from SSR (window/document only exist in browser)
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none"; // optional: hide element
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Erreur:", error);
  }
};

const [filterDialogOpen, setFilterDialogOpen] = useState(false);

const [filters, setFilters] = useState<Partial<Foncier>>({
  wilaya: "",
  is_completed: false,
  is_transmis: false,
  is_published: false,
});



const [duplicateDialog, setDuplicateDialog] = useState({ open: false, code: "" });
const [progress, setProgress] = useState<number>(0);
const [totalRows, setTotalRows] = useState<number>(0);
const [importing, setImporting] = useState(false);
const [existingFonciers, setExistingFonciers] = React.useState<string[]>([]);

  const handleImportFonciers = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setImporting(true);          // Open dialog immediately
  setProgress(0);              // Reset progress
  setExistingFonciers([]);     // Clear previous existing fonciers

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const fonciers = XLSX.utils.sheet_to_json(sheet);

    setTotalRows(fonciers.length);

    await importFonciersToBackend(fonciers); // start import
  } catch (err) {
    console.error(err);
    showMessage("Erreur lors de l'import", "error");
    setImporting(false); // close dialog on error
  }
};

const importFonciersToBackend = async (fonciers: any[]) => {
  const token = localStorage.getItem("access");
  if (!token) {
    showMessage("Vous n'êtes pas authentifié", "error");
    setImporting(false);
    return;
  }

  let importedCount = 0;

  // ---------------- HELPERS ----------------
  const normalize = (v: any): string =>
    v === null || v === undefined ? "" : String(v).trim();

  const normalizeBool = (v: any): string =>
    v === "OUI" || v === true ? "true" : "false";

  const formatDate = (value: any) => {
    if (!value) return null;
    if (typeof value === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + value * 86400000);
      return d.toISOString().split("T")[0];
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  };

  const normalizePOS = (value: any) => {
    const v = normalize(value);
    if (!v) return "non_disponible";
    return v.startsWith("POS_") ? v : "POS_" + v.replace(/\s+/g, "_");
  };

  const normalizeProgress = (v: any): number => {
    if (!v) return 0;
    const str = String(v).trim().toUpperCase();

    if (str === "EN COURS" || str === "ENCOURS") return 0;
    if (str === "NON_DISPONIBLE") return 0;

    let num = parseFloat(str.replace("%", ""));
    if (num <= 1) num = num * 100; // treat fractions like 0.5 as 50%
    return Math.round(num);
  };

  const normalizeNumber = (v: any): number => {
    if (v === null || v === undefined || v === "") return 0;
    const str = String(v).replace(/\s+/g, "").replace(",", ".");
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // ---------------- IMPORT LOOP ----------------
  for (const item of fonciers) {
    const code = normalize(item.code);

    if (!code) {
      importedCount++;
      setProgress((importedCount / fonciers.length) * 100);
      continue;
    }

    try {
      const formData = new FormData();

      // ---------------- FIELDS ----------------
      formData.append("code", code);
      formData.append("commune", normalize(item.commune));
      formData.append("wilaya", normalize(item.wilaya).padStart(2, "0"));
      formData.append("usage", normalize(item.usage) || "lgmts");
      formData.append("POS", normalizePOS(item.POS));
      formData.append("description", normalize(item.description));
      formData.append("type", selectedType);
      formData.append(
        "Ref_Cadastre_Section",
        normalize(item.Ref_Cadastre_Section)
      );
      formData.append(
        "Ref_Cadastre_Ilot",
        normalize(item.Ref_Cadastre_Ilot)
      );
      formData.append("surface", normalizeNumber(item.surface).toString());

      // ---------------- PROGRESS ----------------
      const progressStr = normalize(item.progress_viabilisation).toUpperCase();
      if (progressStr === "EN COURS" || progressStr === "ENCOURS") {
        formData.append("progress_status", "EN_COURS");
        formData.append("progress_viabilisation", "0");
      } else if (progressStr === "NON_DISPONIBLE" || progressStr === "") {
        formData.append("progress_status", "");
        formData.append("progress_viabilisation", "0");
      } else {
        const number = normalizeProgress(item.progress_viabilisation);
        formData.append("progress_status", "TERMINE");
        formData.append("progress_viabilisation", number.toString());
      }

      // ---------------- BOOLEANS ----------------
      const isTransmis = item.is_transmis === "OUI" || item.is_transmis === true;
      formData.append("is_transmis", isTransmis ? "true" : "false");
      formData.append("is_completed", normalizeBool(item.is_completed));
      formData.append("is_published", normalizeBool(item.is_published));
      formData.append("is_favorited", normalizeBool(item.is_favorited));

      const dateTransmission = formatDate(item.date_transmission);
      if (dateTransmission) formData.append("date_transmission", dateTransmission);

      // ---------------- CONFIRMATION ----------------
      let isConfirmedByDUAC = "false";
      let isConfirmedByDCCF = "false";
      let isConfirmedByDomaine = "false";
      const refSection = normalize(item.Ref_Cadastre_Section);

      if (isTransmis) {
        if (refSection && refSection !== "Non_cadastré" && refSection !== "Non_disponible") {
          isConfirmedByDUAC = "true";
          isConfirmedByDCCF = "true";
        } else {
          isConfirmedByDUAC = "true";
          isConfirmedByDomaine = "true";
        }
      }

      formData.append("is_confirmed_by_duac", isConfirmedByDUAC);
      formData.append("is_confirmed_by_DCCF", isConfirmedByDCCF);
      formData.append("is_confirmed_by_Domaine", isConfirmedByDomaine);

      // ---------------- SEND ----------------
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/fonciers/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error: any) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.code?.[0]?.toLowerCase().includes("already")
      ) {
        setExistingFonciers((prev) => [...prev, code]);
      } else {
        console.error("Import error:", code, error.response?.data || error);
      }
    }

    importedCount++;
    setProgress((importedCount / fonciers.length) * 100);
  }

  setImporting(false);
  showMessage("Importation terminée", "success");
  fetchFonciers();
};


const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
const [popoverRow, setPopoverRow] = useState<Foncier | null>(null);

const openPopover = (event: React.MouseEvent<HTMLElement>, row: Foncier) => {
  setPopoverAnchor(event.currentTarget);
  setPopoverRow(row);
};

const closePopover = () => {
  setPopoverAnchor(null);
  setPopoverRow(null);
};


const handleLogout = () => {
  logout();
  router.push('/');
};

const columns: GridColDef<Foncier>[] = [
  {
  field: 'code',
  headerName: 'Code',
  flex: 1,
  renderCell: (params) => (
    <span
      onClick={() => {
        setSelectedItem(params.row);
        setViewMode('details');
        fetchSteps(params.row.id);
      }}
      style={{
        color: '#0a6b31ff',
        cursor: 'pointer',
      }}
    >
      {params.value}
    </span>
  ),
  },

  // { field: 'code', headerName: 'Code', flex: 1 },
  {
  field: 'wilaya',
  headerName: 'Wilaya',
  flex: 1,
  renderCell: (params: GridCellParams<Foncier>) => {
    const wilayaValue = params.value?.toString().trim() ?? '';

    const wilaya =
      WILAYAS.find((w) => w.code.trim() === wilayaValue) ||
      WILAYAS.find((w) => w.name.trim().toLowerCase() === wilayaValue.toLowerCase());

    return (
      <div>
        {wilaya ? wilaya.name : wilayaValue}
      </div>
    );
  },
},

  { field: 'commune', headerName: 'Commune', flex: 1 },
  {
    field: 'usage',
    headerName: 'Affectation',
    flex: 1,
    renderCell: (params) => {
      let label = '';
      switch(params.value) {
        case 'lgmts': label = 'Logements'; break;
        case 'equip': label = 'Équipements'; break;
        case 'aapi': label = 'AAPI'; break;
        case 'promotion': label = 'Promotion'; break;
        case 'autre': label = 'Autre'; break;
        case 'clinique': label = 'Clinique'; break;
        default: label = params.value;
      }
      return <span>{label}</span>;
    }
  },
  {
  field: 'region',
  headerName: 'Région',
  flex: 1,
  renderCell: (params) => (
    <span>{params.value ?? "-"}</span>
  ),
},

  { field: 'POS', headerName: 'POS', flex: 1 },
  { field: 'Ref_Cadastre_Section', headerName: 'Réf Section Cadastre', flex: 1 },
  { field: 'Ref_Cadastre_Ilot', headerName: 'Réf Ilot Cadastre', flex: 1 },
  {
  field: "progress_viabilisation",
  headerName: "Taux de viabilisation",
  width: 180,
  renderCell: (params: any) => {
    const value = params.value ?? 0; // numeric 0-100
    const status = params.row.progress_status; // EN_COURS, TERMINE, or ""

    if (status === "EN_COURS") {
      return (
        <Typography variant="body2" fontWeight={600}>
          En cours
        </Typography>
      );
    }

    if (status === "" || value === 0) {
      return (
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          Non disponible
        </Typography>
      );
    }

    return (
      <CircularProgressWithLabel
        value={value}
      />
    );
  },
},


// { field: 'coordinates', headerName: 'Coordonnées', flex: 1 },
  { field: "surface", headerName: "Surface (m²)", flex: 1 },

  { field: 'description', headerName: 'Description', flex: 1 },



{
  field: "date_transmission",
  headerName: "Date Transmission",
  flex: 1,
},
{
  field: "is_confirmed_by_duac",
  headerName: "DUAC",
  flex: 0.6,
  align: "center",
  headerAlign: "center",
  renderCell: (params) => (
    <span>{renderBoolStatus(params.value)}</span>
  ),
},
{
  field: "is_confirmed_by_DCCF",
  headerName: "DCCF",
  flex: 0.6,
  align: "center",
  headerAlign: "center",
  renderCell: (params) => (
    <span>{renderBoolStatus(params.value)}</span>
  ),
},
{
  field: "is_confirmed_by_Domaine",
  headerName: "Domaine",
  flex: 0.8,
  align: "center",
  headerAlign: "center",
  renderCell: (params) => (
    <span>{renderBoolStatus(params.value)}</span>
  ),
},

{
  field: "is_completed",
  headerName: "Mobilisé ?",
  flex: 1,
  renderCell: (params) => {
    const {
      is_confirmed_by_duac,
      is_confirmed_by_DCCF,
      is_confirmed_by_Domaine,
    } = params.row;

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const renderStatus = (value?: boolean | null) => {
      if (value === undefined || value === null) return "⏳ En attente";
      return value ? "✅ Oui" : "❌ Non";
    };

    return (
      <>
        {/* CLICK TARGET */}
        <Box
          onClick={handleClick}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <Checkbox
            checked={Boolean(params.value)}
            disabled
            sx={{ pointerEvents: "none" }} // checkbox is visual only
          />
        </Box>

        {/* POPOVER */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          disableRestoreFocus
          anchorOrigin={{
            vertical: "center",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "center",
            horizontal: "left",
          }}
        >
          <Box p={1.5}>
            <Typography variant="body2">
              DUAC : {renderStatus(is_confirmed_by_duac)}
            </Typography>
            <Typography variant="body2">
              DCCF : {renderStatus(is_confirmed_by_DCCF)}
            </Typography>
            <Typography variant="body2">
              Domaine : {renderStatus(is_confirmed_by_Domaine)}
            </Typography>
          </Box>
        </Popover>
      </>
    );
  },
}


,
{
  field: "is_transmis",
  headerName: "Transmis",
  flex: 1,
  renderCell: (params) => (
    <Checkbox checked={params.value} disabled />
  ),
},
{
  field: "is_published",
  headerName: "Publié ?",
  flex: 1,
  renderCell: (params) => (
    <Checkbox checked={params.value} disabled />
  ),
},
{
  field: 'actions',
  type: 'actions',
  headerName: 'Actions',
  width: 220,
  getActions: (params) => {
    const coords = (params.row.coordinates || '')
      .split(',')
      .map((p: string) => parseFloat(p.trim()));
    const hasValidCoords =
      coords.length === 2 && coords.every((n) => !isNaN(n));
    const hasDms = !!params.row.coordinates_dms;

    return [
      <GridActionsCellItem
        icon={
          params.row.is_favorited ? (
            <StarIcon sx={{ color: "#f5c518" }} />
          ) : (
            <StarBorderIcon />
          )
        }
        label={params.row.is_favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        onClick={() => toggleFavorite(params.row)}
        showInMenu={false}
      />,

      // 1️⃣ Google Maps
      <GridActionsCellItem
        icon={
          hasValidCoords ? (
            <RoomIcon color="primary" />
          ) : (
            <RoomIcon style={{ visibility: 'hidden' }} />
          )
        }
        label="Voir sur Google Maps"
        onClick={() => {
          if (hasValidCoords && typeof window !== 'undefined') {
            window.open(
              `https://www.google.com/maps?q=${coords[0]},${coords[1]}`,
              '_blank'
            );
          }
        }}
        showInMenu={false}
        disabled={!hasValidCoords}
      />,

      // 2️⃣ Google Earth
      <GridActionsCellItem
        icon={
          hasDms ? (
            <PlaceIcon color="secondary" />
          ) : (
            <PlaceIcon style={{ visibility: 'hidden' }} />
          )
        }
        label="Google Earth"
        onClick={() => {
          if (hasDms) {
            window.open(
              `https://earth.google.com/web/search/${encodeURIComponent(
                params.row.coordinates_dms!
              )}`,
              '_blank'
            );
          }
        }}
        showInMenu={false}
        disabled={!hasDms}
      />,

      // 3️⃣ Edit
      <GridActionsCellItem
        icon={<EditIcon color="primary" />}
        label="Edit"
        onClick={() => {
          setNewItem(params.row);
          setSelectedFoncierId(params.row.id);
          setIsEdit(true);
          setDialogOpen(true);
        }}
        showInMenu={false}
      />,

      // 4️⃣ Delete
      <GridActionsCellItem
        icon={<DeleteIcon color="error" />}
        label="Delete"
        onClick={() => handleDelete(params.id as number)}
        showInMenu={false}
      />,
     <GridActionsCellItem
          icon={<MapIcon color="success" />}
          label="Voir sur Carte"
          onClick={() => handleShowOnMap(params.row)}
          showInMenu={false}
        />,

    ];
  },
},

];

return (
  <main className="min-h-screen bg-white">
    <header className="flex items-center justify-between px-8 py-4 border-b shadow-sm bg-white">
      <img src="/anfu1.png" alt="ANFU logo" className="h-16 w-auto" />
      <div className="text-center flex-1">
        <h1 className="text-sm md:text-base font-medium text-gray-800">
          République Algérienne Démocratique et Populaire
        </h1>
        <p className="text-sm text-gray-600">
          Ministère de l'Habitat, de l'Urbanisme et de la Ville et de l'Amenagement du territoire
        </p>
        <h2 className="font-bold text-lg text-black">
          Agence Nationale du Foncier Urbain
        </h2>
      </div>
      <img src="/min.svg" alt="Ministry logo" className="h-16 w-auto" />
    </header>

      <Navbar
        role={role}
        username={username}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        setViewMode={setViewMode}
        handleLogout={handleLogout}
      />

    <Box px={6} py={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
    {/* Retour Button */}
    {viewMode === 'details' && (
    <Button
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={() => setViewMode('list')}
      sx={{ mb: 2 }}
    >
      Retour
    </Button>
    )}


    {/* Show "Ajouter un foncier" only in list view */}

    {/* Ajouter une étape Button - only in details view */}
    {viewMode === 'details' && (
      <Button
        variant="contained"
        endIcon={<AddIcon />}
        onClick={() => setStepDialogOpen(true)}
      >
        Ajouter une étape
      </Button>
    )}
    </Stack>

    {viewMode === 'list' ? (
      <div style={{ height: '100%', width: '100%' }}>
<Stack direction="row" spacing={2} mb={2} alignItems="center">
  <FormControl
sx={{
  minWidth: 200,
  maxWidth: 300, // optional, keep it responsive
  m: 1,          // margin
}}
size="small"    // <-- make it small
>
<InputLabel id="wilaya-label">Wilaya</InputLabel>
<Select
  labelId="wilaya-label"
  value={selectedWilaya}
  onChange={(e) => setSelectedWilaya(e.target.value)}
  label="Wilaya"
  MenuProps={{
    PaperProps: {
      sx: {
        maxHeight: 300, // makes the dropdown scrollable
      },
    },
  }}
>
  <MenuItem value="">
    <em>Toutes les wilayas</em>
  </MenuItem>
  {WILAYAS.map((w) => (
    <MenuItem key={w.code} value={w.code}>
      {w.name}
    </MenuItem>
  ))}
</Select>
</FormControl>

  <Button
  type="button"
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => {
    console.log("Button clicked");
    setDialogOpen(true);
  }}
  sx={{
    backgroundColor: "#0a6b31ff",
    "&:hover": { backgroundColor: "#09572acc" },
  }}
>
  Ajouter un foncier
</Button>

<Button
  variant="contained"
  component="label"
  startIcon={<CloudUploadIcon />}
  sx={{
    backgroundColor: "#0a6b31ff",
    "&:hover": {
      backgroundColor: "#09572acc", // slightly darker on hover
    },
  }}
>
  Import des réserves foncières
  <input
    type="file"
    hidden
    accept=".xlsx,.xls,.csv"
    onChange={handleImportFonciers}
  />
</Button>
<Button
  variant="contained"
  color="error"
  startIcon={<DeleteIcon />}
  onClick={handleDeleteAll}
>
  Supprimer tout
</Button>
<Button
  variant="outlined"
  color="primary"
  startIcon={<FilterAltIcon
  />

  }
  onClick={() => setFilterDialogOpen(true)}
  sx={{ ml: 2 }}
>
  Sélection par critère
</Button>




</Stack>
{/* <DataGrid
rows={rows.filter(
  (row) => !selectedWilaya || row.wilaya === selectedWilaya
)}
columns={columns}
loading={loading}
getRowId={(row) => row.id}
/> */}
<Box sx={{ height: 600, width: "100%" }}>
  {loading ? (
    <FoncierGridSkeleton />
  ) : (
   <DataGrid
  rows={rows.filter((row) => {
    // ✅ Existing wilaya filter (keep it)
    if (selectedWilaya && row.wilaya !== selectedWilaya) return false;

    // ✅ Checkbox filters
    if (filters.wilaya && row.wilaya !== filters.wilaya) return false;

    if (filters.is_completed && !row.is_completed) return false;
    if (filters.is_transmis && !row.is_transmis) return false;
    if (filters.is_published && !row.is_published) return false;

    return true;
  })}
  columns={columns}
  getRowId={(row) => row.id}
  getRowClassName={(params) => {
    const completed = params.row.is_completed;
    const transmitted = params.row.is_transmis;
    const published = params.row.is_published;

    if (completed && transmitted && published)
      return 'row-published-transmitted-completed';
    if (completed && transmitted && !published)
      return 'row-completed-transmitted';
    if (completed && !transmitted)
      return 'row-completed-only';

    return '';
  }}
  sx={{
    '& .row-published-transmitted-completed': {
      backgroundColor: '#8ABEB9',
      color: '#000',
      '&:hover': { backgroundColor: '#76a8a3' },
    },
    '& .row-completed-transmitted': {
      backgroundColor: '#e8f5e9',
      color: '#000',
      '&:hover': { backgroundColor: '#d0f0d3' },
    },
    '& .row-completed-only': {
      backgroundColor: '#fff8e1',
      color: '#000',
      '&:hover': { backgroundColor: '#ffecb3' },
    },
  }}
/>





  )}
</Box>


</div>

    ) : (
      <Box>
        {viewMode === 'rapport' && (
          <Box mt={4} p={3} border={1} borderColor="grey.300" borderRadius={2} bgcolor="#f5f5f5">
            <RapportComponent fonciers={rows} />
          </Box>
        )}

        {viewMode === 'statistics' && <FoncierStatistics />}

        {viewMode === 'settings' && <Settings />}

        {viewMode === 'tasks' && <Tasks />}

        {viewMode === 'chat' && <Messagerie></Messagerie>}

        {viewMode === 'calendrier' && <CalendrierCRM></CalendrierCRM>}

        {viewMode === 'historique' && <Historique></Historique>}

        {viewMode === 'details' && (
          <>
            {/* Stepper */}
            {steps.length > 0 && (
              <Box mb={5}>
                <Typography variant="h6" gutterBottom>
                  Processus des Étapes
                </Typography>
                <Stepper
                  activeStep={steps.findIndex((step) => !step.is_completed)}
                  alternativeLabel
                  sx={{
                    '& .MuiStepLabel-root .Mui-completed': {
                      color: 'success.main',
                    },
                    '& .MuiStepLabel-root .Mui-active': {
                      color: 'primary.main',
                      fontWeight: 'bold',
                    },
                    '& .MuiStepLabel-label': {
                      typography: 'subtitle2',
                      color: 'text.secondary',
                    },
                    '& .MuiStepIcon-root.Mui-active': {
                      color: 'primary.main',
                    },
                    '& .MuiStepIcon-root.Mui-completed': {
                      color: 'success.main',
                    },
                  }}
                >
                  {steps.map((step) => (
                    <Step key={step.id} completed={step.is_completed}>
                      <StepLabel>
                        Étape {step.order}: {step.title}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}

            {/* Steps with Tasks */}
            <Stack spacing={3}>
              {steps.map((step) => (
                <Box
                  key={step.id}
                  p={2}
                  border={1}
                  borderColor="grey.300"
                  borderRadius={2}
                  bgcolor="bg-white"
                >
                  {/* Title + Checkbox */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">
                      Étape {step.order}: {step.title}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={step.is_completed}
                          onChange={async () => {
                            try {
                              await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/auth/steps/${step.id}/`, {
                                is_completed: !step.is_completed,
                              });
                              if (selectedItem) fetchSteps(selectedItem.id);
                            } catch {
                              showMessage('Erreur lors de la mise à jour', 'error');
                            }
                          }}
                          color="success"
                        />
                      }
                      label="Complétée"
                    />
                  </Stack>

                  {/* Add Task Button */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectedStepId(step.id);
                      setTaskDialogOpen(true);
                    }}
                    sx={{ mb: 2 }}
                  >
                    Ajouter une tâche
                  </Button>

                  {/* Tasks Table */}
                  <DataGrid
                    rows={[...(step.tasks || [])].sort(
                      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
                    )}
                    columns={[
                      {
                        field: 'is_done',
                        headerName: 'Fait',
                        width: 80,
                        renderCell: (params) => (
                          <Checkbox
                            checked={!!params.value}
                            onChange={(e) => {
                              fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${params.row.id}/`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ is_done: e.target.checked }),
                              })
                                .then(res => res.json())
                                .then(() => {
                                  setRefresh((prev) => !prev); // refresh UI after update
                                });
                            }}
                          />
                        ),
                      },

                      {
                        field: 'title',
                        headerName: 'Tâche',
                        flex: 1,
                        renderCell: (params) => (
                          <span
                            onClick={() => {
                              setSelectedTask(params.row);
                              setTaskDetailsDialogOpen(true);
                            }}
                            style={{
                              color: params.row.is_done ? 'gray' : '#1976d2',
                              cursor: 'pointer',
                              textDecoration: params.row.is_done ? 'line-through' : 'underline',
                            }}
                          >
                            {params.value}
                          </span>
                        ),
                      },
                      {
                        field: 'priority',
                        headerName: 'Priorité',
                        width: 120,
                        renderCell: (params) => {
                          let color = '';
                          switch (params.value) {
                            case 'high': color = 'red'; break;
                            case 'medium': color = 'orange'; break;
                            case 'low': color = 'green'; break;
                          }
                          return (
                            <span
                              style={{
                                color,
                                fontWeight: 'bold',
                                textTransform: 'capitalize',
                              }}
                            >
                              {params.value}
                            </span>
                          );
                        },
                      },
                      {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        width: 100,
                        getActions: (params) => [
                          <GridActionsCellItem
                            key="delete"
                            icon={<DeleteIcon color="error" />}
                            label="Supprimer"
                            onClick={() => {
                              setTaskToDelete(Number(params.id));
                              setDeleteDialogOpen(true);
                            }}
                            showInMenu={false}
                          />,
                        ],
                      },
                    ]}
                    getRowId={(row) => row.id}
                    density="compact"
                  />

                </Box>
              ))}
            </Stack>
          </>
        )}
      </Box>
    )}
  </Box>

     
   ;


 {/* Add Dialog */}
    <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Modifier un foncier" : "Ajouter un foncier"}
        <IconButton
          aria-label="close"
          onClick={() => setDialogOpen(false)}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
<DialogContent dividers>
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>

    {/* ================= CODE & COMMUNE ================= */}
    <TextField
      label="Code"
      value={newItem.code || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
      sx={{ flex: "1 1 45%" }}
    />
    <TextField
      label="Commune"
      value={newItem.commune || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, commune: e.target.value })}
      sx={{ flex: "1 1 45%" }}
    />

    {/* ================= DESCRIPTION ================= */}
    <TextField
      label="Description"
      value={newItem.description || ""}
      disabled={!canEditNormalFields}
      fullWidth
      multiline
      rows={3}
      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
    />

    {/* ================= USAGE ================= */}
    <FormControl sx={{ flex: "1 1 45%" }} disabled={!canEditNormalFields}>
      <InputLabel id="usage-label">Affectation</InputLabel>
      <Select
        labelId="usage-label"
        label="Usage"
        value={newItem.usage || ""}
        onChange={(e) => setNewItem({ ...newItem, usage: e.target.value })}
      >
        <MenuItem value="">
          <em>Sélectionnez</em>
        </MenuItem>
        {usages.map((u: any) => (
          <MenuItem key={u.id} value={u.id}>
            {u.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* ================= ADD NEW USAGE ================= */}
    <Box sx={{ display: "flex", gap: 1, flex: "1 1 45%", mt: 1 }}>
      <TextField
        label="Nouvelle affectation"
        value={newUsageName}
        onChange={(e) => setNewUsageName(e.target.value)}
        fullWidth
        disabled={!canEditNormalFields}
      />
    
<Button
  variant="outlined"
  disabled={!canEditNormalFields}
  onClick={async () => {
    if (!newUsageName.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/usages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          name: newUsageName,
          parent_type: selectedType,
        }),
      });

      const data: Usage = await res.json(); // ✅ Type added

      setUsages((prev) => [...prev, data]);
     setNewItem({ ...newItem, usage: data.id.toString() });
      setNewUsageName("");
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'affectation:", err);
    }
  }}
>
  Ajouter
</Button>

    </Box>

    {/* ================= SURFACE & PROGRESS ================= */}
    <TextField
      label="Surface (m²)"
      type="number"
      value={newItem.surface || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, surface: Number(e.target.value) })}
      sx={{ flex: "1 1 45%" }}
    />
    <TextField
      label="Taux de Viabilisation (%)"
      type="number"
      value={newItem.progress_viabilisation || 0}
      disabled={!canEditNormalFields}
      onChange={(e) =>
        setNewItem({ ...newItem, progress_viabilisation: Number(e.target.value) })
      }
      sx={{ flex: "1 1 45%" }}
    />

    {/* ================= COORDINATES ================= */}
    <TextField
      label="Coordonnées (lat,long)"
      value={newItem.coordinates || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, coordinates: e.target.value })}
      sx={{ flex: "1 1 45%" }}
    />
    <TextField
      label="Coordonnées (DMS)"
      value={newItem.coordinates_dms || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, coordinates_dms: e.target.value })}
      sx={{ flex: "1 1 45%" }}
    />

    {/* ================= POS & CADASTRE ================= */}
    <TextField
      label="POS"
      value={newItem.POS || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, POS: e.target.value })}
      sx={{ flex: "1 1 45%" }}
    />
    <TextField
      label="Référence Section Cadastre"
      value={newItem.Ref_Cadastre_Section || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, Ref_Cadastre_Section: e.target.value })}
      sx={{ flex: "1 1 45%" }}
    />
    <TextField
      label="Référence Ilot Cadastre"
      value={newItem.Ref_Cadastre_Ilot || ""}
      disabled={!canEditNormalFields}
      onChange={(e) => setNewItem({ ...newItem, Ref_Cadastre_Ilot: e.target.value })}
      sx={{ flex: "1 1 45%" }}
    />

    {/* ================= WILAYA ================= */}
    <FormControl sx={{ flex: "1 1 45%" }} disabled={!canEditNormalFields}>
      <InputLabel>Wilaya</InputLabel>
      <Select
        value={newItem.wilaya || ""}
        onChange={(e) => setNewItem({ ...newItem, wilaya: e.target.value })}
      >
        {WILAYAS.map((wilaya) => (
          <MenuItem key={wilaya.code} value={wilaya.code}>
            {wilaya.code} - {wilaya.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* ================= FILE UPLOAD ================= */}
    <Button
      component="label"
      variant="outlined"
      startIcon={<CloudUploadIcon />}
      sx={{ flex: "1 1 100%" }}
      disabled={!canEditNormalFields}
    >
      Ajouter un fichier GeoJSON
      <input
        hidden
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setNewItem({ ...newItem, geojson_file: e.target.files[0] });
          }
        }}
      />
    </Button>

    {/* ================= CHECKBOXES ================= */}
    {/* DG Only */}
    <FormControlLabel
      control={
        <Checkbox
          checked={newItem.is_transmis || false}
          disabled={!canDGTransmitOrPublish}
          onChange={(e) => setNewItem({ ...newItem, is_transmis: e.target.checked })}
        />
      }
      label="Transmis ?"
      sx={{ flex: "1 1 45%" }}
    />

    {newItem.is_transmis && (
      <TextField
        label="Date de transmission"
        type="date"
        value={newItem.date_transmission || ""}
        disabled={!canDGTransmitOrPublish}
        onChange={(e) => setNewItem({ ...newItem, date_transmission: e.target.value })}
        InputLabelProps={{ shrink: true }}
        sx={{ flex: "1 1 45%" }}
      />
    )}

    <FormControlLabel
      control={
        <Checkbox
          checked={newItem.is_published || false}
          disabled={!canDGTransmitOrPublish}
          onChange={(e) => setNewItem({ ...newItem, is_published: e.target.checked })}
        />
      }
      label="Publié"
      sx={{ flex: "1 1 45%" }}
    />

    
    
      {/* Confirmations */}
 
<Box sx={confirmationBoxStyle}>
  <Typography fontWeight={600}>DUAC</Typography>

  <Button component="label" variant="outlined" fullWidth>
    Joindre fichier DUAC (PDF)
    <input
      hidden
      type="file"
      accept="application/pdf"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setNewItem(prev => ({
          ...prev,
          duac_file: file,
          duac_file_bytes: null, // optional: remove base64
          is_confirmed_by_duac: true,
        }));
      }}
    />
  </Button>

 {newItem.id && newItem.duac_file && (
  <DocumentViewButton
    documentId={newItem.id}
    fileType="duac"
    label="Voir DUAC"
  />
)}





  <FormControlLabel
    control={
      <Checkbox
        checked={!!newItem.is_confirmed_by_duac}
        disabled={!newItem.duac_file}
      />
    }
    label="Confirmé par DUAC"
  />

  {newItem.duac_file && (
    <Button
      color="error"
      size="small"
      onClick={() =>
        setNewItem(prev => ({
          ...prev,
          duac_file: null,
          duac_file_bytes: null,
          is_confirmed_by_duac: false,
        }))
      }
    >
      Supprimer fichier DUAC
    </Button>
  )}
</Box>

{/* Repeat the same for DCCF */}
<Box sx={confirmationBoxStyle}>
  <Typography fontWeight={600}>DCCF</Typography>

  <Button component="label" variant="outlined" fullWidth>
    Joindre fichier DCCF (PDF)
    <input
      hidden
      type="file"
      accept="application/pdf"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setNewItem(prev => ({
          ...prev,
          dccf_file: file,
          dccf_file_bytes: null,
          is_confirmed_by_DCCF: true,
        }));
      }}
    />
  </Button>

 {newItem.id && newItem.dccf_file && (
  <DocumentViewButton
    documentId={newItem.id}
    fileType="dccf"
    label="Voir DCCF"
  />
)}




  <FormControlLabel
    control={
      <Checkbox
        checked={!!newItem.is_confirmed_by_DCCF}
        disabled={!newItem.dccf_file}
      />
    }
    label="Confirmé par DCCF"
  />

  {newItem.dccf_file && (
    <Button
      size="small"
      color="error"
      onClick={() =>
        setNewItem(prev => ({
          ...prev,
          dccf_file: null,
          dccf_file_bytes: null,
          is_confirmed_by_DCCF: false,
        }))
      }
    >
      Supprimer fichier DCCF
    </Button>
  )}
</Box>

{/* Repeat the same for Domaine */}
<Box sx={confirmationBoxStyle}>
  <Typography fontWeight={600}>Domaine / Cadastre</Typography>

  <Button component="label" variant="outlined" fullWidth>
    Joindre fichier Domaine (PDF)
    <input
      hidden
      type="file"
      accept="application/pdf"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setNewItem(prev => ({
          ...prev,
          domaine_file: file,
          domaine_file_bytes: null,
          is_confirmed_by_Domaine: true,
        }));
      }}
    />
  </Button>

{newItem.id && newItem.domaine_file && (
  <DocumentViewButton
    documentId={newItem.id}
    fileType="domaine"
    label="Voir Domaine"
  />
)}

  <FormControlLabel
    control={
      <Checkbox
        checked={!!newItem.is_confirmed_by_Domaine}
        disabled={!newItem.domaine_file}
      />
    }
    label="Confirmé par Domaine"
  />

  {newItem.domaine_file && (
    <Button
      size="small"
      color="error"
      onClick={() =>
        setNewItem(prev => ({
          ...prev,
          domaine_file: null,
          domaine_file_bytes: null,
          is_confirmed_by_Domaine: false,
        }))
      }
    >
      Supprimer fichier Domaine
    </Button>
  )}
</Box>


    {/* Completed (User only) */}
    <FormControlLabel
      control={
        <Checkbox
          checked={newItem.is_completed || false}
          disabled={!canUserComplete}
          onChange={(e) => setNewItem({ ...newItem, is_completed: e.target.checked })}
        />
      }
      label={newItem.is_completed ? "Foncier mobilisé" : "Foncier non mobilisé"}
    />

    {/* Favorite */}
    <FormControlLabel
      control={
        <Checkbox
          checked={newItem.is_favorited || false}
          disabled={!canEditNormalFields}
          onChange={(e) => setNewItem({ ...newItem, is_favorited: e.target.checked })}
          icon={<StarBorderIcon />}
          checkedIcon={<StarIcon />}
          sx={{ "&.Mui-checked": { color: "#f5c518" } }}
        />
      }
      label="Marquer comme favori"
      sx={{ flex: "1 1 100%" }}
    />

  </Box>
</DialogContent>




      <DialogActions>
        <Button onClick={() => setDialogOpen(false)} color="secondary">
          Annuler
        </Button>
        <Button onClick={handleAdd} variant="contained" color="primary">
          {isEdit ? "Mettre à jour" : "Ajouter"}
        </Button>
      </DialogActions>
    </Dialog>
   <Messagerie></Messagerie>
<Popover
  open={Boolean(popoverAnchor)}
  anchorEl={popoverAnchor}
  onClose={closePopover}
  disableRestoreFocus
  anchorOrigin={{
    vertical: "center",
    horizontal: "right",
  }}
  transformOrigin={{
    vertical: "center",
    horizontal: "left",
  }}
>
  {popoverRow && (
    <Box p={1.5} minWidth={200}>
      <Typography variant="body2">
        DUAC : {popoverRow.is_confirmed_by_duac ? "✅ Oui" : "❌ Non"}
      </Typography>
      <Typography variant="body2">
        DCCF : {popoverRow.is_confirmed_by_DCCF ? "✅ Oui" : "❌ Non"}
      </Typography>
      <Typography variant="body2">
        Domaine : {popoverRow.is_confirmed_by_Domaine ? "✅ Oui" : "❌ Non"}
      </Typography>
    </Box>
  )}
</Popover>

  <Dialog open={duplicateDialog.open} onClose={() => setDuplicateDialog({ open: false, code: "" })}>
    <DialogTitle>Code dupliqué</DialogTitle>
    <DialogContent>
      <p>Le code <strong>{duplicateDialog.code}</strong> existe déjà.</p>
      <p>Veuillez vérifier le fichier avant de continuer.</p>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setDuplicateDialog({ open: false, code: "" })}>OK</Button>
    </DialogActions>
  </Dialog>
   {/* ===== IMPORT PROGRESS DIALOG ===== */}
     <Dialog open={importing} disableEscapeKeyDown>
  <DialogTitle>Importation en cours</DialogTitle>
  <DialogContent style={{ minWidth: 350, paddingTop: 16 }}>
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <LinearProgress
        variant="determinate"
        value={progress}
        style={{ width: "100%", height: 10, borderRadius: 5 }}
      />
      <Typography variant="body1">{Math.round(progress)}% importé</Typography>
      <Typography variant="body2" color="textSecondary">
        Veuillez patienter pendant l'importation des fonciers...
      </Typography>

      {existingFonciers.length > 0 && (
        <Box mt={2} width="100%">
          <Typography variant="subtitle2" color="error">
            Fonciers déjà existants :
          </Typography>
          <ul style={{ maxHeight: 150, overflowY: "auto" }}>
            {existingFonciers.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </Box>
      )}
    </Box>
  </DialogContent>
</Dialog>

 {/* Step Dialog */}
    <Dialog open={stepDialogOpen} onClose={() => setStepDialogOpen(false)}>
      <DialogTitle>Ajouter une étape</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Titre de l'étape" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} sx={{ mt: 2 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setStepDialogOpen(false)}>Annuler</Button>
        <Button
          onClick={async () => {
            await handleCreateStep(); // ✅ now calls the secured function
          }}
          variant="contained"
        >
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>

    {/* Task Dialog */}
  <Dialog
open={taskDialogOpen}
onClose={() => setTaskDialogOpen(false)}
maxWidth="sm" // Fix width
fullWidth
>
<DialogTitle>Ajouter une tâche</DialogTitle>
<DialogContent>
  <Stack spacing={2} mt={1}>
    <TextField
      fullWidth
      label="Titre de la tâche"
      value={newTaskTitle}
      onChange={(e) => setNewTaskTitle(e.target.value)}
    />

    {/* Users select with chips */}
    <FormControl fullWidth>
      <InputLabel id="assigned-users-label">Assign Users</InputLabel>
      <Select
        labelId="assigned-users-label"
        multiple
        value={selectedTaskUsers}
        onChange={(e) => setSelectedTaskUsers(e.target.value as number[])}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {users
              .filter((u) => selected.includes(u.id))
              .map((u) => (
                <Chip key={u.id} label={u.username} />
              ))}
          </Box>
        )}
      >
        {users.map((user) => (
          <MenuItem key={user.id} value={user.id}>
            <Checkbox checked={selectedTaskUsers.includes(user.id)} />
            <Typography>{user.username}</Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl fullWidth>
      <InputLabel id="priority-label">Priorité</InputLabel>
      <Select
        labelId="priority-label"
        value={newTaskPriority}
        label="Priorité"
        onChange={(e) =>
          setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')
        }
      >
        <MenuItem value="low">Faible</MenuItem>
        <MenuItem value="medium">Moyenne</MenuItem>
        <MenuItem value="high">Élevée</MenuItem>
      </Select>
    </FormControl>
  </Stack>
</DialogContent>

<DialogActions>
  <Button onClick={() => setTaskDialogOpen(false)}>Annuler</Button>
  <Button
  onClick={async () => {
    if (!selectedStepId) return;

    try {
      const accessToken = localStorage.getItem("access"); // ✅ get token
      if (!accessToken) {
        showMessage("Vous n'êtes pas authentifié", "error");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`, // ✅ include token
      };

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/steps/${selectedStepId}/tasks/`,
        {
          title: newTaskTitle,
          priority: newTaskPriority,
          assigned_users: selectedTaskUsers,
        },
        { headers } // ✅ secure
      );

      // Reset fields
      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setSelectedTaskUsers([]);
      setTaskDialogOpen(false);

      if (selectedItem) fetchSteps(selectedItem.id);

      showMessage("Tâche ajoutée avec succès", "success");

    } catch (error) {
      console.error(error);
      showMessage("Erreur lors de la création de la tâche", "error");
    }
  }}
  variant="contained"
>
  Ajouter
</Button>

</DialogActions>
  </Dialog>


  <Dialog
open={taskDetailsDialogOpen}
onClose={() => setTaskDetailsDialogOpen(false)}
fullWidth
maxWidth={false}
PaperProps={{
sx: {
  width: '90vw',
  height: '90vh',
  maxWidth: 'none',
},
}}
>
<DialogTitle>
Détails de la tâche
<IconButton
  aria-label="close"
  onClick={() => setTaskDetailsDialogOpen(false)}
  sx={{ position: 'absolute', right: 8, top: 8 }}
>
  <CloseIcon />
</IconButton>
</DialogTitle>

<DialogContent dividers sx={{ height: 'calc(100% - 64px - 52px)', overflow: 'auto' }}>
{selectedTask ? (
  <Stack spacing={2}>
    <Typography variant="h6">{selectedTask.title}</Typography>
    <Typography variant="body2">
      Statut: {selectedTask.is_done ? 'Terminée' : 'En cours'}
    </Typography>
    {/* Assigned Users */}
    <Box>
<Typography variant="subtitle1" gutterBottom>
Utilisateurs assignés
</Typography>
{selectedTask.assigned_users && selectedTask.assigned_users.length > 0 ? (
<Stack direction="row" spacing={1} flexWrap="wrap">
{selectedTask.assigned_users.map((user) => (
  <Chip
    key={user.id}
    label={`${user.username} (${user.email})`}
    variant="outlined"
    onDelete={() => handleRemoveUser(selectedTask.id, user.id)}
  />
))}
</Stack>
) : (
<Typography color="text.secondary">Aucun utilisateur assigné</Typography>
)}

</Box>

    <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
      {/* Comments - 1/3 */}
      <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
        <Typography variant="subtitle1" gutterBottom>
          Commentaires
        </Typography>

        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button
            variant="contained"
            size="small"
            onClick={async () => {
              if (!newComment.trim() || !selectedTask) return;
              try {
                const res = await axios.post(
                  `${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${selectedTask.id}/comments/`,
                  {
                    content: newComment,
                    author: 'Admin',
                  }
                );
                setComments((prev) => [res.data, ...prev]);
                setNewComment('');
              } catch {
                showMessage("Erreur lors de l'ajout du commentaire", 'error');
              }
            }}
          >
            Envoyer
          </Button>
          {comments.length === 0 && (
            <Typography color="text.secondary">Aucun commentaire</Typography>
          )}
          {comments.map((comment) => (
          <Paper key={comment.id} variant="outlined" sx={{ p: 1.5, position: 'relative' }}>
            <IconButton
              size="small"
              onClick={async () => {
                try {
                  await axios.delete(
                    `${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${selectedTask.id}/comments/${comment.id}/`
                  );
                  setComments((prev) => prev.filter((c) => c.id !== comment.id));
                  showMessage('Commentaire supprimé', 'success');
                } catch {
                  showMessage('Erreur lors de la suppression', 'error');
                }
              }}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>

            <Typography variant="body2" fontWeight="bold">
              {comment.author}
            </Typography>
            <Typography variant="body2">{comment.content}</Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(comment.created_at).toLocaleString('fr-FR')}
            </Typography>
          </Paper>
          ))}



        </Stack>
      </Box>

      {/* Documents - 2/3 */}
      <Box sx={{ width: { xs: '100%', md: '66.66%' } }}>
        <Typography variant="subtitle1" gutterBottom>
          Documents attachés
        </Typography>

        <DataGrid
rows={taskDocuments}
columns={[
{
  field: 'file',
  headerName: 'Document',
  flex: 1,
  renderCell: (params) => (
    <Stack direction="row" alignItems="center" spacing={1}>
      {getFileIcon(params.row.file)}
      <Button
        variant="text"
        color="primary"
        onClick={() => openPdfViewer(params.row.id)}
      >
        Voir
      </Button>
    </Stack>
  ),
},
{
field: 'uploaded_at',
headerName: 'Date',
width: 180,
valueFormatter: (params: GridCellParams) =>
  params.value
    ? new Date(params.value as string).toLocaleString('fr-FR')
    : '',
}
,
{
  field: 'download',
  headerName: 'Télécharger',
  width: 150,
  renderCell: (params) => (
    <Button
variant="text"
color="secondary"
onClick={() => downloadDocument(params.row.id, params.row.file_name)}
>
Télécharger
</Button>

  ),
},
]}
autoHeight
getRowId={(row) => row.id}
/>
        {typeof window !== 'undefined' && localStorage.getItem('can_write') === 'true' && (
<Button
component="label"
variant="outlined"
startIcon={<CloudUploadIcon />}
>
Ajouter un fichier
<input
  hidden
  type="file"
  onChange={async (e) => {
    if (!e.target.files?.[0] || !selectedTask) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${selectedTask.id}/documents/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/tasks/${selectedTask.id}/documents/`
      );
      setTaskDocuments(res.data);
      showMessage('Fichier téléchargé avec succès', 'success');
    } catch {
      showMessage('Erreur lors du téléchargement du fichier', 'error');
    }
  }}
/>
</Button>
)}

      </Box>
    </Stack>
  </Stack>
) : (
  <Typography>Chargement...</Typography>
)}
</DialogContent>

<DialogActions>
<Button onClick={() => setTaskDetailsDialogOpen(false)} color="primary">
  Fermer
</Button>
</DialogActions>
  </Dialog>
  <Snackbar
    open={snackbar.open}
    autoHideDuration={3000}
    onClose={() => setSnackbar({ ...snackbar, open: false })}
  >
    <Alert severity={snackbar.severity as any} sx={{ width: '100%' }}>
      {snackbar.message}
    </Alert>
  </Snackbar>
 <Dialog
    open={pdfViewerOpen}
    onClose={() => {
setPdfViewerOpen(false);
if (pdfBlobUrl) {
URL.revokeObjectURL(pdfBlobUrl); // Clean up
}
setPdfBlobUrl('');
}}


    fullWidth
    maxWidth="lg"
  >
    {canView ? (
<>
<DialogTitle>
  Aperçu du document PDF
  <IconButton
    aria-label="close"
    onClick={() => {
      setPdfViewerOpen(false);
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      setPdfBlobUrl('');
    }}
    sx={{ position: 'absolute', right: 8, top: 8 }}
  >
    <CloseIcon />
  </IconButton>
</DialogTitle>

<DialogContent dividers>
  {pdfBlobUrl ? (
    <iframe
      src={pdfBlobUrl}
      width="100%"
      height="600px"
      style={{ border: 'none' }}
    />
  ) : (
    <Typography>Chargement du PDF...</Typography>
  )}
</DialogContent>
</>
) : (
<>
<DialogTitle>
  Accès refusé
  <IconButton
    aria-label="close"
    onClick={() => setPdfViewerOpen(false)}
    sx={{ position: 'absolute', right: 8, top: 8 }}
  >
    <CloseIcon />
  </IconButton>
</DialogTitle>

<DialogContent dividers>
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    py={6}
  >
    <BlockIcon sx={{ fontSize: 100, color: 'red', mb: 2 }} />
    <Typography variant="h6" color="error" align="center" gutterBottom>
      Vous n’avez pas la permission de visualiser ce document
    </Typography>
    <Typography variant="body2" color="text.secondary" align="center">
      Veuillez contacter un administrateur si vous pensez qu’il s’agit d’une erreur.
    </Typography>
  </Box>
</DialogContent>
</>
)}
  </Dialog>
  <Dialog
open={deleteDialogOpen}
onClose={() => setDeleteDialogOpen(false)}
>
<DialogTitle>Confirmer la suppression</DialogTitle>
<DialogContent>
<Typography>Voulez-vous vraiment supprimer cette tâche ?</Typography>
</DialogContent>
<DialogActions>
<Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
  Annuler
</Button>
<Button
  onClick={async () => {
    if (taskToDelete !== null) {
      try {
        await handleDeleteTask(taskToDelete);
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
      } catch (err) {
        showMessage('Erreur lors de la suppression', 'error');
      }
    }
  }}
  color="error"
  variant="contained"
>
  Supprimer
</Button>
</DialogActions>
  </Dialog>
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Foncier Map
          <IconButton
            aria-label="close"
            onClick={handleClose}
            style={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ height: "600px", padding: 0 }}>
          {selectedGeojson && <LeftMap geojson={selectedGeojson} />}
        </DialogContent>
      </Dialog>
  </main>
);
}
