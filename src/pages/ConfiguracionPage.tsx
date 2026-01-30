import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { userProfileSchema, UserProfileFormData } from '@/schemas/userProfileSchema';
import { 
  useUserPreferences, 
  useUpdatePreferences, 
  useUpdateProfile,
  useCompanySettings,
  useUpdateCompanySettings,
  useInventorySettings,
  useUpdateInventorySettings
} from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Building2, Package, Shield, Settings, Loader2 } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/utils/toastHelpers";

export default function ConfiguracionPage() {
  const { currentUser, updateUserRole } = useAuth();
  
  // Control de acceso por rol
  const canManageSettings = currentUser?.role === 'admin' || currentUser?.role === 'gerente';
  
  // === Hooks de datos ===
  const { data: preferences, isLoading: loadingPrefs } = useUserPreferences();
  const updatePrefs = useUpdatePreferences();
  const updateProfile = useUpdateProfile();
  
  const { data: companySettings, isLoading: loadingCompany } = useCompanySettings();
  const updateCompany = useUpdateCompanySettings();
  
  const { data: inventorySettings, isLoading: loadingInventory } = useInventorySettings();
  const updateInventory = useUpdateInventorySettings();
  
  // Formulario de Perfil con validación
  const profileForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      nombre: currentUser?.nombre || "",
      email: currentUser?.email || "",
      telefono: ""
    }
  });

  // Formulario de Empresa
  const companyForm = useForm({
    defaultValues: {
      nombre_empresa: "",
      rfc: "",
      direccion: "",
      telefono: "",
    }
  });

  // Formulario de Inventario
  const inventoryForm = useForm({
    defaultValues: {
      stock_minimo_global: 10,
      alertas_activas: true,
      formato_sku: "AUTO-####",
    }
  });

  // Sincronizar datos del backend con formularios
  useEffect(() => {
    if (companySettings) {
      companyForm.reset({
        nombre_empresa: companySettings.nombre_empresa || "",
        rfc: companySettings.rfc || "",
        direccion: companySettings.direccion || "",
        telefono: companySettings.telefono || "",
      });
    }
  }, [companySettings, companyForm]);

  useEffect(() => {
    if (inventorySettings) {
      inventoryForm.reset({
        stock_minimo_global: inventorySettings.stock_minimo_global || 10,
        alertas_activas: inventorySettings.alertas_activas ?? true,
        formato_sku: inventorySettings.formato_sku || "AUTO-####",
      });
    }
  }, [inventorySettings, inventoryForm]);

  // === Handlers ===
  const handleSaveProfile = profileForm.handleSubmit((data: UserProfileFormData) => {
    updateProfile.mutate(
      { nombre: data.nombre, telefono: data.telefono },
      {
        onSuccess: () => showSuccessToast("Perfil actualizado", "Los cambios se han guardado correctamente."),
        onError: () => showErrorToast("Error", "No se pudo guardar el perfil."),
      }
    );
  });

  const handleTogglePreference = (key: string, value: boolean) => {
    updatePrefs.mutate(
      { [key]: value },
      {
        onSuccess: () => showSuccessToast("Preferencia actualizada"),
        onError: () => showErrorToast("Error", "No se pudo guardar la preferencia."),
      }
    );
  };

  const handleSaveCompany = companyForm.handleSubmit((data) => {
    updateCompany.mutate(data, {
      onSuccess: () => showSuccessToast("Configuración de empresa actualizada"),
      onError: () => showErrorToast("Error", "No se pudo guardar la configuración."),
    });
  });

  const handleSaveInventory = inventoryForm.handleSubmit((data) => {
    updateInventory.mutate(data, {
      onSuccess: () => showSuccessToast("Configuración de inventario actualizada"),
      onError: () => showErrorToast("Error", "No se pudo guardar la configuración."),
    });
  });

  // Skeleton para loading
  const SettingsSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
    </div>
  );

  return (
    <main role="main" aria-label="Contenido principal">
      <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Gestiona las preferencias y configuraciones del sistema
        </p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        <TabsList className={`grid w-full ${canManageSettings ? 'grid-cols-5' : 'grid-cols-3'}`}>
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          {canManageSettings && (
            <>
              <TabsTrigger value="empresa" className="gap-2">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>
              <TabsTrigger value="inventario" className="gap-2">
                <Package className="h-4 w-4" />
                Inventario
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="permisos" className="gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="sistema" className="gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Pestaña: Perfil de Usuario */}
        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información de perfil y preferencias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    {...profileForm.register('nombre')}
                  />
                  {profileForm.formState.errors.nombre && (
                    <p className="text-sm text-destructive">{profileForm.formState.errors.nombre.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register('email')}
                    disabled
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  {...profileForm.register('telefono')}
                  placeholder="55-1234-5678"
                />
                {profileForm.formState.errors.telefono && (
                  <p className="text-sm text-destructive">{profileForm.formState.errors.telefono.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol actual</Label>
                <Select value={currentUser?.role} onValueChange={(value) => updateUserRole(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="cajero">Cajero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSaveProfile} 
                className="btn-hover"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar cambios
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>
                Configura qué alertas deseas recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPrefs ? (
                <SettingsSkeleton />
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de stock bajo</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibir notificaciones cuando el inventario esté bajo
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.alert_stock_bajo ?? true}
                      onCheckedChange={(checked) => handleTogglePreference('alert_stock_bajo', checked)}
                      disabled={updatePrefs.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nuevas ventas</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar sobre cada venta realizada
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.alert_nuevas_ventas ?? true}
                      onCheckedChange={(checked) => handleTogglePreference('alert_nuevas_ventas', checked)}
                      disabled={updatePrefs.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nuevos proveedores</Label>
                      <p className="text-sm text-muted-foreground">
                        Alertas cuando se registren nuevos proveedores
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.alert_nuevos_proveedores ?? false}
                      onCheckedChange={(checked) => handleTogglePreference('alert_nuevos_proveedores', checked)}
                      disabled={updatePrefs.isPending}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reportes diarios</Label>
                      <p className="text-sm text-muted-foreground">
                        Resumen diario de actividad por email
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.alert_reportes_diarios ?? true}
                      onCheckedChange={(checked) => handleTogglePreference('alert_reportes_diarios', checked)}
                      disabled={updatePrefs.isPending}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Configuración de Empresa (solo admin/gerente) */}
        {canManageSettings && (
          <TabsContent value="empresa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Empresa</CardTitle>
                <CardDescription>
                  Información general y fiscal de tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingCompany ? (
                  <SettingsSkeleton />
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="nombreEmpresa">Nombre de la empresa</Label>
                      <Input
                        id="nombreEmpresa"
                        {...companyForm.register('nombre_empresa')}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rfc">RFC</Label>
                        <Input
                          id="rfc"
                          {...companyForm.register('rfc')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefonoEmpresa">Teléfono</Label>
                        <Input
                          id="telefonoEmpresa"
                          {...companyForm.register('telefono')}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="direccion">Dirección fiscal</Label>
                      <Textarea
                        id="direccion"
                        {...companyForm.register('direccion')}
                        rows={3}
                      />
                    </div>
                    <Button 
                      onClick={handleSaveCompany} 
                      className="btn-hover"
                      disabled={updateCompany.isPending}
                    >
                      {updateCompany.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Guardar cambios
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Pestaña: Configuración de Inventario (solo admin/gerente) */}
        {canManageSettings && (
          <TabsContent value="inventario" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Parámetros de Inventario</CardTitle>
                <CardDescription>
                  Configura alertas y formatos para la gestión de productos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingInventory ? (
                  <SettingsSkeleton />
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="stockMinimo">Stock mínimo global (unidades)</Label>
                      <Input
                        id="stockMinimo"
                        type="number"
                        {...inventoryForm.register('stock_minimo_global', { valueAsNumber: true })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Umbral predeterminado para alertas de inventario bajo
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertas automáticas</Label>
                        <p className="text-sm text-muted-foreground">
                          Activar notificaciones cuando el stock esté por debajo del mínimo
                        </p>
                      </div>
                      <Switch
                        checked={inventoryForm.watch('alertas_activas')}
                        onCheckedChange={(checked) => inventoryForm.setValue('alertas_activas', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formatoSKU">Formato de SKU</Label>
                      <Input
                        id="formatoSKU"
                        {...inventoryForm.register('formato_sku')}
                      />
                      <p className="text-sm text-muted-foreground">
                        Ejemplo: AUTO-#### genera códigos como AUTO-0001
                      </p>
                    </div>
                    <Button 
                      onClick={handleSaveInventory} 
                      className="btn-hover"
                      disabled={updateInventory.isPending}
                    >
                      {updateInventory.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Guardar configuración
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Pestaña: Roles y Permisos */}
        <TabsContent value="permisos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Roles</CardTitle>
              <CardDescription>
                Define los permisos para cada rol del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Administrador</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acceso completo a todas las funcionalidades del sistema
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Gestión de inventario</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Ventas y compras</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Reportes y predicciones</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Gestión de usuarios</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Configuración del sistema</Label>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Gerente</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Gestión de operaciones y supervisión de equipos
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Gestión de inventario</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Ventas y compras</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Reportes y predicciones</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <Label className="text-sm text-muted-foreground">Gestión de usuarios</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <Label className="text-sm text-muted-foreground">Configuración del sistema</Label>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Cajero</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Operaciones básicas de venta y consulta
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Consulta de inventario</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked disabled />
                      <Label className="text-sm">Registro de ventas</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <Label className="text-sm text-muted-foreground">Reportes y predicciones</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <Label className="text-sm text-muted-foreground">Gestión de usuarios</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch disabled />
                      <Label className="text-sm text-muted-foreground">Configuración del sistema</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Sistema */}
        <TabsContent value="sistema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Detalles técnicos y configuraciones avanzadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Versión</Label>
                  <p className="font-medium">1.0.0</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Último respaldo</Label>
                  <p className="font-medium">Hoy, 08:00</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Base de datos</Label>
                  <p className="font-medium">PostgreSQL</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">Usuarios activos</Label>
                  <p className="font-medium">3</p>
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full">
                  Exportar datos
                </Button>
                <Button variant="outline" className="w-full">
                  Limpiar caché
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </main>
  );
}
