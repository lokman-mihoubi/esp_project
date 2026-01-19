"use client";
import React from "react";
import { Box, Stack } from "@mui/material";

const FoncierGridSkeleton: React.FC = () => {
  const columns = [25, 20, 15, 25, 15];
  const rows = 10;

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      {/* Header */}
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        {columns.map((width, i) => (
          <Box
            key={i}
            sx={{
              height: 35,
              width: `${width}%`,
              borderRadius: 1,
              background: 'linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 10s linear infinite',
            }}
          />
        ))}
      </Stack>

      {/* Body rows */}
      <Stack spacing={1}>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Stack
            key={rowIndex}
            direction="row"
            spacing={1}
            sx={{
              bgcolor: rowIndex % 2 === 0 ? "transparent" : "action.hover",
              p: 0.5,
              borderRadius: 1,
            }}
          >
            {columns.map((width, colIndex) => (
              <Box
                key={colIndex}
                sx={{
                  height: 35,
                  width: `${width + Math.random() * 5}%`,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)',
                  backgroundSize: '400% 100%',
                  animation: 'shimmer 10s linear infinite',
                }}
              />
            ))}
          </Stack>
        ))}
      </Stack>

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -400% 0; }
            100% { background-position: 400% 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default FoncierGridSkeleton;
