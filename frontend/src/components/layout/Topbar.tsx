import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { LogOut, Upload, Building2 } from "lucide-react";
import { useState } from "react";
import UploadModal from "../sop/UploadModal";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/repository": "SOP Repository",
  "/chat": "AI SOP Assistant",
  "/summary": "SOP Summarizer",
  "/decision": "Decision Support",
  "/analytics": "Analytics Dashboard",
  "/users": "User Management",
};

export default function Topbar() {
  const { pathname } = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 gap-4 flex-shrink-0">
        <h1 className="font-bold text-gray-800 text-base">{titles[pathname] || "MedSOP AI"}</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500">
            <Building2 className="w-3.5 h-3.5" />
            City General Hospital
          </div>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Upload SOP
            </button>
          )}
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </>
  );
}
