import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Debtor } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { safeJSONParse } from '@/utils/storageRecovery';
import { trpc } from '@/lib/trpc';
import { sendAutomaticBackupToManager } from '@/utils/telegram';

export const [MarketContext, useMarket] = createContextHook(() => {
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    authContext = useAuth();
  } catch {
    console.log('MarketContext: Auth context not available yet');
  }
  const currentUser = authContext?.currentUser ?? null;
  const isAuthLoading = authContext?.isLoading ?? true;
  const [marketDebtors, setMarketDebtors] = useState<Debtor[]>([]);

  const getStorageKey = useCallback(() => {
    if (!currentUser) return null;
    return `market_${currentUser.marketId}_debtors`;
  }, [currentUser]);

  const backupRestoreQuery = trpc.backup.restore.useQuery(
    { 
      marketId: currentUser?.marketId || '',
      userId: currentUser?.id,
    },
    { 
      enabled: !isAuthLoading && !!currentUser?.marketId && !!process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
    }
  );

  const debtorsQuery = useQuery({
    queryKey: ['marketDebtors', currentUser?.marketId, currentUser?.id, currentUser?.role, currentUser],
    queryFn: async () => {
      const storageKey = getStorageKey();
      console.log('MarketContext: Loading debtors');
      console.log('Storage Key:', storageKey);
      console.log('Current User:', currentUser ? { id: currentUser.id, role: currentUser.role, marketId: currentUser.marketId } : null);
      
      if (!storageKey) {
        console.log('No storage key available');
        return [];
      }

      try {
        if (backupRestoreQuery.isSuccess && backupRestoreQuery.data?.success && backupRestoreQuery.data.data && Array.isArray(backupRestoreQuery.data.data)) {
          console.log('Restored from backend backup:', backupRestoreQuery.data.data.length, 'debtors');
          const backupData = backupRestoreQuery.data.data;
          await AsyncStorage.setItem(storageKey, JSON.stringify(backupData));
          return backupData;
        }

        if (backupRestoreQuery.isError) {
          const error = backupRestoreQuery.error as any;
          if (error?.data?.httpStatus === 429) {
            console.log('Backend rate limit reached, using local storage');
          } else {
            console.log('Backend backup not available:', backupRestoreQuery.error?.message || 'Unknown error');
          }
        }

        console.log('Loading debtors from AsyncStorage...');
        const stored = await AsyncStorage.getItem(storageKey);
        console.log('Raw stored data:', stored ? stored.substring(0, 100) + '...' : 'null');
        
        const parsed = await safeJSONParse<Debtor[]>(stored, []);

        if (!Array.isArray(parsed)) {
          console.log('Invalid debtors data format');
          try {
            await AsyncStorage.removeItem(storageKey);
          } catch (removeError) {
            console.error('Error removing corrupted debtors data:', removeError);
          }
          return [];
        }

        console.log('Loaded debtors from storage:', parsed.length, 'debtors');
        return parsed;
      } catch (error) {
        console.error('Error loading market debtors:', error);
        return [];
      }
    },
    enabled: !isAuthLoading && !!currentUser && !!getStorageKey() && (backupRestoreQuery.isSuccess || backupRestoreQuery.isError || !process.env.EXPO_PUBLIC_RORK_API_BASE_URL),
    staleTime: 5000,
    gcTime: 10000,
    retry: 1,
  });

  const backupSaveMutation = trpc.backup.save.useMutation({
    retry: false,
  });
  
  const lastSyncTimeRef = useRef<number>(0);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hourlyBackupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastBackendSyncTime, setLastBackendSyncTime] = useState<string | null>(null);
  const [lastTelegramBackupTime, setLastTelegramBackupTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [pendingChanges, setPendingChanges] = useState(0);

  const syncDataMutation = useMutation({
    mutationFn: async (data: Debtor[]) => {
      if (!currentUser) {
        console.error('No current user available');
        throw new Error('No current user');
      }
      const storageKey = getStorageKey();
      if (!storageKey) throw new Error('No storage key available');

      try {
        setSyncStatus('syncing');
        setPendingChanges(prev => prev + 1);
        
        if (!Array.isArray(data)) {
          console.error('syncData: data is not an array, received:', typeof data);
          throw new Error('Invalid data type: expected array');
        }

        console.log('Syncing debtors to storage:', data.length, 'debtors');
        try {
          const jsonString = JSON.stringify(data);
          console.log('JSON string length:', jsonString.length, 'bytes');
          await AsyncStorage.setItem(storageKey, jsonString);
        } catch (stringifyError) {
          console.error('Error stringifying or saving data:', stringifyError);
          throw new Error('Failed to save data to storage');
        }
        console.log('Debtors saved to storage successfully');

        const marketsKey = 'markets_data';
        const marketsStored = await AsyncStorage.getItem(marketsKey);
        const parsedMarkets = await safeJSONParse<any[]>(marketsStored, []);
        
        if (Array.isArray(parsedMarkets) && parsedMarkets.length > 0) {
          try {
            const updatedMarkets = parsedMarkets.map((m: any) =>
              m.id === currentUser?.marketId
                ? { ...m, debtorsData: data }
                : m
            );
            const marketsJsonString = JSON.stringify(updatedMarkets);
            await AsyncStorage.setItem(marketsKey, marketsJsonString);
            console.log('Markets data updated successfully');
          } catch (error) {
            console.error('Error updating markets data:', error);
          }
        }

        if (currentUser?.marketId && process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
          try {
            const now = Date.now();
            if (now - lastSyncTimeRef.current < 5000) {
              console.log('Skipping backend sync - too soon since last sync (5s throttle)');
              setPendingChanges(prev => Math.max(0, prev - 1));
              setSyncStatus('success');
              return data;
            }
            
            lastSyncTimeRef.current = now;
            
            const sanitizedData = data.map(debtor => ({
              ...debtor,
              totalDebt: Number.isFinite(debtor.totalDebt) ? debtor.totalDebt : 0,
              debtLimit: debtor.debtLimit !== undefined && Number.isFinite(debtor.debtLimit) ? debtor.debtLimit : undefined,
              interestRate: debtor.interestRate !== undefined && Number.isFinite(debtor.interestRate) ? debtor.interestRate : undefined,
            }));
            
            const backupResult = await backupSaveMutation.mutateAsync({
              marketId: currentUser.marketId,
              userId: currentUser.id,
              debtors: sanitizedData,
              timestamp: new Date().toISOString(),
            });
            
            if (backupResult?.success) {
              console.log('✅ Cloud sync successful:', backupResult.timestamp);
              setLastBackendSyncTime(backupResult.timestamp || new Date().toISOString());
              setSyncStatus('success');
              setPendingChanges(0);
            } else {
              console.warn('⚠️ Cloud sync failed:', backupResult?.message || 'Unknown error');
              setSyncStatus('error');
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const httpStatus = (error as any)?.data?.httpStatus;
            
            if (httpStatus === 429) {
              console.log('⏳ Rate limit reached - backup will be retried later');
              setSyncStatus('error');
            } else if (errorMsg.includes('Backend endpoint not available') || errorMsg.includes('Backend not configured')) {
              console.log('📡 Backend not available - using local storage only');
              setSyncStatus('idle');
            } else {
              console.warn('❌ Error saving backup to backend:', errorMsg);
              setSyncStatus('error');
            }
          }
        } else if (!process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
          console.log('💾 Backend URL not configured - using local storage only');
          setSyncStatus('idle');
          setPendingChanges(0);
        }

        return data;
      } catch (error) {
        console.error('Error saving market debtors:', error);
        setSyncStatus('error');
        throw error;
      }
    },
  });

  const { mutate: mutateSyncData } = syncDataMutation;
  const syncData = useCallback((data: Debtor[]) => {
    mutateSyncData(data);
  }, [mutateSyncData]);

  useEffect(() => {
    if (debtorsQuery.data) {
      setMarketDebtors(debtorsQuery.data);
    }
  }, [debtorsQuery.data]);

  const { refetch } = debtorsQuery;

  const refreshMarketData = useCallback(async () => {
    console.log('Refreshing market data...');
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 10000) {
      console.log('Skipping refresh - too soon since last sync');
      await refetch();
      return;
    }
    
    if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
      try {
        await backupRestoreQuery.refetch();
      } catch (error) {
        const httpStatus = (error as any)?.data?.httpStatus;
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        if (httpStatus === 429) {
          console.log('Rate limit reached during refresh, using local data');
        } else if (errorMsg.includes('Backend endpoint not available') || errorMsg.includes('Backend not configured')) {
          console.log('Backend not available - using local storage only');
        } else {
          console.warn('Error refreshing from backend:', error);
        }
      }
    }
    
    await refetch();
  }, [refetch, backupRestoreQuery]);
  
  useEffect(() => {
    if (!currentUser?.marketId) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (hourlyBackupIntervalRef.current) {
        clearInterval(hourlyBackupIntervalRef.current);
        hourlyBackupIntervalRef.current = null;
      }
      return;
    }

    const syncInterval = 15 * 60 * 1000;
    console.log('Setting up auto-sync interval:', syncInterval / 1000, 'seconds');
    
    syncIntervalRef.current = setInterval(() => {
      console.log('Auto-sync triggered');
      refreshMarketData();
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (hourlyBackupIntervalRef.current) {
        clearInterval(hourlyBackupIntervalRef.current);
        hourlyBackupIntervalRef.current = null;
      }
    };
  }, [currentUser?.marketId, refreshMarketData]);

  useEffect(() => {
    if (!currentUser?.marketId || (currentUser.role !== 'owner' && currentUser.role !== 'manager')) {
      return;
    }

    const sendHourlyBackup = async () => {
      try {
        console.log('🔄 Starting hourly Telegram backup...');
        const storageKey = getStorageKey();
        if (!storageKey) return;

        const stored = await AsyncStorage.getItem(storageKey);
        const debtorsData = await safeJSONParse<Debtor[]>(stored, []);
        
        if (debtorsData.length === 0) {
          console.log('⚠️ No debtors data to backup');
          return;
        }

        let marketName = 'فرۆشگا';
        try {
          const marketsStored = await AsyncStorage.getItem('markets_data');
          const markets = await safeJSONParse<any[]>(marketsStored, []);
          const market = markets.find((m: any) => m.id === currentUser.marketId);
          if (market?.name) {
            marketName = market.name;
          }
        } catch (error) {
          console.log('Could not load market name:', error);
        }

        const result = await sendAutomaticBackupToManager(
          debtorsData,
          marketName
        );
        
        if (result.success) {
          setLastTelegramBackupTime(new Date().toISOString());
          console.log('✅ Hourly backup sent successfully');
        } else {
          console.log('⚠️ Hourly backup failed:', result.message);
        }
      } catch (error) {
        console.error('❌ Error in hourly backup:', error);
      }
    };

    sendHourlyBackup();

    const hourlyInterval = 60 * 60 * 1000;
    console.log('📡 Setting up hourly Telegram backup for owner...');
    
    hourlyBackupIntervalRef.current = setInterval(() => {
      sendHourlyBackup();
    }, hourlyInterval);

    return () => {
      if (hourlyBackupIntervalRef.current) {
        clearInterval(hourlyBackupIntervalRef.current);
        hourlyBackupIntervalRef.current = null;
      }
    };
  }, [currentUser?.marketId, currentUser?.role, getStorageKey]);

  const manualSyncToCloud = useCallback(async () => {
    if (!currentUser?.marketId) {
      return { success: false, message: 'تکایە سەرەتا چوونەژوورەوە بکە' };
    }
    
    if (!process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
      console.log('⚠️ Backend URL not configured');
      return { 
        success: false, 
        message: 'Backend دیاری نەکراوە. تکایە EXPO_PUBLIC_RORK_API_BASE_URL دیاری بکە لە ڕێکخستنەکانی پڕۆژەکەدا. زانیاریەکان لە کۆگای ناوخۆیی پارێزراون.'
      };
    }

    try {
      setSyncStatus('syncing');
      const storageKey = getStorageKey();
      if (!storageKey) throw new Error('No storage key available');
      
      const stored = await AsyncStorage.getItem(storageKey);
      const parsed = await safeJSONParse<Debtor[]>(stored, []);
      
      const sanitizedData = parsed.map(debtor => ({
        ...debtor,
        totalDebt: Number.isFinite(debtor.totalDebt) ? debtor.totalDebt : 0,
        debtLimit: debtor.debtLimit !== undefined && Number.isFinite(debtor.debtLimit) ? debtor.debtLimit : undefined,
        interestRate: debtor.interestRate !== undefined && Number.isFinite(debtor.interestRate) ? debtor.interestRate : undefined,
      }));
      
      const backupResult = await backupSaveMutation.mutateAsync({
        marketId: currentUser.marketId,
        userId: currentUser.id,
        debtors: sanitizedData,
        timestamp: new Date().toISOString(),
      });
      
      if (backupResult?.success) {
        setLastBackendSyncTime(backupResult.timestamp || new Date().toISOString());
        setSyncStatus('success');
        setPendingChanges(0);
        lastSyncTimeRef.current = Date.now();
        return { success: true, message: 'Synced successfully' };
      } else {
        setSyncStatus('error');
        return { success: false, message: backupResult?.message || 'Failed to sync' };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setSyncStatus('error');
      return { success: false, message: errorMsg };
    }
  }, [currentUser, getStorageKey, backupSaveMutation]);

  return useMemo(
    () => ({
      marketDebtors,
      setMarketDebtors,
      syncData,
      refreshMarketData,
      manualSyncToCloud,
      isLoading: debtorsQuery.isLoading,
      isRefreshing: debtorsQuery.isFetching && !debtorsQuery.isLoading,
      lastBackendSyncTime,
      lastTelegramBackupTime,
      syncStatus,
      pendingChanges,
    }),
    [marketDebtors, syncData, refreshMarketData, manualSyncToCloud, debtorsQuery.isLoading, debtorsQuery.isFetching, lastBackendSyncTime, lastTelegramBackupTime, syncStatus, pendingChanges]
  );
});
