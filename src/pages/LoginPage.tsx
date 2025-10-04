import { Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { isAuthenticated, login, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <LoginForm onLogin={login} />
    </div>
  );
}