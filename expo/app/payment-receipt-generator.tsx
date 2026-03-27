import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, FileText, Printer } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function PaymentReceiptGeneratorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { debtors } = useDebt();
  const [showDebtorPicker, setShowDebtorPicker] = useState(false);

  const generateReceipt = async (debtorId: string) => {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) return;

    const payments = debtor.transactions.filter(t => t.type === 'payment');
    if (payments.length === 0) {
      Alert.alert('هەڵە', 'هیچ پارەدانێک بۆ ئەم کڕیارە نییە');
      return;
    }

    const lastPayment = payments[payments.length - 1];
    const date = new Date(lastPayment.date).toLocaleDateString('ku');
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = debtor.totalDebt - totalPaid;

    const content = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        پسوڵەی پارەدان
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

بەروار: ${date}
ژمارەی پسوڵە: #${Date.now().toString().slice(-8)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

زانیاریەکانی کڕیار:
ناو: ${debtor.name}
تەلەفۆن: ${debtor.phone || 'دیار نەکراوە'}
${debtor.address ? `ناونیشان: ${debtor.address}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

وردەکاریەکانی پارەدان:

کۆی گشتی قەرز:      ${debtor.totalDebt.toLocaleString()} IQD
پارەدراوی پێشوو:     ${(totalPaid - lastPayment.amount).toLocaleString()} IQD
پارەدانی ئێستا:      ${lastPayment.amount.toLocaleString()} IQD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
کۆی پارەدراو:         ${totalPaid.toLocaleString()} IQD
قەرزی ماوە:           ${remaining.toLocaleString()} IQD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${lastPayment.description ? `تێبینی: ${lastPayment.description}` : ''}

سوپاس بۆ پارەدانەکەت!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${debtor.name}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileName = `receipt_${debtor.name}_${Date.now()}.txt`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, content);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }
      }
      Alert.alert('سەرکەوتوو', 'پسوڵە دروستکرا');
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('هەڵە', 'هەڵە لە دروستکردنی پسوڵە');
    }
  };

  const handleSelectDebtor = (debtorId: string) => {
    generateReceipt(debtorId);
    setShowDebtorPicker(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>دروستکردنی پسوڵە</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryGlass }]}>
              <FileText size={48} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>دروستکردنی پسوڵەی پارەدان</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>
              دروستکردنی پسوڵەی فەرمی بۆ پارەدانەکانی کڕیارەکان
            </Text>
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowDebtorPicker(true)}
            >
              <Printer size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>دروستکردنی پسوڵە</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.successGlass, borderColor: colors.success }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>زانیاریەکانی پسوڵە:</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              • ناوی کڕیار و زانیاری پەیوەندی{'\n'}
              • کۆی گشتی قەرز{'\n'}
              • بڕی پارەدراو{'\n'}
              • قەرزی ماوە{'\n'}
              • بەروار و ژمارەی پسوڵە
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showDebtorPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDebtorPicker(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>هەڵبژاردنی کڕیار</Text>
            <ScrollView style={styles.debtorList}>
              {debtors.map(debtor => {
                const payments = debtor.transactions.filter(t => t.type === 'payment');
                if (payments.length === 0) return null;
                
                return (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[styles.debtorItem, { borderColor: colors.cardBorder }]}
                    onPress={() => handleSelectDebtor(debtor.id)}
                  >
                    <View style={styles.debtorInfo}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                      <Text style={[styles.debtorAmount, { color: colors.textSecondary }]}>
                        پارەدان: {payments.length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.cardBorder }]}
              onPress={() => setShowDebtorPicker(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  card: { borderRadius: 20, borderWidth: 2, padding: 32, alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 22, fontWeight: '700' as const, marginBottom: 12, textAlign: 'center' },
  cardText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  generateButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  generateButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
  infoCard: { borderRadius: 16, borderWidth: 2, padding: 20 },
  infoTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 12, textAlign: 'right' },
  infoText: { fontSize: 14, lineHeight: 24, textAlign: 'right' },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: '700' as const, textAlign: 'center', marginBottom: 20 },
  debtorList: { maxHeight: 400 },
  debtorItem: { padding: 16, borderBottomWidth: 1, marginBottom: 8 },
  debtorInfo: { alignItems: 'flex-end' },
  debtorName: { fontSize: 16, fontWeight: '600' as const, marginBottom: 4 },
  debtorAmount: { fontSize: 14 },
  cancelButton: { marginTop: 16, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600' as const },
});
