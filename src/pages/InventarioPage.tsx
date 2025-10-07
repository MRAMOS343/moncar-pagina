import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, Columna } from '@/components/ui/data-table';
import { ProductModal } from '@/components/modals/ProductModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, AlertTriangle, Package, TrendingDown, Plus, Edit, X } from 'lucide-react';
import { mockProducts, mockInventory, mockWarehouses, getProductById, getWarehouseById } from '../data/mockData';
import { Product, Inventory, User, KPIData } from '../types';
import { toast } from '@/hooks/use-toast';

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
}

interface InventoryWithProduct extends Inventory {
  product: Product;
}

export default function InventarioPage() {
  const { currentWarehouse, searchQuery, currentUser } = useOutletContext<ContextType>();
  const [selectedMarca, setSelectedMarca] = useState<string>('all');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Get unique brands and categories for filters
  const marcas = [...new Set(mockProducts.map(p => p.marca))];
  const categorias = [...new Set(mockProducts.map(p => p.categoria))];

  // Filter inventory data for current warehouse
  const warehouseInventory = useMemo(() => {
    return mockInventory
      .filter(inv => inv.warehouseId === currentWarehouse)
      .map(inv => {
        const product = getProductById(inv.productId);
        return product ? { ...inv, product } : null;
      })
      .filter((item): item is InventoryWithProduct => item !== null)
      .filter(item => {
        // Search filter
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          if (!item.product.nombre.toLowerCase().includes(searchLower) && 
              !item.product.sku.toLowerCase().includes(searchLower) && 
              !item.product.marca.toLowerCase().includes(searchLower)) {
            return false;
          }
        }

        // Brand filter
        if (selectedMarca !== 'all' && item.product.marca !== selectedMarca) {
          return false;
        }

        // Category filter
        if (selectedCategoria !== 'all' && item.product.categoria !== selectedCategoria) {
          return false;
        }

        return true;
      });
  }, [currentWarehouse, searchQuery, selectedMarca, selectedCategoria]);

  // Calculate KPIs for current warehouse
  const warehouseKPIs = useMemo((): KPIData[] => {
    const lowStockItems = warehouseInventory.filter(inv => inv.onHand <= inv.product.reorderPoint).length;
    const totalStockValue = warehouseInventory.reduce((sum, inv) => sum + (inv.onHand * inv.product.precio), 0);
    const totalItems = warehouseInventory.reduce((sum, inv) => sum + inv.onHand, 0);

    return [
      {
        label: "Stock Bajo",
        value: lowStockItems,
        format: "number",
        change: lowStockItems > 0 ? 15.3 : -8.2,
        changeType: lowStockItems > 0 ? "negative" : "positive"
      },
      {
        label: "Valor Total",
        value: totalStockValue,
        format: "currency",
        change: 5.7,
        changeType: "positive"
      },
      {
        label: "Productos Únicos",
        value: warehouseInventory.length,
        format: "number",
        change: 2.1,
        changeType: "positive"
      },
      {
        label: "Unidades Totales",
        value: totalItems,
        format: "number",
        change: -1.2,
        changeType: "negative"
      }
    ];
  }, [warehouseInventory]);

  // Calculate global totals across all warehouses
  const globalTotals = useMemo(() => {
    const allInventory = mockInventory.map(inv => {
      const product = getProductById(inv.productId);
      return product ? { ...inv, product } : null;
    }).filter((item): item is InventoryWithProduct => item !== null);

    const totalStockValue = allInventory.reduce((sum, inv) => sum + (inv.onHand * inv.product.precio), 0);
    const uniqueProducts = new Set(allInventory.map(inv => inv.productId)).size;
    const totalItems = allInventory.reduce((sum, inv) => sum + inv.onHand, 0);

    // Group by warehouse
    const byWarehouse = allInventory.reduce((acc, inv) => {
      if (!acc[inv.warehouseId]) {
        acc[inv.warehouseId] = { products: 0, items: 0, value: 0 };
      }
      acc[inv.warehouseId].products += 1;
      acc[inv.warehouseId].items += inv.onHand;
      acc[inv.warehouseId].value += inv.onHand * inv.product.precio;
      return acc;
    }, {} as Record<string, { products: number; items: number; value: number }>);

    return {
      totalStockValue,
      uniqueProducts,
      totalItems,
      byWarehouse
    };
  }, []);

  // Define columns for the data table
  const inventoryColumns: Columna<InventoryWithProduct>[] = [
    {
      key: 'product.sku',
      header: 'SKU',
      sortable: true,
      render: (_, row) => (
        <span className="font-mono text-sm">{row.product.sku}</span>
      )
    },
    {
      key: 'product.nombre',
      header: 'Producto',
      sortable: true,
      render: (_, row) => (
        <div>
          <p className="font-medium">{row.product.nombre}</p>
          <p className="text-sm text-muted-foreground">{row.product.marca}</p>
        </div>
      )
    },
    {
      key: 'product.categoria',
      header: 'Categoría',
      sortable: true,
      render: (_, row) => (
        <Badge variant="outline">{row.product.categoria}</Badge>
      )
    },
    {
      key: 'onHand',
      header: 'Stock',
      sortable: true,
      render: (_, row) => (
        <div className="text-right">
          <span className="font-medium">{row.onHand}</span>
          <span className="text-sm text-muted-foreground ml-1">{row.product.unidad}</span>
        </div>
      )
    },
    {
      key: 'product.precio',
      header: 'Precio',
      sortable: true,
      render: (_, row) => (
        <span className="font-medium">
          {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.product.precio)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      render: (_, row) => getStockStatusBadge(row)
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEditProduct(row.product)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      )
    }
  ];

  const getStockStatusBadge = (inv: InventoryWithProduct) => {
    if (inv.onHand <= inv.product.reorderPoint) {
      return <Badge variant="destructive">Stock Bajo</Badge>;
    } else if (inv.onHand <= inv.product.safetyStock + inv.product.reorderPoint) {
      return <Badge variant="warning">Stock Medio</Badge>;
    } else {
      return <Badge variant="success">Stock Alto</Badge>;
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingProduct) {
      toast({
        title: "Producto actualizado",
        description: `${productData.nombre} ha sido actualizado exitosamente.`,
      });
    } else {
      toast({
        title: "Producto creado",
        description: `${productData.nombre} ha sido creado exitosamente.`,
      });
    }
  };

  const handleExportCSV = () => {
    if (currentUser.role === 'cajero') {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para exportar datos.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Exportando...",
      description: "Los datos se están exportando a CSV.",
    });
  };

  const handleImportCSV = () => {
    if (currentUser.role === 'cajero') {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para importar datos.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Función no disponible",
      description: "La importación CSV estará disponible próximamente.",
    });
  };

  const clearFilters = () => {
    setSelectedMarca('all');
    setSelectedCategoria('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">
            {getWarehouseById(currentWarehouse)?.nombre || 'Sucursal no encontrada'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleImportCSV}>
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={handleCreateProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <Tabs defaultValue="warehouse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="warehouse">Vista por Sucursal</TabsTrigger>
          <TabsTrigger value="global">Totales Globales</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouse" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {warehouseKPIs.map((kpi, index) => (
              <KPICard key={index} data={kpi} />
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Filtra los productos por marca y categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Marca</label>
                  <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las marcas</SelectItem>
                      {marcas.map((marca) => (
                        <SelectItem key={marca} value={marca}>
                          {marca}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Categoría</label>
                  <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las categorías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="w-full"
                    disabled={selectedMarca === 'all' && selectedCategoria === 'all'}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Productos en Inventario</CardTitle>
              <CardDescription>
                {warehouseInventory.length} productos en {getWarehouseById(currentWarehouse)?.nombre}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={warehouseInventory}
                columns={inventoryColumns}
                searchable={true}
                searchPlaceholder="Buscar por nombre, SKU o marca..."
                emptyMessage="No hay productos en inventario"
                emptyDescription="No se encontraron productos que coincidan con los filtros aplicados"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="space-y-6">
          {/* Global KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard data={{
              label: "Valor Total Global",
              value: globalTotals.totalStockValue,
              format: "currency",
              change: 8.3,
              changeType: "positive"
            }} />
            <KPICard data={{
              label: "Productos Únicos",
              value: globalTotals.uniqueProducts,
              format: "number",
              change: 3.2,
              changeType: "positive"
            }} />
            <KPICard data={{
              label: "Total de Unidades",
              value: globalTotals.totalItems,
              format: "number",
              change: -0.8,
              changeType: "negative"
            }} />
            <KPICard data={{
              label: "Sucursales Activas",
              value: Object.keys(globalTotals.byWarehouse).length,
              format: "number"
            }} />
          </div>

          {/* Breakdown by Warehouse */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Sucursal</CardTitle>
              <CardDescription>
                Distribución del inventario por sucursal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(globalTotals.byWarehouse).map(([warehouseId, data]) => {
                  const warehouse = getWarehouseById(warehouseId);
                  return (
                    <div key={warehouseId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{warehouse?.nombre || 'Sucursal desconocida'}</p>
                          <p className="text-sm text-muted-foreground">{warehouse?.direccion}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-right">
                        <div>
                          <p className="text-sm text-muted-foreground">Productos</p>
                          <p className="font-semibold">{data.products}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Unidades</p>
                          <p className="font-semibold">{data.items.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="font-semibold">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.value)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Modal */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}