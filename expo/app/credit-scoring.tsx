import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Award,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  Star,
  Activity,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebt } from '@/contexts/DebtContext';
import type { Debtor } from '@/types';

interface CreditScore {
  score: number;
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor';
  color: string;
  factors: {
    paymentHistory: number;
    debtRatio: number;
    paymentFrequency: number;
    accountAge: number;
    recentActivity: number;
  };
}

export default function CreditScoring() {
  const { language } = useLanguage();
  const { debtors, getAllTransactions } = useDebt();
  
  const payments = useMemo(() => getAllTransactions(), [getAllTransactions]);

  const t = {
    title: language === 'ku' ? 'سیستەمی خاڵدانی کڕیاران' : language === 'ar' ? 'نظام تسجيل الائتمان' : 'Credit Scoring System',
    creditScore: language === 'ku' ? 'خاڵی کڕیار' : language === 'ar' ? 'درجة الائتمان' : 'Credit Score',
    excellent: language === 'ku' ? 'زۆر باش' : language === 'ar' ? 'ممتاز' : 'Excellent',
    good: language === 'ku' ? 'باش' : language === 'ar' ? 'جيد' : 'Good',
    fair: language === 'ku' ? 'ناوەند' : language === 'ar' ? 'مقبول' : 'Fair',
    poor: language === 'ku' ? 'خراپ' : language === 'ar' ? 'ضعيف' : 'Poor',
    veryPoor: language === 'ku' ? 'زۆر خراپ' : language === 'ar' ? 'سيئ جدا' : 'Very Poor',
    scoringFactors: language === 'ku' ? 'فاکتەرەکانی خاڵ' : language === 'ar' ? 'عوامل التسجيل' : 'Scoring Factors',
    paymentHistory: language === 'ku' ? 'مێژووی پارەدان' : language === 'ar' ? 'تاريخ الدفع' : 'Payment History',
    debtRatio: language === 'ku' ? 'ڕێژەی قەرز' : language === 'ar' ? 'نسبة الدين' : 'Debt Ratio',
    paymentFrequency: language === 'ku' ? 'دووبارەیی پارەدان' : language === 'ar' ? 'تكرار الدفع' : 'Payment Frequency',
    accountAge: language === 'ku' ? 'تەمەنی هەژمار' : language === 'ar' ? 'عمر الحساب' : 'Account Age',
    recentActivity: language === 'ku' ? 'چالاکی دوایی' : language === 'ar' ? 'النشاط الأخير' : 'Recent Activity',
    topCustomers: language === 'ku' ? 'باشترین کڕیاران' : language === 'ar' ? 'أفضل العملاء' : 'Top Customers',
    riskAlerts: language === 'ku' ? 'ئاگادارکردنەوەی مەترسی' : language === 'ar' ? 'تنبيهات المخاطر' : 'Risk Alerts',
    creditTrend: language === 'ku' ? 'ئاڕاستەی خاڵ' : language === 'ar' ? 'اتجاه الائتمان' : 'Credit Trend',
    improving: language === 'ku' ? 'باشتر دەبێت' : language === 'ar' ? 'يتحسن' : 'Improving',
    declining: language === 'ku' ? 'خراپتر دەبێت' : language === 'ar' ? 'يتدهور' : 'Declining',
    stable: language === 'ku' ? 'جێگیرە' : language === 'ar' ? 'مستقر' : 'Stable',
    viewDetails: language === 'ku' ? 'زانیاری زیاتر' : language === 'ar' ? 'عرض التفاصيل' : 'View Details',
  };

  const calculateCreditScore = useCallback((debtorId: string): CreditScore => {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) {
      return {
        score: 0,
        rating: 'Very Poor',
        color: '#ef4444',
        factors: {
          paymentHistory: 0,
          debtRatio: 0,
          paymentFrequency: 0,
          accountAge: 0,
          recentActivity: 0,
        },
      };
    }

    const debtorPayments = payments.filter((p: any) => p.debtorId === debtorId);
    
    const paymentHistory = Math.min(100, (debtorPayments.length / Math.max(1, debtor.transactions?.length || 1)) * 100);
    
    const totalDebt = debtor.totalDebt || 0;
    const totalPaid = debtor.transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    const debtRatio = totalDebt > 0 ? Math.min(100, (totalPaid / totalDebt) * 100) : 0;
    
    const now = new Date();
    const recentPayments = debtorPayments.filter((p: any) => {
      const paymentDate = new Date(p.date);
      const daysDiff = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });
    const paymentFrequency = Math.min(100, (recentPayments.length / 10) * 100);
    
    const createdDate = new Date(debtor.createdAt || now);
    const accountAgeDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    const accountAge = Math.min(100, (accountAgeDays / 365) * 100);
    
    const recentActivity = recentPayments.length > 0 ? 100 : 0;

    const score = Math.round(
      paymentHistory * 0.35 +
      debtRatio * 0.25 +
      paymentFrequency * 0.20 +
      accountAge * 0.10 +
      recentActivity * 0.10
    );

    let rating: CreditScore['rating'];
    let color: string;

    if (score >= 80) {
      rating = 'Excellent';
      color = '#10b981';
    } else if (score >= 65) {
      rating = 'Good';
      color = '#3b82f6';
    } else if (score >= 50) {
      rating = 'Fair';
      color = '#f59e0b';
    } else if (score >= 35) {
      rating = 'Poor';
      color = '#f97316';
    } else {
      rating = 'Very Poor';
      color = '#ef4444';
    }

    return {
      score,
      rating,
      color,
      factors: {
        paymentHistory,
        debtRatio,
        paymentFrequency,
        accountAge,
        recentActivity,
      },
    };
  }, [debtors, payments]);

  const scoredDebtors = useMemo(() => {
    return debtors
      .map((debtor: Debtor) => ({
        ...debtor,
        creditScore: calculateCreditScore(debtor.id),
      }))
      .sort((a: any, b: any) => b.creditScore.score - a.creditScore.score);
  }, [debtors, calculateCreditScore]);

  const riskCustomers = scoredDebtors.filter((d: any) => d.creditScore.score < 50);
  const topCustomers = scoredDebtors.slice(0, 5);

  const themeContext = useTheme();
  const isDark = themeContext.settings.theme === 'dark';
  const bgColor = isDark ? '#000' : '#f8fafc';
  const cardBg = isDark ? '#1a1a1a' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryText = isDark ? '#999' : '#666';

  const getRatingLabel = (rating: CreditScore['rating']) => {
    switch (rating) {
      case 'Excellent': return t.excellent;
      case 'Good': return t.good;
      case 'Fair': return t.fair;
      case 'Poor': return t.poor;
      case 'Very Poor': return t.veryPoor;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t.title,
          headerStyle: { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
          headerTintColor: textColor,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statsGrid, { gap: 12 }]}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Award size={24} color="#10b981" />
            <Text style={[styles.statValue, { color: textColor }]}>
              {topCustomers.length}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>{t.topCustomers}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <AlertTriangle size={24} color="#ef4444" />
            <Text style={[styles.statValue, { color: textColor }]}>
              {riskCustomers.length}
            </Text>
            <Text style={[styles.statLabel, { color: secondaryText }]}>{t.riskAlerts}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t.topCustomers}</Text>
          {topCustomers.map((debtor: any, index: number) => (
            <TouchableOpacity
              key={debtor.id}
              style={[styles.customerCard, { borderBottomColor: isDark ? '#2a2a2a' : '#e2e8f0' }]}
              onPress={() => router.push({ pathname: '/debtor/[id]', params: { id: debtor.id } } as any)}
            >
              <View style={styles.customerLeft}>
                <View style={[styles.rank, { backgroundColor: debtor.creditScore.color }]}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.customerInfo}>
                  <Text style={[styles.customerName, { color: textColor }]}>{debtor.name}</Text>
                  <Text style={[styles.customerRating, { color: secondaryText }]}>
                    {getRatingLabel(debtor.creditScore.rating)}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={[styles.scoreValue, { color: debtor.creditScore.color }]}>
                  {debtor.creditScore.score}
                </Text>
                <View style={styles.scoreBar}>
                  <View
                    style={[
                      styles.scoreProgress,
                      {
                        width: `${debtor.creditScore.score}%`,
                        backgroundColor: debtor.creditScore.color,
                      },
                    ]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {riskCustomers.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#ef4444" />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t.riskAlerts}</Text>
            </View>
            {riskCustomers.map((debtor: any) => (
              <TouchableOpacity
                key={debtor.id}
                style={[styles.riskCard, { borderBottomColor: isDark ? '#2a2a2a' : '#e2e8f0' }]}
                onPress={() => router.push({ pathname: '/debtor/[id]', params: { id: debtor.id } } as any)}
              >
                <View style={styles.riskLeft}>
                  <View style={[styles.riskIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <AlertTriangle size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={[styles.riskName, { color: textColor }]}>{debtor.name}</Text>
                    <Text style={[styles.riskScore, { color: '#ef4444' }]}>
                      {t.creditScore}: {debtor.creditScore.score}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.viewMore, { color: '#3b82f6' }]}>{t.viewDetails}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t.scoringFactors}</Text>
          {topCustomers[0] && (
            <View style={styles.factorsContainer}>
              {Object.entries(topCustomers[0].creditScore.factors).map(([key, value]) => {
                let label = '';
                let icon = Activity;
                switch (key) {
                  case 'paymentHistory':
                    label = t.paymentHistory;
                    icon = Clock;
                    break;
                  case 'debtRatio':
                    label = t.debtRatio;
                    icon = DollarSign;
                    break;
                  case 'paymentFrequency':
                    label = t.paymentFrequency;
                    icon = Calendar;
                    break;
                  case 'accountAge':
                    label = t.accountAge;
                    icon = Star;
                    break;
                  case 'recentActivity':
                    label = t.recentActivity;
                    icon = Activity;
                    break;
                }
                const Icon = icon;
                return (
                  <View key={key} style={styles.factorRow}>
                    <View style={styles.factorLeft}>
                      <Icon size={18} color="#3b82f6" />
                      <Text style={[styles.factorLabel, { color: textColor }]}>{label}</Text>
                    </View>
                    <View style={styles.factorRight}>
                      <View style={[styles.factorBar, { backgroundColor: isDark ? '#2a2a2a' : '#e2e8f0' }]}>
                        <View
                          style={[
                            styles.factorProgress,
                            { width: `${value}%`, backgroundColor: '#3b82f6' },
                          ]}
                        />
                      </View>
                      <Text style={[styles.factorValue, { color: secondaryText }]}>
                        {Math.round(value as number)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  customerRating: {
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreBar: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 2,
  },
  riskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  riskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  riskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  riskScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewMore: {
    fontSize: 14,
    fontWeight: '600',
  },
  factorsContainer: {
    gap: 16,
  },
  factorRow: {
    gap: 12,
  },
  factorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  factorLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  factorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  factorProgress: {
    height: '100%',
    borderRadius: 4,
  },
  factorValue: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
});
