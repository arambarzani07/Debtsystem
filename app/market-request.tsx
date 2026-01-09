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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Store, ArrowLeft, Sparkles, CheckCircle2, Shield } from 'lucide-react-native';

export default function MarketRequestScreen() {
  const router = useRouter();
  const { submitMarketRequest } = useAuth();
  const [marketName, setMarketName] = useState('');
  const [marketPhone, setMarketPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!marketName.trim() || !marketPhone.trim() || !managerName.trim() || !managerPassword.trim()) {
      Alert.alert('هەڵە', 'تکایە هەموو خانەکان پڕبکەرەوە');
      return;
    }

    if (marketPhone.length < 10) {
      Alert.alert('هەڵە', 'ژمارە تەلەفۆن دروست نییە');
      return;
    }

    if (managerPassword.length < 6) {
      Alert.alert('هەڵە', 'ووشەی نهێنی دەبێت لانیکەم ٦ نووسە بێت');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitMarketRequest(marketName, marketPhone, managerName, managerPassword);
      if (result.success) {
        Alert.alert(
          'سەرکەوتوو بوو',
          'داواکارییەکەت بەسەرکەوتوویی نێردرا. تکایە چاوەڕوانی پەسەندکردنی خاوەندار بە',
          [
            {
              text: 'باشە',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('هەڵە', result.message);
      }
    } catch (error) {
      console.error('Submit request error:', error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا، تکایە دووبارە هەوڵبدەرەوە');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E27', '#1A1F3A', '#2D1B4E', '#1A1F3A']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.decorativeCircle1} />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['rgba(124, 58, 237, 0.2)', 'rgba(59, 130, 246, 0.2)']}
                    style={styles.backButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <ArrowLeft size={22} color="#A78BFA" />
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.iconWrapper}>
                  <LinearGradient
                    colors={['#7C3AED', '#EC4899', '#F59E0B']}
                    style={styles.iconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Store size={48} color="#FFFFFF" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={styles.sparkleContainer}>
                    <Sparkles size={20} color="#FBBF24" fill="#FBBF24" />
                  </View>
                </View>
                
                <Text style={styles.title}>سیستەمی بەڕێوەبردنی قەرز</Text>
                <Text style={styles.titleGradient}>مارکێتی چنار</Text>
                <Text style={styles.subtitle}>
                  زانیاریەکانی خوارەوە پڕبکەرەوە بۆ دروستکردنی هەژماری مارکێتەکەت
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ناوی مارکێت</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={marketName}
                      onChangeText={setMarketName}
                      placeholder="بۆ نموونە: مارکێتی کارەبا"
                      placeholderTextColor="#64748B"
                      textAlign="right"
                      editable={!isSubmitting}
                    />
                    <View style={styles.inputBorder} />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ژمارە تەلەفۆنی مارکێت</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={marketPhone}
                      onChangeText={setMarketPhone}
                      placeholder="07501234567"
                      placeholderTextColor="#64748B"
                      keyboardType="phone-pad"
                      textAlign="right"
                      editable={!isSubmitting}
                    />
                    <View style={styles.inputBorder} />
                  </View>
                  <Text style={styles.hint}>
                    ئەم ژمارەیە دەبێتە ناوی بەکارهێنەری بەڕێوەبەر
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ناوی بەڕێوەبەر</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={managerName}
                      onChangeText={setManagerName}
                      placeholder="ناوی تەواوی بەڕێوەبەر"
                      placeholderTextColor="#64748B"
                      textAlign="right"
                      editable={!isSubmitting}
                    />
                    <View style={styles.inputBorder} />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ووشەی نهێنی</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={managerPassword}
                      onChangeText={setManagerPassword}
                      placeholder="لانیکەم ٦ نووسە"
                      placeholderTextColor="#64748B"
                      secureTextEntry
                      textAlign="right"
                      editable={!isSubmitting}
                    />
                    <View style={styles.inputBorder} />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#EC4899', '#F59E0B']}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View style={styles.submitButtonContent}>
                        <Text style={styles.submitButtonText}>ناردنی داواکاری</Text>
                        <Sparkles size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <CheckCircle2 size={20} color="#10B981" />
                    </View>
                    <Text style={styles.featureText}>پەسەندکردنی خێرا</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Shield size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.featureText}>پارێزراوی تەواو</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Store size={20} color="#EC4899" />
                    </View>
                    <Text style={styles.featureText}>بەڕێوەبردنی ئاسان</Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <LinearGradient
                    colors={['rgba(124, 58, 237, 0.15)', 'rgba(236, 72, 153, 0.15)']}
                    style={styles.infoBoxGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.infoHeader}>
                      <Sparkles size={18} color="#A78BFA" />
                      <Text style={styles.infoTitle}>تێبینی گرنگ</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <Text style={styles.infoText}>
                      • داواکارییەکەت دەنێردرێت بۆ لای خاوەندار
                    </Text>
                    <Text style={styles.infoText}>
                      • دوای پەسەندکردن، دەتوانیت بە ژمارە تەلەفۆن و ووشەی نهێنی بچیتە ژوورەوە
                    </Text>
                    <Text style={styles.infoText}>
                      • خاوەندار دیاری دەکات کە چەند ڕۆژ دەتوانیت خزمەتگوزاریەکە بەکاربهێنیت
                    </Text>
                  </LinearGradient>
                </View>
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
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    top: -100,
    right: -100,
    opacity: 0.6,
  },

  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 36,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    overflow: 'hidden',
    borderRadius: 12,
  },
  backButtonGradient: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#CBD5E1',
    marginBottom: 4,
    textAlign: 'center',
  },
  titleGradient: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(124, 58, 237, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#E2E8F0',
    marginBottom: 10,
    textAlign: 'right',
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#F1F5F9',
  },
  inputBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(124, 58, 237, 0.5)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'right',
    fontStyle: 'italic' as const,
  },
  submitButton: {
    borderRadius: 16,
    marginTop: 12,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 28,
    marginBottom: 8,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  featureText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  infoBox: {
    borderRadius: 20,
    marginTop: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  infoBoxGradient: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(167, 139, 250, 0.3)',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#A78BFA',
  },
  infoText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'right',
  },
});
