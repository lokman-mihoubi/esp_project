"use client";

import React from "react";
import { LogOut, KeyRound } from "lucide-react";
import { Menu, MenuItem, Divider } from "@mui/material";
import { useRouter } from "next/navigation";

/* ==================== PROPS ==================== */
interface SmallNavbarProps {
  role: string | null; // kept for compatibility (not displayed)
  username: string | null;
  handleLogout: () => void;
}

/* ==================== COMPONENT ==================== */
const SmallNavbar: React.FC<SmallNavbarProps> = ({
  username,
  handleLogout,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLSpanElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);
  const router = useRouter();
  return (
    <nav className="flex items-center justify-end px-8 py-3 bg-white shadow-md text-sm font-medium text-gray-700">
      {/* USER TEXT (same style as previous navbar items) */}
      <span
        onClick={handleOpen}
        className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
        style={{ color: "#09572aCC" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#074f24")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#09572aCC")}
      >
        👤 {username || "Utilisateur"}
      </span>

      {/* DROPDOWN */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            minWidth: 220,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* USER INFO */}
        <MenuItem disabled sx={{ opacity: 1 }}>
          <div className="flex flex-col">
            <span className="font-semibold">
              {username || "Utilisateur"}
            </span>
            <span className="text-xs text-gray-500">Compte utilisateur</span>
          </div>
        </MenuItem>

        <Divider />

        {/* CHANGE PASSWORD */}
        <MenuItem onClick={() => router.push("/dashboard1/change-password")}>
          Changer le mot de passe
        </MenuItem>

        <Divider />

        {/* LOGOUT */}
        <MenuItem
          onClick={() => {
            handleClose();
            handleLogout();
          }}
          className="flex gap-2 text-red-600"
        >
          <LogOut size={16} />
          Déconnexion
        </MenuItem>
      </Menu>
    </nav>
  );
};

export default SmallNavbar;
