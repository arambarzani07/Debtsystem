import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Debtor, Transaction } from '@/types';
import { safeJSONParse } from './storageRecovery';
import * as hourlyBackup from './hourlyBackup';

const TELEGRAM_CONFIG_KEY = 'telegram_config';
const TELEGRAM_SENT_MESSAGES_KEY = 'telegram_sent_messages';

export interface TelegramConfig {
  botToken: string;
  chatIds: {
    [debtorId: string]: string;
  };
  defaultChatId?: string;
  isEnabled: boolean;
  autoSendReminders: boolean;
  reminderFrequencyDays: number;
}

export interface TelegramMessage {
  id: string;
  debtorId: string;
  debtorName: string;
  message: string;
  sentAt: string;
  success: boolean;
  chatId: string;
}

const DEFAULT_CONFIG: TelegramConfig = {
  botToken: '',
  chatIds: {},
  isEnabled: false,
  autoSendReminders: false,
  reminderFrequencyDays: 7,
};

export async function getTelegramConfig(): Promise<TelegramConfig> {
  try {
    const stored = await AsyncStorage.getItem(TELEGRAM_CONFIG_KEY);
    if (!stored) {
      return DEFAULT_CONFIG;
    }
    const parsed = await safeJSONParse<TelegramConfig>(stored, DEFAULT_CONFIG);
    return parsed;
  } catch (error) {
    console.error('Error loading Telegram config:', error);
    return DEFAULT_CONFIG;
  }
}

export async function saveTelegramConfig(config: TelegramConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving Telegram config:', error);
    throw error;
  }
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    if (!botToken || !botToken.trim()) {
      throw new Error('تکایە سەرەتا Bot Token لە ڕێکخستنەکان دابنێ');
    }
    
    if (!chatId || !chatId.trim()) {
      throw new Error('تکایە سەرەتا Chat ID لە ڕێکخستنەکان دابنێ');
    }

    const trimmedChatId = chatId.trim();
    if (!/^-?\d+$/.test(trimmedChatId)) {
      throw new Error(`Chat ID هەڵەیە: "${trimmedChatId}"\n\nChat ID دەبێت تەنها ژمارە بێت (وەک: 123456789 یان -123456789)`);
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: trimmedChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Telegram API response:', responseText);
      throw new Error(`هەڵە لە وەڵامی Telegram: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok || !data.ok) {
      const errorMessage = data.description || 'هەڵەی نەزانراو';
      console.error('Telegram API error:', errorMessage);
      
      if (errorMessage.includes('chat not found')) {
        const botInfo = await getBotInfo(botToken);
        const botUsername = botInfo.success && botInfo.botUsername ? botInfo.botUsername : 'your_bot_username';
        throw new Error(`❌ گفتوگۆ نەدۆزرایەوە!\n\n📱 تکایە ئەم هەنگاوانە بە وردی جێبەجێ بکە:\n\n1️⃣ لە Telegram، بگەڕێ بۆ: @${botUsername}\n2️⃣ بۆتەکە بکەرەوە و کلیک لە "Start" بکە\n3️⃣ چاوەڕێیە تا بۆت پەیامێک بنێرێت\n4️⃣ دواتر بگەڕێوە بۆ ئەپ و دووبارە هەوڵ بدەرەوە\n\n⚠️ گرنگ:\n• Chat ID دەبێت ژمارەیەکی تەواو بێت\n• دڵنیابە لەوەی کە Start-ت کردووە لە بۆتەکە\n• بۆت نابێت بلۆک کرابێت`);
      } else if (errorMessage.includes('bot was blocked')) {
        throw new Error('❌ بۆتەکە بلۆک کراوە!\n\nتکایە:\n1️⃣ بڕۆ بۆ Telegram\n2️⃣ بۆتەکە بدۆزەرەوە\n3️⃣ بلۆکەکە هەڵبوەشێنەرەوە (Unblock)\n4️⃣ دووبارە Start بکە');
      } else if (errorMessage.includes('Unauthorized')) {
        throw new Error('❌ Bot Token هەڵەیە!\n\nتکایە:\n1️⃣ بڕۆ بۆ @BotFather لە Telegram\n2️⃣ Bot Token نوێ وەربگرە\n3️⃣ لە ڕێکخستنەکانی ئەپ، Token نوێیەکە تۆمار بکە');
      }
      
      throw new Error(`❌ هەڵە: ${errorMessage}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    throw error;
  }
}

export async function sendDebtReminderViaTelegram(debtor: Debtor): Promise<boolean> {
  const config = await getTelegramConfig();
  
  if (!config.isEnabled) {
    if (Platform.OS === 'web') {
      alert('Telegram ناچالاکە! تکایە لە ڕێکخستنەکان چالاکی بکە.');
    } else {
      Alert.alert('هەڵە', 'Telegram ناچالاکە! تکایە لە ڕێکخستنەکان چالاکی بکە.');
    }
    return false;
  }
  
  if (!config.botToken || !config.botToken.trim()) {
    if (Platform.OS === 'web') {
      alert('Bot Token دانەنراوە! تکایە لە ڕێکخستنی Telegram Bot Token زیاد بکە.');
    } else {
      Alert.alert('هەڵە', 'Bot Token دانەنراوە! تکایە لە ڕێکخستنی Telegram Bot Token زیاد بکە.');
    }
    return false;
  }

  const chatId = config.chatIds[debtor.id] || config.defaultChatId;
  
  if (!chatId || !chatId.trim()) {
    if (Platform.OS === 'web') {
      alert(`هیچ Chat ID نییە بۆ ${debtor.name}!\n\nتکایە یەکێک لەمانە بکە:\n• Chat ID تایبەت بۆ ئەم کڕیارە دابنێ\n• یان Default Chat ID لە ڕێکخستنەکان دابنێ`);
    } else {
      Alert.alert('هەڵە', `هیچ Chat ID نییە بۆ ${debtor.name}!\n\nتکایە یەکێک لەمانە بکە:\n• Chat ID تایبەت بۆ ئەم کڕیارە دابنێ\n• یان Default Chat ID لە ڕێکخستنەکان دابنێ`);
    }
    return false;
  }

  const verification = await verifyChatConnection(config.botToken, chatId);
  if (!verification.isActive) {
    const botInfo = await getBotInfo(config.botToken);
    const botUsername = botInfo.success && botInfo.botUsername ? botInfo.botUsername : 'your_bot_username';
    const errorMessage = `❌ پەیوەندی لەگەڵ ${debtor.name} ناچالاکە!\n\n📱 تکایە کڕیارەکە ئاگادار بکەرەوە:\n\n1️⃣ لە Telegram بگەڕێت بۆ: @${botUsername}\n2️⃣ کلیک لە "Start" بکات\n3️⃣ دواتر دووبارە هەوڵ بدەرەوە\n\nهۆکار: ${verification.message || 'نەزانراو'}`;
    
    if (Platform.OS === 'web') {
      alert(errorMessage);
    } else {
      Alert.alert('پەیوەندی ناچالاک', errorMessage);
    }
    return false;
  }

  try {
    let message = '';
    
    if (debtor.totalDebt > 0) {
      const now = new Date().toLocaleString('ku', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const allTransactions = debtor.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      const totalDebtAmount = allTransactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + t.amount, 0);
      const totalPaymentAmount = allTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
      
      message = `╔════════════════════════╗\n`;
      message += `    🔔 <b>یادەوەری قەرز</b>\n`;
      message += `╚════════════════════════╝\n\n`;
      message += `👤 <b>بەڕێز ${debtor.name}</b>\n`;
      message += `⏰ <i>${now}</i>\n\n`;
      message += `سڵاو! ئەمە یادەوەرییەکی دۆستانەیە سەبارەت بە حسابەکەت:\n\n`;
      message += `┏━━━━━━━━━━━━━━━━━━┓\n`;
      message += `┃  💰 <b>ماوەی قەرز</b>\n`;
      message += `┃  <b>${Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار</b>\n`;
      message += `┗━━━━━━━━━━━━━━━━━━┛\n`;
      
      if (debtor.phone) {
        message += `\n📞 <b>تەلەفۆن:</b> <code>${debtor.phone}</code>\n`;
      }
      
      if (allTransactions.length > 0) {
        message += `\n╭─────────────────────╮\n`;
        message += `│ 📊 <b>پوختەی گشتی</b>\n`;
        message += `╰─────────────────────╯\n`;
        message += `📋 ژمارەی مامەڵەکان: <b>${allTransactions.length}</b>\n`;
        message += `🔴 کۆی قەرزەکان: <b>${totalDebtAmount.toLocaleString('en-US')} دینار</b>\n`;
        message += `🟢 کۆی پارەدانەکان: <b>${totalPaymentAmount.toLocaleString('en-US')} دینار</b>\n`;
        message += `💼 ماوەی قەرز: <b>${Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار</b>\n`;
        message += `\n╭─────────────────────╮\n`;
        message += `│ 📝 <b>وردەکاری مامەڵەکان</b>\n`;
        message += `╰─────────────────────╯\n\n`;
        
        for (let i = 0; i < allTransactions.length; i++) {
          const trans = allTransactions[i];
          const transDate = new Date(trans.date).toLocaleDateString('ku', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const transType = trans.type === 'debt' ? '🔴 قەرز' : '🟢 پارەدان';
          const transIcon = trans.type === 'debt' ? '📤' : '📥';
          
          message += `<b>${i + 1}.</b> ${transType} ${transIcon}\n`;
          message += `   ┣ 💵 <b>بڕ:</b> ${trans.amount.toLocaleString('en-US')} دینار\n`;
          message += `   ┣ 📝 <b>وەسف:</b> <i>${trans.description}</i>\n`;
          message += `   ┣ 📅 <b>بەروار:</b> ${transDate}\n`;
          
          if (trans.comment && trans.comment.trim()) {
            message += `   ┗ 💬 <b>تێبینی:</b> "${trans.comment}"\n`;
          } else {
            message += `   ┗ 💬 <b>تێبینی:</b> <i>بەتاڵ</i>\n`;
          }
          
          if (i < allTransactions.length - 1) {
            message += `   ┃\n`;
          }
        }
      }
      
      message += `\n┏━━━━━━━━━━━━━━━━━━┓\n`;
      message += `┃  💰 <b>کۆی گشتی قەرز</b>\n`;
      message += `┃  <b>${Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار</b>\n`;
      message += `┗━━━━━━━━━━━━━━━━━━┛\n\n`;
      message += `🙏 <b>تکایە لە کاتی خۆیدا پارە بدەرەوە</b>\n`;
      message += `💚 زۆر سوپاس بۆ تێگەیشتن و هاوکاریەکەت\n`;
      message += `🤝 ئێمە پێمان خۆشە لەگەڵتدا کار بکەین\n\n`;
      message += `📞 <i>بۆ هەر پرسیارێک پەیوەندیمان پێوە بکە</i>`;
    } else {
      const now = new Date().toLocaleString('ku', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      message = `╔════════════════════════╗\n`;
      message += `    ✅ <b>حسابی پاک</b>\n`;
      message += `╚════════════════════════╝\n\n`;
      message += `👤 <b>بەڕێز ${debtor.name}</b>\n`;
      message += `⏰ <i>${now}</i>\n\n`;
      message += `سڵاو! ئەمە یادەوەرییەکە لە فرۆشگای ئێمەوە.\n\n`;
      message += `┏━━━━━━━━━━━━━━━━━━┓\n`;
      message += `┃  ✅ هیچ قەرزێکت نییە\n`;
      message += `┃  🎉 حسابەکەت پاکە!\n`;
      message += `┗━━━━━━━━━━━━━━━━━━┛\n\n`;
      message += `💚 زۆر سوپاس بۆ هاوکاریکردنت\n`;
      message += `🤝 ئێمە پێمان خۆشە لەگەڵتدا کار بکەین\n\n`;
      message += `🌟 <i>چاوەڕوانی بینینتین لە داهاتوودا!</i>`;
    }

    await sendTelegramMessage(config.botToken, chatId, message);
    
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message,
      sentAt: new Date().toISOString(),
      success: true,
      chatId,
    });

    return true;
  } catch (error) {
    console.error('Error sending Telegram reminder:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const chatIdValue = config.chatIds[debtor.id] || config.defaultChatId || 'N/A';
    
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message: `Failed: ${errorMsg}`,
      sentAt: new Date().toISOString(),
      success: false,
      chatId: chatIdValue,
    });
    
    if (Platform.OS === 'web') {
      alert(`هەڵە: ${errorMsg}`);
    } else {
      Alert.alert('هەڵە', errorMsg);
    }
    return false;
  }
}

export async function sendPaymentConfirmationViaTelegram(
  debtor: Debtor,
  amount: number
): Promise<boolean> {
  const config = await getTelegramConfig();
  
  if (!config.isEnabled || !config.botToken) {
    return false;
  }

  const chatId = config.chatIds[debtor.id] || config.defaultChatId;
  
  if (!chatId) {
    return false;
  }

  try {
    const message = `✅ <b>پشتڕاستکردنەوەی پارەدان</b>\n\nبەڕێز ${debtor.name}\n\n💵 بڕی پارەدراو: <b>${amount.toLocaleString('en-US')} دینار</b>\n📊 قەرزی ماوە: <b>${Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار</b>\n\n🙏 زۆر سوپاس!`;

    await sendTelegramMessage(config.botToken, chatId, message);
    
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message,
      sentAt: new Date().toISOString(),
      success: true,
      chatId,
    });

    return true;
  } catch (error) {
    console.error('Error sending payment confirmation via Telegram:', error);
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
      sentAt: new Date().toISOString(),
      success: false,
      chatId: chatId || 'N/A',
    });
    return false;
  }
}

export async function sendCustomMessageViaTelegram(
  debtor: Debtor,
  customMessage: string
): Promise<boolean> {
  const config = await getTelegramConfig();
  
  if (!config.isEnabled || !config.botToken) {
    if (Platform.OS === 'web') {
      alert('Telegram پێکهاتوو نییە');
    } else {
      Alert.alert('هەڵە', 'Telegram پێکهاتوو نییە');
    }
    return false;
  }

  const chatId = config.chatIds[debtor.id] || config.defaultChatId;
  
  if (!chatId) {
    if (Platform.OS === 'web') {
      alert(`هیچ Chat ID نییە بۆ ${debtor.name}`);
    } else {
      Alert.alert('هەڵە', `هیچ Chat ID نییە بۆ ${debtor.name}`);
    }
    return false;
  }

  try {
    const message = `💬 <b>پەیام</b>\n\nبەڕێز ${debtor.name}\n\n${customMessage}`;

    await sendTelegramMessage(config.botToken, chatId, message);
    
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message,
      sentAt: new Date().toISOString(),
      success: true,
      chatId,
    });

    return true;
  } catch (error) {
    console.error('Error sending custom message via Telegram:', error);
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
      sentAt: new Date().toISOString(),
      success: false,
      chatId: chatId || 'N/A',
    });
    return false;
  }
}

export async function sendTransactionReceiptViaTelegram(
  debtor: Debtor,
  transaction: Transaction
): Promise<boolean> {
  const config = await getTelegramConfig();
  
  if (!config.isEnabled || !config.botToken) {
    return false;
  }

  const chatId = config.chatIds[debtor.id] || config.defaultChatId;
  
  if (!chatId) {
    return false;
  }

  try {
    const typeEmoji = transaction.type === 'debt' ? '📈' : '📉';
    const typeText = transaction.type === 'debt' ? 'قەرز' : 'پارەدان';

    const message = `🧾 <b>وەسڵی مامەڵە</b>\n\n` +
      `👤 ناوی کڕیار: ${debtor.name}\n` +
      `${typeEmoji} جۆر: ${typeText}\n` +
      `💰 بڕ: <b>${transaction.amount.toLocaleString('en-US')} دینار</b>\n` +
      `📝 وەسف: ${transaction.description}\n` +
      `📅 بەروار: ${new Date(transaction.date).toLocaleDateString('ku')}\n\n` +
      `📊 کۆی قەرز: <b>${debtor.totalDebt.toLocaleString('en-US')} دینار</b>`;

    await sendTelegramMessage(config.botToken, chatId, message);
    
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message,
      sentAt: new Date().toISOString(),
      success: true,
      chatId,
    });

    return true;
  } catch (error) {
    console.error('Error sending receipt via Telegram:', error);
    await saveSentMessage({
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      message: `Failed: ${error instanceof Error ? error.message : String(error)}`,
      sentAt: new Date().toISOString(),
      success: false,
      chatId: chatId || 'N/A',
    });
    return false;
  }
}

export async function sendBulkRemindersViaTelegram(debtors: Debtor[]): Promise<{
  success: number;
  failed: number;
  failedDebtors: { name: string; reason: string }[];
}> {
  let success = 0;
  let failed = 0;
  const failedDebtors: { name: string; reason: string }[] = [];
  const config = await getTelegramConfig();

  if (!config.isEnabled || !config.botToken) {
    return { success: 0, failed: debtors.length, failedDebtors: debtors.map(d => ({ name: d.name, reason: 'Telegram ناچالاکە' })) };
  }

  console.log(`🚀 دەستپێکردنی ناردنی ${debtors.length} یادەوەری...`);

  for (const debtor of debtors) {
    const chatId = config.chatIds[debtor.id] || config.defaultChatId;
    
    if (!chatId || !chatId.trim()) {
      console.log(`❌ ${debtor.name}: Chat ID نییە`);
      failed++;
      failedDebtors.push({ name: debtor.name, reason: 'Chat ID دانەنراوە' });
      continue;
    }

    const verification = await verifyChatConnection(config.botToken, chatId);
    if (!verification.isActive) {
      console.log(`❌ ${debtor.name}: پەیوەندی ناچالاک - ${verification.message}`);
      failed++;
      failedDebtors.push({ name: debtor.name, reason: verification.message || 'پەیوەندی ناچالاک' });
      await new Promise(resolve => setTimeout(resolve, 300));
      continue;
    }

    const result = await sendDebtReminderViaTelegram(debtor);
    if (result) {
      console.log(`✅ ${debtor.name}: نێردرا`);
      success++;
    } else {
      console.log(`❌ ${debtor.name}: شکستی هێنا`);
      failed++;
      failedDebtors.push({ name: debtor.name, reason: 'هەڵەی نەزانراو' });
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`✅ سەرکەوتوو: ${success}, ❌ شکستخواردوو: ${failed}`);

  return { success, failed, failedDebtors };
}

export async function testTelegramConnection(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const trimmedChatId = chatId.trim();
    
    if (!/^-?\d+$/.test(trimmedChatId)) {
      return {
        success: false,
        message: `Chat ID هەڵەیە: "${trimmedChatId}"\n\nChat ID دەبێت تەنها ژمارە بێت (وەک: 123456789)`,
      };
    }

    const verification = await verifyChatConnection(botToken, trimmedChatId);
    if (!verification.isActive) {
      return {
        success: false,
        message: verification.message || 'پەیوەندی ناچالاکە',
      };
    }

    const testMessage = '✅ <b>تاقیکردنەوەی پەیوەندی</b>\n\nپەیوەندی Telegram بە سەرکەوتوویی جێبەجێ کرا! 🎉\n\nئێستا دەتوانیت یادەوەری و ئاگادارکردنەوەکان بنێریت.';
    
    await sendTelegramMessage(botToken, trimmedChatId, testMessage);
    
    return {
      success: true,
      message: '✅ پەیوەندی بە سەرکەوتوویی جێبەجێ کرا! پەیامی تاقیکردنەوە نێردرا.',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: errorMsg,
    };
  }
}

export async function getBotInfo(botToken: string): Promise<{
  success: boolean;
  botUsername?: string;
  botName?: string;
  message?: string;
}> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getMe`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      return {
        success: false,
        message: data.description || 'Bot Token هەڵەیە',
      };
    }
    
    return {
      success: true,
      botUsername: data.result.username,
      botName: data.result.first_name,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getUpdates(botToken: string): Promise<{
  success: boolean;
  updates?: any[];
  message?: string;
}> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      return {
        success: false,
        message: data.description || 'هەڵە لە وەرگرتنی زانیاری',
      };
    }
    
    return {
      success: true,
      updates: data.result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function detectChatIdsFromUpdates(botToken: string): Promise<{
  success: boolean;
  chatIds?: { chatId: string; name: string; username?: string }[];
  message?: string;
}> {
  try {
    const result = await getUpdates(botToken);
    
    if (!result.success || !result.updates) {
      return {
        success: false,
        message: result.message || 'هەڵە لە وەرگرتنی زانیاری',
      };
    }
    
    const chatMap = new Map<string, { chatId: string; name: string; username?: string }>();
    
    for (const update of result.updates) {
      if (update.message?.chat) {
        const chat = update.message.chat;
        const chatId = chat.id.toString();
        const name = chat.first_name || chat.username || 'نەزانراو';
        const username = chat.username;
        
        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, { chatId, name, username });
        }
      }
    }
    
    return {
      success: true,
      chatIds: Array.from(chatMap.values()),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyChatConnection(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; isActive: boolean; message?: string; chatInfo?: any }> {
  try {
    const trimmedChatId = chatId.trim();
    
    if (!/^-?\d+$/.test(trimmedChatId)) {
      return {
        success: false,
        isActive: false,
        message: 'Chat ID هەڵەیە - دەبێت تەنها ژمارە بێت',
      };
    }

    const url = `https://api.telegram.org/bot${botToken}/getChat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: trimmedChatId }),
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      const errorMsg = data.description || 'پەیوەندی ناچالاکە';
      let userMessage = errorMsg;
      
      if (errorMsg.includes('chat not found')) {
        userMessage = 'گفتوگۆ نەدۆزرایەوە - تکایە لە Telegram بۆتەکە Start بکە';
      } else if (errorMsg.includes('bot was blocked')) {
        userMessage = 'بۆتەکە بلۆک کراوە - تکایە بلۆکەکە هەڵبوەشێنەرەوە';
      } else if (errorMsg.includes('Unauthorized')) {
        userMessage = 'Bot Token هەڵەیە';
      }
      
      return {
        success: false,
        isActive: false,
        message: userMessage,
      };
    }
    
    return {
      success: true,
      isActive: true,
      chatInfo: data.result,
    };
  } catch (error) {
    return {
      success: false,
      isActive: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export function generateBotDeepLink(botUsername: string, startParam?: string): string {
  const param = startParam ? `?start=${startParam}` : '';
  return `https://t.me/${botUsername}${param}`;
}

export function generateCustomerBotLink(botUsername: string, debtorId: string): string {
  return `https://t.me/${botUsername}?start=register_${debtorId}`;
}

export async function processStartCommand(botToken: string, debtorId: string, chatId: string): Promise<{ success: boolean; message: string }> {
  try {
    await setDebtorChatId(debtorId, chatId);
    
    const welcomeMessage = 
      `🎉 <b>بەخێربێیت!</b>\n\n` +
      `✅ هەژمارەکەت بە سەرکەوتوویی پەیوەست کرا بە سیستەمی بەڕێوەبردنی قەرز!\n\n` +
      `ئێستا دەتوانیت:\n` +
      `📊 قەرزەکانت ببینیت\n` +
      `💰 یادەوەری پارەدان وەربگریت\n` +
      `📝 زانیاری مامەڵەکانت بزانیت\n\n` +
      `🙏 سوپاس بۆ بەکارهێنانی سیستەمی ئێمە!`;
    
    await sendTelegramMessage(botToken, chatId, welcomeMessage);
    
    return {
      success: true,
      message: 'Chat ID بە سەرکەوتوویی تۆمار کرا',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export function generateCustomerWebLink(debtorId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rork.app';
  return `${baseUrl}/customer-debt-view/${debtorId}`;
}

export function generateInvitationLink(marketId: string, debtorId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://rork.app';
  return `${baseUrl}/invitation/${marketId}/${debtorId}`;
}

export function generateAppDownloadLink(): string {
  return 'https://rork.app/download';
}

export async function sendSetupInstructions(
  botToken: string,
  chatId: string,
  debtorName: string
): Promise<boolean> {
  try {
    const message = `🎉 <b>بەخێربێیت ${debtorName}!</b>\n\n` +
      `✅ هەژمارەکەت بە سەرکەوتوویی پەیوەست کرا بە Telegram!\n\n` +
      `ئێستا دەتوانیت:\n` +
      `📊 قەرزەکانت ببینیت\n` +
      `💰 یادەوەری پارەدان وەربگریت\n` +
      `📝 زانیاری مامەڵەکانت بزانیت\n\n` +
      `🙏 سوپاس بۆ بەکارهێنانی سیستەمی ئێمە!`;
    
    await sendTelegramMessage(botToken, chatId, message);
    return true;
  } catch (error) {
    console.error('Error sending setup instructions:', error);
    return false;
  }
}

async function saveSentMessage(message: TelegramMessage): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(TELEGRAM_SENT_MESSAGES_KEY);
    const messages = await safeJSONParse<TelegramMessage[]>(stored, []);
    messages.unshift(message);
    
    const recentMessages = messages.slice(0, 100);
    await AsyncStorage.setItem(TELEGRAM_SENT_MESSAGES_KEY, JSON.stringify(recentMessages));
  } catch (error) {
    console.error('Error saving sent message:', error);
  }
}

export async function getSentMessages(): Promise<TelegramMessage[]> {
  try {
    const stored = await AsyncStorage.getItem(TELEGRAM_SENT_MESSAGES_KEY);
    const parsed = await safeJSONParse<TelegramMessage[]>(stored, []);
    return parsed;
  } catch (error) {
    console.error('Error getting sent messages:', error);
    return [];
  }
}

export async function clearSentMessages(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TELEGRAM_SENT_MESSAGES_KEY);
  } catch (error) {
    console.error('Error clearing sent messages:', error);
  }
}

export async function setBotTokenAndDefaultChat(
  botToken: string,
  defaultChatId: string
): Promise<void> {
  const config = await getTelegramConfig();
  config.botToken = botToken;
  config.defaultChatId = defaultChatId;
  config.isEnabled = true;
  await saveTelegramConfig(config);
}

export async function setDebtorChatId(
  debtorId: string,
  chatId: string
): Promise<void> {
  const config = await getTelegramConfig();
  config.chatIds[debtorId] = chatId;
  await saveTelegramConfig(config);
}

export async function removeDebtorChatId(debtorId: string): Promise<void> {
  const config = await getTelegramConfig();
  delete config.chatIds[debtorId];
  await saveTelegramConfig(config);
}

export async function toggleTelegram(enabled: boolean): Promise<void> {
  const config = await getTelegramConfig();
  config.isEnabled = enabled;
  await saveTelegramConfig(config);
}

export async function setAutoReminders(enabled: boolean, frequencyDays?: number): Promise<void> {
  const config = await getTelegramConfig();
  config.autoSendReminders = enabled;
  if (frequencyDays !== undefined) {
    config.reminderFrequencyDays = frequencyDays;
  }
  await saveTelegramConfig(config);
}

export async function sendAutomaticBackupToManager(
  debtors: any[],
  marketName?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getTelegramConfig();
    
    if (!config.isEnabled || !config.botToken) {
      return { success: false, message: 'Telegram ناچالاکە' };
    }
    
    const managerChatId = config.defaultChatId;
    if (!managerChatId || !managerChatId.trim()) {
      return { success: false, message: 'Chat ID بەڕێوەبەر دانەنراوە' };
    }
    
    const totalDebt = debtors.reduce((sum, d) => sum + (d.totalDebt || 0), 0);
    const debtorsWithDebt = debtors.filter(d => d.totalDebt > 0);
    const debtorsWithoutDebt = debtors.filter(d => d.totalDebt <= 0);
    const totalTransactions = debtors.reduce((sum, d) => sum + (d.transactions?.length || 0), 0);
    const totalDebtTransactions = debtors.reduce((sum, d) => 
      sum + (d.transactions?.filter((t: Transaction) => t.type === 'debt').length || 0), 0
    );
    const totalPaymentTransactions = debtors.reduce((sum, d) => 
      sum + (d.transactions?.filter((t: Transaction) => t.type === 'payment').length || 0), 0
    );
    
    const timestamp = new Date().toLocaleString('ku', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const headerMessage = 
      `╔════════════════════════════╗\n` +
      `     🔄 <b>باکئەپی خۆکار</b>\n` +
      `  <b>ڕاپۆرتی تەواوی قەرزدارەکان</b>\n` +
      `╚════════════════════════════╝\n\n` +
      `⏰ <b>کات:</b> <i>${timestamp}</i>\n` +
      (marketName ? `🏪 <b>فرۆشگا:</b> <code>${marketName}</code>\n` : '') +
      `\n╭────────────────────────╮\n` +
      `│ 📊 <b>پوختەی گشتی</b>\n` +
      `╰────────────────────────╯\n` +
      `👥 کۆی قەرزدارەکان: <b>${debtors.length} کەس</b>\n` +
      `   ┣ 🔴 قەرزداری بە قەرز: <b>${debtorsWithDebt.length} کەس</b>\n` +
      `   ┗ ✅ قەرزداری بێ قەرز: <b>${debtorsWithoutDebt.length} کەس</b>\n\n` +
      `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
      `┃ 💰 <b>کۆی گشتی قەرزەکان</b>\n` +
      `┃ <b>${totalDebt.toLocaleString('en-US')} دینار</b>\n` +
      `┗━━━━━━━━━━━━━━━━━━━━┛\n\n` +
      `📝 <b>کۆی مامەڵەکان:</b> ${totalTransactions} مامەڵە\n` +
      `   ┣ 🔴 قەرزەکان: <b>${totalDebtTransactions}</b> مامەڵە\n` +
      `   ┗ 🟢 پارەدانەکان: <b>${totalPaymentTransactions}</b> مامەڵە\n`;
    
    let debtorsList = '\n╭────────────────────────╮\n│ 📋 <b>لیستی تەواوی قەرزدارەکان</b>\n╰────────────────────────╯\n\n';
    const sortedDebtors = [...debtors]
      .sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0));
    
    const MAX_MESSAGE_LENGTH = 4000;
    let currentLength = 0;
    let includedDebtors = 0;
    
    for (const debtor of sortedDebtors) {
      const transactions = (debtor.transactions || []).sort((a: Transaction, b: Transaction) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const transactionCount = transactions.length;
      const debtAmount = debtor.totalDebt || 0;
      const debtStatus = debtAmount > 0 ? '🔴' : '✅';
      const totalDebtAmount = transactions.filter((t: Transaction) => t.type === 'debt').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      const totalPaymentAmount = transactions.filter((t: Transaction) => t.type === 'payment').reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      
      let debtorLine = `┏━━━━━━━━━━━━━━━━━━━━━┓\n`;
      debtorLine += `┃ ${debtStatus} <b>${debtor.name}</b>\n`;
      debtorLine += `┗━━━━━━━━━━━━━━━━━━━━━┛\n`;
      debtorLine += `💰 <b>قەرزی ماوە:</b> ${Math.abs(debtAmount).toLocaleString('en-US')} دینار\n`;
      debtorLine += `📝 <b>ژمارەی مامەڵەکان:</b> ${transactionCount}\n`;
      debtorLine += `🔴 <b>کۆی قەرزەکان:</b> ${totalDebtAmount.toLocaleString('en-US')} دینار\n`;
      debtorLine += `🟢 <b>کۆی پارەدانەکان:</b> ${totalPaymentAmount.toLocaleString('en-US')} دینار\n`;
      
      if (debtor.phone) {
        debtorLine += `📞 <b>تەلەفۆن:</b> <code>${debtor.phone}</code>\n`;
      }
      
      if (transactions.length > 0) {
        debtorLine += `\n╭─────────────────────╮\n`;
        debtorLine += `│ 📋 <b>وردەکاری مامەڵەکان</b>\n`;
        debtorLine += `╰─────────────────────╯\n`;
        const recentTransactions = transactions.slice(0, 10);
        for (let i = 0; i < recentTransactions.length; i++) {
          const trans = recentTransactions[i];
          const transDate = new Date(trans.date).toLocaleDateString('ku', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          const transType = trans.type === 'debt' ? '🔴 قەرز' : '🟢 پارەدان';
          const transIcon = trans.type === 'debt' ? '📤' : '📥';
          debtorLine += `\n<b>${i + 1}.</b> ${transType} ${transIcon}\n`;
          debtorLine += `   ┣ 💵 <b>بڕ:</b> ${trans.amount.toLocaleString('en-US')} دینار\n`;
          debtorLine += `   ┣ 📝 <b>وەسف:</b> <i>${trans.description}</i>\n`;
          debtorLine += `   ┣ 📅 <b>بەروار:</b> ${transDate}\n`;
          if (trans.comment && trans.comment.trim()) {
            debtorLine += `   ┗ 💬 <b>تێبینی:</b> "${trans.comment}"\n`;
          } else {
            debtorLine += `   ┗ 💬 <b>تێبینی:</b> <i>بەتاڵ</i>\n`;
          }
          if (i < recentTransactions.length - 1) {
            debtorLine += `   ┃\n`;
          }
        }
        if (transactions.length > 10) {
          debtorLine += `\n   ⋯ و ${transactions.length - 10} مامەڵەی تر\n`;
        }
      }
      debtorLine += `\n─────────────────────────\n`;
      
      if (currentLength + debtorLine.length > MAX_MESSAGE_LENGTH) {
        debtorsList += `\n📌 <i>... و ${sortedDebtors.length - includedDebtors} قەرزداری تر</i>\n`;
        debtorsList += `<i>(پەیام زۆر درێژە، بەشێک نیشان دەدرێت)</i>`;
        break;
      }
      
      debtorsList += debtorLine;
      currentLength += debtorLine.length;
      includedDebtors++;
    }
    
    const backupSettings = await hourlyBackup.getHourlyBackupSettings();
    const backupIntervalMinutes = backupSettings.intervalMinutes;
    
    const footerMessage = 
      `\n╔════════════════════════════╗\n` +
      `     ✅ <b>تەواوبوون</b>\n` +
      `╚════════════════════════════╝\n\n` +
      `ℹ️ <i>ئەم ڕاپۆرتە بە شێوەیەکی خۆکار دروستکراوە</i>\n` +
      `⏱️ <i>هەر ${backupIntervalMinutes || 60} خولەک جارێک دەنێردرێت</i>\n\n` +
      `📅 <b>دروستکراوە لە:</b> <i>${timestamp}</i>\n` +
      `🤖 <b>سیستەمی بەڕێوەبردنی قەرز</b>\n` +
      `💼 <b>باکئەپی خۆکار بۆ بەڕێوەبەر</b>`;
    
    const fullMessage = headerMessage + debtorsList + footerMessage;
    
    await sendTelegramMessage(config.botToken, managerChatId, fullMessage);
    
    console.log('✅ باکئەپی خۆکار بە سەرکەوتوویی نێردرا بۆ بەڕێوەبەر');
    return { success: true, message: 'باکئەپ بە سەرکەوتوویی نێردرا' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ هەڵە لە ناردنی باکئەپی خۆکار:', errorMsg);
    return { success: false, message: errorMsg };
  }
}
