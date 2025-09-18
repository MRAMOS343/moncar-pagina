import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/ui/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Upload, AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { mockProducts, mockInventory, mockWarehouses, getProductById, getWarehouseById } from '../data/mockData';
import { Product, Inventory, User, KPIData } from '../types';
import { toast } from '@/hooks/use-toast';

interface ContextType {
  currentWarehouse: string;
  searchQuery: string;
  currentUser: User;
}

export default function InventarioPage() {
  const { currentWarehouse, searchQuery, currentUser } = useOutletContext<ContextType>();
  const [selectedMarca, setSelectedMarca] = useState<string>('all');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('nombre');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Get unique brands and categories for filters
  const marcas = [...new Set(mockProducts.map(p => p.marca))];
  const categorias = [...new Set(mockProducts.map(p => p.categoria))];

  // Filter and sort inventory data
  const filteredInventory = useMemo(() => {
    return mockInventory
      .filter(inv => inv.warehouseId === currentWarehouse)
      .map(inv => {
        const product = getProductById(inv.productId);
        return { ...inv, product };
      })
      .filter(item => {
        if (!item.product) return false;
        
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
        if (selectedMarca && selectedMarca !== 'all' && item.product.marca !== selectedMarca) return false;
        
        // Category filter
        if (selectedCategoria && selectedCategoria !== 'all' && item.product.categoria !== selectedCategoria) return false;
        
        return true;
      })
      .sort((a, b) => {
        if (!a.product || !b.product) return 0;
        
        let aValue: any = a.product[sortField as keyof Product] || a[sortField as keyof Inventory];
        let bValue: any = b.product[sortField as keyof Product] || b[sortField as keyof Inventory];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [currentWarehouse, searchQuery, selectedMarca, selectedCategoria, sortField, sortDirection]);

  // Calculate KPIs
  const kpis: KPIData[] = useMemo(() => {
    const warehouseInventory = mockInventory.filter(inv => inv.warehouseId === currentWarehouse);
    
    const lowStockItems = warehouseInventory.filter(inv => {
      const product = getProductById(inv.productId);
      return product && inv.onHand <= product.reorderPoint;
    }).length;

    const totalItems = warehouseInventory.reduce((sum, inv) => sum + inv.onHand, 0);

    // Mock rotation calculation
    const avgRotation = 2.3;

    return [
      {
        label: 'Ítems en Bajo Stock',
        value: lowStockItems,
        changeType: lowStockItems > 5 ? 'negative' : 'positive',
        change: -12.5,
        format: 'number'
      },
      {
        label: 'Stock Total',
        value: totalItems,
        changeType: 'positive',
        change: 8.2,
        format: 'number'
      },
      {
        label: 'Rotación Promedio',
        value: avgRotation,
        changeType: 'positive',
        change: 5.1,
        format: 'number'
      }
    ];
  }, [currentWarehouse]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    toast({
      title: "Exportación iniciada",
      description: "Generando archivo CSV...",
    });
    // Mock export functionality
  };

  const handleImportCSV = () => {
    if (currentUser.role === 'cajero') {
      toast({
        title: "Acceso denegado",
        description: "Solo gerentes y administradores pueden importar datos.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Función disponible próximamente",
      description: "La importación de CSV será implementada en la siguiente versión.",
    });
  };

  const getStockStatusBadge = (inv: Inventory & { product?: Product }) => {
    if (!inv.product) return <Badge variant="outline">Sin datos</Badge>;
    
    if (inv.onHand <= 0) {
      return <Badge variant="destructive">Sin stock</Badge>;
    } else if (inv.onHand <= inv.product.reorderPoint) {
      return <Badge variant="destructive">Bajo stock</Badge>;
    } else if (inv.onHand <= inv.product.reorderPoint * 1.5) {
      return <Badge variant="secondary">Stock normal</Badge>;
    } else {
      return <Badge variant="default">Stock alto</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">
            Gestión de productos en {getWarehouseById(currentWarehouse)?.nombre}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button 
            onClick={handleImportCSV} 
            variant="outline" 
            size="sm"
            disabled={currentUser.role === 'cajero'}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={index} data={kpi} />
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra el inventario por marca, categoría y otros criterios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Marca</label>
              <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las marcas</SelectItem>
                  {marcas.map(marca => (
                    <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input 
                placeholder="SKU, nombre o marca..." 
                value={searchQuery}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSelectedMarca('all');
                  setSelectedCategoria('all');
                }} 
                variant="outline"
                className="w-full"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="data-table">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Productos en Inventario</CardTitle>
              <CardDescription>
                {filteredInventory.length} productos encontrados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('sku')}
                  >
                    SKU
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('nombre')}
                  >
                    Producto
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('marca')}
                  >
                    Marca
                  </TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((inv) => {
                  const product = inv.product!;
                  const disponible = inv.onHand - inv.reserved;
                  
                  return (
                    <TableRow key={`${inv.productId}-${inv.warehouseId}`} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.unidad}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.marca}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${product.precio.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {inv.onHand}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {inv.reserved}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={disponible <= 0 ? 'text-destructive font-medium' : ''}>
                          {disponible}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStockStatusBadge(inv)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}