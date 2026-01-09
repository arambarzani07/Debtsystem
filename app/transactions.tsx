import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { useRouter } from 'expo-router';
import { ArrowUp, ArrowDown, Pencil, Trash2, Copy, Lock, Unlock, Clock } from 'lucide-react-native';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function TransactionsScreen() {
  const { getAllTransactions, updateTransaction, deleteTransaction, duplicateTransaction, toggleTransactionLock } = useDebt();
  const { colors, settings } = useTheme();
  const { verifyPin, hasPin } = useSecurity();
  const router = useRouter();
  const [filterBy, setFilterBy] = useState<'all' | 'debt' | 'payment'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  const cleanupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingDeleteItem, setPendingDeleteItem] = useState<any>(null);

  const allTransactions = getAllTransactions();

  const last24HoursTransactions = useMemo(() => {
    const now = new Date().getTime();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    return allTransactions.filter(t => {
      const transactionDate = new Date(t.date).getTime();
      return transactionDate >= twentyFourHoursAgo;
    });
  }, [allTransactions]);

  const allFilteredTransactions = useMemo(() => {
    if (filterBy === 'all') return last24HoursTransactions;
    return last24HoursTransactions.filter(t => t.type === filterBy);
  }, [last24HoursTransactions, filterBy]);

  const filteredTransactions = useMemo(() => {
    return allFilteredTransactions.slice(0, currentPage * ITEMS_PER_PAGE);
  }, [allFilteredTransactions, currentPage]);

  const hasMoreItems = allFilteredTransactions.length > filteredTransactions.length;

  const loadMore = useCallback(() => {
    if (hasMoreItems) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMoreItems]);

  const cleanupOldTransactions = useCallback(() => {
    const now = new Date().getTime();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    const oldTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.date).getTime();
      return transactionDate < twentyFourHoursAgo;
    });
    
    oldTransactions.forEach(transaction => {
      console.log(`🗑️ Deleting old transaction: ${transaction.id} from ${transaction.debtorName} - Age: ${Math.floor((now - new Date(transaction.date).getTime()) / (1000 * 60 * 60))} hours`);
      deleteTransaction(transaction.debtorId, transaction.id);
    });
    
    if (oldTransactions.length > 0) {
      console.log(`✅ Cleaned up ${oldTransactions.length} transactions older than 24 hours`);
    }
  }, [allTransactions, deleteTransaction]);

  useEffect(() => {
    cleanupOldTransactions();
    
    cleanupIntervalRef.current = setInterval(() => {
      console.log('⏰ Running automatic transaction cleanup...');
      cleanupOldTransactions();
    }, 60000);
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [cleanupOldTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterBy]);

  const formatCurrency = (amount: number) => {
    if (settings.hideAmounts) {
      return '***';
    }
    return amount.toLocaleString('en-US');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${day}/${month}/${year} - ${timeStr}`;
  };

  const handleEditTransaction = (item: any) => {
    setSelectedTransaction(item);
    setEditAmount(item.amount.toString());
    setEditDescription(item.description || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTransaction) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('هەڵە', 'تکایە بڕێکی دروست بنووسە');
      return;
    }
    
    updateTransaction(selectedTransaction.debtorId, selectedTransaction.id, {
      amount,
      description: editDescription,
    });
    
    setEditModalVisible(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = (item: any) => {
    if (item.isLocked) {
      Alert.alert('قفڵکراوە', 'ئەم مامەڵەیە قفڵکراوە. سەرەتا بیکەرەوە');
      return;
    }
    
    const performDeletion = () => {
      if (hasPin) {
        setPendingDeleteItem(item);
        setPinModalVisible(true);
        setPinInput('');
        setPinError('');
      } else {
        deleteTransaction(item.debtorId, item.id);
      }
    };
    
    Alert.alert(
      'سڕینەوە',
      'دڵنیایت لە سڕینەوەی ئەم مامەڵەیە؟',
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'سڕینەوە',
          style: 'destructive',
          onPress: performDeletion,
        },
      ]
    );
  };

  const handleVerifyPinAndDelete = async () => {
    if (!pinInput.trim()) {
      setPinError('تکایە پین کۆد بنووسە');
      return;
    }

    const isValid = await verifyPin(pinInput);
    
    if (isValid && pendingDeleteItem) {
      deleteTransaction(pendingDeleteItem.debtorId, pendingDeleteItem.id);
      setPinModalVisible(false);
      setPinInput('');
      setPinError('');
      setPendingDeleteItem(null);
    } else {
      setPinError('پین کۆد هەڵەیە');
      setPinInput('');
    }
  };

  const handleDuplicateTransaction = (item: any) => {
    duplicateTransaction(item.debtorId, item.id);
    Alert.alert('سەرکەوتوو', 'مامەڵەکە کۆپی کرا');
  };

  const handleToggleLock = (item: any) => {
    toggleTransactionLock(item.debtorId, item.id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.timeInfo}>
            <Clock size={16} color={colors.primary} />
            <Text style={[styles.timeInfoText, { color: colors.textSecondary }]}>
              تەنها مامەڵەکانی ٢٤ کاتژمێری ڕابردوو پیشان دەدرێت
            </Text>
          </View>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                filterBy === 'all' && { 
                  backgroundColor: colors.primary + '33',
                  borderColor: colors.primary 
                }
              ]}
              onPress={() => setFilterBy('all')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterBy === 'all' ? colors.primary : colors.textSecondary }
              ]}>هەموو</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                filterBy === 'debt' && { 
                  backgroundColor: colors.error + '33',
                  borderColor: colors.error 
                }
              ]}
              onPress={() => setFilterBy('debt')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterBy === 'debt' ? colors.error : colors.textSecondary }
              ]}>پێدان</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
                filterBy === 'payment' && { 
                  backgroundColor: colors.success + '33',
                  borderColor: colors.success 
                }
              ]}
              onPress={() => setFilterBy('payment')}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterBy === 'payment' ? colors.success : colors.textSecondary }
              ]}>وەرگرتن</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {last24HoursTransactions.length === 0 
                ? 'هیچ مامەڵەیەک لە ٢٤ کاتژمێری ڕابردوودا نییە' 
                : filterBy === 'debt' 
                  ? 'هیچ مامەڵەیەکی پێدان لە ٢٤ کاتژمێری ڕابردوودا نییە'
                  : 'هیچ مامەڵەیەکی وەرگرتن لە ٢٤ کاتژمێری ڕابردوودا نییە'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
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
            ListFooterComponent={
              hasMoreItems ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    {filteredTransactions.length} لە {allFilteredTransactions.length}
                  </Text>
                </View>
              ) : filteredTransactions.length > 0 ? (
                <View style={styles.endFooter}>
                  <Text style={[styles.endText, { color: colors.textSecondary }]}>کۆتایی لیست</Text>
                  <Text style={[styles.totalText, { color: colors.textTertiary }]}>
                    کۆی گشتی: {filteredTransactions.length}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View>
                <TouchableOpacity
                  style={[styles.transactionCard, { 
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder 
                  }]}
                  onPress={() => router.push(`/debtor/${item.debtorId}` as any)}
                >
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: colors.inputBackground }
                  ]}>
                    {item.type === 'debt' ? (
                      <ArrowUp size={20} color={colors.error} />
                    ) : (
                      <ArrowDown size={20} color={colors.success} />
                    )}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionDebtor, { color: colors.text }]}>
                      {item.debtorName}
                    </Text>
                    <Text style={[styles.transactionDescription, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                    {item.createdBy && (
                      <Text style={[styles.transactionCreatedBy, { color: colors.primary }]}>
                        تۆمارکراوە لەلایەن: {item.createdBy.userName}
                      </Text>
                    )}
                    <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
                      {formatDate(item.date)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: item.type === 'debt' ? colors.error : colors.success }
                  ]}>
                    {item.type === 'debt' ? '+' : '-'}{formatCurrency(item.amount)}
                  </Text>
                </TouchableOpacity>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.error }]}
                    onPress={() => handleDeleteTransaction(item)}
                    disabled={item.isLocked}
                  >
                    <Trash2 size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>سڕینەوە</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleEditTransaction(item)}
                    disabled={item.isLocked}
                  >
                    <Pencil size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>دەستکاری</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.success }]}
                    onPress={() => handleDuplicateTransaction(item)}
                  >
                    <Copy size={18} color="#fff" />
                    <Text style={styles.actionButtonText}>کۆپی</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: item.isLocked ? colors.warning : colors.textTertiary }]}
                    onPress={() => handleToggleLock(item)}
                  >
                    {item.isLocked ? <Lock size={18} color="#fff" /> : <Unlock size={18} color="#fff" />}
                    <Text style={styles.actionButtonText}>{item.isLocked ? 'قفڵکراوە' : 'قفڵکردن'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>دەستکاری مامەڵە</Text>
              
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>بڕ</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.cardBorder 
                }]}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                placeholder="بڕ"
                placeholderTextColor={colors.textTertiary}
              />
              
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>وردەکاری</Text>
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.cardBorder 
                }]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="وردەکاری"
                placeholderTextColor={colors.textTertiary}
                multiline
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.textTertiary }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalButtonText}>پاشەکەوت</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={pinModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setPinModalVisible(false);
            setPinInput('');
            setPinError('');
            setPendingDeleteItem(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>پین کۆد بنووسە</Text>
              <Text style={[styles.pinSubtitle, { color: colors.textSecondary }]}>
                بۆ سڕینەوەی مامەڵە پێویستە پین کۆد بنووسیت
              </Text>
              
              <TextInput
                style={[styles.modalInput, { 
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                  marginTop: 20,
                }]}
                value={pinInput}
                onChangeText={(text) => {
                  setPinInput(text);
                  setPinError('');
                }}
                placeholder="پین کۆد"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                secureTextEntry
                autoFocus
                maxLength={6}
                testID="pin-input"
              />
              {pinError ? (
                <Text style={styles.pinErrorText}>{pinError}</Text>
              ) : null}
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.textTertiary }]}
                  onPress={() => {
                    setPinModalVisible(false);
                    setPinInput('');
                    setPinError('');
                    setPendingDeleteItem(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.error }]}
                  onPress={handleVerifyPinAndDelete}
                  testID="verify-pin-button"
                >
                  <Text style={styles.modalButtonText}>سڕینەوە</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  timeInfoText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  filterButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
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
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  transactionDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  transactionDebtor: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
    textAlign: 'right',
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 4,
    textAlign: 'right',
  },
  transactionDate: {
    fontSize: 12,
    textAlign: 'right',
  },
  transactionCreatedBy: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 2,
    textAlign: 'right',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right',
    marginRight: 8,
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
  actionButtons: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 20,
    textAlign: 'right',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'right',
  },
  modalInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  pinSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  pinErrorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'right',
    marginTop: 4,
  },
});
