import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Animated,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Plus, X, TrendingUp, TrendingDown, Users } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import type { Debtor } from '@/types';

interface FloatingActionButtonProps {
  onAddDebtor?: () => void;
}

export default function FloatingActionButton({ onAddDebtor }: FloatingActionButtonProps) {
  const { colors } = useTheme();
  const { debtors, addTransaction } = useDebt();
  const router = useRouter();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickDebtModal, setShowQuickDebtModal] = useState(false);
  const [showQuickPaymentModal, setShowQuickPaymentModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [rotation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.spring(rotation, {
      toValue,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const handleQuickDebt = () => {
    setIsExpanded(false);
    setAmount('');
    setDescription('');
    setSearchQuery('');
    setSelectedDebtor(null);
    setShowQuickDebtModal(true);
  };

  const handleQuickPayment = () => {
    setIsExpanded(false);
    setAmount('');
    setDescription('');
    setSearchQuery('');
    setSelectedDebtor(null);
    setShowQuickPaymentModal(true);
  };

  const handleAddDebtor = () => {
    setIsExpanded(false);
    if (onAddDebtor) {
      onAddDebtor();
    } else {
      router.push('/add-debtor' as any);
    }
  };

  const handleSubmitTransaction = async (type: 'debt' | 'payment') => {
    if (!selectedDebtor) {
      Alert.alert('هەڵە', 'تکایە کڕیارێک هەڵبژێرە');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('هەڵە', 'تکایە بڕێکی دروست بنووسە');
      return;
    }

    if (!description.trim()) {
      Alert.alert('هەڵە', 'تکایە وردەکاری بنووسە');
      return;
    }

    try {
      await addTransaction(
        selectedDebtor.id,
        parsedAmount,
        description,
        type
      );

      Alert.alert(
        'سەرکەوتوو',
        type === 'debt' 
          ? `قەرزی ${parsedAmount.toLocaleString('en-US')} بۆ ${selectedDebtor.name} زیادکرا`
          : `پارەدانەوەی ${parsedAmount.toLocaleString('en-US')} لە ${selectedDebtor.name} تۆمارکرا`,
        [
          {
            text: 'باشە',
            onPress: () => {
              setShowQuickDebtModal(false);
              setShowQuickPaymentModal(false);
              setAmount('');
              setDescription('');
              setSearchQuery('');
              setSelectedDebtor(null);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('هەڵە', 'کێشەیەک ڕوویدا لە کاتی تۆمارکردنی مامەڵەکە');
    }
  };

  const filteredDebtors = debtors.filter(debtor =>
    debtor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (debtor.phone && debtor.phone.includes(searchQuery))
  );

  const renderQuickModal = (type: 'debt' | 'payment') => {
    const isDebt = type === 'debt';
    const visible = isDebt ? showQuickDebtModal : showQuickPaymentModal;
    const setVisible = isDebt ? setShowQuickDebtModal : setShowQuickPaymentModal;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setVisible(false);
          setAmount('');
          setDescription('');
          setSearchQuery('');
          setSelectedDebtor(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isDebt ? 'زیادکردنی قەرز' : 'زیادکردنی دانەوە'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setVisible(false);
                  setAmount('');
                  setDescription('');
                  setSearchQuery('');
                  setSelectedDebtor(null);
                }}
                style={styles.closeButton}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {!selectedDebtor ? (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>هەڵبژاردنی کڕیار</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                    placeholder="گەڕان بە ناو یان ژمارە..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <ScrollView style={styles.debtorList} showsVerticalScrollIndicator={false}>
                    {filteredDebtors.map((debtor) => (
                      <TouchableOpacity
                        key={debtor.id}
                        style={[styles.debtorItem, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                        onPress={() => {
                          setSelectedDebtor(debtor);
                          Keyboard.dismiss();
                        }}
                      >
                        <View>
                          <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                          {debtor.phone && (
                            <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>{debtor.phone}</Text>
                          )}
                        </View>
                        <Text style={[styles.debtorAmount, { color: debtor.totalDebt > 0 ? colors.error : colors.success }]}>
                          {Math.abs(debtor.totalDebt).toLocaleString('en-US')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.selectedDebtorCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                    onPress={() => setSelectedDebtor(null)}
                  >
                    <View>
                      <Text style={[styles.selectedDebtorName, { color: colors.text }]}>{selectedDebtor.name}</Text>
                      <Text style={[styles.changeText, { color: colors.primary }]}>گۆڕین</Text>
                    </View>
                    <Text style={[styles.selectedDebtorAmount, { color: selectedDebtor.totalDebt > 0 ? colors.error : colors.success }]}>
                      {Math.abs(selectedDebtor.totalDebt).toLocaleString('en-US')}
                    </Text>
                  </TouchableOpacity>

                  <Text style={[styles.label, { color: colors.text }]}>بڕ</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />

                  <Text style={[styles.label, { color: colors.text }]}>وردەکاری</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
                    placeholder="وردەکاری مامەڵەکە بنووسە..."
                    placeholderTextColor={colors.textTertiary}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: isDebt ? '#EF4444' : '#22C55E' }]}
                    onPress={() => handleSubmitTransaction(type)}
                  >
                    <Text style={styles.submitButtonText}>
                      {isDebt ? 'زیادکردنی قەرز' : 'زیادکردنی دانەوە'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <View style={styles.fabContainer}>
        {isExpanded && (
          <>
            <View style={styles.backdrop} pointerEvents="none" />
            
            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: '#EF4444', bottom: 200 }]}
              onPress={handleQuickDebt}
              activeOpacity={0.8}
            >
              <TrendingUp size={24} color="#FFFFFF" />
              <Text style={styles.fabOptionLabel}>قەرز</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: '#22C55E', bottom: 140 }]}
              onPress={handleQuickPayment}
              activeOpacity={0.8}
            >
              <TrendingDown size={24} color="#FFFFFF" />
              <Text style={styles.fabOptionLabel}>دانەوە</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: colors.primary, bottom: 80 }]}
              onPress={handleAddDebtor}
              activeOpacity={0.8}
            >
              <Users size={24} color="#FFFFFF" />
              <Text style={styles.fabOptionLabel}>کڕیار</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={toggleExpand}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Plus size={28} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {renderQuickModal('debt')}
      {renderQuickModal('payment')}
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute' as const,
    bottom: 24,
    left: 24,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute' as const,
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabOption: {
    position: 'absolute' as const,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabOptionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 16,
  },
  debtorList: {
    maxHeight: 400,
  },
  debtorItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  debtorPhone: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
  },
  debtorAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  selectedDebtorCard: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  selectedDebtorName: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  changeText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
  },
  selectedDebtorAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
});
