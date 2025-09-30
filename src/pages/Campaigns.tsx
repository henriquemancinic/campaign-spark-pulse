import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Calendar, Settings, Play, Pause, Eye } from 'lucide-react';
import { EmailCampaign, EmailList } from '@/types/email';
import { supabase } from '@/integrations/supabase/client';

export default function Campaigns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    message: '',
    emailListId: '',
    scheduledFor: '',
    sendInterval: 5,
    emailsPerBatch: 10,
  });

  // Function to detect HTML tags in text
  const hasHtmlTags = (text: string): boolean => {
    const htmlTagRegex = /<\/?[a-z][\s\S]*>/i;
    return htmlTagRegex.test(text);
  };

  useEffect(() => {
    loadCampaigns();
    loadEmailLists();
  }, [user?.id]);

  const loadCampaigns = () => {
    const savedCampaigns = localStorage.getItem(`emailCampaigns_${user?.id}`);
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns));
    }
  };

  const loadEmailLists = () => {
    const savedLists = localStorage.getItem(`emailLists_${user?.id}`);
    if (savedLists) {
      setEmailLists(JSON.parse(savedLists));
    }
  };

  const saveCampaigns = (updatedCampaigns: EmailCampaign[]) => {
    localStorage.setItem(`emailCampaigns_${user?.id}`, JSON.stringify(updatedCampaigns));
    setCampaigns(updatedCampaigns);
  };

  const createCampaign = () => {
    if (!newCampaign.name.trim() || !newCampaign.subject.trim() || !newCampaign.message.trim()) {
      toast({
        title: "Informações faltando",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!newCampaign.emailListId) {
      toast({
        title: "Nenhuma lista de email selecionada",
        description: "Por favor, selecione uma lista de email para esta campanha.",
        variant: "destructive",
      });
      return;
    }

    const selectedList = emailLists.find(list => list.id === newCampaign.emailListId);
    if (!selectedList) {
      toast({
        title: "Lista de email inválida",
        description: "Lista de email selecionada não foi encontrada.",
        variant: "destructive",
      });
      return;
    }

    const campaign: EmailCampaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      subject: newCampaign.subject,
      message: newCampaign.message,
      emailListId: newCampaign.emailListId,
      userId: user?.id || '',
      scheduledFor: newCampaign.scheduledFor ? new Date(newCampaign.scheduledFor) : undefined,
      status: newCampaign.scheduledFor ? 'scheduled' : 'draft',
      sendInterval: newCampaign.sendInterval,
      emailsPerBatch: newCampaign.emailsPerBatch,
      sentCount: 0,
      totalEmails: selectedList.emails.length,
      createdAt: new Date(),
    };

    saveCampaigns([...campaigns, campaign]);
    setNewCampaign({
      name: '',
      subject: '',
      message: '',
      emailListId: '',
      scheduledFor: '',
      sendInterval: 5,
      emailsPerBatch: 10,
    });
    setShowCreateForm(false);
    
    toast({
      title: "Campanha criada",
      description: `Campanha "${campaign.name}" foi criada com sucesso.`,
    });
  };

  const startCampaign = async (campaignId: string) => {
    try {
      // First save to database
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          id: campaignId,
          user_id: user?.id,
          name: campaign.name,
          subject: campaign.subject,
          message: campaign.message,
          email_list_id: campaign.emailListId,
          scheduled_for: campaign.scheduledFor ? campaign.scheduledFor.toISOString() : null,
          send_interval: campaign.sendInterval,
          emails_per_batch: campaign.emailsPerBatch,
          status: 'sending',
          sent_count: 0,
          total_emails: campaign.totalEmails
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Call edge function to start sending
      const { error: functionError } = await supabase.functions.invoke('send-campaign', {
        body: { campaignId }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      // Update local state
      const updatedCampaigns = campaigns.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: 'sending' as const }
          : campaign
      );
      saveCampaigns(updatedCampaigns);
      
      toast({
        title: "Campanha iniciada",
        description: "A campanha de email está sendo enviada de acordo com suas configurações.",
      });

    } catch (error: any) {
      console.error('Error starting campaign:', error);
      toast({
        title: "Erro ao iniciar campanha",
        description: error.message || "Ocorreu um erro ao iniciar a campanha.",
        variant: "destructive",
      });
    }
  };

  const pauseCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map(campaign =>
      campaign.id === campaignId
        ? { ...campaign, status: 'draft' as const }
        : campaign
    );
    saveCampaigns(updatedCampaigns);
    
    toast({
      title: "Campanha pausada",
      description: "A campanha de email foi pausada.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campanhas de Email</h1>
          <p className="text-gray-600">Crie e gerencie suas campanhas de email marketing</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={emailLists.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Campanha
        </Button>
      </div>

      {emailLists.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma lista de email disponível</h3>
            <p className="text-gray-500">
              Você precisa criar pelo menos uma lista de email antes de criar campanhas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Campaign Form */}
      {showCreateForm && emailLists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Campanha</CardTitle>
            <CardDescription>Configure sua campanha de email marketing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Nome da Campanha</Label>
                <Input
                  id="campaign-name"
                  placeholder="ex: Newsletter Dezembro 2024"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-list">Lista de Email</Label>
                <select
                  id="email-list"
                  className="w-full p-2 border rounded-md"
                  value={newCampaign.emailListId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, emailListId: e.target.value })}
                >
                  <option value="">Selecione uma lista de email...</option>
                  {emailLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.emails.length} inscritos)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Assunto do Email</Label>
              <Input
                id="subject"
                placeholder="Digite o assunto do email"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem do Email</Label>
              <Textarea
                id="message"
                placeholder="Escreva o conteúdo do seu email aqui..."
                rows={8}
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
              />
              
              {/* HTML Preview */}
              {hasHtmlTags(newCampaign.message) && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium text-blue-600">Preview do Email</Label>
                  </div>
                  <div className="border rounded-md p-4 bg-white max-h-96 overflow-y-auto">
                    <div 
                      dangerouslySetInnerHTML={{ __html: newCampaign.message }}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-for">Agendar Para (Opcional)</Label>
                <Input
                  id="scheduled-for"
                  type="datetime-local"
                  value={newCampaign.scheduledFor}
                  onChange={(e) => setNewCampaign({ ...newCampaign, scheduledFor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emails-per-batch">Emails por Lote</Label>
                <Input
                  id="emails-per-batch"
                  type="number"
                  min="1"
                  max="100"
                  value={newCampaign.emailsPerBatch}
                  onChange={(e) => setNewCampaign({ ...newCampaign, emailsPerBatch: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-interval">Intervalo (minutos)</Label>
                <Input
                  id="send-interval"
                  type="number"
                  min="1"
                  max="60"
                  value={newCampaign.sendInterval}
                  onChange={(e) => setNewCampaign({ ...newCampaign, sendInterval: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={createCampaign}>Criar Campanha</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign List */}
      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const emailList = emailLists.find(list => list.id === campaign.emailListId);
          return (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">Assunto: {campaign.subject}</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Lista:</span> {emailList?.name || 'Desconhecida'}
                      </div>
                      <div>
                        <span className="font-medium">Total de Emails:</span> {campaign.totalEmails}
                      </div>
                      <div>
                        <span className="font-medium">Enviados:</span> {campaign.sentCount}
                      </div>
                      <div>
                        <span className="font-medium">Progresso:</span> {Math.round((campaign.sentCount / campaign.totalEmails) * 100)}%
                      </div>
                    </div>
                    {campaign.scheduledFor && (
                      <div className="mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Agendado: {new Date(campaign.scheduledFor).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                        <Play className="w-4 h-4 mr-1" />
                        Iniciar
                      </Button>
                    )}
                    {campaign.status === 'sending' && (
                      <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)}>
                        <Pause className="w-4 h-4 mr-1" />
                        Pausar
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {campaigns.length === 0 && !showCreateForm && emailLists.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Nenhuma campanha ainda</h3>
            <p className="text-gray-500 mb-6">
              Crie sua primeira campanha de email para começar a alcançar seus inscritos.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Sua Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
