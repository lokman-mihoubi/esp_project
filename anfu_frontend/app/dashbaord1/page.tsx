'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  Breadcrumbs,
  Link,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import { DataGrid, GridPaginationModel } from '@mui/x-data-grid';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PublicIcon from '@mui/icons-material/Public';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  file_name: string;
  bytes: Uint8Array;
  uploaded_by: 'ANFU' | EspaceCode;
}

export default function DashboardPage() {
  const [selectedEspace, setSelectedEspace] = useState<EspaceCode | null>(null);
  const [thematiques, setThematiques] = useState<Thematique[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Thematique | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: UploadedFile[] }>({});
  const [userRole, setUserRole] = useState<'ANFU' | EspaceCode | ''>('');
  const [username, setUsername] = useState<string>('');

  const [newTheme, setNewTheme] = useState('');
  const [newRelationType, setNewRelationType] = useState<RelationType>('ANFU');
  const [newPriority, setNewPriority] = useState<Priority>(3);
  const [newComment, setNewComment] = useState('');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<Thematique | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedRelation, setEditedRelation] = useState<RelationType>('ANFU');
  const [editedPriority, setEditedPriority] = useState<Priority>(3);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

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

  // ---------------- THEMES ----------------
  const fetchThematiques = async (espace: EspaceCode) => {
    if (!espace) return;
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_URL}/auth/themes/`, {
        params: { espace },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (Array.isArray(res.data)) setThematiques(res.data);
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

      await axios.post(`${API_URL}/auth/themes/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNewTheme('');
      setNewRelationType('ANFU');
      setNewPriority(3);
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

  const addComment = async (themeId: number) => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('access');
      const res = await axios.post(
        `${API_URL}/auth/themes/${themeId}/commts/`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // ---------------- FILES ----------------
  const fetchFiles = async (themeId: number, uploadedBy: 'ANFU' | EspaceCode) => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get(`${API_URL}/auth/themes/${themeId}/files/?uploaded_by=${uploadedBy}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadedFiles((prev) => ({ ...prev, [uploadedBy]: res.data }));
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  const handleUpload = async (themeId: number, filesList: FileList | null, uploadedBy: 'ANFU' | EspaceCode) => {
    if (!filesList) return;
    const formData = new FormData();
    Array.from(filesList).forEach((file) => formData.append('file', file));
    formData.append('uploaded_by', uploadedBy);

    try {
      const token = localStorage.getItem('access');
      await axios.post(`${API_URL}/auth/themes/${themeId}/files/`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      fetchFiles(themeId, uploadedBy);
    } catch (err) {
      console.error('Error uploading files:', err);
    }
  };

  const downloadFile = (file: UploadedFile) => {
    const blob = new Blob([new Uint8Array(file.bytes || [])]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------- NAV ----------------
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('role');
    router.push('/');
  };

  // ---------------- DATAGRID ----------------
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
        switch (params.row.priority) {
          case 3: return 'Élevée';
          case 2: return 'Moyenne';
          case 1: return 'Faible';
          default: return '';
        }
      },
    },
    { field: 'espace', headerName: 'Espace', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: any) => {
        if (userRole !== 'ANFU') return null;
        return (
          <div className="flex gap-1">
            <IconButton color="primary" size="small" onClick={() => {
              setSelectedTheme(params.row);
              setEditedName(params.row.name);
              setEditedRelation(params.row.relation_type);
              setEditedPriority(params.row.priority);
            }}>
              <EditIcon />
            </IconButton>
            <IconButton color="error" size="small" onClick={async () => {
              if (!confirm(`Supprimer "${params.row.name}" ?`)) return;
              const token = localStorage.getItem('access');
              await axios.delete(`${API_URL}/auth/themes/${params.row.id}/delete/`, { headers: { Authorization: `Bearer ${token}` } });
              fetchThematiques(selectedEspace!);
            }}>
              <DeleteIcon />
            </IconButton>
          </div>
        );
      },
    },
  ];

  // ---------------- DETAIL SECTION ----------------
  const openThemeDetails = async (theme: Thematique) => {
    setSelectedTheme(theme);
    fetchComments(theme.id);
    fetchFiles(theme.id, 'ANFU');
    if (selectedEspace) fetchFiles(theme.id, selectedEspace);
  };

  return (
    <main className="min-h-screen bg-white">
      <SmallNavbar role={userRole} username={username} handleLogout={handleLogout} />
      <Box px={6} py={4}>
        {!selectedEspace ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {visibleSpaces.map(space => (
              <div key={space.code} onClick={() => handleCardClick(space.code as EspaceCode)} className={`cursor-pointer p-6 text-white rounded-2xl shadow-lg bg-gradient-to-br ${space.color}`}>
                <div className="flex items-center gap-4 mb-4">{space.icon}<h2>{space.code}</h2></div>
                Accéder aux thématiques et échanges.
              </div>
            ))}
          </div>
        ) : (
          <Box>
            {/* Breadcrumb */}
            <Breadcrumbs className="mb-4">
              <Link color="inherit" onClick={() => setSelectedEspace(null)} sx={{ cursor: 'pointer' }}>Espaces</Link>
              <Typography color="textPrimary">{selectedEspace}</Typography>
            </Breadcrumbs>

            {/* Add theme */}
            <Box className="mb-4 flex gap-2 items-end">
              <TextField size="small" fullWidth placeholder="Nom de la thématique" value={newTheme} onChange={(e) => setNewTheme(e.target.value)} />
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

            {/* DataGrid */}
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
                onRowClick={(params) => openThemeDetails(params.row)}
                getRowId={(row) => row.id}
              />
            </Box>

            {/* Theme Detail Section */}
            {selectedTheme && (
              <Box mt={6} className="grid grid-cols-12 gap-6">
                {/* Breadcrumb */}
                <Breadcrumbs className="mb-4 col-span-12">
                  <Link color="inherit" onClick={() => setSelectedTheme(null)} sx={{ cursor: 'pointer' }}>Thématiques</Link>
                  <Typography color="textPrimary">{selectedTheme.name}</Typography>
                </Breadcrumbs>

                {/* ANFU Files */}
                {selectedTheme.relation_type !== 'ONE' && (
                  <Box className="col-span-4 border rounded-xl p-4">
                    <Typography fontWeight="bold">ANFU</Typography>
                    {(uploadedFiles['ANFU'] || []).map(f => (
                      <div key={f.id}>📎 {f.file_name} <Button size="small" onClick={() => downloadFile(f)}>Télécharger</Button></div>
                    ))}
                  </Box>
                )}

                {/* Espace Files */}
                {selectedEspace && selectedTheme.relation_type !== 'ANFU' && (
                  <Box className="col-span-4 border rounded-xl p-4">
                    <Typography fontWeight="bold">{selectedEspace}</Typography>
                    {(uploadedFiles[selectedEspace] || []).map(f => (
                      <div key={f.id}>📎 {f.file_name} <Button size="small" onClick={() => downloadFile(f)}>Télécharger</Button></div>
                    ))}
                  </Box>
                )}

                {/* Comments */}
                <Box className="col-span-4 border-l pl-4 flex flex-col">
                  <Typography fontWeight="bold" mb={2}>💬 Commentaires</Typography>
                  <Box flex={1} overflow="auto" mb={2}>
                    {comments.map(c => (
                      <Box key={c.id} className="bg-gray-100 p-2 mb-2 rounded">
                        <strong>{c.username}</strong>
                        <p>{c.text}</p>
                      </Box>
                    ))}
                  </Box>
                  <Box className="flex gap-2">
                    <TextField fullWidth size="small" placeholder="Ajouter un commentaire..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                    <Button variant="contained" onClick={() => addComment(selectedTheme.id)}>Envoyer</Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </main>
  );
}
