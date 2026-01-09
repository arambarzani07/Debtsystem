import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, DollarSign, BarChart } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { generateText } from '@rork-ai/toolkit-sdk';

interface CashFlowPrediction {
  nextWeek: { income: number; expenses: number; net: number };
  nextMonth: { income: number; expenses: number; net: number };
  next3Months: { income: number; expenses: number; net: number };
  insights: string[];
  risks: string[];
  opportunities: string[];
}

export default function CashFlowPredictionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, getAllTransactions } = useDebt();
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<CashFlowPrediction | null>(null);

  const transactions = getAllTransactions();

  const currentStats = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentTransactions = transactions.filter(t => new Date(t.date) >= last30Days);
    const weekTransactions = transactions.filter(t => new Date(t.date) >= last7Days);

    const totalIncome = recentTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = recentTransactions
      .filter(t => t.type === 'debt')
      .reduce((sum, t) => sum + t.amount, 0);

    const weekIncome = weekTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const weekExpenses = weekTransactions
      .filter(t => t.type === 'debt')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      last30Income: totalIncome,
      last30Expenses: totalExpenses,
      last7Income: weekIncome,
      last7Expenses: weekExpenses,
      activeDebtors: debtors.filter(d => d.totalDebt > 0).length,
      totalDebt: debtors.reduce((sum, d) => sum + (d.totalDebt > 0 ? d.totalDebt : 0), 0),
    };
  }, [transactions, debtors]);

  const handlePredict = async () => {
    setIsLoading(true);
    try {
      const prompt = `شیکاری پێشبینی کاش فلۆ بۆ سیستەمی بەڕێوەبردنی قەرز:

داتاکانی ئێستا:
- وەرگرتنی ٣٠ ڕۆژی ڕابردوو: ${currentStats.last30Income.toLocaleString('en-US')} IQD
- خەرجی ٣٠ ڕۆژی ڕابردوو: ${currentStats.last30Expenses.toLocaleString('en-US')} IQD
- وەرگرتنی ٧ ڕۆژی ڕابردوو: ${currentStats.last7Income.toLocaleString('en-US')} IQD
- خەرجی ٧ ڕۆژی ڕابردوو: ${currentStats.last7Expenses.toLocaleString('en-US')} IQD
- ژمارەی کڕیارە قەرزدارەکان: ${currentStats.activeDebtors}
- کۆی قەرزەکان: ${currentStats.totalDebt.toLocaleString('en-US')} IQD

لەسەر بنەمای ئەم داتایانە، پێشبینی بکە بۆ:
1. هەفتەی داهاتوو
2. مانگی داهاتوو
3. ٣ مانگی داهاتوو

تەنها JSON بگەڕێنەوە بەم شێوەیە:
{
  "nextWeek": {
    "income": بڕی پێشبینیکراو بۆ وەرگرتن,
    "expenses": بڕی پێشبینیکراو بۆ خەرج,
    "net": net cash flow
  },
  "nextMonth": {
    "income": بڕی پێشبینیکراو بۆ وەرگرتن,
    "expenses": بڕی پێشبینیکراو بۆ خەرج,
    "net": net cash flow
  },
  "next3Months": {
    "income": بڕی پێشبینیکراو بۆ وەرگرتن,
    "expenses": بڕی پێشبینیکراو بۆ خەرج,
    "net": net cash flow
  },
  "insights": ["بینین و شیکاری ١ بە کوردی", "بینین ٢", "بینین ٣"],
  "risks": ["مەترسی ١ بە کوردی", "مەترسی ٢"],
  "opportunities": ["دەرفەت ١ بە کوردی", "دەرفەت ٢"]
}`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: CashFlowPrediction = JSON.parse(jsonMatch[0]);
        setPrediction(parsed);
      } else {
        Alert.alert('هەڵە', 'نەتوانرا پێشبینی دروست بکرێت');
      }
    } catch (error) {
      console.error('Error predicting cash flow:', error);
      Alert.alert('هەڵە', 'کێشەیەک ڕوویدا لە پێشبینی');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>پێشبینی کاش فلۆ</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={[styles.statsCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>داتای ئێستا</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, { backgroundColor: colors.successGlass }]}>
                <DollarSign size={24} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {currentStats.last30Income.toLocaleString('en-US')}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>وەرگرتنی ٣٠ ڕۆژ</Text>
              </View>

              <View style={[styles.statItem, { backgroundColor: colors.errorGlass }]}>
                <DollarSign size={24} color={colors.error} />
                <Text style={[styles.statValue, { color: colors.error }]}>
                  {currentStats.last30Expenses.toLocaleString('en-US')}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>خەرجی ٣٠ ڕۆژ</Text>
              </View>

              <View style={[styles.statItem, { backgroundColor: colors.primaryGlass }]}>
                <BarChart size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {currentStats.activeDebtors}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کڕیاری قەرزدار</Text>
              </View>

              <View style={[styles.statItem, { backgroundColor: colors.warningGlass }]}>
                <TrendingDown size={24} color={colors.warning} />
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {currentStats.totalDebt.toLocaleString('en-US')}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی قەرز</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.predictButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.6 : 1 }]}
            onPress={handlePredict}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <TrendingUp size={20} color="#FFF" />
                <Text style={styles.predictButtonText}>پێشبینی کاش فلۆی داهاتوو</Text>
              </>
            )}
          </TouchableOpacity>

          {prediction && (
            <>
              <View style={[styles.predictionCard, { backgroundColor: colors.cardGlass, borderColor: colors.primary }]}>
                <Text style={[styles.predictionTitle, { color: colors.text }]}>پێشبینی هەفتەی داهاتوو</Text>
                <View style={styles.predictionRow}>
                  <View style={styles.predictionItem}>
                    <TrendingUp size={20} color={colors.success} />
                    <Text style={[styles.predictionValue, { color: colors.success }]}>
                      {prediction.nextWeek.income.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>وەرگرتن</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.predictionItem}>
                    <TrendingDown size={20} color={colors.error} />
                    <Text style={[styles.predictionValue, { color: colors.error }]}>
                      {prediction.nextWeek.expenses.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>خەرج</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.predictionItem}>
                    <Calendar size={20} color={prediction.nextWeek.net >= 0 ? colors.success : colors.error} />
                    <Text style={[styles.predictionValue, { color: prediction.nextWeek.net >= 0 ? colors.success : colors.error }]}>
                      {prediction.nextWeek.net.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>خاوێن</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.predictionCard, { backgroundColor: colors.cardGlass, borderColor: colors.primary }]}>
                <Text style={[styles.predictionTitle, { color: colors.text }]}>پێشبینی مانگی داهاتوو</Text>
                <View style={styles.predictionRow}>
                  <View style={styles.predictionItem}>
                    <TrendingUp size={20} color={colors.success} />
                    <Text style={[styles.predictionValue, { color: colors.success }]}>
                      {prediction.nextMonth.income.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>وەرگرتن</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.predictionItem}>
                    <TrendingDown size={20} color={colors.error} />
                    <Text style={[styles.predictionValue, { color: colors.error }]}>
                      {prediction.nextMonth.expenses.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>خەرج</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.predictionItem}>
                    <Calendar size={20} color={prediction.nextMonth.net >= 0 ? colors.success : colors.error} />
                    <Text style={[styles.predictionValue, { color: prediction.nextMonth.net >= 0 ? colors.success : colors.error }]}>
                      {prediction.nextMonth.net.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>خاوێن</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.predictionCard, { backgroundColor: colors.cardGlass, borderColor: colors.primary }]}>
                <Text style={[styles.predictionTitle, { color: colors.text }]}>پێشبینی ٣ مانگ</Text>
                <View style={styles.predictionRow}>
                  <View style={styles.predictionItem}>
                    <TrendingUp size={20} color={colors.success} />
                    <Text style={[styles.predictionValue, { color: colors.success }]}>
                      {prediction.next3Months.income.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>وەرگرتن</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.predictionItem}>
                    <TrendingDown size={20} color={colors.error} />
                    <Text style={[styles.predictionValue, { color: colors.error }]}>
                      {prediction.next3Months.expenses.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>خەرج</Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
                  <View style={styles.predictionItem}>
                    <Calendar size={20} color={prediction.next3Months.net >= 0 ? colors.success : colors.error} />
                    <Text style={[styles.predictionValue, { color: prediction.next3Months.net >= 0 ? colors.success : colors.error }]}>
                      {prediction.next3Months.net.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.predictionLabel, { color: colors.textSecondary }]}>خاوێن</Text>
                  </View>
                </View>
              </View>

              {prediction.insights && prediction.insights.length > 0 && (
                <View style={[styles.insightsCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.insightsTitle, { color: colors.primary }]}>بینین و شیکاری</Text>
                  {prediction.insights.map((insight, i) => (
                    <Text key={i} style={[styles.insightText, { color: colors.text }]}>
                      • {insight}
                    </Text>
                  ))}
                </View>
              )}

              {prediction.risks && prediction.risks.length > 0 && (
                <View style={[styles.insightsCard, { backgroundColor: colors.errorGlass, borderColor: colors.error + '40' }]}>
                  <Text style={[styles.insightsTitle, { color: colors.error }]}>مەترسییەکان</Text>
                  {prediction.risks.map((risk, i) => (
                    <Text key={i} style={[styles.insightText, { color: colors.text }]}>
                      • {risk}
                    </Text>
                  ))}
                </View>
              )}

              {prediction.opportunities && prediction.opportunities.length > 0 && (
                <View style={[styles.insightsCard, { backgroundColor: colors.successGlass, borderColor: colors.success + '40' }]}>
                  <Text style={[styles.insightsTitle, { color: colors.success }]}>دەرفەتەکان</Text>
                  {prediction.opportunities.map((opp, i) => (
                    <Text key={i} style={[styles.insightText, { color: colors.text }]}>
                      • {opp}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  predictButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 8,
  },
  predictButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  predictionCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 16,
    textAlign: 'right',
  },
  predictionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predictionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  predictionLabel: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 60,
    marginHorizontal: 8,
  },
  insightsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'right',
  },
});
