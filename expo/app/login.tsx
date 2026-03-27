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
  Modal,
  Dimensions,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, User, ShoppingBag, Info, X, CheckCircle2, Users, TrendingUp, Shield, Globe, Smartphone, Video, Phone, Lock, Eye, EyeOff, Fingerprint, Check, AlertCircle } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth();
  const login = auth?.login;
  const isLoading = auth?.isLoading ?? false;
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
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
      const savedPhone = await AsyncStorage.getItem('savedPhone');
      const savedRemember = await AsyncStorage.getItem('rememberMe');
      if (savedPhone && savedRemember) {
        let phone = savedPhone;
        let remember = savedRemember === 'true';
        
        try {
          phone = JSON.parse(savedPhone);
        } catch {
          phone = savedPhone;
        }
        
        try {
          remember = JSON.parse(savedRemember);
        } catch {
          remember = savedRemember === 'true';
        }
        
        if (remember === true) {
          setPhone(phone);
          setRememberMe(true);
        }
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
      await AsyncStorage.removeItem('savedPhone');
      await AsyncStorage.removeItem('savedPassword');
      await AsyncStorage.removeItem('rememberMe');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'چوونەژوورەوە بە پەنجەنیشان',
      fallbackLabel: 'بەکارهێنانی ووشەی نهێنی',
    });
    
    if (result.success) {
      try {
        const savedPhone = await AsyncStorage.getItem('savedPhone');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        if (savedPhone && savedPassword) {
          let phone = savedPhone;
          let password = savedPassword;
          
          try {
            phone = JSON.parse(savedPhone);
          } catch {
            phone = savedPhone;
          }
          
          try {
            password = JSON.parse(savedPassword);
          } catch {
            password = savedPassword;
          }
          
          setPhone(phone);
          setPassword(password);
          handleLogin();
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
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
      const result = await login(phone, password);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (rememberMe) {
          await AsyncStorage.setItem('savedPhone', JSON.stringify(phone));
          await AsyncStorage.setItem('savedPassword', JSON.stringify(password));
          await AsyncStorage.setItem('rememberMe', JSON.stringify(true));
        } else {
          await AsyncStorage.removeItem('savedPhone');
          await AsyncStorage.removeItem('savedPassword');
          await AsyncStorage.removeItem('rememberMe');
        }
        router.replace('/' as any);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('هەڵە', result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleResetPassword = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'گەڕانەوەی ووشەی نهێنی',
      'تکایە پەیوەندی بکە بە بەڕێوەبەر بۆ گەڕانەوەی ووشەی نهێنی\n\nژمارە: 07503713171',
      [{ text: 'باشە', onPress: () => setShowForgotPassword(false) }]
    );
  };

  const handleMarketRequest = () => {
    router.push('/market-request' as any);
  };

  const handleCustomerLogin = () => {
    router.push('/customer-login' as any);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

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
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <User size={60} color="#60A5FA" />
                </View>
                <Text style={styles.title}>چوونەژوورەوە</Text>
                <Text style={styles.subtitle}>سیستەمی بەڕێوەبردنی قەرز</Text>
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
                    style={styles.forgotPassword}
                    onPress={handleForgotPassword}
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
                      colors={['#3B82F6', '#2563EB', '#1D4ED8']}
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
                    <Fingerprint size={24} color="#60A5FA" />
                    <Text style={styles.biometricButtonText}>چوونەژوورەوە بە پەنجەنیشان</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>یان</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={styles.requestButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleMarketRequest();
                  }}
                  disabled={isSubmitting}
                >
                  <ShoppingBag size={20} color="#A78BFA" style={styles.requestButtonIcon} />
                  <Text style={styles.requestButtonText}>داواکاری مارکێتێکی نوێ</Text>
                </Pressable>

                <Pressable
                  style={styles.customerButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleCustomerLogin();
                  }}
                  disabled={isSubmitting}
                >
                  <User size={20} color="#10B981" style={styles.customerButtonIcon} />
                  <Text style={styles.customerButtonText}>چوونەژوورەوەی کڕیار</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.infoButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowInfoModal(true);
                }}
              >
                <Info size={20} color="#F59E0B" />
                <Text style={styles.infoButtonText}>دەربارەی سیستەم</Text>
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerTitle}>دامەزرێنەر و گەشەپێدەر</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://www.snapchat.com/add/aram.barzani00?share_id=pkYS7kncRlWbjo-x63sYPQ&locale=en_IQ')}
                >
                  <Text style={styles.footerName}>Aram A Barzani</Text>
                </TouchableOpacity>
                <Text style={styles.footerPhone}>07503713171</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={showForgotPassword}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.forgotPasswordModal}>
            <LinearGradient
              colors={['#1E293B', '#0F172A']}
              style={styles.forgotPasswordGradient}
            >
              <View style={styles.forgotPasswordHeader}>
                <AlertCircle size={48} color="#F59E0B" />
                <Text style={styles.forgotPasswordTitle}>گەڕانەوەی ووشەی نهێنی</Text>
              </View>
              
              <Text style={styles.forgotPasswordText}>
                بۆ گەڕانەوەی ووشەی نهێنی، تکایە پەیوەندی بکە بە بەڕێوەبەر
              </Text>
              
              <View style={styles.contactInfo}>
                <Phone size={20} color="#60A5FA" />
                <Text style={styles.contactNumber}>07503713171</Text>
              </View>

              <View style={styles.forgotPasswordButtons}>
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={handleResetPassword}
                >
                  <Text style={styles.forgotPasswordButtonText}>پەیوەندی بکە</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.forgotPasswordCancelButton}
                  onPress={() => setShowForgotPassword(false)}
                >
                  <Text style={styles.forgotPasswordCancelText}>پاشگەزبوونەوە</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1E293B', '#0F172A', '#1E293B']}
              style={styles.modalGradient}
            >
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <Info size={28} color="#F59E0B" />
                    <Text style={styles.modalTitle}>دەربارەی سیستەم</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowInfoModal(false)}
                  >
                    <X size={24} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                  <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.iconBox}>
                        <Globe size={24} color="#60A5FA" />
                      </View>
                      <Text style={styles.sectionTitle}>پێناسەی سیستەم</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                      سیستەمێکی پێشکەوتوو و ئۆنلاین بۆ بەڕێوەبردنی قەرز و قەرزاران بە شێوەیەکی ئاسان و کارا. بە بەکارهێنانی ئەم سیستەمە دەتوانیت هەموو مامەلە و قەرزەکانی خۆت بە شێوەیەکی یاسایی و ڕێکوپێک بەڕێوەببەیت.
                    </Text>
                  </View>

                  <View style={styles.dividerLine2} />

                  <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.iconBox}>
                        <CheckCircle2 size={24} color="#10B981" />
                      </View>
                      <Text style={styles.sectionTitle}>تایبەتمەندییە سەرەکییەکان</Text>
                    </View>
                    <View style={styles.featuresList}>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>بەڕێوەبردنی تەواوی کڕیار و قەرزەکان</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>سیستەمی چەند بەکارهێنەر و مۆڵەتەکان</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>سکانی QR کۆد و دەستگەیشتنی خێرا</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>ئاگاداری و یادەوەری خودکار</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>ڕاپۆرت و ئامارە پێشکەوتووەکان</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>هەناردە و هاوردە و پاشەکەوتی خودکار</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>ئاسایشی بەهێز و ناسینەوەی سەرەتایی</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>وەسڵی فەرمی و پڕۆفیشناڵ</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>گەڕان و پاڵاوتنی پێشکەوتوو</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>مێژووی تەواوی گۆڕانکارییەکان</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>خشتەی پارەدان و ئاگادارییەکانی</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>یەکخستنی WhatsApp و Telegram</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>AI چات و شیکاری قەرز</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>هاوردەی خودکار بۆ Telegram</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <View style={styles.featureBullet} />
                        <Text style={styles.featureText}>ڕاپۆرتی وردەکاری و دیاگرامەکان</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.dividerLine2} />

                  <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.iconBox}>
                        <Users size={24} color="#8B5CF6" />
                      </View>
                      <Text style={styles.sectionTitle}>پێکهاتەی سیستەم</Text>
                    </View>
                    <View style={styles.structureList}>
                      <View style={styles.structureItem}>
                        <View style={styles.structureNumber}>
                          <Text style={styles.structureNumberText}>1</Text>
                        </View>
                        <View style={styles.structureContent}>
                          <Text style={styles.structureTitle}>خاوەنی مارکێت</Text>
                          <Text style={styles.structureDesc}>دەستگەیشتنی تەواو بۆ هەموو سیستەمەکە</Text>
                        </View>
                      </View>
                      <View style={styles.structureItem}>
                        <View style={styles.structureNumber}>
                          <Text style={styles.structureNumberText}>2</Text>
                        </View>
                        <View style={styles.structureContent}>
                          <Text style={styles.structureTitle}>کارمەندان</Text>
                          <Text style={styles.structureDesc}>بەڕێوەبردنی قەرزەکان و مامەلەکان</Text>
                        </View>
                      </View>
                      <View style={styles.structureItem}>
                        <View style={styles.structureNumber}>
                          <Text style={styles.structureNumberText}>3</Text>
                        </View>
                        <View style={styles.structureContent}>
                          <Text style={styles.structureTitle}>کڕیاران</Text>
                          <Text style={styles.structureDesc}>بینینی قەرز و مێژووی مامەلەکان</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.dividerLine2} />

                  <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.iconBox}>
                        <Smartphone size={24} color="#EC4899" />
                      </View>
                      <Text style={styles.sectionTitle}>چۆنیەتی بەکارهێنان</Text>
                    </View>
                    <View style={styles.stepsList}>
                      <View style={styles.stepItem}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>یەکەم</Text>
                        </View>
                        <Text style={styles.stepText}>داواکاری مارکێت بکە لە خوارەوە</Text>
                      </View>
                      <View style={styles.stepItem}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>دووەم</Text>
                        </View>
                        <Text style={styles.stepText}>چاوەڕوانی پەسەندکردن بکە</Text>
                      </View>
                      <View style={styles.stepItem}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>سێیەم</Text>
                        </View>
                        <Text style={styles.stepText}>ژمارە تەلەفۆن و ووشەی نهێنی وەربگرە</Text>
                      </View>
                      <View style={styles.stepItem}>
                        <View style={styles.stepBadge}>
                          <Text style={styles.stepBadgeText}>چوارەم</Text>
                        </View>
                        <Text style={styles.stepText}>بچۆ ژوورەوە و دەست بە کار بکە</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.dividerLine2} />

                  <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.iconBox}>
                        <Video size={24} color="#EF4444" />
                      </View>
                      <Text style={styles.sectionTitle}>ڤیدیۆی فێرکاری</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                      بۆ فێربوونی چۆنیەتی بەکارهێنانی سیستەمەکە، سەردانی پەیجی تیکتۆکمان بکە و ڤیدیۆکانی فێرکاری تەماشا بکە.
                    </Text>
                    <TouchableOpacity
                      style={styles.tutorialButton}
                      onPress={() => Linking.openURL('https://www.tiktok.com/@kanichnarr?_t=ZS-90sXnANBIkH&_r=1')}
                    >
                      <Video size={20} color="#FFFFFF" />
                      <Text style={styles.tutorialButtonText}>تەماشاکردنی ڤیدیۆی فێرکاری</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dividerLine2} />

                  <View style={styles.infoSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.iconBox}>
                        <Shield size={24} color="#F59E0B" />
                      </View>
                      <Text style={styles.sectionTitle}>پاراستن و دڵنیایی</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                      سیستەمەکە بە تەکنەلۆژیای پێشکەوتووی پاراستن دروستکراوە. هەموو داتاکانت بە شێوەیەکی سەلامەت هەڵدەگیردرێن و باکئەپی ئۆتۆماتیک ئەنجام دەدرێت.
                    </Text>
                  </View>

                  <View style={styles.highlightBox}>
                    <TrendingUp size={32} color="#10B981" />
                    <Text style={styles.highlightTitle}>دەست پێ بکە ئێستا!</Text>
                    <Text style={styles.highlightText}>
                      داواکاری مارکێتی نوێ بکە و سوود لە تایبەتمەندیە پێشکەوتووەکان ببینە
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </LinearGradient>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#60A5FA',
    shadowColor: '#3B82F6',
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
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500' as const,
  },
  forgotPassword: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
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
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 2,
    borderColor: '#60A5FA',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  biometricButtonText: {
    fontSize: 15,
    color: '#60A5FA',
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
  divider: {
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
    marginHorizontal: 12,
    color: '#64748B',
    fontSize: 14,
  },
  requestButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  requestButtonIcon: {
    marginLeft: 8,
  },
  requestButtonText: {
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerName: {
    fontSize: 16,
    color: '#60A5FA',
    fontWeight: '600' as const,
    textAlign: 'center',
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  footerPhone: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  customerButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  customerButtonIcon: {
    marginLeft: 8,
  },
  customerButtonText: {
    color: '#34D399',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  infoButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  infoButtonText: {
    color: '#FCD34D',
    fontSize: 15,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: Dimensions.get('window').height * 0.92,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginRight: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    gap: 0,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F1F5F9',
  },
  sectionDescription: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 24,
    textAlign: 'right',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  featureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginLeft: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#E2E8F0',
    flex: 1,
  },
  structureList: {
    gap: 12,
  },
  structureItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  structureNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  structureNumberText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  structureContent: {
    flex: 1,
  },
  structureTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginBottom: 4,
    textAlign: 'right',
  },
  structureDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'right',
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 14,
    borderRadius: 10,
    borderRightWidth: 4,
    borderRightColor: '#EC4899',
  },
  stepBadge: {
    backgroundColor: '#EC4899',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 15,
    color: '#E2E8F0',
    flex: 1,
    textAlign: 'right',
  },
  dividerLine2: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 20,
  },
  highlightBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  highlightTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#10B981',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  highlightText: {
    fontSize: 15,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 22,
  },
  tutorialButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tutorialButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  forgotPasswordModal: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  forgotPasswordGradient: {
    padding: 28,
  },
  forgotPasswordHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    marginTop: 16,
    textAlign: 'center',
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  contactNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#60A5FA',
  },
  forgotPasswordButtons: {
    gap: 12,
  },
  forgotPasswordButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  forgotPasswordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  forgotPasswordCancelButton: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  forgotPasswordCancelText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
