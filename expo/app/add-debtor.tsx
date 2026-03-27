import { useDebt } from '@/contexts/DebtContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import type { DebtorCategory, ColorTag } from '@/types';
import { COLOR_TAG_MAP, CATEGORY_COLORS, CATEGORY_LABELS } from '@/constants/colors';
import { getCurrentLocation, reverseGeocode } from '@/utils/gpsLocation';
import { MapPin } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMarket } from '@/contexts/MarketContext';

export default function AddDebtorScreen() {
  const params = useLocalSearchParams<{
    editMode?: string;
    debtorId?: string;
    name?: string;
    phone?: string;
    category?: string;
    colorTag?: string;
    interestRate?: string;
  }>();
  
  const isEditMode = params.editMode === 'true';
  const debtorId = params.debtorId as string;
  
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<DebtorCategory | undefined>();
  const [colorTag, setColorTag] = useState<ColorTag | undefined>();
  const [interestRate, setInterestRate] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [address, setAddress] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const { addDebtor, updateDebtor, getDebtor, debtors } = useDebt();
  const { addCustomer, users, syncUsers } = useAuth();
  const { setMarketDebtors, syncData } = useMarket();
  const router = useRouter();
  
  const handleCapture = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setLatitude(location.latitude);
        setLongitude(location.longitude);
        const addressResult = await reverseGeocode(location);
        if (addressResult) {
          setAddress(addressResult);
        }
        if (Platform.OS === 'web') {
          alert('شوێن بەسەرکەوتوویی گیرا');
        } else {
          Alert.alert('سەرکەوتوو', 'شوێن بەسەرکەوتوویی گیرا');
        }
      } else {
        if (Platform.OS === 'web') {
          alert('نەتوانرا شوێنی ئێستا بدۆزرێتەوە');
        } else {
          Alert.alert('هەڵە', 'نەتوانرا شوێنی ئێستا بدۆزرێتەوە');
        }
      }
    } catch (error) {
      console.error('Error capturing location:', error);
      if (Platform.OS === 'web') {
        alert('هەڵەیەک ڕوویدا لە گرتنی شوێن');
      } else {
        Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە گرتنی شوێن');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };
  
  useEffect(() => {
    if (isEditMode && debtorId) {
      try {
        const debtor = getDebtor(debtorId);
        if (debtor) {
          setName(debtor.name);
          setNameEn(debtor.nameEn || '');
          setPhone(debtor.phone || '');
          if (debtor.category) setCategory(debtor.category);
          if (debtor.colorTag) setColorTag(debtor.colorTag);
          if (debtor.interestRate) setInterestRate(debtor.interestRate.toString());
          if (debtor.latitude) setLatitude(debtor.latitude);
          if (debtor.longitude) setLongitude(debtor.longitude);
          if (debtor.address) setAddress(debtor.address);
        }
        
        if (Array.isArray(users) && users.length > 0) {
          const customerUser = users.find(u => u.debtorId === debtorId && u.role === 'customer');
          if (customerUser && customerUser.password) {
            setPassword(customerUser.password);
          }
        }
      } catch (error) {
        console.error('Error loading debtor data:', error);
      }
    }
  }, [isEditMode, debtorId, users, getDebtor]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە ناوی کڕیار بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە ناوی کڕیار بنووسە');
      }
      return;
    }

    if (!phone.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە ژمارە تەلەفۆن بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە ژمارە تەلەفۆن بنووسە');
      }
      return;
    }

    if (!password.trim() || password.trim().length < 4) {
      if (Platform.OS === 'web') {
        alert('تکایە ووشەی نهێنی بنووسە (لانیکەم ٤ پیت)');
      } else {
        Alert.alert('هەڵە', 'تکایە ووشەی نهێنی بنووسە (لانیکەم ٤ پیت)');
      }
      return;
    }

    const rate = interestRate.trim() ? parseFloat(interestRate) : undefined;
    if (interestRate.trim() && (isNaN(rate as number) || (rate as number) < 0)) {
      if (Platform.OS === 'web') {
        alert('تکایە ڕێژەی سوودی دروست بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە ڕێژەی سوودی دروست بنووسە');
      }
      return;
    }

    if (isEditMode && debtorId) {
      try {
        const updatedDebtor = debtors.find(d => d.id === debtorId);
        if (updatedDebtor) {
          const newDebtor = {
            ...updatedDebtor,
            name: name.trim(),
            nameEn: nameEn.trim() || undefined,
            phone: phone.trim() || undefined,
            category,
            colorTag,
            interestRate: rate,
            latitude,
            longitude,
            address: address.trim() || undefined,
          };
          updateDebtor(debtorId, {
            name: name.trim(),
            nameEn: nameEn.trim() || undefined,
            phone: phone.trim() || undefined,
            category,
            colorTag,
            interestRate: rate,
          });
          
          const updated = debtors.map(d => d.id === debtorId ? newDebtor : d);
          setMarketDebtors(updated);
          syncData(updated);
        }
        
        if (!users || users.length === 0) {
          if (Platform.OS === 'web') {
            alert('هیچ هەژمارێک نەدۆزرایەوە');
          } else {
            Alert.alert('هەڵە', 'هیچ هەژمارێک نەدۆزرایەوە');
          }
          return;
        }

        const updatedUsers = users.map((u) => {
          if (u.debtorId === debtorId && u.role === 'customer') {
            return {
              ...u,
              password: password.trim(),
            };
          }
          return u;
        });

        await AsyncStorage.setItem('users_data', JSON.stringify(updatedUsers));
        syncUsers(updatedUsers);
        
        if (Platform.OS === 'web') {
          alert('زانیاریەکانی کڕیار بەسەرکەوتوویی نوێکرایەوە');
        } else {
          Alert.alert('سەرکەوتوو', 'زانیاریەکانی کڕیار بەسەرکەوتوویی نوێکرایەوە');
        }
      } catch (error) {
        console.error('Error updating debtor:', error);
        if (Platform.OS === 'web') {
          alert('هەڵەیەک ڕوویدا لە نوێکردنەوەی زانیاریەکان');
        } else {
          Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا لە نوێکردنەوەی زانیاریەکان');
        }
        return;
      }
    } else {
      const newDebtorId = await addDebtor(name.trim(), phone.trim(), undefined, undefined, undefined, category, colorTag, rate, undefined, nameEn.trim() || undefined);
      
      if (latitude && longitude) {
        const debtor = getDebtor(newDebtorId);
        if (debtor) {
          const updatedDebtor = {
            ...debtor,
            latitude,
            longitude,
            address: address.trim() || undefined,
          };
          const updated = debtors.map(d => d.id === newDebtorId ? updatedDebtor : d);
          setMarketDebtors(updated);
          syncData(updated);
        }
      }
      
      const customerResult = await addCustomer(newDebtorId, phone.trim(), password.trim());
      
      if (!customerResult.success) {
        if (Platform.OS === 'web') {
          alert(customerResult.message);
        } else {
          Alert.alert('هەڵە', customerResult.message);
        }
        return;
      }

      if (Platform.OS === 'web') {
        alert('کڕیار بەسەرکەوتوویی زیادکرا');
      } else {
        Alert.alert('سەرکەوتوو', 'کڕیار بەسەرکەوتوویی زیادکرا');
      }
    }
    
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditMode ? 'دەستکاری کردنی زانیاریەکانی کڕیار' : 'کڕیاری نوێ',
          headerStyle: {
            backgroundColor: '#1E293B',
          },
          headerTintColor: '#F1F5F9',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ناو (کوردی) *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="ناوی کڕیار بە کوردی"
                placeholderTextColor="#64748B"
                autoFocus
                selectTextOnFocus={true}
                testID="name-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ناو (English) (دڵخواز)</Text>
              <TextInput
                style={styles.input}
                value={nameEn}
                onChangeText={setNameEn}
                placeholder="Customer name in English"
                placeholderTextColor="#64748B"
                selectTextOnFocus={true}
                testID="name-en-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ژمارە تەلەفۆن *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="ژمارەی تەلەفۆن"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                selectTextOnFocus={true}
                testID="phone-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ووشەی نهێنی *</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="ووشەی نهێنی (لانیکەم ٤ پیت)"
                placeholderTextColor="#64748B"
                secureTextEntry
                selectTextOnFocus={true}
                testID="password-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>پۆلێن (دڵخواز)</Text>
              <View style={styles.categoryButtons}>
                <TouchableOpacity
                  style={[styles.categoryButton, category === 'VIP' && styles.categoryButtonActive]}
                  onPress={() => setCategory(category === 'VIP' ? undefined : 'VIP')}
                >
                  <Text style={[styles.categoryButtonText, category === 'VIP' && { color: CATEGORY_COLORS.VIP }]}>
                    {CATEGORY_LABELS.VIP}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.categoryButton, category === 'Regular' && styles.categoryButtonActive]}
                  onPress={() => setCategory(category === 'Regular' ? undefined : 'Regular')}
                >
                  <Text style={[styles.categoryButtonText, category === 'Regular' && { color: CATEGORY_COLORS.Regular }]}>
                    {CATEGORY_LABELS.Regular}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.categoryButton, category === 'Wholesale' && styles.categoryButtonActive]}
                  onPress={() => setCategory(category === 'Wholesale' ? undefined : 'Wholesale')}
                >
                  <Text style={[styles.categoryButtonText, category === 'Wholesale' && { color: CATEGORY_COLORS.Wholesale }]}>
                    {CATEGORY_LABELS.Wholesale}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>رەنگی تایبەت (دڵخواز)</Text>
              <View style={styles.colorTagButtons}>
                {(Object.keys(COLOR_TAG_MAP) as ColorTag[]).map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorTagButton,
                      { backgroundColor: COLOR_TAG_MAP[color] + '33', borderColor: COLOR_TAG_MAP[color] },
                      colorTag === color && styles.colorTagButtonActive,
                    ]}
                    onPress={() => setColorTag(colorTag === color ? undefined : color)}
                  >
                    <View style={[styles.colorTagInner, { backgroundColor: COLOR_TAG_MAP[color] }]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ڕێژەی سوود % (دڵخواز)</Text>
              <TextInput
                style={styles.input}
                value={interestRate}
                onChangeText={setInterestRate}
                placeholder="بۆ نموونە: 5"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                selectTextOnFocus={true}
                testID="interest-rate-input"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>شوێنی کڕیار (دڵخواز)</Text>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={handleCapture}
                disabled={isLoadingLocation}
              >
                <LinearGradient
                  colors={latitude && longitude ? ['#22C55E', '#16A34A'] : ['#6366F1', '#4F46E5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.locationButtonGradient}
                >
                  {isLoadingLocation ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MapPin size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.locationButtonText}>
                    {latitude && longitude ? 'شوێن گیراوە ✓' : 'گرتنی شوێنی ئێستا'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              {address && (
                <Text style={styles.addressText}>{address}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              testID="submit-button"
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.submitButtonText}>{isEditMode ? 'پاشەکەوتکردن' : 'زیادکردن'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
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
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#F1F5F9',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F1F5F9',
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    textAlign: 'right',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  categoryButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    flexWrap: 'wrap',
  },
  categoryButton: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#60A5FA',
  },
  categoryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  colorTagButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorTagButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorTagButtonActive: {
    borderWidth: 3,
  },
  colorTagInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  locationButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationButtonGradient: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  addressText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
});
