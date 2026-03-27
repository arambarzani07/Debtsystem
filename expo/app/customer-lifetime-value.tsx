import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Debtor } from '@/types';
import {
  TrendingUp,
  DollarSign,
  Star,
  Award,
  Target,
  Sparkles,
  ArrowUpRight,
  Clock,
  Users,
} from 'lucide-react-native';

interface CustomerValue {
  debtorId: string;
  debtorName: string;
  lifetimeValue: number;
  predictedRevenue: number;
  loyaltyScore: number;
  riskScore: number;
  avgTransactionValue: number;
  transactionFrequency: number;
  customerAge: number;
  projectedLifetime: number;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  recommendations: string[];
  recommendationsKu: string[];
}

export default function CustomerLifetimeValue() {
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const { settings } = useTheme();

  const [analyzing, setAnalyzing] = useState(false);
  const [customerValues, setCustomerValues] = useState<CustomerValue[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const analyzeCustomers = () => {
    setAnalyzing(true);

    setTimeout(() => {
      const values: CustomerValue[] = debtors.map((debtor: Debtor) => {
        const totalTransactions = debtor.transactions.length;
        const totalPaid = debtor.transactions
          .filter(t => t.type === 'payment')
          .reduce((sum: number, t) => sum + t.amount, 0);

        const avgTransactionValue = totalTransactions > 0 
          ? (debtor.totalDebt + totalPaid) / totalTransactions 
          : 0;

        const customerAge = Math.floor(
          (Date.now() - new Date(debtor.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        const transactionFrequency = customerAge > 0 
          ? totalTransactions / (customerAge / 30) 
          : 0;

        const paymentRate = debtor.totalDebt > 0 
          ? (totalPaid / (debtor.totalDebt + totalPaid)) * 100 
          : 100;

        const loyaltyScore = Math.min(
          100,
          (paymentRate * 0.4) + 
          (Math.min(customerAge / 365, 1) * 100 * 0.3) + 
          (Math.min(totalTransactions / 20, 1) * 100 * 0.3)
        );

        const riskScore = Math.max(
          0,
          100 - loyaltyScore - (paymentRate * 0.5)
        );

        const projectedLifetime = Math.round(
          365 + (loyaltyScore * 10) - (riskScore * 5)
        );

        const predictedRevenue = Math.round(
          avgTransactionValue * transactionFrequency * (projectedLifetime / 30)
        );

        const lifetimeValue = Math.round(
          totalPaid + predictedRevenue + (debtor.totalDebt * 0.7)
        );

        let tier: 'platinum' | 'gold' | 'silver' | 'bronze' = 'bronze';
        if (lifetimeValue > 10000000) tier = 'platinum';
        else if (lifetimeValue > 5000000) tier = 'gold';
        else if (lifetimeValue > 2000000) tier = 'silver';

        const recommendations: string[] = [];
        const recommendationsKu: string[] = [];

        if (loyaltyScore > 80) {
          recommendations.push('Offer exclusive benefits and rewards');
          recommendationsKu.push('پێشکەشکردنی سوود و پاداشتی تایبەت');
        } else if (loyaltyScore < 40) {
          recommendations.push('Implement retention strategy');
          recommendationsKu.push('جێبەجێکردنی ستراتیژی ڕاگرتن');
        }

        if (tier === 'platinum' || tier === 'gold') {
          recommendations.push('Priority customer service');
          recommendationsKu.push('خزمەتگوزاری کڕیاری گرنگ');
        }

        if (predictedRevenue > lifetimeValue * 0.5) {
          recommendations.push('High growth potential - invest in relationship');
          recommendationsKu.push('توانای گەشەی بەرز - وەبەرهێنان لە پەیوەندی');
        }

        if (riskScore > 60) {
          recommendations.push('Monitor closely and offer flexible payment options');
          recommendationsKu.push('چاودێری لە نزیکەوە و پێشکەشکردنی بژاردەی پارەدانی نەرم');
        }

        return {
          debtorId: debtor.id,
          debtorName: debtor.name,
          lifetimeValue,
          predictedRevenue,
          loyaltyScore,
          riskScore,
          avgTransactionValue,
          transactionFrequency,
          customerAge,
          projectedLifetime,
          tier,
          recommendations,
          recommendationsKu,
        };
      });

      setCustomerValues(values.sort((a, b) => b.lifetimeValue - a.lifetimeValue));
      setAnalyzing(false);
    }, 2500);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#a78bfa';
      case 'gold': return '#fbbf24';
      case 'silver': return '#94a3b8';
      case 'bronze': return '#fb923c';
      default: return '#6b7280';
    }
  };

  const getTierIcon = (tier: string) => {
    const color = getTierColor(tier);
    const size = 24;
    switch (tier) {
      case 'platinum': return <Award color={color} size={size} />;
      case 'gold': return <Star color={color} size={size} />;
      case 'silver': return <Target color={color} size={size} />;
      case 'bronze': return <Users color={color} size={size} />;
      default: return <Users color={color} size={size} />;
    }
  };

  const isDark = settings.theme === 'dark';
  const bgColor = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: language === 'ku' ? 'نرخی کڕیار' : 'Customer Value',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: '#a78bfa' }]}>
          <View style={styles.heroContent}>
            <TrendingUp color="#ffffff" size={48} />
            <Text style={styles.heroTitle}>
              {language === 'ku' ? 'نرخی تەمەنی کڕیار' : 'Lifetime Value'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {language === 'ku'
                ? 'پێشبینی نرخی داهاتووی کڕیارەکانت'
                : 'Predict future value of your customers'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {customerValues.length === 0 ? (
            <View style={[styles.analyzeCard, { backgroundColor: cardBg, borderColor }]}>
              <TrendingUp color="#a78bfa" size={64} />
              <Text style={[styles.analyzeTitle, { color: textColor }]}>
                {language === 'ku' ? 'شیکردنەوەی کڕیاران' : 'Analyze Customers'}
              </Text>
              <Text style={[styles.analyzeDescription, { color: subTextColor }]}>
                {language === 'ku'
                  ? `ژمێرکردنی نرخی تەمەنی ${debtors.length} کڕیار`
                  : `Calculate lifetime value for ${debtors.length} customers`}
              </Text>
              <TouchableOpacity
                style={[styles.analyzeButton, analyzing && styles.analyzingButton]}
                onPress={analyzeCustomers}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <ActivityIndicator color="#ffffff" />
                    <Text style={styles.analyzeButtonText}>
                      {language === 'ku' ? 'شیکردنەوە...' : 'Analyzing...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Sparkles color="#ffffff" size={20} />
                    <Text style={styles.analyzeButtonText}>
                      {language === 'ku' ? 'دەستپێکردن' : 'Start Analysis'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {language === 'ku' ? 'نرخی کڕیارەکان' : 'Customer Values'}
              </Text>

              {customerValues.map((customer) => (
                <TouchableOpacity
                  key={customer.debtorId}
                  style={[
                    styles.customerCard,
                    { backgroundColor: cardBg, borderColor },
                    selectedCustomer === customer.debtorId && styles.selectedCustomer,
                    { borderLeftWidth: 4, borderLeftColor: getTierColor(customer.tier) },
                  ]}
                  onPress={() => setSelectedCustomer(selectedCustomer === customer.debtorId ? null : customer.debtorId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerHeader}>
                    <View style={styles.customerInfo}>
                      <Text style={[styles.customerName, { color: textColor }]}>
                        {customer.debtorName}
                      </Text>
                      <View style={styles.tierBadge}>
                        {getTierIcon(customer.tier)}
                        <Text style={[styles.tierText, { color: getTierColor(customer.tier) }]}>
                          {customer.tier.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.valueContainer}>
                      <Text style={[styles.lifetimeValue, { color: '#a78bfa' }]}>
                        {(customer.lifetimeValue / 1000).toFixed(0)}K
                      </Text>
                      <Text style={[styles.valueLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'نرخ' : 'Value'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.quickStats}>
                    <View style={styles.quickStat}>
                      <ArrowUpRight color="#10b981" size={16} />
                      <Text style={[styles.quickStatValue, { color: textColor }]}>
                        {customer.loyaltyScore.toFixed(0)}%
                      </Text>
                      <Text style={[styles.quickStatLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'دڵسۆزی' : 'Loyalty'}
                      </Text>
                    </View>

                    <View style={styles.quickStat}>
                      <DollarSign color="#06b6d4" size={16} />
                      <Text style={[styles.quickStatValue, { color: textColor }]}>
                        {(customer.predictedRevenue / 1000).toFixed(0)}K
                      </Text>
                      <Text style={[styles.quickStatLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'پێشبینی' : 'Predicted'}
                      </Text>
                    </View>

                    <View style={styles.quickStat}>
                      <Clock color="#f59e0b" size={16} />
                      <Text style={[styles.quickStatValue, { color: textColor }]}>
                        {Math.round(customer.customerAge / 30)}
                      </Text>
                      <Text style={[styles.quickStatLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'مانگ' : 'Months'}
                      </Text>
                    </View>
                  </View>

                  {selectedCustomer === customer.debtorId && (
                    <>
                      <View style={[styles.detailedStats, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: subTextColor }]}>
                            {language === 'ku' ? 'ناوەندی مامەڵە' : 'Avg Transaction'}
                          </Text>
                          <Text style={[styles.statValue, { color: textColor }]}>
                            {customer.avgTransactionValue.toLocaleString()} IQD
                          </Text>
                        </View>

                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: subTextColor }]}>
                            {language === 'ku' ? 'دووبارەیی' : 'Frequency'}
                          </Text>
                          <Text style={[styles.statValue, { color: textColor }]}>
                            {customer.transactionFrequency.toFixed(1)} {language === 'ku' ? 'بۆ مانگ' : 'per month'}
                          </Text>
                        </View>

                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: subTextColor }]}>
                            {language === 'ku' ? 'تەمەنی پێشبینیکراو' : 'Projected Lifetime'}
                          </Text>
                          <Text style={[styles.statValue, { color: textColor }]}>
                            {Math.round(customer.projectedLifetime / 30)} {language === 'ku' ? 'مانگ' : 'months'}
                          </Text>
                        </View>

                        <View style={styles.statRow}>
                          <Text style={[styles.statLabel, { color: subTextColor }]}>
                            {language === 'ku' ? 'خاڵی مەترسی' : 'Risk Score'}
                          </Text>
                          <Text style={[styles.statValue, { color: customer.riskScore > 60 ? '#ef4444' : '#10b981' }]}>
                            {customer.riskScore.toFixed(0)}%
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.recommendationsBox, { backgroundColor: '#a78bfa' + '15' }]}>
                        <Text style={[styles.recommendationsTitle, { color: textColor }]}>
                          {language === 'ku' ? 'پێشنیارەکان:' : 'Recommendations:'}
                        </Text>
                        {(language === 'ku' ? customer.recommendationsKu : customer.recommendations).map((rec, index) => (
                          <View key={index} style={styles.recommendationItem}>
                            <Sparkles color="#a78bfa" size={14} />
                            <Text style={[styles.recommendationText, { color: subTextColor }]}>
                              {rec}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#ede9fe',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  analyzeCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  analyzeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  analyzeDescription: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#a78bfa',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  analyzingButton: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  customerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  selectedCustomer: {
    borderWidth: 2,
    borderColor: '#a78bfa',
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  lifetimeValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  valueLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickStatLabel: {
    fontSize: 11,
  },
  detailedStats: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  recommendationsBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  recommendationsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 12,
    flex: 1,
  },
});
