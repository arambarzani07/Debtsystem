import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, FileText, User, DollarSign, Calendar, AlertCircle } from 'lucide-react-native';

export default function DebtWriteoffManagementScreen() {
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();

  const writeoffCandidates = useMemo(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    return debtors
      .filter(d => {
        if (d.totalDebt === 0) return false;
        const lastTransaction = d.transactions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        return lastTransaction && new Date(lastTransaction.date) < oneYearAgo;
      })
      .map(debtor => {
        const lastTransaction = debtor.transactions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        const daysSinceLastActivity = Math.floor(
          (now.getTime() - new Date(lastTransaction.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return { ...debtor, daysSinceLastActivity };
      })
      .sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);
  }, [debtors]);

  const totalWriteoffAmount = writeoffCandidates.reduce((sum, d) => sum + d.totalDebt, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>نوسینەوەی قەرز</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.summaryCard, { backgroundColor: colors.errorGlass, borderColor: colors.error }]}>
            <FileText size={48} color={colors.error} />
            <Text style={[styles.summaryTitle, { color: colors.text }]}>قەرزی پێشنیازکراو بۆ نوسینەوە</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatValue, { color: colors.error }]}>{writeoffCandidates.length}</Text>
                <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>ژمارە</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={[styles.summaryStatValue, { color: colors.error }]}>
                  {totalWriteoffAmount.toLocaleString('en-US')}
                </Text>
                <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>کۆی بڕ</Text>
              </View>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.warningGlass, borderColor: colors.warning }]}>
            <AlertCircle size={24} color={colors.warning} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              قەرزەکانی خوارەوە زیاتر لە ١ ساڵە هیچ چالاکیەکیان تێدا نییە
            </Text>
          </View>

          {writeoffCandidates.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <FileText size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>هیچ قەرزێک نییە</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ قەرزێک بۆ نوسینەوە پێشنیاز نەکراوە
              </Text>
            </View>
          ) : (
            writeoffCandidates.map(debtor => (
              <TouchableOpacity
                key={debtor.id}
                style={[styles.debtorCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                onPress={() => router.push({ pathname: '/debtor/[id]', params: { id: debtor.id } } as any)}
                activeOpacity={0.7}
              >
                <View style={styles.debtorHeader}>
                  <View style={styles.debtorInfo}>
                    <View style={[styles.debtorAvatar, { backgroundColor: colors.errorGlass }]}>
                      <User size={20} color={colors.error} />
                    </View>
                    <View style={styles.debtorDetails}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                      {debtor.phone && (
                        <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>{debtor.phone}</Text>
                      )}
                    </View>
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
                      <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>دوا چالاکی:</Text>
                      <Text style={[styles.statItemValue, { color: colors.warning }]}>
                        {debtor.daysSinceLastActivity} ڕۆژ لەمەوبەر
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
  summaryCard: { borderRadius: 20, borderWidth: 2, padding: 32, alignItems: 'center', marginBottom: 16 },
  summaryTitle: { fontSize: 18, fontWeight: '700' as const, marginTop: 16, marginBottom: 16, textAlign: 'center' },
  summaryStats: { flexDirection: 'row', gap: 32 },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { fontSize: 24, fontWeight: '700' as const, marginBottom: 4 },
  summaryStatLabel: { fontSize: 13 },
  infoCard: { borderRadius: 16, borderWidth: 2, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 14, textAlign: 'right', lineHeight: 20 },
  emptyCard: { borderRadius: 20, borderWidth: 2, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  debtorCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12 },
  debtorHeader: { marginBottom: 12 },
  debtorInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  debtorAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  debtorDetails: { flex: 1, alignItems: 'flex-end' },
  debtorName: { fontSize: 16, fontWeight: '600' as const, textAlign: 'right' },
  debtorPhone: { fontSize: 13, marginTop: 2, textAlign: 'right' },
  debtorStats: { gap: 8 },
  statRow: { flexDirection: 'row-reverse' },
  statItem: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  statItemLabel: { fontSize: 13 },
  statItemValue: { fontSize: 15, fontWeight: '600' as const },
});
