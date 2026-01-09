import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Percent } from 'lucide-react-native';

export default function DebtSettlementCalculatorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { debtors } = useDebt();
  
  const [originalAmount, setOriginalAmount] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  
  const calculateSettlement = () => {
    const original = parseFloat(originalAmount) || 0;
    const discount = parseFloat(discountPercent) || 0;
    const paid = parseFloat(paidAmount) || 0;
    
    const discountAmount = original * (discount / 100);
    const newTotal = original - discountAmount;
    const remaining = newTotal - paid;
    const totalDiscount = original - newTotal;
    
    return {
      original,
      discountAmount,
      newTotal,
      paid,
      remaining,
      totalDiscount,
      savingsPercent: discount
    };
  };
  
  const result = calculateSettlement();
  const totalDebt = debtors.reduce((sum, d) => {
    const paid = d.transactions.filter(t => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
    return sum + (d.totalDebt - paid);
  }, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>ژمێرەری ڕێککەوتن</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.statCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی گشتی قەرزەکان</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{totalDebt.toLocaleString()} IQD</Text>
          </View>

          <View style={[styles.inputCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>ژمێرەری ڕێککەوتن</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>بڕی سەرەتایی</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={originalAmount}
                onChangeText={setOriginalAmount}
                placeholder="100000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>ڕێژەی داشکان (%)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={discountPercent}
                onChangeText={setDiscountPercent}
                placeholder="10"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>بڕی پارەدراو</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={paidAmount}
                onChangeText={setPaidAmount}
                placeholder="50000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>
          </View>

          {(result.original > 0 || result.discountAmount > 0) && (
            <View style={[styles.resultCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>ئەنجامەکان</Text>
              
              <View style={styles.resultRow}>
                <Text style={[styles.resultValue, { color: colors.text }]}>{result.original.toLocaleString()} IQD</Text>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>بڕی سەرەتایی</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={[styles.resultValue, { color: colors.error }]}>-{result.discountAmount.toLocaleString()} IQD</Text>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>داشکان ({result.savingsPercent}%)</Text>
              </View>

              <View style={[styles.resultRow, styles.totalRow]}>
                <Text style={[styles.resultValue, { color: colors.warning, fontWeight: '700' as const }]}>{result.newTotal.toLocaleString()} IQD</Text>
                <Text style={[styles.resultLabel, { color: colors.text }]}>کۆی نوێ</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={[styles.resultValue, { color: colors.success }]}>{result.paid.toLocaleString()} IQD</Text>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>پارەدراو</Text>
              </View>

              <View style={[styles.resultRow, styles.totalRow]}>
                <Text style={[styles.resultValue, { color: colors.primary, fontSize: 24, fontWeight: '700' as const }]}>{result.remaining.toLocaleString()} IQD</Text>
                <Text style={[styles.resultLabel, { color: colors.text, fontSize: 16 }]}>ماوە</Text>
              </View>

              <View style={[styles.savingsBox, { backgroundColor: colors.successGlass }]}>
                <Percent size={20} color={colors.success} />
                <Text style={[styles.savingsText, { color: colors.success }]}>
                  پاشەکەوتکردن: {result.totalDiscount.toLocaleString()} IQD
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 20 },
  headerCard: { borderRadius: 24, borderWidth: 2, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center', flex: 1 },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 30 },
  statCard: { borderRadius: 16, borderWidth: 2, padding: 20, marginBottom: 20, alignItems: 'center' },
  statLabel: { fontSize: 14, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '700' as const },
  inputCard: { borderRadius: 20, borderWidth: 2, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 20, textAlign: 'right' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600' as const, marginBottom: 8, textAlign: 'right' },
  input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, textAlign: 'right' },
  resultCard: { borderRadius: 20, borderWidth: 2, padding: 24, marginBottom: 20 },
  resultTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 20, textAlign: 'right' },
  resultRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingVertical: 8 },
  totalRow: { borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 },
  resultLabel: { fontSize: 15 },
  resultValue: { fontSize: 18, fontWeight: '600' as const },
  savingsBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 16 },
  savingsText: { fontSize: 16, fontWeight: '600' as const },
});
