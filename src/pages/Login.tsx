
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with email:', credentials.email);
      
      const success = await login(credentials.email, credentials.password);
      
      if (success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta!",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Falha no login",
          description: "Email ou senha incorretos. Verifique suas credenciais.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">EmailPro Login</CardTitle>
          <CardDescription>
            Digite suas credenciais para acessar seu painel de email marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
