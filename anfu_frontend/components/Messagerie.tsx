"use client";

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import MovieIcon from "@mui/icons-material/Movie";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ArchiveIcon from "@mui/icons-material/Archive";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";

interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
}

interface Message {
  id: number;
  sender: User;
  receiver: User;
  content: string;
  timestamp: string;
  file?: string;
  filename?: string;
}

interface UnreadCount {
  sender__id: number;
  sender__username: string;
  count: number;
}

export default function Messagerie() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [groupDialog, setGroupDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<{ by_user: UnreadCount[]; total: number }>({
    by_user: [],
    total: 0,
  });

  // new states for upload feedback
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const token = typeof window !== "undefined" ? localStorage.getItem("access") : null;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }
    setSelectedFilePreview(null);
  };

  // normalize file URL from backend: if relative, prefix API_URL
  const normalizeFileUrl = (file?: string) => {
    if (!file) return file;
    if (file.startsWith("http://") || file.startsWith("https://")) return file;
    // if backend returns a path like /media/..., prefix API_URL (no trailing slash issues)
    const base = API_URL?.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
    return `${base}${file.startsWith("/") ? "" : "/"}${file}`;
  };

  // helper: choose icon component based on filename extension
  const getFileIcon = (filename?: string, size: "small" | "medium" = "small") => {
    if (!filename) return <InsertDriveFileIcon fontSize={size} />;
    const name = filename.toLowerCase();
    if (name.endsWith(".pdf")) return <PictureAsPdfIcon fontSize={size} htmlColor="#d32f2f" />;
    if (name.match(/\.(jpe?g|png|gif|webp|bmp)$/)) return <ImageIcon fontSize={size} htmlColor="#1976d2" />;
    if (name.match(/\.(docx?|odt)$/)) return <DescriptionIcon fontSize={size} htmlColor="#2b579a" />;
    if (name.match(/\.(xlsx?|csv|ods)$/)) return <DescriptionIcon fontSize={size} htmlColor="#217346" />;
    if (name.match(/\.(pptx?|odp)$/)) return <DescriptionIcon fontSize={size} htmlColor="#d35400" />;
    if (name.match(/\.(zip|rar|7z|tar|gz)$/)) return <ArchiveIcon fontSize={size} />;
    if (name.match(/\.(mp4|mov|avi|mkv|wmv)$/)) return <MovieIcon fontSize={size} />;
    if (name.match(/\.(mp3|wav|ogg|m4a)$/)) return <AudioFileIcon fontSize={size} />;
    return <InsertDriveFileIcon fontSize={size} />;
  };

  // ✅ Fetch Current User
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/user/V1/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setCurrentUser)
      .catch((err) => console.error("Erreur utilisateur :", err));
  }, [token, API_URL]);

  // ✅ Fetch Chat Users
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/chat/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUsers(Array.isArray(data) ? data : data.users || []))
      .catch((err) => console.error("Erreur récupération utilisateurs :", err));
  }, [token, API_URL]);

  // ✅ Fetch Unread Counts
  const fetchUnreadCounts = () => {
    if (!token) return;
    fetch(`${API_URL}/auth/messages/unread/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUnreadCounts)
      .catch((err) => console.error("Erreur récupération messages non lus :", err));
  };

  useEffect(() => {
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [token, API_URL]);

  // helper to normalize messages returned from backend (fix file path if needed)
  const normalizeMessages = (msgs: any[]): Message[] =>
    msgs.map((m) => ({
      ...m,
      file: m.file ? normalizeFileUrl(m.file) : m.file,
    }));

  // ✅ Fetch Messages On User Select
  useEffect(() => {
    if (!selectedUser || !token) return;
    setLoading(true);

    fetch(`${API_URL}/auth/messages1/${selectedUser.id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? normalizeMessages(data) : normalizeMessages(data.results || []));
        setLoading(false);
        fetchUnreadCounts();
      })
      .catch((err) => {
        console.error("Erreur récupération messages :", err);
        setLoading(false);
      });
  }, [selectedUser, token, API_URL]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = (id: number) => {
    fetch(`${API_URL}/auth/messages1/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? normalizeMessages(data) : normalizeMessages(data.results || [])))
      .catch((err) => console.error("Erreur rechargement messages :", err));
  };

  // ✅ Send message + file with optimistic UI and feedback
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedUser || !token) return;

    const text = messageContent.trim();
    if (!text && !selectedFile) return;

    // create a temporary optimistic message
    const tempId = Date.now();
    const tempMessage: Message = {
      id: tempId,
      content: text,
      sender: currentUser!,
      receiver: selectedUser,
      timestamp: new Date().toISOString(),
      filename: selectedFile?.name,
      file: selectedFilePreview || undefined, // local preview
    };

    // insert optimistic message
    setMessages((prev) => [...prev, tempMessage]);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const form = new FormData();
    form.append("content", text);
    if (selectedFile) form.append("file", selectedFile);

    try {
      const res = await fetch(`${API_URL}/auth/messages1/${selectedUser.id}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        // remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const txt = await res.text().catch(() => "Erreur serveur");
        setUploadError(`Upload failed: ${res.status} ${txt}`);
        setTimeout(() => setUploadError(null), 5000);
        return;
      }

      // try to get server message JSON (if API returns it)
      let serverMsg: any = null;
      try {
        serverMsg = await res.json();
      } catch {
        serverMsg = null;
      }

      // reset inputs
      setMessageContent("");
      removeSelectedFile();

      // If API returned created message, replace optimistic one
      if (serverMsg && serverMsg.id) {
        // ensure file URL is normalized
        if (serverMsg.file) serverMsg.file = normalizeFileUrl(serverMsg.file);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? serverMsg : m)));
      } else {
        // if no message returned, refresh the conversation to get definitive data
        setTimeout(() => fetchMessages(selectedUser.id), 700);
      }

      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
      fetchUnreadCounts();
    } catch (err: any) {
      console.error("Erreur envoi message :", err);
      // remove optimistic message on network error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setUploadError("Network error while sending message");
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  // -------------------------
  // Group send (keeps as text-only for now)
  // -------------------------
  const handleSendGroupMessage = async () => {
    if (!token || selectedUsers.length === 0 || !groupMessage.trim()) return;

    try {
      await Promise.all(
        selectedUsers.map((user) =>
          fetch(`${API_URL}/auth/messages1/${user.id}/`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: groupMessage.trim() }),
          })
        )
      );
      setGroupDialog(false);
      setGroupMessage("");
      fetchUnreadCounts();
    } catch (err) {
      console.error("Erreur envoi groupé :", err);
    }
  };

  const toggleUserSelection = (user: User) => {
    const exists = selectedUsers.some((u) => u.id === user.id);
    const updated = exists ? selectedUsers.filter((u) => u.id !== user.id) : [...selectedUsers, user];
    setSelectedUsers(updated);
    setSelectedUser(updated.length === 1 ? updated[0] : null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
      // create a preview only for images; other types will still show filename
      try {
        setSelectedFilePreview(URL.createObjectURL(file));
      } catch {
        setSelectedFilePreview(null);
      }
    }
    // reset input value to allow reselecting same file later
    if (e.target) (e.target as HTMLInputElement).value = "";
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            bgcolor: "#09572aCC",
            color: "white",
            zIndex: 2000,
            "&:hover": { bgcolor: "#09572aCC" },
          }}
          aria-label="Open chat"
        >
          <ChatIcon />
          {unreadCounts.total > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -6,
                right: -6,
                bgcolor: "error.main",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "0.70rem",
              }}
            >
              {unreadCounts.total}
            </Box>
          )}
        </IconButton>
      )}

      {/* Chat Window */}
      {open && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 420,
            height: 580,
            display: "flex",
            flexDirection: "column",
            zIndex: 2000,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: "primary.main",
              color: "white",
              p: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle1">
              {selectedUser ? `Chat avec ${selectedUser.username}` : `Messagerie (${unreadCounts.total} non lus)`}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {selectedUsers.length > 1 && (
                <Button size="small" variant="contained" color="secondary" onClick={() => setGroupDialog(true)}>
                  Envoyer à tous
                </Button>
              )}
              <IconButton size="small" sx={{ color: "white" }} onClick={() => setOpen(false)} aria-label="Close chat">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* Content */}
          {!selectedUser ? (
            <List sx={{ flex: 1, overflowY: "auto" }}>
              {users.map((user) => {
                const selected = selectedUsers.some((u) => u.id === user.id);
                const unread = unreadCounts.by_user.find((u) => u.sender__id === user.id)?.count || 0;
                return (
                  <ListItem key={user.id} disablePadding>
                    <ListItemButton
                      onClick={() => toggleUserSelection(user)}
                      sx={{
                        bgcolor: selected ? "primary.light" : "transparent",
                        borderRadius: 1,
                        my: 0.5,
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={user.avatar} alt={user.username}>
                          {user.username?.[0]?.toUpperCase() || "U"}
                        </Avatar>
                        <ListItemText primary={user.username} secondary={user.email || ""} />
                      </Stack>
                      {unread > 0 && (
                        <Box
                          sx={{
                            bgcolor: "error.main",
                            color: "white",
                            borderRadius: "50%",
                            width: 22,
                            height: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                          }}
                        >
                          {unread}
                        </Box>
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <>
              <Box p={1}>
                <Button fullWidth variant="outlined" onClick={() => { setSelectedUser(null); setMessages([]); }}>
                  ← Retour
                </Button>
              </Box>

              {/* Messages list */}
              <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
                {loading ? (
                  <Typography align="center" color="text.secondary">Chargement des messages...</Typography>
                ) : messages.length === 0 ? (
                  <Typography align="center" color="text.secondary" mt={3}>Aucun message pour le moment 📨</Typography>
                ) : (
                  messages.map((msg) => {
                    const isMine = currentUser && msg.sender.id === currentUser.id;
                    return (
                      <Stack
                        key={msg.id}
                        direction="row"
                        justifyContent={isMine ? "flex-end" : "flex-start"}
                        spacing={1}
                        sx={{ my: 0.5 }}
                      >
                        {!isMine && <Avatar src={msg.sender.avatar}>{msg.sender.username?.[0]?.toUpperCase()}</Avatar>}

                        <Box
                          sx={{
                            bgcolor: isMine ? "primary.light" : "grey.100",
                            p: 1,
                            borderRadius: 2,
                            maxWidth: "75%",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.content && <Typography variant="body2">{msg.content}</Typography>}

                          {/* file rendering with icons by extension */}
                          {msg.file && (
                            <Box mt={1}>
                              {/\.(jpe?g|png|gif|webp|bmp)$/i.test(msg.file) ? (
                                <img
                                  src={msg.file}
                                  alt={msg.filename || "attachment"}
                                  style={{ maxWidth: 220, maxHeight: 220, borderRadius: 8, cursor: "pointer" }}
                                  onClick={() => window.open(msg.file, "_blank")}
                                />
                              ) : (
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{ cursor: "pointer" }}
                                  onClick={() => window.open(msg.file, "_blank")}
                                >
                                  {getFileIcon(msg.filename, "medium")}
                                  <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                                      {msg.filename || "Télécharger la pièce jointe"}
                                    </Typography>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <DownloadIcon fontSize="small" />
                                      <Typography variant="caption" color="text.secondary">
                                        Télécharger
                                      </Typography>
                                    </Stack>
                                  </Box>
                                </Stack>
                              )}
                            </Box>
                          )}

                          <Typography variant="caption" color="text.secondary" display="block" mt={0.5} align="right">
                            {new Date(msg.timestamp).toLocaleString()}
                          </Typography>
                        </Box>

                        {isMine && <Avatar src={msg.sender.avatar}>{msg.sender.username?.[0]?.toUpperCase()}</Avatar>}
                      </Stack>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* upload success / error message */}
              {uploadSuccess && (
                <Typography sx={{ color: "green", textAlign: "center", p: 0.5 }}>✅ Pièce jointe envoyée avec succès</Typography>
              )}
              {uploadError && (
                <Typography sx={{ color: "error.main", textAlign: "center", p: 0.5 }}>{uploadError}</Typography>
              )}

              {/* Composer */}
              <Stack direction="column" spacing={1} p={1}>
                {/* selected file preview */}
                {selectedFile && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      border: "1px dashed",
                      borderColor: "divider",
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {selectedFilePreview ? (
                        <img src={selectedFilePreview} alt={selectedFile.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                      ) : (
                        <Box sx={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.200", borderRadius: 1 }}>
                          {getFileIcon(selectedFile.name, "medium")}
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{selectedFile.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{Math.round(selectedFile.size / 1024)} KB</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ marginLeft: "auto" }}>
                      <IconButton size="small" onClick={removeSelectedFile} aria-label="Remove attachment">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}

                <Stack direction="row" spacing={1}>
                  <label htmlFor="fileInput" style={{ display: "flex", alignItems: "center" }}>
                    <input
                      id="fileInput"
                      type="file"
                      accept="*/*"
                      hidden
                      onChange={handleFileChange}
                    />
                    <IconButton component="span" size="small" sx={{ alignSelf: "center" }} aria-label="Attach file">
                      <AttachFileIcon />
                    </IconButton>
                  </label>

                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Écrire un message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        handleSendMessage(e);
                      }
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    aria-label="Send message"
                    endIcon={<SendIcon />}
                  >
                    Envoyer
                  </Button>
                </Stack>
              </Stack>
            </>
          )}

          {/* Group send dialog */}
          <Dialog open={groupDialog} onClose={() => setGroupDialog(false)}>
            <DialogTitle>Envoyer un message à {selectedUsers.length} utilisateurs</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                multiline
                minRows={3}
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                placeholder="Écrivez votre message..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGroupDialog(false)}>Annuler</Button>
              <Button variant="contained" onClick={handleSendGroupMessage}>Envoyer</Button>
            </DialogActions>
          </Dialog>
        </Paper>
      )}
    </>
  );
}
