"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";

/* ================= TYPES ================= */

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
  region?: string;
  abrv_str?: string;
}

/* ================= CONSTANTS ================= */

const allPermissions = ["view", "write", "can_see_historique"];

const permissionLabels: Record<string, string> = {
  view: "Voir",
  write: "Écrire",
  can_see_historique: "Voir l’historique",
};

const allRegions = [
  "ouest",
  "centre",
  "est",
  "sud_est",
  "sud_ouest",
  "grand_sud",
];

const allAbrvStr = [
  "DG","DGA","DAF","DFC","DRHM","SRH","SCPT","SMGX","SINF",
  "DP","DP-PROSP","DP-MOB","SPROSP","SSIG","SJUR","SPFON",
  "DGF","DGF-MO","DFUR","DGF-PF","SEREA","SMAR","SCOM","SINV",
  "DRC","DRO","DRE","DRGS","DRSO","DRSE",
];

/* ================= COMPONENT ================= */

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // create user
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("utilisateur");
  const [newRegion, setNewRegion] = useState("centre");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [newAbrvStr, setNewAbrvStr] = useState("");

  // edit permissions
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // delete
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  /* ================= API ================= */

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: number, role: string) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${id}/role/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      }
    );
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
  };

  const updatePermissions = async (id: number, permissions: string[]) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${id}/permissions/`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions }),
      }
    );
    setPermissionDialogOpen(false);
    fetchUsers();
  };

  const createUser = async () => {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole,
          region: newRegion,
          permissions: newPermissions,
          abrv_str: newAbrvStr || null,
        }),
      }
    );

    setCreateDialogOpen(false);
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
    setNewPermissions([]);
    setNewAbrvStr("");
    fetchUsers();
  };

  const deleteUser = async () => {
    if (!deleteUserId) return;

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/users/${deleteUserId}/delete/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      }
    );

    setDeleteDialogOpen(false);
    setDeleteUserId(null);
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === "all" || u.role === roleFilter)
  );

  /* ================= UI ================= */

  return (
    <Box sx={{ p: 4 }}>
      <Card>
        <CardHeader
          title="Gestion des utilisateurs"
          action={
            <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
              + Ajouter
            </Button>
          }
        />
        <Divider />

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 2, p: 2 }}>
          <TextField
            label="Rechercher"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="utilisateur">Utilisateur</MenuItem>
            <MenuItem value="ministere">Ministère</MenuItem>
            <MenuItem value="anfu">ANFU</MenuItem>
            <MenuItem value="dgl">DGL</MenuItem>
            <MenuItem value="dgua">DGUA</MenuItem>
            <MenuItem value="dgaat">DGAAT</MenuItem>
            <MenuItem value="dgcmr">DGCMR</MenuItem>
            <MenuItem value="dgv">DGV</MenuItem>
          </Select>
        </Box>

        <CardContent>
          {loading ? (
            <CircularProgress />
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Région</TableCell>
                    <TableCell>Structure</TableCell>
                    <TableCell>Permissions</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>

                      <TableCell>
                        <Select
                          value={u.role}
                          onChange={(e) =>
                            updateRole(u.id, e.target.value)
                          }
                          size="small"
                        >
                          <MenuItem value="admin">Admin</MenuItem>
                          <MenuItem value="utilisateur">Utilisateur</MenuItem>
                          <MenuItem value="ministere">Ministère</MenuItem>
                          <MenuItem value="anfu">ANFU</MenuItem>
                          <MenuItem value="dgl">DGL</MenuItem>
                          <MenuItem value="dgua">DGUA</MenuItem>
                          <MenuItem value="dgaat">DGAAT</MenuItem>
                          <MenuItem value="dgcmr">DGCMR</MenuItem>
                          <MenuItem value="dgv">DGV</MenuItem>
                        </Select>
                      </TableCell>

                      <TableCell>{u.region}</TableCell>
                      <TableCell>{u.abrv_str || "-"}</TableCell>

                      <TableCell>
                        {(u.permissions || [])
                          .map((p) => permissionLabels[p])
                          .join(", ")}
                        <IconButton
                          onClick={() => {
                            setSelectedUser(u);
                            setEditPermissions(u.permissions || []);
                            setPermissionDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </TableCell>

                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setDeleteUserId(u.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ===== CREATE USER ===== */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Créer utilisateur</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Username" onChange={(e)=>setNewUsername(e.target.value)} />
          <TextField label="Email" onChange={(e)=>setNewEmail(e.target.value)} />
          <TextField label="Mot de passe" type="password" onChange={(e)=>setNewPassword(e.target.value)} />

          <Select value={newRole} onChange={(e)=>setNewRole(e.target.value)}>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="utilisateur">Utilisateur</MenuItem>
            <MenuItem value="ministere">Ministère</MenuItem>
            <MenuItem value="anfu">ANFU</MenuItem>
            <MenuItem value="dgl">DGL</MenuItem>
            <MenuItem value="dgua">DGUA</MenuItem>
            <MenuItem value="dgaat">DGAAT</MenuItem>
            <MenuItem value="dgcmr">DGCMR</MenuItem>
            <MenuItem value="dgv">DGV</MenuItem>
          </Select>

          <Select value={newRegion} onChange={(e)=>setNewRegion(e.target.value)}>
            {allRegions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>

          <Select value={newAbrvStr} onChange={(e)=>setNewAbrvStr(e.target.value)} displayEmpty>
            <MenuItem value="">Aucune structure</MenuItem>
            {allAbrvStr.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>

          <FormGroup>
            {allPermissions.map(p => (
              <FormControlLabel
                key={p}
                control={
                  <Checkbox
                    checked={newPermissions.includes(p)}
                    onChange={() =>
                      setNewPermissions(prev =>
                        prev.includes(p)
                          ? prev.filter(x => x !== p)
                          : [...prev, p]
                      )
                    }
                  />
                }
                label={permissionLabels[p]}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button onClick={createUser} variant="contained">Créer</Button>
        </DialogActions>
      </Dialog>

      {/* ===== PERMISSIONS ===== */}
      <Dialog open={permissionDialogOpen} onClose={()=>setPermissionDialogOpen(false)}>
        <DialogTitle>Permissions</DialogTitle>
        <DialogContent>
          <FormGroup>
            {allPermissions.map(p => (
              <FormControlLabel
                key={p}
                control={
                  <Checkbox
                    checked={editPermissions.includes(p)}
                    onChange={() =>
                      setEditPermissions(prev =>
                        prev.includes(p)
                          ? prev.filter(x => x !== p)
                          : [...prev, p]
                      )
                    }
                  />
                }
                label={permissionLabels[p]}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setPermissionDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={() =>
              selectedUser &&
              updatePermissions(selectedUser.id, editPermissions)
            }
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== DELETE ===== */}
      <Dialog open={deleteDialogOpen} onClose={()=>setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>Supprimer cet utilisateur ?</DialogContent>
        <DialogActions>
          <Button onClick={()=>setDeleteDialogOpen(false)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={deleteUser}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
