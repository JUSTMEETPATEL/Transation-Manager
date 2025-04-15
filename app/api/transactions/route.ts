// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { PrismaClient } from '@prisma/client';
import { fetchTransactionEmails } from '@/libs/gmail';
import { parseTransactionEmail } from '@/libs/transactionParser';
import { authOptions } from '@/libs/auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get access token from session
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 400 });
    }
    
    // Fetch emails
    const emails = await fetchTransactionEmails(accessToken);

    // console.log('Fetched emails:', emails);
    
    // Parse emails to extract transactions
    const transactions = [];
    
    for (const email of emails) {
      const content = Buffer.from(email.payload?.body?.data || '', 'base64').toString();
      const transaction = parseTransactionEmail(content);

      console.log('Parsed transaction:', transaction);
      
      if (transaction) {
        // Save to database
        const savedTransaction = await prisma.transaction.create({
          data: {
            userId: session.user.id,
            type: transaction.type,
            amount: transaction.amount,
            account: transaction.account,
            counterparty: transaction.counterparty,
            date: transaction.date,
            reference: transaction.reference,
          },
        });
        
        transactions.push(savedTransaction);
      }
    }
    
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}