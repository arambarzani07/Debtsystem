import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  PieChart,
  BarChart3,
} from 'lucide-react-native';

export default function AdvancedAnalyticsScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();

  const analytics = useMemo(() => {
    const totalDebtors = debtors.length;
    const activeDebtors = debtors.filter(d => d.totalDebt > 0).length;
    const paidOffDebtors = debtors.filter(d => d.totalDebt <= 0).length;
    
    const totalDebt = debtors.reduce((sum, d) => sum + Math.max(0, d.totalDebt), 0);
    const totalPaid = debtors.reduce((sum, d) => sum + Math.abs(Math.min(0, d.totalDebt)), 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    let monthlyDebt = 0;
    let monthlyPayment = 0;
    
    debtors.forEach(debtor => {
      debtor.transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate >= thisMonth) {
          if (t.type === 'debt') {
            monthlyDebt += t.amount;
          } else {
            monthlyPayment += t.amount;
          }
        }
      });
    });
    
    const averageDebt = activeDebtors > 0 ? totalDebt / activeDebtors : 0;
    const collectionRate = totalDebt > 0 ? (totalPaid / (totalDebt + totalPaid)) * 100 : 0;
    
    return {
      totalDebtors,
      activeDebtors,
      paidOffDebtors,
      totalDebt,
      totalPaid,
      monthlyDebt,
      monthlyPayment,
      averageDebt,
      collectionRate,
    };
  }, [debtors]);

  const quickFeatures = [
    {
      id: 'statistics',
      title: 'ئامارەکان',
      description: 'بینینی ئامارە گشتیەکان',
      icon: TrendingUp,
      color: '#3B82F6',
      route: '/statistics',
    },
    {
      id: 'comparison',
      title: 'بەراوردکردن',
      description: 'بەراوردی قەرزداران',
      icon: BarChart3,
      color: '#10B981',
      route: '/debt-comparison',
    },
    {
      id: 'heatmap',
      title: 'نەخشەی گەرمی',
      description: 'بینینی قەرزەکان بە شێوەی نەخشە',
      icon: PieChart,
      color: '#EF4444',
      route: '/debt-heatmap',
    },
    {
      id: 'insights',
      title: 'تێگەیشتنەکان',
      description: 'تێگەیشتنی قووڵ لەسەر قەرزداران',
      icon: Target,
      color: '#F59E0B',
      route: '/debtor-insights',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>شیکاری پێشکەوتوو</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>کورتەی گشتی</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: colors.primaryGlass }]}>
                <Users size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{analytics.totalDebtors}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی قەرزداران</Text>
              </View>
              
              <View style={[styles.statBox, { backgroundColor: colors.errorGlass }]}>
                <TrendingUp size={24} color={colors.error} />
                <Text style={[styles.statValue, { color: colors.text }]}>{analytics.activeDebtors}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>چالاک</Text>
              </View>
              
              <View style={[styles.statBox, { backgroundColor: colors.successGlass }]}>
                <TrendingDown size={24} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>{analytics.paidOffDebtors}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>تەواو دانەوە</Text>
              </View>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ئامارە داراییەکان</Text>
            
            <View style={styles.financeRow}>
              <View style={styles.financeItem}>
                <DollarSign size={20} color={colors.error} />
                <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>کۆی قەرز</Text>
                <Text style={[styles.financeValue, { color: colors.error }]}>
                  {analytics.totalDebt.toLocaleString('en-US')}
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />
              
              <View style={styles.financeItem}>
                <DollarSign size={20} color={colors.success} />
                <Text style={[styles.financeLabel, { color: colors.textSecondary }]}>کۆی پارەدانەوە</Text>
                <Text style={[styles.financeValue, { color: colors.success }]}>
                  {analytics.totalPaid.toLocaleString('en-US')}
                </Text>
              </View>
            </View>
            
            <View style={[styles.averageBox, { backgroundColor: colors.primaryGlass, marginTop: 16 }]}>
              <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>نێوانەی قەرز</Text>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {analytics.averageDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.monthlyHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>ئەم مانگە</Text>
            </View>
            
            <View style={styles.monthlyStats}>
              <View style={styles.monthlyItem}>
                <Text style={[styles.monthlyLabel, { color: colors.textSecondary }]}>قەرزی نوێ</Text>
                <Text style={[styles.monthlyValue, { color: colors.error }]}>
                  {analytics.monthlyDebt.toLocaleString('en-US')}
                </Text>
              </View>
              
              <View style={styles.monthlyItem}>
                <Text style={[styles.monthlyLabel, { color: colors.textSecondary }]}>پارەدانەوە</Text>
                <Text style={[styles.monthlyValue, { color: colors.success }]}>
                  {analytics.monthlyPayment.toLocaleString('en-US')}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>تایبەتمەندیە پێشکەوتووەکان</Text>
            
            {quickFeatures.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[styles.quickFeature, { borderColor: colors.glassBorder }]}
                onPress={() => router.push(feature.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <feature.icon size={24} color={feature.color} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
                <ChevronLeft size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  financeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  financeLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  financeValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  divider: {
    width: 1,
    height: 60,
    marginHorizontal: 12,
  },
  averageBox: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  averageLabel: {
    fontSize: 14,
  },
  averageValue: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  monthlyHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  monthlyStats: {
    flexDirection: 'row',
    gap: 16,
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  monthlyLabel: {
    fontSize: 13,
  },
  monthlyValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  quickFeature: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 4,
    alignItems: 'flex-end',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  featureDescription: {
    fontSize: 13,
  },
});
