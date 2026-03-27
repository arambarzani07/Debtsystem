import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Calendar,
  Target,
  Award,
  AlertTriangle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import type { Debtor } from '@/types';

const { width } = Dimensions.get('window');

interface CustomerMetrics {
  debtor: Debtor;
  avgDebtAmount: number;
  avgPaymentAmount: number;
  paymentFrequency: number;
  totalTransactions: number;
  debtToPaymentRatio: number;
  avgDaysBetweenPayments: number;
  lastActivityDate: Date | null;
  daysSinceLastActivity: number;
  reliability: number;
}

export default function DebtComparisonScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const [showDebtorPicker, setShowDebtorPicker] = useState(false);
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>([]);

  const calculateMetrics = (debtor: Debtor): CustomerMetrics => {
    const debtTransactions = debtor.transactions.filter(t => t.type === 'debt');
    const paymentTransactions = debtor.transactions.filter(t => t.type === 'payment');

    const avgDebtAmount = debtTransactions.length > 0
      ? debtTransactions.reduce((sum, t) => sum + t.amount, 0) / debtTransactions.length
      : 0;

    const avgPaymentAmount = paymentTransactions.length > 0
      ? paymentTransactions.reduce((sum, t) => sum + t.amount, 0) / paymentTransactions.length
      : 0;

    const totalDebt = debtTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalPayment = paymentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const debtToPaymentRatio = totalPayment > 0 ? (totalPayment / totalDebt) * 100 : 0;

    const sortedPayments = [...paymentTransactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let totalDaysBetweenPayments = 0;
    for (let i = 1; i < sortedPayments.length; i++) {
      const days = (new Date(sortedPayments[i].date).getTime() - 
                    new Date(sortedPayments[i - 1].date).getTime()) / (1000 * 60 * 60 * 24);
      totalDaysBetweenPayments += days;
    }
    const avgDaysBetweenPayments = sortedPayments.length > 1
      ? totalDaysBetweenPayments / (sortedPayments.length - 1)
      : 0;

    const allTransactions = [...debtor.transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastActivityDate = allTransactions.length > 0 
      ? new Date(allTransactions[0].date)
      : null;
    const daysSinceLastActivity = lastActivityDate
      ? Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const paymentFrequency = paymentTransactions.length;
    const reliability = Math.min(
      (debtToPaymentRatio / 100) * 0.4 +
      (paymentFrequency / Math.max(debtTransactions.length, 1)) * 0.3 +
      (daysSinceLastActivity < 30 ? 0.3 : 0),
      1
    ) * 100;

    return {
      debtor,
      avgDebtAmount,
      avgPaymentAmount,
      paymentFrequency,
      totalTransactions: debtor.transactions.length,
      debtToPaymentRatio,
      avgDaysBetweenPayments,
      lastActivityDate,
      daysSinceLastActivity,
      reliability,
    };
  };

  const comparisonData = useMemo(() => {
    return selectedDebtors
      .map(id => debtors.find(d => d.id === id))
      .filter((d): d is Debtor => d !== undefined)
      .map(calculateMetrics);
  }, [selectedDebtors, debtors]);

  const addDebtor = (debtorId: string) => {
    if (!selectedDebtors.includes(debtorId) && selectedDebtors.length < 4) {
      setSelectedDebtors([...selectedDebtors, debtorId]);
    }
    setShowDebtorPicker(false);
  };

  const removeDebtor = (debtorId: string) => {
    setSelectedDebtors(selectedDebtors.filter(id => id !== debtorId));
  };

  const getBestWorstValues = (key: keyof CustomerMetrics) => {
    if (comparisonData.length === 0) return { best: 0, worst: 0 };
    
    const values = comparisonData.map(d => d[key] as number);
    const best = Math.max(...values);
    const worst = Math.min(...values);
    
    return { best, worst };
  };

  const getColorByValue = (value: number, best: number, worst: number, higherIsBetter: boolean = true) => {
    if (best === worst) return colors.textSecondary;
    
    const ratio = (value - worst) / (best - worst);
    
    if (higherIsBetter) {
      if (ratio > 0.7) return '#22C55E';
      if (ratio > 0.4) return '#F59E0B';
      return '#EF4444';
    } else {
      if (ratio < 0.3) return '#22C55E';
      if (ratio < 0.7) return '#F59E0B';
      return '#EF4444';
    }
  };

  const getReliabilityLabel = (reliability: number) => {
    if (reliability >= 80) return 'نایاب';
    if (reliability >= 60) return 'باش';
    if (reliability >= 40) return 'مامناوەند';
    if (reliability >= 20) return 'لاواز';
    return 'زۆر لاواز';
  };

  const availableDebtors = debtors.filter(d => !selectedDebtors.includes(d.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'بەراوردکردنی کڕیاران',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.sectionHeader}>
              <Users size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                کڕیاری هەڵبژێردراو ({selectedDebtors.length}/4)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}
              onPress={() => setShowDebtorPicker(true)}
              disabled={selectedDebtors.length >= 4}
            >
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                + زیادکردنی کڕیار بۆ بەراوردکردن
              </Text>
            </TouchableOpacity>

            {selectedDebtors.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لانیکەم دوو کڕیار هەڵبژێرە بۆ بەراوردکردن
              </Text>
            )}

            <View style={styles.selectedDebторGrid}>
              {comparisonData.map((metrics) => (
                <View
                  key={metrics.debtor.id}
                  style={[styles.selectedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={1}>
                    {metrics.debtor.name}
                  </Text>
                  <Text style={[styles.selectedDebt, { color: colors.error }]}>
                    {metrics.debtor.totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDebtor(metrics.debtor.id)}
                  >
                    <Text style={[styles.removeButtonText, { color: colors.error }]}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {comparisonData.length >= 2 && (
            <>
              <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.sectionHeader}>
                  <Award size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>پلەبەندی متمانەپێکراوی</Text>
                </View>

                {comparisonData
                  .sort((a, b) => b.reliability - a.reliability)
                  .map((metrics, index) => (
                    <View
                      key={metrics.debtor.id}
                      style={[styles.rankCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    >
                      <View style={styles.rankHeader}>
                        <View style={[
                          styles.rankBadge,
                          { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }
                        ]}>
                          <Text style={styles.rankNumber}>{index + 1}</Text>
                        </View>
                        <Text style={[styles.rankName, { color: colors.text }]}>{metrics.debtor.name}</Text>
                      </View>
                      <View style={styles.reliabilityBar}>
                        <View 
                          style={[
                            styles.reliabilityFill,
                            { 
                              width: `${metrics.reliability}%`,
                              backgroundColor: metrics.reliability >= 60 ? '#22C55E' : 
                                              metrics.reliability >= 40 ? '#F59E0B' : '#EF4444'
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.reliabilityText, { color: colors.textSecondary }]}>
                        {metrics.reliability.toFixed(0)}% - {getReliabilityLabel(metrics.reliability)}
                      </Text>
                    </View>
                  ))}
              </View>

              <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.sectionHeader}>
                  <DollarSign size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>تێچووی مامەڵەکان</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.comparisonTable}>
                    <View style={styles.tableHeader}>
                      <View style={styles.tableCell}>
                        <Text style={[styles.tableCellText, { color: colors.textSecondary }]}>ناو</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text style={[styles.tableCellText, { color: colors.textSecondary }]}>تێکڕای قەرز</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text style={[styles.tableCellText, { color: colors.textSecondary }]}>تێکڕای پارەدان</Text>
                      </View>
                      <View style={styles.tableCell}>
                        <Text style={[styles.tableCellText, { color: colors.textSecondary }]}>ڕێژەی پارەدان</Text>
                      </View>
                    </View>

                    {comparisonData.map((metrics) => {
                      const paymentRatioRange = getBestWorstValues('debtToPaymentRatio');
                      
                      return (
                        <View key={metrics.debtor.id} style={styles.tableRow}>
                          <View style={styles.tableCell}>
                            <Text style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
                              {metrics.debtor.name}
                            </Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={[styles.tableCellText, { color: colors.error }]}>
                              {metrics.avgDebtAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={[styles.tableCellText, { color: colors.success }]}>
                              {metrics.avgPaymentAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </Text>
                          </View>
                          <View style={styles.tableCell}>
                            <Text style={[
                              styles.tableCellText,
                              { 
                                color: getColorByValue(
                                  metrics.debtToPaymentRatio,
                                  paymentRatioRange.best,
                                  paymentRatioRange.worst,
                                  true
                                )
                              }
                            ]}>
                              {metrics.debtToPaymentRatio.toFixed(0)}%
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.sectionHeader}>
                  <Clock size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>کات و چالاکی</Text>
                </View>

                {comparisonData.map((metrics) => {
                  const daysRange = getBestWorstValues('daysSinceLastActivity');
                  
                  return (
                    <View
                      key={metrics.debtor.id}
                      style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                    >
                      <Text style={[styles.activityName, { color: colors.text }]}>
                        {metrics.debtor.name}
                      </Text>
                      
                      <View style={styles.activityGrid}>
                        <View style={styles.activityItem}>
                          <Calendar size={16} color={colors.textSecondary} />
                          <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>
                            کۆتا چالاکی
                          </Text>
                          <Text style={[
                            styles.activityValue,
                            {
                              color: getColorByValue(
                                metrics.daysSinceLastActivity,
                                daysRange.best,
                                daysRange.worst,
                                false
                              )
                            }
                          ]}>
                            {metrics.daysSinceLastActivity} ڕۆژ پێش ئێستا
                          </Text>
                        </View>

                        <View style={styles.activityItem}>
                          <Target size={16} color={colors.textSecondary} />
                          <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>
                            تێکڕای ڕۆژ نێوان پارەدانەکان
                          </Text>
                          <Text style={[styles.activityValue, { color: colors.primary }]}>
                            {metrics.avgDaysBetweenPayments > 0 
                              ? `${metrics.avgDaysBetweenPayments.toFixed(0)} ڕۆژ`
                              : 'زانیاری بەردەست نییە'}
                          </Text>
                        </View>

                        <View style={styles.activityItem}>
                          <TrendingUp size={16} color={colors.textSecondary} />
                          <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>
                            ژمارەی پارەدانەکان
                          </Text>
                          <Text style={[styles.activityValue, { color: colors.success }]}>
                            {metrics.paymentFrequency} مامەڵە
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={[styles.section, { backgroundColor: colors.errorGlass, borderColor: colors.error }]}>
                <View style={styles.sectionHeader}>
                  <AlertTriangle size={20} color={colors.error} />
                  <Text style={[styles.sectionTitle, { color: colors.error }]}>هۆشیاریەکان</Text>
                </View>

                {comparisonData.map((metrics) => {
                  const warnings: string[] = [];
                  
                  if (metrics.daysSinceLastActivity > 30) {
                    warnings.push(`${metrics.daysSinceLastActivity} ڕۆژە چالاکی نییە`);
                  }
                  if (metrics.debtToPaymentRatio < 50) {
                    warnings.push('پارەدان کەمترە لە نیوەی قەرزەکە');
                  }
                  if (metrics.debtor.totalDebt > (metrics.debtor.debtLimit || Infinity)) {
                    warnings.push('تێپەڕیوە لە سنووری قەرز');
                  }
                  if (metrics.reliability < 40) {
                    warnings.push('متمانەپێکراوی نزمە');
                  }

                  if (warnings.length === 0) return null;

                  return (
                    <View
                      key={metrics.debtor.id}
                      style={[styles.warningCard, { backgroundColor: colors.card }]}
                    >
                      <Text style={[styles.warningName, { color: colors.text }]}>
                        {metrics.debtor.name}
                      </Text>
                      {warnings.map((warning, index) => (
                        <View key={index} style={styles.warningItem}>
                          <Text style={[styles.warningDot, { color: colors.error }]}>•</Text>
                          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                            {warning}
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        <Modal
          visible={showDebtorPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDebtorPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>هەڵبژاردنی کڕیار</Text>
                <TouchableOpacity onPress={() => setShowDebtorPicker(false)}>
                  <Text style={[styles.modalClose, { color: colors.textSecondary }]}>×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {availableDebtors.map((debtor) => (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[styles.debtorItem, { borderColor: colors.cardBorder }]}
                    onPress={() => addDebtor(debtor.id)}
                  >
                    <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                    <Text style={[styles.debtorDebt, { color: colors.error }]}>
                      {debtor.totalDebt.toLocaleString('en-US')} IQD
                    </Text>
                  </TouchableOpacity>
                ))}
                {availableDebtors.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center', marginTop: 20 }]}>
                    هەموو کڕیارەکان زیادکراون
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  addButton: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  selectedDebторGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  selectedCard: {
    width: (width - 72) / 2,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    position: 'relative' as const,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  selectedDebt: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  removeButton: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  rankCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  rankHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  reliabilityBar: {
    height: 8,
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  reliabilityFill: {
    height: '100%',
    borderRadius: 4,
  },
  reliabilityText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  comparisonTable: {
    minWidth: width - 40,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(100, 100, 100, 0.2)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 100, 100, 0.1)',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  tableCellText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  activityCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  activityGrid: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  activityLabel: {
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  activityValue: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  warningCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningName: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  warningItem: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  warningDot: {
    fontSize: 16,
  },
  warningText: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalClose: {
    fontSize: 32,
  },
  modalList: {
    padding: 20,
  },
  debtorItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  debtorDebt: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
