import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { adjustInventory } from "@/services/inventoryService";
import { ApiError } from "@/services/apiClient";
import type { InventoryAdjustRequest } from "@/types/products";
import { toast } from "@/hooks/use-toast";

export function useAdjustInventory() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InventoryAdjustRequest) => adjustInventory(token!, data),
    onSuccess: (response, variables) => {
      // Invalidar queries de inventario
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", variables.sku] });
      
      toast({
        title: "Stock ajustado",
        description: `Nuevo stock: ${response.existencia} en ${variables.almacen}`,
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para ajustar inventario",
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
