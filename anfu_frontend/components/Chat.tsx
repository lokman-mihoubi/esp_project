"use client";

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";

interface User {
  id: number;
  username: string;
}

interface Message {
  sender: { id: number; username: string };
  text: string;
}

export default function Chat() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem("access");

  // Fetch current user & users list
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:8000/auth/me/", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Unauthorized")))
      .then((data) => setCurrentUserId(data.id))
      .catch((err) => console.error("Error fetching current user:", err));

    fetch("http://localhost:8000/auth/chat/users/", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject("Unauthorized")))
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else if (Array.isArray(data.users)) setUsers(data.users);
        else setUsers([]);
      })
      .catch((err) => console.error("Error fetching users:", err));

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [token]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Open chat with a user
  const openChat = (user: User) => {
    setSelectedUser(user);
    setMessages([]);

    if (!token) return;

    // Fetch previous messages
    fetch(`http://localhost:8000/auth/chat/messages/${user.id}/`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error("Error fetching messages:", err));

    // Close previous socket
    if (socketRef.current) socketRef.current.close();

    // Open new WebSocket with JWT token
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${user.id}/?token=${token}`);
    ws.onopen = () => console.log("WebSocket connected");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("WebSocket closed");

    socketRef.current = ws;
  };

  // Send message
  const handleSend = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    if (newMessage.trim()) {
      socketRef.current.send(JSON.stringify({ message: newMessage }));
      setNewMessage("");
    }
  };

  // Go back to user list
  const handleBackToList = () => {
    setSelectedUser(null);
    setMessages([]);
    if (socketRef.current) socketRef.current.close();
  };

  return (
    <>
      {/* Chat Icon */}
      {!open && (
        <IconButton
          onClick={() => setOpen(true)}
          sx={{ position: "fixed", bottom: 20, right: 20, bgcolor: "primary.main", color: "white" }}
        >
          <ChatIcon />
        </IconButton>
      )}

      {/* Chat Window */}
      {open && (
        <Paper
          elevation={4}
          sx={{ position: "fixed", bottom: 20, right: 20, width: 350, height: 500, display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <Box sx={{ bgcolor: "primary.main", color: "white", p: 1, display: "flex", justifyContent: "space-between" }}>
            <Typography variant="subtitle1">
              {selectedUser ? `Chat with ${selectedUser.username}` : "Select a User"}
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "white" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* User List */}
          {!selectedUser ? (
            <List sx={{ flex: 1, overflowY: "auto" }}>
              {users.map((user) => (
                <ListItem key={user.id} component="button" onClick={() => openChat(user)}>
                  <ListItemText primary={user.username} />
                </ListItem>
              ))}
            </List>
          ) : (
            <>
              {/* Back to Users Button */}
              <Box p={1}>
                <Button variant="outlined" fullWidth onClick={handleBackToList}>
                  ← Back to Users
                </Button>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
                {messages.map((msg, i) => (
                  <Typography
                    key={i}
                    align={msg.sender.id === currentUserId ? "right" : "left"}
                    sx={{
                      bgcolor: msg.sender.id === currentUserId ? "primary.light" : "grey.200",
                      p: 1,
                      borderRadius: 2,
                      my: 0.5,
                    }}
                  >
                    <b>{msg.sender.username}:</b> {msg.text}
                  </Typography>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Send Message */}
              <Stack direction="row" spacing={1} p={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button variant="contained" onClick={handleSend}>
                  Send
                </Button>
              </Stack>
            </>
          )}
        </Paper>
      )}
    </>
  );
}
