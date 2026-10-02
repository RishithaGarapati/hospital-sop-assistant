import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  LayoutDashboard, Files, MessageSquare, FileText,
  Brain, BarChart2, Users, HeartPulse
} from "lucide-react";

const navItems = [
  { label: "Dashboard",        to: "/",           icon: LayoutDashboard },
  { label: "SOP Repository",   to: "/repository", icon: Files,    badge: "" },
  { label: "AI Assistant",     to: "/chat",       icon: MessageSquare },
  { label: "SOP Summarizer",   to: "/summary",    icon: FileText },
  { label: "Decision Support", to: "/decision",   icon: Brain },
  { label: "Analytics",        to: "/analytics",  icon: BarChart2, adminOnly: true },
  { label: "Users",            to: "/users",      icon: Users,     adminOnly: true },
];

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const initials = user?.name.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??";

  return (
    <aside className="w-56 bg-slate-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <HeartPulse className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-sm">MedSOP AI</span>
        </div>
        <p className="text-slate-400 text-xs">Hospital SOP Assistant</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems
          .filter((item) => !item.adminOnly || user?.role === "admin")
          .map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-teal-500/20 text-teal-400 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-slate-900 font-bold text-xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs truncate">{user?.department || user?.role}</p>
          </div>
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase">
            {user?.role}
          </span>
        </div>
      </div>
    </aside>
  );
}
