import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/services/apiClient";
import { toast } from "@/hooks/use-toast";
import {
  createEquipo,
  updateEquipo,
  deleteEquipo,
  addMiembro,
  removeMiembro,
} from "@/services/equipoService";
import type {
  CreateEquipoRequest,
  UpdateEquipoRequest,
  AddMiembroRequest,
} from "@/types/equipos";

// Manejo de errores estandarizado
function handleMutationError(error: unknown, defaultMsg: string) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      toast({
        title: "Sin permisos",
        description: "No tienes permisos para esta acción",
        variant: "destructive",
      });
    } else if (error.status === 400) {
      toast({
        title: "Error de validación",
        description: error.message,
        variant: "destructive",
      });
    } else if (error.status === 404) {
      toast({
        title: "No encontrado",
        description: "El equipo no existe",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  } else {
    toast({
      title: "Error",
      description: defaultMsg,
      variant: "destructive",
    });
  }
}

export function useCreateEquipo() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEquipoRequest) => createEquipo(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({
        title: "Equipo creado",
        description: "El equipo se creó correctamente",
      });
    },
    onError: (error) => handleMutationError(error, "Error al crear equipo"),
  });
}

export function useUpdateEquipo() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipoRequest }) =>
      updateEquipo(token!, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      queryClient.invalidateQueries({ queryKey: ["equipo", variables.id] });
      toast({
        title: "Equipo actualizado",
        description: "Los cambios se guardaron",
      });
    },
    onError: (error) =>
      handleMutationError(error, "Error al actualizar equipo"),
  });
}

export function useDeleteEquipo() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEquipo(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({
        title: "Equipo eliminado",
        description: "El equipo fue desactivado",
      });
    },
    onError: (error) => handleMutationError(error, "Error al eliminar equipo"),
  });
}

export function useAddMiembro() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipoId,
      data,
    }: {
      equipoId: string;
      data: AddMiembroRequest;
    }) => addMiembro(token!, equipoId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["equipo", variables.equipoId],
      });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({
        title: "Miembro agregado",
        description: "Se agregó el miembro al equipo",
      });
    },
    onError: (error) => handleMutationError(error, "Error al agregar miembro"),
  });
}

export function useRemoveMiembro() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      equipoId,
      usuarioId,
    }: {
      equipoId: string;
      usuarioId: string;
    }) => removeMiembro(token!, equipoId, usuarioId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["equipo", variables.equipoId],
      });
      queryClient.invalidateQueries({ queryKey: ["equipos"] });
      toast({
        title: "Miembro eliminado",
        description: "Se quitó el miembro del equipo",
      });
    },
    onError: (error) => handleMutationError(error, "Error al quitar miembro"),
  });
}
