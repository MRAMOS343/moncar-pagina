import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Props {
  showOnlyCancelled: boolean;
  setShowOnlyCancelled: (val: boolean) => void;
}

export function VentasFilters({ showOnlyCancelled, setShowOnlyCancelled }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="only-cancelled"
        checked={showOnlyCancelled}
        onCheckedChange={setShowOnlyCancelled}
      />
      <Label htmlFor="only-cancelled" className="text-sm cursor-pointer">
        Solo canceladas
      </Label>
    </div>
  );
}
