import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PaymentGateway } from '@/types';

const STORAGE_KEY = 'payment_gateways';

export const [PaymentGatewayContext, usePaymentGateways] = createContextHook(() => {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGateways(parsed);
      }
    } catch (error) {
      console.error('Error loading gateways:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGateways = async (newGateways: PaymentGateway[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newGateways));
      setGateways(newGateways);
    } catch (error) {
      console.error('Error saving gateways:', error);
    }
  };

  const addGateway = useCallback((gateway: Omit<PaymentGateway, 'id' | 'createdAt'>) => {
    const newGateway: PaymentGateway = {
      ...gateway,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...gateways, newGateway];
    saveGateways(updated);
    return newGateway;
  }, [gateways]);

  const updateGateway = useCallback((id: string, updates: Partial<PaymentGateway>) => {
    const updated = gateways.map(g => g.id === id ? { ...g, ...updates } : g);
    saveGateways(updated);
  }, [gateways]);

  const deleteGateway = useCallback((id: string) => {
    const updated = gateways.filter(g => g.id !== id);
    saveGateways(updated);
  }, [gateways]);

  const toggleGateway = useCallback((id: string) => {
    const gateway = gateways.find(g => g.id === id);
    if (gateway) {
      updateGateway(id, { isActive: !gateway.isActive });
    }
  }, [gateways, updateGateway]);

  const getActiveGateways = useCallback(() => {
    return gateways.filter(g => g.isActive);
  }, [gateways]);

  const processPayment = useCallback(async (
    gatewayId: string,
    amount: number,
    debtorId: string
  ): Promise<{ success: boolean; message: string; transactionId?: string }> => {
    const gateway = gateways.find(g => g.id === gatewayId);
    
    if (!gateway) {
      return { success: false, message: 'دەروازەی پارەدان نەدۆزرایەوە' };
    }

    if (!gateway.isActive) {
      return { success: false, message: 'دەروازەی پارەدان چالاک نییە' };
    }

    console.log(`Processing payment: ${amount} via ${gateway.name}`);
    
    return {
      success: true,
      message: 'پارەدان سەرکەوتووبوو',
      transactionId: `TXN-${Date.now()}`,
    };
  }, [gateways]);

  return {
    gateways,
    isLoading,
    addGateway,
    updateGateway,
    deleteGateway,
    toggleGateway,
    getActiveGateways,
    processPayment,
    refreshGateways: loadGateways,
  };
});
