import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.1";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendCampaignRequest {
  campaignId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId }: SendCampaignRequest = await req.json();

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log(`Starting campaign ${campaignId} for user ${user.id}`);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found or access denied');
    }

    // Get email list
    const { data: emailList, error: listError } = await supabase
      .from('email_lists')
      .select('*')
      .eq('id', campaign.email_list_id)
      .eq('user_id', user.id)
      .single();

    if (listError || !emailList) {
      throw new Error('Email list not found');
    }

    // Get email configuration
    const { data: emailConfig, error: configError } = await supabase
      .from('email_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !emailConfig) {
      throw new Error('Email configuration not found. Please configure your SMTP settings first.');
    }

    console.log(`Found ${emailList.emails.length} emails to send`);

    // Update campaign status to sending
    await supabase
      .from('campaigns')
      .update({ 
        status: 'sending',
        total_emails: emailList.emails.length
      })
      .eq('id', campaignId);

    // Create progress records for all emails
    const progressRecords = emailList.emails.map((email: string) => ({
      campaign_id: campaignId,
      email: email,
      status: 'pending'
    }));

    const { error: progressError } = await supabase
      .from('campaign_progress')
      .insert(progressRecords);

    if (progressError) {
      console.error('Error creating progress records:', progressError);
    }

    // Start sending emails in batches
    const batchSize = campaign.emails_per_batch || 10;
    const intervalMinutes = campaign.send_interval || 5;
    
    sendEmailsInBatches(
      campaignId,
      emailList.emails,
      campaign,
      emailConfig,
      batchSize,
      intervalMinutes
    );

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Campaign started successfully',
      totalEmails: emailList.emails.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-campaign function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

async function sendEmailsInBatches(
  campaignId: string,
  emails: string[],
  campaign: any,
  emailConfig: any,
  batchSize: number,
  intervalMinutes: number
) {
  console.log(`Sending ${emails.length} emails in batches of ${batchSize} with ${intervalMinutes} minute intervals`);
  
  let sentCount = 0;
  
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, emails ${i + 1} to ${Math.min(i + batchSize, emails.length)}`);
    
    // Send emails in current batch
    for (const email of batch) {
      try {
        await sendSingleEmail(email, campaign, emailConfig);
        
        // Update progress
        await supabase
          .from('campaign_progress')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('campaign_id', campaignId)
          .eq('email', email);
        
        sentCount++;
        
        console.log(`Email sent successfully to ${email}`);
        
      } catch (error: any) {
        console.error(`Failed to send email to ${email}:`, error);
        
        // Update progress with error
        await supabase
          .from('campaign_progress')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('campaign_id', campaignId)
          .eq('email', email);
      }
    }
    
    // Update campaign sent count
    await supabase
      .from('campaigns')
      .update({ sent_count: sentCount })
      .eq('id', campaignId);
    
    // Wait between batches (except for the last batch)
    if (i + batchSize < emails.length) {
      console.log(`Waiting ${intervalMinutes} minutes before next batch...`);
      await new Promise(resolve => setTimeout(resolve, intervalMinutes * 60 * 1000));
    }
  }
  
  // Mark campaign as completed
  const finalStatus = sentCount === emails.length ? 'completed' : 'failed';
  await supabase
    .from('campaigns')
    .update({ 
      status: finalStatus,
      sent_count: sentCount
    })
    .eq('id', campaignId);
  
  console.log(`Campaign ${campaignId} completed. Sent ${sentCount}/${emails.length} emails`);
}

async function sendSingleEmail(
  recipientEmail: string,
  campaign: any,
  emailConfig: any
): Promise<void> {
  const { smtp_server, port, username, password, use_tls } = emailConfig;
  
  // Create SMTP connection using Deno's built-in SMTP
  const conn = await Deno.connect({
    hostname: smtp_server,
    port: port,
    transport: use_tls ? "tcp" : "tcp"
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    // Read initial server response
    const buffer = new Uint8Array(1024);
    await conn.read(buffer);
    const response = decoder.decode(buffer);
    console.log('Server greeting:', response);

    // EHLO command
    await conn.write(encoder.encode(`EHLO localhost\r\n`));
    await conn.read(buffer);
    
    // STARTTLS if required
    if (use_tls && port !== 465) {
      await conn.write(encoder.encode(`STARTTLS\r\n`));
      await conn.read(buffer);
      
      // Create TLS connection
      const tlsConn = await Deno.startTls(conn, { hostname: smtp_server });
      conn.close();
    }

    // AUTH LOGIN
    await conn.write(encoder.encode(`AUTH LOGIN\r\n`));
    await conn.read(buffer);
    
    // Send username (base64 encoded)
    const encodedUsername = btoa(username);
    await conn.write(encoder.encode(`${encodedUsername}\r\n`));
    await conn.read(buffer);
    
    // Send password (base64 encoded)
    const encodedPassword = btoa(password);
    await conn.write(encoder.encode(`${encodedPassword}\r\n`));
    await conn.read(buffer);

    // MAIL FROM
    await conn.write(encoder.encode(`MAIL FROM:<${username}>\r\n`));
    await conn.read(buffer);

    // RCPT TO
    await conn.write(encoder.encode(`RCPT TO:<${recipientEmail}>\r\n`));
    await conn.read(buffer);

    // DATA
    await conn.write(encoder.encode(`DATA\r\n`));
    await conn.read(buffer);

    // Email headers and body
    const emailData = `From: ${username}
To: ${recipientEmail}
Subject: ${campaign.subject}
MIME-Version: 1.0
Content-Type: text/html; charset=UTF-8

${campaign.message}

.
`;
    
    await conn.write(encoder.encode(emailData));
    await conn.read(buffer);

    // QUIT
    await conn.write(encoder.encode(`QUIT\r\n`));
    await conn.read(buffer);

  } finally {
    conn.close();
  }
}

serve(handler);