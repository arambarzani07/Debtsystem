import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DebtorReward } from '@/types';
import { safeJSONParse } from './storageRecovery';

export type LoyaltyReward = {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  isActive: boolean;
};

const REWARDS_KEY = 'loyalty_rewards';
const DEBTOR_REWARDS_KEY = 'debtor_rewards';

export const DEFAULT_REWARDS: LoyaltyReward[] = [
  {
    id: '1',
    name: 'داشکاندنی ١٠٪',
    pointsCost: 100,
    description: 'داشکاندنی ١٠٪ لەسەر کڕینی داهاتوو',
    isActive: true,
  },
  {
    id: '2',
    name: 'داشکاندنی ٢٠٪',
    pointsCost: 200,
    description: 'داشکاندنی ٢٠٪ لەسەر کڕینی داهاتوو',
    isActive: true,
  },
  {
    id: '3',
    name: 'خاڵی دووبەرابەر',
    pointsCost: 50,
    description: 'خاڵی دووبەرابەر بۆ ماوەی یەک مانگ',
    isActive: true,
  },
  {
    id: '4',
    name: 'VIP بوون',
    pointsCost: 500,
    description: 'بوون بە کڕیاری VIP بۆ شەش مانگ',
    isActive: true,
  },
  {
    id: '5',
    name: 'بێبەرامبەر',
    pointsCost: 300,
    description: 'بڕێکی بێبەرامبەر لەسەر قەرزەکەت',
    isActive: true,
  },
];

export async function getRewards(): Promise<LoyaltyReward[]> {
  try {
    const stored = await AsyncStorage.getItem(REWARDS_KEY);
    if (stored) {
      return await safeJSONParse<LoyaltyReward[]>(stored, DEFAULT_REWARDS);
    }
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(DEFAULT_REWARDS));
    return DEFAULT_REWARDS;
  } catch (error) {
    console.error('Error getting rewards:', error);
    return DEFAULT_REWARDS;
  }
}

export async function addReward(reward: Omit<LoyaltyReward, 'id'>): Promise<LoyaltyReward> {
  try {
    const rewards = await getRewards();
    const newReward: LoyaltyReward = {
      ...reward,
      id: Date.now().toString(),
    };
    rewards.push(newReward);
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
    return newReward;
  } catch (error) {
    console.error('Error adding reward:', error);
    throw error;
  }
}

export async function updateReward(id: string, updates: Partial<LoyaltyReward>): Promise<void> {
  try {
    const rewards = await getRewards();
    const index = rewards.findIndex(r => r.id === id);
    if (index !== -1) {
      rewards[index] = { ...rewards[index], ...updates };
      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
    }
  } catch (error) {
    console.error('Error updating reward:', error);
    throw error;
  }
}

export async function deleteReward(id: string): Promise<void> {
  try {
    const rewards = await getRewards();
    const filtered = rewards.filter(r => r.id !== id);
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting reward:', error);
    throw error;
  }
}

export async function redeemReward(debtorId: string, rewardId: string, currentPoints: number): Promise<boolean> {
  try {
    const rewards = await getRewards();
    const reward = rewards.find(r => r.id === rewardId && r.isActive);
    
    if (!reward) {
      console.log('Reward not found or inactive');
      return false;
    }

    if (currentPoints < reward.pointsCost) {
      console.log('Insufficient points');
      return false;
    }

    const stored = await AsyncStorage.getItem(DEBTOR_REWARDS_KEY);
    const debtorRewards: DebtorReward[] = await safeJSONParse<DebtorReward[]>(stored, []);
    
    const newRedemption: DebtorReward = {
      debtorId,
      rewardId,
      redeemedAt: new Date().toISOString(),
    };
    
    debtorRewards.push(newRedemption);
    await AsyncStorage.setItem(DEBTOR_REWARDS_KEY, JSON.stringify(debtorRewards));
    
    return true;
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return false;
  }
}

export async function getDebtorRewards(debtorId: string): Promise<DebtorReward[]> {
  try {
    const stored = await AsyncStorage.getItem(DEBTOR_REWARDS_KEY);
    const allRewards: DebtorReward[] = await safeJSONParse<DebtorReward[]>(stored, []);
    return allRewards.filter(r => r.debtorId === debtorId);
  } catch (error) {
    console.error('Error getting debtor rewards:', error);
    return [];
  }
}

export function calculatePointsFromTransaction(amount: number, type: 'debt' | 'payment'): number {
  if (type === 'payment') {
    return Math.floor(amount / 1000);
  }
  return 0;
}

export function getPointsForNextReward(currentPoints: number, rewards: LoyaltyReward[]): { reward: LoyaltyReward; pointsNeeded: number } | null {
  const affordableRewards = rewards
    .filter(r => r.isActive && r.pointsCost > currentPoints)
    .sort((a, b) => a.pointsCost - b.pointsCost);

  if (affordableRewards.length === 0) {
    return null;
  }

  return {
    reward: affordableRewards[0],
    pointsNeeded: affordableRewards[0].pointsCost - currentPoints,
  };
}

export function getLoyaltyTier(points: number): { name: string; color: string; icon: string } {
  if (points >= 500) {
    return { name: 'VIP زێڕین', color: '#FFD700', icon: 'crown' };
  } else if (points >= 300) {
    return { name: 'VIP زیو', color: '#C0C0C0', icon: 'award' };
  } else if (points >= 100) {
    return { name: 'VIP برۆنز', color: '#CD7F32', icon: 'medal' };
  } else {
    return { name: 'ئاسایی', color: '#6B7280', icon: 'user' };
  }
}
