import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import type { Debtor, RiskAnalysis } from '@/types';

export async function calculateRiskScore(debtor: Debtor): Promise<RiskAnalysis> {
  const totalPayments = debtor.transactions.filter(t => t.type === 'payment').length;
  const totalDebts = debtor.transactions.filter(t => t.type === 'debt').length;
  const paymentHistory = totalDebts > 0 ? (totalPayments / totalDebts) * 100 : 0;

  const debtAmount = debtor.totalDebt > 0 ? Math.min((debtor.totalDebt / (debtor.debtLimit || 10000)) * 100, 100) : 0;

  const interestRateScore = debtor.interestRate ? Math.min((debtor.interestRate / 30) * 100, 100) : 0;

  let timeOverdue = 0;
  if (debtor.dueDate) {
    const dueDate = new Date(debtor.dueDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 0) {
      timeOverdue = Math.min((daysDiff / 90) * 100, 100);
    }
  }

  const riskScore = Math.round(
    (100 - paymentHistory) * 0.3 +
    debtAmount * 0.3 +
    interestRateScore * 0.2 +
    timeOverdue * 0.2
  );

  let predictedDefaultDate: string | undefined;
  if (riskScore > 70) {
    const daysUntilDefault = Math.max(7, 90 - Math.floor((riskScore - 70) * 3));
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + daysUntilDefault);
    predictedDefaultDate = defaultDate.toISOString();
  }

  return {
    debtorId: debtor.id,
    riskScore,
    predictedDefaultDate,
    factors: {
      paymentHistory: Math.round(100 - paymentHistory),
      debtAmount: Math.round(debtAmount),
      interestRate: Math.round(interestRateScore),
      timeOverdue: Math.round(timeOverdue),
    },
    calculatedAt: new Date().toISOString(),
  };
}

export async function analyzeDebtorWithAI(debtor: Debtor): Promise<string> {
  try {
    const riskAnalysis = await calculateRiskScore(debtor);
    
    const analysisSchema = z.object({
      recommendation: z.string().describe('Detailed recommendation for managing this debtor in Kurdish'),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).describe('Overall risk level'),
      actionItems: z.array(z.string()).describe('Specific action items to take'),
    });

    const result = await generateObject({
      messages: [
        {
          role: 'user',
          content: `Analyze this debtor and provide recommendations in Kurdish:

Name: ${debtor.name}
Total Debt: ${debtor.totalDebt}
Risk Score: ${riskAnalysis.riskScore}/100
Payment History: ${debtor.transactions.filter(t => t.type === 'payment').length} payments out of ${debtor.transactions.filter(t => t.type === 'debt').length} debts
Interest Rate: ${debtor.interestRate || 0}%
${debtor.dueDate ? `Due Date: ${debtor.dueDate}` : ''}

Risk Factors:
- Payment History Score: ${riskAnalysis.factors.paymentHistory}/100
- Debt Amount Score: ${riskAnalysis.factors.debtAmount}/100
- Interest Rate Score: ${riskAnalysis.factors.interestRate}/100
- Time Overdue Score: ${riskAnalysis.factors.timeOverdue}/100

Provide a detailed analysis and recommendations for managing this customer.`,
        },
      ],
      schema: analysisSchema as any,
    }) as { recommendation: string; riskLevel: 'low' | 'medium' | 'high' | 'critical'; actionItems: string[] };

    return `ئاستی مەترسی: ${result.riskLevel === 'low' ? 'کەم' : result.riskLevel === 'medium' ? 'ناوەند' : result.riskLevel === 'high' ? 'بەرز' : 'گرنگ'}\n\n${result.recommendation}\n\nڕاسپاردەکان:\n${result.actionItems.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}`;
  } catch (error) {
    console.error('Error analyzing debtor with AI:', error);
    return 'نەتوانرا شیکاری بکرێت';
  }
}

export function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (riskScore < 30) return 'low';
  if (riskScore < 50) return 'medium';
  if (riskScore < 70) return 'high';
  return 'critical';
}

export function getRiskColor(riskScore: number): string {
  const level = getRiskLevel(riskScore);
  switch (level) {
    case 'low': return '#22C55E';
    case 'medium': return '#F59E0B';
    case 'high': return '#EF4444';
    case 'critical': return '#991B1B';
  }
}

export function getRiskLabel(riskScore: number): string {
  const level = getRiskLevel(riskScore);
  switch (level) {
    case 'low': return 'مەترسی کەم';
    case 'medium': return 'مەترسی ناوەند';
    case 'high': return 'مەترسی بەرز';
    case 'critical': return 'مەترسی گرنگ';
  }
}
