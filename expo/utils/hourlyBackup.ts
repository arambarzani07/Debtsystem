import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendAutomaticBackupToManager } from './telegram';
import { safeJSONParse } from './storageRecovery';
import type { Debtor } from '@/types';

const HOURLY_BACKUP_KEY = 'hourly_backup_settings';
const LAST_BACKUP_KEY = 'last_hourly_backup';

export interface HourlyBackupSettings {
  enabled: boolean;
  intervalMinutes: number;
  marketName?: string;
}

const DEFAULT_SETTINGS: HourlyBackupSettings = {
  enabled: false,
  intervalMinutes: 60,
};

export async function getHourlyBackupSettings(): Promise<HourlyBackupSettings> {
  try {
    const stored = await AsyncStorage.getItem(HOURLY_BACKUP_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    return await safeJSONParse<HourlyBackupSettings>(stored, DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Error loading hourly backup settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveHourlyBackupSettings(settings: HourlyBackupSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(HOURLY_BACKUP_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving hourly backup settings:', error);
    throw error;
  }
}

export async function getLastBackupTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_BACKUP_KEY);
  } catch (error) {
    console.error('Error getting last backup time:', error);
    return null;
  }
}

async function setLastBackupTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error setting last backup time:', error);
  }
}

export async function performHourlyBackup(debtors: Debtor[]): Promise<void> {
  try {
    const settings = await getHourlyBackupSettings();
    
    if (!settings.enabled) {
      console.log('⏸️ باکئەپی کاتژمێری ناچالاکە');
      return;
    }

    const lastBackup = await getLastBackupTime();
    const now = new Date();
    
    if (lastBackup) {
      const lastBackupDate = new Date(lastBackup);
      const minutesSinceLastBackup = Math.floor((now.getTime() - lastBackupDate.getTime()) / (60 * 1000));
      
      if (minutesSinceLastBackup < settings.intervalMinutes) {
        console.log(`⏳ باکئەپی داهاتوو لە ${settings.intervalMinutes - minutesSinceLastBackup} خولەک`);
        return;
      }
    }

    console.log('🔄 دەستپێکردنی باکئەپی کاتژمێری...');
    
    const result = await sendAutomaticBackupToManager(debtors, settings.marketName);
    
    if (result.success) {
      await setLastBackupTime();
      console.log('✅ باکئەپی کاتژمێری بە سەرکەوتوویی تەواو بوو');
    } else {
      console.error('❌ باکئەپی کاتژمێری شکستی هێنا:', result.message);
    }
  } catch (error) {
    console.error('❌ هەڵە لە باکئەپی کاتژمێری:', error);
  }
}

export function useHourlyBackup(debtors: Debtor[]) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCheckRef = useRef<Date>(new Date());

  useEffect(() => {
    const checkAndPerformBackup = async () => {
      const settings = await getHourlyBackupSettings();
      
      if (!settings.enabled) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      await performHourlyBackup(debtors);
    };

    checkAndPerformBackup();

    const checkInterval = setInterval(async () => {
      const settings = await getHourlyBackupSettings();
      
      if (!settings.enabled) {
        return;
      }

      const now = new Date();
      const minutesSinceLastCheck = Math.floor((now.getTime() - lastCheckRef.current.getTime()) / (60 * 1000));

      if (minutesSinceLastCheck >= 5) {
        lastCheckRef.current = now;
        await checkAndPerformBackup();
      }
    }, 5 * 60 * 1000);

    intervalRef.current = checkInterval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [debtors]);

  return {
    performBackupNow: () => performHourlyBackup(debtors),
  };
}
