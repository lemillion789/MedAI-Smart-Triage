// usePatients Hook - React Query hooks para gestión de pacientes

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsService } from "@/services";
import type { Patient, PatientCreate } from "@/types/api";

const PATIENTS_KEY = "patients";

/**
 * Hook para obtener lista de pacientes
 */
export function usePatients() {
  return useQuery({
    queryKey: [PATIENTS_KEY],
    queryFn: () => patientsService.getPatients(),
  });
}

/**
 * Hook para obtener un paciente específico
 */
export function usePatient(id: number) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id],
    queryFn: () => patientsService.getPatient(id),
    enabled: !!id,
  });
}

/**
 * Hook para crear un nuevo paciente
 */
export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PatientCreate) => patientsService.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
  });
}

/**
 * Hook para actualizar un paciente
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PatientCreate> }) =>
      patientsService.updatePatient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY, variables.id] });
    },
  });
}

/**
 * Hook para eliminar un paciente
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => patientsService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
  });
}
