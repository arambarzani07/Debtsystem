import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, User, Phone, Lock, Eye, EyeOff, Fingerprint, Check, ArrowLeft, UserPlus } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CustomerLoginScreen() {
  const router = useRouter();
  const auth = useAuth();
  const login = auth?.login;
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    checkBiometricAvailability();
    loadSavedCredentials();
  }, []);

  const checkBiometricAvailability = async () => {
    if (Platform.OS === 'web') return;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const loadSavedCredentials = async () => {
    try {
      const savedPhone = await AsyncStorage.getItem('customerSavedPhone');
      const savedRemember = await AsyncStorage.getItem('customerRememberMe');
      if (savedPhone && savedRemember) {
        const phone = JSON.parse(savedPhone);
        const remember = JSON.parse(savedRemember);
        if (remember === true) {
          setPhone(phone);
          setRememberMe(true);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length < 4) {
      setPasswordStrength(null);
    } else if (pwd.length < 6) {
      setPasswordStrength('weak');
    } else if (pwd.length < 8) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handleBiometricAuth = async () => {
    if (Platform.OS === 'web') return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'چوونەژوورەوە بە پەنجەنیشان',
        fallbackLabel: 'بەکارهێنانی ووشەی نهێنی',
      });
      
      if (result.success) {
        const savedPhone = await AsyncStorage.getItem('customerSavedPhone');
        const savedPassword = await AsyncStorage.getItem('customerSavedPassword');
        
        if (savedPhone && savedPassword) {
          const phone = JSON.parse(savedPhone);
          const password = JSON.parse(savedPassword);
          
          if (!phone || !password) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('هەڵە', 'زانیاری هەژمار هەڵەیە، تکایە دووبارە بچۆرە ژوورەوە');
            return;
          }

          if (!login) {
            Alert.alert('هەڵە', 'سیستەم ئامادە نییە');
            return;
          }
          setIsSubmitting(true);
          const loginResult = await login(phone, password);
          
          if (loginResult.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
              router.replace('/account-center' as any);
            }, 100);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('هەڵە', loginResult.message);
          }
          setIsSubmitting(false);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('هەڵە', 'هیچ زانیاریەکی هەژمار پاشەکەوت نەکراوە');
        }
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە پەنجەنیشان');
    }
  };

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('هەڵە', 'تکایە هەموو خانەکان پڕبکەرەوە');
      return;
    }

    if (!login) {
      Alert.alert('هەڵە', 'سیستەم ئامادە نییە، تکایە دووبارە هەوڵبدەرەوە');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);
    
    try {
      console.log('Customer login attempt:', phone);
      const result = await login(phone.trim(), password);
      console.log('Customer login result:', result);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (rememberMe) {
          await AsyncStorage.setItem('customerSavedPhone', JSON.stringify(phone.trim()));
          await AsyncStorage.setItem('customerSavedPassword', JSON.stringify(password));
          await AsyncStorage.setItem('customerRememberMe', JSON.stringify(true));
        } else {
          await AsyncStorage.removeItem('customerSavedPhone');
          await AsyncStorage.removeItem('customerSavedPassword');
          await AsyncStorage.removeItem('customerRememberMe');
        }
        
        setTimeout(() => {
          router.replace('/account-center' as any);
        }, 100);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('هەڵە', result.message || 'ژمارە تەلەفۆن یان ووشەی نهێنی هەڵەیە');
      }
    } catch (error) {
      console.error('Customer login error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا، تکایە دووبارە هەوڵبدەرەوە');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color="#60A5FA" />
              </TouchableOpacity>

              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <User size={60} color="#10B981" />
                </View>
                <Text style={styles.title}>چوونەژوورەوەی کڕیار</Text>
                <Text style={styles.subtitle}>دەسگەیشتن بە هەژمارەکەت</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Phone size={16} color="#CBD5E1" />
                    <Text style={styles.label}>ژمارە تەلەفۆن</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="ژمارە تەلەفۆن دابنێ"
                      placeholderTextColor="#64748B"
                      keyboardType="phone-pad"
                      textAlign="right"
                      editable={!isSubmitting}
                      onFocus={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Lock size={16} color="#CBD5E1" />
                    <Text style={styles.label}>ووشەی نهێنی</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowPassword(!showPassword);
                      }}
                    >
                      {showPassword ? (
                        <Eye size={20} color="#64748B" />
                      ) : (
                        <EyeOff size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.input, styles.inputWithIcon]}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        calculatePasswordStrength(text);
                      }}
                      placeholder="ووشەی نهێنی دابنێ"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showPassword}
                      textAlign="right"
                      editable={!isSubmitting}
                      onFocus={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    />
                  </View>
                  {passwordStrength && (
                    <View style={styles.passwordStrengthContainer}>
                      <View style={styles.strengthBars}>
                        <View style={[
                          styles.strengthBar,
                          passwordStrength === 'weak' && styles.strengthBarWeak,
                          (passwordStrength === 'medium' || passwordStrength === 'strong') && styles.strengthBarMedium,
                        ]} />
                        <View style={[
                          styles.strengthBar,
                          (passwordStrength === 'medium' || passwordStrength === 'strong') && styles.strengthBarMedium,
                        ]} />
                        <View style={[
                          styles.strengthBar,
                          passwordStrength === 'strong' && styles.strengthBarStrong,
                        ]} />
                      </View>
                      <Text style={[
                        styles.strengthText,
                        passwordStrength === 'weak' && styles.strengthTextWeak,
                        passwordStrength === 'medium' && styles.strengthTextMedium,
                        passwordStrength === 'strong' && styles.strengthTextStrong,
                      ]}>
                        {passwordStrength === 'weak' && 'لاواز'}
                        {passwordStrength === 'medium' && 'مامناوەند'}
                        {passwordStrength === 'strong' && 'بەهێز'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert(
                        'گەڕانەوەی ووشەی نهێنی',
                        'تکایە پەیوەندی بکە بە بەڕێوەبەر بۆ گەڕانەوەی ووشەی نهێنیەکەت',
                        [{ text: 'باشە', style: 'default' }]
                      );
                    }}
                  >
                    <Text style={styles.forgotPasswordText}>ووشەی نهێنیت لەبیرکردووە؟</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setRememberMe(!rememberMe);
                    }}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && <Check size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.rememberMeText}>بیرمهێنەوە</Text>
                  </TouchableOpacity>
                </View>

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <Pressable
                    style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isSubmitting}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669', '#047857']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.loginButtonGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <LogIn size={20} color="#FFFFFF" style={styles.buttonIcon} />
                          <Text style={styles.loginButtonText}>چوونەژوورەوە</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                {biometricAvailable && (
                  <TouchableOpacity
                    style={styles.biometricButton}
                    onPress={handleBiometricAuth}
                  >
                    <Fingerprint size={24} color="#10B981" />
                    <Text style={styles.biometricButtonText}>چوونەژوورەوە بە پەنجەنیشان</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>یان</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(
                    'تۆمارکردن',
                    'بۆ دروستکردنی هەژماری نوێ، تکایە پەیوەندی بکە بە بەڕێوەبەر',
                    [{ text: 'باشە', style: 'default' }]
                  );
                }}
              >
                <UserPlus size={20} color="#60A5FA" />
                <Text style={styles.signupButtonText}>هەژماری نوێ دروست بکە</Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  بۆ دەستگەیشتن بە هەژماری کڕیار، تکایە ژمارە تەلەفۆن و ووشەی نهێنیەکەت بنووسە کە لەلایەن بەڕێوەبەر پێدراوە.
                </Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerTitle}>سیستەمی بەڕێوەبردنی قەرز</Text>
                <Text style={styles.footerSubtitle}>بۆ پشتگیری پەیوەندی بکە بە بەڕێوەبەر</Text>
              </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    borderWidth: 2,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#CBD5E1',
    textAlign: 'right',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputWithIcon: {
    paddingLeft: 50,
  },
  eyeIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
    padding: 4,
  },
  passwordStrengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  strengthBarWeak: {
    backgroundColor: '#EF4444',
  },
  strengthBarMedium: {
    backgroundColor: '#F59E0B',
  },
  strengthBarStrong: {
    backgroundColor: '#10B981',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  strengthTextWeak: {
    color: '#EF4444',
  },
  strengthTextMedium: {
    color: '#F59E0B',
  },
  strengthTextStrong: {
    color: '#10B981',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500' as const,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  loginButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  biometricButtonText: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '600' as const,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600' as const,
  },
  footerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: '500' as const,
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    fontSize: 14,
    color: '#64748B',
    marginHorizontal: 16,
    fontWeight: '500' as const,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 2,
    borderColor: '#60A5FA',
    borderRadius: 16,
    marginBottom: 24,
  },
  signupButtonText: {
    fontSize: 15,
    color: '#60A5FA',
    fontWeight: '600' as const,
  },
});
