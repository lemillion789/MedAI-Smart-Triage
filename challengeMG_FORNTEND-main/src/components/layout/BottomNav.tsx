import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  ClipboardList,
  ListFilter,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";

const doctorItems = [
  { to: "/doctor/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/doctor/pacientes", label: "Patients", icon: Users },
  { to: "/doctor/historial", label: "History", icon: ClipboardList },
];

const patientItems = [
  { to: "/nueva-consulta", label: "Consultation", icon: Stethoscope },
];

const BottomNav = () => {
  const location = useLocation();
  const { isDoctor } = useRole();

  const navItems = isDoctor ? doctorItems : patientItems;

  if (navItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border shadow-[0_-2px_10px_hsl(210_20%_50%/0.08)]">
      <div className="flex items-center justify-around px-1 py-1 safe-bottom">
        {navItems.map((item) => {
          const isActive = item.to.includes("dashboard") || item.to === "/"
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg min-w-[56px] transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              {isActive && (
                <div className="w-4 h-0.5 rounded-full bg-primary mt-0.5" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
