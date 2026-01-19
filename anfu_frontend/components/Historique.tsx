"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";
import axios from "axios";

interface HistoriqueItem {
  id: number;
  action: string;
  date: string;
  user: string;
}

const HistoriqueTable: React.FC = () => {
  const [rows, setRows] = useState<HistoriqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchHistorique = async () => {
      try {
        const token = localStorage.getItem("access");
        const username = localStorage.getItem("username");
        const canSeeAll = localStorage.getItem("can_see_historique") === "true";

        if (!token) {
          setError("No access token found.");
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/historique/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Fetched Historique:", res.data);

        const data = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];

        // 🔥 Apply frontend filtering if needed
        const filteredData = canSeeAll
          ? data
          : data.filter((item) => item.user === username);

        setRows(filteredData);
      } catch (err) {
        console.error("Erreur lors du chargement de l’historique :", err);
        setError("Erreur lors du chargement de l’historique");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorique();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
                <TableCell><strong>Utilisateur</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.user}</TableCell>
                    <TableCell>
                      {new Date(row.date).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Aucun historique disponible
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          labelRowsPerPage="Lignes par page"
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default HistoriqueTable;
