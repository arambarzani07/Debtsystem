import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export interface ScannedReceiptData {
  amount: number;
  description: string;
  date?: string;
  currency?: string;
  items?: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

export async function scanReceipt(imageUri: string): Promise<ScannedReceiptData | null> {
  try {
    console.log('Starting receipt scan for:', imageUri);
    
    let base64Image: string;
    if (imageUri.startsWith('data:')) {
      base64Image = imageUri;
    } else {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      base64Image = `data:image/jpeg;base64,${base64}`;
    }

    const receiptSchema = z.object({
      amount: z.number().describe('Total amount from the receipt'),
      description: z.string().describe('Brief description of the purchase or transaction'),
      date: z.string().optional().describe('Date of transaction if visible'),
      currency: z.string().optional().describe('Currency code like IQD, USD, EUR'),
      items: z.array(z.object({
        name: z.string(),
        quantity: z.number(),
        price: z.number(),
      })).optional().describe('Individual items if clearly visible'),
    });

    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract receipt information from this image. Look for total amount, items, date, and any other relevant transaction details. If text is in Arabic or Kurdish, translate item names to Kurdish. Return accurate numerical values.',
            },
            {
              type: 'image',
              image: base64Image,
            },
          ],
        },
      ],
      schema: receiptSchema as any,
    });

    console.log('Receipt scan result:', result);
    return result as ScannedReceiptData;
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return null;
  }
}

export async function pickAndScanImage(): Promise<{ imageUri: string; data: ScannedReceiptData } | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('وەڵامەکان بۆ دەستپێگەیشتن بە وێنەکان پێویستە');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    const scannedData = await scanReceipt(imageUri);

    if (!scannedData) {
      return null;
    }

    return { imageUri, data: scannedData };
  } catch (error) {
    console.error('Error picking and scanning image:', error);
    return null;
  }
}

export async function takePictureAndScan(): Promise<{ imageUri: string; data: ScannedReceiptData } | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('وەڵامەکان بۆ دەستپێگەیشتن بە کامێرا پێویستە');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const imageUri = result.assets[0].uri;
    const scannedData = await scanReceipt(imageUri);

    if (!scannedData) {
      return null;
    }

    return { imageUri, data: scannedData };
  } catch (error) {
    console.error('Error taking picture and scanning:', error);
    return null;
  }
}
