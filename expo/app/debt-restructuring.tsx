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
import { ChevronLeft, RefreshCw, DollarSign, User } from 'lucide-react-native';
import type { Debtor } from '@/types';

export default function DebtRestructuringScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { debtors, addTransaction } = useDebt();
  
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [reason, setReason] = useState('');

  const debtorsWithDebt = debtors.filter(d => d.totalDebt > 0);
  const filteredDebtors = debtorsWithDebt.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.includes(searchQuery)
  );

  const handleRestructure = async () => {
    if (!selectedDebtor) {
      Alert.alert('هەڵە', 'تکایە قەرزدارێک هەڵبژێرە');
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('هەڵە', 'تکایە بڕێکی دروست داخڵ بکە');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('هەڵە', 'تکایە هۆکار بنووسە');
      return;
    }

    const difference = selectedDebtor.totalDebt - amount;
    
    Alert.alert(
      'دووبارە پێکهێنانەوەی قەرز',
      `قەرزی ئێستا: ${selectedDebtor.totalDebt.toLocaleString('en-US')}\nقەرزی نوێ: ${amount.toLocaleString('en-US')}\nجیاوازی: ${Math.abs(difference).toLocaleString('en-US')} ${difference > 0 ? '(کەمکردنەوە)' : '(زیادکردن)'}\n\nئایا دڵنیایت؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          style: 'destructive',
          onPress: async () => {
            try {
              if (difference > 0) {
                await addTransaction(
                  selectedDebtor.id,
                  difference,
                  `دووبارە پێکهێنانەوەی قەرز - کەمکردنەوە: ${reason}`,
                  'payment'
                );
              } else if (difference < 0) {
                await addTransaction(
                  selectedDebtor.id,
                  Math.abs(difference),
                  `دووبارە پێکهێنانەوەی قەرز - زیادکردن: ${reason}`,
                  'debt'
                );
              }

              Alert.alert(
                'سەرکەوتوو',
                'قەرزەکە دووبارە پێکهێنرایەوە',
                [
                  {
                    text: 'باشە',
                    onPress: () => {
                      setSelectedDebtor(null);
                      setNewAmount('');
                      setInterestRate('');
                      setReason('');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error restructuring debt:', error);
              Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە دووبارە پێکهێنانەوە');
            }
          },
        },
      ]
    );
  };

  const calculateWithInterest = () => {
    if (!selectedDebtor) return;
    
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate < 0) {
      Alert.alert('هەڵە', 'تکایە ڕێژەیەکی دروست داخڵ بکە');
      return;
    }

    const interest = (selectedDebtor.totalDebt * rate) / 100;
    const newTotal = selectedDebtor.totalDebt + interest;
    setNewAmount(newTotal.toFixed(0));
    Alert.alert(
      'ژمێرەری سوو',
      `قەرزی سەرەتایی: ${selectedDebtor.totalDebt.toLocaleString('en-US')}\nڕێژەی سوو: ${rate}%\nسوو: ${interest.toLocaleString('en-US')}\nکۆی گشتی: ${newTotal.toLocaleString('en-US')}`
    );
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
            <Text style={[styles.title, { color: colors.text }]}>دووبارە پێکهێنانەوەی قەرز</Text>
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
            <RefreshCw size={40} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              دووبارە پێکهێنانەوەی قەرز
            </Text>
            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
              بڕی قەرزی قەرزدارەکان دووبارە پێکبهێنەوە بە گۆڕینی بڕ یان زیادکردنی سوو
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
                    setNewAmount(debtor.totalDebt.toString());
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>زانیاری دووبارە پێکهێنانەوە</Text>
              
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
                  قەرزی ئێستا: {selectedDebtor.totalDebt.toLocaleString('en-US')}
                </Text>
              </View>

              <View style={[styles.calculatorCard, { 
                backgroundColor: colors.cardGlass,
                borderColor: colors.glassBorder,
              }]}>
                <Text style={[styles.calculatorTitle, { color: colors.text }]}>
                  ژمێرەری سوو
                </Text>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={[styles.calculateButton, { backgroundColor: colors.primary }]}
                    onPress={calculateWithInterest}
                  >
                    <Text style={styles.calculateButtonText}>ژمێرەر</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.inputSmall, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    }]}
                    placeholder="ڕێژەی سوو %"
                    placeholderTextColor={colors.textTertiary}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    keyboardType="numeric"
                    textAlign="right"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>بڕی نوێ</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="بڕ داخڵ بکە..."
                  placeholderTextColor={colors.textTertiary}
                  value={newAmount}
                  onChangeText={setNewAmount}
                  keyboardType="numeric"
                  textAlign="right"
                />
                {newAmount && !isNaN(parseFloat(newAmount)) && (
                  <View style={[styles.differenceCard, { 
                    backgroundColor: parseFloat(newAmount) < selectedDebtor.totalDebt 
                      ? colors.successGlass 
                      : parseFloat(newAmount) > selectedDebtor.totalDebt
                        ? colors.errorGlass
                        : colors.cardGlass,
                  }]}>
                    <Text style={[styles.differenceText, { 
                      color: parseFloat(newAmount) < selectedDebtor.totalDebt 
                        ? colors.success 
                        : parseFloat(newAmount) > selectedDebtor.totalDebt
                          ? colors.error
                          : colors.text,
                    }]}>
                      {parseFloat(newAmount) < selectedDebtor.totalDebt && 'کەمکردنەوە: '}
                      {parseFloat(newAmount) > selectedDebtor.totalDebt && 'زیادکردن: '}
                      {parseFloat(newAmount) === selectedDebtor.totalDebt && 'هیچ گۆڕانکارییەک نییە'}
                      {parseFloat(newAmount) !== selectedDebtor.totalDebt && 
                        Math.abs(selectedDebtor.totalDebt - parseFloat(newAmount)).toLocaleString('en-US')
                      }
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>هۆکار</Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="هۆکاری دووبارە پێکهێنانەوە بنووسە... (پێویستە)"
                  placeholderTextColor={colors.textTertiary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  textAlign="right"
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.restructureButton, { backgroundColor: colors.warning }]}
                onPress={handleRestructure}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color="#FFFFFF" />
                <Text style={styles.restructureButtonText}>دووبارە پێکهێنانەوە</Text>
              </TouchableOpacity>
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
  calculatorCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
  },
  calculatorTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    alignItems: 'center',
  },
  inputSmall: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
  },
  calculateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  calculateButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
  },
  differenceCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  differenceText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  restructureButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  restructureButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
