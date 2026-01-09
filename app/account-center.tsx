import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import {
  User,
  LogOut,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Calendar,
  Phone,
  Store,
  Shield,
  FileText,
  Info,
} from 'lucide-react-native';

export default function AccountCenterScreen() {
  const { currentUser, logout, getCurrentMarket } = useAuth();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const router = useRouter();
  const market = getCurrentMarket();

  const customerDebtor = useMemo(() => {
    if (!currentUser || currentUser.role !== 'customer' || !currentUser.debtorId) {
      return null;
    }
    return debtors.find(d => d.id === currentUser.debtorId);
  }, [currentUser, debtors]);

  const customerTransactions = useMemo(() => {
    if (!customerDebtor) return [];
    return customerDebtor.transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [customerDebtor]);

  useEffect(() => {
    if (currentUser === null) {
      router.replace('/customer-login' as any);
    } else if (currentUser && currentUser.role !== 'customer') {
      router.replace('/login' as any);
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'customer') {
    return null;
  }

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (confirm('ئایا دڵنیایت لە چوونە دەرەوە؟')) {
        logout();
        router.replace('/login' as any);
      }
    } else {
      Alert.alert(
        'چوونە دەرەوە',
        'ئایا دڵنیایت لە چوونە دەرەوە؟',
        [
          { text: 'نەخێر', style: 'cancel' },
          {
            text: 'بەڵێ',
            onPress: async () => {
              await logout();
              router.replace('/login' as any);
            },
          },
        ]
      );
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'خاوەنی سیستەم';
      case 'manager':
        return 'بەڕێوەبەری فرۆشگا';
      case 'employee':
        return 'کارمەند';
      case 'customer':
        return 'کڕیار';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'هەژماری کڕیار',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700' as const,
            fontSize: 18,
          },
        }}
      />
      <View style={styles.container}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {currentUser?.role === 'customer' && customerDebtor && (
              <>
                <View style={styles.heroSection}>
                  <LinearGradient
                    colors={customerDebtor.totalDebt > 0 
                      ? ['#EF4444', '#DC2626'] 
                      : ['#10B981', '#059669']
                    }
                    style={styles.debtHeroCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.debtHeroIcon}>
                      <Wallet size={32} color="#FFFFFF" />
                    </View>
                    <Text style={styles.debtHeroLabel}>کۆی قەرز</Text>
                    <Text style={styles.debtHeroAmount}>
                      {customerDebtor.totalDebt.toLocaleString('en-US')}
                    </Text>
                    <Text style={styles.debtHeroCurrency}>دینار عێراقی</Text>
                    {customerDebtor.totalDebt === 0 ? (
                      <View style={styles.successBadge}>
                        <Text style={styles.successBadgeText}>✓ هیچ قەرزێکت نییە</Text>
                      </View>
                    ) : (
                      <View style={styles.warningBadge}>
                        <Text style={styles.warningBadgeText}>تکایە پارەکەت بدەرەوە</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>

                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                    <Receipt size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {customerTransactions.length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>مامەڵە</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                    <TrendingUp size={24} color={colors.error} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {customerTransactions.filter(t => t.type === 'debt').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>قەرز</Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                    <TrendingDown size={24} color={colors.success} />
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {customerTransactions.filter(t => t.type === 'payment').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>پارەدان</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <View style={[styles.sectionHeader, { borderBottomColor: colors.glassBorder }]}>
                    <Receipt size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      دوایین مامەڵەکان
                    </Text>
                  </View>

                  {customerTransactions.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                      <Receipt size={48} color={colors.textTertiary} opacity={0.5} />
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        هیچ مامەڵەیەک نییە
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.transactionsList}>
                      {customerTransactions.slice(0, 10).map((transaction) => (
                        <View
                          key={transaction.id}
                          style={[styles.modernTransactionCard, {
                            backgroundColor: colors.cardGlass,
                            borderColor: colors.glassBorder,
                            borderLeftColor: transaction.type === 'debt' ? colors.error : colors.success,
                          }]}
                        >
                          <View style={styles.transactionHeader}>
                            <View style={[styles.modernTransactionIcon, {
                              backgroundColor: transaction.type === 'debt' ? colors.errorGlass : colors.successGlass
                            }]}>
                              {transaction.type === 'debt' ? (
                                <TrendingUp size={18} color={colors.error} />
                              ) : (
                                <TrendingDown size={18} color={colors.success} />
                              )}
                            </View>
                            <View style={styles.transactionInfo}>
                              <Text style={[styles.modernTransactionType, {
                                color: transaction.type === 'debt' ? colors.error : colors.success
                              }]}>
                                {transaction.type === 'debt' ? 'قەرز' : 'پارەدان'}
                              </Text>
                              <View style={styles.transactionDate}>
                                <Calendar size={12} color={colors.textTertiary} />
                                <Text style={[styles.modernTransactionDate, { color: colors.textTertiary }]}>
                                  {formatDate(transaction.date)}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.modernTransactionAmount, { 
                              color: transaction.type === 'debt' ? colors.error : colors.success 
                            }]}>
                              {transaction.type === 'debt' ? '+' : '-'}{transaction.amount.toLocaleString('en-US')}
                            </Text>
                          </View>
                          
                          {transaction.description && (
                            <Text style={[styles.modernTransactionDescription, { color: colors.textSecondary }]}>
                              {transaction.description}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {market && (
              <View style={styles.section}>
                <View style={[styles.sectionHeader, { borderBottomColor: colors.glassBorder }]}>
                  <Store size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    زانیاری فرۆشگا
                  </Text>
                </View>

                <View style={[styles.marketCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                  <View style={styles.marketHeader}>
                    <View style={[styles.marketIcon, { backgroundColor: colors.primaryGlass }]}>
                      <Store size={24} color={colors.primary} />
                    </View>
                    <Text style={[styles.marketName, { color: colors.text }]}>{market.name}</Text>
                  </View>
                  
                  {market.phone && (
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Linking.openURL(`tel:${market.phone}`);
                        }
                      }}
                    >
                      <Phone size={18} color={colors.primary} />
                      <Text style={[styles.contactText, { color: colors.text }]}>{market.phone}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.glassBorder }]}>
                <User size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  زانیاری هەژمار
                </Text>
              </View>

              <View style={[styles.infoCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ناوی بەکارهێنەر</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{currentUser.username}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ڕۆڵ</Text>
                  <Text style={[styles.infoValue, { color: colors.primary }]}>
                    {getRoleLabel(currentUser.role)}
                  </Text>
                </View>
                {currentUser.fullName && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ناوی تەواو</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>{currentUser.fullName}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={[styles.sectionHeader, { borderBottomColor: colors.glassBorder }]}>
                <Info size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  یارمەتی و پشتگیری
                </Text>
              </View>

              <View style={styles.helpGrid}>
                <TouchableOpacity 
                  style={[styles.helpCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                  onPress={() => router.push('/privacy-policy' as any)}
                >
                  <Shield size={24} color={colors.primary} />
                  <Text style={[styles.helpCardText, { color: colors.text }]}>سیاسەتی تایبەتێتی</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.helpCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                  onPress={() => router.push('/terms-of-service' as any)}
                >
                  <FileText size={24} color={colors.primary} />
                  <Text style={[styles.helpCardText, { color: colors.text }]}>مەرجەکانی بەکارهێنان</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.helpCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                  onPress={() => router.push('/about' as any)}
                >
                  <Info size={24} color={colors.primary} />
                  <Text style={[styles.helpCardText, { color: colors.text }]}>دەربارە</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: colors.error }]}
                onPress={handleLogout}
              >
                <LogOut size={20} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>
                  چوونە دەرەوە
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  heroSection: {
    marginTop: -16,
    marginHorizontal: -16,
    marginBottom: 8,
  },
  debtHeroCard: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
    paddingTop: 40,
    paddingBottom: 40,
  },
  debtHeroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  debtHeroLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  debtHeroAmount: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  debtHeroCurrency: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  successBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  successBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  warningBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
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
    fontWeight: '500' as const,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'right',
  },
  saveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  syncInfo: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
  },
  dangerButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  debtCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  debtHeader: {
    alignItems: 'center',
    gap: 8,
  },
  debtLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  debtAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  debtWarning: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  debtSuccess: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  transactionsList: {
    gap: 8,
  },
  transactionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modernTransactionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 14,
    gap: 10,
  },
  modernTransactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernTransactionType: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  modernTransactionDate: {
    fontSize: 11,
  },
  modernTransactionAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  modernTransactionDescription: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
  },
  transactionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  transactionDescription: {
    fontSize: 14,
    textAlign: 'right',
  },
  transactionFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  transactionDate: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  transactionDateText: {
    fontSize: 12,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  marketCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  marketHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  marketIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketName: {
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'right',
  },
  contactButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right',
  },
  helpGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  helpCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  helpCardText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
