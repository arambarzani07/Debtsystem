import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CreditCard,
  Wallet,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Nfc,
  Fingerprint,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebt } from '@/contexts/DebtContext';
import * as Haptics from 'expo-haptics';

type PaymentMethod = 'card' | 'wallet' | 'qr' | 'cash' | 'nfc' | 'crypto';

interface Transaction {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: 'processing' | 'success' | 'failed';
  timestamp: Date;
  reference: string;
}

export default function PaymentTerminal() {
  const { language } = useLanguage();
  const { addTransaction, debtors } = useDebt();

  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [selectedDebtor, setSelectedDebtor] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);



  const t = {
    title: language === 'ku' ? 'تێرمیناڵی پارەدان' : language === 'ar' ? 'محطة الدفع' : 'Payment Terminal',
    enterAmount: language === 'ku' ? 'بڕی پارە بنووسە' : language === 'ar' ? 'أدخل المبلغ' : 'Enter Amount',
    selectMethod: language === 'ku' ? 'شێوازی پارەدان هەڵبژێرە' : language === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method',
    selectCustomer: language === 'ku' ? 'کڕیار هەڵبژێرە' : language === 'ar' ? 'اختر العميل' : 'Select Customer',
    card: language === 'ku' ? 'کارتی بانکی' : language === 'ar' ? 'بطاقة بنكية' : 'Bank Card',
    wallet: language === 'ku' ? 'جزدانی ئەلیکترۆنی' : language === 'ar' ? 'محفظة إلكترونية' : 'E-Wallet',
    qr: language === 'ku' ? 'کۆدی QR' : language === 'ar' ? 'رمز QR' : 'QR Code',
    cash: language === 'ku' ? 'کاش' : language === 'ar' ? 'نقدي' : 'Cash',
    nfc: language === 'ku' ? 'پارەدانی NFC' : language === 'ar' ? 'دفع NFC' : 'NFC Payment',
    crypto: language === 'ku' ? 'کریپتۆ' : language === 'ar' ? 'عملة رقمية' : 'Cryptocurrency',
    processPayment: language === 'ku' ? 'پارە وەربگرە' : language === 'ar' ? 'معالجة الدفع' : 'Process Payment',
    processing: language === 'ku' ? 'پرۆسێس دەکرێت...' : language === 'ar' ? 'جاري المعالجة...' : 'Processing...',
    success: language === 'ku' ? 'سەرکەوتوو بوو!' : language === 'ar' ? 'نجح!' : 'Success!',
    failed: language === 'ku' ? 'سەرنەکەوتوو بوو' : language === 'ar' ? 'فشل' : 'Failed',
    recentTransactions: language === 'ku' ? 'مامەڵەکانی دوایی' : language === 'ar' ? 'المعاملات الأخيرة' : 'Recent Transactions',
    cardNumber: language === 'ku' ? 'ژمارەی کارت' : language === 'ar' ? 'رقم البطاقة' : 'Card Number',
    pin: language === 'ku' ? 'کۆدی نهێنی' : language === 'ar' ? 'الرقم السري' : 'PIN',
    securePayment: language === 'ku' ? 'پارەدانی پاراستراو' : language === 'ar' ? 'دفع آمن' : 'Secure Payment',
  };

  const paymentMethods = [
    { type: 'card' as PaymentMethod, label: t.card, icon: CreditCard, color: '#3b82f6' },
    { type: 'wallet' as PaymentMethod, label: t.wallet, icon: Wallet, color: '#8b5cf6' },
    { type: 'qr' as PaymentMethod, label: t.qr, icon: QrCode, color: '#06b6d4' },
    { type: 'cash' as PaymentMethod, label: t.cash, icon: Banknote, color: '#10b981' },
    { type: 'nfc' as PaymentMethod, label: t.nfc, icon: Nfc, color: '#f59e0b' },
    { type: 'crypto' as PaymentMethod, label: t.crypto, icon: Wallet, color: '#ec4899' },
  ];

  const processPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedDebtor) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing(true);

    const transactionId = Math.random().toString(36).substring(7).toUpperCase();

    const newTransaction: Transaction = {
      id: transactionId,
      amount: parseFloat(amount),
      method: selectedMethod,
      status: 'processing',
      timestamp: new Date(),
      reference: `PAY-${transactionId}`,
    };

    setTransactions([newTransaction, ...transactions]);

    setTimeout(async () => {
      const success = Math.random() > 0.1;

      if (success) {
        newTransaction.status = 'success';
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Vibration.vibrate([0, 100, 50, 100]);
        setShowSuccess(true);

        await addTransaction(
          selectedDebtor,
          parseFloat(amount),
          `Payment via ${selectedMethod} - ${newTransaction.reference}`,
          'payment'
        );

        setTimeout(() => {
          setShowSuccess(false);
          setAmount('');
          setCardNumber('');
          setPin('');
        }, 2000);
      } else {
        newTransaction.status = 'failed';
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(t.failed, 'Payment could not be processed. Please try again.');
      }

      setTransactions([newTransaction, ...transactions.slice(1)]);
      setProcessing(false);
    }, 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const themeContext = useTheme();
  const isDark = themeContext.settings.theme === 'dark';
  const bgColor = isDark ? '#000' : '#f8fafc';
  const cardBg = isDark ? '#1a1a1a' : '#fff';
  const textColor = isDark ? '#fff' : '#000';
  const secondaryText = isDark ? '#999' : '#666';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t.title,
          headerStyle: { backgroundColor: isDark ? '#1a1a1a' : '#fff' },
          headerTintColor: textColor,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.terminalCard, { backgroundColor: cardBg }]}>
          <View style={styles.secureHeader}>
            <Shield size={20} color="#10b981" />
            <Text style={[styles.secureText, { color: '#10b981' }]}>{t.securePayment}</Text>
          </View>

          <View style={styles.amountSection}>
            <Text style={[styles.label, { color: secondaryText }]}>{t.enterAmount}</Text>
            <View style={[styles.amountInput, { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' }]}>
              <Text style={[styles.currency, { color: textColor }]}>IQD</Text>
              <TextInput
                style={[styles.amountText, { color: textColor }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor={secondaryText}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.customerSection}>
            <Text style={[styles.label, { color: secondaryText }]}>{t.selectCustomer}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.customerList}>
              {debtors.map((debtor: any) => (
                <TouchableOpacity
                  key={debtor.id}
                  style={[
                    styles.customerChip,
                    { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' },
                    selectedDebtor === debtor.id && styles.selectedChip,
                  ]}
                  onPress={() => setSelectedDebtor(debtor.id)}
                >
                  <Text
                    style={[
                      styles.customerName,
                      { color: textColor },
                      selectedDebtor === debtor.id && styles.selectedText,
                    ]}
                  >
                    {debtor.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.methodSection}>
            <Text style={[styles.label, { color: secondaryText }]}>{t.selectMethod}</Text>
            <View style={styles.methodGrid}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.type;
                return (
                  <TouchableOpacity
                    key={method.type}
                    style={[
                      styles.methodCard,
                      { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9' },
                      isSelected && { backgroundColor: method.color },
                    ]}
                    onPress={() => {
                      setSelectedMethod(method.type);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Icon size={24} color={isSelected ? '#fff' : method.color} />
                    <Text
                      style={[
                        styles.methodLabel,
                        { color: isSelected ? '#fff' : textColor },
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {selectedMethod === 'card' && (
            <View style={styles.cardDetails}>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9', color: textColor }]}
                placeholder={t.cardNumber}
                placeholderTextColor={secondaryText}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
                maxLength={16}
              />
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2a2a2a' : '#f1f5f9', color: textColor }]}
                placeholder={t.pin}
                placeholderTextColor={secondaryText}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.processButton,
              { backgroundColor: processing ? '#999' : '#10b981' },
            ]}
            onPress={processPayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Fingerprint size={20} color="#fff" />
                <Text style={styles.processButtonText}>{t.processPayment}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {transactions.length > 0 && (
          <View style={[styles.transactionsCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{t.recentTransactions}</Text>
            {transactions.map((transaction) => (
              <View key={transaction.id} style={[styles.transactionItem, { borderBottomColor: isDark ? '#2a2a2a' : '#e2e8f0' }]}>
                <View style={styles.transactionLeft}>
                  {transaction.status === 'success' ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : transaction.status === 'failed' ? (
                    <AlertCircle size={20} color="#ef4444" />
                  ) : (
                    <ActivityIndicator size="small" color="#f59e0b" />
                  )}
                  <View style={styles.transactionInfo}>
                    <Text style={[styles.transactionRef, { color: textColor }]}>
                      {transaction.reference}
                    </Text>
                    <Text style={[styles.transactionMethod, { color: secondaryText }]}>
                      {paymentMethods.find(m => m.type === transaction.method)?.label}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: textColor }]}>
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: cardBg }]}>
            <CheckCircle2 size={64} color="#10b981" />
            <Text style={[styles.successTitle, { color: textColor }]}>{t.success}</Text>
            <Text style={[styles.successAmount, { color: '#10b981' }]}>
              {formatCurrency(parseFloat(amount))}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  terminalCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  secureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    paddingVertical: 8,
  },
  secureText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
  },
  amountText: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
  },
  customerSection: {
    marginBottom: 24,
  },
  customerList: {
    marginTop: 8,
  },
  customerChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#3b82f6',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
  methodSection: {
    marginBottom: 24,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  methodCard: {
    width: '31%',
    aspectRatio: 1.2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardDetails: {
    gap: 12,
    marginBottom: 24,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 18,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  transactionsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionInfo: {
    gap: 4,
  },
  transactionRef: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionMethod: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
});
