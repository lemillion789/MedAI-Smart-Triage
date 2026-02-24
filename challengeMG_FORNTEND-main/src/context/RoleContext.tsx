// RoleContext - Gestión de roles Paciente/Doctor (documentación sección 2)

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserRole } from "@/types/api";

interface RoleContextValue {
  role: UserRole | null;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
  isPatient: boolean;
  isDoctor: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const ROLE_KEY = "medai_role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole | null>(() => {
    // No persistimos PHI, pero sí el rol de sesión (no datos clínicos)
    const stored = sessionStorage.getItem(ROLE_KEY);
    return (stored as UserRole) || null;
  });

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    sessionStorage.setItem(ROLE_KEY, newRole);
  }, []);

  const clearRole = useCallback(() => {
    setRoleState(null);
    sessionStorage.removeItem(ROLE_KEY);
    // Kiosko: limpiar también cualquier dato de sesión del paciente
    sessionStorage.clear();
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        clearRole,
        isPatient: role === "patient",
        isDoctor: role === "doctor",
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole debe usarse dentro de <RoleProvider>");
  return ctx;
}
