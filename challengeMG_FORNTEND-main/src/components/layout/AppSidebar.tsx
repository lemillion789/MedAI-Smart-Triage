import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  ClipboardList,
  ListFilter,
  UserCog,
  LogOut,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";

// Navegación para el Doctor
const doctorNavItems = [
  { to: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/doctor/pacientes", label: "Patients", icon: Users },
  { to: "/doctor/historial", label: "History", icon: ClipboardList },
];

// Navegación para el Paciente (kiosko): mínima
const patientNavItems = [
  { to: "/nueva-consulta", label: "New Consultation", icon: Stethoscope },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, clearRole, isDoctor } = useRole();

  const navItems = isDoctor ? doctorNavItems : patientNavItems;

  const handleLogout = () => {
    clearRole();
    navigate("/", { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <img src="/logo.png" alt="MedAI Logo" className="w-10 h-10 object-contain" />
        <div>
          <h1 className="font-heading text-lg font-bold text-sidebar-primary-foreground">
            MedAI
          </h1>
          <p className="text-xs text-sidebar-muted">
            {isDoctor ? "Doctor Panel" : "Clinical Triage"}
          </p>
        </div>
      </div>

      {/* Rol badge */}
      {role && (
        <div className="mx-3 mb-4 px-4 py-2 rounded-lg bg-sidebar-accent/30 flex items-center gap-2">
          <UserCog className="w-3.5 h-3.5 text-sidebar-muted flex-shrink-0" />
          <span className="text-xs text-sidebar-muted capitalize">
            {isDoctor ? "Doctor" : "Patient (kiosk)"}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.to === "/doctor/dashboard" || item.to === "/"
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: motor AI + logout */}
      <div className="px-3 pb-4 space-y-2">
        <div className="px-4 py-4 rounded-xl bg-sidebar-accent/50">
          <p className="text-xs text-sidebar-muted font-medium">AI Engine</p>
          <p className="text-sm text-sidebar-foreground mt-1">MedGemma + MedASR</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-sidebar-primary animate-pulse-soft" />
            <span className="text-xs text-sidebar-primary">Active</span>
          </div>
        </div>

        {role && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {isDoctor ? "Logout" : "Exit"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-[260px] lg:fixed lg:inset-y-0 bg-sidebar"
      style={{ background: "var(--gradient-sidebar)" }}
    >
      <SidebarContent />
    </aside>
  );
};

export default AppSidebar;
