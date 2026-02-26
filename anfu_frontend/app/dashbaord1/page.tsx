'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Breadcrumbs,
  Link,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid ,GridPaginationModel} from '@mui/x-data-grid';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PublicIcon from '@mui/icons-material/Public';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Navbar from "@/components/Navbar";
import SmallNavbar from "./SmallNavbar";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type EspaceCode = 'DGL' | 'DGV' | 'DGUA' | 'DGCMR' | 'DGAAT' | 'COMMUN';
type RelationType = 'ANFU' | 'ONE' | 'BOTH';
type Priority = 1 | 2 | 3;
 // Relation display
const displayRelation = (relation: RelationType, espace: EspaceCode) => {
  if (relation === 'ANFU') return 'ANFU';
  if (relation === 'BOTH') return `ANFU + ${espace}`;
  return espace; // 'ONE' case
};

const displayPriority = (priority: Priority) => {
  switch (priority) {
    case 3:
      return 'Élevée';
    case 2:
      return 'Moyenne';
    case 1:
      return 'Faible';
    default:
      return '';
  }
};


interface Thematique {
  id: number;
  name: string;
  espace: EspaceCode;
  relation_type: RelationType;
  priority: Priority;
}

interface Comment {
  id: number;
  text: string;
  created_at: string;
  username: string;
}

interface UploadedFile {
  id: number;
  name: string;
  bytes: Uint8Array;
  uploaded_by: 'ANFU' | EspaceCode;
}

export default function DashboardPage() {
  const [selectedEspace, setSelectedEspace] = useState<EspaceCode | null>(null);
  const [thematiques, setThematiques] = useState<Thematique[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Thematique | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bigCollabDialogOpen, setBigCollabDialogOpen] = useState(false);
  const [newTheme, setNewTheme] = useState('');
  const [newComment, setNewComment] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: UploadedFile[] }>({});
  const [userRole, setUserRole] = useState<'ANFU' | EspaceCode | ''>('');
  const [username, setUsername] = useState<string>(''); // <-- NEW

  
  const [newRelationType, setNewRelationType] = useState<RelationType>('ANFU');
  const [newPriority, setNewPriority] = useState<Priority>(3);
  

  // ---------------- ROLE ----------------
  useEffect(() => {
  if (typeof window !== "undefined") { // make sure localStorage is available
    const role = localStorage.getItem('role');
    const user = localStorage.getItem('username'); // <-- NEW

    if (role) setUserRole(role.toUpperCase() as any);
    if (user) setUsername(user); // <-- NEW
  }
}, []);

  const SPACES_ICONS = [
    { code: 'DGL', icon: <ApartmentIcon fontSize="large" />, color: 'from-green-600 to-green-800' },
    { code: 'DGV', icon: <BusinessIcon fontSize="large" />, color: 'from-blue-600 to-blue-800' },
    { code: 'DGUA', icon: <AccountBalanceIcon fontSize="large" />, color: 'from-emerald-600 to-emerald-800' },
    { code: 'DGCMR', icon: <PublicIcon fontSize="large" />, color: 'from-teal-600 to-teal-800' },
    { code: 'DGAAT', icon: <BusinessIcon fontSize="large" />, color: 'from-purple-600 to-purple-800' }, // NEW
    { code: 'COMMUN', icon: <AccountBalanceIcon fontSize="large" />, color: 'from-gray-700 to-gray-900' },
  ];

  // ---------------- FILTER SPACES BASED ON ROLE ----------------
  const visibleSpaces = SPACES_ICONS.filter((space) => {
    if (userRole === 'ANFU') return true;
    return space.code === userRole || space.code === 'COMMUN';
  });
 
  // ---------------- THEMES ----------------
  const fetchThematiques = async (espace: EspaceCode) => {
  if (!espace) return;

  try {
    const token = localStorage.getItem('access');
    const res = await axios.get(`${API_URL}/auth/themes/`, {
      params: { espace }, // ?espace=DGL
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (Array.isArray(res.data)) {
      setThematiques(res.data);
    } else {
      console.warn('Unexpected response format:', res.data);
      setThematiques([]);
    }
  } catch (err) {
    console.error('Error fetching thematiques:', err);
    setThematiques([]);
  }
};
 
 const addTheme = async () => {
  if (!newTheme.trim() || !selectedEspace) return;

  try {
    const token = localStorage.getItem('access');
    if (!token) throw new Error('No access token found');

    const payload = {
      name: newTheme.trim(),
      espace: selectedEspace,
      relation_type: newRelationType,
      priority: newPriority,
    };

    const res = await axios.post(`${API_URL}/auth/themes/`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('Theme added:', res.data);

    // Clear inputs
    setNewTheme('');
    setNewRelationType('ANFU');
    setNewPriority(3);

    // Refresh the list automatically
    fetchThematiques(selectedEspace);
  } catch (err) {
    console.error('Error adding theme:', err);
  }
};

  const handleCardClick = (code: EspaceCode) => {
    setSelectedEspace(code);
    fetchThematiques(code);
  };

  // ---------------- COMMENTS ----------------
  const fetchComments = async (thematiqueId: number) => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_URL}/auth/themes/${thematiqueId}/commts/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(res.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };
  
  const showANFU =
  selectedTheme?.relation_type === 'ANFU' ||
  selectedTheme?.relation_type === 'BOTH';

const showEspace =
  selectedTheme?.relation_type === 'ONE' ||
  selectedTheme?.relation_type === 'BOTH';

  const addComment = async () => {
    if (!newComment.trim() || !selectedTheme) return;
    try {
      const token = localStorage.getItem('access');
      const res = await axios.post(
        `${API_URL}/auth/themes/${selectedTheme.id}/commts/`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };
  

  // DELETE
const handleDeleteTheme = async (theme: Thematique) => {
  if (!selectedEspace) return;

  if (!confirm(`Voulez-vous vraiment supprimer la thématique "${theme.name}" ?`)) {
    return;
  }

  try {
    const token = localStorage.getItem("access");

    await axios.delete(
      `${API_URL}/auth/themes/${theme.id}/delete/`,
      {
        headers: { Authorization: `Bearer ${token}` },
    });

    fetchThematiques(selectedEspace);
  } catch (err) {
    console.error("Error deleting theme:", err);
  }
};

// EDIT: open dialog
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [themeToEdit, setThemeToEdit] = useState<Thematique | null>(null);
const [editedName, setEditedName] = useState('');
const [editedRelation, setEditedRelation] = useState<RelationType>('ANFU');
const [editedPriority, setEditedPriority] = useState<Priority>(3);

const handleEditTheme = (theme: Thematique) => {
  setThemeToEdit(theme);
  setEditedName(theme.name);
  setEditedRelation(theme.relation_type);
  setEditedPriority(theme.priority);
  setEditDialogOpen(true);
};

const saveEditedTheme = async () => {
  if (!themeToEdit || !selectedEspace) return;

  try {
    const token = localStorage.getItem("access");
    await axios.put(
      `${API_URL}/auth/themes/${themeToEdit.id}/`,
      {
        name: editedName,
        relation_type: editedRelation,
        priority: editedPriority,
        espace: themeToEdit.espace,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setEditDialogOpen(false);
    fetchThematiques(selectedEspace);
  } catch (err) {
    console.error("Error updating theme:", err);
  }
};
  // ---------------- COLUMNS FOR DATAGRID ----------------
const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Nom Thématique', flex: 1 },

  {
    field: 'relation',
    headerName: 'Actionneur',
    flex: 1,
    renderCell: (params: any) => {
      const { relation_type, espace } = params.row;
      if (relation_type === 'ANFU') return 'ANFU';
      if (relation_type === 'BOTH') return `ANFU + ${espace}`;
      if (relation_type === 'ONE') return espace;
      return '';
    },
  },

  {
    field: 'priority',
    headerName: 'Priorité',
    width: 120,
    renderCell: (params: any) => {
      const { priority } = params.row;
      if (priority === 3) return 'Élevée';
      if (priority === 2) return 'Moyenne';
      if (priority === 1) return 'Faible';
      return '';
    },
  },

  { field: 'espace', headerName: 'Espace', width: 120 },

  {
  field: 'actions',
  headerName: 'Actions',
  width: 100,
  sortable: false,
  renderCell: (params: any) => {
    // Show buttons only for ANFU
    if (userRole !== 'ANFU') return null;

    return (
      <div className="flex gap-1">
        <IconButton
          color="primary"
          size="small"
          onClick={() => handleEditTheme(params.row)}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          color="error"
          size="small"
          onClick={() => handleDeleteTheme(params.row)}
        >
          <DeleteIcon />
        </IconButton>
      </div>
    );
  },
}
];
const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
  page: 0,
  pageSize: 5,
});

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "à l’instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return date.toLocaleDateString("fr-FR");
  };

  // ---------------- UPLOAD ----------------
  const handleUpload = async (
    thematiqueId: number,
    filesList: FileList | null,
    uploadedBy: 'ANFU' | EspaceCode
  ) => {
    if (!filesList || !thematiqueId) return;

    const formData = new FormData();
    Array.from(filesList).forEach((file) => {
      formData.append("file", file);
    });
    formData.append("uploaded_by", uploadedBy);

    try {
      const token = localStorage.getItem("access");
      await axios.post(`${API_URL}/auth/themes/${thematiqueId}/files/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // After successful upload, fetch files again
      fetchFiles(thematiqueId, uploadedBy);
    } catch (err) {
      console.error("Error uploading files:", err);
    }
  };

  const openBigCollab = async (theme: Thematique) => {
    setSelectedTheme(theme);
    fetchComments(theme.id);

    // Fetch files for ANFU + selected espace
    fetchFiles(theme.id, 'ANFU');
    if (selectedEspace) fetchFiles(theme.id, selectedEspace);

    setBigCollabDialogOpen(true);
  };

  // ---------------- DOWNLOAD FROM BYTES ----------------
  const downloadFile = (file: UploadedFile) => {
  // Create a proper Uint8Array from the bytes
  const bytes = new Uint8Array(file.bytes); // copy into proper Uint8Array
  const blob = new Blob([bytes]);
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
};

  // ---------------- FETCH FILES FROM API ----------------
  const fetchFiles = async (thematiqueId: number, uploadedBy: 'ANFU' | EspaceCode) => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_URL}/auth/themes/${thematiqueId}/files/?uploaded_by=${uploadedBy}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const files: UploadedFile[] = res.data.map((f: any) => ({
        id: f.id,
        name: f.file_name,
        bytes: new Uint8Array(f.bytes),
        uploaded_by: f.uploaded_by,
      }));

      setUploadedFiles((prev) => ({
        ...prev,
        [uploadedBy]: files,
      }));
    } catch (err) {
      console.error('Error fetching files by bytes:', err);
    }
  };

const router = useRouter();
const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
const openMenu = Boolean(anchorEl);

const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
  setAnchorEl(event.currentTarget);
};
const handleMenuClose = () => {
  setAnchorEl(null);
};

const handleLogout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('role');
  router.push('/');
};

const handleChangePassword = () => {
  router.push('/change-password'); // Make sure this page exists
  handleMenuClose();
};

  return (
    <main className="min-h-screen bg-white">
      {/* ---------------- HEADER ---------------- */}
     
      <header className="flex items-center justify-between px-8 py-4 border-b shadow-sm bg-white">
        <img src="/anfu1.png" alt="ANFU logo" className="h-16 w-auto" />
        <div className="text-center flex-1">
          <h1 className="text-sm md:text-base font-medium text-gray-800">
            République Algérienne Démocratique et Populaire
          </h1>
          <p className="text-sm text-gray-600">
            Ministère de l'Habitat, de l'Urbanisme et de la Ville et de l'Aménagement du territoire
          </p>
          <h2 className="font-bold text-lg text-black">
            Agence Nationale du Foncier Urbain
          </h2>
        </div>
        <img src="/min.svg" alt="Ministry logo" className="h-16 w-auto" />
      </header>
      
      <SmallNavbar
        role={userRole}
        username={username}
        handleLogout={handleLogout}
      />

      
      
      <Box px={6} py={4}>
        <h1 className="text-4xl font-bold text-[#1C5844] mb-2">Espaces de coordination</h1>
        <p className="text-gray-600 mb-10">Coordination institutionnelle et partage documentaire</p>

        {/* ---------------- DASHBOARD GRID ---------------- */}
        {!selectedEspace && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mb-10">
            {visibleSpaces.map((space) => (
              <div
                key={space.code}
                onClick={() => handleCardClick(space.code as EspaceCode)}
                className={`relative cursor-pointer rounded-2xl p-8 text-white bg-gradient-to-br ${space.color} shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white/20 p-3 rounded-xl">{space.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{space.code}</h2>
                    <p className="text-sm opacity-90">{space.code}</p>
                  </div>
                </div>
                <div className="text-sm opacity-90 leading-relaxed">
                  Accéder aux thématiques et échanges inter-institutionnels.
                </div>
                <div className="absolute bottom-4 right-6 text-xs opacity-80">Cliquer pour ouvrir →</div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- BREADCRUMB + DATAGRID ---------------- */}
        {selectedEspace && (
          <Box>
            <Breadcrumbs aria-label="breadcrumb" className="mb-4">
              <Link color="inherit" onClick={() => setSelectedEspace(null)} style={{ cursor: 'pointer' }}>
                Espaces
              </Link>
              <Typography color="textPrimary">{selectedEspace}</Typography>
            </Breadcrumbs>

           <Box className="mb-4 flex gap-2 items-end">
  <TextField
    size="small"
    fullWidth
    placeholder="Nom de la thématique"
    value={newTheme}
    onChange={(e) => setNewTheme(e.target.value)}
  />

  <TextField
    select
    size="small"
    label="Relation"
    value={newRelationType}
    onChange={(e) => setNewRelationType(e.target.value as RelationType)}
  >
    <MenuItem value="ANFU">ANFU seul</MenuItem>
    <MenuItem value="ONE">Autre institution seule</MenuItem>
    <MenuItem value="BOTH">ANFU + institution</MenuItem>
  </TextField>

  <TextField
    select
    size="small"
    label="Priorité"
    value={newPriority}
    onChange={(e) => setNewPriority(Number(e.target.value) as Priority)}
  >
    <MenuItem value={3}>Élevé</MenuItem>
    <MenuItem value={2}>Moyenne</MenuItem>
    <MenuItem value={1}>Faible</MenuItem>
  </TextField>

  <Button
    variant="contained"
    sx={{ backgroundColor: '#1C5844' }}
    onClick={addTheme}
  >
    Ajouter
  </Button>
</Box>

    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
  rows={thematiques}
  columns={columns}
  autoHeight
  pagination
  paginationModel={paginationModel}
  onPaginationModelChange={setPaginationModel}
  pageSizeOptions={[5, 10, 20]}
  disableRowSelectionOnClick
  onRowClick={(params) => openBigCollab(params.row)}
  getRowId={(row) => row.id}
/>
          </Box>
          </Box>
        )}

        {/* ---------------- BIG COLLAB DIALOG ---------------- */}
       {/* ---------------- BIG COLLAB DIALOG ---------------- */}
<Dialog open={bigCollabDialogOpen} onClose={() => setBigCollabDialogOpen(false)} fullScreen>
  <DialogTitle className="text-[#1C5844] font-bold text-2xl">
    {selectedTheme?.name} — {selectedEspace}
  </DialogTitle>

  <DialogContent className="h-full grid grid-cols-12 gap-6">
    {selectedEspace === 'COMMUN' ? (
      // ✅ COMMUN stays EXACTLY as you already have it
      ['ANFU', 'DGL', 'DGV', 'DGUA', 'DGCMR', 'DGAAT'].map((espace) => (
        <div key={espace} className="col-span-4 border rounded-xl p-6 bg-gray-50">
          <h3 className="font-bold text-lg mb-4">{espace}</h3>
          {/* upload + list (unchanged) */}
        </div>
      ))
    ) : (
      <>
        {/* ---------- ANFU BLOCK ---------- */}
        {showANFU && (
          <div className="col-span-4 border rounded-xl p-6 flex flex-col border-blue-500 bg-gray-50">
            <h3 className="font-bold text-lg mb-4">ANFU</h3>

            <input
              type="file"
              multiple
              id="upload-anfu"
              hidden
              onChange={(e) =>
                handleUpload(selectedTheme!.id, e.target.files, 'ANFU')
              }
            />

            <Button
              variant="contained"
              sx={{ backgroundColor: '#1C5844', mb: 2 }}
              onClick={() => document.getElementById('upload-anfu')?.click()}
            >
              Ajouter
            </Button>

            <div className="flex-1 overflow-y-auto">
              {(uploadedFiles['ANFU'] || []).length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun document</p>
              ) : (
                uploadedFiles['ANFU'].map((f) => (
                  <div key={f.id}>
                    📎 {f.name}
                    <Button size="small" onClick={() => downloadFile(f)}>
                      Télécharger
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ---------- ESPACE BLOCK ---------- */}
        {showEspace && selectedEspace && (
          <div className="col-span-4 border rounded-xl p-6 flex flex-col border-green-600 bg-gray-50">
            <h3 className="font-bold text-lg mb-4">{selectedEspace}</h3>

            <input
              type="file"
              multiple
              id="upload-espace"
              hidden
              onChange={(e) =>
                handleUpload(selectedTheme!.id, e.target.files, selectedEspace)
              }
            />

            <Button
              variant="contained"
              sx={{ backgroundColor: '#1C5844', mb: 2 }}
              onClick={() => document.getElementById('upload-espace')?.click()}
            >
              Ajouter
            </Button>

            <div className="flex-1 overflow-y-auto">
              {(uploadedFiles[selectedEspace] || []).length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun document</p>
              ) : (
                uploadedFiles[selectedEspace].map((f) => (
                  <div key={f.id}>
                    📎 {f.name}
                    <Button size="small" onClick={() => downloadFile(f)}>
                      Télécharger
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ---------- COMMENTS (ALWAYS) ---------- */}
        <div className="col-span-4 border-l pl-4 flex flex-col">
          <h3 className="font-bold mb-3 text-lg">💬 Commentaires</h3>

          <div className="flex-1 overflow-y-auto space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="bg-gray-100 p-3 rounded">
                <strong>{c.username}</strong>
                <p>{c.text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <TextField
              size="small"
              fullWidth
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button variant="contained" onClick={addComment}>
              Envoyer
            </Button>
          </div>
        </div>
      </>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setBigCollabDialogOpen(false)}>Fermer</Button>
  </DialogActions>
</Dialog>


<Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
  <DialogTitle>Modifier la thématique</DialogTitle>
  <DialogContent className="flex flex-col gap-4">
    <TextField
      label="Nom de la thématique"
      fullWidth
      value={editedName}
      onChange={(e) => setEditedName(e.target.value)}
    />
    <TextField
      select
      label="Relation"
      value={editedRelation}
      onChange={(e) => setEditedRelation(e.target.value as RelationType)}
    >
      <MenuItem value="ANFU">ANFU seul</MenuItem>
      <MenuItem value="ONE">Autre institution seule</MenuItem>
      <MenuItem value="BOTH">ANFU + institution</MenuItem>
    </TextField>
    <TextField
      select
      label="Priorité"
      value={editedPriority}
      onChange={(e) => setEditedPriority(Number(e.target.value) as Priority)}
    >
      <MenuItem value={3}>Élevé</MenuItem>
      <MenuItem value={2}>Moyenne</MenuItem>
      <MenuItem value={1}>Faible</MenuItem>
    </TextField>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
    <Button onClick={saveEditedTheme} variant="contained" sx={{ backgroundColor: '#1C5844' }}>
      Enregistrer
    </Button>
  </DialogActions>
</Dialog>
      </Box>
    </main>
  );
}
