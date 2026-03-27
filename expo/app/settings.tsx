import { useTheme } from '@/contexts/ThemeContext';
import { useSecurity } from '@/contexts/SecurityContext';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useMarket } from '@/contexts/MarketContext';
import { useRouter } from 'expo-router';
import { 
  getAutomaticReminderSettings, 
  saveAutomaticReminderSettings, 
  scheduleAutomaticReminders,
  cancelAutomaticReminders,
  type AutomaticReminderSettings 
} from '@/utils/automaticReminder';

import { 
  Moon, Sun, DollarSign, Lock, Download, Upload, 
  Bell, Eye, Fingerprint, Globe, LogOut, User, ChevronLeft, Shield, Users, Edit2, UserX, Cloud, Send,
  Info, HelpCircle, MessageSquare, Star, Share2, Sparkles, Grid3x3, Search, X,
  Volume2, Vibrate, Type, Calendar, Palette, Trash2, FileText, Clock, BarChart3,
  Database, Smartphone, Zap, Settings as SettingsIcon, AlertTriangle, Archive
} from 'lucide-react-native';
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
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { Currency } from '@/types';
import { safeJSONParse } from '@/utils/storageRecovery';
import { 
  getCloudSyncSettings, 
  saveCloudSyncSettings, 
  authenticateWithGoogle,
  getGoogleUserInfo,
  disconnectGoogle,
  uploadToCloud,
  downloadFromCloud,
  type CloudSyncSettings 
} from '@/utils/cloudStorage';

const documentDirectory = Platform.OS !== 'web' ? (FileSystem as any).documentDirectory : null;

export default function SettingsScreen() {
  const { settings, updateSettings, toggleTheme, colors } = useTheme();
  const { checkBiometricAvailability, hasPin, setPin, verifyPin, removePin, checkIfPinExists } = useSecurity();
  const { exportData, importData, debtors } = useDebt();
  const { language, setLanguage } = useLanguage();
  const { logout, currentUser, getMarketEmployees } = useAuth();
  const { sendNotification } = useNotifications();
  const { manualSyncToCloud, lastBackendSyncTime, syncStatus, pendingChanges } = useMarket();
  const router = useRouter();


  const [showPinModal, setShowPinModal] = useState(false);
  const [showEditPinModal, setShowEditPinModal] = useState(false);
  const [showPinOptionsModal, setShowPinOptionsModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [oldPinInput, setOldPinInput] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editEmployeeFullName, setEditEmployeeFullName] = useState('');
  const [editEmployeePhone, setEditEmployeePhone] = useState('');
  const [editEmployeePassword, setEditEmployeePassword] = useState('');
  const [editEmployeeConfirmPassword, setEditEmployeeConfirmPassword] = useState('');
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudSettings, setCloudSettings] = useState<CloudSyncSettings>({
    enabled: false,
    provider: 'none',
    autoSync: false,
    syncInterval: 30,
  });
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [showAutoReminderModal, setShowAutoReminderModal] = useState(false);
  const [autoReminderSettings, setAutoReminderSettings] = useState<AutomaticReminderSettings>({
    enabled: false,
    frequency: 'weekly',
    timeOfDay: '09:00',
    dayOfWeek: 1,
    notificationMethod: 'both',
    onlyWithDebt: true,
  });
  const [showAutoLockModal, setShowAutoLockModal] = useState(false);
  const [autoLockDays, setAutoLockDays] = useState('365');
  const [autoLockAmount, setAutoLockAmount] = useState('0');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);

  React.useEffect(() => {
    checkBiometricAvailability().then((result) => {
      setBiometricAvailable(result.available);
    });
    checkIfPinExists();
    loadCloudSettings();
    loadAutoReminderSettings();
    
    setAutoLockDays(settings.autoLockDaysThreshold?.toString() || '365');
    setAutoLockAmount(settings.autoLockAmountThreshold?.toString() || '0');
  }, [checkBiometricAvailability, checkIfPinExists, settings.autoLockDaysThreshold, settings.autoLockAmountThreshold]);

  const loadCloudSettings = async () => {
    const settings = await getCloudSyncSettings();
    const googleUser = await getGoogleUserInfo();
    setCloudSettings({
      ...settings,
      googleConnected: !!googleUser,
      googleUserEmail: googleUser?.email,
      googleUserName: googleUser?.name,
    });
  };

  const loadAutoReminderSettings = async () => {
    const settings = await getAutomaticReminderSettings();
    setAutoReminderSettings(settings);
  };

  const handleToggleAutoReminder = async (enabled: boolean) => {
    const newSettings = { ...autoReminderSettings, enabled };
    setAutoReminderSettings(newSettings);
    await saveAutomaticReminderSettings(newSettings);
    
    if (enabled) {
      try {
        await scheduleAutomaticReminders(debtors, newSettings, sendNotification);
        Alert.alert('سەرکەوتوو', 'ئاگاداری خۆکار چالاک کرا');
      } catch (error) {
        console.error('Error scheduling automatic reminders:', error);
        Alert.alert('هەڵە', 'هەڵە لە چالاککردنی ئاگاداری خۆکار');
      }
    } else {
      try {
        await cancelAutomaticReminders();
        Alert.alert('سەرکەوتوو', 'ئاگاداری خۆکار ناچالاک کرا');
      } catch (error) {
        console.error('Error canceling automatic reminders:', error);
      }
    }
  };

  const handleUpdateAutoReminderSchedule = async () => {
    await saveAutomaticReminderSettings(autoReminderSettings);
    
    if (autoReminderSettings.enabled) {
      try {
        await cancelAutomaticReminders();
        await scheduleAutomaticReminders(debtors, autoReminderSettings, sendNotification);
        Alert.alert('سەرکەوتوو', 'کاتەکانی ئاگادارکردنەوە نوێکرایەوە');
      } catch (error) {
        console.error('Error updating automatic reminder schedule:', error);
        Alert.alert('هەڵە', 'هەڵە لە نوێکردنەوەی کاتەکان');
      }
    }
    
    setShowAutoReminderModal(false);
  };

  const handleConnectGoogle = async () => {
    if (isConnectingGoogle) return;
    
    setIsConnectingGoogle(true);
    try {
      const result = await authenticateWithGoogle();
      
      if (result.success) {
        const newSettings = {
          ...cloudSettings,
          googleConnected: true,
          googleUserEmail: result.email,
          googleUserName: result.name,
          provider: 'gdrive' as const,
          enabled: true,
        };
        setCloudSettings(newSettings);
        await saveCloudSyncSettings(newSettings);
        Alert.alert('سەرکەوتوو', `پەیوەست بوویت بە ${result.email}`);
      } else {
        Alert.alert('هەڵە', result.error || 'نەتوانرا پەیوەست بکرێت بە Google');
      }
    } catch (error) {
      console.error('Google connection error:', error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە پەیوەستکردن بە Google');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    Alert.alert(
      'بڕینی پەیوەندی',
      'ئایا دڵنیایت لە بڕینی پەیوەندی لەگەڵ Google Account؟',
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          style: 'destructive',
          onPress: async () => {
            const success = await disconnectGoogle();
            if (success) {
              const newSettings = {
                ...cloudSettings,
                googleConnected: false,
                googleUserEmail: undefined,
                googleUserName: undefined,
                enabled: false,
                provider: 'none' as const,
              };
              setCloudSettings(newSettings);
              await saveCloudSyncSettings(newSettings);
              Alert.alert('سەرکەوتوو', 'پەیوەندی بڕایەوە');
            } else {
              Alert.alert('هەڵە', 'نەتوانرا پەیوەندی ببڕێتەوە');
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      if (!data) {
        Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی زانیاریەکان');
        return;
      }

      if (Platform.OS === 'web') {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debt-backup-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('سەرکەوتوو', 'فایلەکە داگیرا بە سەرکەوتوویی');
      } else {
        const fileName = `debt-backup-${new Date().toISOString()}.json`;
        const filePath = `${documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, data);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath);
        } else {
          Alert.alert('سەرکەوتوو', `پاشەکەوتکراو لە: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی زانیاریەکان');
    }
  };

  const handleImportData = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = async (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const text = await file.text();
            const success = await importData(text);
            if (success) {
              Alert.alert('سەرکەوتوو', 'زانیاریەکان بە سەرکەوتوویی هاوردە کران');
            } else {
              Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی زانیاریەکان');
            }
          }
        };
        input.click();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
        });

        if (result.canceled) return;

        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        const success = await importData(content);

        if (success) {
          Alert.alert('سەرکەوتوو', 'زانیاریەکان بە سەرکەوتوویی هاوردە کران');
        } else {
          Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی زانیاریەکان');
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('هەڵە', 'هەڵە لە هاوردەکردنی زانیاریەکان');
    }
  };

  const handleSetPin = async () => {
    if (pinInput.length < 4) {
      Alert.alert('هەڵە', 'کۆدی نهێنی دەبێت لانیکەم ٤ ژمارە بێت');
      return;
    }

    if (pinInput !== confirmPinInput) {
      Alert.alert('هەڵە', 'کۆدی نهێنی و پشتڕاستکردنەوەکە یەکسان نین');
      return;
    }

    const success = await setPin(pinInput);
    if (success) {
      updateSettings({ pinEnabled: true });
      await checkIfPinExists();
      setShowPinModal(false);
      setPinInput('');
      setConfirmPinInput('');
      Alert.alert('سەرکەوتوو', 'کۆدی نهێنی دانرا');
    } else {
      Alert.alert('هەڵە', 'هەڵە لە دانانی کۆدی نهێنی');
    }
  };

  const handleRemovePin = async () => {
    Alert.alert(
      'سڕینەوەی کۆدی نهێنی',
      'دڵنیایت لە سڕینەوەی کۆدی نهێنی؟',
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          style: 'destructive',
          onPress: async () => {
            const success = await removePin();
            if (success) {
              updateSettings({ pinEnabled: false, biometricEnabled: false, requirePinForDeletion: false });
              await checkIfPinExists();
              Alert.alert('سەرکەوتوو', 'کۆدی نهێنی سڕایەوە');
            }
          },
        },
      ]
    );
  };



  const handleOpenEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setEditEmployeeFullName(employee.fullName || '');
    setEditEmployeePhone(employee.phone || '');
    setEditEmployeePassword('');
    setEditEmployeeConfirmPassword('');
    setShowEmployeesModal(false);
    setShowEditEmployeeModal(true);
  };

  const handleToggleEmployeeStatus = async (employee: any) => {
    const action = employee.isActive === false ? 'چالاککردنەوە' : 'ناچالاککردن';
    Alert.alert(
      action,
      `ئایا دڵنیایت لە ${action}ی ${employee.fullName}؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            try {
              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              const USERS_KEY = 'users_data';
              
              const storedUsers = await AsyncStorage.getItem(USERS_KEY);
              if (!storedUsers) {
                Alert.alert('هەڵە', 'زانیاری بەکارهێنەران نەدۆزرایەوە');
                return;
              }

              const parsedUsers = await safeJSONParse<any[]>(storedUsers, []);
              if (!parsedUsers) {
                Alert.alert('هەڵە', 'هەڵە لە خوێندنەوەی زانیاریەکان');
                return;
              }

              if (!Array.isArray(parsedUsers)) {
                Alert.alert('هەڵە', 'فۆرماتی زانیاریەکان هەڵەیە');
                return;
              }

              const updatedUsers = parsedUsers.map((u: any) => {
                if (u.id === employee.id) {
                  const currentStatus = u.isActive !== undefined ? u.isActive : true;
                  return {
                    ...u,
                    isActive: !currentStatus
                  };
                }
                return u;
              });

              await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
              
              const newStatus = employee.isActive === false;
              const message = newStatus ? 'کارمەند چالاککرایەوە' : 'کارمەند ناچالاککرا';
              
              Alert.alert(
                'سەرکەوتوو', 
                message,
                [
                  {
                    text: 'باشە',
                    onPress: () => {
                      setShowEmployeesModal(false);
                      setTimeout(() => {
                        setShowEmployeesModal(true);
                      }, 100);
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error toggling employee status:', error);
              Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە گۆڕینی باری کارمەند');
            }
          },
        },
      ]
    );
  };

  const handleSaveEmployeeEdit = async () => {
    if (!selectedEmployee) return;

    if (!editEmployeeFullName.trim()) {
      Alert.alert('هەڵە', 'تکایە ناو بنووسە');
      return;
    }

    if (!editEmployeePhone.trim()) {
      Alert.alert('هەڵە', 'تکایە ژمارە تەلەفۆن بنووسە');
      return;
    }

    if (editEmployeePassword && editEmployeePassword !== editEmployeeConfirmPassword) {
      Alert.alert('هەڵە', 'ووشەی نهێنی و دووبارەکردنەوەکە یەکسان نین');
      return;
    }

    if (editEmployeePassword && editEmployeePassword.length < 4) {
      Alert.alert('هەڵە', 'ووشەی نهێنی دەبێت لانیکەم ٤ پیت بێت');
      return;
    }

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const USERS_KEY = 'users_data';
      
      const storedUsers = await AsyncStorage.getItem(USERS_KEY);
      if (storedUsers) {
        const parsedUsers = await safeJSONParse<any[]>(storedUsers, []);
        const updatedUsers = parsedUsers.map((u: any) => {
          if (u.id === selectedEmployee.id) {
            return {
              ...u,
              fullName: editEmployeeFullName.trim(),
              phone: editEmployeePhone.trim(),
              username: editEmployeePhone.trim(),
              password: editEmployeePassword || u.password,
            };
          }
          return u;
        });

        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
        
        Alert.alert('سەرکەوتوو', 'زانیاریەکان بەسەرکەوتوویی نوێکرانەوە', [
          {
            text: 'باشە',
            onPress: () => {
              setShowEditEmployeeModal(false);
              setSelectedEmployee(null);
              setEditEmployeeFullName('');
              setEditEmployeePhone('');
              setEditEmployeePassword('');
              setEditEmployeeConfirmPassword('');
              setShowEmployeesModal(true);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە نوێکردنەوەی زانیاریەکان');
    }
  };

  const handleResetPin = async () => {
    if (pinInput.length < 4) {
      Alert.alert('هەڵە', 'کۆدی نهێنی دەبێت لانیکەم ٤ ژمارە بێت');
      return;
    }

    if (pinInput !== confirmPinInput) {
      Alert.alert('هەڵە', 'کۆدی نهێنی و پشتڕاستکردنەوەکە یەکسان نین');
      return;
    }

    const success = await setPin(pinInput);
    if (success) {
      await checkIfPinExists();
      setShowResetPinModal(false);
      setPinInput('');
      setConfirmPinInput('');
      Alert.alert('سەرکەوتوو', 'کۆدی نهێنی نوێکرایەوە');
    } else {
      Alert.alert('هەڵە', 'هەڵە لە نوێکردنەوەی کۆدی نهێنی');
    }
  };

  const handleEditPin = async () => {
    if (!oldPinInput || oldPinInput.length < 4) {
      Alert.alert('هەڵە', 'کۆدی نهێنی کۆن داخڵ بکە');
      return;
    }

    const isValid = await verifyPin(oldPinInput);
    if (!isValid) {
      Alert.alert('هەڵە', 'کۆدی نهێنی کۆن هەڵەیە');
      return;
    }

    if (pinInput.length < 4) {
      Alert.alert('هەڵە', 'کۆدی نهێنی نوێ دەبێت لانیکەم ٤ ژمارە بێت');
      return;
    }

    if (pinInput !== confirmPinInput) {
      Alert.alert('هەڵە', 'کۆدی نهێنی و پشتڕاستکردنەوەکە یەکسان نین');
      return;
    }

    const success = await setPin(pinInput);
    if (success) {
      await checkIfPinExists();
      setShowEditPinModal(false);
      setPinInput('');
      setConfirmPinInput('');
      setOldPinInput('');
      Alert.alert('سەرکەوتوو', 'کۆدی نهێنی نوێکرایەوە');
    } else {
      Alert.alert('هەڵە', 'هەڵە لە نوێکردنەوەی کۆدی نهێنی');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="گەڕان لە ڕێکخستنەکان..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          
          <TouchableOpacity
            style={[styles.profileSection, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
            onPress={() => router.push('/profile' as any)}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.textSecondary} style={styles.chevronIcon} />
            <View style={styles.profileContent}>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {currentUser?.fullName || currentUser?.username || 'بەکارهێنەر'}
                </Text>
                <View style={[styles.roleBadge, { 
                  backgroundColor: currentUser?.role === 'owner' 
                    ? 'rgba(251, 191, 36, 0.2)' 
                    : currentUser?.role === 'manager' 
                      ? colors.primaryGlass 
                      : currentUser?.role === 'employee'
                        ? colors.successGlass
                        : 'rgba(59, 130, 246, 0.2)'
                }]}>
                  <Shield size={12} color={
                    currentUser?.role === 'owner' 
                      ? '#FBBF24' 
                      : currentUser?.role === 'manager' 
                        ? colors.primary 
                        : currentUser?.role === 'employee'
                          ? colors.success
                          : '#3B82F6'
                  } />
                  <Text style={[styles.roleText, { 
                    color: currentUser?.role === 'owner' 
                      ? '#FBBF24' 
                      : currentUser?.role === 'manager' 
                        ? colors.primary 
                        : currentUser?.role === 'employee'
                          ? colors.success
                          : '#3B82F6'
                  }]}>
                    {currentUser?.role === 'owner' ? 'خاوەندار' : 
                     currentUser?.role === 'manager' ? 'بەڕێوەبەر' : 
                     currentUser?.role === 'employee' ? 'کارمەند' : 'کڕیار'}
                  </Text>
                </View>
                {currentUser?.phone && (
                  <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>
                    {currentUser.phone}
                  </Text>
                )}
              </View>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primaryGlass }]}>
                <User size={32} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>



          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ڕواڵەت</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={toggleTheme}
            >
              <View style={styles.settingLeft}>
                {settings.theme === 'dark' ? (
                  <Moon size={24} color={colors.primary} />
                ) : (
                  <Sun size={24} color={colors.primary} />
                )}
                <Text style={[styles.settingText, { color: colors.text }]}>
                  {settings.theme === 'dark' ? 'دۆخی تاریک' : 'دۆخی ڕووناک'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>گۆڕین</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>زمان</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Globe size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>زمانی پڕۆگرامەکە</Text>
              </View>
              <View style={styles.languageButtons}>
                {(['ku', 'en', 'ar'] as Language[]).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.currencyButton,
                      { borderColor: colors.cardBorder },
                      language === lang && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary 
                      },
                    ]}
                    onPress={() => setLanguage(lang)}
                  >
                    <Text style={[
                      styles.currencyButtonText,
                      { color: language === lang ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                      {lang === 'ku' ? 'کوردی' : lang === 'en' ? 'English' : 'عربي'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>پارە</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <DollarSign size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>جۆری پارە</Text>
              </View>
              <View style={styles.currencyButtons}>
                {(['IQD', 'USD', 'EUR'] as Currency[]).map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyButton,
                      { borderColor: colors.cardBorder },
                      settings.currency === curr && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary 
                      },
                    ]}
                    onPress={() => updateSettings({ currency: curr })}
                  >
                    <Text style={[
                      styles.currencyButtonText,
                      { color: settings.currency === curr ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                      {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ئاسایش</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Eye size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>شاردنەوەی بڕەکان</Text>
              </View>
              <Switch
                value={settings.hideAmounts}
                onValueChange={(value) => updateSettings({ hideAmounts: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => {
                if (hasPin) {
                  setShowPinOptionsModal(true);
                } else {
                  setShowPinModal(true);
                }
              }}
            >
              <View style={styles.settingLeft}>
                <Lock size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>کۆدی نهێنی</Text>
              </View>
              <View style={[
                styles.badge, 
                { backgroundColor: hasPin ? colors.success : colors.error }
              ]}>
                <Text style={styles.badgeText}>{hasPin ? 'چالاکە' : 'ناچالاکە'}</Text>
              </View>
            </TouchableOpacity>

            {biometricAvailable && hasPin && (
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.settingLeft}>
                  <Fingerprint size={24} color={colors.primary} />
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    دڵنیاکردنەوەی بایۆمەتریک
                  </Text>
                </View>
                <Switch
                  value={settings.biometricEnabled}
                  onValueChange={(value) => updateSettings({ biometricEnabled: value })}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            )}

            {hasPin && (
              <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.settingLeft}>
                  <Lock size={24} color={colors.warning} />
                  <Text style={[styles.settingText, { color: colors.text }]}>
                    پین کۆد بۆ سڕینەوەی قەرز
                  </Text>
                </View>
                <Switch
                  value={settings.requirePinForDeletion}
                  onValueChange={(value) => updateSettings({ requirePinForDeletion: value })}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>پەیوەندی و ئاگادارکردنەوە</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Bell size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>هۆشیاریەکان</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/telegram-settings' as any)}
            >
              <View style={styles.settingLeft}>
                <Send size={24} color="#0088CC" />
                <Text style={[styles.settingText, { color: colors.text }]}>پەیوەندی Telegram</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setShowAutoReminderModal(true)}
            >
              <View style={styles.settingLeft}>
                <Bell size={24} color={colors.warning} />
                <Text style={[styles.settingText, { color: colors.text }]}>ئاگادارکردنەوەی هەفتانەی خۆکار</Text>
              </View>
              <View style={[
                styles.badge, 
                { backgroundColor: autoReminderSettings.enabled ? colors.success : colors.textTertiary }
              ]}>
                <Text style={styles.badgeText}>
                  {autoReminderSettings.enabled ? 'چالاکە' : 'ناچالاکە'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>پاشەکەوتکردن</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleExportData}
            >
              <View style={styles.settingLeft}>
                <Download size={24} color={colors.success} />
                <Text style={[styles.settingText, { color: colors.text }]}>هاوردەکردنی زانیاریەکان</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={handleImportData}
            >
              <View style={styles.settingLeft}>
                <Upload size={24} color={colors.warning} />
                <Text style={[styles.settingText, { color: colors.text }]}>گەڕاندنەوەی زانیاریەکان</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setShowCloudModal(true)}
            >
              <View style={styles.settingLeft}>
                <Cloud size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>هەڵگرتنی هەوری</Text>
              </View>
              <View style={[
                styles.badge, 
                { backgroundColor: cloudSettings.enabled ? colors.success : colors.textTertiary }
              ]}>
                <Text style={styles.badgeText}>
                  {cloudSettings.enabled ? 'چالاکە' : 'ناچالاکە'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {(currentUser?.role === 'manager' || currentUser?.role === 'owner') && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>قوفڵکردنی قەرزە کۆنەکان</Text>
              
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => setShowAutoLockModal(true)}
              >
                <View style={styles.settingLeft}>
                  <Lock size={24} color={colors.error} />
                  <Text style={[styles.settingText, { color: colors.text }]}>قوفڵکردنی خۆکاری قەرز</Text>
                </View>
                <View style={[
                  styles.badge, 
                  { backgroundColor: settings.autoLockOldDebts ? colors.success : colors.textTertiary }
                ]}>
                  <Text style={styles.badgeText}>
                    {settings.autoLockOldDebts ? 'چالاکە' : 'ناچالاکە'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>سیستەم</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setShowSystemSettings(!showSystemSettings)}
            >
              <View style={styles.settingLeft}>
                <SettingsIcon size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>ڕێکخستنە سیستەمییەکان</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} style={[
                showSystemSettings && { transform: [{ rotate: '-90deg' }] }
              ]} />
            </TouchableOpacity>

            {showSystemSettings && (
              <>
                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Cloud size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>پاشەکەوتکردنی خۆکار</Text>
                  </View>
                  <Switch
                    value={settings.autoBackup !== false}
                    onValueChange={(value) => updateSettings({ autoBackup: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Database size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>ڕەمزکردنی زانیاریەکان</Text>
                  </View>
                  <Switch
                    value={settings.dataEncryption !== false}
                    onValueChange={(value) => updateSettings({ dataEncryption: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Zap size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>سینکرۆنی کردنی خۆکار</Text>
                  </View>
                  <Switch
                    value={settings.autoSync !== false}
                    onValueChange={(value) => updateSettings({ autoSync: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <AlertTriangle size={24} color={colors.warning} />
                    <Text style={[styles.settingText, { color: colors.text }]}>هۆشیارییەکانی سیستەم</Text>
                  </View>
                  <Switch
                    value={settings.systemAlerts !== false}
                    onValueChange={(value) => updateSettings({ systemAlerts: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>تایبەتێتی و ئاسایش</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setShowPrivacySettings(!showPrivacySettings)}
            >
              <View style={styles.settingLeft}>
                <Shield size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>ڕێکخستنەکانی تایبەتێتی</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} style={[
                showPrivacySettings && { transform: [{ rotate: '-90deg' }] }
              ]} />
            </TouchableOpacity>

            {showPrivacySettings && (
              <>
                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Lock size={24} color={colors.error} />
                    <Text style={[styles.settingText, { color: colors.text }]}>قوفڵکردنی خۆکاری ئەپ</Text>
                  </View>
                  <Switch
                    value={settings.autoLockApp !== false}
                    onValueChange={(value) => updateSettings({ autoLockApp: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Eye size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>شاردنەوەی شاشە لە بەکگراوند</Text>
                  </View>
                  <Switch
                    value={settings.hideScreenInBackground !== false}
                    onValueChange={(value) => updateSettings({ hideScreenInBackground: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Shield size={24} color={colors.warning} />
                    <Text style={[styles.settingText, { color: colors.text }]}>دۆخی نهێنی</Text>
                  </View>
                  <Switch
                    value={settings.privateMode !== false}
                    onValueChange={(value) => updateSettings({ privateMode: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Archive size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>کۆپیەی پاشەکەوتی خۆکار</Text>
                  </View>
                  <Switch
                    value={settings.automaticBackupCopy !== false}
                    onValueChange={(value) => updateSettings({ automaticBackupCopy: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>هۆشیارکردنەوە و پەیوەندی</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              <View style={styles.settingLeft}>
                <Bell size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>ڕێکخستنەکانی هۆشیاری</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} style={[
                showNotificationSettings && { transform: [{ rotate: '-90deg' }] }
              ]} />
            </TouchableOpacity>

            {showNotificationSettings && (
              <>
                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Bell size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>هۆشیاریەکانی زیرەک</Text>
                  </View>
                  <Switch
                    value={settings.smartNotifications !== false}
                    onValueChange={(value) => updateSettings({ smartNotifications: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Volume2 size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>تێلی دەنگی خۆکار</Text>
                  </View>
                  <Switch
                    value={settings.autoVoiceCall !== false}
                    onValueChange={(value) => updateSettings({ autoVoiceCall: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Send size={24} color={colors.success} />
                    <Text style={[styles.settingText, { color: colors.text }]}>نامەی SMS خۆکار</Text>
                  </View>
                  <Switch
                    value={settings.autoSMS !== false}
                    onValueChange={(value) => updateSettings({ autoSMS: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <MessageSquare size={24} color="#25D366" />
                    <Text style={[styles.settingText, { color: colors.text }]}>پەیوەندی WhatsApp خۆکار</Text>
                  </View>
                  <Switch
                    value={settings.autoWhatsApp !== false}
                    onValueChange={(value) => updateSettings({ autoWhatsApp: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>پیشاندان و ڕواڵەت</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Type size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>قەبارەی فۆنت</Text>
              </View>
              <View style={styles.fontSizeButtons}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeButton,
                      { borderColor: colors.cardBorder },
                      settings.fontSize === size && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary 
                      },
                    ]}
                    onPress={() => updateSettings({ fontSize: size })}
                  >
                    <Text style={[
                      styles.fontSizeButtonText,
                      { color: settings.fontSize === size ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                      {size === 'small' ? 'بچووک' : size === 'medium' ? 'ناوەند' : 'گەورە'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Palette size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>پیشاندانی ڕەنگاوڕەنگ</Text>
              </View>
              <Switch
                value={settings.colorfulMode}
                onValueChange={(value) => updateSettings({ colorfulMode: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <BarChart3 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>پیشاندانی ئامارەکان لە سەرەکی</Text>
              </View>
              <Switch
                value={settings.showStatsOnHome !== false}
                onValueChange={(value) => updateSettings({ showStatsOnHome: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>دەنگ و لەرینەوە</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Volume2 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>کاریگەری دەنگی</Text>
              </View>
              <Switch
                value={settings.soundEnabled !== false}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Vibrate size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>لەرینەوەی هاپتیک</Text>
              </View>
              <Switch
                value={settings.hapticEnabled !== false}
                onValueChange={(value) => updateSettings({ hapticEnabled: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>کات و بەروار</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Calendar size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>فۆرماتی بەروار</Text>
              </View>
              <View style={styles.dateFormatButtons}>
                {(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const).map((format) => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.dateFormatButton,
                      { borderColor: colors.cardBorder },
                      settings.dateFormat === format && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary 
                      },
                    ]}
                    onPress={() => updateSettings({ dateFormat: format })}
                  >
                    <Text style={[
                      styles.dateFormatButtonText,
                      { color: settings.dateFormat === format ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                      {format}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Clock size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>فۆرماتی کات</Text>
              </View>
              <View style={styles.timeFormatButtons}>
                {(['12h', '24h'] as const).map((format) => (
                  <TouchableOpacity
                    key={format}
                    style={[
                      styles.timeFormatButton,
                      { borderColor: colors.cardBorder },
                      settings.timeFormat === format && { 
                        backgroundColor: colors.primary,
                        borderColor: colors.primary 
                      },
                    ]}
                    onPress={() => updateSettings({ timeFormat: format })}
                  >
                    <Text style={[
                      styles.timeFormatButtonText,
                      { color: settings.timeFormat === format ? '#FFFFFF' : colors.textSecondary },
                    ]}>
                      {format === '12h' ? '12 کاتژمێر' : '24 کاتژمێر'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>هاوردەکردن و ڕاپۆرتەکان</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/quick-reports' as any)}
            >
              <View style={styles.settingLeft}>
                <FileText size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>ڕاپۆرتی خێرا</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/custom-reports' as any)}
            >
              <View style={styles.settingLeft}>
                <BarChart3 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>ڕاپۆرتی تایبەت</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <FileText size={24} color={colors.error} />
                <Text style={[styles.settingText, { color: colors.text }]}>هاوردەکردنی PDF</Text>
              </View>
              <Switch
                value={settings.pdfExport !== false}
                onValueChange={(value) => updateSettings({ pdfExport: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <FileText size={24} color={colors.success} />
                <Text style={[styles.settingText, { color: colors.text }]}>هاوردەکردنی Excel</Text>
              </View>
              <Switch
                value={settings.excelExport !== false}
                onValueChange={(value) => updateSettings({ excelExport: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>تایبەتمەندیەکان</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/features-settings' as any)}
            >
              <View style={styles.settingLeft}>
                <Grid3x3 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>هەموو تایبەتمەندیەکان</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/ai-features' as any)}
            >
              <View style={styles.settingLeft}>
                <Sparkles size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>تایبەتمەندیە زیرەکەکان (AI)</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/advanced-analytics' as any)}
            >
              <View style={styles.settingLeft}>
                <BarChart3 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>شیکردنەوەی پێشکەوتوو</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Sparkles size={24} color={colors.warning} />
                <Text style={[styles.settingText, { color: colors.text }]}>پێشنیاری زیرەک بۆ پارەدانەوە</Text>
              </View>
              <Switch
                value={settings.smartPaymentSuggestions !== false}
                onValueChange={(value) => updateSettings({ smartPaymentSuggestions: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <BarChart3 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>شیکردنەوەی نەریتەکان</Text>
              </View>
              <Switch
                value={settings.behaviorAnalysis !== false}
                onValueChange={(value) => updateSettings({ behaviorAnalysis: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Zap size={24} color={colors.warning} />
                <Text style={[styles.settingText, { color: colors.text }]}>پێشبینیکردنی سیکڵی پارەدانەوە</Text>
              </View>
              <Switch
                value={settings.paymentCyclePrediction !== false}
                onValueChange={(value) => updateSettings({ paymentCyclePrediction: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ڕێکخستنە پێشکەوتووەکان</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <View style={styles.settingLeft}>
                <SettingsIcon size={24} color={colors.warning} />
                <Text style={[styles.settingText, { color: colors.text }]}>ڕێکخستنە پێشکەوتووەکان</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} style={[
                showAdvancedSettings && { transform: [{ rotate: '-90deg' }] }
              ]} />
            </TouchableOpacity>

            {showAdvancedSettings && (
              <>
                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Database size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>قەبارەی داتابەیس</Text>
                  </View>
                  <Text style={[styles.settingValue, { color: colors.textSecondary }]}>~{Math.round(debtors.length * 2.5)} KB</Text>
                </View>

                <TouchableOpacity
                  style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => {
                    Alert.alert(
                      'پاککردنەوەی Cache',
                      'ئایا دڵنیایت لە پاککردنەوەی هەموو داتاکانی Cache؟',
                      [
                        { text: 'نەخێر', style: 'cancel' },
                        {
                          text: 'بەڵێ',
                          style: 'destructive',
                          onPress: async () => {
                            Alert.alert('سەرکەوتوو', 'Cache پاککرایەوە');
                          },
                        },
                      ]
                    );
                  }}
                >
                  <View style={styles.settingLeft}>
                    <Trash2 size={24} color={colors.error} />
                    <Text style={[styles.settingText, { color: colors.text }]}>پاککردنەوەی Cache</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => router.push('/history-log' as any)}
                >
                  <View style={styles.settingLeft}>
                    <Archive size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>مێژووی گۆڕانکارییەکان</Text>
                  </View>
                  <ChevronLeft size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Clock size={24} color={colors.warning} />
                    <Text style={[styles.settingText, { color: colors.text }]}>دەرچوونی خۆکار</Text>
                  </View>
                  <Switch
                    value={settings.autoLogout !== false}
                    onValueChange={(value) => updateSettings({ autoLogout: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.settingLeft}>
                    <Zap size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>دۆخی کارایی بەرز</Text>
                  </View>
                  <Switch
                    value={settings.performanceMode !== false}
                    onValueChange={(value) => updateSettings({ performanceMode: value })}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => router.push('/duplicate-detection' as any)}
                >
                  <View style={styles.settingLeft}>
                    <AlertTriangle size={24} color={colors.warning} />
                    <Text style={[styles.settingText, { color: colors.text }]}>دۆزینەوەی دووبارەکان</Text>
                  </View>
                  <ChevronLeft size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => router.push('/bulk-operations' as any)}
                >
                  <View style={styles.settingLeft}>
                    <Database size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>کردارەکانی گشتی</Text>
                  </View>
                  <ChevronLeft size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>ناوەندی زانیاری</Text>
            
            <View style={[styles.infoCard, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}>
              <Smartphone size={32} color={colors.primary} />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>وەشانی ئەپ</Text>
                <Text style={[styles.infoCardValue, { color: colors.textSecondary }]}>v1.5.2</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.successGlass, borderColor: colors.success }]}>
              <Users size={32} color={colors.success} />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>کۆی قەرزدارەکان</Text>
                <Text style={[styles.infoCardValue, { color: colors.textSecondary }]}>{debtors.length} کەس</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.warningGlass, borderColor: colors.warning }]}>
              <Database size={32} color={colors.warning} />
              <View style={styles.infoCardContent}>
                <Text style={[styles.infoCardTitle, { color: colors.text }]}>قەبارەی داتا</Text>
                <Text style={[styles.infoCardValue, { color: colors.textSecondary }]}>~{Math.round(debtors.length * 2.5)} KB</Text>
              </View>
            </View>
          </View>

          {(currentUser?.role === 'manager' || currentUser?.role === 'employee') && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>بەڕێوەبردن</Text>
              
              <TouchableOpacity
                style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => router.push('/customer-accounts' as any)}
              >
                <View style={styles.settingLeft}>
                  <Users size={24} color={colors.primary} />  
                  <Text style={[styles.settingText, { color: colors.text }]}>هەژمارەکانی کڕیاران</Text>
                </View>
                <ChevronLeft size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {currentUser?.role === 'manager' && (
                <TouchableOpacity
                  style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                  onPress={() => router.push('/manage-employees' as any)}
                >
                  <View style={styles.settingLeft}>
                    <Users size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>بەڕێوەبردنی کارمەندان</Text>
                  </View>
                  <ChevronLeft size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>بەکارهێنانی ئاسان</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Zap size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>میانڕەوی خێرا</Text>
              </View>
              <Switch
                value={settings.quickShortcuts !== false}
                onValueChange={(value) => updateSettings({ quickShortcuts: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Eye size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>دۆخی ئاسان (فۆنتی گەورە)</Text>
              </View>
              <Switch
                value={settings.easyMode !== false}
                onValueChange={(value) => updateSettings({ easyMode: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Zap size={24} color={colors.success} />
                <Text style={[styles.settingText, { color: colors.text }]}>جێبەجێکردنی خۆکاری تراژیدییەکان</Text>
              </View>
              <Switch
                value={settings.autoTransactions !== false}
                onValueChange={(value) => updateSettings({ autoTransactions: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Database size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>پیشاندانی خێرای داتا</Text>
              </View>
              <Switch
                value={settings.fastDataDisplay !== false}
                onValueChange={(value) => updateSettings({ fastDataDisplay: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>کۆمەڵایەتی و هاوبەشکردن</Text>
            
            <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.settingLeft}>
                <Share2 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>هاوبەشکردنی چالاکییەکان</Text>
              </View>
              <Switch
                value={settings.shareActivity !== false}
                onValueChange={(value) => updateSettings({ shareActivity: value })}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/social-comparison' as any)}
            >
              <View style={styles.settingLeft}>
                <Users size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>بەراوردکردن لەگەڵ کەسانی تر</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/debt-gamification' as any)}
            >
              <View style={styles.settingLeft}>
                <Star size={24} color={colors.warning} />
                <Text style={[styles.settingText, { color: colors.text }]}>ئامارەکانی یاری</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>یارمەتی و زانیاری</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/about' as any)}
            >
              <View style={styles.settingLeft}>
                <Info size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>دەربارە</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/help-faq' as any)}
            >
              <View style={styles.settingLeft}>
                <HelpCircle size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>یارمەتی و پرسیارە باوەکان</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/contact-support' as any)}
            >
              <View style={styles.settingLeft}>
                <MessageSquare size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>پشتگیری</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/whats-new' as any)}
            >
              <View style={styles.settingLeft}>
                <Sparkles size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>چی نوێیە</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/privacy-policy' as any)}
            >
              <View style={styles.settingLeft}>
                <Shield size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>سیاسەتی تایبەتێتی</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => router.push('/terms-of-service' as any)}
            >
              <View style={styles.settingLeft}>
                <Shield size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>مەرجەکانی بەکارهێنان</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>هاوبەشکردن</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={async () => {
                const { rateApp } = await import('@/utils/appReview');
                await rateApp();
              }}
            >
              <View style={styles.settingLeft}>
                <Star size={24} color={colors.warning} />
                <Text style={[styles.settingText, { color: colors.text }]}>هەڵسەنگاندنی ئەپەکە</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={async () => {
                const { shareApp } = await import('@/utils/appReview');
                await shareApp();
              }}
            >
              <View style={styles.settingLeft}>
                <Share2 size={24} color={colors.primary} />
                <Text style={[styles.settingText, { color: colors.text }]}>هاوبەشکردنی ئەپەکە</Text>
              </View>
              <ChevronLeft size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>هەژمار</Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              onPress={() => {
                Alert.alert(
                  'چوونە دەرەوە',
                  'ئایا دڵنیایت لە چوونە دەرەوە؟',
                  [
                    { text: 'نەخێر', style: 'cancel' },
                    {
                      text: 'بەڵێ',
                      style: 'destructive',
                      onPress: async () => {
                        await logout();
                        router.replace('/login' as any);
                      },
                    },
                  ]
                );
              }}
            >
              <View style={styles.settingLeft}>
                <LogOut size={24} color="#EF4444" />
                <Text style={[styles.settingText, { color: '#EF4444' }]}>چوونە دەرەوە</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPinModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPinModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>دانانی کۆدی نهێنی</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>کۆدی نهێنی</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text 
                  }]}
                  value={pinInput}
                  onChangeText={setPinInput}
                  placeholder="لانیکەم ٤ ژمارە"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>پشتڕاستکردنەوە</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text 
                  }]}
                  value={confirmPinInput}
                  onChangeText={setConfirmPinInput}
                  placeholder="دووبارە بنووسەوە"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                  onPress={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setConfirmPinInput('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSetPin}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>دانان</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditPinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditPinModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEditPinModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>دەستکاری کردنی کۆدی نهێنی</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>کۆدی نهێنی کۆن</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text 
                  }]}
                  value={oldPinInput}
                  onChangeText={setOldPinInput}
                  placeholder="کۆدی نهێنی ئێستا"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>کۆدی نهێنی نوێ</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text 
                  }]}
                  value={pinInput}
                  onChangeText={setPinInput}
                  placeholder="لانیکەم ٤ ژمارە"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>پشتڕاستکردنەوە</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text 
                  }]}
                  value={confirmPinInput}
                  onChangeText={setConfirmPinInput}
                  placeholder="دووبارە بنووسەوە"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                  onPress={() => {
                    setShowEditPinModal(false);
                    setPinInput('');
                    setConfirmPinInput('');
                    setOldPinInput('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleEditPin}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>نوێکردنەوە</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showPinOptionsModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPinOptionsModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPinOptionsModal(false)}
          />
          <View style={[styles.optionsModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.optionsModalTitle, { color: colors.text }]}>کۆدی نهێنی</Text>
            
            <TouchableOpacity
              style={[styles.optionButton, { borderBottomColor: colors.cardBorder }]}
              onPress={() => {
                setShowPinOptionsModal(false);
                setShowEditPinModal(true);
              }}
            >
              <Lock size={20} color={colors.primary} />
              <Text style={[styles.optionButtonText, { color: colors.text }]}>دەستکاری</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { borderBottomColor: colors.cardBorder }]}
              onPress={() => {
                setShowPinOptionsModal(false);
                setShowResetPinModal(true);
              }}
            >
              <Lock size={20} color="#F59E0B" />
              <Text style={[styles.optionButtonText, { color: '#F59E0B' }]}>ڕێسێتکردنەوە</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { borderBottomColor: colors.cardBorder }]}
              onPress={() => {
                setShowPinOptionsModal(false);
                handleRemovePin();
              }}
            >
              <Lock size={20} color="#EF4444" />
              <Text style={[styles.optionButtonText, { color: '#EF4444' }]}>سڕینەوە</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => setShowPinOptionsModal(false)}
            >
              <Text style={[styles.optionButtonText, { color: colors.textSecondary }]}>پاشگەزبوونەوە</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showResetPinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowResetPinModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowResetPinModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>ڕێسێتکردنەوەی کۆدی نهێنی</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>پینکۆدێکی نوێ دابنێ بەبێ پێویستی بە کۆدی کۆن</Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>کۆدی نهێنی نوێ</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text 
                  }]}
                  value={pinInput}
                  onChangeText={setPinInput}
                  placeholder="لانیکەم ٤ ژمارە"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>پشتڕاستکردنەوە</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    color: colors.text 
                  }]}
                  value={confirmPinInput}
                  onChangeText={setConfirmPinInput}
                  placeholder="دووبارە بنووسەوە"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                  onPress={() => {
                    setShowResetPinModal(false);
                    setPinInput('');
                    setConfirmPinInput('');
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#F59E0B' }]}
                  onPress={handleResetPin}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>ڕێسێتکردنەوە</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEmployeesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEmployeesModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEmployeesModal(false)}
          />
          <View style={[styles.employeesModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <View style={styles.employeesModalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>کارمەندەکان</Text>
                <TouchableOpacity
                  onPress={() => setShowEmployeesModal(false)}
                  style={styles.closeModalButton}
                >
                  <Text style={[styles.closeModalButtonText, { color: colors.textSecondary }]}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.employeesModalScroll} showsVerticalScrollIndicator={false}>
                {getMarketEmployees().length === 0 ? (
                  <View style={styles.emptyEmployeesContainer}>
                    <Users size={60} color={colors.textTertiary} />
                    <Text style={[styles.emptyEmployeesText, { color: colors.textSecondary }]}>
                      هیچ کارمەندێک تۆمار نەکراوە
                    </Text>
                  </View>
                ) : (
                  getMarketEmployees().map((employee) => {
                    const isInactive = employee.isActive === false;
                    return (
                      <View
                        key={employee.id}
                        style={[
                          styles.employeeItem,
                          { 
                            backgroundColor: colors.cardGlass,
                            borderColor: isInactive ? colors.error : colors.glassBorder,
                            opacity: isInactive ? 0.6 : 1,
                          }
                        ]}
                      >
                        <View style={styles.employeeItemInfo}>
                          <View style={[styles.employeeItemAvatar, { backgroundColor: colors.primaryGlass }]}>
                            <User size={24} color={colors.primary} />
                          </View>
                          <View style={styles.employeeItemDetails}>
                            <Text style={[styles.employeeItemName, { color: colors.text }]}>
                              {employee.fullName || employee.username}
                            </Text>
                            {employee.phone && (
                              <Text style={[styles.employeeItemPhone, { color: colors.textSecondary }]}>
                                {employee.phone}
                              </Text>
                            )}
                            {isInactive && (
                              <View style={[styles.inactiveBadge, { backgroundColor: colors.errorGlass }]}>
                                <Text style={[styles.inactiveBadgeText, { color: colors.error }]}>
                                  ناچالاک
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.employeeItemActions}>
                          <TouchableOpacity
                            style={[styles.employeeActionButton, { backgroundColor: colors.primaryGlass, borderColor: colors.primary }]}
                            onPress={() => handleOpenEditEmployee(employee)}
                          >
                            <Edit2 size={18} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.employeeActionButton,
                              { 
                                backgroundColor: isInactive ? colors.successGlass : colors.errorGlass,
                                borderColor: isInactive ? colors.success : colors.error,
                              }
                            ]}
                            onPress={() => handleToggleEmployeeStatus(employee)}
                          >
                            <UserX size={18} color={isInactive ? colors.success : colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditEmployeeModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowEditEmployeeModal(false);
          setSelectedEmployee(null);
          setEditEmployeeFullName('');
          setEditEmployeePhone('');
          setEditEmployeePassword('');
          setEditEmployeeConfirmPassword('');
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowEditEmployeeModal(false);
              setSelectedEmployee(null);
              setEditEmployeeFullName('');
              setEditEmployeePhone('');
              setEditEmployeePassword('');
              setEditEmployeeConfirmPassword('');
            }}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>دەستکاریکردنی کارمەند</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>ناوی تەواو</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text 
                    }]}
                    value={editEmployeeFullName}
                    onChangeText={setEditEmployeeFullName}
                    placeholder="ناوی تەواو بنووسە..."
                    placeholderTextColor={colors.textTertiary}
                    textAlign="right"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>ژمارە تەلەفۆن</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text 
                    }]}
                    value={editEmployeePhone}
                    onChangeText={setEditEmployeePhone}
                    placeholder="ژمارە تەلەفۆن بنووسە..."
                    placeholderTextColor={colors.textTertiary}
                    textAlign="right"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>ووشەی نهێنی نوێ (ئارەزوومەندانە)</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text 
                    }]}
                    value={editEmployeePassword}
                    onChangeText={setEditEmployeePassword}
                    placeholder="ووشەی نهێنی نوێ..."
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry
                    textAlign="right"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>دووبارەکردنەوەی ووشەی نهێنی</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.cardBorder,
                      color: colors.text 
                    }]}
                    value={editEmployeeConfirmPassword}
                    onChangeText={setEditEmployeeConfirmPassword}
                    placeholder="دووبارە بنووسەوە"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry
                    textAlign="right"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                  onPress={() => {
                    setShowEditEmployeeModal(false);
                    setSelectedEmployee(null);
                    setEditEmployeeFullName('');
                    setEditEmployeePhone('');
                    setEditEmployeePassword('');
                    setEditEmployeeConfirmPassword('');
                    setShowEmployeesModal(true);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveEmployeeEdit}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>پاشەکەوتکردن</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showCloudModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCloudModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCloudModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>هەڵگرتنی هەوری</Text>

              <View style={styles.cloudModalContent}>
                <View style={[styles.settingItem, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                  <View style={styles.settingLeft}>
                    <Cloud size={24} color={colors.primary} />
                    <Text style={[styles.settingText, { color: colors.text }]}>چالاککردن</Text>
                  </View>
                  <Switch
                    value={cloudSettings.enabled}
                    onValueChange={async (value) => {
                      const newSettings = { ...cloudSettings, enabled: value };
                      setCloudSettings(newSettings);
                      await saveCloudSyncSettings(newSettings);
                    }}
                    trackColor={{ false: colors.cardBorder, true: colors.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {cloudSettings.enabled && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: colors.text }]}>دابینکەری خزمەتگوزاری</Text>
                      <View style={styles.providerButtons}>
                        <TouchableOpacity
                          style={[
                            styles.providerButton,
                            { borderColor: colors.cardBorder },
                            cloudSettings.provider === 'gdrive' && { 
                              backgroundColor: colors.primary,
                              borderColor: colors.primary 
                            },
                          ]}
                          onPress={async () => {
                            const newSettings = { ...cloudSettings, provider: 'gdrive' as const };
                            setCloudSettings(newSettings);
                            await saveCloudSyncSettings(newSettings);
                          }}
                        >
                          <Text style={[
                            styles.providerButtonText,
                            { color: cloudSettings.provider === 'gdrive' ? '#FFFFFF' : colors.textSecondary },
                          ]}>
                            Google Drive
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.providerButton,
                            { borderColor: colors.cardBorder },
                            cloudSettings.provider === 'icloud' && { 
                              backgroundColor: colors.primary,
                              borderColor: colors.primary 
                            },
                          ]}
                          onPress={async () => {
                            const newSettings = { ...cloudSettings, provider: 'icloud' as const };
                            setCloudSettings(newSettings);
                            await saveCloudSyncSettings(newSettings);
                          }}
                        >
                          <Text style={[
                            styles.providerButtonText,
                            { color: cloudSettings.provider === 'icloud' ? '#FFFFFF' : colors.textSecondary },
                          ]}>
                            iCloud
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {cloudSettings.provider === 'gdrive' && (
                      <View style={[styles.googleAccountSection, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                        {cloudSettings.googleConnected ? (
                          <>
                            <View style={styles.googleAccountInfo}>
                              <View style={[styles.googleAccountAvatar, { backgroundColor: colors.primaryGlass }]}>  
                                <User size={32} color={colors.primary} />
                              </View>
                              <View style={styles.googleAccountDetails}>
                                <Text style={[styles.googleAccountName, { color: colors.text }]}>
                                  {cloudSettings.googleUserName || 'بەکارهێنەر'}
                                </Text>
                                <Text style={[styles.googleAccountEmail, { color: colors.textSecondary }]}>
                                  {cloudSettings.googleUserEmail}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity
                              style={[styles.googleDisconnectButton, { backgroundColor: colors.errorGlass, borderColor: colors.error }]}
                              onPress={handleDisconnectGoogle}
                            >
                              <Text style={[styles.googleDisconnectButtonText, { color: colors.error }]}>بڕینی پەیوەندی</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={[styles.googleConnectButton, { backgroundColor: '#4285F4' }]}
                            onPress={handleConnectGoogle}
                            disabled={isConnectingGoogle}
                          >
                            <Text style={styles.googleConnectButtonText}>
                              {isConnectingGoogle ? 'پەیوەست دەبێت...' : 'پەیوەست بکە بە Google Account'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    <View style={[styles.settingItem, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                      <View style={styles.settingLeft}>
                        <Text style={[styles.settingText, { color: colors.text }]}>هاوکاتی خۆکار</Text>
                      </View>
                      <Switch
                        value={cloudSettings.autoSync}
                        onValueChange={async (value) => {
                          const newSettings = { ...cloudSettings, autoSync: value };
                          setCloudSettings(newSettings);
                          await saveCloudSyncSettings(newSettings);
                        }}
                        trackColor={{ false: colors.cardBorder, true: colors.primary }}
                        thumbColor="#FFFFFF"
                      />
                    </View>

                    {process.env.EXPO_PUBLIC_RORK_API_BASE_URL && lastBackendSyncTime && (
                      <View style={[styles.lastSyncInfo, { backgroundColor: colors.primaryGlass }]}>
                        <Text style={[styles.lastSyncText, { color: colors.text }]}>
                          دوا هاوکاتکردنی Backend:
                        </Text>
                        <Text style={[styles.lastSyncText, { color: colors.textSecondary, fontSize: 12, marginTop: 4 }]}>
                          {new Date(lastBackendSyncTime).toLocaleString('ku', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    )}

                    {process.env.EXPO_PUBLIC_RORK_API_BASE_URL && pendingChanges > 0 && (
                      <View style={[styles.lastSyncInfo, { backgroundColor: colors.warningGlass }]}>
                        <Text style={[styles.lastSyncText, { color: colors.warning }]}>
                          ⚠️ {pendingChanges} گۆڕانکاری چاوەڕوانی هاوکاتکردنە
                        </Text>
                      </View>
                    )}

                    {cloudSettings.provider === 'gdrive' && cloudSettings.googleConnected && (
                      <View style={styles.driveActionsContainer}>
                        <TouchableOpacity
                          style={[styles.driveActionButton, { backgroundColor: colors.success }]}
                          onPress={async () => {
                            try {
                              const result = await uploadToCloud(debtors, 'gdrive');
                              if (result) {
                                Alert.alert('✅ سەرکەوتوو', 'زانیاریەکان بە سەرکەوتوویی بارکرا بۆ Google Drive');
                              } else {
                                Alert.alert('❌ هەڵە', 'هەڵە لە بارکردنی زانیاریەکان بۆ Google Drive');
                              }
                            } catch (error) {
                              console.error('Upload to Google Drive error:', error);
                              Alert.alert('❌ هەڵە', 'هەڵەیەک ڕوویدا لە بارکردن');
                            }
                          }}
                        >
                          <Upload size={20} color="#FFFFFF" />
                          <Text style={styles.driveActionButtonText}>هەڵگرتن لە Drive</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.driveActionButton, { backgroundColor: colors.primary }]}
                          onPress={async () => {
                            Alert.alert(
                              'گەڕاندنەوەی زانیاریەکان',
                              'ئایا دڵنیایت لە گەڕاندنەوەی زانیاریەکان لە Google Drive؟ ئەمە زانیاریە ناوخۆییەکان دەگۆڕێت.',
                              [
                                { text: 'نەخێر', style: 'cancel' },
                                {
                                  text: 'بەڵێ',
                                  onPress: async () => {
                                    try {
                                      const data = await downloadFromCloud('gdrive');
                                      if (data && data.length > 0) {
                                        const success = await importData(JSON.stringify({
                                          version: '1.0',
                                          timestamp: new Date().toISOString(),
                                          data: data,
                                        }));
                                        
                                        if (success) {
                                          Alert.alert('✅ سەرکەوتوو', `${data.length} قەرزدار لە Google Drive گەڕێنرایەوە`);
                                        } else {
                                          Alert.alert('❌ هەڵە', 'هەڵە لە گەڕاندنەوەی زانیاریەکان');
                                        }
                                      } else {
                                        Alert.alert('⚠️ ئاگادارکردنەوە', 'هیچ زانیارییەک لەسەر Google Drive نەدۆزرایەوە');
                                      }
                                    } catch (error) {
                                      console.error('Download from Google Drive error:', error);
                                      Alert.alert('❌ هەڵە', 'هەڵەیەک ڕوویدا لە گەڕاندنەوە');
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Download size={20} color="#FFFFFF" />
                          <Text style={styles.driveActionButtonText}>گەڕاندنەوە لە Drive</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {process.env.EXPO_PUBLIC_RORK_API_BASE_URL && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.syncButton,
                            { 
                              backgroundColor: syncStatus === 'syncing' ? colors.textSecondary : colors.primary,
                            },
                            syncStatus === 'syncing' && { opacity: 0.6 }
                          ]}
                          onPress={async () => {
                            if (syncStatus === 'syncing') return;
                            
                            try {
                              const result = await manualSyncToCloud();
                              
                              if (result.success) {
                                Alert.alert('✅ سەرکەوتوو', 'زانیاریەکان بە سەرکەوتوویی لەگەڵ Cloud هاوکات کران');
                              } else {
                                Alert.alert('❌ هەڵە', result.message || 'هەڵە لە هاوکاتکردن');
                              }
                            } catch (error) {
                              console.error('Manual sync error:', error);
                              Alert.alert('❌ هەڵە', 'هەڵەیەک ڕوویدا لە هاوکاتکردن');
                            }
                          }}
                          disabled={syncStatus === 'syncing'}
                        >
                          <Cloud size={20} color="#FFFFFF" />
                          <Text style={styles.syncButtonText}>
                            {syncStatus === 'syncing' ? '🔄 هاوکاتکردن...' : '☁️ هاوکاتکردنی Backend'}
                          </Text>
                        </TouchableOpacity>

                        <View style={[styles.lastSyncInfo, { backgroundColor: colors.cardGlass, borderWidth: 1, borderColor: colors.glassBorder }]}>
                          <Text style={[styles.lastSyncText, { color: colors.textSecondary, fontSize: 12 }]}>
                            💡 زانیاریەکان بە شێوەیەکی خۆکار هەر {cloudSettings.autoSync ? '30 چرکە' : 'پاش گۆڕانکاری'} لەگەڵ Backend هاوکات دەکرێن
                          </Text>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowCloudModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>داخستن</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAutoReminderModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAutoReminderModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAutoReminderModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>ئاگادارکردنەوەی هەفتانەی خۆکار</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                کڕیارانی قەرزدار بە شێوەیەکی ئۆتۆماتیکی ئاگادار دەکرێنەوە
              </Text>

              <View style={[styles.settingItem, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.settingLeft}>
                  <Bell size={24} color={colors.primary} />
                  <Text style={[styles.settingText, { color: colors.text }]}>چالاککردن</Text>
                </View>
                <Switch
                  value={autoReminderSettings.enabled}
                  onValueChange={handleToggleAutoReminder}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {autoReminderSettings.enabled && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>ڕۆژی هەفتە</Text>
                    <View style={styles.dayButtons}>
                      {[
                        { label: 'یەکشەممە', value: 0 },
                        { label: 'دووشەممە', value: 1 },
                        { label: 'سێشەممە', value: 2 },
                        { label: 'چوارشەممە', value: 3 },
                        { label: 'پێنجشەممە', value: 4 },
                        { label: 'هەینی', value: 5 },
                        { label: 'شەممە', value: 6 },
                      ].map((day) => (
                        <TouchableOpacity
                          key={day.value}
                          style={[
                            styles.dayButton,
                            { borderColor: colors.cardBorder },
                            autoReminderSettings.dayOfWeek === day.value && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                          onPress={() => setAutoReminderSettings({ ...autoReminderSettings, dayOfWeek: day.value })}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              { color: autoReminderSettings.dayOfWeek === day.value ? '#FFFFFF' : colors.textSecondary },
                            ]}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>کاتژمێر</Text>
                    <View style={styles.timeButtons}>
                      {[
                        '08:00', '09:00', '10:00', '11:00',
                        '12:00', '13:00', '14:00', '15:00',
                        '16:00', '17:00', '18:00', '19:00',
                      ].map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeButton,
                            { borderColor: colors.cardBorder },
                            autoReminderSettings.timeOfDay === time && {
                              backgroundColor: colors.primary,
                              borderColor: colors.primary,
                            },
                          ]}
                          onPress={() => setAutoReminderSettings({ ...autoReminderSettings, timeOfDay: time })}
                        >
                          <Text
                            style={[
                              styles.timeButtonText,
                              { color: autoReminderSettings.timeOfDay === time ? '#FFFFFF' : colors.textSecondary },
                            ]}
                          >
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                  onPress={() => setShowAutoReminderModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>

                {autoReminderSettings.enabled && (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.primary }]}
                    onPress={handleUpdateAutoReminderSchedule}
                  >
                    <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>پاشەکەوتکردن</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAutoLockModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAutoLockModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAutoLockModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalGradient}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>قوفڵکردنی خۆکاری قەرز</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                قەرزەکان دوای بەسەرچوونی ماوە و تێپەڕین لە بڕی دیاریکراو بە خۆکار قوفڵ دەکرێن و نەتوانرێت قەرزی نوێیان پێ زیاد بکرێت
              </Text>

              <View style={[styles.settingItem, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
                <View style={styles.settingLeft}>
                  <Lock size={24} color={colors.error} />
                  <Text style={[styles.settingText, { color: colors.text }]}>چالاککردن</Text>
                </View>
                <Switch
                  value={settings.autoLockOldDebts}
                  onValueChange={(value) => updateSettings({ autoLockOldDebts: value })}
                  trackColor={{ false: colors.cardBorder, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {settings.autoLockOldDebts && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>ژمارەی ڕۆژەکان</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.cardBorder,
                        color: colors.text 
                      }]}
                      value={autoLockDays}
                      onChangeText={setAutoLockDays}
                      placeholder="ژمارەی ڕۆژەکان..."
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      textAlign="right"
                    />
                    <Text style={[styles.modalSubtitle, { color: colors.textTertiary, marginTop: 8 }]}>
                      ماوە لە کاتی دوایین قەرز کۆدەکرێت، نەک لە کاتی دروستکردنی قەرزدار
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>بڕی پارە (بەلای کەمەوە)</Text>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.cardBorder,
                        color: colors.text 
                      }]}
                      value={autoLockAmount}
                      onChangeText={setAutoLockAmount}
                      placeholder="بڕی پارە..."
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      textAlign="right"
                    />
                    <Text style={[styles.modalSubtitle, { color: colors.textTertiary, marginTop: 8 }]}>
                      تەنها کەسانێک قوفڵ دەکرێن کە قەرزەکانیان لەم بڕە گەورەترە
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.warning, marginTop: 4, fontWeight: '600' }]}>
                      • بڕی 0 واتە هەموو قەرزەکان قوفڵ دەکرێن
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textTertiary, marginTop: 4 }]}>
                      نموونە: ئەگەر 100,000 بنووسیت، تەنها کەسانێک کە قەرزەکانیان زیاتر لە 100,000 بێت قوفڵ دەکرێن
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.cardBorder }]}
                  onPress={() => setShowAutoLockModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const days = parseInt(autoLockDays);
                    const amount = parseInt(autoLockAmount);
                    
                    if (isNaN(days) || days < 1) {
                      Alert.alert('هەڵە', 'تکایە ژمارەی ڕۆژەکان دروست داخڵ بکە');
                      return;
                    }
                    
                    if (isNaN(amount) || amount < 0) {
                      Alert.alert('هەڵە', 'تکایە بڕی پارە دروست داخڵ بکە');
                      return;
                    }
                    
                    updateSettings({ 
                      autoLockDaysThreshold: days,
                      autoLockAmountThreshold: amount 
                    });
                    setShowAutoLockModal(false);
                    
                    let message = `✅ سیستەمی قوفڵکردنی خۆکار چالاککرا\n\n`;
                    message += `📅 ماوە: ${days} ڕۆژ لە دوایین قەرزەوە\n`;
                    if (amount > 0) {
                      message += `💰 بڕ: زیاتر لە ${amount.toLocaleString('en-US')}\n`;
                    } else {
                      message += `💰 بڕ: هەموو بڕەکان\n`;
                    }
                    message += `\nقەرزداران کە ${days} ڕۆژ لە دوایین قەرزەکانیانەوە بەسەرچووبێت`;
                    if (amount > 0) {
                      message += ` و قەرزەکانیان زیاتر لە ${amount.toLocaleString('en-US')} بێت`;
                    }
                    message += '، بە خۆکار قوفڵ دەکرێن و نەتوانرێت قەرزی نوێیان پێ زیاد بکرێت.';
                    
                    Alert.alert('سیستەم چالاککرا', message);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>پاشەکەوتکردن</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    position: 'relative' as const,
  },
  chevronIcon: {
    position: 'absolute' as const,
    left: 16,
    top: '50%',
    marginTop: -10,
  },
  profileContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  roleBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  profilePhone: {
    fontSize: 14,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  settingItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
    overflow: 'hidden',
  },
  modalGradient: {
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
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
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  optionsModalContent: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionsModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  employeesSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    position: 'relative' as const,
  },
  employeesContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
  },
  employeesIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeesInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  employeesTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  employeesSubtitle: {
    fontSize: 14,
    textAlign: 'right',
  },
  employeesModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  employeesModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeModalButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 32,
    fontWeight: '300' as const,
  },
  employeesModalScroll: {
    maxHeight: 400,
    marginTop: 16,
  },
  emptyEmployeesContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyEmployeesText: {
    fontSize: 16,
    textAlign: 'center',
  },
  employeeItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  employeeItemInfo: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  employeeItemAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeeItemDetails: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  employeeItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  employeeItemPhone: {
    fontSize: 13,
    textAlign: 'right',
  },
  inactiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  employeeItemActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  employeeActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cloudModalContent: {
    gap: 16,
    marginBottom: 16,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  providerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  lastSyncInfo: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  lastSyncText: {
    fontSize: 13,
    textAlign: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  googleAccountSection: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  googleAccountInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  googleAccountAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleAccountDetails: {
    flex: 1,
    alignItems: 'flex-end',
  },
  googleAccountName: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  googleAccountEmail: {
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
  },
  googleConnectButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleConnectButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
  },
  googleDisconnectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  googleDisconnectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  dayButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  fontSizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fontSizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  fontSizeButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dateFormatButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  dateFormatButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateFormatButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  timeFormatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeFormatButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeFormatButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  infoCardContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  infoCardValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right',
    marginTop: 4,
  },
  driveActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  driveActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  driveActionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
