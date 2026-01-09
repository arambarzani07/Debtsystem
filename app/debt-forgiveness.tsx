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
import { ChevronLeft, HandshakeIcon, DollarSign, User } from 'lucide-react-native';
import type { Debtor } from '@/types';

export default function DebtForgivenessScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { debtors, addTransaction } = useDebt();
  
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [forgivenessAmount, setForgivenessAmount] = useState('');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const debtorsWithDebt = debtors.filter(d => d.totalDebt > 0);
  const filteredDebtors = debtorsWithDebt.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.includes(searchQuery)
  );

  const handleForgiveDebt = async () => {
    if (!selectedDebtor) {
      Alert.alert('هەڵە', 'تکایە قەرزدارێک هەڵبژێرە');
      return;
    }

    const amount = parseFloat(forgivenessAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('هەڵە', 'تکایە بڕێکی دروست داخڵ بکە');
      return;
    }

    if (amount > selectedDebtor.totalDebt) {
      Alert.alert('هەڵە', `بڕی لێخۆشبوون نابێت لە قەرزی گشتی (${selectedDebtor.totalDebt.toLocaleString('en-US')}) زیاتر بێت`);
      return;
    }

    if (!reason.trim()) {
      Alert.alert('هەڵە', 'تکایە هۆکار بنووسە');
      return;
    }

    Alert.alert(
      'لێخۆشبوونی قەرز',
      `ئایا دڵنیایت لە لێخۆشبوون لە ${amount.toLocaleString('en-US')} بۆ ${selectedDebtor.name}؟\n\nئەم کردارە ناگەڕێتەوە.`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          style: 'destructive',
          onPress: async () => {
            try {
              await addTransaction(
                selectedDebtor.id,
                amount,
                `لێخۆشبوونی قەرز: ${reason}`,
                'payment'
              );

              Alert.alert(
                'سەرکەوتوو',
                `${amount.toLocaleString('en-US')} لێخۆشبوو بۆ ${selectedDebtor.name}`,
                [
                  {
                    text: 'باشە',
                    onPress: () => {
                      setSelectedDebtor(null);
                      setForgivenessAmount('');
                      setReason('');
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error forgiving debt:', error);
              Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە لێخۆشبوون');
            }
          },
        },
      ]
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
            <Text style={[styles.title, { color: colors.text }]}>لێخۆشبوونی قەرز</Text>
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
            <HandshakeIcon size={40} color={colors.primary} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              لێخۆشبوونی قەرز
            </Text>
            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
              دەتوانیت بەشێک یان هەموو قەرزی کڕیارێک لێخۆشبێت. ئەم کردارە ناگەڕێتەوە.
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
                    setForgivenessAmount(debtor.totalDebt.toString());
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>زانیاری لێخۆشبوون</Text>
              
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

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>بڕی لێخۆشبوون</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="بڕ داخڵ بکە..."
                  placeholderTextColor={colors.textTertiary}
                  value={forgivenessAmount}
                  onChangeText={setForgivenessAmount}
                  keyboardType="numeric"
                  textAlign="right"
                />
                <TouchableOpacity
                  style={[styles.maxButton, { backgroundColor: colors.primaryGlass }]}
                  onPress={() => setForgivenessAmount(selectedDebtor.totalDebt.toString())}
                >
                  <Text style={[styles.maxButtonText, { color: colors.primary }]}>
                    هەموو قەرزەکە
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>هۆکاری لێخۆشبوون</Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text,
                  }]}
                  placeholder="هۆکار بنووسە... (پێویستە)"
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
                style={[styles.forgiveButton, { backgroundColor: colors.success }]}
                onPress={handleForgiveDebt}
                activeOpacity={0.8}
              >
                <HandshakeIcon size={20} color="#FFFFFF" />
                <Text style={styles.forgiveButtonText}>لێخۆشبوون لە قەرز</Text>
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
  maxButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  maxButtonText: {
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
  forgiveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  forgiveButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
