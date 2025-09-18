import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package } from 'lucide-react';
import { mockUsers } from '../../data/mockData';
interface LoginFormProps {
  onLogin: (email: string, password: string) => boolean;
}
export function LoginForm({
  onLogin
}: LoginFormProps) {
  const [email, setEmail] = useState('admin@refaccionaria.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const success = onLogin(email, password);
    if (!success) {
      setError('Credenciales inválidas. Intenta con un usuario válido.');
    }
    setIsLoading(false);
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Moncar</CardTitle>
            <CardDescription>
              Sistema de gestión para refaccionaria
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
            </div>

            {error && <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground text-center">Usuarios sugeridos??:</p>
            <div className="space-y-2 text-xs">
              {mockUsers.map(user => <div key={user.id} className="flex justify-between p-2 bg-muted rounded cursor-pointer hover:bg-muted/80" onClick={() => {
              setEmail(user.email);
              setPassword('password');
            }}>
                  <span>{user.email}</span>
                  <span className="capitalize text-primary">{user.role}</span>
                </div>)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}