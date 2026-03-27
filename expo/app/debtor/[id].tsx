import { useDebt } from '@/contexts/DebtContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUp, ArrowDown, Edit2, Trash2, Brain } from 'lucide-react-native';
import React, { useState } from 'react';
import type { DebtorCategory, ColorTag } from '@/types';
import { COLOR_TAG_MAP, CATEGORY_COLORS, CATEGORY_LABELS } from '@/constants/colors';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function DebtorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDebtor, addTransaction, updateNotes, updateDebtLimit, updateDebtor, deleteDebtor, deleteTransaction } = useDebt();
  const { verifyPin, hasPin } = useSecurity();
  const debtor = getDebtor(id as string);
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<'debt' | 'payment'>('debt');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(debtor?.notes || '');
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [debtLimit, setDebtLimit] = useState(debtor?.debtLimit?.toString() || '');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(debtor?.name || '');
  const [editPhone, setEditPhone] = useState(debtor?.phone || '');
  const [editCategory, setEditCategory] = useState<DebtorCategory | undefined>(debtor?.category);
  const [editColorTag, setEditColorTag] = useState<ColorTag | undefined>(debtor?.colorTag);
  const [editInterestRate, setEditInterestRate] = useState(debtor?.interestRate?.toString() || '');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'debt' | 'payment'>('all');

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingDeleteTransactionId, setPendingDeleteTransactionId] = useState<string | null>(null);

  if (!debtor) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.errorText}>کڕیارەکە نەدۆزرایەوە</Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) => {
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

  const handleAddTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      if (Platform.OS === 'web') {
        alert('تکایە بڕێکی دروست بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە بڕێکی دروست بنووسە');
      }
      return;
    }

    if (!description.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە وردەکاری بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە وردەکاری بنووسە');
      }
      return;
    }

    const newAmount = parseFloat(amount);
    const newTotal = transactionType === 'debt' 
      ? debtor.totalDebt + newAmount 
      : debtor.totalDebt - newAmount;

    if (debtor.debtLimit && transactionType === 'debt' && newTotal > debtor.debtLimit) {
      const message = `ئاگاداری! ئەم مامەڵەیە دەبێتە هۆی تێپەڕین لە سنووری قەرز (${formatCurrency(debtor.debtLimit)}). دەتەوێت بەردەوام بیت؟`;
      if (Platform.OS === 'web') {
        if (!confirm(message)) {
          return;
        }
      } else {
        Alert.alert(
          'ئاگاداری',
          message,
          [
            { text: 'نەخێر', style: 'cancel' },
            { 
              text: 'بەڵێ', 
              onPress: () => {
                addTransaction(
                  debtor.id,
                  newAmount,
                  description.trim(),
                  transactionType
                );
                setAmount('');
                setDescription('');
                setModalVisible(false);
              }
            }
          ]
        );
        return;
      }
    }

    addTransaction(
      debtor.id,
      newAmount,
      description.trim(),
      transactionType
    );

    setAmount('');
    setDescription('');
    setModalVisible(false);
  };

  const openTransactionModal = (type: 'debt' | 'payment') => {
    setTransactionType(type);
    setModalVisible(true);
  };

  const handleSaveNotes = () => {
    if (debtor) {
      updateNotes(debtor.id, notes);
      setIsEditingNotes(false);
    }
  };

  const handleSaveLimit = () => {
    if (debtor) {
      const limitValue = debtLimit.trim() === '' ? undefined : parseFloat(debtLimit);
      if (debtLimit.trim() !== '' && (isNaN(limitValue as number) || (limitValue as number) <= 0)) {
        if (Platform.OS === 'web') {
          alert('تکایە بڕێکی دروست بنووسە');
        } else {
          Alert.alert('هەڵە', 'تکایە بڕێکی دروست بنووسە');
        }
        return;
      }
      updateDebtLimit(debtor.id, limitValue);
      setIsEditingLimit(false);
    }
  };

  const getDebtLimitPercentage = () => {
    if (!debtor?.debtLimit || debtor.debtLimit <= 0) return 0;
    return Math.min((debtor.totalDebt / debtor.debtLimit) * 100, 100);
  };

  const getDebtLimitColor = () => {
    const percentage = getDebtLimitPercentage();
    if (percentage >= 100) return '#EF4444';
    if (percentage >= 80) return '#F59E0B';
    return '#10B981';
  };

  const filteredTransactions = debtor.transactions.filter((transaction) => {
    if (transactionFilter === 'all') return true;
    return transaction.type === transactionFilter;
  });

  const handleEditDebtor = () => {
    if (!editName.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە ناوی کڕیار بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە ناوی کڕیار بنووسە');
      }
      return;
    }

    const rate = editInterestRate.trim() ? parseFloat(editInterestRate) : undefined;
    if (editInterestRate.trim() && (isNaN(rate as number) || (rate as number) < 0)) {
      if (Platform.OS === 'web') {
        alert('تکایە ڕێژەی سوودی دروست بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە ڕێژەی سوودی دروست بنووسە');
      }
      return;
    }

    if (debtor) {
      updateDebtor(debtor.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        category: editCategory,
        colorTag: editColorTag,
        interestRate: rate,
      });
      setEditModalVisible(false);
    }
  };

  const handleDeleteDebtor = () => {
    if (!debtor) return;

    if (debtor.totalDebt !== 0) {
      if (Platform.OS === 'web') {
        alert('ناتوانیت ئەم کڕیارە بسڕیتەوە چونکە حسابەکەی سفر نییە');
      } else {
        Alert.alert('هەڵە', 'ناتوانیت ئەم کڕیارە بسڕیتەوە چونکە حسابەکەی سفر نییە');
      }
      return;
    }

    const message = 'دڵنیایت لە سڕینەوەی ئەم کڕیارە؟';
    if (Platform.OS === 'web') {
      if (confirm(message)) {
        deleteDebtor(debtor.id);
        router.back();
      }
    } else {
      Alert.alert(
        'سڕینەوە',
        message,
        [
          { text: 'نەخێر', style: 'cancel' },
          { 
            text: 'بەڵێ', 
            style: 'destructive',
            onPress: () => {
              deleteDebtor(debtor.id);
              router.back();
            }
          }
        ]
      );
    }
  };



  const handleDeleteTransaction = (transactionId: string) => {
    const message = 'دڵنیایت لە سڕینەوەی ئەم مامەڵەیە؟';
    
    const performDeletion = () => {
      if (hasPin) {
        setPendingDeleteTransactionId(transactionId);
        setPinModalVisible(true);
        setPinInput('');
        setPinError('');
      } else {
        deleteTransaction(debtor.id, transactionId);
      }
    };
    
    if (Platform.OS === 'web') {
      if (confirm(message)) {
        performDeletion();
      }
    } else {
      Alert.alert(
        'سڕینەوە',
        message,
        [
          { text: 'نەخێر', style: 'cancel' },
          { 
            text: 'بەڵێ', 
            style: 'destructive',
            onPress: performDeletion
          }
        ]
      );
    }
  };

  const handleVerifyPinAndDelete = async () => {
    if (!pinInput.trim()) {
      setPinError('تکایە پین کۆد بنووسە');
      return;
    }

    const isValid = await verifyPin(pinInput);
    
    if (isValid && pendingDeleteTransactionId) {
      deleteTransaction(debtor.id, pendingDeleteTransactionId);
      setPinModalVisible(false);
      setPinInput('');
      setPinError('');
      setPendingDeleteTransactionId(null);
    } else {
      setPinError('پین کۆد هەڵەیە');
      setPinInput('');
    }
  };



  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="auto"
          decelerationRate="normal"
        >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={handleDeleteDebtor}
                testID="delete-debtor-button"
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => {
                  router.push({
                    pathname: '/add-debtor' as any,
                    params: {
                      editMode: 'true',
                      debtorId: debtor.id,
                      name: debtor.name,
                      phone: debtor.phone || '',
                      category: debtor.category || '',
                      colorTag: debtor.colorTag || '',
                      interestRate: debtor.interestRate?.toString() || '',
                    }
                  });
                }}
                testID="edit-debtor-button"
              >
                <Edit2 size={20} color="#60A5FA" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.headerActionButton}
                onPress={() => router.push(`/debtor-insights?id=${debtor.id}` as any)}
                testID="insights-button"
              >
                <Brain size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
            <Text style={styles.debtorName}>{debtor.name}</Text>
          </View>
        </View>
        
        <View style={styles.dashboard}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.dashboardGradient}
          >
            <Text style={styles.dashboardLabel}>کۆی قەرز</Text>
            <Text style={[
              styles.dashboardAmount,
              debtor.totalDebt > 0 ? styles.amountPositive : styles.amountNegative
            ]}>
              {formatCurrency(Math.abs(debtor.totalDebt))}
            </Text>
            <Text style={styles.dashboardStatus}>
              {debtor.totalDebt > 0 ? 'قەرزی لەسەرە' : debtor.totalDebt < 0 ? 'وەرگیراوە' : 'هاوسەنگە'}
            </Text>
            
            {debtor.debtLimit && debtor.debtLimit > 0 && (
              <View style={styles.limitContainer}>
                <View style={styles.limitInfo}>
                  <Text style={styles.limitLabel}>سنووری قەرز: {formatCurrency(debtor.debtLimit)}</Text>
                  <Text style={[styles.limitPercentage, { color: getDebtLimitColor() }]}>
                    {getDebtLimitPercentage().toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${getDebtLimitPercentage()}%`,
                        backgroundColor: getDebtLimitColor()
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openTransactionModal('debt')}
                testID="add-debt-button"
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.actionButtonGradient}
                >
                  <ArrowUp size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>پێدانی قەرز</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openTransactionModal('payment')}
                testID="add-payment-button"
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.actionButtonGradient}
                >
                  <ArrowDown size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>وەرگرتنەوەی قەرز</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.limitSection}>
          <View style={styles.limitSectionHeader}>
            <Text style={styles.limitSectionTitle}>سنووری قەرز</Text>
{isEditingLimit ? (
              <TouchableOpacity 
                onPress={handleSaveLimit}
                testID="save-limit-button"
                style={styles.saveNotesButton}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.saveNotesGradient}
                >
                  <Text style={styles.saveNotesButtonText}>پاشەکەوتکردن</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => setIsEditingLimit(true)}
                testID="edit-limit-button"
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>دەستکاری</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isEditingLimit ? (
            <TextInput
              style={styles.limitInput}
              value={debtLimit}
              onChangeText={setDebtLimit}
              placeholder="سنووری قەرز بنووسە (بەتاڵی بهێڵەرەوە بۆ لابردن)"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              autoFocus
              testID="limit-input"
            />
          ) : (
            <View style={styles.limitDisplay}>
              {debtor.debtLimit && debtor.debtLimit > 0 ? (
                <Text style={styles.limitText}>{formatCurrency(debtor.debtLimit)}</Text>
              ) : (
                <Text style={styles.limitPlaceholder}>سنوور دیاری نەکراوە</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.notesSection}>
          <View style={styles.notesSectionHeader}>
            <Text style={styles.notesSectionTitle}>تێبینی</Text>
{isEditingNotes ? (
              <TouchableOpacity 
                onPress={handleSaveNotes}
                testID="save-notes-button"
                style={styles.saveNotesButton}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.saveNotesGradient}
                >
                  <Text style={styles.saveNotesButtonText}>پاشەکەوتکردن</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => setIsEditingNotes(true)}
                testID="edit-notes-button"
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>دەستکاری</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isEditingNotes ? (
            <TextInput
              style={[styles.notesDisplay, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="تێبینییەکان بنووسە..."
              placeholderTextColor="#64748B"
              multiline
              textAlignVertical="top"
              autoFocus
              testID="notes-input"
            />
          ) : (
            <View style={styles.notesDisplay}>
              {notes ? (
                <Text style={styles.notesText}>{notes}</Text>
              ) : (
                <Text style={styles.notesPlaceholder}>هێشتا تێبینییەک نەنووسراوە</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>مێژووی مامەڵەکان</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                transactionFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setTransactionFilter('all')}
            >
              <Text style={[
                styles.filterButtonText,
                transactionFilter === 'all' && styles.filterButtonTextActive
              ]}>هەموو</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                transactionFilter === 'debt' && styles.filterButtonActive
              ]}
              onPress={() => setTransactionFilter('debt')}
            >
              <Text style={[
                styles.filterButtonText,
                transactionFilter === 'debt' && styles.filterButtonTextActive
              ]}>پێدان</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                transactionFilter === 'payment' && styles.filterButtonActive
              ]}
              onPress={() => setTransactionFilter('payment')}
            >
              <Text style={[
                styles.filterButtonText,
                transactionFilter === 'payment' && styles.filterButtonTextActive
              ]}>وەرگرتن</Text>
            </TouchableOpacity>
          </View>
        </View>

        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {debtor.transactions.length === 0 
                ? 'هێشتا مامەڵەیەک نییە' 
                : transactionFilter === 'debt' 
                  ? 'هیچ مامەڵەیەکی پێدان نییە'
                  : 'هیچ مامەڵەیەکی وەرگرتن نییە'
              }
            </Text>
          </View>
        ) : (
          <View>
            {[...filteredTransactions].reverse().map((item) => (
              <View key={item.id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <View style={styles.transactionIcon}>
                    {item.type === 'debt' ? (
                      <ArrowUp size={20} color="#EF4444" />
                    ) : (
                      <ArrowDown size={20} color="#10B981" />
                    )}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>{item.description}</Text>
                    {item.createdBy && (
                      <Text style={styles.transactionCreatedBy}>
                        تۆمارکراوە لەلایەن: {item.createdBy.userName}
                      </Text>
                    )}
                    <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    item.type === 'debt' ? styles.transactionDebt : styles.transactionPayment
                  ]}>
                    {item.type === 'debt' ? '+' : '-'}{formatCurrency(item.amount)}
                  </Text>
                </View>
                <View style={styles.transactionActions}>
                  <TouchableOpacity
                    style={styles.transactionActionButton}
                    onPress={() => handleDeleteTransaction(item.id)}
                  >
                    <Trash2 size={16} color="#F87171" />
                    <Text style={[styles.transactionActionText, { color: '#F87171' }]}>سڕینەوە</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
          />
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>دەستکاریکردنی کڕیار</Text>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ناو *</Text>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="ناوی کڕیار"
                    placeholderTextColor="#64748B"
                    autoFocus
                    testID="edit-name-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ژمارەی تەلەفۆن *</Text>
                  <TextInput
                    style={styles.input}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="ژمارەی تەلەفۆن"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    testID="edit-phone-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>پۆلێن (دڵخواز)</Text>
                  <View style={styles.categoryButtons}>
                    <TouchableOpacity
                      style={[styles.categoryButton, editCategory === 'VIP' && styles.categoryButtonActive]}
                      onPress={() => setEditCategory(editCategory === 'VIP' ? undefined : 'VIP')}
                    >
                      <Text style={[styles.categoryButtonText, editCategory === 'VIP' && { color: CATEGORY_COLORS.VIP }]}>
                        {CATEGORY_LABELS.VIP}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryButton, editCategory === 'Regular' && styles.categoryButtonActive]}
                      onPress={() => setEditCategory(editCategory === 'Regular' ? undefined : 'Regular')}
                    >
                      <Text style={[styles.categoryButtonText, editCategory === 'Regular' && { color: CATEGORY_COLORS.Regular }]}>
                        {CATEGORY_LABELS.Regular}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.categoryButton, editCategory === 'Wholesale' && styles.categoryButtonActive]}
                      onPress={() => setEditCategory(editCategory === 'Wholesale' ? undefined : 'Wholesale')}
                    >
                      <Text style={[styles.categoryButtonText, editCategory === 'Wholesale' && { color: CATEGORY_COLORS.Wholesale }]}>
                        {CATEGORY_LABELS.Wholesale}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>رەنگی تایبەت (دڵخواز)</Text>
                  <View style={styles.colorTagButtons}>
                    {(Object.keys(COLOR_TAG_MAP) as ColorTag[]).map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorTagButton,
                          { backgroundColor: COLOR_TAG_MAP[color] + '33', borderColor: COLOR_TAG_MAP[color] },
                          editColorTag === color && styles.colorTagButtonActive,
                        ]}
                        onPress={() => setEditColorTag(editColorTag === color ? undefined : color)}
                      >
                        <View style={[styles.colorTagInner, { backgroundColor: COLOR_TAG_MAP[color] }]} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ڕێژەی سوود % (دڵخواز)</Text>
                  <TextInput
                    style={styles.input}
                    value={editInterestRate}
                    onChangeText={setEditInterestRate}
                    placeholder="بۆ نموونە: 5"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    testID="edit-interest-rate-input"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>پاشگەزبوونەوە</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitModalButton]}
                    onPress={handleEditDebtor}
                    testID="submit-edit-button"
                  >
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>پاشەکەوتکردن</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {transactionType === 'debt' ? 'پێدانی قەرز' : 'وەرگرتنەوەی قەرز'}
                </Text>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>بڕ *</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="بڕەکە بنووسە"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    autoFocus
                    testID="amount-input"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>وردەکاری *</Text>
                  <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="وردەکاری مامەڵەکە"
                    placeholderTextColor="#64748B"
                    testID="description-input"
                  />
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>پاشگەزبوونەوە</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitModalButton]}
                    onPress={handleAddTransaction}
                    testID="submit-transaction-button"
                  >
                    <LinearGradient
                      colors={transactionType === 'debt' ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>زیادکردن</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={pinModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setPinModalVisible(false);
          setPinInput('');
          setPinError('');
          setPendingDeleteTransactionId(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setPinModalVisible(false);
              setPinInput('');
              setPinError('');
              setPendingDeleteTransactionId(null);
            }}
          />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>پین کۆد بنووسە</Text>
                <Text style={styles.pinSubtitle}>بۆ سڕینەوەی مامەڵە پێویستە پین کۆد بنووسیت</Text>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.input}
                    value={pinInput}
                    onChangeText={(text) => {
                      setPinInput(text);
                      setPinError('');
                    }}
                    placeholder="پین کۆد"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    secureTextEntry
                    autoFocus
                    maxLength={6}
                    testID="pin-input"
                  />
                  {pinError ? (
                    <Text style={styles.pinErrorText}>{pinError}</Text>
                  ) : null}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setPinModalVisible(false);
                      setPinInput('');
                      setPinError('');
                      setPendingDeleteTransactionId(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>پاشگەزبوونەوە</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.submitModalButton]}
                    onPress={handleVerifyPinAndDelete}
                    testID="verify-pin-button"
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      style={styles.submitButtonGradient}
                    >
                      <Text style={styles.submitButtonText}>سڕینەوە</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#94A3B8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  debtorName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    textAlign: 'center',
  },
  dashboard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  dashboardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  dashboardLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 8,
  },
  dashboardAmount: {
    fontSize: 48,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  amountPositive: {
    color: '#F87171',
  },
  amountNegative: {
    color: '#34D399',
  },
  dashboardStatus: {
    fontSize: 16,
    color: '#CBD5E1',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  transactionsHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    textAlign: 'right',
    marginBottom: 12,
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
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  filterButtonTextActive: {
    color: '#60A5FA',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
  },
  transactionCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  transactionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionActions: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(71, 85, 105, 0.2)',
  },
  transactionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  transactionActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#60A5FA',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  transactionDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F1F5F9',
    marginBottom: 4,
    textAlign: 'right',
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
  },
  transactionCreatedBy: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#60A5FA',
    marginBottom: 2,
    textAlign: 'right',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  transactionDebt: {
    color: '#F87171',
  },
  transactionPayment: {
    color: '#34D399',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    textAlign: 'center',
  },
  modalForm: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F1F5F9',
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#CBD5E1',
  },
  submitModalButton: {
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  categoryButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    flexWrap: 'wrap',
  },
  categoryButton: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#60A5FA',
  },
  categoryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  colorTagButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorTagButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorTagButtonActive: {
    borderWidth: 3,
  },
  colorTagInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  pinSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  pinErrorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'right',
    marginTop: 4,
  },
  notesSection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    padding: 16,
  },
  notesSectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F1F5F9',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#60A5FA',
  },
  notesActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  cancelNotesButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
  },
  cancelNotesButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#CBD5E1',
  },
  saveNotesButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveNotesGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveNotesButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  notesDisplay: {
    minHeight: 60,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
  },
  notesText: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 22,
    textAlign: 'right',
  },
  notesPlaceholder: {
    fontSize: 15,
    color: '#64748B',
    fontStyle: 'italic' as const,
    textAlign: 'right',
  },
  notesInput: {
    fontSize: 15,
    color: '#F1F5F9',
    textAlign: 'right',
    paddingTop: 12,
  },
  limitContainer: {
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  limitInfo: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  limitPercentage: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  limitSection: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    padding: 16,
  },
  limitSectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  limitSectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F1F5F9',
  },
  limitDisplay: {
    minHeight: 48,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    justifyContent: 'center',
  },
  limitText: {
    fontSize: 18,
    color: '#E2E8F0',
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  limitPlaceholder: {
    fontSize: 15,
    color: '#64748B',
    fontStyle: 'italic' as const,
    textAlign: 'right',
  },
  limitInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    textAlign: 'right',
  },
});
