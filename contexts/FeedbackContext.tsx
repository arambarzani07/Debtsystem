import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CustomerFeedback } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'customer_feedbacks';

export const [FeedbackContext, useFeedbacks] = createContextHook(() => {
  const authContext = useAuth();
  const currentUser = authContext?.currentUser;
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFeedbacks(parsed);
      }
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFeedbacks = async (newFeedbacks: CustomerFeedback[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFeedbacks));
      setFeedbacks(newFeedbacks);
    } catch (error) {
      console.error('Error saving feedbacks:', error);
    }
  };

  const addFeedback = useCallback((feedback: Omit<CustomerFeedback, 'id' | 'createdAt' | 'status'>) => {
    const newFeedback: CustomerFeedback = {
      ...feedback,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    
    const updated = [...feedbacks, newFeedback];
    saveFeedbacks(updated);
    return newFeedback;
  }, [feedbacks]);

  const updateFeedback = useCallback((id: string, updates: Partial<CustomerFeedback>) => {
    const updated = feedbacks.map(f => f.id === id ? { ...f, ...updates } : f);
    saveFeedbacks(updated);
  }, [feedbacks]);

  const deleteFeedback = useCallback((id: string) => {
    const updated = feedbacks.filter(f => f.id !== id);
    saveFeedbacks(updated);
  }, [feedbacks]);

  const respondToFeedback = useCallback((id: string, response: string) => {
    updateFeedback(id, {
      response,
      status: 'responded',
      respondedBy: currentUser?.id,
      respondedAt: new Date().toISOString(),
    });
  }, [updateFeedback, currentUser]);

  const markAsResolved = useCallback((id: string) => {
    updateFeedback(id, { status: 'resolved' });
  }, [updateFeedback]);

  const getPendingFeedbacks = useCallback(() => {
    return feedbacks.filter(f => f.status === 'pending');
  }, [feedbacks]);

  const getAverageRating = useCallback(() => {
    if (feedbacks.length === 0) return 0;
    const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    return sum / feedbacks.length;
  }, [feedbacks]);

  const getFeedbacksByDebtor = useCallback((debtorId: string) => {
    return feedbacks.filter(f => f.debtorId === debtorId);
  }, [feedbacks]);

  return {
    feedbacks,
    isLoading,
    addFeedback,
    updateFeedback,
    deleteFeedback,
    respondToFeedback,
    markAsResolved,
    getPendingFeedbacks,
    getAverageRating,
    getFeedbacksByDebtor,
    refreshFeedbacks: loadFeedbacks,
  };
});
