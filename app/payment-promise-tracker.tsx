import { useTheme } from '@/contexts/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Calendar, Check, X, AlertCircle, Clock } from 'lucide-react-native';
import { usePromises } from '@/contexts/PromiseContext';
import { useDebt } from '@/contexts/DebtContext';

export default function PaymentPromiseTrackerScreen() {
  const { colors } = useTheme();
  const { promises, addPromise, markAsKept, markAsBroken, getPendingPromises, getOverduePromises } = usePromises();
  const { debtors } = useDebt();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const pendingPromises = getPendingPromises();
  const overduePromises = getOverduePromises();

  const handleAddPromise = () => {
    if (!selectedDebtorId || !amount || !dueDate) {
      if (Platform.OS === 'web') {
        alert('تکایە هەموو خانەکان پڕبکەرەوە');
      } else {
        Alert.alert('هەڵە', 'تکایە هەموو خانەکان پڕبکەرەوە');
      }
      return;
    }

    const debtor = debtors.find(d => d.id === selectedDebtorId);
    if (!debtor) return;

    addPromise({
      debtorId: selectedDebtorId,
      debtorName: debtor.name,
      amount: parseFloat(amount),
      dueDate: new Date(dueDate).toISOString(),
      notes,
    });

    setShowAddForm(false);
    setSelectedDebtorId('');
    setAmount('');
    setDueDate('');
    setNotes('');

    if (Platform.OS === 'web') {
      alert('بەڵێن بەسەرکەوتوویی زیادکرا');
    } else {
      Alert.alert('سەرکەوتوو', 'بەڵێن بەسەرکەوتوویی زیادکرا');
    }
  };

  const handleMarkAsKept = (id: string) => {
    markAsKept(id);
    if (Platform.OS === 'web') {
      alert('بەڵێن وەک جێبەجێکراو نیشان درا');
    } else {
      Alert.alert('سەرکەوتوو', 'بەڵێن وەک جێبەجێکراو نیشان درا');
    }
  };

  const handleMarkAsBroken = (id: string) => {
    markAsBroken(id);
    if (Platform.OS === 'web') {
      alert('بەڵێن وەک شکێنراو نیشان درا');
    } else {
      Alert.alert('ئاگادار', 'بەڵێن وەک شکێنراو نیشان درا');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'چاوەڕێ', color: colors.warning };
      case 'kept':
        return { text: 'جێبەجێکراو', color: colors.success };
      case 'broken':
        return { text: 'شکێنراو', color: colors.error };
      default:
        return { text: status, color: colors.textSecondary };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <Clock size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{pendingPromises.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>چاوەڕوان</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.errorGlass, borderColor: colors.error }]}>
              <AlertCircle size={24} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.text }]}>{overduePromises.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>دواکەوتوو</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>بەڵێنی نوێ زیاد بکە</Text>
          </TouchableOpacity>

          {showAddForm && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>بەڵێنی نوێ</Text>
              
              <Text style={[styles.label, { color: colors.text }]}>کڕیار هەڵبژێرە</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.debtorScroll}>
                {debtors.map(debtor => (
                  <TouchableOpacity
                    key={debtor.id}
                    style={[
                      styles.debtorChip,
                      { 
                        backgroundColor: selectedDebtorId === debtor.id ? colors.primary : colors.cardGlass,
                        borderColor: selectedDebtorId === debtor.id ? colors.primary : colors.glassBorder,
                      }
                    ]}
                    onPress={() => setSelectedDebtorId(debtor.id)}
                  >
                    <Text style={[styles.debtorChipText, { color: selectedDebtorId === debtor.id ? '#FFFFFF' : colors.text }]}>
                      {debtor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.text }]}>بڕی پارە</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="بڕی پارە"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { color: colors.text }]}>بەرواری دواکەوتن (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="2024-12-31"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.label, { color: colors.text }]}>تێبینی</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="تێبینی..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddPromise}
                >
                  <Text style={styles.formButtonText}>زیادکردن</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, borderWidth: 1 }]}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={[styles.formButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {promises.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ بەڵێنێک تۆمار نەکراوە
              </Text>
            </View>
          ) : (
            promises.map(promise => {
              const statusBadge = getStatusBadge(promise.status);
              const isOverdue = promise.status === 'pending' && new Date(promise.dueDate) < new Date();
              
              return (
                <View key={promise.id} style={[styles.promiseCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.promiseHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.color + '22' }]}>
                      <Text style={[styles.statusText, { color: statusBadge.color }]}>
                        {statusBadge.text}
                      </Text>
                    </View>
                    <Text style={[styles.promiseName, { color: colors.text }]}>{promise.debtorName}</Text>
                  </View>

                  <View style={styles.promiseDetails}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {promise.amount.toLocaleString('en-US')} IQD
                      </Text>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>بڕ:</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailValue, { color: isOverdue ? colors.error : colors.text }]}>
                        {formatDate(promise.dueDate)}
                      </Text>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>بەروار:</Text>
                    </View>

                    {promise.notes && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                          {promise.notes}
                        </Text>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>تێبینی:</Text>
                      </View>
                    )}
                  </View>

                  {promise.status === 'pending' && (
                    <View style={styles.promiseActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.successGlass, borderColor: colors.success }]}
                        onPress={() => handleMarkAsKept(promise.id)}
                      >
                        <Check size={20} color={colors.success} />
                        <Text style={[styles.actionButtonText, { color: colors.success }]}>جێبەجێکرا</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.errorGlass, borderColor: colors.error }]}
                        onPress={() => handleMarkAsBroken(promise.id)}
                      >
                        <X size={20} color={colors.error} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>شکێنرا</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 30, paddingTop: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 2, padding: 16, alignItems: 'center', gap: 8 },
  statValue: { fontSize: 24, fontWeight: '700' as const },
  statLabel: { fontSize: 14 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, marginBottom: 20 },
  addButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: '700' as const, marginBottom: 16, textAlign: 'right' },
  label: { fontSize: 14, fontWeight: '600' as const, marginBottom: 8, marginTop: 12, textAlign: 'right' },
  debtorScroll: { marginBottom: 12 },
  debtorChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  debtorChipText: { fontSize: 14, fontWeight: '600' as const },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, textAlign: 'right' },
  textArea: { height: 80, textAlignVertical: 'top' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  formButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  formButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  promiseCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  promiseHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  promiseName: { fontSize: 18, fontWeight: '700' as const, flex: 1, textAlign: 'right', marginRight: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' as const },
  promiseDetails: { gap: 8, marginBottom: 12 },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailLabel: { fontSize: 14, fontWeight: '600' as const },
  detailValue: { fontSize: 14, flex: 1, textAlign: 'right', marginRight: 12 },
  promiseActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  actionButtonText: { fontSize: 14, fontWeight: '700' as const },
});
