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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid, GridPaginationModel } from '@mui/x-data-grid';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PublicIcon from '@mui/icons-material/Public';
import { useRouter } from 'next/navigation';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Navbar from '@/components/Navbar';
import SmallNavbar from './SmallNavbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type EspaceCode = 'DGL' | 'DGV' | 'DGUA' | 'DGCMR' | 'DGAAT' | 'COMMUN';
type RelationType = 'ANFU' | 'ONE' | 'BOTH';
type Priority = 1 | 2 | 3;

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
  const [newTheme, setNewTheme] = useState('');
  const [newComment, setNewComment] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: UploadedFile[] }>({});
  const [userRole, setUserRole] = useState<'ANFU' | EspaceCode | ''>('');
  const [username, setUsername] = useState<string>('');

  const [newRelationType, setNewRelationType] = useState<RelationType>('ANFU');
  const [newPriority, setNewPriority] = useState<Priority>(3);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<Thematique | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedRelation, setEditedRelation] = useState<RelationType>('ANFU');
  const [editedPriority, setEditedPriority] = useState<Priority>(3);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 5 });

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role');
      const user = localStorage.getItem('username');
      if (role) setUserRole(role.toUpperCase() as any);
      if (user) setUsername(user);
    }
  }, []);

  const SPACES_ICONS = [
    { code: 'DGL', icon: <ApartmentIcon fontSize="large" />, color: 'from-green-600 to-green-800' },
    { code: 'DGV', icon: <BusinessIcon fontSize="large" />, color: 'from-blue-600 to-blue-800' },
    { code: 'DGUA', icon: <AccountBalanceIcon fontSize="large" />, color: 'from-emerald-600 to-emerald-800' },
    { code: 'DGCMR', icon: <PublicIcon fontSize="large" />, color: 'from-teal-600 to-teal-800' },
    { code: 'DGAAT', icon: <BusinessIcon fontSize="large" />, color: 'from-purple-600 to-purple-800' },
    { code: 'COMMUN', icon: <AccountBalanceIcon fontSize="large" />, color: 'from-gray-700 to-gray-900' },
  ];

  const visibleSpaces = SPACES_ICONS.filter((space) => {
    if (userRole === 'ANFU') return true;
    return space.code === userRole || space.code === 'COMMUN';
  });

  const fetchThematiques = async (espace: EspaceCode) => {
    if (!espace) return;
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_URL}/auth/themes/`, {
        params: { espace },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setThematiques(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setThematiques([]);
    }
  };

  const addTheme = async () => {
    if (!newTheme.trim() || !selectedEspace) return;
    try {
      const token = localStorage.getItem('access');
      const payload = { name: newTheme.trim(), espace: selectedEspace, relation_type: newRelationType, priority: newPriority };
      await axios.post(`${API_URL}/auth/themes/`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setNewTheme('');
      setNewRelationType('ANFU');
      setNewPriority(3);
      fetchThematiques(selectedEspace);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = (code: EspaceCode) => {
    setSelectedEspace(code);
    fetchThematiques(code);
  };

  const fetchComments = async (thematiqueId: number) => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_URL}/auth/themes/${thematiqueId}/commts/`, { headers: { Authorization: `Bearer ${token}` } });
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedTheme) return;
    try {
      const token = localStorage.getItem('access');
      const res = await axios.post(`${API_URL}/auth/themes/${selectedTheme.id}/commts/`, { text: newComment }, { headers: { Authorization: `Bearer ${token}` } });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTheme = async (theme: Thematique) => {
    if (!selectedEspace || !confirm(`Voulez-vous vraiment supprimer "${theme.name}" ?`)) return;
    try {
      const token = localStorage.getItem('access');
      await axios.delete(`${API_URL}/auth/themes/${theme.id}/delete/`, { headers: { Authorization: `Bearer ${token}` } });
      fetchThematiques(selectedEspace);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTheme = (theme: Thematique) => {
    setThemeToEdit(theme);
    setEditedName(theme.name);
    setEditedRelation(theme.relation_type);
    setEditedPriority(theme.priority);
    setEditDialogOpen(true);
  };

  const saveEditedTheme = async () => {
    if (!themeToEdit) return;
    try {
      const token = localStorage.getItem('access');
      await axios.put(`${API_URL}/auth/themes/${themeToEdit.id}/`, { name: editedName, relation_type: editedRelation, priority: editedPriority, espace: themeToEdit.espace }, { headers: { Authorization: `Bearer ${token}` } });
      setEditDialogOpen(false);
      fetchThematiques(selectedEspace!);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadFile = (file: UploadedFile) => {
    const blob = new Blob([new Uint8Array(file.bytes)]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (thematiqueId: number, filesList: FileList | null, uploadedBy: 'ANFU' | EspaceCode) => {
    if (!filesList) return;
    const formData = new FormData();
    Array.from(filesList).forEach((file) => formData.append('file', file));
    formData.append('uploaded_by', uploadedBy);
    try {
      const token = localStorage.getItem('access');
      await axios.post(`${API_URL}/auth/themes/${thematiqueId}/files/`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      fetchFiles(thematiqueId, uploadedBy);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = async (thematiqueId: number, uploadedBy: 'ANFU' | EspaceCode) => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_URL}/auth/themes/${thematiqueId}/files/?uploaded_by=${uploadedBy}`, { headers: { Authorization: `Bearer ${token}` } });
      const files: UploadedFile[] = res.data.map((f: any) => ({ id: f.id, name: f.file_name, bytes: new Uint8Array(f.bytes), uploaded_by: f.uploaded_by }));
      setUploadedFiles((prev) => ({ ...prev, [uploadedBy]: files }));
    } catch (err) {
      console.error(err);
    }
  };

  const showANFU = selectedTheme?.relation_type === 'ANFU' || selectedTheme?.relation_type === 'BOTH';
  const showEspace = selectedTheme?.relation_type === 'ONE' || selectedTheme?.relation_type === 'BOTH';

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Nom Thématique', flex: 1 },
    { field: 'relation', headerName: 'Actionneur', flex: 1, renderCell: (params: any) => params.row.relation_type === 'ANFU' ? 'ANFU' : params.row.relation_type === 'BOTH' ? `ANFU + ${params.row.espace}` : params.row.espace },
    { field: 'priority', headerName: 'Priorité', width: 120, renderCell: (params: any) => params.row.priority === 3 ? 'Élevée' : params.row.priority === 2 ? 'Moyenne' : 'Faible' },
    { field: 'espace', headerName: 'Espace', width: 120 },
    { field: 'actions', headerName: 'Actions', width: 100, sortable: false, renderCell: (params: any) => userRole !== 'ANFU' ? null : (
      <div className="flex gap-1">
        <IconButton color="primary" size="small" onClick={() => handleEditTheme(params.row)}><EditIcon /></IconButton>
        <IconButton color="error" size="small" onClick={() => handleDeleteTheme(params.row)}><DeleteIcon /></IconButton>
      </div>
    ) },
  ];

  const handleLogout = () => { localStorage.removeItem('access'); localStorage.removeItem('role'); router.push('/'); };

  return (
    <main className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-8 py-4 border-b shadow-sm bg-white">
        <img src="/anfu1.png" alt="ANFU logo" className="h-16 w-auto" />
        <div className="text-center flex-1">
          <h1 className="text-sm md:text-base font-medium text-gray-800">
            République Algérienne Démocratique et Populaire
          </h1>
          <p className="text-sm text-gray-600">
            Ministère de l'Habitat, de l'Urbanisme et de la Ville et de l'Aménagement du territoire
          </p>
          <h2 className="font-bold text-lg text-black">Agence Nationale du Foncier Urbain</h2>
        </div>
        <img src="/min.svg" alt="Ministry logo" className="h-16 w-auto" />
      </header>

      <SmallNavbar role={userRole} username={username} handleLogout={handleLogout} />

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
                <div className="text-sm opacity-90 leading-relaxed">Accéder aux thématiques et échanges inter-institutionnels.</div>
                <div className="absolute bottom-4 right-6 text-xs opacity-80">Cliquer pour ouvrir →</div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- THEMES GRID ---------------- */}
        {selectedEspace && !selectedTheme && (
          <Box>
            <Breadcrumbs aria-label="breadcrumb" className="mb-4">
              <Link color="inherit" onClick={() => setSelectedEspace(null)} style={{ cursor: 'pointer' }}>Espaces</Link>
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
              <TextField select size="small" label="Relation" value={newRelationType} onChange={(e) => setNewRelationType(e.target.value as RelationType)}>
                <MenuItem value="ANFU">ANFU seul</MenuItem>
                <MenuItem value="ONE">Autre institution seule</MenuItem>
                <MenuItem value="BOTH">ANFU + institution</MenuItem>
              </TextField>
              <TextField select size="small" label="Priorité" value={newPriority} onChange={(e) => setNewPriority(Number(e.target.value) as Priority)}>
                <MenuItem value={3}>Élevé</MenuItem>
                <MenuItem value={2}>Moyenne</MenuItem>
                <MenuItem value={1}>Faible</MenuItem>
              </TextField>
              <Button variant="contained" sx={{ backgroundColor: '#1C5844' }} onClick={addTheme}>Ajouter</Button>
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
                onRowClick={(params) => {
                  setSelectedTheme(params.row);
                  fetchComments(params.row.id);
                  fetchFiles(params.row.id, 'ANFU');
                  if (selectedEspace) fetchFiles(params.row.id, selectedEspace);
                }}
                getRowId={(row) => row.id}
              />
            </Box>
          </Box>
        )}

        {/* ---------------- THÉMATIQUE DETAILS ---------------- */}
        {selectedTheme && selectedEspace && (
          <Box className="mt-6">
            {/* breadcrumb + details */}
            <Breadcrumbs aria-label="breadcrumb" className="mb-4">
              <Link color="inherit" onClick={() => setSelectedEspace(null)} style={{ cursor: 'pointer' }}>Espaces</Link>
              <Link color="inherit" onClick={() => setSelectedTheme(null)} style={{ cursor: 'pointer' }}>{selectedEspace}</Link>
              <Typography color="textPrimary">{selectedTheme.name}</Typography>
            </Breadcrumbs>

            <Typography variant="h4" className="text-[#1C5844] font-bold mb-4">{selectedTheme.name} — {selectedEspace}</Typography>

            <div className="grid grid-cols-12 gap-6">
              {showANFU && (
                <div className="col-span-4 border rounded-xl p-6 flex flex-col border-blue-500 bg-gray-50">
                  <h3 className="font-bold text-lg mb-4">ANFU</h3>
                  <input type="file" multiple id="upload-anfu" hidden onChange={(e) => handleUpload(selectedTheme.id, e.target.files, 'ANFU')} />
                  <Button variant="contained" sx={{ backgroundColor: '#1C5844', mb: 2 }} onClick={() => document.getElementById('upload-anfu')?.click()}>Ajouter</Button>
                  <div className="flex-1 overflow-y-auto">
                    {(uploadedFiles['ANFU'] || []).length === 0 ? <p className="text-gray-400 text-sm">Aucun document</p> :
                      uploadedFiles['ANFU'].map((f) => <div key={f.id}>📎 {f.name} <Button size="small" onClick={() => downloadFile(f)}>Télécharger</Button></div>)}
                  </div>
                </div>
              )}

              {showEspace && selectedEspace && (
                <div className="col-span-4 border rounded-xl p-6 flex flex-col border-green-600 bg-gray-50">
                  <h3 className="font-bold text-lg mb-4">{selectedEspace}</h3>
                  <input type="file" multiple id="upload-espace" hidden onChange={(e) => handleUpload(selectedTheme.id, e.target.files, selectedEspace)} />
                  <Button variant="contained" sx={{ backgroundColor: '#1C5844', mb: 2 }} onClick={() => document.getElementById('upload-espace')?.click()}>Ajouter</Button>
                  <div className="flex-1 overflow-y-auto" style={{ maxHeight: 300 }}>
  {(uploadedFiles['ANFU'] || []).length === 0 ? <p className="text-gray-400 text-sm">Aucun document</p> :
    uploadedFiles['ANFU'].map((f) => <div key={f.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
      <span>📎 {f.name}</span>
      <Button size="small" onClick={() => downloadFile(f)}>Télécharger</Button>
    </div>)}
</div>
                </div>
              )}

              {/* COMMENTS */}
              <div className="col-span-4 border-l pl-4 flex flex-col">
                <h3 className="font-bold mb-3 text-lg">💬 Commentaires</h3>
                <div className="flex-1 overflow-y-auto space-y-3" style={{ maxHeight: 300 }}>
  {comments.map((c) => (
    <div key={c.id} className="bg-gray-100 p-3 rounded">
      <strong>{c.username}</strong>
      <p>{c.text}</p>
    </div>
  ))}
</div>
                <div className="flex gap-2 mt-2">
                  <TextField size="small" fullWidth placeholder="Ajouter un commentaire..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                  <Button variant="contained" onClick={addComment}>Envoyer</Button>
                </div>
              </div>
            </div>
          </Box>
        )}

        {/* EDIT DIALOG */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Modifier Thématique</DialogTitle>
          <DialogContent className="flex flex-col gap-3">
            <TextField label="Nom" value={editedName} onChange={(e) => setEditedName(e.target.value)} fullWidth />
            <TextField select label="Relation" value={editedRelation} onChange={(e) => setEditedRelation(e.target.value as RelationType)}>
              <MenuItem value="ANFU">ANFU seul</MenuItem>
              <MenuItem value="ONE">Autre institution seule</MenuItem>
              <MenuItem value="BOTH">ANFU + institution</MenuItem>
            </TextField>
            <TextField select label="Priorité" value={editedPriority} onChange={(e) => setEditedPriority(Number(e.target.value) as Priority)}>
              <MenuItem value={3}>Élevée</MenuItem>
              <MenuItem value={2}>Moyenne</MenuItem>
              <MenuItem value={1}>Faible</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveEditedTheme} variant="contained" sx={{ backgroundColor: '#1C5844' }}>Enregistrer</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </main>
  );
}
