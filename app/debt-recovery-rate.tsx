import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react-native';

export default function DebtRecoveryRateScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();

  const recoveryStats = useMemo(() => {
    const now = new Date();

    const periods = [
      { name: 'ئەم مانگە', days: 30 },
      { name: '٣ مانگی ڕابردوو', days: 90 },
      { name: '٦ مانگی ڕابردوو', days: 180 },
      { name: 'ساڵ', days: 365 },
    ];

    const calculatePeriodStats = (days: number) => {
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      let totalDebtAdded = 0;
      let totalPayments = 0;
      
      debtors.forEach(debtor => {
        debtor.transactions.forEach(transaction => {
          const transDate = new Date(transaction.date);
          if (transDate >= startDate) {
            if (transaction.type === 'debt') {
              totalDebtAdded += transaction.amount;
            } else if (transaction.type === 'payment') {
              totalPayments += transaction.amount;
            }
          }
        });
      });

      const recoveryRate = totalDebtAdded > 0 ? (totalPayments / totalDebtAdded) * 100 : 0;
      
      return {
        totalDebtAdded,
        totalPayments,
        recoveryRate: Math.min(recoveryRate, 100),
        remaining: Math.max(totalDebtAdded - totalPayments, 0),
      };
    };

    return periods.map(period => ({
      ...period,
      stats: calculatePeriodStats(period.days),
    }));
  }, [debtors]);

  const currentTotalDebt = useMemo(() => {
    return debtors.reduce((sum, d) => sum + d.totalDebt, 0);
  }, [debtors]);

  const totalPaid = useMemo(() => {
    return debtors.reduce((sum, d) => {
      return sum + d.transactions
        .filter(t => t.type === 'payment')
        .reduce((pSum, t) => pSum + t.amount, 0);
    }, 0);
  }, [debtors]);

  const totalDebtEver = useMemo(() => {
    return debtors.reduce((sum, d) => {
      return sum + d.transactions
        .filter(t => t.type === 'debt')
        .reduce((dSum, t) => dSum + t.amount, 0);
    }, 0);
  }, [debtors]);

  const overallRecoveryRate = totalDebtEver > 0 ? (totalPaid / totalDebtEver) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>ڕێژەی گەڕاندنەوە</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={[styles.percentageCircle, { borderColor: colors.success }]}>
              <Text style={[styles.percentageText, { color: colors.success }]}>
                {overallRecoveryRate.toFixed(1)}%
              </Text>
            </View>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>ڕێژەی گشتی گەڕاندنەوە</Text>
            <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
              لە سەرەتاوە تا ئێستا
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <DollarSign size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {totalDebtEver.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی قەرز</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <TrendingUp size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.success }]}>
                {totalPaid.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی پارەدان</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <DollarSign size={24} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.error }]}>
                {currentTotalDebt.toLocaleString('en-US')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>قەرزی ماوە</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>ڕێژەی گەڕاندنەوە بەپێی ماوە</Text>

          {recoveryStats.map((period, index) => (
            <View 
              key={index}
              style={[styles.periodCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
            >
              <View style={styles.periodHeader}>
                <View style={styles.periodInfo}>
                  <Calendar size={20} color={colors.primary} />
                  <Text style={[styles.periodName, { color: colors.text }]}>{period.name}</Text>
                </View>
                <View style={[styles.periodBadge, { backgroundColor: `${colors.success}20` }]}>
                  <Percent size={16} color={colors.success} />
                  <Text style={[styles.periodRate, { color: colors.success }]}>
                    {period.stats.recoveryRate.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <View style={styles.periodStats}>
                <View style={styles.periodStatRow}>
                  <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>قەرزی زیادکراو:</Text>
                  <Text style={[styles.periodStatValue, { color: colors.text }]}>
                    {period.stats.totalDebtAdded.toLocaleString('en-US')}
                  </Text>
                </View>
                <View style={styles.periodStatRow}>
                  <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>پارەدان:</Text>
                  <Text style={[styles.periodStatValue, { color: colors.success }]}>
                    {period.stats.totalPayments.toLocaleString('en-US')}
                  </Text>
                </View>
                <View style={styles.periodStatRow}>
                  <Text style={[styles.periodStatLabel, { color: colors.textSecondary }]}>ماوە:</Text>
                  <Text style={[styles.periodStatValue, { color: colors.error }]}>
                    {period.stats.remaining.toLocaleString('en-US')}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.success,
                      width: `${Math.min(period.stats.recoveryRate, 100)}%`,
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
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
  summaryCard: { borderRadius: 20, borderWidth: 2, padding: 32, alignItems: 'center', marginBottom: 20 },
  percentageCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 8, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageText: { fontSize: 32, fontWeight: '700' as const },
  summaryTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 4, textAlign: 'center' },
  summarySubtitle: { fontSize: 14, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 2, padding: 16, alignItems: 'center', minHeight: 120, justifyContent: 'center' },
  statValue: { fontSize: 16, fontWeight: '700' as const, marginTop: 8, marginBottom: 4, textAlign: 'center' },
  statLabel: { fontSize: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 16, textAlign: 'right' },
  periodCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12 },
  periodHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  periodInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  periodName: { fontSize: 16, fontWeight: '600' as const },
  periodBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  periodRate: { fontSize: 14, fontWeight: '700' as const },
  periodStats: { gap: 8, marginBottom: 12 },
  periodStatRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  periodStatLabel: { fontSize: 14 },
  periodStatValue: { fontSize: 15, fontWeight: '600' as const },
  progressBar: { height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});
