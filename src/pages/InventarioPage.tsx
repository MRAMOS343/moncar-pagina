import { useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ProductModal } from '@/components/modals/ProductModal';
import { ProductDetailModal } from '@/components/inventory/ProductDetailModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Download, Upload, Package, Plus, X, Filter, LayoutGrid, List, Loader2, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProducts } from '@/hooks/useProducts';
import { useProductosKPIs } from '@/hooks/useProductosKPIs';
import { useInventarioGlobal } from '@/hooks/useInventarioGlobal';
import { Product, User, KPIData } from '../types';
import type { ApiProduct } from '@/types/products';
import { exportToCSV } from '@/utils/exportCSV';
import { EmptyState } from '@/components/ui/empty-state';
import { KPISkeleton } from '@/components/ui/kpi-skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { showSuccessToast, showErrorToast } from '@/utils/toastHelpers';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useIsMobile } from '@/hooks/use-mobile';

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
}

type ViewMode = 'table' | 'grid';

// Helper para mapear ApiProduct al formato de la tabla
interface ProductTableItem {
  sku: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number | null;
  unidad: string;
  minimo: number | null;
  maximo: number | null;
  notes: string | null;
}

function mapApiProductToTableItem(p: ApiProduct): ProductTableItem {
  return {
    sku: p.sku,
    nombre: p.descrip ?? 'Sin descripción',
    marca: p.marca ?? 'Sin marca',
    categoria: p.linea ?? 'Sin línea',
    precio: p.precio1,
    unidad: p.unidad ?? 'PZA',
    minimo: p.minimo,
    maximo: p.maximo,
    notes: p.notes ?? null,
  };
}

export default function InventarioPage() {
  const { currentWarehouse, searchQuery, currentUser } = useOutletContext<ContextType>();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedMarca, setSelectedMarca] = useState<string>('all');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Estado local para búsqueda por SKU y notas
  const [localSearch, setLocalSearch] = useState('');
  const debouncedLocalSearch = useDebounce(localSearch, 300);

  // Usar hook de productos con paginación y búsqueda
  const { 
    products: apiProducts, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage,
  } = useProducts({ 
    q: debouncedSearchQuery,
    limit: 100,
  });

  // Hook dedicado para KPIs con carga completa del catálogo
  const { 
    data: kpiData, 
    isLoading: kpiLoading 
  } = useProductosKPIs();

  // Mapear productos de la API al formato de tabla
  const tableProducts = useMemo(() => 
    apiProducts.map(mapApiProductToTableItem),
    [apiProducts]
  );

  // Filtrar por búsqueda local (SKU o notes) + marca y categoría
  const filteredProducts = useMemo(() => {
    let result = tableProducts;
    
    // Filtrar por búsqueda local (SKU o notes con búsqueda desordenada)
    if (debouncedLocalSearch) {
      const searchLower = debouncedLocalSearch.toLowerCase();
      const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
      
      result = result.filter(item => {
        // Para SKU: búsqueda secuencial (el orden importa)
        if (item.sku.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Para notes: búsqueda por palabras (todas deben coincidir, orden no importa)
        if (item.notes) {
          const notesLower = item.notes.toLowerCase();
          return searchWords.every(word => notesLower.includes(word));
        }
        
        return false;
      });
    }
    
    // Filtrar por marca y categoría
    return result.filter(item => {
      if (selectedMarca !== 'all' && item.marca !== selectedMarca) return false;
      if (selectedCategoria !== 'all' && item.categoria !== selectedCategoria) return false;
      return true;
    });
  }, [tableProducts, debouncedLocalSearch, selectedMarca, selectedCategoria]);

  // Get unique brands and categories from loaded products
  const marcas = useMemo(() => [...new Set(tableProducts.map(p => p.marca))].sort(), [tableProducts]);
  const categorias = useMemo(() => [...new Set(tableProducts.map(p => p.categoria))].sort(), [tableProducts]);

  // Columnas para la tabla de productos
  const productColumns = useMemo(() => [
    {
      key: 'sku' as const,
      header: 'SKU',
      sortable: true,
    },
    {
      key: 'nombre' as const,
      header: 'Producto',
      sortable: true,
    },
    {
      key: 'marca' as const,
      header: 'Marca',
      sortable: true,
    },
    {
      key: 'categoria' as const,
      header: 'Línea',
      sortable: true,
    },
    {
      key: 'precio' as const,
      header: 'Precio',
      sortable: true,
      render: (value: number | null | undefined) => 
        value != null ? `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-',
    },
    {
      key: 'unidad' as const,
      header: 'Unidad',
    },
  ], []);

  // Calculate KPIs using dedicated hook for complete catalog data
  const productKPIs = useMemo((): KPIData[] => {
    const totalProductos = kpiData?.totalProductos ?? 0;
    const totalMarcas = kpiData?.marcas.length ?? 0;
    const totalLineas = kpiData?.lineas.length ?? 0;

    return [
      {
        label: "Total Productos",
        value: totalProductos,
        format: "number",
      },
      {
        label: "Productos Mostrados",
        value: filteredProducts.length,
        format: "number",
      },
      {
        label: "Marcas",
        value: totalMarcas,
        format: "number",
      },
      {
        label: "Líneas",
        value: totalLineas,
        format: "number",
      },
    ];
  }, [kpiData, filteredProducts.length]);

  // Hook para totales globales desde API real
  const globalTotals = useInventarioGlobal();

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setProductModalOpen(true);
  }, []);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (editingProduct) {
      showSuccessToast("Producto actualizado", `${productData.nombre} ha sido actualizado exitosamente.`);
    } else {
      showSuccessToast("Producto creado", `${productData.nombre} ha sido creado exitosamente.`);
    }
  };

  const handleExportCSV = () => {
    if (currentUser.role === 'cajero') {
      showErrorToast("Acceso denegado", "No tienes permisos para exportar datos.");
      return;
    }
    
    exportToCSV(
      filteredProducts.map(p => ({
        SKU: p.sku,
        Producto: p.nombre,
        Marca: p.marca,
        Linea: p.categoria,
        Precio: p.precio,
        Unidad: p.unidad,
      })),
      `productos_${new Date().toISOString().split('T')[0]}`
    );
    
    showSuccessToast("Exportación exitosa", "Los datos se han exportado a CSV correctamente.");
  };

  const handleImportCSV = () => {
    if (currentUser.role === 'cajero') {
      showErrorToast("Acceso denegado", "No tienes permisos para importar datos.");
      return;
    }
    
    showSuccessToast("Función no disponible", "La importación CSV estará disponible próximamente.");
  };

  const clearFilters = () => {
    setSelectedMarca('all');
    setSelectedCategoria('all');
    setLocalSearch('');
  };

  const handleProductClick = (item: ProductTableItem) => {
    setSelectedSku(item.sku);
    setDetailModalOpen(true);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo de productos desde la API
          </p>
        </div>
        <div className="flex gap-2 self-end sm:self-auto flex-wrap">
          <Button variant="outline" onClick={handleExportCSV} size="sm" className="btn-hover touch-target">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button variant="outline" onClick={handleImportCSV} size="sm" className="btn-hover touch-target">
            <Upload className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Importar CSV</span>
          </Button>
          <Button onClick={handleCreateProduct} size="sm" className="btn-hover touch-target">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Catálogo de Productos</TabsTrigger>
          <TabsTrigger value="global">Totales Globales</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(isLoading || kpiLoading) ? (
              <>
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
              </>
            ) : (
              productKPIs.map((kpi, index) => (
                <KPICard key={index} data={kpi} className="animate-fade-in" />
              ))
            )}
          </div>

          {/* Filters */}
          {isMobile ? (
            <Accordion type="single" collapsible defaultValue="filtros">
              <AccordionItem value="filtros">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Filtros</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 pb-4 space-y-4">
                    {/* Búsqueda por SKU y notas */}
                    <div className="space-y-2">
                      <label className="text-base font-medium">Buscar</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por SKU o notas..."
                          value={localSearch}
                          onChange={(e) => setLocalSearch(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        {localSearch && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setLocalSearch('')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-base font-medium">Marca</label>
                      <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                        <SelectTrigger className="mobile-select">
                          <SelectValue placeholder="Todas las marcas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las marcas</SelectItem>
                          {marcas.map((marca) => (
                            <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-base font-medium">Línea</label>
                      <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                        <SelectTrigger className="mobile-select">
                          <SelectValue placeholder="Todas las líneas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las líneas</SelectItem>
                          {categorias.map((categoria) => (
                            <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="w-full mobile-button"
                      disabled={selectedMarca === 'all' && selectedCategoria === 'all' && !localSearch}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Filtra los productos por SKU, notas, marca y línea</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Búsqueda por SKU y notas */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por SKU o notas del producto..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {localSearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setLocalSearch('')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
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
                          <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Línea</label>
                    <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las líneas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las líneas</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="w-full"
                      disabled={selectedMarca === 'all' && selectedCategoria === 'all' && !localSearch}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Table */}
          <Card className="animate-fade-in">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Catálogo de Productos</CardTitle>
                  <CardDescription>
                    {filteredProducts.length} productos {hasNextPage && '(hay más disponibles)'}
                  </CardDescription>
                </div>
                <ToggleGroup 
                  type="single" 
                  value={viewMode} 
                  onValueChange={(value) => value && setViewMode(value as ViewMode)}
                  className="bg-muted rounded-lg p-1"
                >
                  <ToggleGroupItem value="table" aria-label="Vista de tabla" className="data-[state=on]:bg-background">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="grid" aria-label="Vista de cuadrícula" className="data-[state=on]:bg-background">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={5} columns={6} />
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No hay productos"
                  description="No se encontraron productos que coincidan con los filtros aplicados"
                />
              ) : viewMode === 'table' ? (
                <div className="space-y-4">
                  <DataTable
                    data={filteredProducts}
                    columns={productColumns}
                    searchable={false}
                    emptyMessage="No hay productos"
                    emptyDescription="No se encontraron productos"
                    onRowClick={handleProductClick}
                  />
                  
                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          'Cargar más productos'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <Card 
                        key={product.sku} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleProductClick(product)}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-3">
                            <Package className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.nombre}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{product.marca} • {product.categoria}</p>
                          <p className="font-bold text-primary">
                            {product.precio != null 
                              ? `$${product.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                              : '-'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          'Cargar más productos'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="space-y-6">
          {/* Error Alert */}
          {globalTotals.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al cargar totales globales</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{globalTotals.error.message || 'No se pudieron cargar los datos de inventario global. Por favor intenta de nuevo.'}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="ml-4 shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Global KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {globalTotals.isLoading ? (
              <>
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
                <KPISkeleton />
              </>
            ) : globalTotals.error ? (
              // Show empty KPIs when there's an error
              <>
                <KPICard data={{ label: "Valor Total Global", value: 0, format: "currency" }} className="opacity-50" />
                <KPICard data={{ label: "Productos Únicos", value: 0, format: "number" }} className="opacity-50" />
                <KPICard data={{ label: "Total de Unidades", value: 0, format: "number" }} className="opacity-50" />
                <KPICard data={{ label: "Sucursales Activas", value: 0, format: "number" }} className="opacity-50" />
              </>
            ) : (
              <>
                <KPICard data={{
                  label: "Valor Total Global",
                  value: globalTotals.totalStockValue,
                  format: "currency",
                }} />
                <KPICard data={{
                  label: "Productos Únicos",
                  value: globalTotals.uniqueProducts,
                  format: "number",
                }} />
                <KPICard data={{
                  label: "Total de Unidades",
                  value: globalTotals.totalItems,
                  format: "number",
                }} />
                <KPICard data={{
                  label: "Sucursales Activas",
                  value: globalTotals.warehouseCount,
                  format: "number",
                }} />
              </>
            )}
          </div>

          {/* Breakdown by Warehouse */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Sucursal</CardTitle>
              <CardDescription>Distribución del inventario por sucursal</CardDescription>
            </CardHeader>
            <CardContent>
              {globalTotals.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : Object.keys(globalTotals.byWarehouse).length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Sin datos de inventario"
                  description="No se encontraron registros de inventario global"
                />
              ) : (
                <div className="space-y-4">
                  {Object.entries(globalTotals.byWarehouse).map(([warehouseId, data]) => (
                    <div key={warehouseId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{data.nombre}</p>
                          <p className="text-sm text-muted-foreground">Código: {warehouseId}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-right">
                        <div>
                          <p className="text-sm text-muted-foreground">Productos</p>
                          <p className="font-semibold">{data.productos.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Unidades</p>
                          <p className="font-semibold">{data.unidades.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Valor</p>
                          <p className="font-semibold">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Product Detail Modal - Ahora recibe SKU en lugar de item */}
      <ProductDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        sku={selectedSku}
      />
    </div>
  );
}
