import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Debtor } from '@/types';
import { sendWhatsAppMessage } from './whatsapp';
import { sendDebtReminderViaTelegram, getTelegramConfig } from './telegram';
import { safeJSONParse } from './storageRecovery';

const AUTOMATIC_REMINDER_KEY = 'automatic_reminder_settings';
const LAST_REMINDER_DATE_KEY = 'last_automatic_reminder_date';
const REMINDER_HISTORY_KEY = 'reminder_history';

export type ReminderFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type NotificationMethod = 'app' | 'whatsapp' | 'telegram' | 'both';

export interface AutomaticReminderSettings {
  enabled: boolean;
  frequency: ReminderFrequency;
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  notificationMethod: NotificationMethod;
  customMessage?: string;
  onlyWithDebt: boolean;
  minimumDebtAmount?: number;
  overdueOnly?: boolean;
  overdueDays?: number;
}

export interface ReminderHistory {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  sentAt: string;
  method: NotificationMethod;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  errorMessage?: string;
}

export const getAutomaticReminderSettings = async (): Promise<AutomaticReminderSettings> => {
  try {
    const stored = await AsyncStorage.getItem(AUTOMATIC_REMINDER_KEY);
    if (!stored) {
      return {
        enabled: false,
        frequency: 'weekly',
        timeOfDay: '09:00',
        dayOfWeek: 1,
        notificationMethod: 'both',
        onlyWithDebt: true,
      };
    }
    return await safeJSONParse(stored, {
      enabled: false,
      frequency: 'weekly',
      timeOfDay: '09:00',
      dayOfWeek: 1,
      notificationMethod: 'both',
      onlyWithDebt: true,
    });
  } catch (error) {
    console.error('Error loading automatic reminder settings:', error);
    return {
      enabled: false,
      frequency: 'weekly',
      timeOfDay: '09:00',
      dayOfWeek: 1,
      notificationMethod: 'both',
      onlyWithDebt: true,
    };
  }
};

export const saveAutomaticReminderSettings = async (settings: AutomaticReminderSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTOMATIC_REMINDER_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving automatic reminder settings:', error);
    throw error;
  }
};

const generateReminderMessage = (debtor: Debtor, customMessage?: string): string => {
  if (customMessage) {
    return customMessage
      .replace('{name}', debtor.name)
      .replace('{amount}', debtor.totalDebt.toLocaleString('en-US'))
      .replace('{phone}', debtor.phone || '');
  }
  
  return `سڵاو ${debtor.name}،\n\nیادەوەرییەکی میهرەبانانەیە دەربارەی قەرزەکەت:\nکۆی قەرز: ${debtor.totalDebt.toLocaleString('en-US')} دینار\n\nزۆر سوپاس بۆ هاوکاریەکەت! 🙏`;
};

const addToHistory = async (history: ReminderHistory) => {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_HISTORY_KEY);
    const existingHistory: ReminderHistory[] = await safeJSONParse(stored, []);
    const updated = [history, ...existingHistory].slice(0, 1000);
    await AsyncStorage.setItem(REMINDER_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding to reminder history:', error);
  }
};

export const sendAutomaticReminders = async (
  debtors: Debtor[],
  settings: AutomaticReminderSettings,
  sendNotification: (
    type: 'customer_info',
    title: string,
    message: string,
    recipientRole: 'customer',
    senderRole: 'manager',
    recipientId?: string,
    senderId?: string,
    marketId?: string
  ) => Promise<string>
): Promise<void> => {
  if (!settings.enabled) {
    return;
  }

  try {
    let filteredDebtors = debtors;
    
    if (settings.onlyWithDebt) {
      filteredDebtors = debtors.filter(d => d.totalDebt > 0);
    }
    
    if (settings.minimumDebtAmount) {
      filteredDebtors = filteredDebtors.filter(d => d.totalDebt >= (settings.minimumDebtAmount || 0));
    }

    if (settings.overdueOnly && settings.overdueDays) {
      const now = new Date();
      filteredDebtors = filteredDebtors.filter(d => {
        if (d.totalDebt <= 0) return false;
        
        const lastDebtTransaction = d.transactions
          .filter(t => t.type === 'debt')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (!lastDebtTransaction) return false;
        
        const lastDebtDate = new Date(lastDebtTransaction.date);
        const daysSinceLastDebt = Math.floor((now.getTime() - lastDebtDate.getTime()) / (24 * 60 * 60 * 1000));
        
        return daysSinceLastDebt >= (settings.overdueDays || 30);
      });
    }

    if (filteredDebtors.length === 0) {
      console.log('No debtors match the criteria, skipping automatic reminders');
      return;
    }

    console.log(`Sending automatic reminders to ${filteredDebtors.length} debtors`);

    for (const debtor of filteredDebtors) {
      const title = 'یادەوەری قەرز';
      const message = generateReminderMessage(debtor, settings.customMessage);

      try {
        if (settings.notificationMethod === 'app' || settings.notificationMethod === 'both') {
          if (Platform.OS !== 'web') {
            try {
              const Notifications = await import('expo-notifications');
              await Notifications.scheduleNotificationAsync({
                content: {
                  title,
                  body: message,
                  data: { 
                    debtorId: debtor.id, 
                    amount: debtor.totalDebt,
                    automatic: true,
                  },
                  sound: true,
                },
                trigger: null,
              });
            } catch (notificationError) {
              console.log('Notifications not available, skipping:', notificationError);
            }
          }

          if (debtor.userId) {
            await sendNotification(
              'customer_info',
              title,
              message,
              'customer',
              'manager',
              debtor.userId,
              undefined,
              undefined
            );
          }

          await addToHistory({
            id: `${Date.now()}-${debtor.id}-app`,
            debtorId: debtor.id,
            debtorName: debtor.name,
            amount: debtor.totalDebt,
            sentAt: new Date().toISOString(),
            method: 'app',
            status: 'sent',
          });
        }

        if ((settings.notificationMethod === 'whatsapp' || settings.notificationMethod === 'both') && debtor.phone) {
          const success = await sendWhatsAppMessage(debtor.phone, message);
          
          await addToHistory({
            id: `${Date.now()}-${debtor.id}-whatsapp`,
            debtorId: debtor.id,
            debtorName: debtor.name,
            amount: debtor.totalDebt,
            sentAt: new Date().toISOString(),
            method: 'whatsapp',
            status: success ? 'sent' : 'failed',
            errorMessage: success ? undefined : 'Failed to open WhatsApp',
          });
        }

        if ((settings.notificationMethod === 'telegram' || settings.notificationMethod === 'both')) {
          try {
            const telegramConfig = await getTelegramConfig();
            if (telegramConfig.isEnabled && telegramConfig.botToken) {
              const success = await sendDebtReminderViaTelegram(debtor);
              
              await addToHistory({
                id: `${Date.now()}-${debtor.id}-telegram`,
                debtorId: debtor.id,
                debtorName: debtor.name,
                amount: debtor.totalDebt,
                sentAt: new Date().toISOString(),
                method: 'app',
                status: success ? 'sent' : 'failed',
                errorMessage: success ? undefined : 'Failed to send via Telegram',
              });
            }
          } catch (telegramError) {
            console.error(`Error sending Telegram reminder to ${debtor.name}:`, telegramError);
            await addToHistory({
              id: `${Date.now()}-${debtor.id}-telegram-error`,
              debtorId: debtor.id,
              debtorName: debtor.name,
              amount: debtor.totalDebt,
              sentAt: new Date().toISOString(),
              method: 'app',
              status: 'failed',
              errorMessage: telegramError instanceof Error ? telegramError.message : 'Telegram error',
            });
          }
        }
      } catch (error) {
        console.error(`Error sending reminder to ${debtor.name}:`, error);
        await addToHistory({
          id: `${Date.now()}-${debtor.id}-error`,
          debtorId: debtor.id,
          debtorName: debtor.name,
          amount: debtor.totalDebt,
          sentAt: new Date().toISOString(),
          method: settings.notificationMethod,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    await AsyncStorage.setItem(LAST_REMINDER_DATE_KEY, new Date().toISOString());
    console.log(`Automatic reminders sent successfully`);
  } catch (error) {
    console.error('Error sending automatic reminders:', error);
    throw error;
  }
};

const calculateNextReminderDate = (settings: AutomaticReminderSettings): Date => {
  const now = new Date();
  const [hours, minutes] = settings.timeOfDay.split(':').map(Number);
  const nextDate = new Date(now);
  nextDate.setHours(hours, minutes, 0, 0);

  switch (settings.frequency) {
    case 'daily':
      if (nextDate.getTime() <= now.getTime()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;

    case 'weekly':
      const currentDay = now.getDay();
      const targetDay = settings.dayOfWeek || 1;
      let daysUntil = (targetDay - currentDay + 7) % 7;
      if (daysUntil === 0 && nextDate.getTime() <= now.getTime()) {
        daysUntil = 7;
      }
      nextDate.setDate(nextDate.getDate() + daysUntil);
      break;

    case 'biweekly':
      const currentDayBi = now.getDay();
      const targetDayBi = settings.dayOfWeek || 1;
      let daysUntilBi = (targetDayBi - currentDayBi + 7) % 7;
      if (daysUntilBi === 0 && nextDate.getTime() <= now.getTime()) {
        daysUntilBi = 14;
      } else {
        daysUntilBi = daysUntilBi || 14;
      }
      nextDate.setDate(nextDate.getDate() + daysUntilBi);
      break;

    case 'monthly':
      const targetDayOfMonth = settings.dayOfMonth || 1;
      nextDate.setDate(targetDayOfMonth);
      if (nextDate.getTime() <= now.getTime()) {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
  }

  return nextDate;
};

export const scheduleAutomaticReminders = async (
  debtors: Debtor[],
  settings: AutomaticReminderSettings,
  sendNotification: (
    type: 'customer_info',
    title: string,
    message: string,
    recipientRole: 'customer',
    senderRole: 'manager',
    recipientId?: string,
    senderId?: string,
    marketId?: string
  ) => Promise<string>
): Promise<void> => {
  if (!settings.enabled || Platform.OS === 'web') {
    console.log('Scheduling skipped: reminders disabled or running on web');
    return;
  }

  try {
    const nextDate = calculateNextReminderDate(settings);
    const secondsUntilNext = Math.floor((nextDate.getTime() - Date.now()) / 1000);

    if (secondsUntilNext <= 0) {
      console.log('Invalid schedule time');
      return;
    }

    console.log(`Scheduling next automatic reminder for: ${nextDate.toISOString()}`);
    console.log(`Seconds until trigger: ${secondsUntilNext}`);

    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'وەختی ناردنی یادەوەرییە',
          body: 'ئێستا یادەوەرییەکان دەنێردرێن بۆ قەرزدارەکان',
          data: { automatic: true, trigger: 'schedule' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilNext,
          repeats: false,
        },
      });
    } catch (error) {
      console.log('Notifications not available, skipping schedule:', error);
    }

    console.log('Scheduled automatic reminder notification');
  } catch (error) {
    console.error('Error scheduling automatic reminders:', error);
    throw error;
  }
};

export const cancelAutomaticReminders = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all automatic reminders');
  } catch (error) {
    console.log('Notifications not available, skipping cancel:', error);
  }
};

export const checkAndSendAutomaticReminders = async (
  debtors: Debtor[],
  sendNotification: (
    type: 'customer_info',
    title: string,
    message: string,
    recipientRole: 'customer',
    senderRole: 'manager',
    recipientId?: string,
    senderId?: string,
    marketId?: string
  ) => Promise<string>
): Promise<boolean> => {
  try {
    const settings = await getAutomaticReminderSettings();
    
    if (!settings.enabled) {
      return false;
    }

    const lastReminderDate = await AsyncStorage.getItem(LAST_REMINDER_DATE_KEY);
    const now = new Date();

    if (lastReminderDate) {
      const lastDate = new Date(lastReminderDate);
      const hoursSinceLastReminder = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60));

      const minHours = settings.frequency === 'daily' ? 23 : 
                       settings.frequency === 'weekly' ? 167 : 
                       settings.frequency === 'biweekly' ? 335 : 
                       settings.frequency === 'monthly' ? 719 : 23;

      if (hoursSinceLastReminder < minHours) {
        console.log(`Last reminder was sent ${hoursSinceLastReminder} hours ago, skipping (need ${minHours})`);
        return false;
      }
    }

    const nextDate = calculateNextReminderDate(settings);
    const minutesDiff = Math.abs((nextDate.getTime() - now.getTime()) / (1000 * 60));

    if (minutesDiff <= 5) {
      console.log('Time to send automatic reminders!');
      await sendAutomaticReminders(debtors, settings, sendNotification);
      await scheduleAutomaticReminders(debtors, settings, sendNotification);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking and sending automatic reminders:', error);
    return false;
  }
};

export const getReminderHistory = async (limit: number = 100): Promise<ReminderHistory[]> => {
  try {
    const stored = await AsyncStorage.getItem(REMINDER_HISTORY_KEY);
    if (!stored) return [];
    const history: ReminderHistory[] = await safeJSONParse<ReminderHistory[]>(stored, []);
    return history.slice(0, limit);
  } catch (error) {
    console.error('Error loading reminder history:', error);
    return [];
  }
};

export const clearReminderHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REMINDER_HISTORY_KEY);
    console.log('Reminder history cleared');
  } catch (error) {
    console.error('Error clearing reminder history:', error);
    throw error;
  }
};

export const getLastReminderDate = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_REMINDER_DATE_KEY);
  } catch (error) {
    console.error('Error getting last reminder date:', error);
    return null;
  }
};

export const getNextReminderDate = async (): Promise<Date | null> => {
  try {
    const settings = await getAutomaticReminderSettings();
    if (!settings.enabled) return null;
    return calculateNextReminderDate(settings);
  } catch (error) {
    console.error('Error calculating next reminder date:', error);
    return null;
  }
};
