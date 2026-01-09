import createContextHook from '@nkzw/create-context-hook';
import { Platform } from 'react-native';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useQuery } from '@tanstack/react-query';
import type { AppNotification, NotificationTemplate, NotificationType, UserRole } from '@/types';
import { safeJSONParse } from '@/utils/storageRecovery';

const NOTIFICATIONS_KEY = 'app_notifications';
const TEMPLATES_KEY = 'notification_templates';
const REMINDERS_KEY = 'debt_reminders';

export interface DebtReminder {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  dueDate: string;
  message: string;
  notificationId?: string;
  isActive: boolean;
  createdAt: string;
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

const DEFAULT_TEMPLATES: NotificationTemplate[] = [
  {
    id: '1',
    type: 'subscription',
    senderRole: 'owner',
    recipientRole: 'manager',
    title: 'ئاگاداری مۆڵەت',
    message: 'بەڕێز بەڕێوەبەر، مۆڵەتی مارکێتەکەت لە ڕۆژی {date} بەسەردەچێت. تکایە بۆ درێژکردنەوە پەیوەندی بکە.',
  },
  {
    id: '2',
    type: 'subscription',
    senderRole: 'owner',
    recipientRole: 'manager',
    title: 'نوێکردنەوەی مۆڵەت',
    message: 'بەڕێز بەڕێوەبەر، مۆڵەتی مارکێتەکەت درێژکرایەوە بۆ {days} ڕۆژ. کۆتا بەروار: {date}',
  },
  {
    id: '3',
    type: 'employee_guide',
    senderRole: 'manager',
    recipientRole: 'employee',
    title: 'ڕێنمایی بەڕێوەبردنی کڕیاران',
    message: 'بەڕێز کارمەند، تکایە لە تۆمارکردنی کڕیاران ورد بە. هەموو زانیاریەکان بە وردی بنووسە و دڵنیابە لە ووردی ژمارەکان.',
  },
  {
    id: '4',
    type: 'employee_guide',
    senderRole: 'manager',
    recipientRole: 'employee',
    title: 'گەیاندنی پەیام',
    message: 'بەڕێز کارمەند، {message}',
  },
  {
    id: '5',
    type: 'customer_info',
    senderRole: 'manager',
    recipientRole: 'customer',
    title: 'ئاگاداری قەرز',
    message: 'بەڕێز کڕیار، کۆی قەرزت لە {market} بریتییە لە {amount} دینار. تکایە لە کاتی خۆیدا پارە بدەرەوە.',
  },
  {
    id: '6',
    type: 'customer_info',
    senderRole: 'employee',
    recipientRole: 'customer',
    title: 'ئاگاداری قەرز',
    message: 'بەڕێز کڕیار، کۆی قەرزت لە {market} بریتییە لە {amount} دینار. تکایە لە کاتی خۆیدا پارە بدەرەوە.',
  },
  {
    id: '7',
    type: 'customer_info',
    senderRole: 'manager',
    recipientRole: 'customer',
    title: 'پەیامی تایبەت',
    message: 'بەڕێز کڕیار، {message}',
  },
  {
    id: '8',
    type: 'customer_info',
    senderRole: 'employee',
    recipientRole: 'customer',
    title: 'پەیامی تایبەت',
    message: 'بەڕێز کڕیار، {message}',
  },
  {
    id: '9',
    type: 'general',
    senderRole: 'manager',
    recipientRole: 'employee',
    title: 'ئاگادارکردنەوە',
    message: '{message}',
  },
  {
    id: '10',
    type: 'general',
    senderRole: 'manager',
    recipientRole: 'customer',
    title: 'ئاگادارکردنەوە',
    message: '{message}',
  },
];

export const [NotificationContext, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(DEFAULT_TEMPLATES);
  const [reminders, setReminders] = useState<DebtReminder[]>([]);
  const [hasUnviewedNotifications, setHasUnviewedNotifications] = useState<boolean>(false);
  const soundObject = useRef<Audio.Sound | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        const parsed = await safeJSONParse<AppNotification[]>(stored, []);
        
        if (!Array.isArray(parsed)) {
          console.error('Invalid notifications data');
          await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
          return [];
        }
        return parsed;
      } catch (error) {
        console.error('Error loading notifications:', error);
        await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
        return [];
      }
    },
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  const templatesQuery = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(TEMPLATES_KEY);
        const parsed = await safeJSONParse<NotificationTemplate[]>(stored, DEFAULT_TEMPLATES);
        
        if (!Array.isArray(parsed) || parsed.length === 0) {
          await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(DEFAULT_TEMPLATES));
          return DEFAULT_TEMPLATES;
        }
        return parsed;
      } catch (error) {
        console.error('Error loading templates:', error);
        await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(DEFAULT_TEMPLATES));
        return DEFAULT_TEMPLATES;
      }
    },
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  const remindersQuery = useQuery({
    queryKey: ['debtReminders'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(REMINDERS_KEY);
        const parsed = await safeJSONParse<DebtReminder[]>(stored, []);
        
        if (!Array.isArray(parsed)) {
          console.error('Invalid reminders data');
          await AsyncStorage.removeItem(REMINDERS_KEY);
          return [];
        }
        return parsed;
      } catch (error) {
        console.error('Error loading reminders:', error);
        await AsyncStorage.removeItem(REMINDERS_KEY);
        return [];
      }
    },
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data]);

  useEffect(() => {
    if (templatesQuery.data) {
      setTemplates(templatesQuery.data);
    }
  }, [templatesQuery.data]);

  useEffect(() => {
    if (remindersQuery.data) {
      setReminders(remindersQuery.data);
    }
  }, [remindersQuery.data]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      initNotifications().then(() => {
        requestPermissions();
        setupAudio();
      });
    }

    return () => {
      if (soundObject.current) {
        soundObject.current.unloadAsync();
      }
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const playNotificationSound = async () => {
    if (Platform.OS === 'web') {
      try {
        const audio = new window.Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        await audio.play();
      } catch (error) {
        console.log('Web audio playback skipped:', error);
      }
      return;
    }

    try {
      if (soundObject.current) {
        try {
          await soundObject.current.unloadAsync();
        } catch (unloadError) {
          console.log('Error unloading previous sound:', unloadError);
        }
      }

      const soundUri = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
      if (!soundUri || soundUri.trim() === '') {
        console.log('Sound URI is empty, skipping playback');
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: soundUri },
        { shouldPlay: true, volume: 0.7 },
        null,
        false
      );
      
      soundObject.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(err => {
            console.log('Error unloading sound after playback:', err);
          });
          soundObject.current = null;
        }
      });
    } catch (error) {
      console.log('Notification sound playback skipped:', error);
      soundObject.current = null;
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return;
    }
    try {
      if (!NotificationsModule) {
        await initNotifications();
      }
      if (NotificationsModule) {
        const { status } = await NotificationsModule.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };



  const saveNotifications = async (newNotifications: AppNotification[]) => {
    try {
      const jsonString = JSON.stringify(newNotifications);
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, jsonString);
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error saving notifications:', error);
      throw error;
    }
  };

  const sendNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    recipientRole: UserRole,
    senderRole: UserRole,
    recipientId?: string,
    senderId?: string,
    marketId?: string
  ): Promise<string> => {
    try {
      const notification: AppNotification = {
        id: Date.now().toString(),
        type,
        title,
        message,
        recipientRole,
        recipientId,
        senderRole,
        senderId,
        marketId,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [notification, ...notifications];
      await saveNotifications(updated);
      setHasUnviewedNotifications(true);

      await playNotificationSound();

      if (Platform.OS !== 'web') {
        try {
          if (!NotificationsModule) {
            await initNotifications();
          }
          if (NotificationsModule) {
            await NotificationsModule.scheduleNotificationAsync({
              content: {
                title,
                body: message,
                data: { notificationId: notification.id },
                sound: true,
              },
              trigger: null,
            });
          }
        } catch (error) {
          console.log('Failed to schedule notification:', error);
        }
      }

      return notification.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }, [notifications]);

  const sendNotificationToAll = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    recipientRole: UserRole,
    senderRole: UserRole,
    recipientIds: string[],
    senderId?: string,
    marketId?: string
  ): Promise<string[]> => {
    try {
      const newNotifications: AppNotification[] = recipientIds.map(recipientId => ({
        id: `${Date.now()}-${recipientId}`,
        type,
        title,
        message,
        recipientRole,
        recipientId,
        senderRole,
        senderId,
        marketId,
        isRead: false,
        createdAt: new Date().toISOString(),
      }));

      const updated = [...newNotifications, ...notifications];
      await saveNotifications(updated);
      setHasUnviewedNotifications(true);

      await playNotificationSound();

      return newNotifications.map(n => n.id);
    } catch (error) {
      console.error('Error sending notifications to all:', error);
      throw error;
    }
  }, [notifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    await saveNotifications(updated);
  }, [notifications]);

  const markAllAsRead = useCallback(async (userRole: UserRole, userId?: string) => {
    const updated = notifications.map(n => {
      if (n.recipientRole === userRole) {
        if (!userId || n.recipientId === userId) {
          return { ...n, isRead: true };
        }
      }
      return n;
    });
    await saveNotifications(updated);
  }, [notifications]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    await saveNotifications(updated);
  }, [notifications]);

  const deleteAllNotifications = useCallback(async (userRole: UserRole, userId?: string) => {
    const updated = notifications.filter(n => {
      if (n.recipientRole === userRole) {
        if (!userId || n.recipientId === userId) {
          return false;
        }
      }
      return true;
    });
    await saveNotifications(updated);
  }, [notifications]);

  const getNotificationsForUser = useCallback((userRole: UserRole, userId?: string) => {
    return notifications.filter(n => {
      if (n.recipientRole === userRole) {
        if (!userId || n.recipientId === userId) {
          return true;
        }
      }
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  const getUnreadCount = useCallback((userRole: UserRole, userId?: string) => {
    return notifications.filter(n => {
      if (!n.isRead && n.recipientRole === userRole) {
        if (!userId || n.recipientId === userId) {
          return true;
        }
      }
      return false;
    }).length;
  }, [notifications]);

  const getTemplatesForSender = useCallback((senderRole: UserRole, recipientRole?: UserRole) => {
    return templates.filter(t => {
      if (t.senderRole === senderRole) {
        if (!recipientRole || t.recipientRole === recipientRole) {
          return true;
        }
      }
      return false;
    });
  }, [templates]);

  const applyTemplate = useCallback((template: NotificationTemplate, variables: Record<string, string>) => {
    let message = template.message;
    Object.keys(variables).forEach(key => {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), variables[key]);
    });
    return {
      title: template.title,
      message,
      type: template.type,
    };
  }, []);

  const markNotificationsAsViewed = useCallback(() => {
    setHasUnviewedNotifications(false);
  }, []);



  const saveReminders = async (newReminders: DebtReminder[]) => {
    try {
      const jsonString = JSON.stringify(newReminders);
      await AsyncStorage.setItem(REMINDERS_KEY, jsonString);
      setReminders(newReminders);
    } catch (error) {
      console.error('Error saving reminders:', error);
      throw error;
    }
  };

  const scheduleNotification = useCallback(async (
    debtorId: string,
    debtorName: string,
    amount: number,
    dueDate: string,
    message: string
  ): Promise<boolean> => {
    try {
      const reminder: DebtReminder = {
        id: Date.now().toString(),
        debtorId,
        debtorName,
        amount,
        dueDate,
        message,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      if (Platform.OS !== 'web') {
        try {
          if (!NotificationsModule) {
            await initNotifications();
          }
          if (NotificationsModule) {
            const triggerDate = new Date(dueDate);
            const seconds = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
            const notificationId = await NotificationsModule.scheduleNotificationAsync({
              content: {
                title: `یادەوەری قەرز - ${debtorName}`,
                body: message,
                data: { reminderId: reminder.id, debtorId, amount },
                sound: true,
              },
              trigger: seconds > 0 ? { type: NotificationsModule.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, repeats: false } : null,
            });
            reminder.notificationId = notificationId;
          }
        } catch (error) {
          console.error('Error scheduling native notification:', error);
        }
      }

      const updated = [...reminders, reminder];
      await saveReminders(updated);
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }, [reminders]);

  const cancelReminder = useCallback(async (reminderId: string) => {
    try {
      const reminder = reminders.find(r => r.id === reminderId);
      if (reminder?.notificationId && Platform.OS !== 'web') {
        try {
          if (!NotificationsModule) {
            await initNotifications();
          }
          if (NotificationsModule) {
            await NotificationsModule.cancelScheduledNotificationAsync(reminder.notificationId);
          }
        } catch (error) {
          console.error('Error canceling native notification:', error);
        }
      }

      const updated = reminders.filter(r => r.id !== reminderId);
      await saveReminders(updated);
    } catch (error) {
      console.error('Error canceling reminder:', error);
    }
  }, [reminders]);

  const getUpcomingReminders = useCallback((days: number = 30) => {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return reminders
      .filter(r => {
        const dueDate = new Date(r.dueDate);
        return r.isActive && dueDate > now && dueDate <= futureDate;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders]);

  const getOverdueReminders = useCallback(() => {
    const now = new Date();
    return reminders
      .filter(r => {
        const dueDate = new Date(r.dueDate);
        return r.isActive && dueDate <= now;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [reminders]);

  return useMemo(() => ({
    notifications,
    templates,
    reminders,
    sendNotification,
    sendNotificationToAll,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    getNotificationsForUser,
    getUnreadCount,
    getTemplatesForSender,
    applyTemplate,
    hasUnviewedNotifications,
    markNotificationsAsViewed,
    scheduleNotification,
    cancelReminder,
    getUpcomingReminders,
    getOverdueReminders,
  }), [
    notifications,
    templates,
    reminders,
    sendNotification,
    sendNotificationToAll,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    getNotificationsForUser,
    getUnreadCount,
    getTemplatesForSender,
    applyTemplate,
    hasUnviewedNotifications,
    markNotificationsAsViewed,
    scheduleNotification,
    cancelReminder,
    getUpcomingReminders,
    getOverdueReminders,
  ]);
});
