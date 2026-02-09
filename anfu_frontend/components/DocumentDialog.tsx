import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  open: boolean;
  onClose: () => void;
  file: string; // URL of the document
  title?: string;
};

export default function DocumentDialog({ open, onClose, file, title }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <iframe
          src={file}
          style={{ width: "100%", height: "80vh", border: "none" }}
          title={title}
        />
      </DialogContent>
    </Dialog>
  );
}
