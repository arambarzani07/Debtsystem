import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Users, Percent, CheckCircle, XCircle, Share2, Calculator } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import type { Debtor } from '@/types';

interface SplitParticipant {
  debtor: Debtor;
  percentage: number;
  amount: number;
}

export default function DebtSplittingScreen() {
  const { colors } = useTheme();
  const { debtors, addTransaction } = useDebt();
  const router = useRouter();

  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<SplitParticipant[]>([]);
  const [showDebtorPicker, setShowDebtorPicker] = useState(false);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'percentage' | 'custom'>('equal');

  const availableDebtors = useMemo(() => {
    return debtors.filter(d => !participants.some(p => p.debtor.id === d.id));
  }, [debtors, participants]);

  const addParticipant = (debtor: Debtor) => {
    setParticipants(prev => [
      ...prev,
      { debtor, percentage: 0, amount: 0 }
    ]);
    setShowDebtorPicker(false);
    recalculateSplits([...participants, { debtor, percentage: 0, amount: 0 }]);
  };

  const removeParticipant = (debtorId: string) => {
    const updated = participants.filter(p => p.debtor.id !== debtorId);
    setParticipants(updated);
    recalculateSplits(updated);
  };

  const recalculateSplits = (currentParticipants: SplitParticipant[]) => {
    if (!totalAmount || currentParticipants.length === 0) return;

    const amount = parseFloat(totalAmount);
    if (isNaN(amount)) return;

    if (splitMethod === 'equal') {
      const perPerson = amount / currentParticipants.length;
      const percentage = 100 / currentParticipants.length;
      setParticipants(currentParticipants.map(p => ({
        ...p,
        amount: perPerson,
        percentage: percentage,
      })));
    }
  };

  const updateParticipantPercentage = (debtorId: string, percentageStr: string) => {
    const percentage = parseFloat(percentageStr) || 0;
    const amount = parseFloat(totalAmount) || 0;
    
    setParticipants(prev => prev.map(p => {
      if (p.debtor.id === debtorId) {
        return {
          ...p,
          percentage,
          amount: (amount * percentage) / 100,
        };
      }
      return p;
    }));
  };

  const updateParticipantAmount = (debtorId: string, amountStr: string) => {
    const customAmount = parseFloat(amountStr) || 0;
    const totalAmountNum = parseFloat(totalAmount) || 0;
    
    setParticipants(prev => prev.map(p => {
      if (p.debtor.id === debtorId) {
        return {
          ...p,
          amount: customAmount,
          percentage: totalAmountNum > 0 ? (customAmount / totalAmountNum) * 100 : 0,
        };
      }
      return p;
    }));
  };

  const totalPercentage = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.percentage, 0);
  }, [participants]);

  const totalAllocated = useMemo(() => {
    return participants.reduce((sum, p) => sum + p.amount, 0);
  }, [participants]);

  const isValid = useMemo(() => {
    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) return false;
    if (participants.length === 0) return false;
    if (!description.trim()) return false;
    
    if (splitMethod === 'percentage') {
      return Math.abs(totalPercentage - 100) < 0.01;
    } else if (splitMethod === 'custom') {
      return Math.abs(totalAllocated - amount) < 0.01;
    }
    
    return true;
  }, [totalAmount, participants, description, splitMethod, totalPercentage, totalAllocated]);

  const executeSplit = async () => {
    if (!isValid) {
      Alert.alert('هەڵە', 'تکایە زانیارییەکان بە تەواوی پڕبکەرەوە');
      return;
    }

    try {
      for (const participant of participants) {
        await addTransaction(
          participant.debtor.id,
          participant.amount,
          `${description} (دابەشکراوی گرووپی - ${participant.percentage.toFixed(1)}%)`,
          'debt'
        );
      }

      Alert.alert(
        'سەرکەوتوو',
        `قەرز بە سەرکەوتوویی دابەش کرا بۆ ${participants.length} کەس`,
        [
          {
            text: 'باشە',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error splitting debt:', error);
      Alert.alert('هەڵە', 'کێشەیەک ڕوویدا لە دابەشکردنی قەرز');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'دابەشکردنی قەرزی گرووپی',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>زانیاری گشتی</Text>
            
            <Text style={[styles.label, { color: colors.textSecondary }]}>کۆی گشتی</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder }]}
              value={totalAmount}
              onChangeText={(text) => {
                setTotalAmount(text);
                recalculateSplits(participants);
              }}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>وردەکاری</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder }]}
              value={description}
              onChangeText={setDescription}
              placeholder="وەک: پێداویستییەکانی پرۆژە"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>شێوازی دابەشکردن</Text>
            
            <View style={styles.methodButtons}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { 
                    backgroundColor: splitMethod === 'equal' ? colors.primaryGlass : colors.card,
                    borderColor: splitMethod === 'equal' ? colors.primary : colors.cardBorder,
                  }
                ]}
                onPress={() => {
                  setSplitMethod('equal');
                  recalculateSplits(participants);
                }}
              >
                <Users size={20} color={splitMethod === 'equal' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.methodText, { color: splitMethod === 'equal' ? colors.primary : colors.textSecondary }]}>
                  یەکسان
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { 
                    backgroundColor: splitMethod === 'percentage' ? colors.primaryGlass : colors.card,
                    borderColor: splitMethod === 'percentage' ? colors.primary : colors.cardBorder,
                  }
                ]}
                onPress={() => setSplitMethod('percentage')}
              >
                <Percent size={20} color={splitMethod === 'percentage' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.methodText, { color: splitMethod === 'percentage' ? colors.primary : colors.textSecondary }]}>
                  ڕێژە
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { 
                    backgroundColor: splitMethod === 'custom' ? colors.primaryGlass : colors.card,
                    borderColor: splitMethod === 'custom' ? colors.primary : colors.cardBorder,
                  }
                ]}
                onPress={() => setSplitMethod('custom')}
              >
                <Calculator size={20} color={splitMethod === 'custom' ? colors.primary : colors.textSecondary} />
                <Text style={[styles.methodText, { color: splitMethod === 'custom' ? colors.primary : colors.textSecondary }]}>
                  تایبەت
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>بەشداربووان</Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}
                onPress={() => setShowDebtorPicker(true)}
              >
                <Text style={[styles.addButtonText, { color: colors.primary }]}>+ زیادکردن</Text>
              </TouchableOpacity>
            </View>

            {participants.length === 0 && (
              <View style={styles.emptyState}>
                <Share2 size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  هێشتا بەشداربووێک زیاد نەکراوە
                </Text>
              </View>
            )}

            {participants.map((participant, index) => (
              <View
                key={participant.debtor.id}
                style={[styles.participantCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={styles.participantHeader}>
                  <Text style={[styles.participantName, { color: colors.text }]}>
                    {index + 1}. {participant.debtor.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeParticipant(participant.debtor.id)}>
                    <XCircle size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>

                {splitMethod === 'equal' && (
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantAmount, { color: colors.success }]}>
                      {participant.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD
                    </Text>
                    <Text style={[styles.participantPercentage, { color: colors.textSecondary }]}>
                      {participant.percentage.toFixed(1)}%
                    </Text>
                  </View>
                )}

                {splitMethod === 'percentage' && (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: colors.cardGlass, color: colors.text, borderColor: colors.glassBorder }]}
                      value={participant.percentage > 0 ? participant.percentage.toString() : ''}
                      onChangeText={(text) => updateParticipantPercentage(participant.debtor.id, text)}
                      placeholder="ڕێژە %"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.calculatedAmount, { color: colors.success }]}>
                      = {participant.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD
                    </Text>
                  </View>
                )}

                {splitMethod === 'custom' && (
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: colors.cardGlass, color: colors.text, borderColor: colors.glassBorder }]}
                      value={participant.amount > 0 ? participant.amount.toString() : ''}
                      onChangeText={(text) => updateParticipantAmount(participant.debtor.id, text)}
                      placeholder="بڕ"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.calculatedAmount, { color: colors.textSecondary }]}>
                      ({participant.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {participants.length > 0 && (
              <View style={[styles.summary, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
                {splitMethod === 'percentage' && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryText, { color: colors.text }]}>کۆی ڕێژە</Text>
                    <Text style={[
                      styles.summaryValue,
                      { color: Math.abs(totalPercentage - 100) < 0.01 ? colors.success : colors.error }
                    ]}>
                      {totalPercentage.toFixed(1)}%
                    </Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryText, { color: colors.text }]}>کۆی دابەشکراو</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {totalAllocated.toLocaleString('en-US', { maximumFractionDigits: 0 })} IQD
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.executeButton,
              { 
                backgroundColor: isValid ? colors.primary : colors.cardGlass,
                opacity: isValid ? 1 : 0.5,
              }
            ]}
            onPress={executeSplit}
            disabled={!isValid}
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.executeButtonText}>جێبەجێکردنی دابەشکردن</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showDebtorPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDebtorPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>هەڵبژاردنی کڕیار</Text>
                <TouchableOpacity onPress={() => setShowDebtorPicker(false)}>
                  <XCircle size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {availableDebtors.map((debtor) => (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[styles.debtorItem, { borderColor: colors.cardBorder }]}
                    onPress={() => addParticipant(debtor)}
                  >
                    <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                    <Text style={[styles.debtorDebt, { color: colors.error }]}>
                      {debtor.totalDebt.toLocaleString('en-US')} IQD
                    </Text>
                  </TouchableOpacity>
                ))}
                {availableDebtors.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.textSecondary, textAlign: 'center', marginTop: 20 }]}>
                    هەموو کڕیارەکان زیادکراون
                  </Text>
                )}
              </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    textAlign: 'right',
    marginBottom: 16,
  },
  methodButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  participantCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  participantHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  participantInfo: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  participantPercentage: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  smallInput: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlign: 'right',
  },
  calculatedAmount: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  summary: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  executeButton: {
    flexDirection: 'row-reverse',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  executeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalList: {
    padding: 20,
  },
  debtorItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  debtorDebt: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
