import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface SetPasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
  error: string | null;
}

function getPasswordStrength(pass: string): 0 | 1 | 2 | 3 | 4 {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.length >= 12) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const strengthLabels: Record<number, string> = {
  0: "",
  1: "Muy débil",
  2: "Débil",
  3: "Buena",
  4: "Fuerte",
};

const strengthColors: Record<number, string> = {
  0: "bg-muted",
  1: "bg-destructive",
  2: "bg-orange-500",
  3: "bg-yellow-500",
  4: "bg-green-500",
};

export function SetPasswordForm({ onSubmit, error }: SetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const canSubmit = password.length >= 8 && password === confirm && !loading;
  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onSubmit(password);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
      <div className="space-y-2">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            disabled={loading}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${strengthColors[strength]}`}
                style={{ width: `${(strength / 4) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Fortaleza: {strengthLabels[strength]}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar contraseña</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading}
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            aria-invalid={mismatch}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowConfirm(!showConfirm)}
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mismatch && (
          <p className="text-sm text-destructive">Las contraseñas no coinciden</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-red-600 hover:bg-red-500"
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Activar mi cuenta
      </Button>
    </form>
  );
}
