import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Trophy, User, TrendingUp, DollarSign, Award } from 'lucide-react-native';

export default function EmployeePerformanceScreen() {
  const { colors } = useTheme();
  const { users } = useAuth();
  const { debtors } = useDebt();
  const router = useRouter();

  const employeeStats = useMemo(() => {
    const employees = users.filter(u => u.role === 'employee' || u.role === 'manager');
    
    return employees.map(employee => {
      const employeeDebtors = debtors.filter(d => d.userId === employee.id);
      const totalDebt = employeeDebtors.reduce((sum, d) => sum + d.totalDebt, 0);
      
      const totalCollected = employeeDebtors.reduce((sum, d) => {
        return sum + d.transactions
          .filter(t => t.type === 'payment' && t.createdBy?.userId === employee.id)
          .reduce((tSum, t) => tSum + t.amount, 0);
      }, 0);

      const totalDebtsAdded = employeeDebtors.reduce((sum, d) => {
        return sum + d.transactions
          .filter(t => t.type === 'debt' && t.createdBy?.userId === employee.id)
          .reduce((tSum, t) => tSum + t.amount, 0);
      }, 0);

      const collectionRate = totalDebtsAdded > 0 ? (totalCollected / totalDebtsAdded) * 100 : 0;

      return {
        ...employee,
        customerCount: employeeDebtors.length,
        totalDebt,
        totalCollected,
        totalDebtsAdded,
        collectionRate,
      };
    }).sort((a, b) => b.totalCollected - a.totalCollected);
  }, [users, debtors]);

  const topPerformer = employeeStats[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>کارایی کارمەندان</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {topPerformer && (
            <View style={[styles.topPerformerCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <Award size={48} color={colors.warning} />
              <Text style={[styles.topPerformerTitle, { color: colors.text }]}>باشترین کارمەند</Text>
              <View style={[styles.topPerformerAvatar, { backgroundColor: colors.primaryGlass }]}>
                <User size={32} color={colors.primary} />
              </View>
              <Text style={[styles.topPerformerName, { color: colors.text }]}>{topPerformer.fullName || topPerformer.username}</Text>
              <View style={styles.topPerformerStats}>
                <View style={styles.topPerformerStat}>
                  <Text style={[styles.topPerformerStatValue, { color: colors.success }]}>
                    {topPerformer.totalCollected.toLocaleString('en-US')}
                  </Text>
                  <Text style={[styles.topPerformerStatLabel, { color: colors.textSecondary }]}>پارە کۆکراوەتەوە</Text>
                </View>
              </View>
            </View>
          )}

          {employeeStats.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Trophy size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>هیچ کارمەندێک نییە</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                کارمەندان لە بەشی بەڕێوەبردنی کارمەندان زیاد بکە
              </Text>
            </View>
          ) : (
            employeeStats.map((employee, index) => (
              <View 
                key={employee.id}
                style={[styles.employeeCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
              >
                <View style={styles.employeeHeader}>
                  <View style={styles.employeeInfo}>
                    <View style={[styles.rankBadge, { 
                      backgroundColor: index === 0 ? colors.warning : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : colors.textTertiary 
                    }]}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={[styles.employeeAvatar, { backgroundColor: colors.primaryGlass }]}>
                      <User size={20} color={colors.primary} />
                    </View>
                    <View style={styles.employeeDetails}>
                      <Text style={[styles.employeeName, { color: colors.text }]}>
                        {employee.fullName || employee.username}
                      </Text>
                      <Text style={[styles.employeeRole, { color: colors.textSecondary }]}>
                        {employee.role === 'manager' ? 'بەڕێوەبەر' : 'کارمەند'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.employeeStats}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <DollarSign size={16} color={colors.success} />
                      <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>کۆکراوەتەوە:</Text>
                      <Text style={[styles.statItemValue, { color: colors.success }]}>
                        {employee.totalCollected.toLocaleString('en-US')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <TrendingUp size={16} color={colors.primary} />
                      <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>ڕێژەی کۆکردنەوە:</Text>
                      <Text style={[styles.statItemValue, { color: colors.primary }]}>
                        {employee.collectionRate.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <User size={16} color={colors.textSecondary} />
                      <Text style={[styles.statItemLabel, { color: colors.textSecondary }]}>ژمارەی کڕیار:</Text>
                      <Text style={[styles.statItemValue, { color: colors.text }]}>
                        {employee.customerCount}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
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
  topPerformerCard: { borderRadius: 20, borderWidth: 2, padding: 32, alignItems: 'center', marginBottom: 24 },
  topPerformerTitle: { fontSize: 18, fontWeight: '700' as const, marginTop: 12, marginBottom: 16, textAlign: 'center' },
  topPerformerAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  topPerformerName: { fontSize: 20, fontWeight: '700' as const, marginBottom: 16, textAlign: 'center' },
  topPerformerStats: { flexDirection: 'row', gap: 16 },
  topPerformerStat: { alignItems: 'center' },
  topPerformerStatValue: { fontSize: 24, fontWeight: '700' as const, marginBottom: 4 },
  topPerformerStatLabel: { fontSize: 13, textAlign: 'center' },
  emptyCard: { borderRadius: 20, borderWidth: 2, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  employeeCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12 },
  employeeHeader: { marginBottom: 12 },
  employeeInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '700' as const, color: '#FFFFFF' },
  employeeAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  employeeDetails: { flex: 1, alignItems: 'flex-end' },
  employeeName: { fontSize: 16, fontWeight: '600' as const, textAlign: 'right' },
  employeeRole: { fontSize: 13, marginTop: 2, textAlign: 'right' },
  employeeStats: { gap: 8 },
  statRow: { flexDirection: 'row-reverse' },
  statItem: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  statItemLabel: { fontSize: 13 },
  statItemValue: { fontSize: 15, fontWeight: '600' as const },
});
