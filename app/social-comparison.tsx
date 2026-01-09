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
  Award,
  TrendingUp,
  Users,
  Trophy,
  Medal,
  Target,
} from 'lucide-react-native';

export default function SocialComparisonScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();

  const rankings = useMemo(() => {
    const activeDebtors = debtors.filter(d => d.totalDebt > 0);
    
    const bestPayers = [...debtors]
      .filter(d => d.transactions.some(t => t.type === 'payment'))
      .map(d => {
        const totalPaid = d.transactions
          .filter(t => t.type === 'payment')
          .reduce((sum, t) => sum + t.amount, 0);
        return { ...d, totalPaid };
      })
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);

    const mostConsistent = [...debtors]
      .filter(d => d.transactions.length > 0)
      .map(d => {
        const payments = d.transactions.filter(t => t.type === 'payment');
        return { 
          ...d, 
          paymentCount: payments.length,
          avgPayment: payments.length > 0 
            ? payments.reduce((sum, t) => sum + t.amount, 0) / payments.length 
            : 0 
        };
      })
      .sort((a, b) => b.paymentCount - a.paymentCount)
      .slice(0, 5);

    const lowestDebt = [...activeDebtors]
      .sort((a, b) => a.totalDebt - b.totalDebt)
      .slice(0, 5);

    return {
      bestPayers,
      mostConsistent,
      lowestDebt,
    };
  }, [debtors]);

  const stats = useMemo(() => {
    const totalDebtors = debtors.length;
    const activeDebtors = debtors.filter(d => d.totalDebt > 0).length;
    const totalPayments = debtors.reduce((sum, d) => 
      sum + d.transactions.filter(t => t.type === 'payment').length, 0
    );

    return {
      totalDebtors,
      activeDebtors,
      totalPayments,
    };
  }, [debtors]);

  const renderRankingCard = (title: string, icon: any, items: any[], getValue: (item: any) => string, getSubtitle: (item: any) => string) => (
    <View style={[styles.rankingCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
      <View style={styles.rankingHeader}>
        {icon}
        <Text style={[styles.rankingTitle, { color: colors.text }]}>{title}</Text>
      </View>
      
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            هێشتا زانیاری نییە
          </Text>
        </View>
      ) : (
        items.map((item, index) => (
          <View 
            key={item.id} 
            style={[
              styles.rankingItem,
              { borderColor: colors.glassBorder },
              index === items.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
            <View style={styles.rankingLeft}>
              <View style={[
                styles.rankBadge,
                { 
                  backgroundColor: index === 0 ? '#FCD34D' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.primaryGlass 
                }
              ]}>
                <Text style={[styles.rankNumber, { 
                  color: index < 3 ? '#000' : colors.primary 
                }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.debtorInfo}>
                <Text style={[styles.debtorName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.debtorSubtitle, { color: colors.textSecondary }]}>
                  {getSubtitle(item)}
                </Text>
              </View>
            </View>
            <Text style={[styles.rankValue, { color: colors.primary }]}>
              {getValue(item)}
            </Text>
          </View>
        ))
      )}
    </View>
  );

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
            <Text style={[styles.title, { color: colors.text }]}>بەراوردی کۆمەڵایەتی</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.statsCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Users size={24} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalDebtors}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی قەرزداران</Text>
              </View>
              <View style={styles.statItem}>
                <TrendingUp size={24} color={colors.error} />
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.activeDebtors}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>چالاک</Text>
              </View>
              <View style={styles.statItem}>
                <Target size={24} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalPayments}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>پارەدانەوە</Text>
              </View>
            </View>
          </View>

          {renderRankingCard(
            'باشترین پارەدەرەوەکان',
            <Trophy size={24} color={colors.warning} />,
            rankings.bestPayers,
            (item) => item.totalPaid.toLocaleString('en-US'),
            (item) => `${item.transactions.filter((t: any) => t.type === 'payment').length} پارەدانەوە`
          )}

          {renderRankingCard(
            'بەردەوامترینەکان',
            <Medal size={24} color={colors.primary} />,
            rankings.mostConsistent,
            (item) => `${item.paymentCount} جار`,
            (item) => `نێوانە: ${item.avgPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
          )}

          {renderRankingCard(
            'کەمترین قەرز',
            <Award size={24} color={colors.success} />,
            rankings.lowestDebt,
            (item) => item.totalDebt.toLocaleString('en-US'),
            (item) => `${item.transactions.length} مامەڵە`
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
  statsCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
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
  rankingCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  rankingHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  rankingItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rankingLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  debtorInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  debtorSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rankValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});
