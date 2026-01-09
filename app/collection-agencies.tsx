import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Building2, Plus, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Agency {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  debtorsAssigned: number;
  totalAmountAssigned: number;
  recoveredAmount: number;
  createdAt: string;
}

export default function CollectionAgenciesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  React.useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const data = await AsyncStorage.getItem('collection_agencies');
      if (data) {
        setAgencies(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const saveAgencies = async (newAgencies: Agency[]) => {
    try {
      await AsyncStorage.setItem('collection_agencies', JSON.stringify(newAgencies));
      setAgencies(newAgencies);
    } catch (error) {
      console.error('Error saving agencies:', error);
    }
  };

  const handleAddAgency = () => {
    if (!name.trim()) {
      Alert.alert('هەڵە', 'تکایە ناوی ئاژانس بنووسە');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('هەڵە', 'تکایە ژمارە تەلەفۆن بنووسە');
      return;
    }

    const newAgency: Agency = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      debtorsAssigned: 0,
      totalAmountAssigned: 0,
      recoveredAmount: 0,
      createdAt: new Date().toISOString(),
    };

    saveAgencies([...agencies, newAgency]);
    resetForm();
    setShowAddModal(false);
    Alert.alert('سەرکەوتوو', 'ئاژانس بە سەرکەوتوویی زیادکرا');
  };

  const handleEditAgency = () => {
    if (!editingAgency) return;
    if (!name.trim()) {
      Alert.alert('هەڵە', 'تکایە ناوی ئاژانس بنووسە');
      return;
    }

    const updatedAgencies = agencies.map(a => 
      a.id === editingAgency.id 
        ? { ...a, name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim() }
        : a
    );

    saveAgencies(updatedAgencies);
    resetForm();
    setEditingAgency(null);
    Alert.alert('سەرکەوتوو', 'زانیاریەکان نوێکرانەوە');
  };

  const handleDeleteAgency = (agency: Agency) => {
    Alert.alert(
      'سڕینەوە',
      `ئایا دڵنیایت لە سڕینەوەی ${agency.name}؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          style: 'destructive',
          onPress: () => {
            const filtered = agencies.filter(a => a.id !== agency.id);
            saveAgencies(filtered);
            Alert.alert('سەرکەوتوو', 'ئاژانس سڕایەوە');
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
  };

  const openEditModal = (agency: Agency) => {
    setEditingAgency(agency);
    setName(agency.name);
    setPhone(agency.phone);
    setEmail(agency.email);
    setAddress(agency.address);
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
            <Text style={[styles.title, { color: colors.text }]}>ئاژانسی کۆکردنەوەی قەرز</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Plus size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {agencies.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
              <Building2 size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ ئاژانسێک زیاد نەکراوە
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>زیادکردنی یەکەم ئاژانس</Text>
              </TouchableOpacity>
            </View>
          ) : (
            agencies.map(agency => (
              <View key={agency.id} style={[styles.agencyCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.agencyHeader}>
                  <View style={[styles.agencyIcon, { backgroundColor: colors.primaryGlass }]}>
                    <Building2 size={24} color={colors.primary} />
                  </View>
                  <View style={styles.agencyInfo}>
                    <Text style={[styles.agencyName, { color: colors.text }]}>{agency.name}</Text>
                    {agency.phone && (
                      <View style={styles.agencyDetailRow}>
                        <Phone size={14} color={colors.textSecondary} />
                        <Text style={[styles.agencyDetail, { color: colors.textSecondary }]}>{agency.phone}</Text>
                      </View>
                    )}
                    {agency.email && (
                      <View style={styles.agencyDetailRow}>
                        <Mail size={14} color={colors.textSecondary} />
                        <Text style={[styles.agencyDetail, { color: colors.textSecondary }]}>{agency.email}</Text>
                      </View>
                    )}
                    {agency.address && (
                      <View style={styles.agencyDetailRow}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={[styles.agencyDetail, { color: colors.textSecondary }]}>{agency.address}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.agencyStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{agency.debtorsAssigned}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>قەرزدار</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.warning }]}>{agency.totalAmountAssigned.toLocaleString()}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی گشتی</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.success }]}>{agency.recoveredAmount.toLocaleString()}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>گەڕاوە</Text>
                  </View>
                </View>

                <View style={styles.agencyActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}
                    onPress={() => openEditModal(agency)}
                  >
                    <Edit2 size={18} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary }]}>دەستکاری</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.errorGlass, borderColor: colors.error }]}
                    onPress={() => handleDeleteAgency(agency)}
                  >
                    <Trash2 size={18} color={colors.error} />
                    <Text style={[styles.actionButtonText, { color: colors.error }]}>سڕینەوە</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={showAddModal || editingAgency !== null} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowAddModal(false); setEditingAgency(null); resetForm(); }} />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingAgency ? 'دەستکاری ئاژانس' : 'زیادکردنی ئاژانسی نوێ'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ناوی ئاژانس *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="ناوی ئاژانس..."
                  placeholderTextColor={colors.textTertiary}
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ژمارە تەلەفۆن *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="07XX XXX XXXX"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ئیمەیڵ</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="info@agency.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  textAlign="right"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ناونیشان</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, color: colors.text }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="ناونیشانی ئاژانس..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlign="right"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                onPress={() => { setShowAddModal(false); setEditingAgency(null); resetForm(); }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={editingAgency ? handleEditAgency : handleAddAgency}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {editingAgency ? 'نوێکردنەوە' : 'زیادکردن'}
                </Text>
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
  headerCard: { borderRadius: 24, borderWidth: 2, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  addButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' as const, textAlign: 'center', flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 30 },
  emptyCard: { borderRadius: 20, borderWidth: 2, padding: 40, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  emptyButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginTop: 24 },
  emptyButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#FFFFFF' },
  agencyCard: { borderRadius: 20, borderWidth: 2, padding: 20, marginBottom: 16 },
  agencyHeader: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 16, marginBottom: 16 },
  agencyIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  agencyInfo: { flex: 1, gap: 6 },
  agencyName: { fontSize: 18, fontWeight: '700' as const, textAlign: 'right' },
  agencyDetailRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  agencyDetail: { fontSize: 14, textAlign: 'right' },
  agencyStats: { flexDirection: 'row-reverse', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' as const, marginBottom: 4 },
  statLabel: { fontSize: 12 },
  agencyActions: { flexDirection: 'row-reverse', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  actionButtonText: { fontSize: 14, fontWeight: '600' as const },
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 22, fontWeight: '700' as const, textAlign: 'center', marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600' as const, marginBottom: 8, textAlign: 'right' },
  input: { borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, textAlign: 'right' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalButton: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: '700' as const },
});
