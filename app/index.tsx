import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Settings, LogOut } from 'lucide-react-native';

import OfflineIndicator from '@/components/OfflineIndicator';
import FloatingActionButton from '@/components/FloatingActionButton';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import type { Debtor } from '@/types';
import { COLOR_TAG_MAP, CATEGORY_COLORS, CATEGORY_LABELS } from '@/constants/colors';

interface DebtorItemProps {
  item: Debtor;
  index: number;
  onPress: () => void;
  hideAmounts: boolean;
  colors: any;
  onQuickDebt: () => void;
  onQuickCredit: () => void;
  showQuickActions: boolean;
  onToggleActions: () => void;
}

const DebtorItem: React.FC<DebtorItemProps> = ({ item, index, onPress, hideAmounts, colors, onQuickDebt, onQuickCredit, showQuickActions, onToggleActions }) => {
  
  const formatCurrency = (amount: number) => {
    if (hideAmounts) {
      return '***';
    }
    return amount.toLocaleString('en-US');
  };

  return (
    <View style={{ marginTop: index === 0 ? 0 : 16 }}>
      <TouchableOpacity
        style={[styles.debtorCard, { 
          backgroundColor: colors.cardGlass,
          borderColor: colors.glassBorder,
          shadowColor: colors.shadowColor,
        }]}
        onPress={onPress}
        activeOpacity={0.7}
        testID={`debtor-item-${item.id}`}
      >
        {item.colorTag && (
          <View style={[styles.colorTagIndicator, { backgroundColor: COLOR_TAG_MAP[item.colorTag] }]} />
        )}
        <View style={styles.rowContainer}>
          {item.totalDebt > 0 && (
            <View style={styles.redDot} />
          )}
          <Text style={[styles.debtorNameFormatted, { color: colors.text }]}>
            {index + 1}. {item.name}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={[styles.debtAmount, { color: colors.error }]}>
            {formatCurrency(Math.abs(item.totalDebt))}
          </Text>
        </View>
        {item.category && (
          <View style={[styles.categoryBadge, { 
            backgroundColor: CATEGORY_COLORS[item.category] + '22', 
            borderColor: CATEGORY_COLORS[item.category] + '55',
            marginTop: 8,
            alignSelf: 'flex-end',
          }]}>
            <Text style={[styles.categoryText, { color: CATEGORY_COLORS[item.category] }]}>
              {CATEGORY_LABELS[item.category]}
            </Text>
          </View>
        )}
        {item.interestRate && item.interestRate > 0 && (
          <Text style={[styles.interestRateText, { color: colors.warning, marginTop: 8 }]}>
            سوود: {item.interestRate}%
          </Text>
        )}
      </TouchableOpacity>
      
      {showQuickActions && (
        <View style={[styles.quickActionsContainer, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#EF4444' }]}
            onPress={onQuickDebt}
          >
            <Text style={[styles.quickActionText, { color: '#EF4444' }]}>+ قەرز</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22C55E' }]}
            onPress={onQuickCredit}
          >
            <Text style={[styles.quickActionText, { color: '#22C55E' }]}>+ دانەوە</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.toggleQuickActionsButton, { backgroundColor: colors.primary }]}
        onPress={onToggleActions}
      >
        <Text style={styles.toggleQuickActionsText}>{showQuickActions ? '−' : '+'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  const auth = useAuth();
  const debt = useDebt();
  const theme = useTheme();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  const currentUser = auth?.currentUser ?? null;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const logout = auth?.logout;
  const getCurrentMarket = auth?.getCurrentMarket;
  const authLoading = auth?.isLoading === true;
  const debtors = useMemo(() => debt?.debtors ?? [], [debt?.debtors]);
  const isLoading = debt?.isLoading ?? false;
  const refresh = debt?.refresh;
  const isRefreshing = debt?.isRefreshing ?? false;
  const addTransaction = debt?.addTransaction;

  const colors = theme?.colors ?? {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    primary: '#007AFF',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    card: '#FFFFFF',
    cardGlass: 'rgba(255,255,255,0.8)',
    glassBorder: 'rgba(0,0,0,0.1)',
    shadowColor: '#000000',
    errorGlass: 'rgba(239,68,68,0.1)',
    backgroundGradient: ['#FFFFFF', '#F5F5F5'],
  };
  const settings = theme?.settings ?? { hideAmounts: false };

  const currentMarket = getCurrentMarket ? getCurrentMarket() : null;

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);
  const animatedColors = [
    '#FF6B35',
    '#F7931E',
    '#FDC830',
    '#37ECBA',
    '#72DDF7',
    '#A78BFA',
    '#F472B6',
    '#FB923C',
  ];

  useEffect(() => {
    if (hasRedirected || authLoading) return;
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      setHasRedirected(true);
      router.replace('/login' as any);
      return;
    }

    if (currentUser?.role === 'employee') {
      const isActive = currentUser.isActive !== undefined ? currentUser.isActive : true;
      if (!isActive) {
        Alert.alert(
          'ئاگاداری',
          'هەژماری کارمەندەکەت ناچالاک کراوە. تکایە پەیوەندی بە بەڕێوەبەر بکە.',
          [
            {
              text: 'باشە',
              onPress: async () => {
                if (logout) await logout();
                setHasRedirected(true);
                router.replace('/login' as any);
              },
            },
          ]
        );
        return;
      }
    }

    if (currentUser?.role === 'owner') {
      setHasRedirected(true);
      router.replace('/owner-dashboard' as any);
    } else if (currentUser?.role === 'customer') {
      setHasRedirected(true);
      router.replace('/customer-login' as any);
    }
  }, [isAuthenticated, currentUser, router, authLoading, logout, hasRedirected]);

  const allFilteredDebtors = useMemo(() => {
    let result = [...debtors];
    result.sort((a, b) => b.totalDebt - a.totalDebt);
    return result;
  }, [debtors]);

  const filteredDebtors = useMemo(() => {
    return allFilteredDebtors.slice(0, currentPage * ITEMS_PER_PAGE);
  }, [allFilteredDebtors, currentPage]);

  const hasMoreItems = allFilteredDebtors.length > filteredDebtors.length;

  const summary = useMemo(() => {
    const totalDebts = debtors.reduce((sum, debtor) => {
      if (debtor.totalDebt > 0) {
        return sum + debtor.totalDebt;
      }
      return sum;
    }, 0);
    
    const totalReceived = debtors.reduce((sum, debtor) => {
      if (debtor.totalDebt < 0) {
        return sum + Math.abs(debtor.totalDebt);
      }
      return sum;
    }, 0);
    
    return { totalDebts, totalReceived };
  }, [debtors]);



  const loadMore = useCallback(() => {
    if (hasMoreItems) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMoreItems]);



  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColorIndex((prev) => (prev + 1) % animatedColors.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [animatedColors.length]);

  if (authLoading || !isAuthenticated || !currentUser) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (currentUser.role === 'owner' || currentUser.role === 'customer') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (currentUser.role !== 'manager' && currentUser.role !== 'employee') {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineIndicator />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
        <View style={styles.header}>
          <View style={[styles.headerCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <Text style={[styles.title, { color: colors.text }]}>سیستەمی بەڕێوەبردنی قەرز</Text>
            {currentMarket && (
              <Text 
                style={[styles.marketName, { color: animatedColors[currentColorIndex] }]} 
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentMarket.name}
              </Text>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.glassButton, { 
                backgroundColor: colors.cardGlass,
                borderColor: colors.glassBorder,
              }]}
              onPress={() => router.push('/settings' as any)}
              testID="settings-button"
            >
              <Settings size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.glassButton, { 
                backgroundColor: colors.errorGlass,
                borderColor: 'rgba(239, 68, 68, 0.4)',
              }]}
              onPress={() => {
                Alert.alert(
                  'چوونە دەرەوە',
                  'ئایا دڵنیایت لە چوونە دەرەوە؟',
                  [
                    { text: 'نەخێر', style: 'cancel' },
                    {
                      text: 'بەڵێ',
                      onPress: async () => {
                        if (logout) await logout();
                        router.replace('/login' as any);
                      },
                    },
                  ]
                );
              }}
              testID="logout-button"
            >
              <LogOut size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          {showSummaryModal && (
            <Modal
              visible={showSummaryModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowSummaryModal(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowSummaryModal(false)}
              >
                <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>کۆی گشتی</Text>
                    <TouchableOpacity onPress={() => setShowSummaryModal(false)} style={styles.modalCloseButton}>
                      <Text style={[styles.modalCloseButtonText, { color: colors.textSecondary }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modernSummaryContainer}>
                    <View style={[styles.summarySection, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                      <View style={styles.modalSummaryRow}>
                        <Text style={styles.summaryValueRed}>
                          {settings.hideAmounts ? '***' : summary.totalDebts.toLocaleString('en-US')}
                        </Text>
                        <Text style={[styles.summaryLabelModern, { color: colors.error }]}>قەرز</Text>
                      </View>
                      <Text style={[styles.summaryUnit, { color: colors.error }]}>IQD</Text>
                    </View>
                    
                    <View style={[styles.summarySection, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                      <View style={styles.modalSummaryRow}>
                        <Text style={styles.summaryValueGreen}>
                          {settings.hideAmounts ? '***' : summary.totalReceived.toLocaleString('en-US')}
                        </Text>
                        <Text style={[styles.summaryLabelModern, { color: colors.success }]}>وەرگیراوە</Text>
                      </View>
                      <Text style={[styles.summaryUnit, { color: colors.success }]}>IQD</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
          )}



          <TouchableOpacity
            style={[styles.summaryCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}
            onPress={() => setShowSummaryModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItemRight}>
                <Text style={[styles.summaryLabelInline, { color: colors.error }]}>قەرز</Text>
                <Text style={[styles.summaryValueInline, { color: colors.error }]}>
                  {settings.hideAmounts ? '***' : summary.totalDebts.toLocaleString('en-US')}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.summaryItemLeft}>
                <Text style={[styles.summaryLabelInline, { color: colors.success }]}>وەرگیراوە</Text>
                <Text style={[styles.summaryValueInline, { color: colors.success }]}>
                  {settings.hideAmounts ? '***' : summary.totalReceived.toLocaleString('en-US')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>

        {filteredDebtors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              هێشتا کڕیارێک زیاد نەکراوە
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              بۆ دەستپێکردن دوگمەی + لە سەرەوە دابگرە
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDebtors}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="auto"
            decelerationRate="normal"
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={10}
            windowSize={21}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh ?? (() => {})}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.card}
              />
            }
            ListFooterComponent={
              hasMoreItems ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {filteredDebtors.length} لە {allFilteredDebtors.length}
                  </Text>
                </View>
              ) : filteredDebtors.length > 0 ? (
                <View style={styles.endFooter}>
                  <Text style={[styles.endText, { color: colors.textTertiary }]}>کۆتایی لیست</Text>
                  <Text style={[styles.totalText, { color: colors.textTertiary }]}>
                    کۆی گشتی: {filteredDebtors.length}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <DebtorItem
                item={item}
                index={index}
                onPress={() => router.push({ pathname: '/debtor/[id]', params: { id: item.id } } as any)}
                hideAmounts={settings.hideAmounts}
                colors={colors}
                showQuickActions={showQuickActions === item.id}
                onToggleActions={() => setShowQuickActions(showQuickActions === item.id ? null : item.id)}
                onQuickDebt={() => {
                  if (Platform.OS === 'web') {
                    const amount = prompt(`بڕی قەرزی نوێ بۆ ${item.name}`);
                    if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
                      if (addTransaction) {
                        addTransaction(
                          item.id,
                          parseFloat(amount),
                          'قەرزی خێرا',
                          'debt'
                        );
                      }
                    }
                  } else {
                    Alert.prompt(
                      'زیادکردنی قەرز',
                      `بڕی قەرزی نوێ بۆ ${item.name}`,
                      [
                        { text: 'هەڵوەشاندنەوە', style: 'cancel' },
                        {
                          text: 'زیادکردن',
                          onPress: (text?: string) => {
                            if (text && !isNaN(parseFloat(text)) && parseFloat(text) > 0) {
                              if (addTransaction) {
                                addTransaction(
                                  item.id,
                                  parseFloat(text),
                                  'قەرزی خێرا',
                                  'debt'
                                );
                              }
                            } else {
                              Alert.alert('هەڵە', 'تکایە بڕێکی دروست بنووسە');
                            }
                          },
                        },
                      ],
                      'plain-text'
                    );
                  }
                }}
                onQuickCredit={() => {
                  if (Platform.OS === 'web') {
                    const amount = prompt(`بڕی پارەدانەوەی نوێ بۆ ${item.name}`);
                    if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
                      if (addTransaction) {
                        addTransaction(
                          item.id,
                          parseFloat(amount),
                          'پارەدانەوەی خێرا',
                          'payment'
                        );
                      }
                    }
                  } else {
                    Alert.prompt(
                      'زیادکردنی دانەوە',
                      `بڕی پارەدانەوەی نوێ بۆ ${item.name}`,
                      [
                        { text: 'هەڵوەشاندنەوە', style: 'cancel' },
                        {
                          text: 'زیادکردن',
                          onPress: (text?: string) => {
                            if (text && !isNaN(parseFloat(text)) && parseFloat(text) > 0) {
                              if (addTransaction) {
                                addTransaction(
                                  item.id,
                                  parseFloat(text),
                                  'پارەدانەوەی خێرا',
                                  'payment'
                                );
                              }
                            } else {
                              Alert.alert('هەڵە', 'تکایە بڕێکی دروست بنووسە');
                            }
                          },
                        },
                      ],
                      'plain-text'
                    );
                  }
                }}
              />
            )}
          />
        )}
        <FloatingActionButton onAddDebtor={() => router.push('/add-debtor' as any)} />
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 32,
    borderWidth: 2.5,
    padding: 28,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800' as const,
    writingDirection: 'rtl' as const,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  marketName: {
    fontSize: 20,
    fontWeight: '800' as const,
    writingDirection: 'rtl' as const,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  glassButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  searchContainer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filtersContainer: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  filterSection: {
    gap: 10,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  filterButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  debtorCard: {
    borderRadius: 26,
    borderWidth: 2,
    paddingVertical: 24,
    paddingLeft: 24,
    paddingRight: 12,
    position: 'relative' as const,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  colorTagIndicator: {
    position: 'absolute' as const,
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  rowContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },

  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 12,
  },
  debtorNameFormatted: {
    fontSize: 19,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  interestRateText: {
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '600' as const,
    writingDirection: 'rtl' as const,
  },
  debtAmount: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
  },
  endFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  endText: {
    fontSize: 14,
    textAlign: 'center',
  },
  totalText: {
    fontSize: 12,
    textAlign: 'center',
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  summaryCard: {
    marginTop: 20,
    borderRadius: 28,
    borderWidth: 2.5,
    paddingVertical: 28,
    paddingHorizontal: 28,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItemRight: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  summaryItemLeft: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  summaryDivider: {
    width: 2,
    height: 60,
    marginHorizontal: 20,
    opacity: 0.6,
  },
  summaryLabelInline: {
    fontSize: 15,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  summaryValueInline: {
    fontSize: 32,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 36,
    fontWeight: '300' as const,
  },
  modernSummaryContainer: {
    flexDirection: 'column',
    padding: 24,
    gap: 20,
  },
  summarySection: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 20,
  },
  summaryLabelModern: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  summaryValueRed: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: '#EF4444',
    textAlign: 'center',
  },
  summaryValueGreen: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: '#22C55E',
    textAlign: 'center',
  },
  summaryUnit: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  modalSummaryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  toggleQuickActionsButton: {
    position: 'absolute' as const,
    bottom: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleQuickActionsText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700' as const,
  },
});
