import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, Lock, Save, Edit2, Shield, ShieldCheck } from 'lucide-react-native';

export default function ProfileScreen() {
  const { currentUser, getCurrentMarket, syncUsers, users } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const currentMarket = getCurrentMarket();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isManager = currentUser?.role === 'manager';
  const isOwner = currentUser?.role === 'owner';
  const isEmployee = currentUser?.role === 'employee';

  const canEdit = isManager || isOwner;

  const handleSave = async () => {
    if (!currentUser) return;

    if (isEditing && canEdit) {
      if (!fullName.trim() && !isOwner) {
        Alert.alert('هەڵە', 'تکایە ناو بنووسە');
        return;
      }

      if (!phone.trim() && !isOwner) {
        Alert.alert('هەڵە', 'تکایە ژمارە تەلەفۆن بنووسە');
        return;
      }

      if (newPassword) {
        if (!currentPassword) {
          Alert.alert('هەڵە', 'تکایە ووشەی نهێنی ئێستا بنووسە');
          return;
        }

        if (currentPassword !== currentUser.password) {
          Alert.alert('هەڵە', 'ووشەی نهێنی ئێستا هەڵەیە');
          return;
        }

        if (newPassword !== confirmPassword) {
          Alert.alert('هەڵە', 'ووشەی نهێنی نوێ و دووبارەکردنەوەی یەکناگرنەوە');
          return;
        }

        if (newPassword.length < 4) {
          Alert.alert('هەڵە', 'ووشەی نهێنی دەبێت لانیکەم ٤ پیت بێت');
          return;
        }
      }

      try {
        if (!users || users.length === 0) {
          Alert.alert('هەڵە', 'هیچ هەژمارێک نەدۆزرایەوە');
          return;
        }

        const updatedUsers = users.map((u) => {
          if (u.id === currentUser.id) {
            const updatedFullName = fullName.trim() || u.fullName || '';
            const updatedPhone = phone.trim() || u.phone || '';
            const updatedUsername = phone.trim() || u.username || u.phone || '';
            const updatedPassword = newPassword || u.password || '';
            
            return {
              ...u,
              fullName: updatedFullName,
              phone: updatedPhone,
              username: updatedUsername,
              password: updatedPassword,
            };
          }
          return u;
        });

        const updatedCurrentUser = updatedUsers.find((u) => u.id === currentUser.id);
        if (!updatedCurrentUser) {
          Alert.alert('هەڵە', 'هەژمارەکە نەدۆزرایەوە');
          return;
        }

        syncUsers(updatedUsers);
        
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        
        const safeUser = {
          id: updatedCurrentUser.id,
          username: updatedCurrentUser.username,
          password: updatedCurrentUser.password,
          fullName: updatedCurrentUser.fullName,
          phone: updatedCurrentUser.phone,
          role: updatedCurrentUser.role,
          marketId: updatedCurrentUser.marketId,
        };
        
        const userString = JSON.stringify(safeUser);
        console.log('Saving updated current user:', userString);
        await AsyncStorage.setItem('current_user', userString);

        Alert.alert('سەرکەوتوو', 'زانیاریەکان بەسەرکەوتوویی نوێکرانەوە', [
          {
            text: 'باشە',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setIsEditing(false);
              setTimeout(() => {
                router.replace('/login' as any);
              }, 500);
            },
          },
        ]);
      } catch (error) {
        console.error('Error updating profile:', error);
        let errorMessage = 'هەڵەیەکی نەزانراو';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە نوێکردنەوەی زانیاریەکان: ' + errorMessage);
      }
    }
  };

  const handleCancel = () => {
    setFullName(currentUser?.fullName || '');
    setPhone(currentUser?.phone || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

  const getRoleLabel = () => {
    switch (currentUser?.role) {
      case 'owner':
        return 'خاوەندار';
      case 'manager':
        return 'بەڕێوەبەر';
      case 'employee':
        return 'کارمەند';
      case 'customer':
        return 'کڕیار';
      default:
        return '';
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
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { 
                backgroundColor: colors.cardGlass,
                borderColor: colors.glassBorder,
              }]}
            >
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>پڕۆفایل</Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.profileCard, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
              shadowColor: colors.shadowColor,
            }]}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.primaryGlass }]}>
                <User size={48} color={colors.primary} />
              </View>

              <View style={[styles.roleBadge, { 
                backgroundColor: isOwner 
                  ? 'rgba(251, 191, 36, 0.2)' 
                  : isManager 
                    ? colors.primaryGlass 
                    : colors.successGlass 
              }]}>
                <Shield size={16} color={isOwner ? '#FBBF24' : isManager ? colors.primary : colors.success} />
                <Text style={[styles.roleText, { 
                  color: isOwner ? '#FBBF24' : isManager ? colors.primary : colors.success 
                }]}>
                  {getRoleLabel()}
                </Text>
              </View>

              {!isEditing ? (
                <>
                  <View style={styles.infoSection}>
                    <View style={styles.infoItem}>
                      <View style={[styles.infoIcon, { backgroundColor: colors.primaryGlass }]}>
                        <User size={20} color={colors.primary} />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ناو</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {currentUser?.fullName || currentUser?.username || '-'}
                        </Text>
                      </View>
                    </View>

                    {currentUser?.phone && (
                      <View style={styles.infoItem}>
                        <View style={[styles.infoIcon, { backgroundColor: colors.primaryGlass }]}>
                          <Phone size={20} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ژمارە تەلەفۆن</Text>
                          <Text style={[styles.infoValue, { color: colors.text }]}>
                            {currentUser.phone}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.infoItem}>
                      <View style={[styles.infoIcon, { backgroundColor: colors.primaryGlass }]}>
                        <Lock size={20} color={colors.primary} />
                      </View>
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ژمارەی ناسنامە</Text>
                        <Text style={[styles.infoValue, { color: colors.text }]}>
                          {currentUser?.username || '-'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isManager && currentMarket && (
                    <TouchableOpacity
                      style={[styles.subscriptionStatusButton, { 
                        backgroundColor: colors.successGlass,
                        borderColor: colors.success,
                      }]}
                      onPress={() => {
                        const endDate = new Date(currentMarket.subscriptionEndDate);
                        const now = new Date();
                        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const isExpired = daysLeft < 0;
                        const isExpiringSoon = daysLeft < 7 && daysLeft >= 0;
                        
                        let statusEmoji = '✅';
                        let statusText = 'چالاک';
                        
                        if (isExpired) {
                          statusEmoji = '🚫';
                          statusText = 'بەسەرچووە';
                        } else if (isExpiringSoon) {
                          statusEmoji = '⚠️';
                          statusText = 'نزیکە بەسەر بچێت';
                        }
                        
                        const startDate = new Date(currentMarket.createdAt);
                        
                        Alert.alert(
                          'دۆخی مۆڵەتی مارکێت',
                          `ناوی مارکێت: ${currentMarket.name}\n\n` +
                          `${statusEmoji} دۆخ: ${statusText}\n\n` +
                          `📅 بەرواری چالاککردن: ${startDate.toLocaleDateString('en-GB')}\n\n` +
                          `📅 بەرواری کۆتایی: ${endDate.toLocaleDateString('en-GB')}\n\n` +
                          `⏰ ${isExpired ? 'بەسەرچووە' : `${daysLeft} ڕۆژ ماوە`}`,
                          [{ text: 'باشە', style: 'default' }]
                        );
                      }}
                    >
                      <ShieldCheck size={20} color={colors.success} />
                      <Text style={[styles.subscriptionStatusButtonText, { color: colors.success }]}>
                        دۆخی مۆڵەت
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canEdit && (
                    <TouchableOpacity
                      style={[styles.editButton, { 
                        backgroundColor: colors.primaryGlass,
                        borderColor: colors.primary,
                      }]}
                      onPress={() => setIsEditing(true)}
                    >
                      <Edit2 size={20} color={colors.primary} />
                      <Text style={[styles.editButtonText, { color: colors.primary }]}>
                        دەستکاریکردنی زانیاری
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isEmployee && (
                    <View style={[styles.noticeBox, { 
                      backgroundColor: colors.warningGlass,
                      borderColor: 'rgba(251, 191, 36, 0.3)',
                    }]}>
                      <Text style={[styles.noticeText, { color: colors.warning }]}>
                        تەنها بەڕێوەبەر دەتوانێت زانیاریەکانی کارمەندەکان دەستکاری بکات
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.formSection}>
                    {!isOwner && (
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ناوی تەواو</Text>
                        <TextInput
                          style={[styles.input, { 
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.cardBorder,
                            color: colors.text,
                          }]}
                          value={fullName}
                          onChangeText={setFullName}
                          placeholder="ناوی تەواو بنووسە..."
                          placeholderTextColor={colors.textTertiary}
                          textAlign="right"
                          selectTextOnFocus
                        />
                      </View>
                    )}

                    {!isOwner && (
                      <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ژمارە تەلەفۆن</Text>
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
                          selectTextOnFocus
                        />
                      </View>
                    )}

                    <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      گۆڕینی ووشەی نهێنی (ئارەزوومەندانە)
                    </Text>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ووشەی نهێنی ئێستا</Text>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                        }]}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="ووشەی نهێنی ئێستا بنووسە..."
                        placeholderTextColor={colors.textTertiary}
                        textAlign="right"
                        secureTextEntry
                        selectTextOnFocus
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ووشەی نهێنی نوێ</Text>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                        }]}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="ووشەی نهێنی نوێ بنووسە..."
                        placeholderTextColor={colors.textTertiary}
                        textAlign="right"
                        secureTextEntry
                        selectTextOnFocus
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>دووبارەکردنەوەی ووشەی نهێنی</Text>
                      <TextInput
                        style={[styles.input, { 
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.cardBorder,
                          color: colors.text,
                        }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="دووبارە ووشەی نهێنی نوێ بنووسەوە..."
                        placeholderTextColor={colors.textTertiary}
                        textAlign="right"
                        secureTextEntry
                        selectTextOnFocus
                      />
                    </View>
                  </View>

                  <View style={styles.buttonGroup}>
                    <TouchableOpacity
                      style={[styles.saveButton, { 
                        backgroundColor: colors.primaryGlass,
                        borderColor: colors.primary,
                      }]}
                      onPress={handleSave}
                    >
                      <Save size={20} color={colors.primary} />
                      <Text style={[styles.saveButtonText, { color: colors.primary }]}>
                        پاشەکەوتکردن
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cancelButton, { 
                        backgroundColor: colors.errorGlass,
                        borderColor: colors.error,
                      }]}
                      onPress={handleCancel}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                        پاشگەزبوونەوە
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  headerContent: {
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
    fontSize: 28,
    fontWeight: '700' as const,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoSection: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  subscriptionStatusButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 12,
  },
  subscriptionStatusButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  editButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  noticeBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
  },
  noticeText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  formSection: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500' as const,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 8,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cancelButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
