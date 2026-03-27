import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ThemeMode, AppSettings } from '@/types';
import { safeJSONParse } from '@/utils/storageRecovery';

const SETTINGS_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  theme: 'dark',
  currency: 'IQD',
  hideAmounts: false,
  pinEnabled: false,
  biometricEnabled: false,
  notificationsEnabled: true,
  autoBackupEnabled: false,
  autoBackupInterval: 'weekly',
  exchangeRates: { IQD: 1, USD: 1500, EUR: 1700 },
  requirePinForDeletion: false,
  autoLockOldDebts: false,
  autoLockDaysThreshold: 365,
  autoLockAmountThreshold: 0,
};

export const [ThemeContext, useTheme] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        const parsed = await safeJSONParse<AppSettings>(stored, defaultSettings);
        
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          console.error('Invalid settings data, using defaults');
          await AsyncStorage.removeItem(SETTINGS_KEY);
          return defaultSettings;
        }
        return { ...defaultSettings, ...parsed } as AppSettings;
      } catch (error) {
        console.error('Error loading settings:', error);
        await AsyncStorage.removeItem(SETTINGS_KEY);
        return defaultSettings;
      }
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  });

  const { mutate: syncSettings } = useMutation({
    mutationFn: async (data: AppSettings) => {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
      return data;
    }
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const updateTheme = useCallback((theme: ThemeMode) => {
    const updated = { ...settings, theme };
    setSettings(updated);
    syncSettings(updated);
  }, [settings, syncSettings]);

  const toggleTheme = useCallback(() => {
    const newTheme: ThemeMode = settings.theme === 'dark' ? 'light' : 'dark';
    updateTheme(newTheme);
  }, [settings.theme, updateTheme]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    syncSettings(updated);
  }, [settings, syncSettings]);

  const colors = useMemo(() => {
    const isDark = settings.theme === 'dark';
    return {
      background: isDark ? '#0B0D1A' : '#F5F7FA',
      backgroundGradient: isDark 
        ? ['#0B0D1A', '#141824', '#1E2330', '#0B0D1A']
        : ['#EEF2F7', '#F5F7FA', '#FAFBFD', '#F0F3F8'],
      card: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
      cardGlass: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(255, 255, 255, 0.9)',
      cardBorder: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.7)',
      glassBorder: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.85)',
      text: isDark ? '#F8FAFC' : '#0F1419',
      textSecondary: isDark ? 'rgba(248, 250, 252, 0.75)' : 'rgba(15, 20, 25, 0.75)',
      textTertiary: isDark ? 'rgba(248, 250, 252, 0.55)' : 'rgba(15, 20, 25, 0.55)',
      primary: '#60A5FA',
      primaryGlass: isDark ? 'rgba(96, 165, 250, 0.18)' : 'rgba(96, 165, 250, 0.12)',
      primaryDark: '#3B82F6',
      success: '#10B981',
      successGlass: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)',
      successDark: '#059669',
      error: '#EF4444',
      errorGlass: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.12)',
      errorDark: '#DC2626',
      warning: '#F59E0B',
      warningGlass: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)',
      inputBackground: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.8)',
      modalOverlay: 'rgba(0, 0, 0, 0.65)',
      shadowColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.12)',
      accent1: '#FF6B35',
      accent2: '#37ECBA',
      accent3: '#F7931E',
      accent4: '#A78BFA',
      isDark,
    };
  }, [settings.theme]);

  return useMemo(() => ({
    settings,
    updateTheme,
    toggleTheme,
    updateSettings,
    colors,
    isLoading: settingsQuery.isLoading,
  }), [settings, updateTheme, toggleTheme, updateSettings, colors, settingsQuery.isLoading]);
});
