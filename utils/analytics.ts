import type { Debtor } from '@/types';

export interface DebtHistoryPoint {
  date: string;
  amount: number;
  label: string;
}

export interface TrendData {
  month: string;
  debtAmount: number;
  paymentAmount: number;
  netChange: number;
}

export const calculateDebtHistory = (debtors: Debtor[], months: number = 12): DebtHistoryPoint[] => {
  const allTransactions = debtors.flatMap(d => 
    d.transactions.map(t => ({ ...t, debtorId: d.id }))
  );
  
  const sortedTransactions = allTransactions.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const history: DebtHistoryPoint[] = [];
  let runningTotal = 0;
  
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
  
  sortedTransactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate >= startDate) {
      if (transaction.type === 'debt') {
        runningTotal += transaction.amount;
      } else {
        runningTotal -= transaction.amount;
      }
      
      history.push({
        date: transaction.date,
        amount: runningTotal,
        label: transactionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
  });
  
  return history;
};

export const calculateTrendData = (debtors: Debtor[], months: number = 6): TrendData[] => {
  const now = new Date();
  const trends: TrendData[] = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    let debtAmount = 0;
    let paymentAmount = 0;
    
    debtors.forEach(debtor => {
      debtor.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate >= monthStart && transactionDate <= monthEnd) {
          if (transaction.type === 'debt') {
            debtAmount += transaction.amount;
          } else {
            paymentAmount += transaction.amount;
          }
        }
      });
    });
    
    trends.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      debtAmount,
      paymentAmount,
      netChange: debtAmount - paymentAmount,
    });
  }
  
  return trends;
};

export const predictDebt = (trendData: TrendData[]): number => {
  if (trendData.length < 2) return 0;
  
  const recentTrends = trendData.slice(-3);
  const avgNetChange = recentTrends.reduce((sum, t) => sum + t.netChange, 0) / recentTrends.length;
  
  return avgNetChange;
};

export const calculateDebtPrediction = (debtors: Debtor[], months: number = 3): number[] => {
  const trends = calculateTrendData(debtors, 6);
  const prediction = predictDebt(trends);
  
  const currentTotal = debtors.reduce((sum, d) => sum + Math.max(0, d.totalDebt), 0);
  const predictions: number[] = [];
  
  for (let i = 1; i <= months; i++) {
    predictions.push(Math.max(0, currentTotal + (prediction * i)));
  }
  
  return predictions;
};

export interface DebtBreakdown {
  byCategory: { category: string; amount: number; count: number }[];
  byColorTag: { tag: string; amount: number; count: number }[];
  byTimeRange: { range: string; amount: number; count: number }[];
}

export const getDebtBreakdown = (debtors: Debtor[]): DebtBreakdown => {
  const byCategory: Record<string, { amount: number; count: number }> = {};
  const byColorTag: Record<string, { amount: number; count: number }> = {};
  const byTimeRange: Record<string, { amount: number; count: number }> = {
    'today': { amount: 0, count: 0 },
    'week': { amount: 0, count: 0 },
    'month': { amount: 0, count: 0 },
    'older': { amount: 0, count: 0 },
  };
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  debtors.forEach(debtor => {
    const category = debtor.category || 'Uncategorized';
    const colorTag = debtor.colorTag || 'None';
    
    if (!byCategory[category]) {
      byCategory[category] = { amount: 0, count: 0 };
    }
    if (!byColorTag[colorTag]) {
      byColorTag[colorTag] = { amount: 0, count: 0 };
    }
    
    if (debtor.totalDebt > 0) {
      byCategory[category].amount += debtor.totalDebt;
      byCategory[category].count++;
      
      byColorTag[colorTag].amount += debtor.totalDebt;
      byColorTag[colorTag].count++;
      
      const lastTransaction = debtor.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      if (lastTransaction) {
        const lastDate = new Date(lastTransaction.date);
        if (lastDate >= todayStart) {
          byTimeRange['today'].amount += debtor.totalDebt;
          byTimeRange['today'].count++;
        } else if (lastDate >= weekStart) {
          byTimeRange['week'].amount += debtor.totalDebt;
          byTimeRange['week'].count++;
        } else if (lastDate >= monthStart) {
          byTimeRange['month'].amount += debtor.totalDebt;
          byTimeRange['month'].count++;
        } else {
          byTimeRange['older'].amount += debtor.totalDebt;
          byTimeRange['older'].count++;
        }
      }
    }
  });
  
  return {
    byCategory: Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data,
    })),
    byColorTag: Object.entries(byColorTag).map(([tag, data]) => ({
      tag,
      ...data,
    })),
    byTimeRange: Object.entries(byTimeRange).map(([range, data]) => ({
      range,
      ...data,
    })),
  };
};
