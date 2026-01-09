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
  Layers,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Percent,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';

interface ConsolidationPlan {
  id: string;
  name: string;
  nameKu: string;
  totalAmount: number;
  debtors: {
    id: string;
    name: string;
    amount: number;
  }[];
  monthlyPayment: number;
  duration: number;
  interestRate: number;
  totalInterest: number;
  savings: number;
  benefits: string[];
  benefitsKu: string[];
}

export default function DebtConsolidationEngine() {
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const { settings } = useTheme();

  const [calculating, setCalculating] = useState(false);
  const [plans, setPlans] = useState<ConsolidationPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const activeDebtors = debtors.filter((d: Debtor) => d.totalDebt > 0);

  const generateConsolidationPlans = () => {
    setCalculating(true);

    setTimeout(() => {
      const totalDebt = activeDebtors.reduce((sum: number, d: Debtor) => sum + d.totalDebt, 0);
      
      const highDebtors = activeDebtors
        .filter((d: Debtor) => d.totalDebt > totalDebt / activeDebtors.length)
        .sort((a: Debtor, b: Debtor) => b.totalDebt - a.totalDebt);

      const mediumDebtors = activeDebtors
        .filter((d: Debtor) => d.totalDebt <= totalDebt / activeDebtors.length && d.totalDebt > totalDebt / (activeDebtors.length * 2))
        .sort((a: Debtor, b: Debtor) => b.totalDebt - a.totalDebt);

      const generatedPlans: ConsolidationPlan[] = [];

      if (highDebtors.length >= 2) {
        const highDebtTotal = highDebtors.reduce((sum: number, d: Debtor) => sum + d.totalDebt, 0);
        const monthlyPayment = Math.round(highDebtTotal / 12);
        const interestRate = 5;
        const totalInterest = Math.round(highDebtTotal * (interestRate / 100));
        
        generatedPlans.push({
          id: 'high-priority',
          name: 'High Priority Consolidation',
          nameKu: 'یەکخستنی گرنگی بەرز',
          totalAmount: highDebtTotal,
          debtors: highDebtors.slice(0, 5).map((d: Debtor) => ({
            id: d.id,
            name: d.name,
            amount: d.totalDebt,
          })),
          monthlyPayment,
          duration: 12,
          interestRate,
          totalInterest,
          savings: Math.round(highDebtTotal * 0.15),
          benefits: [
            'Focus on largest debts first',
            'Reduced monthly payments',
            'Clear debt in 12 months',
            'Improved cash flow',
          ],
          benefitsKu: [
            'سەرنجدان بە گەورەترین قەرزەکان یەکەم جار',
            'کەمکردنەوەی پارەدانی مانگانە',
            'پاککردنەوەی قەرز لە 12 مانگدا',
            'باشترکردنی جۆڵەی کاش',
          ],
        });
      }

      if (activeDebtors.length >= 5) {
        const allDebtTotal = totalDebt;
        const monthlyPayment = Math.round(allDebtTotal / 24);
        const interestRate = 3;
        const totalInterest = Math.round(allDebtTotal * (interestRate / 100) * 2);
        
        generatedPlans.push({
          id: 'full-consolidation',
          name: 'Full Debt Consolidation',
          nameKu: 'یەکخستنی تەواوی قەرزەکان',
          totalAmount: allDebtTotal,
          debtors: activeDebtors.slice(0, 10).map((d: Debtor) => ({
            id: d.id,
            name: d.name,
            amount: d.totalDebt,
          })),
          monthlyPayment,
          duration: 24,
          interestRate,
          totalInterest,
          savings: Math.round(allDebtTotal * 0.2),
          benefits: [
            'Consolidate all debts',
            'Single monthly payment',
            'Extended repayment period',
            'Maximum savings',
          ],
          benefitsKu: [
            'یەکخستنی هەموو قەرزەکان',
            'یەک پارەدانی مانگانە',
            'ماوەی گەڕاندنەوەی درێژکراوە',
            'زۆرترین پاشەکەوت',
          ],
        });
      }

      if (mediumDebtors.length >= 3) {
        const mediumDebtTotal = mediumDebtors.reduce((sum: number, d: Debtor) => sum + d.totalDebt, 0);
        const monthlyPayment = Math.round(mediumDebtTotal / 6);
        const interestRate = 7;
        const totalInterest = Math.round(mediumDebtTotal * (interestRate / 100) * 0.5);
        
        generatedPlans.push({
          id: 'quick-consolidation',
          name: 'Quick Consolidation',
          nameKu: 'یەکخستنی خێرا',
          totalAmount: mediumDebtTotal,
          debtors: mediumDebtors.map((d: Debtor) => ({
            id: d.id,
            name: d.name,
            amount: d.totalDebt,
          })),
          monthlyPayment,
          duration: 6,
          interestRate,
          totalInterest,
          savings: Math.round(mediumDebtTotal * 0.1),
          benefits: [
            'Fast debt clearance',
            'Lower total interest',
            'Quick relief',
            'Boost credit score',
          ],
          benefitsKu: [
            'پاککردنەوەی خێرای قەرز',
            'سوودی کەمتر',
            'ئاسوودەیی خێرا',
            'بەرزکردنەوەی خاڵی کرێدیت',
          ],
        });
      }

      const oldestDebtors = activeDebtors
        .sort((a: Debtor, b: Debtor) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 4);
      
      if (oldestDebtors.length >= 2) {
        const oldDebtTotal = oldestDebtors.reduce((sum: number, d: Debtor) => sum + d.totalDebt, 0);
        const monthlyPayment = Math.round(oldDebtTotal / 18);
        const interestRate = 4;
        const totalInterest = Math.round(oldDebtTotal * (interestRate / 100) * 1.5);
        
        generatedPlans.push({
          id: 'oldest-first',
          name: 'Oldest Debts First',
          nameKu: 'کۆنترین قەرزەکان یەکەم',
          totalAmount: oldDebtTotal,
          debtors: oldestDebtors.map((d: Debtor) => ({
            id: d.id,
            name: d.name,
            amount: d.totalDebt,
          })),
          monthlyPayment,
          duration: 18,
          interestRate,
          totalInterest,
          savings: Math.round(oldDebtTotal * 0.18),
          benefits: [
            'Clear oldest obligations',
            'Improve relationship',
            'Balanced approach',
            'Steady progress',
          ],
          benefitsKu: [
            'پاککردنەوەی کۆنترین قەرزەکان',
            'باشترکردنی پەیوەندی',
            'ڕێگەی هاوسەنگ',
            'پێشکەوتنی بەردەوام',
          ],
        });
      }

      setPlans(generatedPlans.sort((a, b) => b.savings - a.savings));
      setCalculating(false);
    }, 2500);
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
          title: language === 'ku' ? 'یەکخستنی قەرزەکان' : 'Debt Consolidation',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroSection, { backgroundColor: '#10b981' }]}>
          <View style={styles.heroContent}>
            <Layers color="#ffffff" size={48} />
            <Text style={styles.heroTitle}>
              {language === 'ku' ? 'بژاردەی باشترین' : 'Smart Consolidation'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {language === 'ku'
                ? 'یەکخستنی قەرزەکانت بە شێوەیەکی باشتر'
                : 'Consolidate your debts efficiently'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {plans.length === 0 ? (
            <View style={[styles.startCard, { backgroundColor: cardBg, borderColor }]}>
              <Layers color="#10b981" size={64} />
              <Text style={[styles.startTitle, { color: textColor }]}>
                {language === 'ku' ? 'دروستکردنی پلان' : 'Generate Plans'}
              </Text>
              <Text style={[styles.startDescription, { color: subTextColor }]}>
                {language === 'ku'
                  ? `شیکردنەوەی ${activeDebtors.length} قەرز و دروستکردنی باشترین پلانەکانی یەکخستن`
                  : `Analyze ${activeDebtors.length} debts and create optimal consolidation plans`}
              </Text>
              <TouchableOpacity
                style={[styles.startButton, calculating && styles.calculatingButton]}
                onPress={generateConsolidationPlans}
                disabled={calculating}
              >
                {calculating ? (
                  <>
                    <ActivityIndicator color="#ffffff" />
                    <Text style={styles.startButtonText}>
                      {language === 'ku' ? 'ژمێرکردن...' : 'Calculating...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Sparkles color="#ffffff" size={20} />
                    <Text style={styles.startButtonText}>
                      {language === 'ku' ? 'دروستکردنی پلان' : 'Generate Plans'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {language === 'ku' ? 'پلانەکانی پێشنیارکراو' : 'Recommended Plans'}
              </Text>

              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { backgroundColor: cardBg, borderColor },
                    selectedPlan === plan.id && styles.selectedPlan,
                  ]}
                  onPress={() => setSelectedPlan(selectedPlan === plan.id ? null : plan.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.planHeader}>
                    <View style={styles.planInfo}>
                      <Text style={[styles.planName, { color: textColor }]}>
                        {language === 'ku' ? plan.nameKu : plan.name}
                      </Text>
                      <Text style={[styles.planAmount, { color: '#10b981' }]}>
                        {plan.totalAmount.toLocaleString()} IQD
                      </Text>
                    </View>
                    <View style={[styles.savingsBadge, { backgroundColor: '#10b981' + '20' }]}>
                      <TrendingDown color="#10b981" size={16} />
                      <Text style={[styles.savingsText, { color: '#10b981' }]}>
                        {language === 'ku' ? 'پاشەکەوت' : 'Save'} {plan.savings.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planMetrics}>
                    <View style={styles.metricItem}>
                      <DollarSign color={subTextColor} size={16} />
                      <Text style={[styles.metricLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'مانگانە' : 'Monthly'}
                      </Text>
                      <Text style={[styles.metricValue, { color: textColor }]}>
                        {plan.monthlyPayment.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Calendar color={subTextColor} size={16} />
                      <Text style={[styles.metricLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'ماوە' : 'Duration'}
                      </Text>
                      <Text style={[styles.metricValue, { color: textColor }]}>
                        {plan.duration} {language === 'ku' ? 'مانگ' : 'months'}
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Percent color={subTextColor} size={16} />
                      <Text style={[styles.metricLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'سوود' : 'Interest'}
                      </Text>
                      <Text style={[styles.metricValue, { color: textColor }]}>
                        {plan.interestRate}%
                      </Text>
                    </View>

                    <View style={styles.metricItem}>
                      <Users color={subTextColor} size={16} />
                      <Text style={[styles.metricLabel, { color: subTextColor }]}>
                        {language === 'ku' ? 'کڕیار' : 'Debtors'}
                      </Text>
                      <Text style={[styles.metricValue, { color: textColor }]}>
                        {plan.debtors.length}
                      </Text>
                    </View>
                  </View>

                  {selectedPlan === plan.id && (
                    <>
                      <View style={[styles.debtorsList, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                        <Text style={[styles.debtorsTitle, { color: textColor }]}>
                          {language === 'ku' ? 'کڕیارەکان:' : 'Included Debtors:'}
                        </Text>
                        {plan.debtors.map((debtor) => (
                          <View key={debtor.id} style={styles.debtorItem}>
                            <Text style={[styles.debtorName, { color: textColor }]}>
                              {debtor.name}
                            </Text>
                            <Text style={[styles.debtorAmount, { color: subTextColor }]}>
                              {debtor.amount.toLocaleString()} IQD
                            </Text>
                          </View>
                        ))}
                      </View>

                      <View style={[styles.benefitsContainer, { backgroundColor: '#10b981' + '10' }]}>
                        <Text style={[styles.benefitsTitle, { color: textColor }]}>
                          {language === 'ku' ? 'سوودەکان:' : 'Benefits:'}
                        </Text>
                        {(language === 'ku' ? plan.benefitsKu : plan.benefits).map((benefit, index) => (
                          <View key={index} style={styles.benefitItem}>
                            <CheckCircle color="#10b981" size={16} />
                            <Text style={[styles.benefitText, { color: subTextColor }]}>
                              {benefit}
                            </Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity style={[styles.applyButton, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.applyButtonText}>
                          {language === 'ku' ? 'جێبەجێکردنی پلان' : 'Apply This Plan'}
                        </Text>
                        <ArrowRight color="#ffffff" size={20} />
                      </TouchableOpacity>
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
    color: '#d1fae5',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  startCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  startTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  startDescription: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  calculatingButton: {
    opacity: 0.7,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  planAmount: {
    fontSize: 20,
    fontWeight: '800',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  planMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  metricLabel: {
    fontSize: 12,
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  debtorsList: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },
  debtorsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  debtorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  debtorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  debtorAmount: {
    fontSize: 13,
  },
  benefitsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    flex: 1,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
