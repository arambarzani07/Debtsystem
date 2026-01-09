import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Shield, User, Edit2 } from 'lucide-react-native';

export default function CustomerCreditLimitsScreen() {
  const { colors } = useTheme();
  const { debtors, updateDebtor } = useDebt();
  const router = useRouter();

  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creditLimit, setCreditLimit] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const debtorsWithLimits = useMemo(() => {
    return debtors
      .filter((d) => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone?.includes(searchQuery)
      )
      .map((debtor) => {
        const currentDebt = debtor.transactions.reduce(
          (sum, t) => sum + (t.type === 'debt' ? t.amount : -t.amount),
          0
        );
        const limit = debtor.creditLimit || 0;
        const remaining = limit - currentDebt;
        const percentage = limit > 0 ? (currentDebt / limit) * 100 : 0;

        return {
          ...debtor,
          currentDebt,
          creditLimit: limit,
          remaining,
          percentage,
          status: limit === 0 ? 'unlimited' : 
                 percentage >= 100 ? 'exceeded' : 
                 percentage >= 80 ? 'warning' : 'safe',
        };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [debtors, searchQuery]);

  const handleEditLimit = (debtor: any) => {
    setSelectedDebtor(debtor);
    setCreditLimit(debtor.creditLimit?.toString() || '');
    setShowEditModal(true);
  };

  const handleSaveLimit = () => {
    if (!selectedDebtor) return;

    const limit = parseFloat(creditLimit);
    if (isNaN(limit) || limit < 0) {
      Alert.alert('هەڵە', 'تکایە ژمارەیەکی دروست داخڵ بکە');
      return;
    }

    updateDebtor(selectedDebtor.id, { creditLimit: limit });
    setShowEditModal(false);
    setSelectedDebtor(null);
    setCreditLimit('');
    Alert.alert('سەرکەوتوو', 'سنووری کرێدیت نوێکرایەوە');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return colors.error;
      case 'warning': return colors.warning;
      case 'safe': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'exceeded': return 'تێپەڕیوە';
      case 'warning': return 'ئاگاداری';
      case 'safe': return 'سەلامەت';
      default: return 'بێ سنوور';
    }
  };

  const summary = useMemo(() => {
    const total = debtorsWithLimits.length;
    const exceeded = debtorsWithLimits.filter(d => d.status === 'exceeded').length;
    const warning = debtorsWithLimits.filter(d => d.status === 'warning').length;
    const safe = debtorsWithLimits.filter(d => d.status === 'safe').length;
    const unlimited = debtorsWithLimits.filter(d => d.status === 'unlimited').length;

    return { total, exceeded, warning, safe, unlimited };
  }, [debtorsWithLimits]);

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
            <Text style={[styles.title, { color: colors.text }]}>سنووری کرێدیتی کڕیار</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.error }]}>{summary.exceeded}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>تێپەڕیوە</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.warning}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>ئاگاداری</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.safe}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>سەلامەت</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>{summary.unlimited}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>بێ سنوور</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="گەڕان بە ناو یان ژمارە..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {debtorsWithLimits.map((debtor) => (
              <View
                key={debtor.id}
                style={[
                  styles.debtorCard,
                  {
                    backgroundColor: colors.cardGlass,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <View style={styles.debtorHeader}>
                  <View style={styles.debtorInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.primaryGlass }]}>
                      <User size={24} color={colors.primary} />
                    </View>
                    <View style={styles.debtorDetails}>
                      <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
                      {debtor.phone && (
                        <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>{debtor.phone}</Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(debtor.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(debtor.status) }]}>
                      {getStatusText(debtor.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.limitInfo}>
                  <View style={styles.limitRow}>
                    <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>قەرزی ئێستا</Text>
                    <Text style={[styles.limitValue, { color: colors.text }]}>
                      {debtor.currentDebt.toLocaleString('en-US')}
                    </Text>
                  </View>
                  <View style={styles.limitRow}>
                    <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>سنووری کرێدیت</Text>
                    <Text style={[styles.limitValue, { color: colors.text }]}>
                      {debtor.creditLimit > 0 ? debtor.creditLimit.toLocaleString('en-US') : 'بێ سنوور'}
                    </Text>
                  </View>
                  {debtor.creditLimit > 0 && (
                    <View style={styles.limitRow}>
                      <Text style={[styles.limitLabel, { color: colors.textSecondary }]}>ماوە</Text>
                      <Text style={[styles.limitValue, { color: getStatusColor(debtor.status) }]}>
                        {debtor.remaining.toLocaleString('en-US')}
                      </Text>
                    </View>
                  )}
                </View>

                {debtor.creditLimit > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colors.cardBorder }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(debtor.percentage, 100)}%`,
                            backgroundColor: getStatusColor(debtor.status),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                      {debtor.percentage.toFixed(0)}%
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleEditLimit(debtor)}
                >
                  <Edit2 size={16} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>دەستکاری سنوور</Text>
                </TouchableOpacity>
              </View>
            ))}

            {debtorsWithLimits.length === 0 && (
              <View style={styles.emptyContainer}>
                <Shield size={60} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  هیچ کڕیارێک نەدۆزرایەوە
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEditModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>دەستکاری سنووری کرێدیت</Text>
            
            {selectedDebtor && (
              <View style={styles.modalInfo}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  {selectedDebtor.name}
                </Text>
                <Text style={[styles.modalSubLabel, { color: colors.textTertiary }]}>
                  قەرزی ئێستا: {selectedDebtor.currentDebt.toLocaleString('en-US')}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>سنووری کرێدیت</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.cardBorder,
                  color: colors.text 
                }]}
                value={creditLimit}
                onChangeText={setCreditLimit}
                placeholder="0 = بێ سنوور"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                textAlign="right"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveLimit}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>پاشەکەوتکردن</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  summaryLabel: {
    fontSize: 12,
  },
  searchContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  debtorCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  debtorHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debtorInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
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
  },
  debtorPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  limitInfo: {
    gap: 8,
    marginBottom: 12,
  },
  limitRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 14,
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  modalSubLabel: {
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
