import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package } from 'lucide-react';
import { mockUsers } from '../../data/mockData';
import { Badge } from '@/components/ui/badge';
import { CardFooter } from '@/components/ui/card';
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
      <Card className="w-full max-w-md animate-fade-in shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-red-600">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Moncar</CardTitle>
            <CardDescription>v4.5</CardDescription>
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

            <Button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-500">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground mb-3">Usuarios de prueba:</p>
            <div className="space-y-2">
              {mockUsers.map(user => <div key={user.id} className="flex justify-between items-center p-2 rounded hover:bg-accent transition-colors cursor-pointer group" onClick={() => {
              setEmail(user.email);
              setPassword('password');
            }}>
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{user.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {user.role}
                  </Badge>
                </div>)}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Sistema de Gestión Moncar - v4.5
          </p>
        </CardFooter>
      </Card>
    </div>;
}