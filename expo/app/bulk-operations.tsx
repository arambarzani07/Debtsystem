import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit3, 
  Tag, 
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import type { DebtorCategory, ColorTag } from '@/types';
import { COLOR_TAG_MAP, CATEGORY_COLORS, CATEGORY_LABELS } from '@/constants/colors';

type BulkAction = 'delete' | 'category' | 'tag' | 'note';

export default function BulkOperationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors, deleteDebtor, updateDebtor } = useDebt();
  const [selectedDebtors, setSelectedDebtors] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [actionValue, setActionValue] = useState('');

  const filteredDebtors = useMemo(() => {
    if (!searchQuery.trim()) return debtors;
    const query = searchQuery.toLowerCase();
    return debtors.filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.phone?.toLowerCase().includes(query)
    );
  }, [debtors, searchQuery]);

  const handleToggleAll = () => {
    if (selectedDebtors.length === filteredDebtors.length) {
      setSelectedDebtors([]);
    } else {
      setSelectedDebtors(filteredDebtors.map(d => d.id));
    }
  };

  const handleToggleDebtor = (debtorId: string) => {
    if (selectedDebtors.includes(debtorId)) {
      setSelectedDebtors(selectedDebtors.filter(id => id !== debtorId));
    } else {
      setSelectedDebtors([...selectedDebtors, debtorId]);
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'دڵنیابوونەوە',
      `دڵنیایت لە سڕینەوەی ${selectedDebtors.length} کڕیار؟\n\nئەم کردارە ناگەڕێتەوە!`,
      [
        { text: 'پاشگەزبوونەوە', style: 'cancel' },
        {
          text: 'سڕینەوە',
          style: 'destructive',
          onPress: () => {
            selectedDebtors.forEach(id => deleteDebtor(id));
            setSelectedDebtors([]);
            Alert.alert('سەرکەوتوو', `${selectedDebtors.length} کڕیار سڕانەوە`);
          },
        },
      ]
    );
  };

  const handleBulkAction = (action: BulkAction) => {
    setSelectedAction(action);
    setActionValue('');
    setShowActionModal(true);
  };

  const applyBulkAction = () => {
    if (!selectedAction) return;

    const count = selectedDebtors.length;

    switch (selectedAction) {
      case 'category':
        if (!actionValue) {
          Alert.alert('هەڵە', 'تکایە جۆری کڕیار هەڵبژێرە');
          return;
        }
        selectedDebtors.forEach(id => {
          const debtor = debtors.find(d => d.id === id);
          if (debtor) {
            updateDebtor(id, { category: actionValue as DebtorCategory });
          }
        });
        Alert.alert('سەرکەوتوو', `جۆری ${count} کڕیار گۆڕدرا`);
        break;

      case 'tag':
        if (!actionValue) {
          Alert.alert('هەڵە', 'تکایە تاگێک هەڵبژێرە');
          return;
        }
        selectedDebtors.forEach(id => {
          const debtor = debtors.find(d => d.id === id);
          if (debtor) {
            updateDebtor(id, { colorTag: actionValue as ColorTag });
          }
        });
        Alert.alert('سەرکەوتوو', `تاگی ${count} کڕیار گۆڕدرا`);
        break;

      case 'note':
        if (!actionValue.trim()) {
          Alert.alert('هەڵە', 'تکایە تێبینییەک بنووسە');
          return;
        }
        selectedDebtors.forEach(id => {
          const debtor = debtors.find(d => d.id === id);
          if (debtor) {
            const existingNotes = debtor.notes || '';
            const newNotes = existingNotes 
              ? `${existingNotes}\n\n${actionValue}` 
              : actionValue;
            updateDebtor(id, { notes: newNotes });
          }
        });
        Alert.alert('سەرکەوتوو', `تێبینی بۆ ${count} کڕیار زیادکرا`);
        break;
    }

    setShowActionModal(false);
    setSelectedDebtors([]);
    setActionValue('');
  };

  const categories: DebtorCategory[] = ['VIP', 'Regular', 'Wholesale'];
  const tags: ColorTag[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={[colors.primary + '15', colors.background]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card }]}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            گۆڕانکاری بە کۆمەڵ
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="گەڕان بە ناو یان ژمارە..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {selectedDebtors.length > 0 && (
        <View style={[styles.actionBar, { backgroundColor: colors.primary }]}>
          <Text style={styles.actionBarText}>
            {selectedDebtors.length} کڕیار هەڵبژێردراوە
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBarButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => handleBulkAction('category')}
            >
              <Tag size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBarButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => handleBulkAction('tag')}
            >
              <Edit3 size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBarButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => handleBulkAction('note')}
            >
              <MessageSquare size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBarButton, { backgroundColor: '#FF6B6B' }]}
              onPress={handleBulkDelete}
            >
              <Trash2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity
          style={[styles.selectAllButton, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
          onPress={handleToggleAll}
        >
          {selectedDebtors.length === filteredDebtors.length ? (
            <CheckSquare size={24} color={colors.primary} />
          ) : (
            <Square size={24} color={colors.textSecondary} />
          )}
          <Text style={[styles.selectAllText, { color: colors.text }]}>
            هەڵبژاردنی هەموو ({filteredDebtors.length})
          </Text>
        </TouchableOpacity>

        {filteredDebtors.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              هیچ کڕیارێک نەدۆزرایەوە
            </Text>
          </View>
        ) : (
          filteredDebtors.map((debtor, index) => {
            const isSelected = selectedDebtors.includes(debtor.id);
            
            return (
              <TouchableOpacity
                key={debtor.id}
                style={[styles.debtorCard, {
                  backgroundColor: isSelected ? colors.primary + '20' : colors.card,
                  borderColor: isSelected ? colors.primary : colors.glassBorder,
                }]}
                onPress={() => handleToggleDebtor(debtor.id)}
              >
                <View style={styles.debtorContent}>
                  {isSelected ? (
                    <CheckSquare size={24} color={colors.primary} />
                  ) : (
                    <Square size={24} color={colors.textSecondary} />
                  )}
                  
                  <View style={styles.debtorInfo}>
                    <Text style={[styles.debtorName, { color: colors.text }]}>
                      {debtor.name}
                    </Text>
                    {debtor.phone && (
                      <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>
                        📞 {debtor.phone}
                      </Text>
                    )}
                    <View style={styles.debtorMeta}>
                      <Text style={[styles.debtorDebt, { color: colors.error }]}>
                        {debtor.totalDebt.toLocaleString('en-US')} د
                      </Text>
                      {debtor.category && (
                        <View style={[styles.categoryBadge, { 
                          backgroundColor: CATEGORY_COLORS[debtor.category] + '20',
                          borderColor: CATEGORY_COLORS[debtor.category],
                        }]}>
                          <Text style={[styles.categoryText, { color: CATEGORY_COLORS[debtor.category] }]}>
                            {CATEGORY_LABELS[debtor.category]}
                          </Text>
                        </View>
                      )}
                      {debtor.colorTag && (
                        <View style={[styles.colorTag, { backgroundColor: COLOR_TAG_MAP[debtor.colorTag] }]} />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedAction === 'category' && 'گۆڕینی جۆر'}
                {selectedAction === 'tag' && 'گۆڕینی تاگ'}
                {selectedAction === 'note' && 'زیادکردنی تێبینی'}
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedAction === 'category' && (
              <View style={styles.optionsGrid}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.optionButton, {
                      backgroundColor: actionValue === cat ? CATEGORY_COLORS[cat] + '30' : colors.background,
                      borderColor: actionValue === cat ? CATEGORY_COLORS[cat] : colors.glassBorder,
                    }]}
                    onPress={() => setActionValue(cat)}
                  >
                    <Text style={[styles.optionText, { 
                      color: actionValue === cat ? CATEGORY_COLORS[cat] : colors.text 
                    }]}>
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedAction === 'tag' && (
              <View style={styles.tagsGrid}>
                {tags.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagButton, {
                      backgroundColor: COLOR_TAG_MAP[tag],
                      opacity: actionValue === tag ? 1 : 0.5,
                      borderWidth: actionValue === tag ? 3 : 0,
                      borderColor: colors.text,
                    }]}
                    onPress={() => setActionValue(tag)}
                  />
                ))}
              </View>
            )}

            {selectedAction === 'note' && (
              <TextInput
                style={[styles.noteInput, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.glassBorder,
                }]}
                placeholder="تێبینییەکی نوێ بنووسە..."
                placeholderTextColor={colors.textSecondary}
                value={actionValue}
                onChangeText={setActionValue}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  پاشگەزبوونەوە
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={applyBulkAction}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  جێبەجێکردن
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
    paddingVertical: 12,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  actionBarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  debtorCard: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  debtorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  debtorInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debtorPhone: {
    fontSize: 13,
    marginBottom: 4,
  },
  debtorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debtorDebt: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  colorTag: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  tagButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
