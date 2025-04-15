// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/libs/auth';
import { fetchTransactionEmails, getEmailContent } from '@/libs/gmail';
import { parseTransactionEmail } from '@/libs/transactionParser';
import { prisma } from '@/libs/prisma';


export async function GET() {
  // Prevent caching which can cause repeated calls
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
    }
    
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 400, headers });
    }
    
    // Fetch emails
    const emails = await fetchTransactionEmails(accessToken);
    
    // Parse emails to extract transactions
    const transactions = [];
    const errors = [];
    
    for (const email of emails) {
      try {
        // Extract content from email
        const content = getEmailContent(email);
        
        // Parse transaction from content
        const transaction = parseTransactionEmail(content, email.id || '');
        
        if (transaction) {
          try {
            // Try to find an existing transaction with the same reference number
            const existingTransaction = await prisma.transaction.findFirst({
              where: {
                userId: session.user.id,
                reference: transaction.reference,
              },
            });
            
            // Only save if this transaction doesn't already exist
            if (!existingTransaction) {
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
          } catch (dbError) {
            console.error('Database error:', dbError);
            errors.push({ emailId: email.id, error: 'Database error' });
          }
        } else {
          errors.push({ emailId: email.id, error: 'Could not parse transaction' });
        }
      } catch (parseError) {
        console.error('Error parsing email:', parseError);
        errors.push({ emailId: email.id, error: 'Parsing error' });
      }
    }
    
    // Get all transactions for this user to return
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'desc',
      },
    });
    
    return NextResponse.json({ 
      newTransactions: transactions.length,
      transactions: allTransactions,
      errors: errors.length > 0 ? errors : undefined
    }, { headers });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500, headers });
  }
}