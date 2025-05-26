
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Plus, Calendar, Settings, Play, Pause } from 'lucide-react';
import { EmailCampaign, EmailList } from '@/types/email';

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
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!newCampaign.emailListId) {
      toast({
        title: "No email list selected",
        description: "Please select an email list for this campaign.",
        variant: "destructive",
      });
      return;
    }

    const selectedList = emailLists.find(list => list.id === newCampaign.emailListId);
    if (!selectedList) {
      toast({
        title: "Invalid email list",
        description: "Selected email list not found.",
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
      title: "Campaign created",
      description: `Campaign "${campaign.name}" has been created successfully.`,
    });
  };

  const startCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map(campaign =>
      campaign.id === campaignId
        ? { ...campaign, status: 'sending' as const }
        : campaign
    );
    saveCampaigns(updatedCampaigns);
    
    toast({
      title: "Campaign started",
      description: "Email campaign is now being sent according to your settings.",
    });
  };

  const pauseCampaign = (campaignId: string) => {
    const updatedCampaigns = campaigns.map(campaign =>
      campaign.id === campaignId
        ? { ...campaign, status: 'draft' as const }
        : campaign
    );
    saveCampaigns(updatedCampaigns);
    
    toast({
      title: "Campaign paused",
      description: "Email campaign has been paused.",
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
          <h1 className="text-3xl font-bold mb-2">Email Campaigns</h1>
          <p className="text-gray-600">Create and manage your email marketing campaigns</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={emailLists.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {emailLists.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No email lists available</h3>
            <p className="text-gray-500">
              You need to create at least one email list before creating campaigns.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Campaign Form */}
      {showCreateForm && emailLists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Set up your email marketing campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Newsletter December 2024"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-list">Email List</Label>
                <select
                  id="email-list"
                  className="w-full p-2 border rounded-md"
                  value={newCampaign.emailListId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, emailListId: e.target.value })}
                >
                  <option value="">Select an email list...</option>
                  {emailLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.emails.length} subscribers)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="Enter the email subject line"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Email Message</Label>
              <Textarea
                id="message"
                placeholder="Write your email content here..."
                rows={8}
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled-for">Schedule For (Optional)</Label>
                <Input
                  id="scheduled-for"
                  type="datetime-local"
                  value={newCampaign.scheduledFor}
                  onChange={(e) => setNewCampaign({ ...newCampaign, scheduledFor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emails-per-batch">Emails per Batch</Label>
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
                <Label htmlFor="send-interval">Interval (minutes)</Label>
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
              <Button onClick={createCampaign}>Create Campaign</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
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
                    <p className="text-gray-600 mb-2">Subject: {campaign.subject}</p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">List:</span> {emailList?.name || 'Unknown'}
                      </div>
                      <div>
                        <span className="font-medium">Total Emails:</span> {campaign.totalEmails}
                      </div>
                      <div>
                        <span className="font-medium">Sent:</span> {campaign.sentCount}
                      </div>
                      <div>
                        <span className="font-medium">Progress:</span> {Math.round((campaign.sentCount / campaign.totalEmails) * 100)}%
                      </div>
                    </div>
                    {campaign.scheduledFor && (
                      <div className="mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Scheduled: {new Date(campaign.scheduledFor).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                      <Button size="sm" onClick={() => startCampaign(campaign.id)}>
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {campaign.status === 'sending' && (
                      <Button size="sm" variant="outline" onClick={() => pauseCampaign(campaign.id)}>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
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
            <h3 className="text-lg font-medium text-gray-600 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first email campaign to start reaching your subscribers.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
