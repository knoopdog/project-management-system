/**
 * This file contains the code for the Supabase Edge Function to handle email notifications.
 * 
 * Usage:
 * 1. Create a new Edge Function in Supabase
 * 2. Copy this code into the Edge Function
 * 3. Deploy the Edge Function
 * 4. Set up database triggers to call this function when needed
 */

// Edge Function code
const emailNotificationsFunction = `
// Follow the Supabase Edge Function setup guide:
// https://supabase.com/docs/guides/functions

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.example.com'
const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME') || 'your-email@example.com'
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || 'your-password'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@example.com'
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000'

const client = new SmtpClient()

serve(async (req) => {
  try {
    // Parse the request body
    const { type, data } = await req.json()
    
    // Connect to SMTP server
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    })
    
    let result
    
    // Handle different notification types
    switch (type) {
      case 'comment_notification':
        result = await sendCommentNotification(data)
        break
      case 'customer_invitation':
        result = await sendCustomerInvitation(data)
        break
      default:
        throw new Error(\`Unknown notification type: \${type}\`)
    }
    
    // Close the connection
    await client.close()
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Send notification to admin when a customer comments on a task
async function sendCommentNotification(data) {
  const { adminEmail, customerName, taskName, projectName, commentContent, taskUrl } = data
  
  const subject = \`New comment on task: \${taskName}\`
  
  const body = \`
    <h2>New Comment Notification</h2>
    <p><strong>\${customerName}</strong> has commented on task <strong>\${taskName}</strong> in project <strong>\${projectName}</strong>.</p>
    
    <blockquote>
      \${commentContent}
    </blockquote>
    
    <p><a href="\${taskUrl}">View Task</a></p>
    
    <hr>
    <p>This is an automated message from your Project Management system.</p>
  \`
  
  return await client.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject,
    content: body,
    html: body,
  })
}

// Send invitation email to a new customer
async function sendCustomerInvitation(data) {
  const { customerEmail, customerName, password, companyName } = data
  
  const subject = \`Welcome to \${companyName}'s Project Management Portal\`
  
  const body = \`
    <h2>Welcome to the Project Management Portal</h2>
    <p>Hello \${customerName},</p>
    
    <p>\${companyName} has invited you to their project management portal where you can view your projects and tasks.</p>
    
    <h3>Your Login Details:</h3>
    <p><strong>Email:</strong> \${customerEmail}</p>
    <p><strong>Password:</strong> \${password}</p>
    
    <p><a href="\${APP_URL}/login">Login to Portal</a></p>
    
    <p>We recommend changing your password after your first login.</p>
    
    <hr>
    <p>This is an automated message from the Project Management system.</p>
  \`
  
  return await client.send({
    from: FROM_EMAIL,
    to: customerEmail,
    subject,
    content: body,
    html: body,
  })
}
`;

// SQL to create database triggers for email notifications
const setupEmailTriggers = `
-- Create a function to send comment notifications
CREATE OR REPLACE FUNCTION notify_admin_of_customer_comment()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
  customer_name TEXT;
  task_name TEXT;
  project_name TEXT;
  task_url TEXT;
BEGIN
  -- Only send notification if the comment is from a customer
  IF NEW.is_customer = FALSE THEN
    RETURN NEW;
  END IF;

  -- Get admin email (assuming the first admin in the system)
  SELECT u.email INTO admin_email
  FROM auth.users u
  JOIN user_roles ur ON u.id = ur.user_id
  WHERE ur.role = 'admin'
  LIMIT 1;

  -- Get customer name
  SELECT c.first_name || ' ' || c.last_name INTO customer_name
  FROM customers c
  JOIN auth.users u ON c.email = u.email
  WHERE u.id = NEW.user_id;

  -- Get task and project info
  SELECT t.name, p.name INTO task_name, project_name
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  WHERE t.id = NEW.task_id;

  -- Construct task URL
  task_url := 'http://localhost:3000/admin/tasks/' || NEW.task_id;

  -- Call the edge function to send email
  -- Note: In a real implementation, you would use pg_net or similar to make HTTP requests
  -- This is a placeholder for the actual implementation
  RAISE NOTICE 'Would send email to % about comment from % on task % in project %',
    admin_email, customer_name, task_name, project_name;

  -- Mark as notified
  NEW.admin_notified := TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment notifications
CREATE TRIGGER notify_admin_of_customer_comment_trigger
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE PROCEDURE notify_admin_of_customer_comment();
`;

console.log('Edge Function Code:');
console.log(emailNotificationsFunction);
console.log('\n\nSQL to set up triggers:');
console.log(setupEmailTriggers);
