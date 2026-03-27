import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, CreditCard, Plus, Edit2, Trash2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PaymentMethod {
  id: string;
  name: string;
  nameEn: string;
  type: 'cash' | 'card' | 'mobile' | 'bank' | 'other';
  isActive: boolean;
  icon: string;
  details?: string;
}

const PAYMENT_METHODS_KEY = 'payment_methods';

export default function PaymentMethodManagementScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'کاش', nameEn: 'Cash', type: 'cash', isActive: true, icon: '💵' },
    { id: '2', name: 'کارتی بانک', nameEn: 'Bank Card', type: 'card', isActive: true, icon: '💳' },
    { id: '3', name: 'مۆبایل پەی', nameEn: 'Mobile Pay', type: 'mobile', isActive: true, icon: '📱' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [details, setDetails] = useState('');
  const [selectedType, setSelectedType] = useState<PaymentMethod['type']>('cash');

  React.useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      const stored = await AsyncStorage.getItem(PAYMENT_METHODS_KEY);
      if (stored) {
        setMethods(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const saveMethods = async (newMethods: PaymentMethod[]) => {
    try {
      await AsyncStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(newMethods));
      setMethods(newMethods);
    } catch (error) {
      console.error('Error saving payment methods:', error);
    }
  };

  const handleAddMethod = () => {
    if (!name.trim() || !nameEn.trim()) {
      Alert.alert('هەڵە', 'تکایە ناوەکان پڕ بکەرەوە');
      return;
    }

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      name: name.trim(),
      nameEn: nameEn.trim(),
      type: selectedType,
      isActive: true,
      icon: getIconForType(selectedType),
      details: details.trim(),
    };

    saveMethods([...methods, newMethod]);
    setShowAddModal(false);
    resetForm();
    Alert.alert('سەرکەوتوو', 'ڕێگای پارەدان زیادکرا');
  };

  const handleEditMethod = () => {
    if (!selectedMethod || !name.trim() || !nameEn.trim()) {
      Alert.alert('هەڵە', 'تکایە ناوەکان پڕ بکەرەوە');
      return;
    }

    const updated = methods.map(m =>
      m.id === selectedMethod.id
        ? { ...m, name: name.trim(), nameEn: nameEn.trim(), type: selectedType, details: details.trim(), icon: getIconForType(selectedType) }
        : m
    );

    saveMethods(updated);
    setShowEditModal(false);
    resetForm();
    Alert.alert('سەرکەوتوو', 'ڕێگای پارەدان نوێکرایەوە');
  };

  const handleDeleteMethod = (id: string) => {
    Alert.alert('سڕینەوە', 'ئایا دڵنیایت؟', [
      { text: 'نەخێر', style: 'cancel' },
      {
        text: 'بەڵێ',
        style: 'destructive',
        onPress: () => {
          saveMethods(methods.filter(m => m.id !== id));
          Alert.alert('سەرکەوتوو', 'ڕێگای پارەدان سڕایەوە');
        },
      },
    ]);
  };

  const handleToggleActive = (id: string) => {
    const updated = methods.map(m =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    saveMethods(updated);
  };

  const openEditModal = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setName(method.name);
    setNameEn(method.nameEn);
    setSelectedType(method.type);
    setDetails(method.details || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName('');
    setNameEn('');
    setSelectedType('cash');
    setDetails('');
    setSelectedMethod(null);
  };

  const getIconForType = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'mobile': return '📱';
      case 'bank': return '🏦';
      default: return '💰';
    }
  };

  const getTypeLabel = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash': return 'کاش';
      case 'card': return 'کارت';
      case 'mobile': return 'مۆبایل';
      case 'bank': return 'بانک';
      default: return 'تر';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>بەڕێوەبردنی ڕێگای پارەدان</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>زیادکردنی ڕێگای نوێ</Text>
          </TouchableOpacity>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {methods.map((method) => (
              <View key={method.id} style={[styles.methodCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.methodHeader}>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                    <View style={styles.methodDetails}>
                      <Text style={[styles.methodName, { color: colors.text }]}>{method.name}</Text>
                      <Text style={[styles.methodType, { color: colors.textSecondary }]}>{getTypeLabel(method.type)}</Text>
                      {method.details && (
                        <Text style={[styles.methodDetailsText, { color: colors.textTertiary }]}>{method.details}</Text>
                      )}
                    </View>
                  </View>
                  <Switch
                    value={method.isActive}
                    onValueChange={() => handleToggleActive(method.id)}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.methodActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}
                    onPress={() => openEditModal(method)}
                  >
                    <Edit2 size={16} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>دەستکاری</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.errorGlass, borderColor: colors.error }]}
                    onPress={() => handleDeleteMethod(method.id)}
                  >
                    <Trash2 size={16} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>سڕینەوە</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {methods.length === 0 && (
              <View style={styles.emptyContainer}>
                <CreditCard size={60} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  هیچ ڕێگایەکی پارەدان نیە
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>زیادکردنی ڕێگای نوێ</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>ناو بە کوردی</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="ناو..."
                placeholderTextColor={colors.textTertiary}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>ناو بە ئینگلیزی</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={nameEn}
                onChangeText={setNameEn}
                placeholder="Name..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>جۆر</Text>
              <View style={styles.typeButtons}>
                {(['cash', 'card', 'mobile', 'bank', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { borderColor: colors.cardBorder },
                      selectedType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.typeButtonText, { color: selectedType === type ? '#FFFFFF' : colors.textSecondary }]}>
                      {getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>وردەکاری (ئارەزوومەندانە)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={details}
                onChangeText={setDetails}
                placeholder="وردەکاری..."
                placeholderTextColor={colors.textTertiary}
                textAlign="right"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleAddMethod}>
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>زیادکردن</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditModal(false)} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>دەستکاری ڕێگای پارەدان</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>ناو بە کوردی</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="ناو..."
                placeholderTextColor={colors.textTertiary}
                textAlign="right"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>ناو بە ئینگلیزی</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={nameEn}
                onChangeText={setNameEn}
                placeholder="Name..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>جۆر</Text>
              <View style={styles.typeButtons}>
                {(['cash', 'card', 'mobile', 'bank', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { borderColor: colors.cardBorder },
                      selectedType === type && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.typeButtonText, { color: selectedType === type ? '#FFFFFF' : colors.textSecondary }]}>
                      {getTypeLabel(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>وردەکاری (ئارەزوومەندانە)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                value={details}
                onChangeText={setDetails}
                placeholder="وردەکاری..."
                placeholderTextColor={colors.textTertiary}
                textAlign="right"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                onPress={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.primary }]} onPress={handleEditMethod}>
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
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 10, paddingBottom: 20 },
  headerCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center', flex: 1 },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' as const },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  methodCard: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 12 },
  methodHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  methodInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 },
  methodIcon: { fontSize: 32 },
  methodDetails: { flex: 1, alignItems: 'flex-end' },
  methodName: { fontSize: 16, fontWeight: '600' as const },
  methodType: { fontSize: 13, marginTop: 2 },
  methodDetailsText: { fontSize: 12, marginTop: 2 },
  methodActions: { flexDirection: 'row-reverse', gap: 8 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonText: { fontSize: 13, fontWeight: '600' as const },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 16, textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingHorizontal: 20 },
  modalTitle: { fontSize: 22, fontWeight: '700' as const, textAlign: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600' as const, marginBottom: 8, textAlign: 'right' },
  input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1 },
  typeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  typeButtonText: { fontSize: 14, fontWeight: '600' as const },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '700' as const },
});
