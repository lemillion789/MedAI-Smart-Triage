import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studiesService } from "@/services/studies.service";

const QUERY_KEYS = {
  all: ["studies"] as const,
  list: (params?: object) => ["studies", "list", params] as const,
  detail: (id: number) => ["studies", id] as const,
};

/** Lista de todos los estudios */
export function useStudies() {
  return useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: () => studiesService.getStudies(),
    staleTime: 30_000,
    refetchInterval: 10_000, // Refrescar la cola frecuentemente
  });
}

/** Estudio individual por ID */
export function useStudy(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id!),
    queryFn: () => studiesService.getStudy(id!),
    enabled: id != null,
    staleTime: 10_000,
  });
}

/** Crear nuevo estudio */
export function useCreateStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => studiesService.createStudy(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}

/** Enviar respuesta de triaje interactivo */
export function useSubmitTriageAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studyId, answer }: { studyId: number; answer: string }) =>
      studiesService.submitTriageAnswer(studyId, answer),
    onSuccess: (_, { studyId }) => {
      qc.invalidateQueries({ queryKey: ["consultations", studyId] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.detail(studyId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
}
