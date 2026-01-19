"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
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
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions?: string[];
  region?: string; // ✅ region added
  abrv_str?: string; 
}

export default function Settings() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // new user fields
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("utilisateur");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [newRegion, setNewRegion] = useState("centre"); // default region

  // filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // permissions dialog
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // delete dialog
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  // fake permission list (in real case, fetch from backend if needed)
  const allPermissions = ["view", "write","can_see_historique"];
  const allRegions = ["ouest", "centre", "est", "sud_est", "sud_ouest", "grand_sud"];
  
 const permissionLabels: Record<string, string> = {
  view: "Voir",
  write: "Écrire",
  can_see_historique: "Voir l’historique",
};

const [newAbrvStr, setNewAbrvStr] = useState("");
const allAbrvStr = [
  "DG","DGA","DAF","DFC","DRHM","SRH","SCPT","SMGX","SINF",
  "DP","DP-PROSP","DP-MOB","SPROSP","SSIG","SJUR","SPFON",
  "DGF","DGF-MO","DFUR","DGF-PF","SEREA","SMAR","SCOM","SINV",
  "DRC","DRO","DRE","DRGS","DRSO","DRSE","DPC","SPROSPC",
  "SSIGC","DPMC","SJURC","SPFONC","DMOC","SEREAC","SMARC",
  "SF"
];


  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
      else if (data.results) setUsers(data.results);
      else setUsers([]);
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: number, role: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/${id}/role/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? { ...user, role } : user))
        );
      } else {
        console.error("Erreur mise à jour rôle:", await res.text());
      }
    } catch (error) {
      console.error("Erreur mise à jour rôle:", error);
    }
  };

  const updatePermissions = async (id: number, permissions: string[]) => {
    try {
      const res = await fetch(
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

      if (res.ok) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id ? { ...user, permissions } : user
          )
        );
        setPermissionDialogOpen(false);
      } else {
        console.error("Erreur mise à jour permissions");
      }
    } catch (error) {
      console.error("Erreur API permissions:", error);
    }
  };

 const createUser = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole,
          permissions: newPermissions,
          region: newRegion,
          abrv_str: newAbrvStr || null, // ✅ FIXED
        }),
      }
    );

    if (res.ok) {
      fetchUsers();
      setCreateDialogOpen(false);

      // reset form
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("utilisateur");
      setNewPermissions([]);
      setNewRegion("centre");
      setNewAbrvStr(""); // ✅ reset
    }
  } catch (error) {
    alert("Erreur création utilisateur: " + error);
  }
};


  const deleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/${deleteUserId}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((user) => user.id !== deleteUserId));
        setDeleteDialogOpen(false);
        setDeleteUserId(null);
      } else {
        console.error("Erreur suppression utilisateur");
      }
    } catch (error) {
      console.error("Erreur API suppression:", error);
    }
  };

  const handlePermissionToggle = (perm: string) => {
    setNewPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleEditPermissionToggle = (perm: string) => {
    setEditPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Box sx={{ minHeight: "100vh", p: 4 }}>
      <Card sx={{ boxShadow: 3, borderRadius: 3, mb: 6 }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1976d2" }}>
              Gestion des utilisateurs
            </Typography>
          }
          action={
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(90deg, #1976d2, #42a5f5)",
                color: "#fff",
                borderRadius: "12px",
                px: 3,
                py: 1,
                boxShadow: 2,
                "&:hover": {
                  background: "linear-gradient(90deg, #1565c0, #1e88e5)",
                },
              }}
              onClick={() => setCreateDialogOpen(true)}
            >
              + Ajouter un utilisateur
            </Button>
          }
        />
        <Divider />

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 2, p: 3 }}>
          <TextField
            label="Rechercher"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Tous les rôles</MenuItem>
            <MenuItem value="utilisateur">Utilisateur</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </Box>

        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
              <CircularProgress />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Typography align="center" sx={{ color: "gray" }}>
              Aucun utilisateur trouvé.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 1 }}>
              <Table>
                <TableHead sx={{ backgroundColor: "#1976d2" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nom</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Rôle</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Région</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}> Structure</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Permissions</TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                     
                    

                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        "&:hover": { backgroundColor: "#f0f7ff" },
                        transition: "0.3s",
                      }}
                    >
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onChange={(e) => updateRole(user.id, e.target.value)}
                          size="small"
                          fullWidth
                        >
                          <MenuItem value="utilisateur">Utilisateur</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>{user.region}</TableCell>
                      <TableCell>{user.abrv_str || "-"}</TableCell>
                      <TableCell>
                        {user.permissions && user.permissions.length > 0 ? (
                          <>
                            {user.permissions
                            .map((perm) => permissionLabels[perm] || perm)
                            .join(", ")}
                            <IconButton
                              color="primary"
                              onClick={() => {
                                setSelectedUser(user);
                                setEditPermissions(user.permissions || []);
                                setPermissionDialogOpen(true);
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            Aucune
                            <IconButton
                              color="primary"
                              onClick={() => {
                                setSelectedUser(user);
                                setEditPermissions([]);
                                setPermissionDialogOpen(true);
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setDeleteUserId(user.id);
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

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#1976d2" }}>
          Créer un utilisateur
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Nom d'utilisateur"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
            <Select value={newRole} onChange={(e) => setNewRole(e.target.value)} fullWidth>
              <MenuItem value="utilisateur">Utilisateur</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
            {/* Region field */}
            <Select value={newRegion} onChange={(e) => setNewRegion(e.target.value)} fullWidth>
              {allRegions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1).replace("_", " ")}
                </MenuItem>
              ))}
            </Select>
            <Select
            value={newAbrvStr}
            onChange={(e) => setNewAbrvStr(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="">Aucune structure</MenuItem>
            {allAbrvStr.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </Select>


            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Permissions :
            </Typography>
            <FormGroup>
              {allPermissions.map((perm) => (
                <FormControlLabel
                  key={perm}
                  control={
                    <Checkbox
                      checked={newPermissions.includes(perm)}
                      onChange={() => handlePermissionToggle(perm)}
                    />
                  }
                  label={permissionLabels[perm] || perm}
                />
              ))}
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button
            variant="contained"
            sx={{
              background: "linear-gradient(90deg, #1976d2, #42a5f5)",
              color: "#fff",
              borderRadius: "8px",
              px: 3,
              py: 1,
            }}
            onClick={createUser}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog
        open={permissionDialogOpen}
        onClose={() => setPermissionDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Éditer permissions de {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <FormGroup>
            {allPermissions.map((perm) => (
              <FormControlLabel
                key={perm}
                control={
                  <Checkbox
                    checked={editPermissions.includes(perm)}
                    onChange={() => handleEditPermissionToggle(perm)}
                  />
                }
                label={permissionLabels[perm] || perm}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            sx={{ background: "#1976d2", color: "white" }}
            onClick={() => {
              if (selectedUser) {
                updatePermissions(selectedUser.id, editPermissions);
              }
            }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          Voulez-vous vraiment supprimer cet utilisateur ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={deleteUser}
            color="error"
            variant="contained"
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
