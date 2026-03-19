import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface Props {
  isMobile: boolean;
  includeCancelled: boolean;
  setIncludeCancelled: (val: boolean) => void;
  setDateRange: (val: string) => void;
}

export function VentasFilters({ isMobile, includeCancelled, setIncludeCancelled, setDateRange }: Props) {
  if (isMobile) {
    return (
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
              <div className="flex items-center justify-between">
                <Label htmlFor="include-cancelled-mobile" className="text-base font-medium">
                  Incluir canceladas
                </Label>
                <Switch
                  id="include-cancelled-mobile"
                  checked={includeCancelled}
                  onCheckedChange={setIncludeCancelled}
                />
              </div>
              <Button
                onClick={() => {
                  setIncludeCancelled(false);
                  setDateRange('30d');
                }}
                variant="outline"
                className="w-full mobile-button"
              >
                Limpiar filtros
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros Adicionales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="include-cancelled"
              checked={includeCancelled}
              onCheckedChange={setIncludeCancelled}
            />
            <Label htmlFor="include-cancelled">Incluir ventas canceladas</Label>
          </div>
          {includeCancelled && (
            <Button
              onClick={() => setIncludeCancelled(false)}
              variant="ghost"
              size="sm"
            >
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
