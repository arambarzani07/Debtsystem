import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Store } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'stores';

export const [StoreContext, useStores] = createContextHook(() => {
  let authContext: ReturnType<typeof useAuth> | null = null;
  try {
    authContext = useAuth();
  } catch {
    console.log('StoreContext: Auth context not available yet');
  }
  const currentUser = authContext?.currentUser ?? null;
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStores(parsed);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStores = async (newStores: Store[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStores));
      setStores(newStores);
    } catch (error) {
      console.error('Error saving stores:', error);
    }
  };

  const addStore = useCallback((store: Omit<Store, 'id' | 'createdAt' | 'employeeIds' | 'isActive'>) => {
    const newStore: Store = {
      ...store,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      employeeIds: [],
      isActive: true,
      managerId: currentUser?.id || '',
    };
    
    const updated = [...stores, newStore];
    saveStores(updated);
    return newStore;
  }, [stores, currentUser]);

  const updateStore = useCallback((id: string, updates: Partial<Store>) => {
    const updated = stores.map(s => s.id === id ? { ...s, ...updates } : s);
    saveStores(updated);
  }, [stores]);

  const deleteStore = useCallback((id: string) => {
    const updated = stores.filter(s => s.id !== id);
    saveStores(updated);
  }, [stores]);

  const addEmployeeToStore = useCallback((storeId: string, employeeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store && !store.employeeIds.includes(employeeId)) {
      updateStore(storeId, {
        employeeIds: [...store.employeeIds, employeeId],
      });
    }
  }, [stores, updateStore]);

  const removeEmployeeFromStore = useCallback((storeId: string, employeeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      updateStore(storeId, {
        employeeIds: store.employeeIds.filter(id => id !== employeeId),
      });
    }
  }, [stores, updateStore]);

  const getActiveStores = useCallback(() => {
    return stores.filter(s => s.isActive);
  }, [stores]);

  const getStoreById = useCallback((id: string) => {
    return stores.find(s => s.id === id);
  }, [stores]);

  return {
    stores,
    isLoading,
    addStore,
    updateStore,
    deleteStore,
    addEmployeeToStore,
    removeEmployeeFromStore,
    getActiveStores,
    getStoreById,
    refreshStores: loadStores,
  };
});
