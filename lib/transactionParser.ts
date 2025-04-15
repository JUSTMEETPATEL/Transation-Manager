// lib/transactionParser.ts
type Transaction = {
  type: 'credit' | 'debit';
  amount: number;
  account: string;
  counterparty: string;
  date: Date;
  reference: string;
  emailId: string; // Add emailId to prevent duplicate processing
};

export function parseTransactionEmail(content: string, emailId: string): Transaction | null {
  console.log("Parsing content:", content); // For debugging
  
  // Credit transaction pattern
  const creditPattern = /Rs\.([0-9,.]+) is successfully credited to your account \*\*(\d+) by VPA ([^\s]+) ([^on]+) on (\d{2}-\d{2}-\d{2}).*reference number is (\d+)/;
  
  // Debit transaction pattern
  const debitPattern = /Rs\.([0-9,.]+) has been debited from account \*\*(\d+) to VPA ([^\s]+) ([^on]+) on (\d{2}-\d{2}-\d{2}).*reference number is (\d+)/;
  
  let match = content.match(creditPattern);
  if (match) {
    return {
      type: 'credit',
      amount: parseFloat(match[1].replace(/,/g, '')),
      account: match[2],
      counterparty: `${match[4].trim()} (${match[3]})`,
      date: parseDate(match[5]),
      reference: match[6],
      emailId
    };
  }
  
  match = content.match(debitPattern);
  if (match) {
    return {
      type: 'debit',
      amount: parseFloat(match[1].replace(/,/g, '')),
      account: match[2],
      counterparty: `${match[4].trim()} (${match[3]})`,
      date: parseDate(match[5]),
      reference: match[6],
      emailId
    };
  }
  
  return null;
}

function parseDate(dateString: string): Date {
  // Convert DD-MM-YY to a Date object
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(2000 + year, month - 1, day);
}