
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Users, Settings, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    {
      title: 'Email Lists',
      value: '0',
      description: 'Active email lists',
      icon: Users,
      action: () => navigate('/email-lists'),
    },
    {
      title: 'Campaigns',
      value: '0',
      description: 'Total campaigns',
      icon: Mail,
      action: () => navigate('/campaigns'),
    },
    {
      title: 'Emails Sent',
      value: '0',
      description: 'This month',
      icon: Calendar,
      action: () => navigate('/campaigns'),
    },
  ]);

  // Carregar estatísticas reais do banco
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        // Buscar número de listas de email
        const { count: emailListsCount } = await supabase
          .from('email_lists')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Buscar número de campanhas
        const { count: campaignsCount } = await supabase
          .from('campaigns')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Buscar total de emails enviados (soma dos sent_count)
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('sent_count')
          .eq('user_id', user.id);

        const totalEmailsSent = campaignsData?.reduce((sum, campaign) => sum + campaign.sent_count, 0) || 0;

        setStats([
          {
            title: 'Email Lists',
            value: String(emailListsCount || 0),
            description: 'Active email lists',
            icon: Users,
            action: () => navigate('/email-lists'),
          },
          {
            title: 'Campaigns',
            value: String(campaignsCount || 0),
            description: 'Total campaigns',
            icon: Mail,
            action: () => navigate('/campaigns'),
          },
          {
            title: 'Emails Sent',
            value: totalEmailsSent.toLocaleString(),
            description: 'Total sent',
            icon: Calendar,
            action: () => navigate('/campaigns'),
          },
        ]);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    };

    loadStats();
  }, [user, navigate]);

  const quickActions = [
    {
      title: 'Configure Email',
      description: 'Set up your SMTP settings',
      icon: Settings,
      action: () => navigate('/email-config'),
    },
    {
      title: 'Create Email List',
      description: 'Build a new subscriber list',
      icon: Users,
      action: () => navigate('/email-lists'),
    },
    {
      title: 'New Campaign',
      description: 'Start a new email campaign',
      icon: Mail,
      action: () => navigate('/campaigns'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-4">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-blue-100 text-lg">
            Manage your email marketing campaigns with powerful tools and analytics.
          </p>
          <div className="mt-4 text-sm text-blue-200">
            Token expires: {user ? new Date(user.tokenExpiry).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={stat.action}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button onClick={action.action} className="w-full">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest email marketing activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Campaign "Newsletter Q4" scheduled</p>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">New email list "Customers 2024" created</p>
                <p className="text-sm text-gray-500">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Campaign "Product Launch" completed</p>
                <p className="text-sm text-gray-500">3 days ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
