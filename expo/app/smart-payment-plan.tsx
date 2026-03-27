import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { generateText } from '@rork-ai/toolkit-sdk';

export default function SmartPaymentPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDebtor, addPaymentScheduleItem } = useDebt();
  const debtor = id ? getDebtor(id) : undefined;

  const [isGenerating, setIsGenerating] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [paymentCapacity] = useState('');
  const [preferredMonths, setPreferredMonths] = useState('6');
  const [generatedPlan, setGeneratedPlan] = useState<{
    monthlyPayment: number;
    totalMonths: number;
    schedule: { month: number; amount: number; date: string }[];
    advice: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!debtor) {
      Alert.alert('هەڵە', 'کڕیارەکە نەدۆزرایەوە');
      return;
    }

    if (!monthlyIncome || !monthlyExpenses) {
      Alert.alert('هەڵە', 'تکایە داهات و خەرجی مانگانە بنووسە');
      return;
    }

    setIsGenerating(true);
    try {
      const income = parseFloat(monthlyIncome);
      const expenses = parseFloat(monthlyExpenses);
      const capacity = paymentCapacity ? parseFloat(paymentCapacity) : income - expenses;
      const totalDebt = debtor.totalDebt;
      const months = parseInt(preferredMonths);

      const prompt = `کڕیارێک هەیە بە ناوی "${debtor.name}" کە ${totalDebt.toLocaleString('en-US')} دینار قەرزی لەسەرە.
      
داهاتی مانگانەی: ${income.toLocaleString('en-US')} دینار
خەرجی مانگانەی: ${expenses.toLocaleString('en-US')} دینار
توانای پارەدانی مانگانە: ${capacity.toLocaleString('en-US')} دینار
ماوەی پێشنیارکراو: ${months} مانگ

تکایە پلانێکی ژیرانە بۆ پارەدان دروست بکە کە:
1. واقیعی بێت و بتوانرێت جێبەجێی بکرێت
2. بار لەسەر کڕیار زۆر نەبێت
3. هەموو قەرزەکە لە ماوەیەکی گونجاودا بداتەوە

تەنها JSON بگەڕێنەوە بەم شێوەیە:
{
  "monthlyPayment": بڕی پێشنیارکراو بۆ هەر مانگێک,
  "totalMonths": کۆی مانگەکان,
  "advice": "ئامۆژگاری کورت بە کوردی بۆ کڕیار"
}`;

      const response = await generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const schedule = [];
        const today = new Date();
        for (let i = 0; i < parsed.totalMonths; i++) {
          const paymentDate = new Date(today);
          paymentDate.setMonth(paymentDate.getMonth() + i + 1);
          schedule.push({
            month: i + 1,
            amount: parsed.monthlyPayment,
            date: paymentDate.toISOString(),
          });
        }

        setGeneratedPlan({
          monthlyPayment: parsed.monthlyPayment,
          totalMonths: parsed.totalMonths,
          schedule,
          advice: parsed.advice,
        });
      } else {
        Alert.alert('هەڵە', 'نەتوانرا پلان دروست بکرێت');
      }
    } catch (error) {
      console.error('Error generating payment plan:', error);
      Alert.alert('هەڵە', 'کێشەیەک ڕوویدا لە دروستکردنی پلان');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePlan = () => {
    if (!generatedPlan || !debtor) return;

    Alert.alert(
      'پاشەکەوتکردنی پلان',
      'ئایا دڵنیایت لە پاشەکەوتکردنی ئەم پلانە؟',
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: () => {
            generatedPlan.schedule.forEach(item => {
              addPaymentScheduleItem(debtor.id, item.amount, item.date);
            });
            Alert.alert('سەرکەوتوو', 'پلانەکە پاشەکەوت کرا', [
              {
                text: 'باشە',
                onPress: () => router.back(),
              },
            ]);
          },
        },
      ]
    );
  };

  const availableForPayment = useMemo(() => {
    if (!monthlyIncome || !monthlyExpenses) return 0;
    const income = parseFloat(monthlyIncome);
    const expenses = parseFloat(monthlyExpenses);
    return income - expenses;
  }, [monthlyIncome, monthlyExpenses]);

  if (!debtor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={[styles.errorText, { color: colors.error }]}>کڕیارەکە نەدۆزرایەوە</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>پلانی پارەدانی ژیرانە</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={[styles.debtorCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
            <Text style={[styles.debtAmount, { color: colors.error }]}>
              {debtor.totalDebt.toLocaleString('en-US')} IQD
            </Text>
            <Text style={[styles.debtLabel, { color: colors.textSecondary }]}>قەرزی سەرەکی</Text>
          </View>

          <View style={[styles.inputCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>داهاتی مانگانە</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.currency, { color: colors.textSecondary }]}>IQD</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                keyboardType="numeric"
              />
              <DollarSign size={20} color={colors.success} />
            </View>
          </View>

          <View style={[styles.inputCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>خەرجی مانگانە</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.currency, { color: colors.textSecondary }]}>IQD</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                value={monthlyExpenses}
                onChangeText={setMonthlyExpenses}
                keyboardType="numeric"
              />
              <DollarSign size={20} color={colors.error} />
            </View>
          </View>

          {availableForPayment > 0 && (
            <View style={[styles.availableCard, { backgroundColor: colors.successGlass, borderColor: colors.success + '40' }]}>
              <TrendingUp size={20} color={colors.success} />
              <Text style={[styles.availableText, { color: colors.success }]}>
                {availableForPayment.toLocaleString('en-US')} IQD بەردەستە بۆ پارەدان
              </Text>
            </View>
          )}

          <View style={[styles.inputCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>ماوەی پێشنیارکراو (مانگ)</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="6"
                placeholderTextColor={colors.textTertiary}
                value={preferredMonths}
                onChangeText={setPreferredMonths}
                keyboardType="numeric"
              />
              <Calendar size={20} color={colors.primary} />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              {
                backgroundColor: colors.primary,
                opacity: isGenerating ? 0.6 : 1,
              },
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.generateButtonText}>دروستکردنی پلانی ژیرانە</Text>
            )}
          </TouchableOpacity>

          {generatedPlan && (
            <View style={[styles.planCard, { backgroundColor: colors.cardGlass, borderColor: colors.primary }]}>
              <View style={[styles.planHeader, { borderBottomColor: colors.glassBorder }]}>
                <Text style={[styles.planTitle, { color: colors.text }]}>پلانی پێشنیارکراو</Text>
              </View>

              <View style={styles.planStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {generatedPlan.monthlyPayment.toLocaleString('en-US')}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>پارەدانی مانگانە</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    {generatedPlan.totalMonths}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>مانگ</Text>
                </View>
              </View>

              {generatedPlan.advice && (
                <View style={[styles.adviceCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.adviceTitle, { color: colors.primary }]}>ئامۆژگاری:</Text>
                  <Text style={[styles.adviceText, { color: colors.text }]}>{generatedPlan.advice}</Text>
                </View>
              )}

              <Text style={[styles.scheduleTitle, { color: colors.text }]}>خشتەی پارەدان</Text>
              {generatedPlan.schedule.map((item, index) => (
                <View
                  key={index}
                  style={[styles.scheduleItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.scheduleInfo}>
                    <Text style={[styles.scheduleMonth, { color: colors.text }]}>مانگی {item.month}</Text>
                    <Text style={[styles.scheduleDate, { color: colors.textSecondary }]}>
                      {new Date(item.date).toLocaleDateString('ar-IQ')}
                    </Text>
                  </View>
                  <Text style={[styles.scheduleAmount, { color: colors.primary }]}>
                    {item.amount.toLocaleString('en-US')}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.success }]}
                onPress={handleSavePlan}
              >
                <Check size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>پاشەکەوتکردنی پلان</Text>
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  debtorCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  debtorName: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  debtAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  debtLabel: {
    fontSize: 14,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 50,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
  },
  currency: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  availableCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  availableText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  generateButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  planHeader: {
    padding: 20,
    borderBottomWidth: 1,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  planStats: {
    flexDirection: 'row-reverse',
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  adviceCard: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  adviceText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginHorizontal: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  scheduleItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  scheduleInfo: {
    alignItems: 'flex-end',
  },
  scheduleMonth: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: 12,
  },
  scheduleAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  saveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 12,
    padding: 18,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
});
