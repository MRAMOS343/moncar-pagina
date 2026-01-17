import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { updateProduct } from "@/services/productService";
import { ApiError } from "@/services/apiClient";
import type { ProductUpdateRequest } from "@/types/products";
import { toast } from "@/hooks/use-toast";

export function useUpdateProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sku, data }: { sku: string; data: ProductUpdateRequest }) => 
      updateProduct(token!, sku, data),
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.sku] });
      
      toast({
        title: "Producto actualizado",
        description: "Los cambios se guardaron exitosamente",
      });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) {
        toast({
          title: "Sin permisos",
          description: "No tienes permisos para editar productos",
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
