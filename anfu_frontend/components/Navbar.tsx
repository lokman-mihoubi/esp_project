"use client";

import React from "react";
import { Compass, MapPin, Building2, Star, LogOut } from "lucide-react";
import SettingsIcon from "@mui/icons-material/Settings";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import DescriptionIcon from "@mui/icons-material/Description";
import BarChartIcon from "@mui/icons-material/BarChart";

/* ==================== PROPS ==================== */
interface NavbarProps {
  role: string | null;
  username: string | null; // ✅ passed from parent
  selectedType: string;
  setSelectedType: (type: string) => void;
  setViewMode: (
    mode:
      | "list"
      | "details"
      | "rapport"
      | "statistics"
      | "settings"
      | "tasks"
      | "chat"
      | "calendrier"
      | "historique"
  ) => void;
  handleLogout: () => void;
}

/* ==================== COMPONENT ==================== */
const Navbar: React.FC<NavbarProps> = ({
  role,
  username,
  selectedType,
  setSelectedType,
  setViewMode,
  handleLogout,
}) => {
  /* ==================== NAV ITEMS ==================== */
  const navItems = [
    { label: "Promotion immobilière", icon: <Compass size={16} />, type: "promotion" },
    { label: "Investissement", icon: <MapPin size={16} />, type: "investissement" },
    { label: "Logements & équipements", icon: <Building2 size={16} />, type: "logement" },
    { label: "Favoris", icon: <Star size={16} />, type: "favoris" },
    { label: "Cartographie", icon: <DescriptionIcon fontSize="small" />, type: "rapport" },
    { label: "Statistiques", icon: <BarChartIcon fontSize="small" />, type: "statistics" },
    { label: "Calendrier", icon: <BarChartIcon fontSize="small" />, type: "calendrier" },
    { label: "Historique", icon: <BarChartIcon fontSize="small" />, type: "historique" },
          { label: "Paramètres", icon: <SettingsIcon fontSize="small" />, type: "settings" },
    
    ...(role === "admin"
      ? [
          { label: "Gérer les Tâches", icon: <AssignmentTurnedInIcon fontSize="small" />, type: "tasks" },
        ]
      : []),
  ];

  /* ==================== HANDLER ==================== */
  const handleItemClick = (type: string) => {
    setSelectedType(type);

    if (
      ["rapport", "statistics", "settings", "tasks", "chat", "calendrier", "historique"].includes(type)
    ) {
      setViewMode(type as any);
    } else {
      setViewMode("list");
    }
  };

  /* ==================== UI ==================== */
  return (
    <nav className="flex flex-wrap items-center px-8 py-4 bg-white shadow-sm text-sm font-medium text-gray-700 gap-4">
      {/* LEFT MENU */}
      <div className="flex flex-wrap gap-6 items-center">
        {navItems.map((item) => (
          <span
  key={item.type}
  onClick={() => handleItemClick(item.type)}
  title={item.label}
  className={`flex items-center gap-2 cursor-pointer max-w-[260px] truncate whitespace-nowrap ${
    selectedType === item.type ? "font-bold" : "font-medium"
  }`}
  style={{
    color: selectedType === item.type ? "#09572aCC" : undefined,
  }}
  onMouseEnter={(e) => {
    if (selectedType !== item.type) e.currentTarget.style.color = "#074f24"; // darker on hover
  }}
  onMouseLeave={(e) => {
    if (selectedType !== item.type) e.currentTarget.style.color = ""; // reset
  }}
>
  {item.icon}
  {item.label}
</span>




        ))}
      </div>

      {/* RIGHT SIDE : USER + LOGOUT */}
      <div className="ml-auto flex items-center gap-4">
        <div className="px-4 py-2 border rounded-full bg-gray-50 text-gray-700">
          👤 {username || "Utilisateur"}
        </div>

       <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-6 py-2 rounded transition-colors duration-200"
        style={{
          border: "2px solid #09572aCC",
          backgroundColor: "#ffffff",
          color: "#09572aCC",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#074f24"; // dark green
          e.currentTarget.style.color = "#ffffff"; // text white
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff"; // back to white
          e.currentTarget.style.color = "#09572aCC"; // back to original color
        }}
      >
        <LogOut size={16} /> Logout
      </button>
      </div>
    </nav>
  );
};

export default Navbar;
