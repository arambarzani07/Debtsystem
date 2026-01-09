import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PaymentContract {
  id: string;
  debtorId: string;
  debtorName: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  endDate?: string;
  nextPaymentDate: string;
  totalPayments: number;
  completedPayments: number;
  autoExecute: boolean;
  isActive: boolean;
  createdAt: string;
  lastExecuted?: string;
  missedPayments: number;
  totalAmount: number;
  description?: string;
  penaltyRate?: number;
  earlyCompletionBonus?: number;
}

export default function SmartContractsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, addTransaction } = useDebt();
  const { language } = useLanguage();
  const isRTL = language === 'ku' || language === 'ar';

  const [contracts, setContracts] = useState<PaymentContract[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [totalPayments, setTotalPayments] = useState('12');
  const [autoExecute, setAutoExecute] = useState(true);
  const [description, setDescription] = useState('');
  const [penaltyRate, setPenaltyRate] = useState('5');
  const [earlyBonus, setEarlyBonus] = useState('10');

  useEffect(() => {
    loadContracts();
    const interval = setInterval(() => {
      checkAndExecuteContracts();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadContracts = async () => {
    try {
      const stored = await AsyncStorage.getItem('payment_contracts');
      if (stored) {
        setContracts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const saveContracts = async (newContracts: PaymentContract[]) => {
    try {
      await AsyncStorage.setItem('payment_contracts', JSON.stringify(newContracts));
      setContracts(newContracts);
    } catch (error) {
      console.error('Error saving contracts:', error);
    }
  };

  const calculateNextPaymentDate = (startDate: string, freq: string, paymentsCompleted: number): string => {
    const start = new Date(startDate);
    let daysToAdd = 0;

    switch (freq) {
      case 'daily':
        daysToAdd = paymentsCompleted + 1;
        break;
      case 'weekly':
        daysToAdd = (paymentsCompleted + 1) * 7;
        break;
      case 'biweekly':
        daysToAdd = (paymentsCompleted + 1) * 14;
        break;
      case 'monthly':
        const nextDate = new Date(start);
        nextDate.setMonth(start.getMonth() + (paymentsCompleted + 1));
        return nextDate.toISOString();
    }

    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + daysToAdd);
    return nextDate.toISOString();
  };

  const createContract = () => {
    if (!selectedDebtorId || !amount || !totalPayments) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'تکایە هەموو خانەکان پڕبکەرەوە' : 'Please fill all fields'
      );
      return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    if (!debtor) return;

    const contractAmount = parseFloat(amount);
    const payments = parseInt(totalPayments);
    const startDate = new Date().toISOString();

    const newContract: PaymentContract = {
      id: Date.now().toString(),
      debtorId: selectedDebtorId,
      debtorName: debtor.name,
      amount: contractAmount,
      frequency,
      startDate,
      nextPaymentDate: calculateNextPaymentDate(startDate, frequency, 0),
      totalPayments: payments,
      completedPayments: 0,
      autoExecute,
      isActive: true,
      createdAt: startDate,
      missedPayments: 0,
      totalAmount: contractAmount * payments,
      description,
      penaltyRate: parseFloat(penaltyRate) || 0,
      earlyCompletionBonus: parseFloat(earlyBonus) || 0,
    };

    saveContracts([...contracts, newContract]);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedDebtorId('');
    setAmount('');
    setFrequency('monthly');
    setTotalPayments('12');
    setAutoExecute(true);
    setDescription('');
    setPenaltyRate('5');
    setEarlyBonus('10');
  };

  const checkAndExecuteContracts = async () => {
    const now = new Date();
    let updated = false;

    const updatedContracts = contracts.map(contract => {
      if (!contract.isActive || !contract.autoExecute) return contract;

      const nextPayment = new Date(contract.nextPaymentDate);
      if (now >= nextPayment && contract.completedPayments < contract.totalPayments) {
        const debtor = debtors.find(d => d.id === contract.debtorId);
        if (debtor) {
          addTransaction(
            contract.debtorId,
            contract.amount,
            isRTL ? `وەرگرتنی خودکار - گرێبەستی پارەدان #${contract.id}` : `Auto payment - Contract #${contract.id}`,
            'payment'
          );

          updated = true;
          return {
            ...contract,
            completedPayments: contract.completedPayments + 1,
            lastExecuted: now.toISOString(),
            nextPaymentDate: calculateNextPaymentDate(
              contract.startDate,
              contract.frequency,
              contract.completedPayments + 1
            ),
            isActive: contract.completedPayments + 1 >= contract.totalPayments ? false : true,
          };
        }
      } else if (now > nextPayment && contract.completedPayments < contract.totalPayments) {
        updated = true;
        return {
          ...contract,
          missedPayments: contract.missedPayments + 1,
        };
      }

      return contract;
    });

    if (updated) {
      await saveContracts(updatedContracts);
    }
  };

  const toggleContractStatus = (contractId: string) => {
    const updated = contracts.map(c =>
      c.id === contractId ? { ...c, isActive: !c.isActive } : c
    );
    saveContracts(updated);
  };

  const deleteContract = (contractId: string) => {
    Alert.alert(
      isRTL ? 'سڕینەوەی گرێبەست' : 'Delete Contract',
      isRTL ? 'دڵنیای لە سڕینەوەی ئەم گرێبەستە؟' : 'Are you sure you want to delete this contract?',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'سڕینەوە' : 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = contracts.filter(c => c.id !== contractId);
            saveContracts(updated);
          },
        },
      ]
    );
  };

  const executeManualPayment = (contract: PaymentContract) => {
    const debtor = debtors.find(d => d.id === contract.debtorId);
    if (!debtor) return;

    addTransaction(
      contract.debtorId,
      contract.amount,
      isRTL ? `وەرگرتنی دەستی - گرێبەستی پارەدان #${contract.id}` : `Manual payment - Contract #${contract.id}`,
      'payment'
    );

    const updated = contracts.map(c =>
      c.id === contract.id
        ? {
            ...c,
            completedPayments: c.completedPayments + 1,
            lastExecuted: new Date().toISOString(),
            nextPaymentDate: calculateNextPaymentDate(c.startDate, c.frequency, c.completedPayments + 1),
            isActive: c.completedPayments + 1 >= c.totalPayments ? false : true,
          }
        : c
    );
    saveContracts(updated);
  };

  const getFrequencyText = (freq: string) => {
    const texts: Record<string, { ku: string; en: string }> = {
      daily: { ku: 'ڕۆژانە', en: 'Daily' },
      weekly: { ku: 'هەفتانە', en: 'Weekly' },
      biweekly: { ku: 'هەر دوو هەفتە جارێک', en: 'Bi-weekly' },
      monthly: { ku: 'مانگانە', en: 'Monthly' },
    };
    return isRTL ? texts[freq].ku : texts[freq].en;
  };

  const getProgress = (contract: PaymentContract) => {
    return (contract.completedPayments / contract.totalPayments) * 100;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <LinearGradient colors={[colors.primary, colors.primary + 'CC']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.background} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.background }]}>
            {isRTL ? 'گرێبەستە زیرەکەکان' : 'Smart Contracts'}
          </Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Plus color={colors.background} size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <FileText color={colors.primary} size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {contracts.filter(c => c.isActive).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'گرێبەستی چالاک' : 'Active Contracts'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <CheckCircle color="#4CAF50" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {contracts.reduce((sum, c) => sum + c.completedPayments, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'پارەدانی تەواو' : 'Completed'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <AlertTriangle color="#FF9800" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {contracts.reduce((sum, c) => sum + c.missedPayments, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'پارەدانی لەدەستچوو' : 'Missed'}
            </Text>
          </View>
        </View>

        {contracts.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText color={colors.textSecondary} size={64} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isRTL ? 'هیچ گرێبەستێک نییە' : 'No contracts yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {isRTL ? 'دوگمەی + دابگرە بۆ دروستکردنی گرێبەستی یەکەم' : 'Tap + to create your first contract'}
            </Text>
          </View>
        ) : (
          <View style={styles.contractsList}>
            {contracts.map(contract => (
              <View key={contract.id} style={[styles.contractCard, { backgroundColor: colors.card }]}>
                <View style={styles.contractHeader}>
                  <View style={styles.contractInfo}>
                    <Text style={[styles.contractName, { color: colors.text }]}>
                      {contract.debtorName}
                    </Text>
                    <Text style={[styles.contractDesc, { color: colors.textSecondary }]}>
                      {contract.description || (isRTL ? 'گرێبەستی پارەدان' : 'Payment Contract')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: contract.isActive ? '#4CAF50' : '#9E9E9E' }]}>
                    <Text style={styles.statusText}>
                      {contract.isActive ? (isRTL ? 'چالاک' : 'Active') : (isRTL ? 'ناچالاک' : 'Inactive')}
                    </Text>
                  </View>
                </View>

                <View style={styles.contractDetails}>
                  <View style={styles.detailRow}>
                    <DollarSign color={colors.primary} size={16} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {contract.amount.toLocaleString('en-US')} × {contract.totalPayments} = {contract.totalAmount.toLocaleString('en-US')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock color={colors.primary} size={16} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {getFrequencyText(contract.frequency)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Calendar color={colors.primary} size={16} />
                    <Text style={[styles.detailText, { color: colors.text }]}>
                      {isRTL ? 'پارەدانی داهاتوو: ' : 'Next: '}
                      {new Date(contract.nextPaymentDate).toLocaleDateString(isRTL ? 'ar-IQ' : 'en-US')}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressText, { color: colors.text }]}>
                      {contract.completedPayments} / {contract.totalPayments}
                    </Text>
                    <Text style={[styles.progressPercent, { color: colors.primary }]}>
                      {getProgress(contract).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.primary, width: `${getProgress(contract)}%` },
                      ]}
                    />
                  </View>
                </View>

                {contract.missedPayments > 0 && (
                  <View style={styles.warningBox}>
                    <AlertTriangle color="#FF9800" size={16} />
                    <Text style={[styles.warningText, { color: '#FF9800' }]}>
                      {isRTL ? `${contract.missedPayments} پارەدانی لەدەستچوو` : `${contract.missedPayments} missed payments`}
                    </Text>
                  </View>
                )}

                <View style={styles.contractActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    onPress={() => executeManualPayment(contract)}
                    disabled={!contract.isActive || contract.completedPayments >= contract.totalPayments}
                  >
                    <Play color={colors.background} size={16} />
                    <Text style={[styles.actionButtonText, { color: colors.background }]}>
                      {isRTL ? 'جێبەجێکردن' : 'Execute'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: contract.isActive ? '#FF9800' : '#4CAF50' }]}
                    onPress={() => toggleContractStatus(contract.id)}
                  >
                    {contract.isActive ? <Pause color="#FFF" size={16} /> : <Play color="#FFF" size={16} />}
                    <Text style={styles.actionButtonText}>
                      {contract.isActive ? (isRTL ? 'وەستان' : 'Pause') : (isRTL ? 'دەستپێکردن' : 'Resume')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                    onPress={() => deleteContract(contract.id)}
                  >
                    <Trash2 color="#FFF" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isRTL ? 'گرێبەستی نوێ' : 'New Contract'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <XCircle color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'هەڵبژاردنی قەرزدار' : 'Select Debtor'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.debtorsList}>
                {debtors.map(debtor => (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[
                      styles.debtorItem,
                      { backgroundColor: selectedDebtorId === debtor.id ? colors.primary : colors.background },
                    ]}
                    onPress={() => setSelectedDebtorId(debtor.id)}
                  >
                    <Text
                      style={[
                        styles.debtorItemText,
                        { color: selectedDebtorId === debtor.id ? colors.background : colors.text },
                      ]}
                    >
                      {debtor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'بڕی هەر پارەدانێک' : 'Amount per Payment'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'دووبارەبوونەوە' : 'Frequency'}
              </Text>
              <View style={styles.frequencyButtons}>
                {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      { backgroundColor: frequency === freq ? colors.primary : colors.background },
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        { color: frequency === freq ? colors.background : colors.text },
                      ]}
                    >
                      {getFrequencyText(freq)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'ژمارەی پارەدانەکان' : 'Total Payments'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={totalPayments}
                onChangeText={setTotalPayments}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'وەسف' : 'Description'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder={isRTL ? 'وەسف...' : 'Description...'}
                placeholderTextColor={colors.textSecondary}
              />

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  {isRTL ? 'جێبەجێکردنی خودکار' : 'Auto Execute'}
                </Text>
                <Switch value={autoExecute} onValueChange={setAutoExecute} />
              </View>

              <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={createContract}>
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {isRTL ? 'دروستکردن' : 'Create Contract'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  contractsList: {
    gap: 16,
  },
  contractCard: {
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contractInfo: {
    flex: 1,
    gap: 4,
  },
  contractName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contractDesc: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contractDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contractActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  debtorsList: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  debtorItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  debtorItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    marginTop: 24,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
