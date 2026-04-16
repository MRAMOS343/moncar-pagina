import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TicketModal } from '@/components/modals/TicketModal';
import { TicketCard } from '@/components/modals/TicketCard';
import { TicketFilters } from '@/components/modals/TicketFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from '@/types';
import { Plus, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { KPISkeleton } from '@/components/ui/kpi-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { showInfoToast } from '@/utils/toastHelpers';
import { toast } from 'sonner';
import { useTickets, useCreateTicket, usePatchTicket } from '@/hooks/useTickets';
import type { TicketDB } from '@/types/tickets';
import type { TicketFormData } from '@/schemas';

// Adapta el shape de BD al shape legacy que usan TicketCard/TicketFilters
function toTicket(t: TicketDB): Ticket {
  return {
    id:            t.ticket_id,
    titulo:        t.titulo,
    descripcion:   t.descripcion,
    categoria:     t.categoria,
    prioridad:     t.prioridad,
    estado:        t.estado,
    userId:        t.usuario_id,
    usuarioNombre: t.usuario_nombre,
    metadata:      t.metadata as Ticket['metadata'],
    createdAt:     t.created_at,
    updatedAt:     t.updated_at,
  };
}

export default function SoportePage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'gerente';

  const [ticketModalOpen, setTicketModalOpen]   = useState(false);
  const [selectedTicket, setSelectedTicket]     = useState<Ticket | undefined>();
  const [searchQuery, setSearchQuery]           = useState('');
  const [statusFilter, setStatusFilter]         = useState<TicketStatus | 'todos'>('todos');
  const [priorityFilter, setPriorityFilter]     = useState<TicketPriority | 'todos'>('todos');
  const [categoryFilter, setCategoryFilter]     = useState<TicketCategory | 'todos'>('todos');

  const { data, isLoading } = useTickets();
  const createTicket = useCreateTicket();
  const patchTicket  = usePatchTicket();

  const tickets: Ticket[] = useMemo(
    () => (data?.items ?? []).map(toTicket),
    [data]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (!isAdmin && ticket.userId !== currentUser?.id) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!ticket.titulo.toLowerCase().includes(q) && !ticket.descripcion.toLowerCase().includes(q)) return false;
      }
      if (statusFilter   !== 'todos' && ticket.estado    !== statusFilter)   return false;
      if (priorityFilter !== 'todos' && ticket.prioridad !== priorityFilter) return false;
      if (categoryFilter !== 'todos' && ticket.categoria !== categoryFilter) return false;
      return true;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter, isAdmin, currentUser]);

  const stats = useMemo(() => {
    const visible = isAdmin ? tickets : tickets.filter(t => t.userId === currentUser?.id);
    return {
      total:      visible.length,
      abiertos:   visible.filter(t => t.estado === 'abierto').length,
      enProgreso: visible.filter(t => t.estado === 'en_progreso').length,
      resueltos:  visible.filter(t => t.estado === 'resuelto').length,
    };
  }, [tickets, isAdmin, currentUser]);

  const handleCreateTicket = (data: TicketFormData) => {
    createTicket.mutate(
      {
        titulo:      data.titulo,
        descripcion: data.descripcion,
        categoria:   data.categoria,
        prioridad:   data.prioridad,
        metadata: {
          navegador:  navigator.userAgent,
          dispositivo: /Mobile/.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          url:        window.location.pathname,
        },
      },
      {
        onSuccess: () => toast.success('Ticket creado'),
        onError:   () => toast.error('Error al crear el ticket'),
      }
    );
  };

  const handleTicketClick = (ticket: Ticket) => {
    showInfoToast(ticket.titulo, `Estado: ${ticket.estado} | Prioridad: ${ticket.prioridad}`);
  };

  const handleStatusChange = (ticket: Ticket, estado: TicketStatus) => {
    patchTicket.mutate(
      { id: ticket.id, data: { estado } },
      {
        onSuccess: () => toast.success('Ticket actualizado'),
        onError:   () => toast.error('Error al actualizar el ticket'),
      }
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('todos');
    setPriorityFilter('todos');
    setCategoryFilter('todos');
  };

  return (
    <main role="main" aria-label="Contenido principal">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Soporte Técnico</h1>
            <p className="text-muted-foreground">Gestiona tus tickets y consultas</p>
          </div>
          <Button
            onClick={() => { setSelectedTicket(undefined); setTicketModalOpen(true); }}
            className="gap-2 btn-hover"
          >
            <Plus className="h-4 w-4" />
            Nuevo Ticket
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {isLoading ? (
            <><KPISkeleton /><KPISkeleton /><KPISkeleton /><KPISkeleton /></>
          ) : (
            <>
              <Card className="card-hover animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
              </Card>

              <Card className="card-hover animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
                  <AlertCircle className="h-4 w-4 text-info" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.abiertos}</div></CardContent>
              </Card>

              <Card className="card-hover animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.enProgreso}</div></CardContent>
              </Card>

              <Card className="card-hover animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{stats.resueltos}</div></CardContent>
              </Card>
            </>
          )}
        </div>

        <TicketFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onClearFilters={handleClearFilters}
        />

        <Card className="card-hover animate-fade-in">
          <CardHeader>
            <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
            <CardDescription>
              {isAdmin ? 'Todos los tickets de soporte del sistema' : 'Tus tickets de soporte'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <KPISkeleton /><KPISkeleton />
              </div>
            ) : filteredTickets.length === 0 ? (
              <EmptyState
                icon={AlertCircle}
                title="No hay tickets"
                description={
                  searchQuery || statusFilter !== 'todos' || priorityFilter !== 'todos' || categoryFilter !== 'todos'
                    ? 'No se encontraron tickets con los filtros aplicados.'
                    : 'Crea tu primer ticket para empezar.'
                }
                action={{ label: "Crear ticket", onClick: () => setTicketModalOpen(true) }}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => handleTicketClick(ticket)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TicketModal
          open={ticketModalOpen}
          onOpenChange={setTicketModalOpen}
          ticket={selectedTicket}
          onSubmit={handleCreateTicket}
        />
      </div>
    </main>
  );
}
