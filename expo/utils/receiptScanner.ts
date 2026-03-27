import { generateText } from '@rork-ai/toolkit-sdk';

export interface ReceiptData {
  amount: number | null;
  date: string | null;
  description: string;
  items: string[];
}

export const scanReceipt = async (imageUri: string): Promise<ReceiptData> => {
  try {
    const prompt = `
      Analyze this receipt image and extract the following information:
      1. Total amount (number only)
      2. Date (in ISO format YYYY-MM-DD)
      3. Brief description of what was purchased
      4. List of items
      
      Return the information in this exact JSON format:
      {
        "amount": <number or null>,
        "date": "<YYYY-MM-DD or null>",
        "description": "<brief description>",
        "items": ["item1", "item2", ...]
      }
      
      If you cannot find any information, use null for amount and date, and empty strings/arrays for the rest.
    `;

    const result = await generateText({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: imageUri },
          ],
        },
      ],
    });

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        amount: data.amount,
        date: data.date,
        description: data.description || 'Scanned from receipt',
        items: data.items || [],
      };
    }

    return {
      amount: null,
      date: null,
      description: 'Unable to scan receipt',
      items: [],
    };
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return {
      amount: null,
      date: null,
      description: 'Error scanning receipt',
      items: [],
    };
  }
};

export const parseReceiptText = (text: string): ReceiptData => {
  const amountRegex = /(\d+[,.]?\d*)\s*(IQD|USD|EUR|$|دینار)?/i;
  const dateRegex = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/;
  
  const amountMatch = text.match(amountRegex);
  const dateMatch = text.match(dateRegex);
  
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null;
  let date = null;
  
  if (dateMatch) {
    const parts = dateMatch[1].split(/[/-]/);
    if (parts.length === 3) {
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      date = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  return {
    amount,
    date,
    description: 'Scanned from receipt',
    items: [],
  };
};
