import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { generateOverallPDF, exportToCSV } from '@/utils/export';
import { exportToExcel, exportDetailedReport, printReport } from '@/utils/excelExport';
import { Users, DollarSign, ArrowUpRight, ArrowDownRight, FileDown, Printer } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from '@/components/PieChart';

export default function StatisticsScreen() {
  const { debtors } = useDebt();
  const [isExporting, setIsExporting] = useState(false);

  const stats = useMemo(() => {
    const totalDebt = debtors.reduce((sum, d) => sum + Math.max(0, d.totalDebt), 0);
    const totalReceivable = debtors.reduce((sum, d) => sum + Math.abs(Math.min(0, d.totalDebt)), 0);
    const activeCustomers = debtors.filter(d => d.totalDebt > 0).length;
    const zeroBalanceCustomers = debtors.filter(d => d.totalDebt === 0).length;
    const creditCustomers = debtors.filter(d => d.totalDebt < 0).length;
    
    const sortedByDebt = [...debtors]
      .filter(d => d.totalDebt > 0)
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 5);
    
    const totalTransactions = debtors.reduce((sum, d) => sum + d.transactions.length, 0);
    const debtTransactions = debtors.reduce((sum, d) => 
      sum + d.transactions.filter(t => t.type === 'debt').length, 0
    );
    const paymentTransactions = debtors.reduce((sum, d) => 
      sum + d.transactions.filter(t => t.type === 'payment').length, 0
    );

    const allTransactions = debtors.flatMap(d => 
      d.transactions.map(t => ({ ...t, debtorName: d.name }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const last30Days = allTransactions.filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const totalDebtAmount = last30Days
      .filter(t => t.type === 'debt')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalPaymentAmount = last30Days
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalDebt,
      totalReceivable,
      activeCustomers,
      zeroBalanceCustomers,
      creditCustomers,
      totalCustomers: debtors.length,
      largestDebtors: sortedByDebt,
      totalTransactions,
      debtTransactions,
      paymentTransactions,
      last30DaysDebt: totalDebtAmount,
      last30DaysPayment: totalPaymentAmount,
    };
  }, [debtors]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US');
  };

  const { colors: themeColors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <LinearGradient
        colors={themeColors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="auto"
          decelerationRate="normal"
          scrollEventThrottle={16}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>ڕاپۆرت و ئامار</Text>
              <View style={styles.exportButtons}>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={async () => {
                    setIsExporting(true);
                    await generateOverallPDF(debtors);
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                >
                  <FileDown size={20} color={isExporting ? '#64748B' : '#FFFFFF'} />
                  <Text style={[styles.exportButtonText, isExporting && styles.exportButtonTextDisabled]}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={async () => {
                    setIsExporting(true);
                    await exportToCSV(debtors);
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                >
                  <FileDown size={20} color={isExporting ? '#64748B' : '#FFFFFF'} />
                  <Text style={[styles.exportButtonText, isExporting && styles.exportButtonTextDisabled]}>CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={async () => {
                    setIsExporting(true);
                    await exportToExcel(debtors);
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                >
                  <FileDown size={20} color={isExporting ? '#64748B' : '#FFFFFF'} />
                  <Text style={[styles.exportButtonText, isExporting && styles.exportButtonTextDisabled]}>Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={async () => {
                    setIsExporting(true);
                    await exportDetailedReport(debtors);
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                >
                  <FileDown size={20} color={isExporting ? '#64748B' : '#FFFFFF'} />
                  <Text style={[styles.exportButtonText, isExporting && styles.exportButtonTextDisabled]}>ڕاپۆرت</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={async () => {
                    setIsExporting(true);
                    await printReport(debtors);
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                >
                  <Printer size={20} color={isExporting ? '#64748B' : '#FFFFFF'} />
                  <Text style={[styles.exportButtonText, isExporting && styles.exportButtonTextDisabled]}>چاپکردن</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { 
              backgroundColor: themeColors.cardGlass,
              borderColor: themeColors.glassBorder,
              shadowColor: themeColors.shadowColor,
            }]}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.25)', 'rgba(220, 38, 38, 0.15)']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <DollarSign size={24} color="#F87171" />
                </View>
                <Text style={styles.statLabel}>کۆی قەرز</Text>
                <Text style={[styles.statValue, styles.debtValue]}>
                  {formatCurrency(stats.totalDebt)}
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, { 
              backgroundColor: themeColors.cardGlass,
              borderColor: themeColors.glassBorder,
              shadowColor: themeColors.shadowColor,
            }]}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.25)', 'rgba(5, 150, 105, 0.15)']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <DollarSign size={24} color="#34D399" />
                </View>
                <Text style={styles.statLabel}>کۆی وەرگیراوە</Text>
                <Text style={[styles.statValue, styles.creditValue]}>
                  {formatCurrency(stats.totalReceivable)}
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, { 
              backgroundColor: themeColors.cardGlass,
              borderColor: themeColors.glassBorder,
              shadowColor: themeColors.shadowColor,
            }]}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.25)', 'rgba(37, 99, 235, 0.15)']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <Users size={24} color="#60A5FA" />
                </View>
                <Text style={styles.statLabel}>کڕیاری چالاک</Text>
                <Text style={[styles.statValue, styles.activeValue]}>
                  {stats.activeCustomers}
                </Text>
              </LinearGradient>
            </View>

            <View style={[styles.statCard, { 
              backgroundColor: themeColors.cardGlass,
              borderColor: themeColors.glassBorder,
              shadowColor: themeColors.shadowColor,
            }]}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.25)', 'rgba(124, 58, 237, 0.15)']}
                style={styles.statGradient}
              >
                <View style={styles.statIcon}>
                  <Users size={24} color="#A78BFA" />
                </View>
                <Text style={styles.statLabel}>کۆی کڕیاران</Text>
                <Text style={[styles.statValue, styles.totalValue]}>
                  {stats.totalCustomers}
                </Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>جیاکاری کڕیاران</Text>
            <View style={styles.breakdownCard}>
              <LinearGradient
                colors={['rgba(30, 41, 59, 0.8)', 'rgba(51, 65, 85, 0.6)']}
                style={styles.breakdownGradient}
              >
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownValue}>{stats.activeCustomers}</Text>
                  <Text style={styles.breakdownLabel}>قەرزی لەسەرە</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownValue}>{stats.zeroBalanceCustomers}</Text>
                  <Text style={styles.breakdownLabel}>حسابیان سفرە</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownValue}>{stats.creditCustomers}</Text>
                  <Text style={styles.breakdownLabel}>پیشەکییان وەرگرتووەتەوە</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>مامەڵەکانی ٣٠ ڕۆژی ڕابردوو</Text>
            <View style={styles.transactionStats}>
              <View style={styles.transactionStatCard}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']}
                  style={styles.transactionStatGradient}
                >
                  <ArrowUpRight size={20} color="#F87171" />
                  <Text style={styles.transactionStatLabel}>پێدانی قەرز</Text>
                  <Text style={[styles.transactionStatValue, styles.debtValue]}>
                    {formatCurrency(stats.last30DaysDebt)}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.transactionStatCard}>
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']}
                  style={styles.transactionStatGradient}
                >
                  <ArrowDownRight size={20} color="#34D399" />
                  <Text style={styles.transactionStatLabel}>وەرگرتنەوە</Text>
                  <Text style={[styles.transactionStatValue, styles.creditValue]}>
                    {formatCurrency(stats.last30DaysPayment)}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>گەورەترین قەرزەکان</Text>
            {stats.largestDebtors.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>هیچ کڕیارێک قەرزی لەسەر نییە</Text>
              </View>
            ) : (
              <View style={styles.topDebtorsCard}>
                <LinearGradient
                  colors={['rgba(30, 41, 59, 0.8)', 'rgba(51, 65, 85, 0.6)']}
                  style={styles.topDebtorsGradient}
                >
                  {stats.largestDebtors.map((debtor, index) => (
                    <View key={debtor.id} style={styles.topDebtorRow}>
                      <Text style={styles.topDebtorAmount}>
                        {formatCurrency(debtor.totalDebt)}
                      </Text>
                      <View style={styles.topDebtorInfo}>
                        <Text style={styles.topDebtorName}>{debtor.name}</Text>
                        <Text style={styles.topDebtorRank}>پلەی {index + 1}</Text>
                      </View>
                    </View>
                  ))}
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>کۆی مامەڵەکان</Text>
            <View style={styles.transactionTotalsCard}>
              <LinearGradient
                colors={['rgba(30, 41, 59, 0.8)', 'rgba(51, 65, 85, 0.6)']}
                style={styles.transactionTotalsGradient}
              >
                <View style={styles.transactionTotalRow}>
                  <Text style={styles.transactionTotalValue}>{stats.totalTransactions}</Text>
                  <Text style={styles.transactionTotalLabel}>کۆی گشتی</Text>
                </View>
                <View style={styles.transactionTotalRow}>
                  <Text style={[styles.transactionTotalValue, styles.debtValue]}>
                    {stats.debtTransactions}
                  </Text>
                  <Text style={styles.transactionTotalLabel}>پێدانی قەرز</Text>
                </View>
                <View style={styles.transactionTotalRow}>
                  <Text style={[styles.transactionTotalValue, styles.creditValue]}>
                    {stats.paymentTransactions}
                  </Text>
                  <Text style={styles.transactionTotalLabel}>وەرگرتنەوە</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>چارتی دابەشبوونی قەرز</Text>
            <View style={styles.chartCard}>
              <LinearGradient
                colors={['rgba(30, 41, 59, 0.8)', 'rgba(51, 65, 85, 0.6)']}
                style={styles.chartGradient}
              >
                <PieChart
                  size={240}
                  data={[
                    {
                      value: stats.activeCustomers,
                      label: 'قەرزی لەسەرە',
                      color: '#F87171',
                    },
                    {
                      value: stats.creditCustomers,
                      label: 'وەرگیراوە',
                      color: '#34D399',
                    },
                    {
                      value: stats.zeroBalanceCustomers,
                      label: 'سفر',
                      color: '#60A5FA',
                    },
                  ]}
                />
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>چارتی مامەڵەکانی ٣٠ ڕۆژ</Text>
            <View style={styles.chartCard}>
              <LinearGradient
                colors={['rgba(30, 41, 59, 0.8)', 'rgba(51, 65, 85, 0.6)']}
                style={styles.chartGradient}
              >
                <PieChart
                  size={240}
                  data={[
                    {
                      value: stats.last30DaysDebt,
                      label: 'پێدانی قەرز',
                      color: '#F87171',
                    },
                    {
                      value: stats.last30DaysPayment,
                      label: 'وەرگرتنەوە',
                      color: '#34D399',
                    },
                  ]}
                />
              </LinearGradient>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 16,
    paddingBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  exportButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  exportButtonTextDisabled: {
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: Dimensions.get('window').width / 2 - 22,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  debtValue: {
    color: '#F87171',
  },
  creditValue: {
    color: '#34D399',
  },
  activeValue: {
    color: '#60A5FA',
  },
  totalValue: {
    color: '#A78BFA',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginBottom: 12,
    textAlign: 'right',
  },
  breakdownCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  breakdownGradient: {
    padding: 20,
    gap: 16,
  },
  breakdownRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 16,
    color: '#CBD5E1',
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#60A5FA',
  },
  transactionStats: {
    flexDirection: 'row',
    gap: 12,
  },
  transactionStatCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionStatGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  transactionStatLabel: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  transactionStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  topDebtorsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  topDebtorsGradient: {
    padding: 20,
    gap: 16,
  },
  topDebtorRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topDebtorInfo: {
    alignItems: 'flex-end',
  },
  topDebtorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F1F5F9',
    marginBottom: 4,
  },
  topDebtorRank: {
    fontSize: 13,
    color: '#64748B',
  },
  topDebtorAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F87171',
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  transactionTotalsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  transactionTotalsGradient: {
    padding: 20,
    gap: 16,
  },
  transactionTotalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionTotalLabel: {
    fontSize: 16,
    color: '#CBD5E1',
  },
  transactionTotalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#60A5FA',
  },
  chartCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  chartGradient: {
    padding: 24,
    alignItems: 'center',
  },
});
