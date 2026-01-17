import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  useUpdateTechSheet, 
  useUpsertAttribute, 
  useDeleteAttribute 
} from '@/hooks/useTechSheetMutations';
import type { TechSheetDetailResponse, TechSheetAttribute } from '@/types/products';
import { Loader2, Plus, Trash2, Pencil, Save, X } from 'lucide-react';

const notesSchema = z.object({
  notas_generales: z.string().optional(),
});

const attributeSchema = z.object({
  nombre_atributo: z.string().min(1, 'El nombre es requerido'),
  valor: z.string().min(1, 'El valor es requerido'),
  unidad: z.string().optional(),
});

type NotesFormData = z.infer<typeof notesSchema>;
type AttributeFormData = z.infer<typeof attributeSchema>;

interface TechSheetEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sku: string;
  techSheet: TechSheetDetailResponse | null;
}

export function TechSheetEditModal({
  open,
  onOpenChange,
  sku,
  techSheet,
}: TechSheetEditModalProps) {
  const updateNotesMutation = useUpdateTechSheet();
  const upsertAttributeMutation = useUpsertAttribute();
  const deleteAttributeMutation = useDeleteAttribute();

  const [editingAttrId, setEditingAttrId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const {
    register: registerNotes,
    handleSubmit: handleSubmitNotes,
    reset: resetNotes,
  } = useForm<NotesFormData>({
    resolver: zodResolver(notesSchema),
  });

  const {
    register: registerAttr,
    handleSubmit: handleSubmitAttr,
    formState: { errors: attrErrors },
    reset: resetAttr,
    setValue: setAttrValue,
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
  });

  useEffect(() => {
    if (open && techSheet) {
      resetNotes({
        notas_generales: techSheet.ficha.notas_generales ?? '',
      });
      setEditingAttrId(null);
      setShowAddForm(false);
      resetAttr();
    }
  }, [open, techSheet, resetNotes, resetAttr]);

  const onSubmitNotes = async (data: NotesFormData) => {
    await updateNotesMutation.mutateAsync({
      sku,
      data: { notas_generales: data.notas_generales },
    });
  };

  const onSubmitAttribute = async (data: AttributeFormData) => {
    await upsertAttributeMutation.mutateAsync({
      sku,
      data: {
        nombre_atributo: data.nombre_atributo,
        valor: data.valor,
        unidad: data.unidad || undefined,
      },
    });
    resetAttr();
    setShowAddForm(false);
    setEditingAttrId(null);
  };

  const handleEditAttribute = (attr: TechSheetAttribute) => {
    setEditingAttrId(attr.id);
    setShowAddForm(false);
    setAttrValue('nombre_atributo', attr.nombre_atributo);
    setAttrValue('valor', attr.valor);
    setAttrValue('unidad', attr.unidad ?? '');
  };

  const handleDeleteAttribute = async () => {
    if (deleteConfirmId === null) return;
    await deleteAttributeMutation.mutateAsync({
      sku,
      attributeId: deleteConfirmId,
    });
    setDeleteConfirmId(null);
  };

  const handleAddNew = () => {
    setEditingAttrId(null);
    setShowAddForm(true);
    resetAttr();
  };

  const handleCancelEdit = () => {
    setEditingAttrId(null);
    setShowAddForm(false);
    resetAttr();
  };

  const isPending = 
    updateNotesMutation.isPending || 
    upsertAttributeMutation.isPending || 
    deleteAttributeMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Editar Ficha Técnica</DialogTitle>
            <p className="text-sm text-muted-foreground">SKU: {sku}</p>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
            <div className="space-y-6 pb-6">
              {/* Notas Generales */}
              <form onSubmit={handleSubmitNotes(onSubmitNotes)} className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">NOTAS GENERALES</h3>
                <Separator />
                
                <div className="space-y-2">
                  <Textarea
                    {...registerNotes('notas_generales')}
                    placeholder="Notas generales del producto..."
                    rows={4}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={updateNotesMutation.isPending}
                >
                  {updateNotesMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Guardar Notas
                </Button>
              </form>

              {/* Atributos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground">ATRIBUTOS</h3>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={handleAddNew}
                    disabled={showAddForm || editingAttrId !== null}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
                <Separator />

                {/* Lista de atributos existentes */}
                <div className="space-y-2">
                  {techSheet?.atributos.map((attr) => (
                    <div key={attr.id}>
                      {editingAttrId === attr.id ? (
                        <form 
                          onSubmit={handleSubmitAttr(onSubmitAttribute)}
                          className="p-3 border rounded-lg space-y-3 bg-muted/30"
                        >
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Nombre</Label>
                              <Input
                                {...registerAttr('nombre_atributo')}
                                placeholder="Nombre"
                                size={1}
                              />
                              {attrErrors.nombre_atributo && (
                                <p className="text-xs text-destructive">{attrErrors.nombre_atributo.message}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Valor</Label>
                              <Input
                                {...registerAttr('valor')}
                                placeholder="Valor"
                                size={1}
                              />
                              {attrErrors.valor && (
                                <p className="text-xs text-destructive">{attrErrors.valor.message}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Unidad</Label>
                              <Input
                                {...registerAttr('unidad')}
                                placeholder="Unidad"
                                size={1}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isPending}
                            >
                              {upsertAttributeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground font-medium min-w-32">
                              {attr.nombre_atributo}:
                            </span>
                            <span className="font-medium">
                              {attr.valor}
                              {attr.unidad && (
                                <span className="text-muted-foreground ml-1">{attr.unidad}</span>
                              )}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleEditAttribute(attr)}
                              disabled={isPending}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(attr.id)}
                              disabled={isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Formulario para agregar nuevo atributo */}
                  {showAddForm && (
                    <form 
                      onSubmit={handleSubmitAttr(onSubmitAttribute)}
                      className="p-3 border rounded-lg space-y-3 bg-muted/30"
                    >
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nombre</Label>
                          <Input
                            {...registerAttr('nombre_atributo')}
                            placeholder="Ej: Material"
                            size={1}
                          />
                          {attrErrors.nombre_atributo && (
                            <p className="text-xs text-destructive">{attrErrors.nombre_atributo.message}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor</Label>
                          <Input
                            {...registerAttr('valor')}
                            placeholder="Ej: Acero"
                            size={1}
                          />
                          {attrErrors.valor && (
                            <p className="text-xs text-destructive">{attrErrors.valor.message}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unidad</Label>
                          <Input
                            {...registerAttr('unidad')}
                            placeholder="Opcional"
                            size={1}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isPending}
                        >
                          {upsertAttributeMutation.isPending && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          Agregar
                        </Button>
                      </div>
                    </form>
                  )}

                  {(!techSheet?.atributos || techSheet.atributos.length === 0) && !showAddForm && (
                    <p className="text-sm text-muted-foreground italic py-4 text-center">
                      No hay atributos registrados
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar atributo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El atributo será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAttributeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttribute}
              disabled={deleteAttributeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAttributeMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
