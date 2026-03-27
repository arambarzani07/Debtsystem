import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { ChevronLeft, Calendar, DollarSign, User, Plus, Trash2 } from 'lucide-react-native';
import type { Debtor } from '@/types';

interface PaymentPlan {
  id: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}

export default function PartialPaymentPlansScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { debtors, addTransaction } = useDebt();
  
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [planAmount, setPlanAmount] = useState('');
  const [planDate, setPlanDate] = useState('');

  const debtorsWithDebt = debtors.filter(d => d.totalDebt > 0);
  const filteredDebtors = debtorsWithDebt.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.includes(searchQuery)
  );

  const addPaymentPlan = () => {
    const amount = parseFloat(planAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('هەڵە', 'تکایە بڕێکی دروست داخڵ بکە');
      return;
    }

    if (!planDate) {
      Alert.alert('هەڵە', 'تکایە بەرواری پارەدان هەڵبژێرە');
      return;
    }

    if (!selectedDebtor) {
      Alert.alert('هەڵە', 'تکایە قەرزدارێک هەڵبژێرە');
      return;
    }

    const totalPlanned = paymentPlans.reduce((sum, p) => sum + p.amount, 0) + amount;
    if (totalPlanned > selectedDebtor.totalDebt) {
      Alert.alert('هەڵە', `کۆی گشتی پلانەکان (${totalPlanned.toLocaleString('en-US')}) نابێت لە قەرزی گشتی (${selectedDebtor.totalDebt.toLocaleString('en-US')}) زیاتر بێت`);
      return;
    }

    const newPlan: PaymentPlan = {
      id: Date.now().toString(),
      amount,
      dueDate: planDate,
      isPaid: false,
    };

    setPaymentPlans([...paymentPlans, newPlan]);
    setPlanAmount('');
    setPlanDate('');
  };

  const removePlan = (planId: string) => {
    setPaymentPlans(paymentPlans.filter(p => p.id !== planId));
  };

  const markAsPaid = async (planId: string) => {
    const plan = paymentPlans.find(p => p.id === planId);
    if (!plan || !selectedDebtor) return;

    Alert.alert(
      'تۆماری پارەدان',
      `ئایا دڵنیایت لە تۆماری پارەدانی ${plan.amount.toLocaleString('en-US')}؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            try {
              await addTransaction(
                selectedDebtor.id,
                plan.amount,
                `پارەدانی بەشێکی لە پلانی پارەدان - بەرواری ${plan.dueDate}`,
                'payment'
              );

              setPaymentPlans(paymentPlans.map(p => 
                p.id === planId ? { ...p, isPaid: true } : p
              ));

              Alert.alert('سەرکەوتوو', 'پارەدانەکە تۆمارکرا');
            } catch (error) {
              console.error('Error recording payment:', error);
              Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە تۆماری پارەدان');
            }
          },
        },
      ]
    );
  };

  const getTotalPlanned = () => {
    return paymentPlans.reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalPaid = () => {
    return paymentPlans.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>پلانی پارەدانی بەشێکی</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <Calendar size={40} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              پلانی پارەدانی بەشێکی
            </Text>
            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
              پلانی پارەدانی بەشێکی دروست بکە بۆ قەرزدارانت
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>هەڵبژاردنی قەرزدار</Text>
            
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                color: colors.text,
              }]}
              placeholder="گەڕان بە ناو یان ژمارە تەلەفۆن..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />

            <ScrollView 
              style={styles.debtorsList}
              showsVerticalScrollIndicator={false}
            >
              {filteredDebtors.map((debtor) => (
                <TouchableOpacity
                  key={debtor.id}
                  style={[
                    styles.debtorCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: selectedDebtor?.id === debtor.id ? colors.primary : colors.cardBorder,
                      borderWidth: selectedDebtor?.id === debtor.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDebtor(debtor);
                    setPaymentPlans([]);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.debtorInfo}>
                    <View style={[styles.debtorAvatar, { backgroundColor: colors.primaryGlass }]}>
                      <User size={24} color={colors.primary} />
                    </View>
                    <View style={styles.debtorDetails}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>
                        {debtor.name}
                      </Text>
                      {debtor.phone && (
                        <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>
                          {debtor.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.debtAmount, { backgroundColor: colors.errorGlass }]}>
                    <DollarSign size={16} color={colors.error} />
                    <Text style={[styles.debtAmountText, { color: colors.error }]}>
                      {debtor.totalDebt.toLocaleString('en-US')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {filteredDebtors.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                    {searchQuery ? 'هیچ ئەنجامێک نەدۆزرایەوە' : 'هیچ قەرزدارێکی قەرزدار نییە'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {selectedDebtor && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>دروستکردنی پلان</Text>
              
              <View style={[styles.selectedCard, { 
                backgroundColor: colors.primaryGlass,
                borderColor: colors.primary,
              }]}>
                <Text style={[styles.selectedLabel, { color: colors.primary }]}>
                  قەرزداری هەڵبژێردراو
                </Text>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {selectedDebtor.name}
                </Text>
                <Text style={[styles.selectedDebt, { color: colors.textSecondary }]}>
                  قەرزی گشتی: {selectedDebtor.totalDebt.toLocaleString('en-US')}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.inputHalf, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="بەروار (YYYY-MM-DD)"
                  placeholderTextColor={colors.textTertiary}
                  value={planDate}
                  onChangeText={setPlanDate}
                  textAlign="right"
                />
                <TextInput
                  style={[styles.inputHalf, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="بڕ"
                  placeholderTextColor={colors.textTertiary}
                  value={planAmount}
                  onChangeText={setPlanAmount}
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>

              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={addPaymentPlan}
                activeOpacity={0.8}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>زیادکردنی پلان</Text>
              </TouchableOpacity>

              {paymentPlans.length > 0 && (
                <>
                  <View style={[styles.summaryCard, { 
                    backgroundColor: colors.cardGlass,
                    borderColor: colors.glassBorder,
                  }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryValue, { color: colors.text }]}>
                        {getTotalPlanned().toLocaleString('en-US')}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        کۆی گشتی پلانەکان
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryValue, { color: colors.success }]}>
                        {getTotalPaid().toLocaleString('en-US')}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        پارەی دراو
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryValue, { color: colors.warning }]}>
                        {(getTotalPlanned() - getTotalPaid()).toLocaleString('en-US')}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        ماوە
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionTitle, { color: colors.text }]}>پلانەکان</Text>
                  {paymentPlans.map((plan) => (
                    <View
                      key={plan.id}
                      style={[
                        styles.planCard,
                        {
                          backgroundColor: plan.isPaid ? colors.successGlass : colors.card,
                          borderColor: plan.isPaid ? colors.success : colors.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.planInfo}>
                        <View style={styles.planDetails}>
                          <Text style={[styles.planAmount, { color: colors.text }]}>
                            {plan.amount.toLocaleString('en-US')}
                          </Text>
                          <Text style={[styles.planDate, { color: colors.textSecondary }]}>
                            {plan.dueDate}
                          </Text>
                        </View>
                        {plan.isPaid && (
                          <View style={[styles.paidBadge, { backgroundColor: colors.success }]}>
                            <Text style={styles.paidBadgeText}>دراوە</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.planActions}>
                        {!plan.isPaid && (
                          <>
                            <TouchableOpacity
                              style={[styles.actionButton, { backgroundColor: colors.success }]}
                              onPress={() => markAsPaid(plan.id)}
                            >
                              <DollarSign size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.actionButton, { backgroundColor: colors.error }]}
                              onPress={() => removePlan(plan.id)}
                            >
                              <Trash2 size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>
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
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 16,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
    textAlign: 'right',
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  debtorsList: {
    maxHeight: 300,
  },
  debtorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtorInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  debtorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debtorDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  debtorPhone: {
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right',
  },
  debtAmount: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  debtAmountText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  selectedName: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 4,
    textAlign: 'right',
  },
  selectedDebt: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  planAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  planDate: {
    fontSize: 14,
    marginTop: 2,
    textAlign: 'right',
  },
  paidBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  planActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
