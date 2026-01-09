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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Users,

  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  UserPlus,
  Split,

} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SplitParty {
  debtorId: string;
  debtorName: string;
  splitType: 'equal' | 'percentage' | 'fixed';
  amount?: number;
  percentage?: number;
}

interface MultiPartyDebt {
  id: string;
  name: string;
  totalAmount: number;
  description: string;
  parties: SplitParty[];
  createdAt: string;
  isSettled: boolean;
  createdBy?: string;
}

export default function MultiPartyDebtScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, addTransaction } = useDebt();
  const { language } = useLanguage();
  const isRTL = language === 'ku' || language === 'ar';

  const [debts, setDebts] = useState<MultiPartyDebt[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);

  const [debtName, setDebtName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [parties, setParties] = useState<SplitParty[]>([]);

  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'percentage' | 'fixed'>('equal');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitPercentage, setSplitPercentage] = useState('');

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    try {
      const stored = await AsyncStorage.getItem('multi_party_debts');
      if (stored) {
        setDebts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading debts:', error);
    }
  };

  const saveDebts = async (newDebts: MultiPartyDebt[]) => {
    try {
      await AsyncStorage.setItem('multi_party_debts', JSON.stringify(newDebts));
      setDebts(newDebts);
    } catch (error) {
      console.error('Error saving debts:', error);
    }
  };

  const calculateSplits = (total: number, partiesList: SplitParty[]): SplitParty[] => {
    const equalCount = partiesList.filter(p => p.splitType === 'equal').length;
    const fixedTotal = partiesList
      .filter(p => p.splitType === 'fixed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const percentageTotal = partiesList
      .filter(p => p.splitType === 'percentage')
      .reduce((sum, p) => sum + ((p.percentage || 0) * total) / 100, 0);

    const remaining = total - fixedTotal - percentageTotal;
    const equalAmount = equalCount > 0 ? remaining / equalCount : 0;

    return partiesList.map(party => {
      if (party.splitType === 'equal') {
        return { ...party, amount: equalAmount };
      } else if (party.splitType === 'percentage') {
        return { ...party, amount: ((party.percentage || 0) * total) / 100 };
      }
      return party;
    });
  };

  const addPartyToList = () => {
    if (!selectedDebtorId) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'قەرزدار هەڵبژێرە' : 'Select a debtor'
      );
      return;
    }

    if (parties.find(p => p.debtorId === selectedDebtorId)) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ئەم قەرزدارە پێشتر زیادکراوە' : 'Debtor already added'
      );
      return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    if (!debtor) return;

    if (splitType === 'fixed' && !splitAmount) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'بڕەکە بنووسە' : 'Enter amount'
      );
      return;
    }

    if (splitType === 'percentage' && !splitPercentage) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ڕێژەکە بنووسە' : 'Enter percentage'
      );
      return;
    }

    const newParty: SplitParty = {
      debtorId: debtor.id,
      debtorName: debtor.name,
      splitType,
      amount: splitType === 'fixed' ? parseFloat(splitAmount) : undefined,
      percentage: splitType === 'percentage' ? parseFloat(splitPercentage) : undefined,
    };

    setParties([...parties, newParty]);
    setSelectedDebtorId('');
    setSplitAmount('');
    setSplitPercentage('');
    setShowAddPartyModal(false);
  };

  const removeParty = (debtorId: string) => {
    setParties(parties.filter(p => p.debtorId !== debtorId));
  };

  const createDebt = () => {
    if (!debtName || !totalAmount || parties.length < 2) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ناو، بڕ، و لانیکەم دوو قەرزدار پێویستە' : 'Name, amount, and at least 2 parties required'
      );
      return;
    }

    const total = parseFloat(totalAmount);
    const calculatedParties = calculateSplits(total, parties);

    const newDebt: MultiPartyDebt = {
      id: Date.now().toString(),
      name: debtName,
      totalAmount: total,
      description,
      parties: calculatedParties,
      createdAt: new Date().toISOString(),
      isSettled: false,
    };

    saveDebts([...debts, newDebt]);
    resetForm();
    setShowAddModal(false);
  };

  const resetForm = () => {
    setDebtName('');
    setTotalAmount('');
    setDescription('');
    setParties([]);
  };

  const settleDebt = (debt: MultiPartyDebt) => {
    Alert.alert(
      isRTL ? 'تەواوکردنی قەرز' : 'Settle Debt',
      isRTL
        ? 'ئەم کارە قەرزەکە بۆ هەموو لایەنەکان زیاد دەکات'
        : 'This will add the debt to all parties',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'تەواوکردن' : 'Settle',
          onPress: () => {
            debt.parties.forEach(party => {
              if (party.amount && party.amount > 0) {
                addTransaction(
                  party.debtorId,
                  party.amount,
                  `${debt.name} - ${isRTL ? 'قەرزی هاوبەش' : 'Shared Debt'}`,
                  'debt'
                );
              }
            });

            const updated = debts.map(d =>
              d.id === debt.id ? { ...d, isSettled: true } : d
            );
            saveDebts(updated);

            Alert.alert(
              isRTL ? 'سەرکەوتوو' : 'Success',
              isRTL ? 'قەرزەکە تەواو کرا' : 'Debt settled successfully'
            );
          },
        },
      ]
    );
  };

  const deleteDebt = (debtId: string) => {
    Alert.alert(
      isRTL ? 'سڕینەوە' : 'Delete',
      isRTL ? 'دڵنیای لە سڕینەوە؟' : 'Are you sure?',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'سڕینەوە' : 'Delete',
          style: 'destructive',
          onPress: () => {
            saveDebts(debts.filter(d => d.id !== debtId));
          },
        },
      ]
    );
  };

  const getSplitTypeText = (type: string) => {
    const texts: Record<string, { ku: string; en: string }> = {
      equal: { ku: 'یەکسان', en: 'Equal' },
      percentage: { ku: 'ڕێژە', en: 'Percentage' },
      fixed: { ku: 'دیاریکراو', en: 'Fixed' },
    };
    return isRTL ? texts[type].ku : texts[type].en;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <LinearGradient colors={[colors.primary, colors.primary + 'CC']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.background} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.background }]}>
            {isRTL ? 'دابەشکردنی قەرز' : 'Split Debt'}
          </Text>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Plus color={colors.background} size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Split color={colors.primary} size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {debts.filter(d => !d.isSettled).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'قەرزی چالاک' : 'Active Splits'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <CheckCircle2 color="#4CAF50" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {debts.filter(d => d.isSettled).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'تەواو کراوە' : 'Settled'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Users color="#FF9800" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {debts.reduce((sum, d) => sum + d.parties.length, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'کۆی لایەنەکان' : 'Total Parties'}
            </Text>
          </View>
        </View>

        {debts.length === 0 ? (
          <View style={styles.emptyState}>
            <Split color={colors.textSecondary} size={64} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {isRTL ? 'هیچ قەرزێکی دابەشکراو نییە' : 'No split debts yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {isRTL ? 'دوگمەی + دابگرە' : 'Tap + to create'}
            </Text>
          </View>
        ) : (
          <View style={styles.debtsList}>
            {debts.map(debt => (
              <View key={debt.id} style={[styles.debtCard, { backgroundColor: colors.card }]}>
                <View style={styles.debtHeader}>
                  <View style={styles.debtInfo}>
                    <Text style={[styles.debtName, { color: colors.text }]}>{debt.name}</Text>
                    {debt.description && (
                      <Text style={[styles.debtDesc, { color: colors.textSecondary }]}>
                        {debt.description}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: debt.isSettled ? '#4CAF50' : '#FF9800' }]}>
                    <Text style={styles.statusText}>
                      {debt.isSettled ? (isRTL ? 'تەواو' : 'Settled') : (isRTL ? 'چالاک' : 'Active')}
                    </Text>
                  </View>
                </View>

                <View style={styles.debtAmount}>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                    {isRTL ? 'کۆی گشتی:' : 'Total Amount:'}
                  </Text>
                  <Text style={[styles.amountValue, { color: colors.primary }]}>
                    {debt.totalAmount.toLocaleString('en-US')}
                  </Text>
                </View>

                <View style={styles.partiesSection}>
                  <Text style={[styles.partiesTitle, { color: colors.text }]}>
                    {isRTL ? 'لایەنەکان:' : 'Parties:'}
                  </Text>
                  {debt.parties.map((party, index) => (
                    <View key={index} style={styles.partyRow}>
                      <View style={styles.partyInfo}>
                        <Text style={[styles.partyName, { color: colors.text }]}>
                          {party.debtorName}
                        </Text>
                        <Text style={[styles.partySplit, { color: colors.textSecondary }]}>
                          {getSplitTypeText(party.splitType)}
                          {party.percentage && ` (${party.percentage}%)`}
                        </Text>
                      </View>
                      <Text style={[styles.partyAmount, { color: colors.primary }]}>
                        {party.amount?.toLocaleString('en-US') || '0'}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.debtActions}>
                  {!debt.isSettled && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => settleDebt(debt)}
                    >
                      <CheckCircle2 color={colors.background} size={16} />
                      <Text style={[styles.actionButtonText, { color: colors.background }]}>
                        {isRTL ? 'تەواوکردن' : 'Settle'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                    onPress={() => deleteDebt(debt.id)}
                  >
                    <Trash2 color="#FFF" size={16} />
                    <Text style={styles.actionButtonText}>
                      {isRTL ? 'سڕینەوە' : 'Delete'}
                    </Text>
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
                {isRTL ? 'قەرزی نوێ' : 'New Split Debt'}
              </Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <XCircle color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'ناو' : 'Name'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={debtName}
                onChangeText={setDebtName}
                placeholder={isRTL ? 'ناوی قەرز...' : 'Debt name...'}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'کۆی گشتی' : 'Total Amount'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="numeric"
                placeholder="0"
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

              <View style={styles.partiesHeader}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {isRTL ? 'لایەنەکان' : 'Parties'} ({parties.length})
                </Text>
                <TouchableOpacity
                  style={[styles.addPartyButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowAddPartyModal(true)}
                >
                  <UserPlus color={colors.background} size={16} />
                  <Text style={[styles.addPartyButtonText, { color: colors.background }]}>
                    {isRTL ? 'زیادکردن' : 'Add Party'}
                  </Text>
                </TouchableOpacity>
              </View>

              {parties.length > 0 && (
                <View style={styles.partiesList}>
                  {parties.map((party, index) => (
                    <View key={index} style={[styles.partyItem, { backgroundColor: colors.background }]}>
                      <View style={styles.partyItemInfo}>
                        <Text style={[styles.partyItemName, { color: colors.text }]}>
                          {party.debtorName}
                        </Text>
                        <Text style={[styles.partyItemType, { color: colors.textSecondary }]}>
                          {getSplitTypeText(party.splitType)}
                          {party.percentage && ` (${party.percentage}%)`}
                          {party.amount && party.splitType === 'fixed' && ` (${party.amount})`}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeParty(party.debtorId)}>
                        <Trash2 color={colors.error} size={18} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={createDebt}
              >
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {isRTL ? 'دروستکردن' : 'Create'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddPartyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isRTL ? 'زیادکردنی لایەن' : 'Add Party'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddPartyModal(false)}>
                <XCircle color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'هەڵبژاردنی قەرزدار' : 'Select Debtor'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.debtorsList}>
                {debtors
                  .filter(d => !parties.find(p => p.debtorId === d.id))
                  .map(debtor => (
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
                {isRTL ? 'جۆری دابەشکردن' : 'Split Type'}
              </Text>
              <View style={styles.splitTypeButtons}>
                {(['equal', 'percentage', 'fixed'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.splitTypeButton,
                      { backgroundColor: splitType === type ? colors.primary : colors.background },
                    ]}
                    onPress={() => setSplitType(type)}
                  >
                    <Text
                      style={[
                        styles.splitTypeButtonText,
                        { color: splitType === type ? colors.background : colors.text },
                      ]}
                    >
                      {getSplitTypeText(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {splitType === 'fixed' && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {isRTL ? 'بڕ' : 'Amount'}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    value={splitAmount}
                    onChangeText={setSplitAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              )}

              {splitType === 'percentage' && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {isRTL ? 'ڕێژە (%)' : 'Percentage (%)'}
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    value={splitPercentage}
                    onChangeText={setSplitPercentage}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={addPartyToList}
              >
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {isRTL ? 'زیادکردن' : 'Add'}
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
  },
  debtsList: {
    gap: 16,
  },
  debtCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  debtInfo: {
    flex: 1,
    gap: 4,
  },
  debtName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  debtDesc: {
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
  debtAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  partiesSection: {
    gap: 8,
  },
  partiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  partyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  partyInfo: {
    flex: 1,
    gap: 2,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
  },
  partySplit: {
    fontSize: 12,
  },
  partyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  debtActions: {
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
  partiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  addPartyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addPartyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  partiesList: {
    gap: 8,
    marginTop: 8,
  },
  partyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  partyItemInfo: {
    flex: 1,
    gap: 2,
  },
  partyItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  partyItemType: {
    fontSize: 12,
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
  splitTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  splitTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
