import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, TrendingDown, AlertTriangle, CheckCircle, Brain, Target, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DebtorAnalysis {
  debtorId: string;
  debtorName: string;
  riskScore: number;
  paymentReliability: number;
  avgPaymentTime: number;
  missedPayments: number;
  totalTransactions: number;
  predictedPaymentDate?: Date;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function AIDebtAnalysis() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);



  const allAnalyses = useMemo(() => {
    const analyze = (debtorId: string): DebtorAnalysis => {
      const debtor = debtors.find(d => d.id === debtorId);
      if (!debtor) {
        return {
          debtorId,
          debtorName: '',
          riskScore: 0,
          paymentReliability: 0,
          avgPaymentTime: 0,
          missedPayments: 0,
          totalTransactions: 0,
          recommendation: '',
          riskLevel: 'low',
        };
      }

      const transactions = debtor.transactions || [];
      const totalTransactions = transactions.length;
      
      const debts = transactions.filter(t => t.type === 'debt');
      const payments = transactions.filter(t => t.type === 'payment');
      
      const totalDebt = debts.reduce((sum, t) => sum + t.amount, 0);
      const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0);
      
      let paymentReliability = 0;
      if (totalDebt > 0) {
        paymentReliability = Math.min((totalPaid / totalDebt) * 100, 100);
      }
      
      const paymentTimes: number[] = [];
      debts.forEach(debt => {
        const debtDate = new Date(debt.date);
        const relatedPayments = payments.filter(p => 
          new Date(p.date) > debtDate
        );
        if (relatedPayments.length > 0) {
          const firstPayment = relatedPayments[0];
          const daysDiff = Math.floor(
            (new Date(firstPayment.date).getTime() - debtDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          paymentTimes.push(daysDiff);
        }
      });
      
      const avgPaymentTime = paymentTimes.length > 0
        ? paymentTimes.reduce((sum, t) => sum + t, 0) / paymentTimes.length
        : 0;
      
      const missedPayments = debts.length - payments.length;
      
      let riskScore = 0;
      
      if (debtor.totalDebt > 0) {
        riskScore += 20;
        if (debtor.totalDebt > 1000000) riskScore += 20;
        if (debtor.totalDebt > 5000000) riskScore += 20;
      }
      
      if (paymentReliability < 50) riskScore += 20;
      else if (paymentReliability < 75) riskScore += 10;
      
      if (avgPaymentTime > 30) riskScore += 15;
      else if (avgPaymentTime > 14) riskScore += 10;
      
      if (missedPayments > 0) {
        riskScore += Math.min(missedPayments * 5, 25);
      }
      
      const dueDate = debtor.dueDate ? new Date(debtor.dueDate) : null;
      if (dueDate) {
        const daysUntilDue = Math.floor(
          (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue < 0) riskScore += 20;
        else if (daysUntilDue < 7) riskScore += 10;
      }
      
      riskScore = Math.min(riskScore, 100);
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore >= 75) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 25) riskLevel = 'medium';
      
      let recommendation = '';
      if (riskLevel === 'critical') {
        recommendation = 'مەترسی زۆر بەرز! پێویستە یەکسەر پەیوەندی بکەیت و پلانێکی تایبەت دابنێیت.';
      } else if (riskLevel === 'high') {
        recommendation = 'مەترسی بەرز. پێشنیار دەکرێت پەیوەندی نزیکتر بکەیت و یادەوەری بنێریت.';
      } else if (riskLevel === 'medium') {
        recommendation = 'مەترسی مامناوەند. بەدواداچوونی ئاسایی بەردەوام بە.';
      } else {
        recommendation = 'قەرزدارێکی باشە! بەردەوام بە لە بەدواداچوون.';
      }
      
      let predictedPaymentDate: Date | undefined;
      if (avgPaymentTime > 0 && debtor.totalDebt > 0) {
        predictedPaymentDate = new Date();
        predictedPaymentDate.setDate(predictedPaymentDate.getDate() + Math.round(avgPaymentTime));
      }

      return {
        debtorId: debtor.id,
        debtorName: debtor.name,
        riskScore: Math.round(riskScore),
        paymentReliability: Math.round(paymentReliability),
        avgPaymentTime: Math.round(avgPaymentTime),
        missedPayments,
        totalTransactions,
        predictedPaymentDate,
        recommendation,
        riskLevel,
      };
    };

    return debtors
      .filter(d => d.totalDebt > 0)
      .map(d => analyze(d.id))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [debtors]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return colors.textSecondary;
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return AlertTriangle;
      case 'high': return TrendingDown;
      case 'medium': return Target;
      case 'low': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical': return 'مەترسی زۆر بەرز';
      case 'high': return 'مەترسی بەرز';
      case 'medium': return 'مەترسی مامناوەند';
      case 'low': return 'مەترسی کەم';
      default: return '';
    }
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Brain size={28} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              شیکاری زیرەکانە
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {allAnalyses.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  کۆی قەرزداران
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#DC2626' }]}>
                  {allAnalyses.filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  مەترسی بەرز
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  {allAnalyses.filter(a => a.riskLevel === 'low').length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  مەترسی کەم
                </Text>
              </View>
            </View>
          </View>

          {allAnalyses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Brain size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ قەرزدارێک نییە بۆ شیکردنەوە
              </Text>
            </View>
          ) : (
            <>
              {allAnalyses.map((analysis, index) => {
                const RiskIcon = getRiskIcon(analysis.riskLevel);
                const riskColor = getRiskColor(analysis.riskLevel);
                const isSelected = selectedDebtor === analysis.debtorId;

                return (
                  <TouchableOpacity
                    key={analysis.debtorId}
                    style={[
                      styles.analysisCard,
                      { 
                        backgroundColor: colors.card,
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                        borderWidth: isSelected ? 2 : 1,
                      }
                    ]}
                    onPress={() => setSelectedDebtor(isSelected ? null : analysis.debtorId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.debtorInfo}>
                        <Text style={[styles.debtorName, { color: colors.text }]}>
                          {index + 1}. {analysis.debtorName}
                        </Text>
                        <View style={[styles.riskBadge, { backgroundColor: riskColor + '20', borderColor: riskColor }]}>
                          <RiskIcon size={14} color={riskColor} />
                          <Text style={[styles.riskText, { color: riskColor }]}>
                            {getRiskLabel(analysis.riskLevel)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.scoreCircle}>
                        <Text style={[styles.scoreValue, { color: riskColor }]}>
                          {analysis.riskScore}
                        </Text>
                        <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                          خاڵ
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                              مۆتمانەی پارەدان
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {analysis.paymentReliability}%
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                              ناوەندی کات
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {analysis.avgPaymentTime} ڕۆژ
                            </Text>
                          </View>
                        </View>

                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                              پارەدانی ونبوو
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.error }]}>
                              {analysis.missedPayments}
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                              کۆی مامەڵە
                            </Text>
                            <Text style={[styles.detailValue, { color: colors.text }]}>
                              {analysis.totalTransactions}
                            </Text>
                          </View>
                        </View>

                        {analysis.predictedPaymentDate && (
                          <View style={[styles.predictionCard, { backgroundColor: colors.primaryGlass }]}>
                            <Calendar size={20} color={colors.primary} />
                            <Text style={[styles.predictionText, { color: colors.primary }]}>
                              پێشبینی پارەدانی داهاتوو: {analysis.predictedPaymentDate.toLocaleDateString('ku')}
                            </Text>
                          </View>
                        )}

                        <View style={[styles.recommendationCard, { backgroundColor: riskColor + '15', borderColor: riskColor }]}>
                          <Text style={[styles.recommendationText, { color: riskColor }]}>
                            {analysis.recommendation}
                          </Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  analysisCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  debtorInfo: {
    flex: 1,
    gap: 12,
  },
  debtorName: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  riskBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  scoreCircle: {
    alignItems: 'center',
    gap: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  scoreLabel: {
    fontSize: 12,
  },
  detailsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  predictionCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  predictionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right',
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'right',
    lineHeight: 22,
  },
});
