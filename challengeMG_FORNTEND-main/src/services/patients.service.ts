// Patients Service - Servicio para gestión de pacientes

import { apiClient } from "@/lib/api-client";
import type { Patient, PatientCreate } from "@/types/api";

export const patientsService = {
  /**
   * Obtener lista de todos los pacientes
   */
  async getPatients(): Promise<Patient[]> {
    return apiClient.get<Patient[]>("/api/patients/");
  },

  /**
   * Obtener un paciente específico por ID
   */
  async getPatient(id: number): Promise<Patient> {
    return apiClient.get<Patient>(`/api/patients/${id}/`);
  },

  /**
   * Crear un nuevo paciente
   */
  async createPatient(data: PatientCreate): Promise<Patient> {
    return apiClient.post<Patient>("/api/patients/", data);
  },

  /**
   * Actualizar un paciente existente
   */
  async updatePatient(id: number, data: Partial<PatientCreate>): Promise<Patient> {
    return apiClient.patch<Patient>(`/api/patients/${id}/`, data);
  },

  /**
   * Eliminar un paciente
   */
  async deletePatient(id: number): Promise<void> {
    return apiClient.delete<void>(`/api/patients/${id}/`);
  },
};
