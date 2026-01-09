import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { DollarSign, Calendar, FileText, TrendingUp, TrendingDown } from 'lucide-react-native';
import type { Debtor } from '@/types';

export default function CustomerDebtViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { getDebtor } = useDebt();
  const [debtor, setDebtor] = useState<Debtor | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const foundDebtor = getDebtor(id);
      setDebtor(foundDebtor);
      setLoading(false);
    }
  }, [id, getDebtor]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!debtor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.text }]}>
              هیچ زانیارییەک نەدۆزرایەوە
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const sortedTransactions = [...debtor.transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalDebtAmount = debtor.transactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + t.amount, 0);
  const totalPaymentAmount = debtor.transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>وەسڵی قەرز</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            زانیاری قەرزەکانت
          </Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.customerCard, {
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <Text style={[styles.customerName, { color: colors.text }]}>
              {debtor.name}
            </Text>
            {debtor.phone && (
              <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
                📞 {debtor.phone}
              </Text>
            )}
          </View>

          <View style={[styles.balanceCard, {
            backgroundColor: debtor.totalDebt > 0 ? colors.errorGlass : colors.successGlass,
            borderColor: debtor.totalDebt > 0 ? colors.error : colors.success,
          }]}>
            <View style={styles.balanceHeader}>
              <DollarSign size={32} color={debtor.totalDebt > 0 ? colors.error : colors.success} />
              <Text style={[styles.balanceLabel, { color: colors.text }]}>
                {debtor.totalDebt > 0 ? 'ماوەی قەرز' : 'حسابی پاک'}
              </Text>
            </View>
            <Text style={[styles.balanceAmount, { 
              color: debtor.totalDebt > 0 ? colors.error : colors.success 
            }]}>
              {Math.abs(debtor.totalDebt).toLocaleString('en-US')} دینار
            </Text>
          </View>

          <View style={[styles.summaryCard, {
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              پوختەی گشتی
            </Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <TrendingUp size={20} color={colors.error} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    کۆی قەرزەکان
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {totalDebtAmount.toLocaleString('en-US')}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <TrendingDown size={20} color={colors.success} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    کۆی پارەدانەکان
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {totalPaymentAmount.toLocaleString('en-US')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <FileText size={20} color={colors.primary} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    ژمارەی مامەڵەکان
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {debtor.transactions.length}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryItem}>
                <View style={styles.summaryIconBox}>
                  <Calendar size={20} color={colors.warning} />
                </View>
                <View style={styles.summaryInfo}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    دروستکراوە
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {new Date(debtor.createdAt).toLocaleDateString('ku')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {sortedTransactions.length > 0 && (
            <View style={[styles.transactionsCard, {
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                وردەکاری مامەڵەکان
              </Text>

              {sortedTransactions.map((transaction, index) => (
                <View
                  key={transaction.id}
                  style={[styles.transactionItem, {
                    backgroundColor: colors.background,
                    borderColor: colors.glassBorder,
                  }]}
                >
                  <View style={styles.transactionHeader}>
                    <View style={[styles.transactionIcon, {
                      backgroundColor: transaction.type === 'debt' ? colors.errorGlass : colors.successGlass,
                    }]}>
                      {transaction.type === 'debt' ? (
                        <TrendingUp size={16} color={colors.error} />
                      ) : (
                        <TrendingDown size={16} color={colors.success} />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionType, { 
                        color: transaction.type === 'debt' ? colors.error : colors.success 
                      }]}>
                        {transaction.type === 'debt' ? 'قەرز' : 'پارەدان'}
                      </Text>
                      <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                        {new Date(transaction.date).toLocaleDateString('ku', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    <Text style={[styles.transactionAmount, { 
                      color: transaction.type === 'debt' ? colors.error : colors.success 
                    }]}>
                      {transaction.amount.toLocaleString('en-US')}
                    </Text>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionDescription, { color: colors.text }]}>
                      {transaction.description}
                    </Text>
                    {transaction.comment && (
                      <View style={[styles.commentBox, {
                        backgroundColor: colors.primaryGlass,
                        borderColor: colors.primary,
                      }]}>
                        <Text style={[styles.commentLabel, { color: colors.primary }]}>
                          تێبینی:
                        </Text>
                        <Text style={[styles.commentText, { color: colors.text }]}>
                          {transaction.comment}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.footerCard, {
            backgroundColor: colors.primaryGlass,
            borderColor: colors.primary,
          }]}>
            <Text style={[styles.footerText, { color: colors.text }]}>
              💡 ئەم زانیارییانە تەنها بۆ بینینن. بۆ پارەدان یان زیاتر زانیاری پەیوەندی بکە.
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  customerCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 16,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  transactionsCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  transactionItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  transactionDetails: {
    gap: 8,
  },
  transactionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
