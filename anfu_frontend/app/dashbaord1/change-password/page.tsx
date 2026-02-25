"use client";

import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";

// ✅ Use your environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
  setError("");
  setSuccess("");

  // ✅ Check required fields
  if (!currentPassword || !newPassword || !confirmPassword) {
    setError("Tous les champs sont obligatoires.");
    return;
  }

  // ✅ Check if new passwords match
  if (newPassword !== confirmPassword) {
    setError("Les mots de passe ne correspondent pas.");
    return;
  }

  try {
    // ✅ Get access token from localStorage
    const token = localStorage.getItem("access");
    if (!token) {
      setError("Vous devez être connecté pour changer votre mot de passe.");
      return;
    }

    // ✅ Send POST request to backend
    const response = await axios.post(
      `${API_URL}/auth/change-password/`,
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // JWT token
        },
      }
    );

    // ✅ Success feedback
    setSuccess(response.data.message || "Mot de passe modifié avec succès.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (err: any) {
    // ✅ Handle errors
    if (err.response?.status === 401) {
      setError("Non autorisé. Veuillez vous reconnecter.");
    } else if (err.response?.data?.error) {
      setError(err.response.data.error);
    } else {
      setError("Erreur lors de la modification du mot de passe.");
    }
  }
};

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Paper
        elevation={0}
        className="w-full max-w-md p-8 shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-2xl"
      >
        <Typography
          variant="h6"
          className="mb-6 font-semibold text-gray-800 text-center"
        >
          Changer le mot de passe
        </Typography>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" className="mb-4">
            {success}
          </Alert>
        )}

        <Box className="flex flex-col gap-4">
          <TextField
            label="Mot de passe actuel"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <TextField
            label="Nouveau mot de passe"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <TextField
            label="Confirmer le nouveau mot de passe"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            onClick={handleSubmit}
            className="mt-4"
            style={{
              backgroundColor: "#09572aCC",
              color: "#ffffff",
              padding: "10px",
              fontWeight: 600,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#074f24")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#09572aCC")
            }
          >
            Enregistrer
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChangePasswordPage;
