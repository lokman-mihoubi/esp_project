"use client";

import * as React from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

export default function CircularProgressWithLabel({
  value,
  status,
}: {
  value?: number;
  status?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {status === "EN_COURS" ? (
        <Typography variant="body2" fontWeight={600}>
          En cours
        </Typography>
      ) : (
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            variant="determinate"
            value={value ?? 0}
            size={40}
            thickness={5}
            sx={{
              color:
                (value ?? 0) >= 70
                  ? "success.main"
                  : (value ?? 0) >= 40
                  ? "warning.main"
                  : "error.main",
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="caption"
              component="div"
              color="text.secondary"
              fontWeight={600}
            >
              {value ?? 0}%
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
