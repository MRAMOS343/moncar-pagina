import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  updateTechSheet, 
  upsertTechSheetAttribute, 
  deleteTechSheetAttribute 
} from "@/services/techSheetService";
import { ApiError } from "@/services/apiClient";
import type { TechSheetUpdateRequest, TechSheetAttributeRequest } from "@/types/products";
import { toast } from "@/hooks/use-toast";

export function useUpdateTechSheet() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sku, data }: { sku: string; data: TechSheetUpdateRequest }) =>
      updateTechSheet(token!, sku, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tech-sheet", variables.sku] });
      toast({
        title: "Ficha actualizada",
        description: "Notas generales guardadas",
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para editar fichas técnicas",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        });
      }
    },
  });
}

export function useUpsertAttribute() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sku, data }: { sku: string; data: TechSheetAttributeRequest }) =>
      upsertTechSheetAttribute(token!, sku, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tech-sheet", variables.sku] });
      toast({
        title: "Atributo guardado",
        description: `${variables.data.nombre_atributo} actualizado`,
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para editar atributos",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        });
      }
    },
  });
}

export function useDeleteAttribute() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sku, attributeId }: { sku: string; attributeId: number }) =>
      deleteTechSheetAttribute(token!, sku, attributeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tech-sheet", variables.sku] });
      toast({
        title: "Atributo eliminado",
        description: "El atributo se eliminó correctamente",
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para eliminar atributos",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive",
        });
      }
    },
  });
}
