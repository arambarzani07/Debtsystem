import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaymentPromise } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'payment_promises';

export const [PromiseContext, usePromises] = createContextHook(() => {
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    authContext = useAuth();
  } catch {
    console.log('PromiseContext: Auth context not available yet');
  }
  const currentUser = authContext?.currentUser ?? null;
  const [promises, setPromises] = useState<PaymentPromise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPromises();
  }, []);

  const loadPromises = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPromises(parsed);
      }
    } catch (error) {
      console.error('Error loading promises:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePromises = async (newPromises: PaymentPromise[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPromises));
      setPromises(newPromises);
    } catch (error) {
      console.error('Error saving promises:', error);
    }
  };

  const addPromise = useCallback((promise: Omit<PaymentPromise, 'id' | 'promiseDate' | 'status' | 'reminderSent'>) => {
    const newPromise: PaymentPromise = {
      ...promise,
      id: Date.now().toString(),
      promiseDate: new Date().toISOString(),
      status: 'pending',
      reminderSent: false,
      createdBy: currentUser?.id,
    };
    
    const updated = [...promises, newPromise];
    savePromises(updated);
    return newPromise;
  }, [promises, currentUser]);

  const updatePromise = useCallback((id: string, updates: Partial<PaymentPromise>) => {
    const updated = promises.map(p => p.id === id ? { ...p, ...updates } : p);
    savePromises(updated);
  }, [promises]);

  const deletePromise = useCallback((id: string) => {
    const updated = promises.filter(p => p.id !== id);
    savePromises(updated);
  }, [promises]);

  const markAsKept = useCallback((id: string) => {
    updatePromise(id, {
      status: 'kept',
      completedDate: new Date().toISOString(),
    });
  }, [updatePromise]);

  const markAsBroken = useCallback((id: string) => {
    updatePromise(id, {
      status: 'broken',
      completedDate: new Date().toISOString(),
    });
  }, [updatePromise]);

  const getPendingPromises = useCallback(() => {
    return promises.filter(p => p.status === 'pending');
  }, [promises]);

  const getOverduePromises = useCallback(() => {
    const now = new Date();
    return promises.filter(p => {
      if (p.status !== 'pending') return false;
      const dueDate = new Date(p.dueDate);
      return dueDate < now;
    });
  }, [promises]);

  return {
    promises,
    isLoading,
    addPromise,
    updatePromise,
    deletePromise,
    markAsKept,
    markAsBroken,
    getPendingPromises,
    getOverduePromises,
    refreshPromises: loadPromises,
  };
});
