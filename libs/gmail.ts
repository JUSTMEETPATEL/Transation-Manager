/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/gmail.ts
import { google } from 'googleapis';

export async function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

export async function fetchTransactionEmails(accessToken: string) {
  const gmail = await getGmailClient(accessToken);
  
  // Query for HDFC transaction emails
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:HDFC Bank InstaAlerts <alerts@hdfcbank.net> subject:"View: Account update for your HDFC Bank A/c" OR subject:"❗ You have done a UPI txn. Check details!" OR subject:"credited"',
    maxResults: 20, // Increased limit to fetch more transaction emails
  });
  
  const messages = res.data.messages || [];
  const emails = [];
  
  for (const message of messages) {
    if (message.id) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full', // Ensure we get the full message content
      });
      emails.push(email.data);
    }
  }
  
  return emails;
}

// Helper function to find the plain text part of an email
export function findTextContent(part: any): string | null {
  // If this part is plain text, return its content
  if (part.mimeType === 'text/plain' && part.body && part.body.data) {
    return Buffer.from(part.body.data, 'base64').toString('utf-8');
  }
  
  // If this part has nested parts, search through them
  if (part.parts && part.parts.length) {
    for (const subPart of part.parts) {
      const textContent = findTextContent(subPart);
      if (textContent) {
        return textContent;
      }
    }
  }
  
  return null;
}

// Get the email text content
export function getEmailContent(email: any): string {
  // Check for payload parts
  if (email.payload && email.payload.parts) {
    // Try to find plain text content in the parts
    for (const part of email.payload.parts) {
      const textContent = findTextContent(part);
      if (textContent) {
        return textContent;
      }
    }
  }
  
  // If no parts or no text content found, try to get content from the body directly
  if (email.payload && email.payload.body && email.payload.body.data) {
    return Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
  }
  
  // If no content found, return the snippet as a fallback
  return email.snippet || '';
}
