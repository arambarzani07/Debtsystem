import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { Debtor } from '@/types';

const BACKUP_KEY = 'last_backup_date';

export const createBackup = async (debtors: Debtor[]) => {
  const backup = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: debtors,
  };
  
  return JSON.stringify(backup);
};

export const restoreBackup = async (backupString: string): Promise<Debtor[] | null> => {
  try {
    const backup = JSON.parse(backupString);
    
    if (!backup.data || !Array.isArray(backup.data)) {
      throw new Error('Invalid backup format');
    }
    
    return backup.data;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return null;
  }
};

export const generateQRCodeData = async (debtors: Debtor[]): Promise<string> => {
  const backup = await createBackup(debtors);
  return backup;
};

export const parseQRCodeData = async (data: string): Promise<Debtor[] | null> => {
  return restoreBackup(data);
};

export const checkAutoBackup = async (interval: 'daily' | 'weekly' | 'monthly'): Promise<boolean> => {
  try {
    const lastBackup = await AsyncStorage.getItem(BACKUP_KEY);
    
    if (!lastBackup) return true;
    
    const lastBackupDate = new Date(lastBackup);
    const now = new Date();
    const diffMs = now.getTime() - lastBackupDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    switch (interval) {
      case 'daily':
        return diffDays >= 1;
      case 'weekly':
        return diffDays >= 7;
      case 'monthly':
        return diffDays >= 30;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking auto backup:', error);
    return false;
  }
};

export const saveBackupTimestamp = async () => {
  try {
    await AsyncStorage.setItem(BACKUP_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error saving backup timestamp:', error);
  }
};

export const exportToFile = async (debtors: Debtor[], filename: string) => {
  try {
    const backup = await createBackup(debtors);
    
    if (Platform.OS === 'web') {
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } else {
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, backup);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath);
      }
      
      await saveBackupTimestamp();
      return true;
    }
  } catch (error) {
    console.error('Error exporting to file:', error);
    return false;
  }
};

export const calculateExchangeRates = async () => {
  return {
    IQD: 1,
    USD: 0.00076,
    EUR: 0.00071,
  };
};

export const convertCurrency = (amount: number, from: string, to: string, rates: any) => {
  if (from === to) return amount;
  
  const usdAmount = from === 'USD' ? amount : amount * rates[from];
  return to === 'USD' ? usdAmount : usdAmount / rates[to];
};
