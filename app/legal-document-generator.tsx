import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, FileText, Download, Scale, FileSignature, Gavel } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type DocumentType = 'demand_letter' | 'payment_agreement' | 'settlement_agreement' | 'court_claim';

export default function LegalDocumentGeneratorScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { debtors } = useDebt();

  const [showDebtorPicker, setShowDebtorPicker] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);

  const documentTypes = [
    { id: 'demand_letter' as const, title: 'نامەی داواکاری', icon: FileText, description: 'نامەیەکی فەرمی بۆ داواکردنی پارە' },
    { id: 'payment_agreement' as const, title: 'ڕێککەوتنی پارەدان', icon: FileSignature, description: 'ڕێککەوتنی فەرمی بۆ پارەدان' },
    { id: 'settlement_agreement' as const, title: 'ڕێککەوتنی کۆتایی', icon: Scale, description: 'ڕێککەوتنی کۆتایی هێنان بە قەرز' },
    { id: 'court_claim' as const, title: 'سکاڵای دادگا', icon: Gavel, description: 'بەڵگەی سکاڵاکردن بۆ دادگا' },
  ];

  const generateDocument = async (type: DocumentType, debtorId: string) => {
    const debtor = debtors.find(d => d.id === debtorId);
    if (!debtor) return;

    const totalPaid = debtor.transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    const remainingDebt = debtor.totalDebt - totalPaid;

    let content = '';
    const date = new Date().toLocaleDateString('ku');

    switch (type) {
      case 'demand_letter':
        content = `
نامەی داواکاری پارە

بەڕێز: ${debtor.name}
ناونیشان: ${debtor.address || 'دیار نەکراوە'}
تەلەفۆن: ${debtor.phone}

بەروار: ${date}

بە ڕێزەوە،

ئەم نامەیە بۆ ئاگادارکردنەوەی تۆیە دەربارەی قەرزێک کە لەسەر ئەستۆی تۆیە.

وردەکاریەکان:
- کۆی گشتی قەرز: ${debtor.totalDebt.toLocaleString()} IQD
- بڕی پارەدراو: ${totalPaid.toLocaleString()} IQD  
- قەرزی ماوە: ${remainingDebt.toLocaleString()} IQD

تکایە لە ماوەی ١٥ ڕۆژ پارەکە بگەڕێنەرەوە یان پەیوەندیمان پێوە بکە بۆ ڕێککەوتن.

بە ڕێزەوە،
[ناوی کۆمپانیا/کەس]
        `;
        break;
      case 'payment_agreement':
        content = `
ڕێککەوتنی پارەدان

لە نێوان:

لایەنی یەکەم (خاوەنی قەرز): [ناوی خۆت]
لایەنی دووەم (قەرزدار): ${debtor.name}

بەروار: ${date}

وردەکاریەکانی قەرز:
- کۆی گشتی: ${debtor.totalDebt.toLocaleString()} IQD
- پارەدراو: ${totalPaid.toLocaleString()} IQD
- ماوە: ${remainingDebt.toLocaleString()} IQD

مەرجەکانی پارەدان:
1. لایەنی دووەم ڕازی دەبێت پارەکە لە [ماوە] دابگەڕێنێتەوە
2. پارەکە دەگەڕێتەوە بە [شێوازی پارەدان]
3. لە کاتی دواکەوتن، [سزا/مەرج]

واژووی لایەنەکان:

لایەنی یەکەم: _______________
لایەنی دووەم: _______________
        `;
        break;
      case 'settlement_agreement':
        content = `
ڕێککەوتنی کۆتایی هێنان بە قەرز

لە نێوان:

خاوەنی قەرز: [ناوی خۆت]
قەرزدار: ${debtor.name}

بەروار: ${date}

قەرزی سەرەتایی: ${debtor.totalDebt.toLocaleString()} IQD
بڕی ڕێککەوتن: [بڕی نوێ] IQD

مەرجەکان:
1. قەرزدار ڕازی دەبێت بڕی [X] بدات
2. خاوەنی قەرز ڕازی دەبێت پاشماوە ببەخشێت
3. دوای پارەدان، هیچ داواکاریەکی تر نامێنێت

واژوو:
خاوەنی قەرز: _______________
قەرزدار: _______________
        `;
        break;
      case 'court_claim':
        content = `
سکاڵا بۆ دادگا

سکاڵاکار: [ناوی خۆت]
سکاڵالێکراو: ${debtor.name}
ناونیشان: ${debtor.address || 'دیار نەکراوە'}

بەروار: ${date}

بابەتی سکاڵا:
داواکردنی گەڕاندنەوەی قەرز

وردەکاریەکان:
- بڕی سەرەکی: ${debtor.totalDebt.toLocaleString()} IQD
- پارەدراو: ${totalPaid.toLocaleString()} IQD
- قەرزی ماوە: ${remainingDebt.toLocaleString()} IQD

بەڵگەکان:
- مێژووی مامەڵەکان
- پەیوەندیەکان
- بەڵگەی قەرز

داواکاری:
داوا لە دادگا دەکرێت فەرمان بدات بە سکاڵالێکراو بۆ پارەدانەوە.

واژوو:
[ناوی تۆ]
        `;
        break;
    }

    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${debtor.name}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileName = `${type}_${debtor.name}_${Date.now()}.txt`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, content);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        }
      }
      Alert.alert('سەرکەوتوو', 'بەڵگەکە دروستکرا');
    } catch (error) {
      console.error('Error generating document:', error);
      Alert.alert('هەڵە', 'هەڵە لە دروستکردنی بەڵگە');
    }
  };

  const handleSelectType = (type: DocumentType) => {
    setSelectedType(type);
    setShowDebtorPicker(true);
  };

  const handleSelectDebtor = (debtorId: string) => {
    if (selectedType) {
      generateDocument(selectedType, debtorId);
    }
    setShowDebtorPicker(false);
    setSelectedType(null);
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
            <Text style={[styles.title, { color: colors.text }]}>دروستکردنی بەڵگەی یاسایی</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {documentTypes.map(doc => (
            <TouchableOpacity
              key={doc.id}
              style={[styles.docCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
              onPress={() => handleSelectType(doc.id)}
            >
              <View style={[styles.docIcon, { backgroundColor: colors.primaryGlass }]}>
                <doc.icon size={32} color={colors.primary} />
              </View>
              <View style={styles.docInfo}>
                <Text style={[styles.docTitle, { color: colors.text }]}>{doc.title}</Text>
                <Text style={[styles.docDesc, { color: colors.textSecondary }]}>{doc.description}</Text>
              </View>
              <Download size={20} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showDebtorPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDebtorPicker(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>هەڵبژاردنی قەرزدار</Text>
            <ScrollView style={styles.debtorList}>
              {debtors.map(debtor => (
                <TouchableOpacity
                  key={debtor.id}
                  style={[styles.debtorItem, { borderColor: colors.cardBorder }]}
                  onPress={() => handleSelectDebtor(debtor.id)}
                >
                  <View style={styles.debtorInfo}>
                    <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                    <Text style={[styles.debtorAmount, { color: colors.textSecondary }]}>
                      قەرز: {(debtor.totalDebt - debtor.transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0)).toLocaleString()} IQD
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
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
  docCard: { borderRadius: 20, borderWidth: 2, padding: 20, marginBottom: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 16 },
  docIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 18, fontWeight: '700' as const, textAlign: 'right', marginBottom: 4 },
  docDesc: { fontSize: 14, textAlign: 'right' },
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
