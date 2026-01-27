import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, AlertCircle, FileText, Warehouse, Pencil, PlusCircle } from 'lucide-react';
import { useProductDetail } from '@/hooks/useProducts';
import { useInventoryBySku } from '@/hooks/useInventory';
import { useTechSheet } from '@/hooks/useTechSheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InventoryAdjustModal } from '@/components/modals/InventoryAdjustModal';
import { ProductEditModal } from '@/components/modals/ProductEditModal';
import { TechSheetEditModal } from '@/components/modals/TechSheetEditModal';
import { formatQuantity, formatCurrency } from '@/utils/formatters';

interface ProductDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku: string | null;
}

export function ProductDetailModal({ open, onOpenChange, sku }: ProductDetailModalProps) {
  // Estados para modales de edición
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editTechSheetOpen, setEditTechSheetOpen] = useState(false);

  // 3 llamadas paralelas cuando el modal está abierto
  const { data: productData, isLoading: loadingProduct, error: productError } = useProductDetail(sku, open);
  const { inventory, totalStock, isLoading: loadingInventory } = useInventoryBySku(sku, open);
  const { data: techSheet, isLoading: loadingTechSheet } = useTechSheet(sku, open);

  const isLoading = loadingProduct || loadingInventory || loadingTechSheet;

  const product = productData?.item;

  // Calcular precio con impuesto
  const priceInfo = useMemo(() => {
    if (!product || product.precio1 == null) return null;
    
    // Convertir a número (la API puede devolver strings)
    const base = typeof product.precio1 === 'string' 
      ? parseFloat(product.precio1) 
      : product.precio1;
    
    // Manejar impuesto null y convertir a número
    let impuestoRate = 0;
    if (product.impuesto != null) {
      const rawImpuesto = typeof product.impuesto === 'string' 
        ? parseFloat(product.impuesto) 
        : product.impuesto;
      
      // Normalizar: si es > 1 (ej: 16), dividir entre 100 para obtener 0.16
      impuestoRate = rawImpuesto > 1 ? rawImpuesto / 100 : rawImpuesto;
    }
    
    // Calcular montos
    const impuestoAmount = base * impuestoRate;
    const total = base + impuestoAmount;
    
    return {
      base,
      impuesto: impuestoRate * 100, // Mostrar como porcentaje (16%)
      impuestoAmount,
      total,
    };
  }, [product]);

  // Obtener lista de almacenes para el modal de ajuste
  const almacenes = useMemo(() => {
    const set = new Set(inventory.map(i => i.almacen));
    // Agregar al menos un almacén por defecto si no hay ninguno
    if (set.size === 0) set.add('PRINCIPAL');
    return Array.from(set);
  }, [inventory]);

  if (!sku) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            {loadingProduct ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : productError ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span>Error al cargar el producto</span>
              </div>
            ) : product ? (
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold">{product.descrip ?? 'Sin descripción'}</DialogTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>SKU: {product.sku}</span>
                    <span>•</span>
                    <span>{product.marca ?? 'Sin marca'}</span>
                    <span>•</span>
                    <Badge variant="outline">{product.linea ?? 'Sin línea'}</Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditProductOpen(true)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Producto
                </Button>
              </div>
            ) : null}
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">
              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              ) : product ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column: Image and Inventory */}
                  <div className="space-y-6">
                    {/* Product Image */}
                    <div className="aspect-square bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/20 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.descrip ?? 'Producto'}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-24 h-24 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Inventory by Warehouse */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                          <Warehouse className="w-5 h-5" />
                          Inventario por Almacén
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Total: {formatQuantity(totalStock)} {product.unidad ?? 'PZA'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAdjustStockOpen(true)}
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Ajustar
                          </Button>
                        </div>
                      </div>
                      <Separator />
                      
                      {inventory.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Almacén</TableHead>
                              <TableHead className="text-right">Existencia</TableHead>
                              <TableHead className="text-right">Actualizado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inventory.map((inv) => (
                              <TableRow key={`${inv.sku}-${inv.almacen}`}>
                                <TableCell className="font-medium">{inv.almacen}</TableCell>
                                <TableCell className="text-right">
                                  {formatQuantity(inv.existencia)} {product.unidad ?? 'PZA'}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                  {new Date(inv.actualizado_el).toLocaleDateString('es-MX')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-muted-foreground italic py-4 text-center">
                          No hay existencias registradas
                        </p>
                      )}
                    </div>

                    {/* Stock Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Mínimo</span>
                        <p className="font-semibold">{formatQuantity(product.minimo)} {product.unidad ?? 'PZA'}</p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Máximo</span>
                        <p className="font-semibold">{formatQuantity(product.maximo)} {product.unidad ?? 'PZA'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Technical Specifications */}
                  <div className="space-y-6">
                    {/* Tech Sheet */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Ficha Técnica
                        </h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditTechSheetOpen(true)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                      <Separator />
                      
                      {loadingTechSheet ? (
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-6 w-3/4" />
                        </div>
                      ) : techSheet ? (
                        <div className="space-y-4">
                          {/* Notas generales */}
                          {techSheet.ficha.notas_generales && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">Notas generales:</span>
                              <p className="text-sm mt-1">{techSheet.ficha.notas_generales}</p>
                            </div>
                          )}

                          {/* Atributos */}
                          {techSheet.atributos.length > 0 ? (
                            <div className="space-y-1">
                              {techSheet.atributos.map((attr) => (
                                <div 
                                  key={attr.id}
                                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  <span className="text-muted-foreground font-medium">
                                    {attr.nombre_atributo}:
                                  </span>
                                  <span className="font-medium">
                                    {attr.valor}
                                    {attr.unidad && <span className="text-muted-foreground ml-1">{attr.unidad}</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic py-4 text-center">
                              No hay atributos registrados
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm italic">Sin ficha técnica</p>
                        </div>
                      )}
                    </div>

                    {/* Price Info */}
                    {priceInfo && (
                      <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Precio:</span>
                          <span className="text-xl font-bold">
                            {formatCurrency(priceInfo.base)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">IVA ({priceInfo.impuesto}%):</span>
                          <span>{formatCurrency(priceInfo.impuestoAmount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Total:</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(priceInfo.total)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Información Adicional</h4>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Unidad:</span>
                          <p className="font-medium">{product.unidad ?? 'PZA'}</p>
                        </div>
                        {product.ubicacion && (
                          <div>
                            <span className="text-muted-foreground">Ubicación:</span>
                            <p className="font-medium">{product.ubicacion}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Producto no encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modales de edición */}
      {sku && (
        <>
          <InventoryAdjustModal
            open={adjustStockOpen}
            onOpenChange={setAdjustStockOpen}
            sku={sku}
            almacenes={almacenes}
          />
          
          <ProductEditModal
            open={editProductOpen}
            onOpenChange={setEditProductOpen}
            product={product ?? null}
          />
          
          <TechSheetEditModal
            open={editTechSheetOpen}
            onOpenChange={setEditTechSheetOpen}
            sku={sku}
            techSheet={techSheet ?? null}
          />
        </>
      )}
    </>
  );
}
