import { Button } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useState } from "react";
import DocumentDialog from "./DocumentDialog";

type Props = {
  documentId: number; // Backend Foncier ID
  fileType?: "duac" | "dccf" | "domaine"; // Which file to preview
  label?: string; // Optional button label
};

export default function DocumentViewButton({ documentId, fileType = "duac", label }: Props) {
  const [open, setOpen] = useState(false);

  // Backend file URL, type is part of path
  const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/documents/${documentId}/download/${fileType}/`;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<VisibilityIcon />}
        onClick={() => setOpen(true)}
      >
        {label || `Voir ${fileType.toUpperCase()}`}
      </Button>

      <DocumentDialog
        open={open}
        onClose={() => setOpen(false)}
        file={fileUrl}
        title={label || `Prévisualisation ${fileType.toUpperCase()}`}
      />
    </>
  );
}
