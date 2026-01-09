import { useTheme } from '@/contexts/ThemeContext';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Store, Users, Trash2, Edit, BarChart3, MapPin } from 'lucide-react-native';
import { useStores } from '@/contexts/StoreContext';

export default function MultiStoreManagementScreen() {
  const { colors } = useTheme();
  const { stores, addStore, updateStore, deleteStore, getActiveStores } = useStores();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');

  const activeStores = getActiveStores();

  const handleAddStore = () => {
    if (!storeName) {
      if (Platform.OS === 'web') {
        alert('تکایە ناوی فرۆشگا بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە ناوی فرۆشگا بنووسە');
      }
      return;
    }

    if (editingStore) {
      updateStore(editingStore, {
        name: storeName,
        address: storeAddress,
        phone: storePhone,
      });
      setEditingStore(null);
    } else {
      addStore({
        name: storeName,
        address: storeAddress,
        phone: storePhone,
      });
    }

    setShowAddForm(false);
    setStoreName('');
    setStoreAddress('');
    setStorePhone('');

    if (Platform.OS === 'web') {
      alert(editingStore ? 'فرۆشگا نوێکرایەوە' : 'فرۆشگا زیادکرا');
    } else {
      Alert.alert('سەرکەوتوو', editingStore ? 'فرۆشگا نوێکرایەوە' : 'فرۆشگا زیادکرا');
    }
  };

  const handleEditStore = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setStoreName(store.name);
      setStoreAddress(store.address || '');
      setStorePhone(store.phone || '');
      setEditingStore(storeId);
      setShowAddForm(true);
    }
  };

  const handleDeleteStore = (storeId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('دڵنیای لە سڕینەوەی ئەم فرۆشگایە؟')) {
        deleteStore(storeId);
        alert('فرۆشگا سڕایەوە');
      }
    } else {
      Alert.alert(
        'سڕینەوە',
        'دڵنیای لە سڕینەوەی ئەم فرۆشگایە؟',
        [
          { text: 'پاشگەزبوونەوە', style: 'cancel' },
          {
            text: 'سڕینەوە',
            style: 'destructive',
            onPress: () => {
              deleteStore(storeId);
              Alert.alert('سەرکەوتوو', 'فرۆشگا سڕایەوە');
            },
          },
        ]
      );
    }
  };

  const getEmployeeCount = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    return store?.employeeIds.length || 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={colors.backgroundGradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <Store size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stores.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>کۆی گشتی</Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: colors.successGlass, borderColor: colors.success }]}>
              <BarChart3 size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>{activeStores.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>چالاک</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditingStore(null);
              setStoreName('');
              setStoreAddress('');
              setStorePhone('');
              setShowAddForm(!showAddForm);
            }}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>فرۆشگای نوێ زیاد بکە</Text>
          </TouchableOpacity>

          {showAddForm && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                {editingStore ? 'دەستکاریکردنی فرۆشگا' : 'فرۆشگای نوێ'}
              </Text>
              
              <Text style={[styles.label, { color: colors.text }]}>ناوی فرۆشگا</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={storeName}
                onChangeText={setStoreName}
                placeholder="ناوی فرۆشگا"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.label, { color: colors.text }]}>ناونیشان</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholder="ناونیشانی فرۆشگا"
                placeholderTextColor={colors.textTertiary}
              />

              <Text style={[styles.label, { color: colors.text }]}>ژمارەی تەلەفۆن</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, color: colors.text }]}
                value={storePhone}
                onChangeText={setStorePhone}
                placeholder="07XX XXX XXXX"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddStore}
                >
                  <Text style={styles.formButtonText}>
                    {editingStore ? 'نوێکردنەوە' : 'زیادکردن'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder, borderWidth: 1 }]}
                  onPress={() => {
                    setShowAddForm(false);
                    setEditingStore(null);
                    setStoreName('');
                    setStoreAddress('');
                    setStorePhone('');
                  }}
                >
                  <Text style={[styles.formButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {stores.length === 0 ? (
            <View style={styles.emptyState}>
              <Store size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ فرۆشگایەک تۆمار نەکراوە
              </Text>
            </View>
          ) : (
            stores.map(store => {
              const employeeCount = getEmployeeCount(store.id);
              
              return (
                <View key={store.id} style={[styles.storeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.storeHeader}>
                    <View style={styles.storeActions}>
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.primaryGlass }]}
                        onPress={() => handleEditStore(store.id)}
                      >
                        <Edit size={18} color={colors.primary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.iconButton, { backgroundColor: colors.errorGlass }]}
                        onPress={() => handleDeleteStore(store.id)}
                      >
                        <Trash2 size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.storeNameContainer}>
                      <Text style={[styles.storeName, { color: colors.text }]}>{store.name}</Text>
                      {store.isActive && (
                        <View style={[styles.activeBadge, { backgroundColor: colors.successGlass }]}>
                          <Text style={[styles.activeBadgeText, { color: colors.success }]}>چالاک</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.storeDetails}>
                    {store.address && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {store.address}
                        </Text>
                        <View style={styles.detailIcon}>
                          <MapPin size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>ناونیشان:</Text>
                        </View>
                      </View>
                    )}

                    {store.phone && (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {store.phone}
                        </Text>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>تەلەفۆن:</Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailValue, { color: colors.primary }]}>
                        {employeeCount} کارمەند
                      </Text>
                      <View style={styles.detailIcon}>
                        <Users size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>کارمەندان:</Text>
                      </View>
                    </View>
                  </View>
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
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, textAlign: 'right' },
  formButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  formButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  formButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  storeCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  storeHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  storeNameContainer: { flex: 1, marginLeft: 12 },
  storeName: { fontSize: 18, fontWeight: '700' as const, textAlign: 'right', marginBottom: 6 },
  activeBadge: { alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { fontSize: 11, fontWeight: '700' as const },
  storeActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  storeDetails: { gap: 8 },
  detailRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailIcon: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  detailLabel: { fontSize: 14, fontWeight: '600' as const },
  detailValue: { fontSize: 14, flex: 1, textAlign: 'right', marginRight: 12 },
});
