import { Linking, Platform, Share, Alert } from 'react-native';
import type { Debtor, Transaction } from '@/types';

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  try {
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    if (Platform.OS === 'web') {
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      return true;
    }

    const fullMessage = `${message}\n\nژمارە تەلەفۆن: ${cleanPhone}`;
    
    await Share.share({
      message: fullMessage,
    });
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    Alert.alert(
      'هەڵە',
      'کێشەیەک ڕوویدا لە ناردنی پەیامدا.',
      [{ text: 'باشە' }]
    );
    return false;
  }
}

export async function sendDebtReminder(debtor: Debtor): Promise<boolean> {
  if (!debtor.phone) {
    Alert.alert(
      'هەڵە',
      'ژمارە تەلەفۆن نییە بۆ ئەم کڕیارە.',
      [{ text: 'باشە' }]
    );
    return false;
  }

  const message = `سڵاو ${debtor.name}،\n\nیادەوەرییەکی دۆستانەیە کە قەرزێکی ${Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار لەسەرە.\n\nزۆر سوپاس بۆ هاوکاریەکەت! 🙏`;
  
  return sendWhatsAppMessage(debtor.phone, message);
}

export async function sendPaymentConfirmation(debtor: Debtor, amount: number): Promise<boolean> {
  if (!debtor.phone) {
    Alert.alert(
      'هەڵە',
      'ژمارە تەلەفۆن نییە بۆ ئەم کڕیارە.',
      [{ text: 'باشە' }]
    );
    return false;
  }

  const message = `سڵاو ${debtor.name}،\n\nپەسندکردنی وەرگرتنی پارە: ${amount.toLocaleString('en-US')} دینار\n\nقەرزی ماوە: ${Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار\n\nسوپاس!`;
  
  return sendWhatsAppMessage(debtor.phone, message);
}

export async function sendCustomMessage(debtor: Debtor, customMessage: string): Promise<boolean> {
  if (!debtor.phone) {
    return false;
  }

  const message = `سڵاو ${debtor.name}،\n\n${customMessage}`;
  
  return sendWhatsAppMessage(debtor.phone, message);
}

export const shareReceiptOnWhatsApp = async (debtor: Debtor, transaction: Transaction): Promise<boolean> => {
  try {
    const message = `📄 *وەسڵی پارەدان*\n\n` +
      `ناوی کڕیار: ${debtor.name}\n` +
      `بڕ: ${transaction.amount.toLocaleString('en-US')} IQD\n` +
      `جۆر: ${transaction.type === 'debt' ? 'قەرز' : 'پارەدان'}\n` +
      `وەسف: ${transaction.description}\n` +
      `بەروار: ${new Date(transaction.date).toLocaleDateString('ku')}\n\n` +
      `کۆی قەرز: ${debtor.totalDebt.toLocaleString('en-US')} IQD`;

    if (Platform.OS === 'web') {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      return true;
    }

    try {
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      console.log('WhatsApp not available, using Share API');
    }
    
    await Share.share({ message });
    return true;
  } catch (error) {
    console.error('Error sharing on WhatsApp:', error);
    Alert.alert(
      'هەڵە',
      'کێشەیەک ڕوویدا لە هاوبەشکردنی وەسڵدا.',
      [{ text: 'باشە' }]
    );
    return false;
  }
};

export const shareDebtorReportOnWhatsApp = async (debtor: Debtor): Promise<boolean> => {
  try {
    let transactionsList = '';
    const recentTransactions = debtor.transactions.slice(-10).reverse();
    
    recentTransactions.forEach((t, index) => {
      const date = new Date(t.date).toLocaleDateString('ku');
      const type = t.type === 'debt' ? '📈' : '📉';
      transactionsList += `${index + 1}. ${type} ${t.amount.toLocaleString('en-US')} - ${t.description} (${date})\n`;
    });

    const message = `📊 *ڕاپۆرتی کڕیار*\n\n` +
      `ناو: ${debtor.name}\n` +
      `${debtor.phone ? `تەلەفۆن: ${debtor.phone}\n` : ''}` +
      `کۆی قەرز: ${debtor.totalDebt.toLocaleString('en-US')} IQD\n` +
      `ژمارەی مامەڵە: ${debtor.transactions.length}\n\n` +
      `*دوایین مامەڵەکان:*\n${transactionsList}\n` +
      `_سیستەمی بەڕێوەبردنی قەرز_`;

    if (Platform.OS === 'web') {
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      return true;
    }

    try {
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      console.log('WhatsApp not available, using Share API');
    }
    
    await Share.share({ message });
    return true;
  } catch (error) {
    console.error('Error sharing debtor report:', error);
    Alert.alert(
      'هەڵە',
      'کێشەیەک ڕوویدا لە هاوبەشکردنی ڕاپۆرتدا.',
      [{ text: 'باشە' }]
    );
    return false;
  }
};

export const sendReminderViaWhatsApp = async (debtor: Debtor, phoneNumber?: string): Promise<boolean> => {
  try {
    const phone = phoneNumber || debtor.phone;
    if (!phone) {
      Alert.alert(
        'هەڵە',
        'ژمارە تەلەفۆن نییە بۆ ئەم کڕیارە.',
        [{ text: 'باشە' }]
      );
      return false;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = `سڵاو ${debtor.name}\n\n` +
      `بیرخستنەوەیەکی میهرەبانانەیە دەربارەی قەرزەکەت:\n` +
      `کۆی قەرز: ${Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار\n\n` +
      `زۆر سوپاس بۆ هاوکاریەکەت! 🙏`;

    return await sendWhatsAppMessage(cleanPhone, message);
  } catch (error) {
    console.error('Error sending WhatsApp reminder:', error);
    Alert.alert(
      'هەڵە',
      'کێشەیەک ڕوویدا لە ناردنی یادەوەریدا.',
      [{ text: 'باشە' }]
    );
    return false;
  }
};
