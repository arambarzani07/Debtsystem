import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Debtor, Transaction, Currency, DebtorCategory, ColorTag, PaymentScheduleItem, TransactionHistoryItem } from '@/types';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMarket } from '@/contexts/MarketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { safeJSONParse } from '@/utils/storageRecovery';
import { useHourlyBackup } from '@/utils/hourlyBackup';

export const [DebtContext, useDebt] = createContextHook(() => {
  let marketContext: ReturnType<typeof useMarket> | null = null;
  let notificationContext: ReturnType<typeof useNotifications> | null = null;
  let authContext: ReturnType<typeof useAuth> | null = null;
  
  try {
    marketContext = useMarket();
  } catch {
    console.log('DebtContext: Market context not available yet');
  }
  
  try {
    notificationContext = useNotifications();
  } catch {
    console.log('DebtContext: Notification context not available yet');
  }
  
  try {
    authContext = useAuth();
  } catch {
    console.log('DebtContext: Auth context not available yet');
  }
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  
  const marketDebtors = useMemo(() => marketContext?.marketDebtors || [], [marketContext?.marketDebtors]);
  const setMarketDebtors = useMemo(() => marketContext?.setMarketDebtors || (() => {}), [marketContext?.setMarketDebtors]);
  const syncData = useMemo(() => marketContext?.syncData || (() => {}), [marketContext?.syncData]);
  const refreshMarketData = useMemo(() => marketContext?.refreshMarketData || (async () => {}), [marketContext?.refreshMarketData]);
  const isLoading = marketContext?.isLoading || false;
  const isRefreshing = marketContext?.isRefreshing || false;
  const sendNotification = useMemo(() => notificationContext?.sendNotification || (() => {}), [notificationContext?.sendNotification]);
  const currentUser = authContext?.currentUser;
  const users = useMemo(() => authContext?.users || [], [authContext?.users]);
  
  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        return settings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    return null;
  }, []);

  const checkAndLockOldDebts = useCallback(async (debtorsToCheck: Debtor[]) => {
    if (currentUser?.role !== 'manager' && currentUser?.role !== 'owner') {
      return debtorsToCheck;
    }

    const settings = await loadSettings();
    if (!settings || !settings.autoLockOldDebts) {
      return debtorsToCheck;
    }

    const thresholdDays = settings.autoLockDaysThreshold || 365;
    const thresholdAmount = settings.autoLockAmountThreshold || 0;
    const now = new Date();

    let hasChanges = false;
    const updatedDebtors = debtorsToCheck.map(debtor => {
      if (debtor.isLocked || debtor.totalDebt <= 0) {
        return debtor;
      }

      const lastDebtTransaction = debtor.transactions
        .filter(t => t.type === 'debt')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (!lastDebtTransaction) {
        return debtor;
      }

      const lastDebtDate = new Date(lastDebtTransaction.date);
      const daysSinceLastDebt = Math.floor((now.getTime() - lastDebtDate.getTime()) / (24 * 60 * 60 * 1000));

      const meetsTimeThreshold = daysSinceLastDebt >= thresholdDays;
      const meetsAmountThreshold = thresholdAmount > 0 ? debtor.totalDebt >= thresholdAmount : true;

      if (meetsTimeThreshold && meetsAmountThreshold) {
        hasChanges = true;
        let reason = `قەرز بە خۆکار قوفڵکرا: ${daysSinceLastDebt} ڕۆژ بەسەرچووە`;
        if (thresholdAmount > 0) {
          reason += ` و بڕەکە ${debtor.totalDebt.toLocaleString('en-US')} (لە ${thresholdAmount.toLocaleString('en-US')} زیاترە)`;
        }
        return {
          ...debtor,
          isLocked: true,
          lockedAt: new Date().toISOString(),
          lockedReason: reason,
        };
      }

      return debtor;
    });

    if (hasChanges) {
      console.log('Auto-locked old debts');
    }

    return updatedDebtors;
  }, [currentUser, loadSettings]);

  useEffect(() => {
    if (!isLoading) {
      (async () => {
        try {
          const checkedDebtors = await checkAndLockOldDebts(marketDebtors);
          setDebtors(checkedDebtors);
          
          const hasLockedDebts = checkedDebtors.some((d, i) => 
            d.isLocked && !marketDebtors[i]?.isLocked
          );
          
          if (hasLockedDebts) {
            setMarketDebtors(checkedDebtors);
            syncData(checkedDebtors);
          }
        } catch (error) {
          console.error('Error checking and locking old debts:', error);
          setDebtors(marketDebtors);
        }
      })();
    }
  }, [marketDebtors, isLoading, checkAndLockOldDebts, setMarketDebtors, syncData]);

  const addDebtor = useCallback(async (name: string, phone?: string, imageUri?: string, dueDate?: string, currency?: Currency, category?: DebtorCategory, colorTag?: ColorTag, interestRate?: number, userId?: string, nameEn?: string) => {
    const newDebtor: Debtor = {
      id: Date.now().toString(),
      name,
      nameEn,
      phone,
      totalDebt: 0,
      transactions: [],
      createdAt: new Date().toISOString(),
      imageUri,
      dueDate,
      currency,
      category,
      colorTag,
      interestRate,
      paymentSchedule: [],
      userId,
    };
    const updated = [...debtors, newDebtor];
    setMarketDebtors(updated);
    syncData(updated);

    if (currentUser) {
      const notificationTitle = `قەرزدارێکی نوێ زیادکرا`;
      const notificationMessage = `${currentUser.fullName || currentUser.username} قەرزداری نوێی زیادکرد: ${name}`;
      
      try {
        if (currentUser.role === 'manager') {
          const employees = users.filter(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'employee' && 
            u.id !== currentUser.id
          );
          
          for (const employee of employees) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'employee',
              'manager',
              employee.id,
              currentUser.id,
              currentUser.marketId
            );
          }
        } else if (currentUser.role === 'employee') {
          const manager = users.find(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'manager'
          );
          if (manager) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'manager',
              'employee',
              manager.id,
              currentUser.id,
              currentUser.marketId
            );
          }
          
          const otherEmployees = users.filter(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'employee' && 
            u.id !== currentUser.id
          );
          
          for (const employee of otherEmployees) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'employee',
              'employee',
              employee.id,
              currentUser.id,
              currentUser.marketId
            );
          }
        }
      } catch (error) {
        console.error('Error sending debtor creation notifications:', error);
      }
    }

    return newDebtor.id;
  }, [debtors, syncData, setMarketDebtors, currentUser, users, sendNotification]);

  const addTransaction = useCallback(async (debtorId: string, amount: number, description: string, type: 'debt' | 'payment', currency?: Currency, imageUri?: string, receiptPhotoUri?: string, voiceNoteUri?: string, comment?: string, isPartialPayment?: boolean, partialPaymentOf?: string) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount,
      description,
      date: new Date().toISOString(),
      type,
      currency,
      imageUri,
      receiptPhotoUri,
      voiceNoteUri,
      comment,
      isPartialPayment,
      partialPaymentOf,
      history: [{
        id: Date.now().toString(),
        action: 'created',
        date: new Date().toISOString(),
      }],
      createdBy: currentUser ? {
        userId: currentUser.id,
        userName: currentUser.fullName || currentUser.username,
        userRole: currentUser.role,
      } : undefined,
    };

    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        const newTransactions = [...debtor.transactions, newTransaction];
        const totalDebt = type === 'debt' 
          ? debtor.totalDebt + amount 
          : debtor.totalDebt - amount;
        
        if (type === 'debt' && debtor.debtLimit && debtor.debtLimit > 0) {
          const percentage = (totalDebt / debtor.debtLimit) * 100;
          
          if (percentage >= 80 && percentage < 100) {
            try {
              sendNotification(
                'reminder',
                'ئاگاداری نزیکبوونەوە لە سنوور',
                `${debtor.name} نزیک بووەتەوە لە سنووری قەرز: ${percentage.toFixed(0)}% (${totalDebt.toLocaleString('en-US')} لە ${debtor.debtLimit.toLocaleString('en-US')})`,
                debtor.userId ? 'customer' : 'manager',
                'manager',
                debtor.userId,
                undefined,
                undefined
              );
            } catch (error) {
              console.error('Error sending debt limit notification:', error);
            }
          } else if (percentage >= 100) {
            try {
              sendNotification(
                'reminder',
                'ئاگاداری تێپەڕین لە سنوور',
                `${debtor.name} تێپەڕی لە سنووری قەرز: ${percentage.toFixed(0)}% (${totalDebt.toLocaleString('en-US')} لە ${debtor.debtLimit.toLocaleString('en-US')})`,
                debtor.userId ? 'customer' : 'manager',
                'manager',
                debtor.userId,
                undefined,
                undefined
              );
            } catch (error) {
              console.error('Error sending debt limit exceeded notification:', error);
            }
          }
        }
        
        const shouldUnlock = type === 'payment' && totalDebt <= 0 && debtor.isLocked;
        
        return {
          ...debtor,
          transactions: newTransactions,
          totalDebt,
          isLocked: shouldUnlock ? false : debtor.isLocked,
          lockedAt: shouldUnlock ? undefined : debtor.lockedAt,
          lockedReason: shouldUnlock ? undefined : debtor.lockedReason,
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);

    if (currentUser) {
      const debtor = debtors.find(d => d.id === debtorId);
      if (debtor) {
        const transactionType = type === 'debt' ? 'قەرز' : 'پارەدان';
        const notificationTitle = `مامەڵەیەکی نوێ تۆمارکرا`;
        const notificationMessage = `${currentUser.fullName || currentUser.username} ${transactionType}ێکی تۆمارکرد بۆ ${debtor.name}: ${amount.toLocaleString('en-US')} - ${description}`;
        
        try {
          if (currentUser.role === 'manager') {
            const employees = users.filter(u => 
              u.marketId === currentUser.marketId && 
              u.role === 'employee' && 
              u.id !== currentUser.id
            );
            
            for (const employee of employees) {
              await sendNotification(
                'general',
                notificationTitle,
                notificationMessage,
                'employee',
                'manager',
                employee.id,
                currentUser.id,
                currentUser.marketId
              );
            }
          } else if (currentUser.role === 'employee') {
            const manager = users.find(u => 
              u.marketId === currentUser.marketId && 
              u.role === 'manager'
            );
            if (manager) {
              await sendNotification(
                'general',
                notificationTitle,
                notificationMessage,
                'manager',
                'employee',
                manager.id,
                currentUser.id,
                currentUser.marketId
              );
            }
            
            const otherEmployees = users.filter(u => 
              u.marketId === currentUser.marketId && 
              u.role === 'employee' && 
              u.id !== currentUser.id
            );
            
            for (const employee of otherEmployees) {
              await sendNotification(
                'general',
                notificationTitle,
                notificationMessage,
                'employee',
                'employee',
                employee.id,
                currentUser.id,
                currentUser.marketId
              );
            }
          }
        } catch (error) {
          console.error('Error sending transaction notifications:', error);
        }
      }
    }

    if (type === 'debt' && Platform.OS !== 'web') {
      try {
        const debtor = debtors.find(d => d.id === debtorId);
        if (debtor) {
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + 7);
          
          const REMINDERS_KEY = 'debt_reminders';
          const stored = await AsyncStorage.getItem(REMINDERS_KEY);
          const existingReminders = await safeJSONParse(stored, []);

          try {
            // Lazy import to avoid issues in Expo Go
            const Notifications = await import('expo-notifications');
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: 'یادەوەری قەرز',
                body: `${debtor.name}: ${description} - ${amount.toLocaleString('en-US')}`,
                data: { debtorId, amount },
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminderDate,
              },
            });

            const newReminder = {
              id: Date.now().toString(),
              debtorId,
              debtorName: debtor.name,
              amount,
              dueDate: reminderDate.toISOString(),
              message: description,
              notificationId,
              isActive: true,
              createdAt: new Date().toISOString(),
            };

            await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify([...existingReminders, newReminder]));
          } catch (notificationError) {
            // Silently fail if notifications are not available (e.g., in Expo Go)
            console.log('Notifications not available, skipping reminder scheduling');
            
            // Still save the reminder locally without notificationId
            const newReminder = {
              id: Date.now().toString(),
              debtorId,
              debtorName: debtor.name,
              amount,
              dueDate: reminderDate.toISOString(),
              message: description,
              notificationId: undefined,
              isActive: true,
              createdAt: new Date().toISOString(),
            };

            await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify([...existingReminders, newReminder]));
          }
        }
      } catch (error) {
        console.error('Error creating automatic reminder:', error);
      }
    }
  }, [debtors, syncData, setMarketDebtors, sendNotification, currentUser, users]);

  const getDebtor = useCallback((id: string) => {
    return debtors.find(d => d.id === id);
  }, [debtors]);

  const sortedDebtors = useMemo(() => {
    return [...debtors].sort((a, b) => b.totalDebt - a.totalDebt);
  }, [debtors]);

  const updateNotes = useCallback((debtorId: string, notes: string) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          notes,
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const updateDebtLimit = useCallback((debtorId: string, debtLimit: number | undefined) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          debtLimit,
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const refresh = useCallback(async () => {
    await refreshMarketData();
  }, [refreshMarketData]);

  const deleteDebtor = useCallback(async (debtorId: string) => {
    const debtor = debtors.find(d => d.id === debtorId);
    const updated = debtors.filter(debtor => debtor.id !== debtorId);
    setMarketDebtors(updated);
    syncData(updated);

    if (currentUser && debtor) {
      const notificationTitle = `قەرزدارێک سڕایەوە`;
      const notificationMessage = `${currentUser.fullName || currentUser.username} قەرزداری سڕییەوە: ${debtor.name} - کۆی قەرز: ${debtor.totalDebt.toLocaleString('en-US')}`;
      
      try {
        if (currentUser.role === 'manager') {
          const employees = users.filter(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'employee' && 
            u.id !== currentUser.id
          );
          
          for (const employee of employees) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'employee',
              'manager',
              employee.id,
              currentUser.id,
              currentUser.marketId
            );
          }
        } else if (currentUser.role === 'employee') {
          const manager = users.find(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'manager'
          );
          if (manager) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'manager',
              'employee',
              manager.id,
              currentUser.id,
              currentUser.marketId
            );
          }
          
          const otherEmployees = users.filter(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'employee' && 
            u.id !== currentUser.id
          );
          
          for (const employee of otherEmployees) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'employee',
              'employee',
              employee.id,
              currentUser.id,
              currentUser.marketId
            );
          }
        }
      } catch (error) {
        console.error('Error sending debtor deletion notifications:', error);
      }
    }
  }, [debtors, syncData, setMarketDebtors, currentUser, users, sendNotification]);

  const updateDebtor = useCallback((debtorId: string, updates: Partial<Debtor>) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          ...updates,
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const exportData = useCallback(async () => {
    try {
      const data = JSON.stringify(debtors, null, 2);
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }, [debtors]);

  const importData = useCallback(async (jsonData: string) => {
    try {
      const parsed = await safeJSONParse<any>(jsonData, null);
      
      if (!parsed) {
        throw new Error('Invalid data format');
      }
      
      let dataToImport: Debtor[];
      
      if (Array.isArray(parsed)) {
        dataToImport = parsed;
      } else if (parsed && typeof parsed === 'object' && 'data' in parsed && Array.isArray(parsed.data)) {
        dataToImport = parsed.data;
      } else {
        throw new Error('Invalid data format');
      }
      
      if (dataToImport.length === 0) {
        console.warn('Imported data is empty');
      }
      
      setDebtors(dataToImport);
      syncData(dataToImport);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, [syncData]);

  const getAllTransactions = useCallback(() => {
    const allTransactions: (Transaction & { debtorId: string; debtorName: string })[] = [];
    debtors.forEach(debtor => {
      debtor.transactions.forEach(transaction => {
        allTransactions.push({
          ...transaction,
          debtorId: debtor.id,
          debtorName: debtor.name,
        });
      });
    });
    return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [debtors]);

  const addPaymentScheduleItem = useCallback((debtorId: string, amount: number, dueDate: string) => {
    const newScheduleItem: PaymentScheduleItem = {
      id: Date.now().toString(),
      amount,
      dueDate,
      isPaid: false,
    };

    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          paymentSchedule: [...(debtor.paymentSchedule || []), newScheduleItem],
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const updatePaymentScheduleItem = useCallback((debtorId: string, scheduleItemId: string, isPaid: boolean) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          paymentSchedule: debtor.paymentSchedule?.map(item => 
            item.id === scheduleItemId 
              ? { ...item, isPaid, paidDate: isPaid ? new Date().toISOString() : undefined }
              : item
          ),
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const deletePaymentScheduleItem = useCallback((debtorId: string, scheduleItemId: string) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          paymentSchedule: debtor.paymentSchedule?.filter(item => item.id !== scheduleItemId),
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const updateTransaction = useCallback(async (debtorId: string, transactionId: string, updates: Partial<Transaction>) => {
    console.log('updateTransaction called:', { debtorId, transactionId, updates });
    
    const updatedDebtors = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        const oldTransaction = debtor.transactions.find(t => t.id === transactionId);
        if (!oldTransaction) {
          console.error('Transaction not found:', transactionId);
          return debtor;
        }

        console.log('Old transaction found:', oldTransaction);

        const historyItem: TransactionHistoryItem = {
          id: Date.now().toString(),
          action: 'edited',
          date: new Date().toISOString(),
          previousData: {
            amount: oldTransaction.amount,
            description: oldTransaction.description,
          },
          changes: `Amount: ${updates.amount || oldTransaction.amount}, Description: ${updates.description || oldTransaction.description}`,
        };

        const newTransactions = debtor.transactions.map(transaction => {
          if (transaction.id === transactionId) {
            const updatedTransaction = {
              ...transaction,
              ...updates,
              history: [...(transaction.history || []), historyItem],
            };
            console.log('Updated transaction:', updatedTransaction);
            return updatedTransaction;
          }
          return transaction;
        });

        let totalDebt = debtor.totalDebt;
        if (updates.amount !== undefined && updates.amount !== oldTransaction.amount) {
          const amountDiff = updates.amount - oldTransaction.amount;
          totalDebt = oldTransaction.type === 'debt' 
            ? debtor.totalDebt + amountDiff 
            : debtor.totalDebt - amountDiff;
          console.log('Total debt updated:', { old: debtor.totalDebt, new: totalDebt, diff: amountDiff });
        }
        
        const updatedDebtor = {
          ...debtor,
          transactions: newTransactions,
          totalDebt,
        };
        
        console.log('Updated debtor:', updatedDebtor.id, 'total debt:', updatedDebtor.totalDebt);
        return updatedDebtor;
      }
      return debtor;
    });

    console.log('Setting updated debtors and syncing...');
    setMarketDebtors(updatedDebtors);
    syncData(updatedDebtors);

    if (currentUser) {
      const debtor = debtors.find(d => d.id === debtorId);
      if (debtor) {
        const transaction = debtor.transactions.find(t => t.id === transactionId);
        const transactionType = transaction?.type === 'debt' ? 'قەرز' : 'پارەدان';
        const notificationTitle = `مامەڵەیەک دەستکاری کرا`;
        const notificationMessage = `${currentUser.fullName || currentUser.username} ${transactionType}ێکی دەستکاری کرد بۆ ${debtor.name}: ${updates.amount || transaction?.amount || 0} - ${updates.description || transaction?.description || ''}`;
        
        try {
          if (currentUser.role === 'manager') {
            const employees = users.filter(u => 
              u.marketId === currentUser.marketId && 
              u.role === 'employee' && 
              u.id !== currentUser.id
            );
            
            for (const employee of employees) {
              await sendNotification(
                'general',
                notificationTitle,
                notificationMessage,
                'employee',
                'manager',
                employee.id,
                currentUser.id,
                currentUser.marketId
              );
            }
          } else if (currentUser.role === 'employee') {
            const manager = users.find(u => 
              u.marketId === currentUser.marketId && 
              u.role === 'manager'
            );
            if (manager) {
              await sendNotification(
                'general',
                notificationTitle,
                notificationMessage,
                'manager',
                'employee',
                manager.id,
                currentUser.id,
                currentUser.marketId
              );
            }
            
            const otherEmployees = users.filter(u => 
              u.marketId === currentUser.marketId && 
              u.role === 'employee' && 
              u.id !== currentUser.id
            );
            
            for (const employee of otherEmployees) {
              await sendNotification(
                'general',
                notificationTitle,
                notificationMessage,
                'employee',
                'employee',
                employee.id,
                currentUser.id,
                currentUser.marketId
              );
            }
          }
        } catch (error) {
          console.error('Error sending transaction update notifications:', error);
        }
      }
    }
  }, [debtors, syncData, setMarketDebtors, currentUser, users, sendNotification]);

  const deleteTransaction = useCallback(async (debtorId: string, transactionId: string) => {
    const debtor = debtors.find(d => d.id === debtorId);
    const transaction = debtor?.transactions.find(t => t.id === transactionId);

    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        const transaction = debtor.transactions.find(t => t.id === transactionId);
        if (!transaction) return debtor;

        const newTransactions = debtor.transactions.filter(t => t.id !== transactionId);
        const totalDebt = transaction.type === 'debt' 
          ? debtor.totalDebt - transaction.amount 
          : debtor.totalDebt + transaction.amount;
        
        return {
          ...debtor,
          transactions: newTransactions,
          totalDebt,
        };
      }
      return debtor;
    });

    setMarketDebtors(updated);
    syncData(updated);

    if (currentUser && debtor && transaction) {
      const transactionType = transaction.type === 'debt' ? 'قەرز' : 'پارەدان';
      const notificationTitle = `مامەڵەیەک سڕایەوە`;
      const notificationMessage = `${currentUser.fullName || currentUser.username} ${transactionType}ێکی سڕییەوە بۆ ${debtor.name}: ${transaction.amount.toLocaleString('en-US')} - ${transaction.description}`;
      
      try {
        if (currentUser.role === 'manager') {
          const employees = users.filter(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'employee' && 
            u.id !== currentUser.id
          );
          
          for (const employee of employees) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'employee',
              'manager',
              employee.id,
              currentUser.id,
              currentUser.marketId
            );
          }
        } else if (currentUser.role === 'employee') {
          const manager = users.find(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'manager'
          );
          if (manager) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'manager',
              'employee',
              manager.id,
              currentUser.id,
              currentUser.marketId
            );
          }
          
          const otherEmployees = users.filter(u => 
            u.marketId === currentUser.marketId && 
            u.role === 'employee' && 
            u.id !== currentUser.id
          );
          
          for (const employee of otherEmployees) {
            await sendNotification(
              'general',
              notificationTitle,
              notificationMessage,
              'employee',
              'employee',
              employee.id,
              currentUser.id,
              currentUser.marketId
            );
          }
        }
      } catch (error) {
        console.error('Error sending transaction deletion notifications:', error);
      }
    }
  }, [debtors, syncData, setMarketDebtors, currentUser, users, sendNotification]);

  const updateTransactionComment = useCallback((debtorId: string, transactionId: string, comment: string) => {
    updateTransaction(debtorId, transactionId, { comment });
  }, [updateTransaction]);

  const getPartialPayments = useCallback((debtorId: string, transactionId: string) => {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) return [];
    return debtor.transactions.filter(t => t.partialPaymentOf === transactionId);
  }, [debtors]);

  const duplicateTransaction = useCallback(async (debtorId: string, transactionId: string, newAmount?: number, newDescription?: string, newDate?: string) => {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) return;
    
    const originalTransaction = debtor.transactions.find(t => t.id === transactionId);
    if (!originalTransaction) return;
    
    const newTransaction: Transaction = {
      ...originalTransaction,
      id: Date.now().toString(),
      amount: newAmount || originalTransaction.amount,
      description: newDescription || originalTransaction.description,
      date: newDate || new Date().toISOString(),
      history: [{
        id: Date.now().toString(),
        action: 'created',
        date: new Date().toISOString(),
      }],
    };
    
    const updated = debtors.map(d => {
      if (d.id === debtorId) {
        const newTransactions = [...d.transactions, newTransaction];
        const totalDebt = newTransaction.type === 'debt' 
          ? d.totalDebt + newTransaction.amount 
          : d.totalDebt - newTransaction.amount;
        
        return {
          ...d,
          transactions: newTransactions,
          totalDebt,
        };
      }
      return d;
    });
    
    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const toggleTransactionLock = useCallback((debtorId: string, transactionId: string) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          transactions: debtor.transactions.map(transaction => {
            if (transaction.id === transactionId) {
              return {
                ...transaction,
                isLocked: !transaction.isLocked,
              };
            }
            return transaction;
          }),
        };
      }
      return debtor;
    });
    
    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const updateTransactionTags = useCallback((debtorId: string, transactionId: string, tags: string[]) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        return {
          ...debtor,
          transactions: debtor.transactions.map(transaction => {
            if (transaction.id === transactionId) {
              return {
                ...transaction,
                tags,
              };
            }
            return transaction;
          }),
        };
      }
      return debtor;
    });
    
    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  const getTodayActivity = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    
    const activities: string[] = [];
    
    debtors.forEach(debtor => {
      debtor.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        transactionDate.setHours(0, 0, 0, 0);
        const transactionStr = transactionDate.toISOString();
        
        if (transactionStr === todayStr) {
          if (transaction.type === 'debt') {
            activities.push(`${debtor.name}: قەرزی ${transaction.amount.toLocaleString('en-US')} وەرگیرا`);
          } else {
            activities.push(`${debtor.name}: بڕی ${transaction.amount.toLocaleString('en-US')} دایەوە`);
          }
        }
      });
    });
    
    return activities;
  }, [debtors]);

  const toggleDebtorLock = useCallback((debtorId: string, reason?: string) => {
    const updated = debtors.map(debtor => {
      if (debtor.id === debtorId) {
        const isLocking = !debtor.isLocked;
        return {
          ...debtor,
          isLocked: isLocking,
          lockedAt: isLocking ? new Date().toISOString() : undefined,
          lockedReason: isLocking ? (reason || 'بەڕێوەبەر قوفڵی کرد') : undefined,
        };
      }
      return debtor;
    });
    
    setMarketDebtors(updated);
    syncData(updated);
  }, [debtors, syncData, setMarketDebtors]);

  useHourlyBackup(debtors);

  return useMemo(() => ({
    debtors: sortedDebtors,
    addDebtor,
    addTransaction,
    getDebtor,
    updateNotes,
    updateDebtLimit,
    deleteDebtor,
    updateDebtor,
    exportData,
    importData,
    getAllTransactions,
    addPaymentScheduleItem,
    updatePaymentScheduleItem,
    deletePaymentScheduleItem,
    updateTransaction,
    deleteTransaction,
    updateTransactionComment,
    getPartialPayments,
    duplicateTransaction,
    toggleTransactionLock,
    updateTransactionTags,
    getTodayActivity,
    toggleDebtorLock,
    isLoading,
    refresh,
    isRefreshing,
  }), [sortedDebtors, addDebtor, addTransaction, getDebtor, updateNotes, updateDebtLimit, deleteDebtor, updateDebtor, exportData, importData, getAllTransactions, addPaymentScheduleItem, updatePaymentScheduleItem, deletePaymentScheduleItem, updateTransaction, deleteTransaction, updateTransactionComment, getPartialPayments, duplicateTransaction, toggleTransactionLock, updateTransactionTags, getTodayActivity, toggleDebtorLock, isLoading, refresh, isRefreshing]);
});
