import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Bell, User, Calendar, DollarSign } from 'lucide-react-native';

export default function OverduePaymentTrackerScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<'all' | '7days' | '30days' | '90days'>('all');

  const overdueDebtors = useMemo(() => {
    const now = new Date();
    return debtors
      .filter(d => d.totalDebt > 0)
      .map(debtor => {
        const lastPayment = debtor.transactions
          .filter(t => t.type === 'payment')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        const lastDebt = debtor.transactions
          .filter(t => t.type === 'debt')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        const referenceDate = lastPayment ? new Date(lastPayment.date) : (lastDebt ? new Date(lastDebt.date) : new Date(debtor.createdAt));
        const daysSinceLastPayment = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...debtor,
          daysSinceLastPayment,
          lastPaymentDate: lastPayment?.date,
        };
      })
      .filter(d => {
        if (selectedFilter === '7days') return d.daysSinceLastPayment >= 7;
        if (selectedFilter === '30days') return d.daysSinceLastPayment >= 30;
        if (selectedFilter === '90days') return d.daysSinceLastPayment >= 90;
        return true;
      })
      .sort((a, b) => b.daysSinceLastPayment - a.daysSinceLastPayment);
  }, [debtors, selectedFilter]);

  const stats = useMemo(() => {
    const totalOverdue = overdueDebtors.reduce((sum, d) => sum + d.totalDebt, 0);
    const over7Days = overdueDebtors.filter(d => d.daysSinceLastPayment >= 7).length;
    const over30Days = overdueDebtors.filter(d => d.daysSinceLastPayment >= 30).length;
    const over90Days = overdueDebtors.filter(d => d.daysSinceLastPayment >= 90).length;
    
    return { totalOverdue, over7Days, over30Days, over90Days };
  }, [overdueDebtors]);

  const getUrgencyColor = (days: number) => {
    if (days >= 90) return colors.error;
    if (days >= 30) return colors.warning;
    if (days >= 7) return '#F59E0B';
    return colors.textSecondary;
  };

  const getUrgencyLabel = (days: number) => {
    if (days >= 90) return 'زۆر گرنگ';
    if (days >= 30) return 'گرنگ';
    if (days >= 7) return 'ئاگاداری';
    return 'ئاسایی';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>شوێنکەوتنی دواکەوتوو</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{overdueDebtors.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی دواکەوتوو</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Text style={[styles.statValue, { color: colors.error }]}>{stats.totalOverdue.toLocaleString('en-US')}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی بڕ</Text>
            </View>
          </View>

          <View style={styles.filterContainer}>
            {[
              { key: 'all' as const, label: 'هەموو' },
              { key: '7days' as const, label: '+٧ ڕۆژ' },
              { key: '30days' as const, label: '+٣٠ ڕۆژ' },
              { key: '90days' as const, label: '+٩٠ ڕۆژ' },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  { borderColor: colors.cardBorder },
                  selectedFilter === filter.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                <Text style={[
                  styles.filterText,
                  { color: selectedFilter === filter.key ? '#FFFFFF' : colors.textSecondary },
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {overdueDebtors.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Bell size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>هیچ دواکەوتووێک نییە</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>هەموو کڕیارەکان پارەکانیان دابەزاندووە</Text>
            </View>
          ) : (
            overdueDebtors.map(debtor => (
              <TouchableOpacity
                key={debtor.id}
                style={[styles.debtorCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                onPress={() => router.push({ pathname: '/debtor/[id]', params: { id: debtor.id } } as any)}
                activeOpacity={0.7}
              >
                <View style={styles.debtorHeader}>
                  <View style={styles.debtorInfo}>
                    <View style={[styles.debtorAvatar, { backgroundColor: colors.primaryGlass }]}>
                      <User size={20} color={colors.primary} />
                    </View>
                    <View style={styles.debtorDetails}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                      {debtor.phone && (
                        <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>{debtor.phone}</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.urgencyBadge, { backgroundColor: `${getUrgencyColor(debtor.daysSinceLastPayment)}20` }]}>
                    <Text style={[styles.urgencyText, { color: getUrgencyColor(debtor.daysSinceLastPayment) }]}>
                      {getUrgencyLabel(debtor.daysSinceLastPayment)}
                    </Text>
                  </View>
                </View>

                <View style={styles.debtorStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <DollarSign size={16} color={colors.error} />
                      <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>قەرز:</Text>
                      <Text style={[styles.statItemValue, { color: colors.error }]}>
                        {debtor.totalDebt.toLocaleString('en-US')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Calendar size={16} color={colors.textSecondary} />
                      <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>ماوە:</Text>
                      <Text style={[styles.statItemValue, { color: getUrgencyColor(debtor.daysSinceLastPayment) }]}>
                        {debtor.daysSinceLastPayment} ڕۆژ
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
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
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 2, padding: 20, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' as const, marginBottom: 4 },
  statLabel: { fontSize: 13, textAlign: 'center' },
  filterContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  filterText: { fontSize: 13, fontWeight: '600' as const },
  emptyCard: { borderRadius: 20, borderWidth: 2, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  debtorCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12 },
  debtorHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  debtorInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 },
  debtorAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  debtorDetails: { flex: 1, alignItems: 'flex-end' },
  debtorName: { fontSize: 16, fontWeight: '600' as const, textAlign: 'right' },
  debtorPhone: { fontSize: 13, marginTop: 2, textAlign: 'right' },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  urgencyText: { fontSize: 12, fontWeight: '600' as const },
  debtorStats: { gap: 8 },
  statRow: { flexDirection: 'row-reverse' },
  statItem: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  statItemLabel: { fontSize: 13 },
  statItemValue: { fontSize: 15, fontWeight: '600' as const },
});
