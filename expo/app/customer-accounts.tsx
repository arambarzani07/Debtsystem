import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useDebt } from '@/contexts/DebtContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Eye, EyeOff, User, Phone, Key, Edit2 } from 'lucide-react-native';
import type { User as UserType } from '@/types';

export default function CustomerAccountsScreen() {
  const { users, currentUser, addCustomer } = useAuth();
  const { debtors } = useDebt();
  const { colors } = useTheme();
  const router = useRouter();
  
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDebtorId, setSelectedDebtorId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const customerUsers = users.filter(u => 
    u.role === 'customer' && u.marketId === currentUser?.marketId
  );

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleAddCustomer = async () => {
    if (isSubmitting) return;
    
    if (!selectedDebtorId) {
      Alert.alert('هەڵە', 'تکایە کڕیارێک هەڵبژێرە');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('هەڵە', 'تکایە ژمارە تەلەفۆن بنووسە');
      return;
    }
    if (!password.trim()) {
      Alert.alert('هەڵە', 'تکایە ووشەی نهێنی بنووسە');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addCustomer(selectedDebtorId, phone.trim(), password.trim());
      
      if (result.success) {
        Alert.alert('سەرکەوتوو', result.message);
        setShowAddModal(false);
        setSelectedDebtorId('');
        setPhone('');
        setPassword('');
      } else {
        Alert.alert('هەڵە', result.message);
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە دروستکردنی هەژمار');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDebtorName = (debtorId: string | undefined) => {
    if (!debtorId) return 'نەدۆزرایەوە';
    const debtor = debtors.find(d => d.id === debtorId);
    return debtor ? debtor.name : 'نەدۆزرایەوە';
  };

  const availableDebtors = debtors.filter(d => 
    !customerUsers.some(u => u.debtorId === d.id)
  );

  const renderCustomerItem = ({ item }: { item: UserType }) => {
    const debtorName = getDebtorName(item.debtorId);
    const isPasswordVisible = showPasswords[item.id] || false;

    return (
      <View style={[styles.customerCard, { 
        backgroundColor: colors.cardGlass,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadowColor,
      }]}>
        <View style={styles.customerHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryGlass }]}>
            <User size={20} color={colors.primary} />
          </View>
          <View style={styles.customerInfo}>
            <Text style={[styles.debtorName, { color: colors.text }]}>{debtorName}</Text>
            <View style={styles.detailRow}>
              <Phone size={14} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{item.phone}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.passwordSection, { 
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        }]}>
          <View style={styles.passwordHeader}>
            <Key size={16} color={colors.textSecondary} />
            <Text style={[styles.passwordLabel, { color: colors.textSecondary }]}>ووشەی نهێنی:</Text>
          </View>
          <View style={styles.passwordRow}>
            <TouchableOpacity
              style={[styles.eyeButton, { backgroundColor: colors.primaryGlass }]}
              onPress={() => togglePasswordVisibility(item.id)}
            >
              {isPasswordVisible ? (
                <EyeOff size={16} color={colors.primary} />
              ) : (
                <Eye size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
            <Text style={[styles.passwordText, { color: colors.text }]}>
              {isPasswordVisible ? item.password : '••••••••'}
            </Text>
          </View>
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity
            style={[styles.viewButton, { 
              backgroundColor: colors.successGlass,
              borderColor: colors.success,
            }]}
            onPress={() => {
              if (item.debtorId) {
                router.push(`/debtor/${item.debtorId}` as any);
              }
            }}
          >
            <Edit2 size={16} color={colors.success} />
            <Text style={[styles.viewButtonText, { color: colors.success }]}>پڕۆفایلی کڕیار</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'employee')) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error }]}>دەسەڵاتت نییە</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { 
                  backgroundColor: colors.primaryGlass,
                  borderColor: colors.primary,
                }]}
              >
                <ArrowLeft size={24} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>هەژمارەکانی کڕیاران</Text>
            </View>
            <TouchableOpacity
              style={[styles.addButton, { 
                backgroundColor: colors.successGlass,
                borderColor: colors.success,
              }]}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color={colors.success} />
              <Text style={[styles.addButtonText, { color: colors.success }]}>زیادکردن</Text>
            </TouchableOpacity>
          </View>
        </View>

        {customerUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={60} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              هیچ هەژمارێکی کڕیار تۆمار نەکراوە
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
              بۆ دروستکردنی هەژمار دوگمەی زیادکردن لە سەرەوە بگرە
            </Text>
          </View>
        ) : (
          <FlatList
            data={customerUsers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}

        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowAddModal(false);
            setSelectedDebtorId('');
            setPhone('');
            setPassword('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { 
              backgroundColor: colors.card,
              borderColor: colors.glassBorder,
            }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>دروستکردنی هەژماری کڕیار</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setSelectedDebtorId('');
                    setPhone('');
                    setPassword('');
                  }}
                  style={styles.closeButton}
                >
                  <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>کڕیار *</Text>
                  <ScrollView 
                    style={[styles.debtorList, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                    }]}
                    nestedScrollEnabled={true}
                  >
                    {availableDebtors.length === 0 ? (
                      <Text style={[styles.noDebtorText, { color: colors.textTertiary }]}>
                        هەموو کڕیارەکان هەژماریان هەیە
                      </Text>
                    ) : (
                      availableDebtors.map((debtor) => (
                        <TouchableOpacity
                          key={debtor.id}
                          style={[
                            styles.debtorItem,
                            { backgroundColor: selectedDebtorId === debtor.id ? colors.primaryGlass : colors.card },
                            { borderColor: selectedDebtorId === debtor.id ? colors.primary : colors.cardBorder }
                          ]}
                          onPress={() => setSelectedDebtorId(debtor.id)}
                        >
                          <Text style={[
                            styles.debtorItemText, 
                            { color: selectedDebtorId === debtor.id ? colors.primary : colors.text }
                          ]}>
                            {debtor.name}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ژمارە تەلەفۆن *</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="ژمارە تەلەفۆن بنووسە..."
                    placeholderTextColor={colors.textTertiary}
                    textAlign="right"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ووشەی نهێنی *</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text,
                    }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="ووشەی نهێنی بنووسە..."
                    placeholderTextColor={colors.textTertiary}
                    textAlign="right"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, { 
                    backgroundColor: isSubmitting ? colors.textTertiary : colors.success,
                  }]}
                  onPress={handleAddCustomer}
                  disabled={availableDebtors.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Plus size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'تکایە چاوەڕێبە...' : 'دروستکردنی هەژمار'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  addButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  customerCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  customerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  customerInfo: {
    flex: 1,
  },
  debtorName: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 6,
    textAlign: 'right',
  },
  detailRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
  },
  passwordSection: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  passwordHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  passwordLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  passwordRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordText: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'monospace' as const,
  },
  customerActions: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 32,
    fontWeight: '300' as const,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  debtorList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  debtorItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  debtorItemText: {
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  noDebtorText: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  submitButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
