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
  Percent,
  Calculator,
  TrendingUp,

  Calendar,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InterestRule {
  id: string;
  name: string;
  rate: number;
  type: 'simple' | 'compound';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  minAmount?: number;
  maxAmount?: number;
  applyAfterDays?: number;
  isActive: boolean;
  createdAt: string;
}

interface DebtorInterest {
  debtorId: string;
  debtorName: string;
  ruleId: string;
  ruleName: string;
  baseAmount: number;
  currentInterest: number;
  totalWithInterest: number;
  lastCalculated: string;
  daysAccrued: number;
}

export default function DynamicInterestScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const isRTL = language === 'ku' || language === 'ar';

  const [rules, setRules] = useState<InterestRule[]>([]);
  const [debtorInterests, setDebtorInterests] = useState<DebtorInterest[]>([]);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingRule, setEditingRule] = useState<InterestRule | null>(null);

  const [ruleName, setRuleName] = useState('');
  const [rate, setRate] = useState('');
  const [type, setType] = useState<'simple' | 'compound'>('simple');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [applyAfterDays, setApplyAfterDays] = useState('0');

  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      calculateAllInterests();
    }, 3600000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [rulesData, interestsData] = await Promise.all([
        AsyncStorage.getItem('interest_rules'),
        AsyncStorage.getItem('debtor_interests'),
      ]);
      
      if (rulesData) setRules(JSON.parse(rulesData));
      if (interestsData) setDebtorInterests(JSON.parse(interestsData));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveRules = async (newRules: InterestRule[]) => {
    try {
      await AsyncStorage.setItem('interest_rules', JSON.stringify(newRules));
      setRules(newRules);
    } catch (error) {
      console.error('Error saving rules:', error);
    }
  };

  const saveInterests = async (newInterests: DebtorInterest[]) => {
    try {
      await AsyncStorage.setItem('debtor_interests', JSON.stringify(newInterests));
      setDebtorInterests(newInterests);
    } catch (error) {
      console.error('Error saving interests:', error);
    }
  };

  const calculateInterest = (
    principal: number,
    rate: number,
    days: number,
    type: 'simple' | 'compound',
    freq: string
  ): number => {
    const periodsPerYear = freq === 'daily' ? 365 : freq === 'weekly' ? 52 : freq === 'monthly' ? 12 : 1;
    const periods = (days / 365) * periodsPerYear;

    if (type === 'simple') {
      return principal * (rate / 100) * periods;
    } else {
      return principal * (Math.pow(1 + rate / 100 / periodsPerYear, periods) - 1);
    }
  };

  const calculateAllInterests = async () => {
    const updated = debtorInterests.map(interest => {
      const rule = rules.find(r => r.id === interest.ruleId);
      if (!rule || !rule.isActive) return interest;

      const debtor = debtors.find(d => d.id === interest.debtorId);
      if (!debtor || debtor.totalDebt <= 0) return interest;

      const now = new Date();
      const lastCalc = new Date(interest.lastCalculated);
      const daysPassed = Math.floor((now.getTime() - lastCalc.getTime()) / (1000 * 60 * 60 * 24));

      if (daysPassed < 1) return interest;

      const newInterest = calculateInterest(
        debtor.totalDebt,
        rule.rate,
        interest.daysAccrued + daysPassed,
        rule.type,
        rule.frequency
      );

      return {
        ...interest,
        baseAmount: debtor.totalDebt,
        currentInterest: newInterest,
        totalWithInterest: debtor.totalDebt + newInterest,
        lastCalculated: now.toISOString(),
        daysAccrued: interest.daysAccrued + daysPassed,
      };
    });

    await saveInterests(updated);
  };

  const createOrUpdateRule = () => {
    if (!ruleName || !rate) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ناو و ڕێژە پێویستە' : 'Name and rate are required'
      );
      return;
    }

    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue <= 0 || rateValue > 100) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ڕێژە نادروستە' : 'Invalid rate'
      );
      return;
    }

    if (editingRule) {
      const updated = rules.map(r =>
        r.id === editingRule.id
          ? {
              ...r,
              name: ruleName,
              rate: rateValue,
              type,
              frequency,
              minAmount: minAmount ? parseFloat(minAmount) : undefined,
              maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
              applyAfterDays: applyAfterDays ? parseInt(applyAfterDays) : 0,
            }
          : r
      );
      saveRules(updated);
    } else {
      const newRule: InterestRule = {
        id: Date.now().toString(),
        name: ruleName,
        rate: rateValue,
        type,
        frequency,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        applyAfterDays: applyAfterDays ? parseInt(applyAfterDays) : 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      saveRules([...rules, newRule]);
    }

    resetForm();
    setShowAddRuleModal(false);
  };

  const resetForm = () => {
    setRuleName('');
    setRate('');
    setType('simple');
    setFrequency('monthly');
    setMinAmount('');
    setMaxAmount('');
    setApplyAfterDays('0');
    setEditingRule(null);
  };

  const editRule = (rule: InterestRule) => {
    setEditingRule(rule);
    setRuleName(rule.name);
    setRate(rule.rate.toString());
    setType(rule.type);
    setFrequency(rule.frequency);
    setMinAmount(rule.minAmount?.toString() || '');
    setMaxAmount(rule.maxAmount?.toString() || '');
    setApplyAfterDays(rule.applyAfterDays?.toString() || '0');
    setShowAddRuleModal(true);
  };

  const deleteRule = (ruleId: string) => {
    Alert.alert(
      isRTL ? 'سڕینەوەی یاسا' : 'Delete Rule',
      isRTL ? 'دڵنیای لە سڕینەوە؟' : 'Are you sure?',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'سڕینەوە' : 'Delete',
          style: 'destructive',
          onPress: () => {
            saveRules(rules.filter(r => r.id !== ruleId));
            saveInterests(debtorInterests.filter(i => i.ruleId !== ruleId));
          },
        },
      ]
    );
  };

  const toggleRuleStatus = (ruleId: string) => {
    const updated = rules.map(r => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r));
    saveRules(updated);
  };

  const assignRuleToDebtor = () => {
    if (!selectedDebtorId || !selectedRuleId) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'قەرزدار و یاسا هەڵبژێرە' : 'Select debtor and rule'
      );
      return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    const rule = rules.find(r => r.id === selectedRuleId);
    if (!debtor || !rule) return;

    const existing = debtorInterests.find(i => i.debtorId === selectedDebtorId);
    if (existing) {
      Alert.alert(
        isRTL ? 'هەڵە' : 'Error',
        isRTL ? 'ئەم قەرزدارە پێشتر یاسای هەیە' : 'Debtor already has a rule assigned'
      );
      return;
    }

    const newInterest: DebtorInterest = {
      debtorId: debtor.id,
      debtorName: debtor.name,
      ruleId: rule.id,
      ruleName: rule.name,
      baseAmount: debtor.totalDebt,
      currentInterest: 0,
      totalWithInterest: debtor.totalDebt,
      lastCalculated: new Date().toISOString(),
      daysAccrued: 0,
    };

    saveInterests([...debtorInterests, newInterest]);
    setShowAssignModal(false);
    setSelectedDebtorId('');
    setSelectedRuleId('');
  };

  const removeInterestFromDebtor = (debtorId: string) => {
    Alert.alert(
      isRTL ? 'لابردنی یاسا' : 'Remove Rule',
      isRTL ? 'یاسای سوود لەم قەرزدارە لابدەیت؟' : 'Remove interest rule from this debtor?',
      [
        { text: isRTL ? 'پاشگەزبوونەوە' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'لابردن' : 'Remove',
          style: 'destructive',
          onPress: () => {
            saveInterests(debtorInterests.filter(i => i.debtorId !== debtorId));
          },
        },
      ]
    );
  };

  const getFrequencyText = (freq: string) => {
    const texts: Record<string, { ku: string; en: string }> = {
      daily: { ku: 'ڕۆژانە', en: 'Daily' },
      weekly: { ku: 'هەفتانە', en: 'Weekly' },
      monthly: { ku: 'مانگانە', en: 'Monthly' },
      yearly: { ku: 'ساڵانە', en: 'Yearly' },
    };
    return isRTL ? texts[freq].ku : texts[freq].en;
  };

  const getTypeText = (t: string) => {
    return t === 'simple'
      ? isRTL
        ? 'سادە'
        : 'Simple'
      : isRTL
      ? 'گرێدراو'
      : 'Compound';
  };

  const totalInterestAccrued = debtorInterests.reduce((sum, i) => sum + i.currentInterest, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <LinearGradient colors={[colors.primary, colors.primary + 'CC']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.background} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.background }]}>
            {isRTL ? 'ژمێرەری سوودی گۆڕاو' : 'Dynamic Interest'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setShowAddRuleModal(true);
            }}
            style={styles.addButton}
          >
            <Plus color={colors.background} size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Percent color={colors.primary} size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>{rules.filter(r => r.isActive).length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'یاسای چالاک' : 'Active Rules'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <TrendingUp color="#4CAF50" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {totalInterestAccrued.toLocaleString('en-US')}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'کۆی سوود' : 'Total Interest'}
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Calculator color="#FF9800" size={24} />
            <Text style={[styles.statValue, { color: colors.text }]}>{debtorInterests.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {isRTL ? 'قەرزداری چالاک' : 'Active Debtors'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {isRTL ? 'یاساکانی سوود' : 'Interest Rules'}
          </Text>

          {rules.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Percent color={colors.textSecondary} size={48} />
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
                      {rule.rate}% {getTypeText(rule.type)} - {getFrequencyText(rule.frequency)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: rule.isActive ? '#4CAF50' : '#9E9E9E' }]}>
                    <Text style={styles.statusText}>
                      {rule.isActive ? (isRTL ? 'چالاک' : 'Active') : (isRTL ? 'ناچالاک' : 'Inactive')}
                    </Text>
                  </View>
                </View>

                {(rule.minAmount || rule.maxAmount || rule.applyAfterDays) && (
                  <View style={styles.ruleConditions}>
                    {rule.minAmount && (
                      <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                        {isRTL ? 'کەمترین: ' : 'Min: '}
                        {rule.minAmount.toLocaleString('en-US')}
                      </Text>
                    )}
                    {rule.maxAmount && (
                      <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                        {isRTL ? 'زۆرترین: ' : 'Max: '}
                        {rule.maxAmount.toLocaleString('en-US')}
                      </Text>
                    )}
                    {rule.applyAfterDays && rule.applyAfterDays > 0 && (
                      <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                        {isRTL ? `دوای ${rule.applyAfterDays} ڕۆژ` : `After ${rule.applyAfterDays} days`}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.ruleActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => editRule(rule)}
                  >
                    <Edit color={colors.background} size={16} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: rule.isActive ? '#FF9800' : '#4CAF50' }]}
                    onPress={() => toggleRuleStatus(rule.id)}
                  >
                    <Text style={styles.actionBtnText}>
                      {rule.isActive ? (isRTL ? 'ناچالاککردن' : 'Disable') : (isRTL ? 'چالاککردن' : 'Enable')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F44336' }]}
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isRTL ? 'قەرزدارانی چالاک' : 'Active Debtors'}
            </Text>
            <TouchableOpacity
              style={[styles.assignButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAssignModal(true)}
            >
              <Plus color={colors.background} size={16} />
              <Text style={[styles.assignButtonText, { color: colors.background }]}>
                {isRTL ? 'دیاریکردن' : 'Assign'}
              </Text>
            </TouchableOpacity>
          </View>

          {debtorInterests.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Calculator color={colors.textSecondary} size={48} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {isRTL ? 'هیچ قەرزدارێک نییە' : 'No debtors with interest'}
              </Text>
            </View>
          ) : (
            debtorInterests.map(interest => (
              <View key={interest.debtorId} style={[styles.interestCard, { backgroundColor: colors.card }]}>
                <View style={styles.interestHeader}>
                  <View>
                    <Text style={[styles.interestName, { color: colors.text }]}>{interest.debtorName}</Text>
                    <Text style={[styles.interestRule, { color: colors.textSecondary }]}>{interest.ruleName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeInterestFromDebtor(interest.debtorId)}>
                    <Trash2 color={colors.error} size={20} />
                  </TouchableOpacity>
                </View>

                <View style={styles.interestDetails}>
                  <View style={styles.interestRow}>
                    <Text style={[styles.interestLabel, { color: colors.textSecondary }]}>
                      {isRTL ? 'بڕی بنەڕەت:' : 'Base Amount:'}
                    </Text>
                    <Text style={[styles.interestValue, { color: colors.text }]}>
                      {interest.baseAmount.toLocaleString('en-US')}
                    </Text>
                  </View>

                  <View style={styles.interestRow}>
                    <Text style={[styles.interestLabel, { color: colors.textSecondary }]}>
                      {isRTL ? 'سوود:' : 'Interest:'}
                    </Text>
                    <Text style={[styles.interestValue, { color: '#FF9800' }]}>
                      +{interest.currentInterest.toLocaleString('en-US')}
                    </Text>
                  </View>

                  <View style={[styles.interestRow, styles.totalRow]}>
                    <Text style={[styles.interestLabel, { color: colors.text, fontWeight: 'bold' }]}>
                      {isRTL ? 'کۆی گشتی:' : 'Total:'}
                    </Text>
                    <Text style={[styles.totalValue, { color: colors.primary }]}>
                      {interest.totalWithInterest.toLocaleString('en-US')}
                    </Text>
                  </View>

                  <View style={styles.daysAccrued}>
                    <Calendar color={colors.textSecondary} size={14} />
                    <Text style={[styles.daysText, { color: colors.textSecondary }]}>
                      {isRTL ? `${interest.daysAccrued} ڕۆژ` : `${interest.daysAccrued} days`}
                    </Text>
                  </View>
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
                {editingRule ? (isRTL ? 'دەستکاری یاسا' : 'Edit Rule') : isRTL ? 'یاسای نوێ' : 'New Rule'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddRuleModal(false);
                  resetForm();
                }}
              >
                <AlertCircle color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'ناوی یاسا' : 'Rule Name'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={ruleName}
                onChangeText={setRuleName}
                placeholder={isRTL ? 'ناو...' : 'Name...'}
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'ڕێژەی سوود (%)' : 'Interest Rate (%)'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={rate}
                onChangeText={setRate}
                keyboardType="decimal-pad"
                placeholder="5.5"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'جۆری سوود' : 'Interest Type'}</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: type === 'simple' ? colors.primary : colors.background },
                  ]}
                  onPress={() => setType('simple')}
                >
                  <Text
                    style={[styles.typeButtonText, { color: type === 'simple' ? colors.background : colors.text }]}
                  >
                    {isRTL ? 'سادە' : 'Simple'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: type === 'compound' ? colors.primary : colors.background },
                  ]}
                  onPress={() => setType('compound')}
                >
                  <Text
                    style={[styles.typeButtonText, { color: type === 'compound' ? colors.background : colors.text }]}
                  >
                    {isRTL ? 'گرێدراو' : 'Compound'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'دووبارەبوونەوە' : 'Frequency'}</Text>
              <View style={styles.frequencyButtons}>
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(freq => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyBtn,
                      { backgroundColor: frequency === freq ? colors.primary : colors.background },
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.frequencyBtnText,
                        { color: frequency === freq ? colors.background : colors.text },
                      ]}
                    >
                      {getFrequencyText(freq)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'کەمترین بڕ' : 'Min Amount (Optional)'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={minAmount}
                onChangeText={setMinAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'زۆرترین بڕ' : 'Max Amount (Optional)'}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={maxAmount}
                onChangeText={setMaxAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.label, { color: colors.text }]}>
                {isRTL ? 'جێبەجێکردن دوای (ڕۆژ)' : 'Apply After (Days)'}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                value={applyAfterDays}
                onChangeText={setApplyAfterDays}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={createOrUpdateRule}
              >
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {editingRule ? (isRTL ? 'نوێکردنەوە' : 'Update') : isRTL ? 'دروستکردن' : 'Create'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isRTL ? 'دیاریکردنی یاسا' : 'Assign Rule'}
              </Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <AlertCircle color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'هەڵبژاردنی قەرزدار' : 'Select Debtor'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.debtorsList}>
                {debtors
                  .filter(d => !debtorInterests.find(i => i.debtorId === d.id))
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

              <Text style={[styles.label, { color: colors.text }]}>{isRTL ? 'هەڵبژاردنی یاسا' : 'Select Rule'}</Text>
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
                        {rule.rate}% {getTypeText(rule.type)} - {getFrequencyText(rule.frequency)}
                      </Text>
                    </View>
                    {selectedRuleId === rule.id && <CheckCircle2 color={colors.background} size={20} />}
                  </TouchableOpacity>
                ))}

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={assignRuleToDebtor}
              >
                <Text style={[styles.createButtonText, { color: colors.background }]}>
                  {isRTL ? 'دیاریکردن' : 'Assign'}
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  ruleConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionText: {
    fontSize: 12,
  },
  ruleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  interestCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  interestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interestName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  interestRule: {
    fontSize: 14,
    marginTop: 2,
  },
  interestDetails: {
    gap: 8,
  },
  interestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interestLabel: {
    fontSize: 14,
  },
  interestValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  daysAccrued: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  daysText: {
    fontSize: 12,
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
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  frequencyBtnText: {
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
