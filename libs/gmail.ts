// lib/gmail.ts
import { google } from 'googleapis';

export async function getGmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

export async function fetchTransactionEmails(accessToken: string) {
  const gmail = await getGmailClient(accessToken);
//   console.log(gmail);
//   console.log("Got Gmail Client");
  // Query for HDFC transaction emails - adjust for your bank
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:HDFC Bank InstaAlerts <alerts@hdfcbank.net> subject:"View: Account update for your HDFC Bank A/c" OR subject:"❗ You have done a UPI txn. Check details!" OR subject:"credited"',
    maxResults: 20,
  });
  
  const messages = res.data.messages || [];
  const emails = [];
  
  for (const message of messages) {
    if (message.id) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });
      emails.push(email.data);
    }
  }

//   console.log(emails);
//   console.log("Got emails");
  
  return emails;
}