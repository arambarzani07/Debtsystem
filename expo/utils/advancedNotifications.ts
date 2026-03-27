import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Debtor } from '@/types';
import { safeJSONParse } from './storageRecovery';

const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';

export interface ScheduledNotification {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  scheduledDate: string;
  notificationId?: string;
  isSent: boolean;
  type: 'reminder' | 'warning' | 'critical';
  escalationLevel: number;
}

// Lazy load and setup notification handler
let NotificationsModule: typeof import('expo-notifications') | null = null;
const initNotifications = async () => {
  if (Platform.OS === 'web' || NotificationsModule) {
    return;
  }
  try {
    NotificationsModule = await import('expo-notifications');
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.log('expo-notifications not available:', error);
  }
};

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    await initNotifications();
    if (!NotificationsModule) {
      return false;
    }
    
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    console.log('Notifications not available:', error);
    return false;
  }
}

export async function scheduleDebtReminder(
  debtor: Debtor,
  daysFromNow: number,
  escalationLevel: number = 0
): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return null;
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

    let title = 'یادەوەری قەرز';
    let body = `${debtor.name}: ${debtor.totalDebt.toLocaleString('en-US')}`;
    let type: 'reminder' | 'warning' | 'critical' = 'reminder';

    if (escalationLevel === 1) {
      title = 'ئاگاداری قەرز';
      type = 'warning';
    } else if (escalationLevel >= 2) {
      title = 'ئاگاداری گرنگ - قەرز';
      type = 'critical';
    }

    await initNotifications();
    if (!NotificationsModule) {
      console.log('Notifications not available, skipping scheduling');
      return null;
    }

    const notificationId = await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { debtorId: debtor.id, amount: debtor.totalDebt, escalationLevel },
        sound: true,
        priority: escalationLevel >= 2 ? NotificationsModule.AndroidNotificationPriority.HIGH : NotificationsModule.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });

    const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const notifications: ScheduledNotification[] = await safeJSONParse<ScheduledNotification[]>(stored, []);

    const newNotification: ScheduledNotification = {
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      amount: debtor.totalDebt,
      scheduledDate: scheduledDate.toISOString(),
      notificationId,
      isSent: false,
      type,
      escalationLevel,
    };

    notifications.push(newNotification);
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));

    console.log('Scheduled notification:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function scheduleEscalatingReminders(debtor: Debtor): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await scheduleDebtReminder(debtor, 7, 0);
  await scheduleDebtReminder(debtor, 14, 1);
  await scheduleDebtReminder(debtor, 21, 2);
}

export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await initNotifications();
    if (NotificationsModule) {
      await NotificationsModule.cancelScheduledNotificationAsync(notificationId);
    }
    
    const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const notifications: ScheduledNotification[] = await safeJSONParse<ScheduledNotification[]>(stored, []);
    
    const updated = notifications.filter(n => n.notificationId !== notificationId);
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.log('Error canceling notification:', error);
  }
}

export async function cancelAllDebtorNotifications(debtorId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    const notifications: ScheduledNotification[] = await safeJSONParse<ScheduledNotification[]>(stored, []);
    
    const debtorNotifications = notifications.filter(n => n.debtorId === debtorId);
    
    await initNotifications();
    if (NotificationsModule) {
      for (const notification of debtorNotifications) {
        if (notification.notificationId) {
          try {
            await NotificationsModule.cancelScheduledNotificationAsync(notification.notificationId);
          } catch (error) {
            console.log('Error canceling notification:', error);
          }
        }
      }
    }
    
    const updated = notifications.filter(n => n.debtorId !== debtorId);
    await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error canceling debtor notifications:', error);
  }
}

export async function getScheduledNotifications(): Promise<ScheduledNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
    return await safeJSONParse<ScheduledNotification[]>(stored, []);
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

export async function sendImmediateNotification(
  debtor: Debtor,
  message: string
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    await initNotifications();
    if (NotificationsModule) {
      await NotificationsModule.scheduleNotificationAsync({
        content: {
          title: debtor.name,
          body: message,
          data: { debtorId: debtor.id },
          sound: true,
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
}
