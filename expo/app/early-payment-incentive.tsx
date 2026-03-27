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
  Gift,
  Award,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface IncentiveRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minDaysEarly: number;
  minDebtAmount?: number;
  isActive: boolean;
  createdAt: string;
}

interface DebtorIncentive {
  id: string;
  debtorId: string;
  debtorName: string;
  ruleId: string;
  ruleName: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  daysEarly: number;
  appliedAt: string;
  paid: boolean;
}

export default function EarlyPaymentIncentiveScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, addTransaction } = useDebt();
  const { language } = useLanguage();
  const isRTL = language === 'ku' || language === 'ar';

  const [rules, setRules] = useState<IncentiveRule[]>([]);
  const [incentives, setIncentives] = useState<DebtorIncentive[]>([]);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState<'percentage' | 'fixed'>('percentage');
  const [ruleValue, setRuleValue] = useState('');
  const [minDaysEarly, setMinDaysEarly] = useState('7');
  const [minDebtAmount, setMinDebtAmount] = useState('');

  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [daysEarly, setDaysEarly] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesData, incentivesData] = await Promise.all([
        AsyncStorage.getItem('incentive_rules'),
        AsyncStorage.getItem('debtor_incentives'),
      ]);

      if (rulesData) setRules(JSON.parse(rulesData));
      if (incentivesData) setIncentives(JSON.parse(incentivesData));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveRules = async (newRules: IncentiveRule[]) => {
    try {
      await AsyncStorage.setItem('incentive_rules', JSON.stringify(newRules));
      setRules(newRules);
    } catch (error) {
      console.error('Error saving rules:', error);
    }
  };

  const saveIncentives = async (newIncentives: DebtorIncentive[]) => {
    try {
      await AsyncStorage.setItem('debtor_incentives', JSON.stringify(newIncentives));
      setIncentives(newIncentives);
    } catch (error) {
      console.error('Error saving incentives:', error);
    }
  };

  const createRule = () => {
    if (!ruleName || !ruleValue) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ناو و بەها پێویستە' : 'Name and value required'
      );
      return;
    }

    const value = parseFloat(ruleValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'بەهای نادروست' : 'Invalid value'
      );
      return;
    }

    if (ruleType === 'percentage' && value > 100) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ڕێژە نابێت لە ١٠٠ زیاتر بێت' : 'Percentage cannot exceed 100'
      );
      return;
    }

    const newRule: IncentiveRule = {
      id: Date.now().toString(),
      name: ruleName,
      type: ruleType,
      value,
      minDaysEarly: parseInt(minDaysEarly) || 0,
      minDebtAmount: minDebtAmount ? parseFloat(minDebtAmount) : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    saveRules([...rules, newRule]);
    resetRuleForm();
    setShowAddRuleModal(false);
  };

  const resetRuleForm = () => {
    setRuleName('');
    setRuleType('percentage');
    setRuleValue('');
    setMinDaysEarly('7');
    setMinDebtAmount('');
  };

  const deleteRule = (ruleId: string) => {
    Alert.alert(
      isRTL ? 'سڕینەوە' : 'Delete',
      isRTL ? 'دڵنیای؟' : 'Are you sure?',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'سڕینەوە' : 'Delete',
          style: 'destructive',
          onPress: () => {
            saveRules(rules.filter(r => r.id !== ruleId));
          },
        },
      ]
    );
  };

  const toggleRuleStatus = (ruleId: string) => {
    const updated = rules.map(r => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    saveRules(updated);
  };

  const applyIncentive = () => {
    if (!selectedDebtorId || !selectedRuleId || !paymentAmount || !daysEarly) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'هەموو خانەکان پڕبکەرەوە' : 'Fill all fields'
      );
      return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    const rule = rules.find(r => r.id === selectedRuleId);
    if (!debtor || !rule) return;

    const amount = parseFloat(paymentAmount);
    const days = parseInt(daysEarly);

    if (days < rule.minDaysEarly) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL
          ? `لانیکەم ${rule.minDaysEarly} ڕۆژ پێویستە`
          : `Minimum ${rule.minDaysEarly} days required`
      );
      return;
    }

    if (rule.minDebtAmount && amount < rule.minDebtAmount) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL
          ? `کەمترین بڕ ${rule.minDebtAmount}`
          : `Minimum amount ${rule.minDebtAmount}`
      );
      return;
    }

    const discountAmount =
      rule.type === 'percentage' ? (amount * rule.value) / 100 : rule.value;
    const finalAmount = amount - discountAmount;

    const newIncentive: DebtorIncentive = {
      id: Date.now().toString(),
      debtorId: debtor.id,
      debtorName: debtor.name,
      ruleId: rule.id,
      ruleName: rule.name,
      originalAmount: amount,
      discountAmount,
      finalAmount,
      daysEarly: days,
      appliedAt: new Date().toISOString(),
      paid: false,
    };

    saveIncentives([...incentives, newIncentive]);
    setShowApplyModal(false);
    resetApplyForm();

    Alert.alert(
      isRTL ? 'سەرکەوتوو' : 'Success',
      isRTL
        ? `داشکاندن: ${discountAmount.toLocaleString('en-US')}\nکۆی کۆتایی: ${finalAmount.toLocaleString('en-US')}`
        : `Discount: ${discountAmount.toLocaleString('en-US')}\nFinal: ${finalAmount.toLocaleString('en-US')}`
    );
  };

  const resetApplyForm = () => {
    setSelectedDebtorId('');
    setSelectedRuleId('');
    setPaymentAmount('');
    setDaysEarly('');
  };

  const markAsPaid = (incentiveId: string) => {
    Alert.alert(
      isRTL ? 'پارەدان' : 'Payment',
      isRTL ? 'نیشانەکردن وەک پارەدراو؟' : 'Mark as paid?',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'پارەدراو' : 'Paid',
          onPress: () => {
            const incentive = incentives.find(i => i.id === incentiveId);
            if (!incentive) return;

            addTransaction(
              incentive.debtorId,
              incentive.finalAmount,
              `${incentive.ruleName} - ${isRTL ? 'پارەدانی زوو' : 'Early Payment'}`,
              'payment'
            );

            const updated = incentives.map(i =>
              i.id === incentiveId ? { ...i, paid: true } : i
            );
            saveIncentives(updated);
          },
        },
      ]
    );
  };

  const deleteIncentive = (incentiveId: string) => {
    Alert.alert(
      isRTL ? 'سڕینەوە' : 'Delete',
      isRTL ? 'دڵنیای؟' : 'Are you sure?',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'سڕینەوە' : 'Delete',
          style: 'destructive',
          onPress: () => {
            saveIncentives(incentives.filter(i => i.id !== incentiveId));
          },
        },
      ]
    );
  };

  const totalDiscounts = incentives.reduce((sum, i) => sum + i.discountAmount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <LinearGradient colors={[colors.primary, colors.primary + 'CC']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.background} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.background }]}>
            {isRTL ? 'پارەدانی زوو' : 'Early Payment'}
          </Text>
          <TouchableOpacity onPress={() => setShowAddRuleModal(true)} style={styles.addButton}>
            <Plus color={colors.background} size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Gift color={colors.primary} size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {rules.filter(r => r.isActive).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'یاسا' : 'Rules'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Award color="#4CAF50" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {incentives.filter(i => i.paid).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'پارەدراو' : 'Paid'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <TrendingUp color="#FF9800" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalDiscounts.toLocaleString('en-US')}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'داشکاندن' : 'Discounts'}
            </Text>
          </View>
        </View>

        <View style={styles.applyButton}>
          <TouchableOpacity
            style={[styles.largeButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowApplyModal(true)}
          >
            <Zap color={colors.background} size={20} />
            <Text style={[styles.largeButtonText, { color: colors.background }]}>
              {isRTL ? 'جێبەجێکردنی هاندەر' : 'Apply Incentive'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isRTL ? 'یاساکانی هاندەر' : 'Incentive Rules'}
          </Text>

          {rules.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Gift color={colors.textSecondary} size={48} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isRTL ? 'هیچ یاسایەک نییە' : 'No rules yet'}
              </Text>
            </View>
          ) : (
            rules.map(rule => (
              <View key={rule.id} style={[styles.ruleCard, { backgroundColor: colors.card }]}>
                <View style={styles.ruleHeader}>
                  <View style={styles.ruleInfo}>
                    <Text style={[styles.ruleName, { color: colors.text }]}>{rule.name}</Text>
                    <Text style={[styles.ruleDetails, { color: colors.textSecondary }]}>
                      {rule.type === 'percentage' ? `${rule.value}%` : rule.value.toLocaleString('en-US')}{' '}
                      {isRTL ? 'داشکاندن' : 'discount'}
                    </Text>
                    <Text style={[styles.ruleCondition, { color: colors.textSecondary }]}>
                      {isRTL ? `لانیکەم ${rule.minDaysEarly} ڕۆژ` : `Min ${rule.minDaysEarly} days early`}
                      {rule.minDebtAmount &&
                        ` • ${isRTL ? 'کەمترین بڕ' : 'Min'} ${rule.minDebtAmount.toLocaleString('en-US')}`}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: rule.isActive ? '#4CAF50' : '#9E9E9E' }]}>
                    <Text style={styles.statusText}>
                      {rule.isActive ? (isRTL ? 'چالاک' : 'Active') : (isRTL ? 'ناچالاک' : 'Inactive')}
                    </Text>
                  </View>
                </View>

                <View style={styles.ruleActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: rule.isActive ? '#FF9800' : '#4CAF50' }]}
                    onPress={() => toggleRuleStatus(rule.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {rule.isActive ? (isRTL ? 'ناچالاککردن' : 'Disable') : (isRTL ? 'چالاککردن' : 'Enable')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                    onPress={() => deleteRule(rule.id)}
                  >
                    <Trash2 color="#FFF" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isRTL ? 'هاندەرە جێبەجێکراوەکان' : 'Applied Incentives'}
          </Text>

          {incentives.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Target color={colors.textSecondary} size={48} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isRTL ? 'هیچ هاندەرێک نییە' : 'No incentives yet'}
              </Text>
            </View>
          ) : (
            incentives.map(incentive => (
              <View key={incentive.id} style={[styles.incentiveCard, { backgroundColor: colors.card }]}>
                <View style={styles.incentiveHeader}>
                  <View>
                    <Text style={[styles.incentiveName, { color: colors.text }]}>{incentive.debtorName}</Text>
                    <Text style={[styles.incentiveRule, { color: colors.textSecondary }]}>
                      {incentive.ruleName}
                    </Text>
                  </View>
                  <View style={[styles.paidBadge, { backgroundColor: incentive.paid ? '#4CAF50' : '#FF9800' }]}>
                    <Text style={styles.paidText}>
                      {incentive.paid ? (isRTL ? 'پارەدراو' : 'Paid') : (isRTL ? 'چاوەڕوان' : 'Pending')}
                    </Text>
                  </View>
                </View>

                <View style={styles.incentiveDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      {isRTL ? 'بڕی سەرەتایی:' : 'Original:'}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {incentive.originalAmount.toLocaleString('en-US')}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      {isRTL ? 'داشکاندن:' : 'Discount:'}
                    </Text>
                    <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                      -{incentive.discountAmount.toLocaleString('en-US')}
                    </Text>
                  </View>

                  <View style={[styles.detailRow, styles.finalRow]}>
                    <Text style={[styles.detailLabel, { color: colors.text, fontWeight: 'bold' }]}>
                      {isRTL ? 'کۆتایی:' : 'Final:'}
                    </Text>
                    <Text style={[styles.finalValue, { color: colors.primary }]}>
                      {incentive.finalAmount.toLocaleString('en-US')}
                    </Text>
                  </View>

                  <Text style={[styles.daysEarly, { color: colors.textSecondary }]}>
                    {isRTL ? `${incentive.daysEarly} ڕۆژ زووتر` : `${incentive.daysEarly} days early`}
                  </Text>
                </View>

                <View style={styles.incentiveActions}>
                  {!incentive.paid && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => markAsPaid(incentive.id)}
                    >
                      <CheckCircle2 color={colors.background} size={16} />
                      <Text style={[styles.actionButtonText, { color: colors.background }]}>
                        {isRTL ? 'نیشانەکردنی پارەدان' : 'Mark Paid'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#F44336' }]}
                    onPress={() => deleteIncentive(incentive.id)}
                  >
                    <Trash2 color="#FFF" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showAddRuleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isRTL ? 'یاسای نوێ' : 'New Rule'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddRuleModal(false);
                  resetRuleForm();
                }}
              >
                <XCircle color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'ناو' : 'Name'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={ruleName}
                onChangeText={setRuleName}
                placeholder={isRTL ? 'ناوی یاسا...' : 'Rule name...'}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'جۆر' : 'Type'}</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: ruleType === 'percentage' ? colors.primary : colors.background },
                  ]}
                  onPress={() => setRuleType('percentage')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: ruleType === 'percentage' ? colors.background : colors.text },
                    ]}
                  >
                    {isRTL ? 'ڕێژە' : 'Percentage'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: ruleType === 'fixed' ? colors.primary : colors.background },
                  ]}
                  onPress={() => setRuleType('fixed')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: ruleType === 'fixed' ? colors.background : colors.text },
                    ]}
                  >
                    {isRTL ? 'دیاریکراو' : 'Fixed'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>
                {ruleType === 'percentage' ? (isRTL ? 'ڕێژە (%)' : 'Percentage (%)') : isRTL ? 'بڕ' : 'Amount'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={ruleValue}
                onChangeText={setRuleValue}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'کەمترین ڕۆژ' : 'Min Days Early'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={minDaysEarly}
                onChangeText={setMinDaysEarly}
                keyboardType="numeric"
                placeholder="7"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'کەمترین بڕ (دڵخواز)' : 'Min Amount (Optional)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={minDebtAmount}
                onChangeText={setMinDebtAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={createRule}
              >
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {isRTL ? 'دروستکردن' : 'Create'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showApplyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isRTL ? 'جێبەجێکردنی هاندەر' : 'Apply Incentive'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowApplyModal(false);
                  resetApplyForm();
                }}
              >
                <XCircle color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'قەرزدار' : 'Debtor'}
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
                {isRTL ? 'یاسای هاندەر' : 'Incentive Rule'}
              </Text>
              {rules
                .filter(r => r.isActive)
                .map(rule => (
                  <TouchableOpacity
                    key={rule.id}
                    style={[
                      styles.ruleSelectItem,
                      {
                        backgroundColor: selectedRuleId === rule.id ? colors.primary : colors.background,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedRuleId(rule.id)}
                  >
                    <View style={styles.ruleSelectInfo}>
                      <Text
                        style={[
                          styles.ruleSelectName,
                          { color: selectedRuleId === rule.id ? colors.background : colors.text },
                        ]}
                      >
                        {rule.name}
                      </Text>
                      <Text
                        style={[
                          styles.ruleSelectDetails,
                          { color: selectedRuleId === rule.id ? colors.background : colors.textSecondary },
                        ]}
                      >
                        {rule.type === 'percentage' ? `${rule.value}%` : rule.value.toLocaleString('en-US')}{' '}
                        {isRTL ? 'داشکاندن' : 'discount'}
                      </Text>
                    </View>
                    {selectedRuleId === rule.id && <CheckCircle2 color={colors.background} size={20} />}
                  </TouchableOpacity>
                ))}

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'بڕی پارەدان' : 'Payment Amount'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'چەند ڕۆژ زووتر' : 'Days Early'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={daysEarly}
                onChangeText={setDaysEarly}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={applyIncentive}
              >
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {isRTL ? 'جێبەجێکردن' : 'Apply'}
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
  applyButton: {
    marginBottom: 20,
  },
  largeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  largeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  ruleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ruleInfo: {
    flex: 1,
    gap: 4,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ruleDetails: {
    fontSize: 14,
  },
  ruleCondition: {
    fontSize: 12,
    marginTop: 4,
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
  ruleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  incentiveCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  incentiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incentiveName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incentiveRule: {
    fontSize: 14,
    marginTop: 2,
  },
  paidBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  incentiveDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  finalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
  },
  finalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  daysEarly: {
    fontSize: 12,
    marginTop: 4,
  },
  incentiveActions: {
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
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
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
  ruleSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  ruleSelectInfo: {
    flex: 1,
    gap: 4,
  },
  ruleSelectName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ruleSelectDetails: {
    fontSize: 14,
  },
});
