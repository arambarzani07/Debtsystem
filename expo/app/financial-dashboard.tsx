import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChartLine, DollarSign, TrendingUp, TrendingDown, Users, Percent } from 'lucide-react-native';

export default function FinancialDashboardScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();

  const financialStats = useMemo(() => {
    const totalDebt = debtors.reduce((sum, d) => sum + d.totalDebt, 0);
    
    const totalPaid = debtors.reduce((sum, d) => {
      return sum + d.transactions
        .filter(t => t.type === 'payment')
        .reduce((pSum, t) => pSum + t.amount, 0);
    }, 0);

    const totalLoaned = debtors.reduce((sum, d) => {
      return sum + d.transactions
        .filter(t => t.type === 'debt')
        .reduce((dSum, t) => dSum + t.amount, 0);
    }, 0);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const thisMonthRevenue = debtors.reduce((sum, d) => {
      return sum + d.transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'payment' && date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        })
        .reduce((pSum, t) => pSum + t.amount, 0);
    }, 0);

    const lastMonthRevenue = debtors.reduce((sum, d) => {
      return sum + d.transactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'payment' && date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        })
        .reduce((pSum, t) => pSum + t.amount, 0);
    }, 0);

    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    const activeCustomers = debtors.filter(d => d.totalDebt > 0).length;
    const paidCustomers = debtors.filter(d => d.totalDebt === 0 && d.transactions.length > 0).length;

    const collectionRate = totalLoaned > 0 ? (totalPaid / totalLoaned) * 100 : 0;

    return {
      totalDebt,
      totalPaid,
      totalLoaned,
      thisMonthRevenue,
      lastMonthRevenue,
      revenueChange,
      activeCustomers,
      paidCustomers,
      collectionRate,
      netProfit: totalPaid,
    };
  }, [debtors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>داشبۆردی دارایی</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.heroCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
            <ChartLine size={48} color={colors.primary} />
            <Text style={[styles.heroTitle, { color: colors.text }]}>داهاتی ئەم مانگە</Text>
            <Text style={[styles.heroValue, { color: colors.text }]}>
              {financialStats.thisMonthRevenue.toLocaleString('en-US')}
            </Text>
            <View style={[styles.changeBadge, { 
              backgroundColor: financialStats.revenueChange >= 0 ? colors.successGlass : colors.errorGlass 
            }]}>
              {financialStats.revenueChange >= 0 ? (
                <TrendingUp size={16} color={colors.success} />
              ) : (
                <TrendingDown size={16} color={colors.error} />
              )}
              <Text style={[styles.changeText, { 
                color: financialStats.revenueChange >= 0 ? colors.success : colors.error 
              }]}>
                {Math.abs(financialStats.revenueChange).toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <DollarSign size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.success }]}>
                {financialStats.totalPaid.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی پارەدان</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <DollarSign size={24} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.error }]}>
                {financialStats.totalDebt.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>قەرزی ماوە</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Users size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {financialStats.activeCustomers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کڕیاری چالاک</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Percent size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.success }]}>
                {financialStats.collectionRate.toFixed(1)}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ڕێژەی کۆکردنەوە</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>پوختەی گشتی</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>کۆی قەرزدراو:</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {financialStats.totalLoaned.toLocaleString('en-US')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>کۆی گەڕاوەتەوە:</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {financialStats.totalPaid.toLocaleString('en-US')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>ماوە:</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {financialStats.totalDebt.toLocaleString('en-US')}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '700' as const }]}>ژمارەی کڕیاران:</Text>
              <Text style={[styles.summaryValue, { color: colors.text, fontWeight: '700' as const }]}>
                {debtors.length}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 20 },
  headerCard: { borderRadius: 24, borderWidth: 2, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center', flex: 1 },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 30 },
  heroCard: { borderRadius: 20, borderWidth: 2, padding: 32, alignItems: 'center', marginBottom: 20 },
  heroTitle: { fontSize: 16, fontWeight: '600' as const, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  heroValue: { fontSize: 36, fontWeight: '700' as const, marginBottom: 12, textAlign: 'center' },
  changeBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  changeText: { fontSize: 14, fontWeight: '700' as const },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 2, padding: 20, alignItems: 'center', minHeight: 120, justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '700' as const, marginTop: 12, marginBottom: 4 },
  statLabel: { fontSize: 12, textAlign: 'center' },
  summaryCard: { borderRadius: 16, borderWidth: 2, padding: 20, marginTop: 8 },
  summaryTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 16, textAlign: 'right' },
  summaryRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 16, fontWeight: '600' as const },
  summaryDivider: { height: 1, marginVertical: 12 },
});
