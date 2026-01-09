import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, UserPlus, User as UserIcon, UserX, UserCheck } from 'lucide-react-native';
import type { User, EmployeePermission } from '@/types';

const PERMISSION_LABELS: Record<EmployeePermission, string> = {
  'view_debtors': 'بینینی کڕیاران',
  'add_debtors': 'زیادکردنی کڕیار',
  'edit_debtors': 'دەستکاریکردنی کڕیار',
  'delete_debtors': 'سڕینەوەی کڕیار',
  'add_transactions': 'زیادکردنی مامەڵە',
  'edit_transactions': 'دەستکاریکردنی مامەڵە',
  'delete_transactions': 'سڕینەوەی مامەڵە',
  'view_reports': 'بینینی ڕاپۆرتەکان',
  'export_data': 'هەناردەکردنی داتا',
};

const ALL_PERMISSIONS: EmployeePermission[] = [
  'view_debtors',
  'add_debtors',
  'edit_debtors',
  'delete_debtors',
  'add_transactions',
  'edit_transactions',
  'delete_transactions',
  'view_reports',
  'export_data',
];

export default function ManageEmployeesScreen() {
  const { getMarketEmployees, addEmployee, updateEmployeePermissions, deleteEmployee, toggleEmployeeStatus, currentUser } = useAuth();
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<EmployeePermission[]>([]);

  const employees = getMarketEmployees();

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setPassword('');
    setSelectedPermissions([]);
  };

  const handleAddEmployee = async () => {
    if (!fullName.trim()) {
      Alert.alert('هەڵە', 'تکایە ناوی کارمەند بنووسە');
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
    if (selectedPermissions.length === 0) {
      Alert.alert('هەڵە', 'تکایە لانیکەم یەک دەسەڵات هەڵبژێرە');
      return;
    }

    const result = await addEmployee(fullName.trim(), phone.trim(), password.trim(), selectedPermissions);
    
    if (result.success) {
      Alert.alert('سەرکەوتوو', result.message);
      resetForm();
      setShowAddModal(false);
    } else {
      Alert.alert('هەڵە', result.message);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedEmployee) return;

    if (selectedPermissions.length === 0) {
      Alert.alert('هەڵە', 'تکایە لانیکەم یەک دەسەڵات هەڵبژێرە');
      return;
    }

    const result = await updateEmployeePermissions(selectedEmployee.id, selectedPermissions);
    
    if (result.success) {
      Alert.alert('سەرکەوتوو', result.message);
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
    } else {
      Alert.alert('هەڵە', result.message);
    }
  };

  const handleToggleEmployeeStatus = async (employee: User) => {
    const currentStatus = employee.isActive !== undefined ? employee.isActive : true;
    const actionText = currentStatus ? 'ناچالاککردن' : 'چالاککردنەوە';
    
    Alert.alert(
      'دڵنیابوونەوە',
      `ئایا دڵنیایت لە ${actionText}ی ${employee.fullName}؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            const result = await toggleEmployeeStatus(employee.id);
            if (result.success) {
              Alert.alert('سەرکەوتوو', result.message);
            } else {
              Alert.alert('هەڵە', result.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteEmployee = (employee: User) => {
    Alert.alert(
      'دڵنیابوونەوە',
      `ئایا دڵنیایت لە سڕینەوەی ${employee.fullName}؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            const result = await deleteEmployee(employee.id);
            if (result.success) {
              Alert.alert('سەرکەوتوو', result.message);
            } else {
              Alert.alert('هەڵە', result.message);
            }
          },
        },
      ]
    );
  };

  const togglePermission = (permission: EmployeePermission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const openEditModal = (employee: User) => {
    setSelectedEmployee(employee);
    setSelectedPermissions(employee.permissions || []);
    setShowEditModal(true);
  };

  const openEmployeeProfile = (employee: User) => {
    router.push(`/employee-profile/${employee.id}` as any);
  };

  const renderEmployeeItem = ({ item }: { item: User }) => {
    return (
      <View style={styles.employeeCard}>
        <LinearGradient
          colors={['rgba(30, 58, 138, 0.5)', 'rgba(30, 41, 59, 0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.employeeHeader}>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{item.fullName}</Text>
              <Text style={styles.employeeUsername}>{item.phone}</Text>
            </View>
            <View style={styles.employeeActions}>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => openEmployeeProfile(item)}
              >
                <UserIcon size={18} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Edit2 size={18} color="#60A5FA" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteEmployee(item)}
              >
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>دەسەڵاتەکان:</Text>
            <View style={styles.permissionsList}>
              {(item.permissions || []).map((permission) => (
                <View key={permission} style={styles.permissionBadge}>
                  <Text style={styles.permissionText}>{PERMISSION_LABELS[permission]}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderPermissionCheckbox = (permission: EmployeePermission) => {
    const isSelected = selectedPermissions.includes(permission);
    return (
      <TouchableOpacity
        key={permission}
        style={styles.permissionCheckbox}
        onPress={() => togglePermission(permission)}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <View style={styles.checkboxInner} />}
        </View>
        <Text style={styles.permissionLabel}>{PERMISSION_LABELS[permission]}</Text>
      </TouchableOpacity>
    );
  };

  if (currentUser?.role !== 'manager') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>تەنها بەڕێوەبەران دەتوانن کارمەندەکان بەڕێوەببەن</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft size={24} color="#60A5FA" />
              </TouchableOpacity>
              <Text style={styles.title}>بەڕێوەبردنی کارمەندان</Text>
            </View>
            <TouchableOpacity
              style={styles.addEmployeeButton}
              onPress={() => setShowAddModal(true)}
            >
              <UserPlus size={20} color="#FFFFFF" />
              <Text style={styles.addEmployeeButtonText}>زیادکردنی کارمەند</Text>
            </TouchableOpacity>
          </View>
        </View>

        {employees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UserPlus size={60} color="#475569" />
            <Text style={styles.emptyText}>هیچ کارمەندێک تۆمار نەکراوە</Text>
            <Text style={styles.emptySubtext}>بۆ دەستپێکردن دوگمەی زیادکردنی کارمەند لە سەرەوە بگرە</Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            renderItem={renderEmployeeItem}
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
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['rgba(30, 58, 138, 0.95)', 'rgba(30, 41, 59, 0.95)']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>زیادکردنی کارمەندی نوێ</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ناوی کارمەند</Text>
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="ناوی تەواو بنووسە..."
                      placeholderTextColor="#64748B"
                      textAlign="right"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ژمارە تەلەفۆن</Text>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="ژمارە تەلەفۆن بنووسە..."
                      placeholderTextColor="#64748B"
                      textAlign="right"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ووشەی نهێنی</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="ووشەی نهێنی بنووسە..."
                      placeholderTextColor="#64748B"
                      textAlign="right"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>دەسەڵاتەکان</Text>
                    <View style={styles.permissionsCheckboxList}>
                      {ALL_PERMISSIONS.map(renderPermissionCheckbox)}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddEmployee}
                  >
                    <Plus size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>زیادکردنی کارمەند</Text>
                  </TouchableOpacity>
                </ScrollView>
              </LinearGradient>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showEditModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
            resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['rgba(30, 58, 138, 0.95)', 'rgba(30, 41, 59, 0.95)']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>دەستکاریکردنی دەسەڵاتەکان</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowEditModal(false);
                      setSelectedEmployee(null);
                      resetForm();
                    }}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  {selectedEmployee && (
                    <View style={styles.employeeInfoSection}>
                      <Text style={styles.employeeInfoName}>{selectedEmployee.fullName}</Text>
                      <Text style={styles.employeeInfoUsername}>{selectedEmployee.phone}</Text>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>دەسەڵاتەکان</Text>
                    <View style={styles.permissionsCheckboxList}>
                      {ALL_PERMISSIONS.map(renderPermissionCheckbox)}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleUpdatePermissions}
                  >
                    <Edit2 size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>نوێکردنەوەی دەسەڵاتەکان</Text>
                  </TouchableOpacity>

                  {selectedEmployee && (
                    <TouchableOpacity
                      style={[
                        styles.toggleStatusButton,
                        (selectedEmployee.isActive !== undefined ? selectedEmployee.isActive : true)
                          ? styles.deactivateButton
                          : styles.activateButton
                      ]}
                      onPress={() => handleToggleEmployeeStatus(selectedEmployee)}
                    >
                      {(selectedEmployee.isActive !== undefined ? selectedEmployee.isActive : true) ? (
                        <>
                          <UserX size={20} color="#EF4444" />
                          <Text style={styles.deactivateButtonText}>ناچالاککردنی کارمەند</Text>
                        </>
                      ) : (
                        <>
                          <UserCheck size={20} color="#10B981" />
                          <Text style={styles.activateButtonText}>چالاککردنەوەی کارمەند</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </LinearGradient>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 2,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#F1F5F9',
  },
  addEmployeeButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  addEmployeeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  employeeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  employeeHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginBottom: 4,
    textAlign: 'right',
  },
  employeeUsername: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'right',
  },
  employeeActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionsContainer: {
    gap: 8,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#94A3B8',
    textAlign: 'right',
  },
  permissionsList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#60A5FA',
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
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#475569',
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
    color: '#EF4444',
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
    overflow: 'hidden',
  },
  modalGradient: {
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
    color: '#F1F5F9',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 32,
    color: '#94A3B8',
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
    color: '#94A3B8',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#F1F5F9',
  },
  permissionsCheckboxList: {
    gap: 12,
  },
  permissionCheckbox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  permissionLabel: {
    fontSize: 15,
    color: '#F1F5F9',
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  employeeInfoSection: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  employeeInfoName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginBottom: 4,
    textAlign: 'right',
  },
  employeeInfoUsername: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'right',
  },
  toggleStatusButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    borderWidth: 2,
  },
  deactivateButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  activateButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  deactivateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#10B981',
  },
});