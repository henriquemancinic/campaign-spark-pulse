
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Settings, Mail } from 'lucide-react';
import { EmailConfig as EmailConfigType } from '@/types/email';

export default function EmailConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<EmailConfigType>({
    smtpServer: '',
    port: 587,
    username: '',
    password: '',
    userId: user?.id || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing config
    const savedConfig = localStorage.getItem(`emailConfig_${user?.id}`);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, [user?.id]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem(`emailConfig_${user?.id}`, JSON.stringify(config));
      toast({
        title: "Configuration saved",
        description: "Your email settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save email configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!config.smtpServer || !config.username || !config.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Test connection",
      description: "Email configuration test would be performed here in a real implementation.",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Configuration</h1>
        <p className="text-gray-600">Configure your SMTP settings for sending emails</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>SMTP Settings</span>
          </CardTitle>
          <CardDescription>
            Enter your email provider's SMTP configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-server">SMTP Server</Label>
              <Input
                id="smtp-server"
                placeholder="smtp.gmail.com"
                value={config.smtpServer}
                onChange={(e) => setConfig({ ...config, smtpServer: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="587"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-username">Email Username</Label>
            <Input
              id="email-username"
              type="email"
              placeholder="your-email@example.com"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-password">Email Password</Label>
            <Input
              id="email-password"
              type="password"
              placeholder="Your email password or app password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
            />
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button variant="outline" onClick={testConnection}>
              <Mail className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Common SMTP Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Common SMTP Settings</CardTitle>
          <CardDescription>Reference for popular email providers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Gmail</h3>
                <p className="text-sm text-gray-600">Server: smtp.gmail.com</p>
                <p className="text-sm text-gray-600">Port: 587 (TLS) or 465 (SSL)</p>
                <p className="text-sm text-gray-600">Note: Use App Password for 2FA accounts</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Outlook/Hotmail</h3>
                <p className="text-sm text-gray-600">Server: smtp-mail.outlook.com</p>
                <p className="text-sm text-gray-600">Port: 587 (TLS)</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Yahoo Mail</h3>
                <p className="text-sm text-gray-600">Server: smtp.mail.yahoo.com</p>
                <p className="text-sm text-gray-600">Port: 587 (TLS) or 465 (SSL)</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Custom SMTP</h3>
                <p className="text-sm text-gray-600">Contact your email provider</p>
                <p className="text-sm text-gray-600">for specific configuration details</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
