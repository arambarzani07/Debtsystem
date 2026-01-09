import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, TrendingUp, Clock, DollarSign, Zap, Target, ArrowRight } from 'lucide-react-native';

type Priority = 'urgent' | 'high' | 'medium' | 'low';

interface TriageItem {
  debtorId: string;
  debtorName: string;
  priority: Priority;
  score: number;
  factors: {
    amount: number;
    overdue: number;
    interest: number;
    history: number;
  };
  recommendedAction: string;
  recommendedActionKu: string;
  estimatedImpact: number;
}

export default function SmartDebtTriageScreen() {
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const { settings } = useTheme();
  const isDarkMode = settings.theme === 'dark';

  const triageList = useMemo((): TriageItem[] => {
    const now = new Date();
    
    return debtors
      .filter(d => d.totalDebt > 0)
      .map(debtor => {
        const amountScore = Math.min(100, (debtor.totalDebt / 10000) * 50);
        
        let overdueScore = 0;
        if (debtor.dueDate) {
          const dueDate = new Date(debtor.dueDate);
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysOverdue > 0) {
            overdueScore = Math.min(100, daysOverdue * 5);
          }
        }

        const interestScore = debtor.interestRate ? Math.min(100, debtor.interestRate * 5) : 0;

        const payments = debtor.transactions.filter(t => t.type === 'payment');
        const recentPayments = payments.filter(p => {
          const paymentDate = new Date(p.date);
          const daysSince = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSince <= 30;
        });
        const historyScore = payments.length > 0 
          ? 100 - Math.min(100, (recentPayments.length / payments.length) * 100)
          : 50;

        const totalScore = (
          amountScore * 0.3 +
          overdueScore * 0.4 +
          interestScore * 0.2 +
          historyScore * 0.1
        );

        let priority: Priority;
        let recommendedAction: string;
        let recommendedActionKu: string;
        let estimatedImpact: number;

        if (totalScore >= 75) {
          priority = 'urgent';
          recommendedAction = 'Contact immediately - High risk';
          recommendedActionKu = 'پەیوەندی یەکسەر بکە - مەترسی بەرز';
          estimatedImpact = 95;
        } else if (totalScore >= 50) {
          priority = 'high';
          recommendedAction = 'Schedule follow-up within 3 days';
          recommendedActionKu = 'شوێنکەوتنەوە لە ماوەی ٣ ڕۆژدا';
          estimatedImpact = 75;
        } else if (totalScore >= 25) {
          priority = 'medium';
          recommendedAction = 'Send reminder this week';
          recommendedActionKu = 'یادەوەری بنێرە ئەم حەفتەیە';
          estimatedImpact = 50;
        } else {
          priority = 'low';
          recommendedAction = 'Monitor - No immediate action needed';
          recommendedActionKu = 'چاودێری - پێویست بە کاری خێرا نییە';
          estimatedImpact = 25;
        }

        return {
          debtorId: debtor.id,
          debtorName: debtor.name,
          priority,
          score: Math.round(totalScore),
          factors: {
            amount: Math.round(amountScore),
            overdue: Math.round(overdueScore),
            interest: Math.round(interestScore),
            history: Math.round(historyScore),
          },
          recommendedAction,
          recommendedActionKu,
          estimatedImpact,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [debtors]);

  const urgentCount = triageList.filter(t => t.priority === 'urgent').length;
  const highCount = triageList.filter(t => t.priority === 'high').length;

  const bgColor = isDarkMode ? '#1F2937' : '#F9FAFB';
  const cardBg = isDarkMode ? '#374151' : '#FFFFFF';
  const textColor = isDarkMode ? '#F9FAFB' : '#111827';
  const secondaryText = isDarkMode ? '#D1D5DB' : '#6B7280';

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
    }
  };

  const getPriorityLabel = (priority: Priority): string => {
    if (language === 'ku') {
      switch (priority) {
        case 'urgent': return 'بە پەلە';
        case 'high': return 'بەرز';
        case 'medium': return 'مامناوەند';
        case 'low': return 'نزم';
      }
    }
    return priority.toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen 
        options={{
          title: language === 'ku' ? 'پێشەنگی زیرەک' : 'Smart Debt Triage',
          headerStyle: { backgroundColor: cardBg },
          headerTintColor: textColor,
        }}
      />
      
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#DC2626', '#EF4444']}
          style={styles.headerCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Zap size={48} color="#FFF" />
          <Text style={styles.headerTitle}>
            {language === 'ku' ? 'پێشەنگی زیرەک' : 'AI-Powered Triage'}
          </Text>
          <View style={styles.alertStats}>
            <View style={styles.alertBox}>
              <AlertTriangle size={24} color="#FFF" />
              <Text style={styles.alertNumber}>{urgentCount}</Text>
              <Text style={styles.alertLabel}>
                {language === 'ku' ? 'بە پەلە' : 'Urgent'}
              </Text>
            </View>
            <View style={styles.alertBox}>
              <TrendingUp size={24} color="#FFF" />
              <Text style={styles.alertNumber}>{highCount}</Text>
              <Text style={styles.alertLabel}>
                {language === 'ku' ? 'بەرز' : 'High'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {language === 'ku' ? 'پێشەنگی پێویست' : 'Priority Queue'}
          </Text>

          {triageList.length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
              <Target size={48} color={secondaryText} />
              <Text style={[styles.emptyText, { color: secondaryText }]}>
                {language === 'ku' 
                  ? 'هیچ قەرزێک نییە بۆ پێشەنگی' 
                  : 'No debts to prioritize'}
              </Text>
            </View>
          )}

          {triageList.map((item, index) => (
            <TouchableOpacity
              key={item.debtorId}
              style={[styles.triageCard, { backgroundColor: cardBg }]}
              onPress={() => router.push(`/debtor/${item.debtorId}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
                  <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                    #{index + 1}
                  </Text>
                </View>
                
                <View style={styles.cardInfo}>
                  <Text style={[styles.debtorName, { color: textColor }]}>
                    {item.debtorName}
                  </Text>
                  <Text style={[styles.priorityLabel, { color: getPriorityColor(item.priority) }]}>
                    {getPriorityLabel(item.priority)} • {language === 'ku' ? 'نمرە' : 'Score'} {item.score}
                  </Text>
                </View>

                <ArrowRight size={20} color={secondaryText} />
              </View>

              <View style={styles.factorsGrid}>
                <View style={styles.factorItem}>
                  <DollarSign size={16} color="#3B82F6" />
                  <Text style={[styles.factorText, { color: secondaryText }]}>
                    {item.factors.amount}%
                  </Text>
                </View>
                <View style={styles.factorItem}>
                  <Clock size={16} color="#F59E0B" />
                  <Text style={[styles.factorText, { color: secondaryText }]}>
                    {item.factors.overdue}%
                  </Text>
                </View>
                <View style={styles.factorItem}>
                  <TrendingUp size={16} color="#EF4444" />
                  <Text style={[styles.factorText, { color: secondaryText }]}>
                    {item.factors.interest}%
                  </Text>
                </View>
                <View style={styles.factorItem}>
                  <Target size={16} color="#8B5CF6" />
                  <Text style={[styles.factorText, { color: secondaryText }]}>
                    {item.factors.history}%
                  </Text>
                </View>
              </View>

              <View style={[styles.actionBox, { backgroundColor: getPriorityColor(item.priority) + '10' }]}>
                <Text style={[styles.actionText, { color: textColor }]}>
                  {language === 'ku' ? item.recommendedActionKu : item.recommendedAction}
                </Text>
                <View style={styles.impactBar}>
                  <View style={[styles.impactFill, { 
                    width: `${item.estimatedImpact}%`,
                    backgroundColor: getPriorityColor(item.priority) 
                  }]} />
                </View>
                <Text style={[styles.impactText, { color: secondaryText }]}>
                  {language === 'ku' ? 'کاریگەری' : 'Impact'}: {item.estimatedImpact}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.legendCard, { backgroundColor: cardBg }]}>
          <Text style={[styles.legendTitle, { color: textColor }]}>
            {language === 'ku' ? 'هۆکارەکانی پێشەنگی' : 'Priority Factors'}
          </Text>
          <View style={styles.legendItem}>
            <DollarSign size={20} color="#3B82F6" />
            <Text style={[styles.legendText, { color: secondaryText }]}>
              {language === 'ku' ? 'بڕی قەرز' : 'Debt Amount'} (30%)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <Clock size={20} color="#F59E0B" />
            <Text style={[styles.legendText, { color: secondaryText }]}>
              {language === 'ku' ? 'ڕۆژی دواکەوتوو' : 'Days Overdue'} (40%)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <TrendingUp size={20} color="#EF4444" />
            <Text style={[styles.legendText, { color: secondaryText }]}>
              {language === 'ku' ? 'ڕێژەی سوو' : 'Interest Rate'} (20%)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <Target size={20} color="#8B5CF6" />
            <Text style={[styles.legendText, { color: secondaryText }]}>
              {language === 'ku' ? 'مێژووی پارەدان' : 'Payment History'} (10%)
            </Text>
          </View>
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
  headerCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#FFF',
    marginTop: 16,
    marginBottom: 24,
  },
  alertStats: {
    flexDirection: 'row',
    gap: 32,
  },
  alertBox: {
    alignItems: 'center',
  },
  alertNumber: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFF',
    marginTop: 8,
  },
  alertLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  triageCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priorityText: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  cardInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  factorsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  factorItem: {
    alignItems: 'center',
  },
  factorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600' as const,
  },
  actionBox: {
    padding: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  impactBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  impactFill: {
    height: '100%',
    borderRadius: 3,
  },
  impactText: {
    fontSize: 12,
  },
  legendCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendText: {
    fontSize: 14,
    marginLeft: 12,
  },
});
