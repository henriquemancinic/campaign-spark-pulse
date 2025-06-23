
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Database, Users, Mail, Settings, Calendar, Shield, Key, FileText } from 'lucide-react';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">EmailPro - Documentação Completa</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema completo de gerenciamento de campanhas de email marketing com autenticação, 
            configuração de SMTP, listas de contatos e envio automatizado.
          </p>
        </div>

        {/* Índice */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Índice da Documentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Funcionalidades</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Autenticação e Autorização</li>
                  <li>• Gerenciamento de Usuários</li>
                  <li>• Configuração de Email</li>
                  <li>• Listas de Email</li>
                  <li>• Campanhas de Email</li>
                  <li>• Painel Administrativo</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Estrutura Técnica</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Arquitetura do Sistema</li>
                  <li>• Banco de Dados</li>
                  <li>• Segurança e RLS</li>
                  <li>• Fluxos de Trabalho</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visão Geral do Sistema */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Visão Geral do Sistema</CardTitle>
            <CardDescription>
              O EmailPro é uma plataforma completa para gerenciamento de campanhas de email marketing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              O sistema permite que usuários configurem suas contas de email SMTP, criem listas de contatos, 
              desenvolvam campanhas personalizadas e acompanhem o envio automatizado de emails com controle 
              de velocidade e intervalos.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold">Segurança</h4>
                <p className="text-sm text-gray-600">Autenticação robusta com tokens de expiração</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold">Email Marketing</h4>
                <p className="text-sm text-gray-600">Campanhas automatizadas e personalizadas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold">Gestão</h4>
                <p className="text-sm text-gray-600">Controle completo de usuários e permissões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionalidades Detalhadas */}
        <div className="space-y-8">
          
          {/* Autenticação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Autenticação e Autorização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Tipos de Usuário</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Admin</Badge>
                      <span className="text-sm">Token sem expiração, acesso total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">User</Badge>
                      <span className="text-sm">Token válido por 7 dias</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Regras de Cadastro</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Primeiro usuário = Admin automático</li>
                    <li>• Demais usuários = User padrão</li>
                    <li>• Sem verificação de email</li>
                    <li>• Login direto após cadastro</li>
                  </ul>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Telas de Autenticação</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium">/login</h5>
                    <p className="text-sm text-gray-600">Email e senha para acesso</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium">/register</h5>
                    <p className="text-sm text-gray-600">Nome, CPF, empresa, usuário, email e senha</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Dashboard Principal (/dashboard)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Painel principal com visão geral das atividades, estatísticas e ações rápidas.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h5 className="font-semibold">Estatísticas</h5>
                  <ul className="text-sm text-gray-600 mt-2">
                    <li>• Total de listas de email</li>
                    <li>• Campanhas ativas</li>
                    <li>• Emails enviados no mês</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h5 className="font-semibold">Ações Rápidas</h5>
                  <ul className="text-sm text-gray-600 mt-2">
                    <li>• Configurar Email</li>
                    <li>• Criar Lista</li>
                    <li>• Nova Campanha</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h5 className="font-semibold">Atividades Recentes</h5>
                  <ul className="text-sm text-gray-600 mt-2">
                    <li>• Campanhas agendadas</li>
                    <li>• Listas criadas</li>
                    <li>• Envios completados</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuração de Email (/email-config)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Configuração dos parâmetros SMTP necessários para envio de emails.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Campos Obrigatórios</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• <strong>Servidor SMTP:</strong> Ex: smtp.gmail.com</li>
                    <li>• <strong>Porta:</strong> Padrão 587 (TLS)</li>
                    <li>• <strong>Usuário:</strong> Email de autenticação</li>
                    <li>• <strong>Senha:</strong> Senha ou token de app</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Regras de Negócio</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Uma configuração por usuário</li>
                    <li>• Dados criptografados no banco</li>
                    <li>• Teste de conexão antes de salvar</li>
                    <li>• Obrigatório para enviar campanhas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listas de Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Listas de Email (/email-lists)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Gerenciamento de listas de contatos para campanhas de email marketing.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Funcionalidades</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Criar listas personalizadas</li>
                    <li>• Importar emails em lote</li>
                    <li>• Validação automática de emails</li>
                    <li>• Editar e remover contatos</li>
                    <li>• Visualizar estatísticas da lista</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Validações</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Formato de email válido</li>
                    <li>• Remoção de duplicatas</li>
                    <li>• Nome da lista obrigatório</li>
                    <li>• Mínimo 1 email por lista</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campanhas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Campanhas de Email (/campaigns)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Criação e gerenciamento de campanhas de email marketing com envio automatizado.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Status das Campanhas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    <Badge variant="outline">Draft</Badge>
                    <Badge className="bg-blue-600">Scheduled</Badge>
                    <Badge className="bg-yellow-600">Sending</Badge>
                    <Badge className="bg-green-600">Completed</Badge>
                    <Badge variant="destructive">Failed</Badge>
                    <Badge className="bg-orange-600">Paused</Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Configurações de Envio</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• <strong>Intervalo entre lotes:</strong> Em minutos</li>
                      <li>• <strong>Emails por lote:</strong> Controle de velocidade</li>
                      <li>• <strong>Data de agendamento:</strong> Opcional</li>
                      <li>• <strong>Lista de destino:</strong> Obrigatória</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Monitoramento</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Emails enviados vs total</li>
                      <li>• Progresso em tempo real</li>
                      <li>• Log de erros e sucessos</li>
                      <li>• Pausar/retomar envios</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Painel Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Painel Administrativo (/admin)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-800 font-medium">🔒 Acesso Restrito a Administradores</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Gerenciamento de Usuários</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Visualizar todos os usuários</li>
                    <li>• Alterar roles (User/Admin)</li>
                    <li>• Estender tokens de acesso</li>
                    <li>• Desativar/ativar contas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Métricas do Sistema</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Total de usuários ativos</li>
                    <li>• Campanhas em execução</li>
                    <li>• Volume de emails enviados</li>
                    <li>• Performance do sistema</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banco de Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Estrutura do Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Diagrama de Relacionamentos */}
              <div>
                <h4 className="font-semibold mb-4">Relacionamentos entre Tabelas</h4>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
{`auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
├── email_configs (1:1)
├── email_lists (1:N)
│   └── campaigns (N:1)
└── campaigns (1:N)`}
                  </pre>
                </div>
              </div>

              {/* Tabelas Detalhadas */}
              <div className="space-y-4">
                
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">profiles</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Campos:</strong>
                      <ul className="text-gray-600 mt-1">
                        <li>• id (UUID, PK, FK → auth.users)</li>
                        <li>• name (TEXT)</li>
                        <li>• cpf (TEXT, nullable)</li>
                        <li>• company (TEXT)</li>
                        <li>• username (TEXT)</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Controle:</strong>
                      <ul className="text-gray-600 mt-1">
                        <li>• role (ENUM: user, admin)</li>
                        <li>• token_expiry (TIMESTAMP)</li>
                        <li>• last_login (TIMESTAMP)</li>
                        <li>• created_at, updated_at</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">email_configs</h5>
                  <div className="text-sm">
                    <strong>Campos:</strong>
                    <ul className="text-gray-600 mt-1">
                      <li>• id (UUID, PK), user_id (UUID, FK → profiles)</li>
                      <li>• smtp_server (TEXT), port (INTEGER, default: 587)</li>
                      <li>• username (TEXT), password (TEXT - criptografado)</li>
                      <li>• created_at, updated_at</li>
                    </ul>
                    <p className="text-orange-600 mt-2"><strong>Unique:</strong> user_id (um config por usuário)</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">email_lists</h5>
                  <div className="text-sm">
                    <strong>Campos:</strong>
                    <ul className="text-gray-600 mt-1">
                      <li>• id (UUID, PK), user_id (UUID, FK → profiles)</li>
                      <li>• name (TEXT), emails (TEXT[] - array de emails)</li>
                      <li>• created_at, updated_at</li>
                    </ul>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">campaigns</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Identificação:</strong>
                      <ul className="text-gray-600 mt-1">
                        <li>• id (UUID, PK)</li>
                        <li>• user_id (FK → profiles)</li>
                        <li>• email_list_id (FK → email_lists)</li>
                        <li>• name, subject, message</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Controle de Envio:</strong>
                      <ul className="text-gray-600 mt-1">
                        <li>• status (ENUM)</li>
                        <li>• scheduled_for (TIMESTAMP)</li>
                        <li>• send_interval, emails_per_batch</li>
                        <li>• sent_count, total_emails</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* RLS */}
              <div>
                <h4 className="font-semibold mb-2">Row Level Security (RLS)</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Profiles:</strong> Usuários podem ver todos os perfis, editar apenas o próprio</li>
                    <li>• <strong>Email Configs:</strong> Usuários acessam apenas suas configurações</li>
                    <li>• <strong>Email Lists:</strong> Usuários gerenciam apenas suas listas</li>
                    <li>• <strong>Campaigns:</strong> Usuários controlam apenas suas campanhas</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fluxos de Trabalho */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxos de Trabalho Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">1. Fluxo de Cadastro e Primeiro Acesso</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Registro → Login Automático → Dashboard → Configurar Email → Criar Lista → Primeira Campanha
                  </p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold">2. Fluxo de Criação de Campanha</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Verificar Config Email → Selecionar Lista → Criar Campanha → Configurar Envio → Agendar/Enviar
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold">3. Fluxo Administrativo</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Painel Admin → Gerenciar Usuários → Renovar Tokens → Monitorar Sistema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tecnologias */}
          <Card>
            <CardHeader>
              <CardTitle>Stack Tecnológico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Frontend</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• React 18 + TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• Shadcn/UI Components</li>
                    <li>• React Router DOM</li>
                    <li>• Lucide React Icons</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Backend</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Supabase (PostgreSQL)</li>
                    <li>• Row Level Security</li>
                    <li>• Triggers e Functions</li>
                    <li>• Auth JWT</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Integrações</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SMTP Servers</li>
                    <li>• Email Validation</li>
                    <li>• Batch Processing</li>
                    <li>• Real-time Updates</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-gray-500">
            EmailPro - Sistema de Email Marketing | Documentação atualizada em {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
