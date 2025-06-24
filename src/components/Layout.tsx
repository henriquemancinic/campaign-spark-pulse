
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, User, Settings, Users, LogOut, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não há usuário ou está em páginas de auth/doc, apenas renderize as children
  if (!user || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/doc') {
    return <>{children}</>;
  }

  const navigationItems = [
    { path: '/dashboard', label: 'Painel', icon: Mail },
    { path: '/email-config', label: 'Config. Email', icon: Settings },
    { path: '/email-lists', label: 'Listas de Email', icon: Mail },
    { path: '/campaigns', label: 'Campanhas', icon: Mail },
    { path: '/doc', label: 'Documentação', icon: FileText },
  ];

  if (user.role === 'admin') {
    navigationItems.splice(-1, 0, { path: '/admin', label: 'Painel Admin', icon: Users });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-primary">EmailPro</h1>
              <nav className="hidden md:flex space-x-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === item.path
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user.name}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {user.role}
                </span>
                {user.tokenExpiry && (
                  <span className="text-xs text-gray-500">
                    Token expira: {user.tokenExpiry.toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
