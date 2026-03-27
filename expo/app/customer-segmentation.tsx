import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Users2, User, DollarSign, TrendingUp, TrendingDown } from 'lucide-react-native';

type SegmentType = 'all' | 'high-debt' | 'low-debt' | 'no-debt' | 'active' | 'inactive';

export default function CustomerSegmentationScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>('all');

  const segments = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const highDebt = debtors.filter(d => d.totalDebt > 1000000);
    const lowDebt = debtors.filter(d => d.totalDebt > 0 && d.totalDebt <= 1000000);
    const noDebt = debtors.filter(d => d.totalDebt === 0);
    
    const active = debtors.filter(d => {
      const lastTransaction = d.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      return lastTransaction && new Date(lastTransaction.date) >= thirtyDaysAgo;
    });
    
    const inactive = debtors.filter(d => {
      const lastTransaction = d.transactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      return !lastTransaction || new Date(lastTransaction.date) < thirtyDaysAgo;
    });

    return {
      all: { list: debtors, totalDebt: debtors.reduce((sum, d) => sum + d.totalDebt, 0) },
      'high-debt': { list: highDebt, totalDebt: highDebt.reduce((sum, d) => sum + d.totalDebt, 0) },
      'low-debt': { list: lowDebt, totalDebt: lowDebt.reduce((sum, d) => sum + d.totalDebt, 0) },
      'no-debt': { list: noDebt, totalDebt: 0 },
      active: { list: active, totalDebt: active.reduce((sum, d) => sum + d.totalDebt, 0) },
      inactive: { list: inactive, totalDebt: inactive.reduce((sum, d) => sum + d.totalDebt, 0) },
    };
  }, [debtors]);

  const currentSegment = segments[selectedSegment];

  const segmentOptions = [
    { key: 'all' as const, label: 'هەموو', color: colors.primary, icon: Users2 },
    { key: 'high-debt' as const, label: 'قەرزی زۆر', color: colors.error, icon: TrendingUp },
    { key: 'low-debt' as const, label: 'قەرزی کەم', color: colors.warning, icon: TrendingDown },
    { key: 'no-debt' as const, label: 'بێ قەرز', color: colors.success, icon: DollarSign },
    { key: 'active' as const, label: 'چالاک', color: '#10B981', icon: Users2 },
    { key: 'inactive' as const, label: 'ناچالاک', color: '#6B7280', icon: Users2 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>دابەشکردنی کڕیاران</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.segmentGrid}>
            {segmentOptions.map(option => {
              const Icon = option.icon;
              const segment = segments[option.key];
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.segmentCard,
                    { 
                      backgroundColor: colors.cardGlass, 
                      borderColor: selectedSegment === option.key ? option.color : colors.glassBorder,
                      borderWidth: selectedSegment === option.key ? 2 : 1,
                    }
                  ]}
                  onPress={() => setSelectedSegment(option.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.segmentIcon, { backgroundColor: `${option.color}20` }]}>
                    <Icon size={24} color={option.color} />
                  </View>
                  <Text style={[styles.segmentLabel, { color: colors.textSecondary }]}>{option.label}</Text>
                  <Text style={[styles.segmentCount, { color: colors.text }]}>{segment.list.length}</Text>
                  {option.key !== 'no-debt' && (
                    <Text style={[styles.segmentAmount, { color: option.color }]}>
                      {segment.totalDebt.toLocaleString('en-US')}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {segmentOptions.find(s => s.key === selectedSegment)?.label}
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>ژمارەی کڕیاران</Text>
                <Text style={[styles.summaryStatValue, { color: colors.text }]}>
                  {currentSegment.list.length}
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>کۆی قەرز</Text>
                <Text style={[styles.summaryStatValue, { color: colors.error }]}>
                  {currentSegment.totalDebt.toLocaleString('en-US')}
                </Text>
              </View>
            </View>
          </View>

          {currentSegment.list.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Users2 size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>هیچ کڕیارێک نییە</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                لەم بەشەدا هیچ کڕیارێک نییە
              </Text>
            </View>
          ) : (
            currentSegment.list.map(debtor => (
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
                  <View style={styles.debtorStats}>
                    <Text style={[styles.debtorDebt, { color: debtor.totalDebt > 0 ? colors.error : colors.success }]}>
                      {debtor.totalDebt.toLocaleString('en-US')}
                    </Text>
                    <Text style={[styles.debtorTransactions, { color: colors.textSecondary }]}>
                      {debtor.transactions.length} مامەڵە
                    </Text>
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
  segmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  segmentCard: { 
    width: '48%', 
    borderRadius: 16, 
    padding: 16, 
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  segmentIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  segmentLabel: { fontSize: 13, marginBottom: 4, textAlign: 'center' },
  segmentCount: { fontSize: 24, fontWeight: '700' as const, marginBottom: 4 },
  segmentAmount: { fontSize: 12, fontWeight: '600' as const, textAlign: 'center' },
  summaryCard: { borderRadius: 16, borderWidth: 2, padding: 20, marginBottom: 20 },
  summaryTitle: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center', marginBottom: 16 },
  summaryStats: { flexDirection: 'row', gap: 16 },
  summaryStatItem: { flex: 1, alignItems: 'center' },
  summaryStatLabel: { fontSize: 13, marginBottom: 8, textAlign: 'center' },
  summaryStatValue: { fontSize: 20, fontWeight: '700' as const },
  emptyCard: { borderRadius: 20, borderWidth: 2, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  debtorCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12 },
  debtorHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  debtorInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 },
  debtorAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  debtorDetails: { flex: 1, alignItems: 'flex-end' },
  debtorName: { fontSize: 16, fontWeight: '600' as const, textAlign: 'right' },
  debtorPhone: { fontSize: 13, marginTop: 2, textAlign: 'right' },
  debtorStats: { alignItems: 'flex-start' },
  debtorDebt: { fontSize: 18, fontWeight: '700' as const, marginBottom: 4 },
  debtorTransactions: { fontSize: 12 },
});
