
export interface EmailConfig {
  smtpServer: string;
  port: number;
  username: string;
  password: string;
  userId: string;
}

export interface EmailList {
  id: string;
  name: string;
  emails: string[];
  userId: string;
  createdAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  message: string;
  emailListId: string;
  userId: string;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  sendInterval: number; // minutes
  emailsPerBatch: number;
  sentCount: number;
  totalEmails: number;
  createdAt: Date;
}
