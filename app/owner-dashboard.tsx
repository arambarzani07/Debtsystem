import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { Check, X, Calendar, Store, Users, LogOut, Send, User, Power, ShieldCheck, Plus, Phone, Lock, Building2, UserCircle, Trash2 } from 'lucide-react-native';
import NotificationBell from '@/components/NotificationBell';
import type { MarketRequest } from '@/types';

export default function OwnerDashboardScreen() {
  const { getPendingRequests, approveMarketRequest, rejectMarketRequest, markets, extendMarketSubscription, reduceMarketSubscription, toggleMarketStatus, deleteMarket, logout, currentUser, isLoading, users, syncUsers, syncMarkets } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'requests' | 'markets'>('requests');
  const [subscriptionDays, setSubscriptionDays] = useState<{ [key: string]: string }>({});
  const [showCreateMarketModal, setShowCreateMarketModal] = useState(false);
  const [newMarketName, setNewMarketName] = useState('');
  const [newMarketPhone, setNewMarketPhone] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [newSubscriptionDays, setNewSubscriptionDays] = useState('30');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== 'owner')) {
      router.replace('/login' as any);
    }
  }, [currentUser, isLoading, router]);

  const pendingRequests = getPendingRequests();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!currentUser || currentUser.role !== 'owner') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.error }]}>
              دەسەڵاتت نییە
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleApprove = (requestId: string) => {
    const days = subscriptionDays[requestId];
    if (!days || isNaN(parseInt(days)) || parseInt(days) < 1) {
      Alert.alert('هەڵە', 'تکایە ژمارەی ڕۆژەکان دیاری بکە');
      return;
    }

    Alert.alert(
      'دڵنیابوونەوە',
      `ئایا دڵنیایت لە پەسەندکردنی ئەم داواکارییە بۆ ${days} ڕۆژ؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            const result = await approveMarketRequest(requestId, parseInt(days));
            if (result.success) {
              Alert.alert('سەرکەوتوو', result.message);
              setSubscriptionDays(prev => {
                const updated = { ...prev };
                delete updated[requestId];
                return updated;
              });
            } else {
              Alert.alert('هەڵە', result.message);
            }
          },
        },
      ]
    );
  };

  const handleReject = (requestId: string) => {
    Alert.alert(
      'دڵنیابوونەوە',
      'ئایا دڵنیایت لە ڕەتکردنەوەی ئەم داواکارییە؟',
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            const result = await rejectMarketRequest(requestId);
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

  const handleExtendSubscription = (marketId: string, marketName: string) => {
    Alert.alert(
      'درێژکردنەوەی مۆڵەت',
      `ژمارەی ڕۆژەکان بۆ ${marketName}`,
      [
        {
          text: '٣٠ ڕۆژ',
          onPress: async () => {
            const result = await extendMarketSubscription(marketId, 30);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        {
          text: '٩٠ ڕۆژ',
          onPress: async () => {
            const result = await extendMarketSubscription(marketId, 90);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        {
          text: '١٨٠ ڕۆژ',
          onPress: async () => {
            const result = await extendMarketSubscription(marketId, 180);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        {
          text: '٣٦٥ ڕۆژ',
          onPress: async () => {
            const result = await extendMarketSubscription(marketId, 365);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        { text: 'پاشگەز', style: 'cancel' },
      ]
    );
  };

  const handleReduceSubscription = (marketId: string, marketName: string) => {
    Alert.alert(
      'کەمکردنەوەی مۆڵەت',
      `ژمارەی ڕۆژەکان بۆ ${marketName}`,
      [
        {
          text: 'کەمکردنەوەی ٣٠ ڕۆژ',
          onPress: async () => {
            const result = await reduceMarketSubscription(marketId, 30);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        {
          text: 'کەمکردنەوەی ٩٠ ڕۆژ',
          onPress: async () => {
            const result = await reduceMarketSubscription(marketId, 90);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        {
          text: 'کەمکردنەوەی ١٨٠ ڕۆژ',
          onPress: async () => {
            const result = await reduceMarketSubscription(marketId, 180);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        {
          text: 'کەمکردنەوەی ٣٦٥ ڕۆژ',
          onPress: async () => {
            const result = await reduceMarketSubscription(marketId, 365);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
        { text: 'پاشگەز', style: 'cancel' },
      ]
    );
  };

  const handleToggleMarketStatus = (marketId: string, marketName: string, isActive: boolean) => {
    Alert.alert(
      'دڵنیابوونەوە',
      `ئایا دڵنیایت لە ${isActive ? 'ناچالاککردنی' : 'چالاککردنەوەی'} ${marketName}؟`,
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            const result = await toggleMarketStatus(marketId);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
      ]
    );
  };

  const handleDeleteMarket = (marketId: string, marketName: string) => {
    Alert.prompt(
      'سڕینەوەی مۆڵەت',
      `ئاگاداری گرنگ!\n\nسڕینەوەی مۆڵەتی "${marketName}" واتە:\n• سڕینەوەی هەموو زانیاریەکانی مارکێتەکە\n• سڕینەوەی هەموو بەڕێوەبەر و کارمەندەکان\n• سڕینەوەی هەموو قەرزدارەکان و مامەڵەکان\n\nئەم کارە ناگەڕێتەوە!\n\nتکایە ووشەی نهێنی بنووسە بۆ سڕینەوە:`,
      [
        { text: 'پاشگەز', style: 'cancel' },
        {
          text: 'سڕینەوە',
          style: 'destructive',
          onPress: async (password?: string) => {
            if (!password || password.trim() === '') {
              Alert.alert('هەڵە', 'تکایە ووشەی نهێنی بنووسە');
              return;
            }
            const result = await deleteMarket(marketId, password);
            Alert.alert(result.success ? 'سەرکەوتوو' : 'هەڵە', result.message);
          },
        },
      ],
      'secure-text'
    );
  };

  const handleCreateMarket = async () => {
    if (!newMarketName.trim() || !newMarketPhone.trim() || !newManagerName.trim() || !newManagerPassword.trim()) {
      Alert.alert('هەڵە', 'تکایە هەموو خانەکان پڕبکەرەوە');
      return;
    }

    if (newMarketPhone.length < 10) {
      Alert.alert('هەڵە', 'ژمارە تەلەفۆن دروست نییە');
      return;
    }

    if (newManagerPassword.length < 6) {
      Alert.alert('هەڵە', 'ووشەی نهێنی دەبێت لانیکەم ٦ نووسە بێت');
      return;
    }

    const days = parseInt(newSubscriptionDays);
    if (isNaN(days) || days < 1) {
      Alert.alert('هەڵە', 'تکایە ژمارەی ڕۆژەکان دیاری بکە');
      return;
    }

    setIsCreating(true);
    try {
      const marketId = Date.now().toString();
      const managerId = `manager-${marketId}`;

      const subscriptionEndDate = new Date();
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + days);

      const newMarket: any = {
        id: marketId,
        name: newMarketName,
        phone: newMarketPhone,
        managerId,
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        debtorsData: [],
      };

      const newManager: any = {
        id: managerId,
        username: newMarketPhone,
        password: newManagerPassword,
        role: 'manager',
        marketId,
        fullName: newManagerName,
        phone: newMarketPhone,
        createdAt: new Date().toISOString(),
      };

      const updatedMarkets = [...markets, newMarket];
      const updatedUsers = [...users, newManager];

      await AsyncStorage.setItem('markets_data', JSON.stringify(updatedMarkets));
      await AsyncStorage.setItem('users_data', JSON.stringify(updatedUsers));

      syncMarkets(updatedMarkets);
      syncUsers(updatedUsers);

      Alert.alert('سەرکەوتوو', 'مارکێتەکە بەسەرکەوتوویی دروستکرا');
      setShowCreateMarketModal(false);
      setNewMarketName('');
      setNewMarketPhone('');
      setNewManagerName('');
      setNewManagerPassword('');
      setNewSubscriptionDays('30');
    } catch (error) {
      console.error('Create market error:', error);
      Alert.alert('هەڵە', 'هەڵەیەک ڕوویدا');
    } finally {
      setIsCreating(false);
    }
  };

  const renderRequestItem = ({ item }: { item: MarketRequest }) => {
    const requestDate = new Date(item.createdAt).toLocaleDateString('en-GB');

    return (
      <View style={[styles.requestCard, { 
        backgroundColor: colors.cardGlass,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadowColor,
      }]}>
        <View style={styles.requestHeader}>
          <Text style={[styles.marketName, { color: colors.text }]}>{item.marketName}</Text>
          <Text style={[styles.requestDate, { color: colors.textTertiary }]}>{requestDate}</Text>
        </View>

        <View style={styles.requestInfo}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ژمارە تەلەفۆن:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{item.marketPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>ناوی بەڕێوەبەر:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{item.managerName}</Text>
          </View>
        </View>

        <View style={styles.subscriptionInput}>
          <Text style={[styles.subscriptionLabel, { color: colors.textSecondary }]}>
            ژمارەی ڕۆژەکان:
          </Text>
          <TextInput
            style={[styles.daysInput, { 
              backgroundColor: colors.inputBackground,
              borderColor: colors.cardBorder,
              color: colors.text,
            }]}
            value={subscriptionDays[item.id] || ''}
            onChangeText={(text) => setSubscriptionDays(prev => ({ ...prev, [item.id]: text }))}
            placeholder="٣٠"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            textAlign="center"
          />
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.approveButton, { 
              backgroundColor: colors.successGlass,
              borderColor: colors.success,
            }]}
            onPress={() => handleApprove(item.id)}
          >
            <Check size={18} color={colors.success} />
            <Text style={[styles.approveButtonText, { color: colors.success }]}>پەسەندکردن</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rejectButton, { 
              backgroundColor: colors.errorGlass,
              borderColor: colors.error,
            }]}
            onPress={() => handleReject(item.id)}
          >
            <X size={18} color={colors.error} />
            <Text style={[styles.rejectButtonText, { color: colors.error }]}>ڕەتکردنەوە</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMarketItem = ({ item }: { item: any }) => {
    const endDate = new Date(item.subscriptionEndDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysExpired = Math.abs(daysLeft);
    const isExpired = daysLeft < 0;
    
    let statusConfig = {
      emoji: '✓',
      label: 'چالاک',
      color: colors.success,
      bgColor: colors.successGlass,
      borderColor: colors.success,
      showProgress: true,
      warningLevel: 'none' as 'none' | 'low' | 'medium' | 'high' | 'critical',
    };
    
    if (!item.isActive) {
      statusConfig = {
        emoji: '✗',
        label: 'ناچالاک',
        color: colors.error,
        bgColor: colors.errorGlass,
        borderColor: colors.error,
        showProgress: false,
        warningLevel: 'critical',
      };
    } else if (isExpired) {
      if (daysExpired > 30) {
        statusConfig = {
          emoji: '🚫',
          label: `داخراو (${daysExpired} ڕۆژ بەسەرچووە)`,
          color: '#dc2626',
          bgColor: 'rgba(220, 38, 38, 0.15)',
          borderColor: '#dc2626',
          showProgress: false,
          warningLevel: 'critical',
        };
      } else if (daysExpired > 7) {
        statusConfig = {
          emoji: '⚠️',
          label: `بەسەرچووە (${daysExpired} ڕۆژ)`,
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: '#f59e0b',
          showProgress: false,
          warningLevel: 'high',
        };
      } else {
        statusConfig = {
          emoji: '⏰',
          label: `بەسەرچووە (${daysExpired} ڕۆژ)`,
          color: '#fbbf24',
          bgColor: 'rgba(251, 191, 36, 0.15)',
          borderColor: '#fbbf24',
          showProgress: false,
          warningLevel: 'medium',
        };
      }
    } else if (daysLeft <= 3) {
      statusConfig = {
        emoji: '🔴',
        label: `${daysLeft} ڕۆژ ماوە`,
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.15)',
        borderColor: '#ef4444',
        showProgress: true,
        warningLevel: 'high',
      };
    } else if (daysLeft <= 7) {
      statusConfig = {
        emoji: '⚡',
        label: `${daysLeft} ڕۆژ ماوە`,
        color: colors.warning,
        bgColor: colors.warningGlass || 'rgba(251, 191, 36, 0.15)',
        borderColor: colors.warning,
        showProgress: true,
        warningLevel: 'medium',
      };
    } else {
      statusConfig = {
        emoji: '✓',
        label: `${daysLeft} ڕۆژ ماوە`,
        color: colors.success,
        bgColor: colors.successGlass,
        borderColor: colors.success,
        showProgress: true,
        warningLevel: 'low',
      };
    }
    
    const totalDays = 365;
    const progressPercentage = isExpired ? 0 : Math.min(100, (daysLeft / totalDays) * 100);

    return (
      <View style={[styles.marketCard, { 
        backgroundColor: colors.cardGlass,
        borderColor: isExpired ? 'rgba(239, 68, 68, 0.4)' : colors.glassBorder,
        shadowColor: colors.shadowColor,
      }]}>
        <View style={styles.marketHeader}>
          <View style={styles.marketHeaderTop}>
            <Text style={[styles.marketName, { color: colors.text }]}>{item.name}</Text>
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: statusConfig.bgColor,
                borderWidth: 1.5,
                borderColor: statusConfig.borderColor,
              }
            ]}>
              <Text style={[styles.statusText, { color: statusConfig.color, fontSize: 13, fontWeight: '700' as const }]}>
                {statusConfig.emoji} {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.marketInfo}>
          <View style={[styles.infoCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📱 تەلەفۆن</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{item.phone}</Text>
            </View>
          </View>
          
          <View style={[styles.infoCard, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>📅 بەرواری کۆتایی</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(item.subscriptionEndDate).toLocaleDateString('ku', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          
          {statusConfig.showProgress && (
            <View style={[styles.progressCard, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: statusConfig.color, fontWeight: '600' as const }]}>⏰ ماوەی مۆڵەت</Text>
                <Text style={[styles.progressValue, { color: statusConfig.color, fontWeight: '700' as const, fontSize: 18 }]}>
                  {daysLeft} ڕۆژ
                </Text>
              </View>
              
              <View style={[styles.progressBarContainer, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: statusConfig.color,
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressPercentage, { color: statusConfig.color }]}>
                {progressPercentage.toFixed(1)}% لە ساڵێک
              </Text>
            </View>
          )}
          
          {isExpired && (
            <View style={[styles.warningCard, { 
              backgroundColor: statusConfig.bgColor,
              borderColor: statusConfig.borderColor,
              borderWidth: 2,
            }]}>
              <Text style={[styles.warningText, { color: statusConfig.color, fontWeight: '700' as const }]}>
                {statusConfig.emoji} مۆڵەت بەسەرچووە: {daysExpired} ڕۆژ لەمەوبەر
              </Text>
              {daysExpired <= 7 && (
                <Text style={[styles.warningSubtext, { color: statusConfig.color }]}>
                  مۆڵەتی ڕەحمەت - تکایە زوو مۆڵەت نوێ بکەرەوە
                </Text>
              )}
              {daysExpired > 7 && daysExpired <= 30 && (
                <Text style={[styles.warningSubtext, { color: statusConfig.color }]}>
                  تەنها بەڕێوەبەر دەتوانێت چالاکی بکاتەوە
                </Text>
              )}
              {daysExpired > 30 && (
                <Text style={[styles.warningSubtext, { color: statusConfig.color }]}>
                  مارکێت بە تەواوی داخراوە - پێویستە پەیوەندی بە خاوەندار بکەیت
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.marketActions}>
          <TouchableOpacity
            style={[styles.extendButton, { 
              backgroundColor: colors.primaryGlass,
              borderColor: colors.primary,
            }]}
            onPress={() => handleExtendSubscription(item.id, item.name)}
          >
            <Calendar size={16} color={colors.primary} />
            <Text style={[styles.extendButtonText, { color: colors.primary }]}>
              درێژکردنەوەی مۆڵەت
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reduceButton, { 
              backgroundColor: colors.warningGlass || 'rgba(245, 158, 11, 0.1)',
              borderColor: colors.warning || '#f59e0b',
            }]}
            onPress={() => handleReduceSubscription(item.id, item.name)}
          >
            <Calendar size={16} color={colors.warning || '#f59e0b'} />
            <Text style={[styles.reduceButtonText, { color: colors.warning || '#f59e0b' }]}>
              کەمکردنەوەی مۆڵەت
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, { 
              backgroundColor: item.isActive ? colors.errorGlass : colors.successGlass,
              borderColor: item.isActive ? colors.error : colors.success,
            }]}
            onPress={() => handleToggleMarketStatus(item.id, item.name, item.isActive)}
          >
            <Power size={16} color={item.isActive ? colors.error : colors.success} />
            <Text style={[styles.toggleButtonText, { color: item.isActive ? colors.error : colors.success }]}>
              {item.isActive ? 'ناچالاککردن' : 'چالاککردنەوە'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { 
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              borderColor: '#dc2626',
            }]}
            onPress={() => handleDeleteMarket(item.id, item.name)}
          >
            <Trash2 size={16} color="#dc2626" />
            <Text style={[styles.deleteButtonText, { color: '#dc2626' }]}>
              سڕینەوەی مۆڵەت
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.text }]}>پانێڵی خاوەندار</Text>
            <View style={styles.headerButtons}>
              <NotificationBell />
              <TouchableOpacity
                style={[styles.subscriptionButton, { 
                  backgroundColor: colors.successGlass,
                  borderColor: colors.success,
                }]}
                onPress={() => {
                  const totalMarkets = markets.length;
                  const activeMarkets = markets.filter(m => m.isActive).length;
                  const inactiveMarkets = totalMarkets - activeMarkets;
                  
                  const now = new Date();
                  const expiringMarkets = markets.filter(m => {
                    const endDate = new Date(m.subscriptionEndDate);
                    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return daysLeft < 7 && daysLeft >= 0;
                  }).length;
                  
                  const expiredMarkets = markets.filter(m => {
                    const endDate = new Date(m.subscriptionEndDate);
                    return endDate < now;
                  }).length;

                  Alert.alert(
                    'دۆخی مۆڵەتەکان',
                    `کۆی گشتی مارکێتەکان: ${totalMarkets}\n\n` +
                    `✅ چالاک: ${activeMarkets}\n` +
                    `❌ ناچالاک: ${inactiveMarkets}\n\n` +
                    `⚠️ نزیکە بەسەر بچێت: ${expiringMarkets}\n` +
                    `🚫 بەسەرچووە: ${expiredMarkets}`,
                    [{ text: 'باشە', style: 'default' }]
                  );
                }}
              >
                <ShieldCheck size={20} color={colors.success} />
                <Text style={[styles.subscriptionButtonText, { color: colors.success }]}>دۆخی مۆڵەت</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileButton, { 
                  backgroundColor: colors.primaryGlass,
                  borderColor: colors.primary,
                }]}
                onPress={() => router.push('/profile' as any)}
              >
                <User size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendNotificationButton, { 
                  backgroundColor: colors.primaryGlass,
                  borderColor: colors.primary,
                }]}
                onPress={() => router.push('/send-notifications-owner' as any)}
              >
                <Send size={18} color={colors.primary} />
                <Text style={[styles.sendNotificationText, { color: colors.primary }]}>ئاگادارکردنەوە</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutButton, { 
                  backgroundColor: colors.errorGlass,
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                }]}
                onPress={() => {
                  Alert.alert(
                    'چوونە دەرەوە',
                    'ئایا دڵنیایت لە چوونە دەرەوە؟',
                    [
                      { text: 'نەخێر', style: 'cancel' },
                      {
                        text: 'بەڵێ',
                        onPress: async () => {
                          await logout();
                          router.replace('/login' as any);
                        },
                      },
                    ]
                  );
                }}
              >
                <LogOut size={20} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>چوونە دەرەوە</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab, 
                { 
                  backgroundColor: selectedTab === 'requests' ? colors.primaryGlass : colors.card,
                  borderColor: selectedTab === 'requests' ? colors.primary : colors.cardBorder,
                }
              ]}
              onPress={() => setSelectedTab('requests')}
            >
              <Users size={20} color={selectedTab === 'requests' ? colors.primary : colors.textTertiary} />
              <Text style={[
                styles.tabText, 
                { color: selectedTab === 'requests' ? colors.primary : colors.textSecondary }
              ]}>
                داواکاریەکان ({pendingRequests.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab, 
                { 
                  backgroundColor: selectedTab === 'markets' ? colors.primaryGlass : colors.card,
                  borderColor: selectedTab === 'markets' ? colors.primary : colors.cardBorder,
                }
              ]}
              onPress={() => setSelectedTab('markets')}
            >
              <Store size={20} color={selectedTab === 'markets' ? colors.primary : colors.textTertiary} />
              <Text style={[
                styles.tabText, 
                { color: selectedTab === 'markets' ? colors.primary : colors.textSecondary }
              ]}>
                مارکێتەکان ({markets.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {selectedTab === 'requests' && !showCreateMarketModal ? (
          pendingRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={60} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ داواکارییەکی چاوەڕوان نییە
              </Text>
            </View>
          ) : (
            <FlatList
              data={pendingRequests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          )
        ) : selectedTab === 'markets' && !showCreateMarketModal ? (
          markets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Store size={60} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                هیچ مارکێتێک تۆمار نەکراوە
              </Text>
            </View>
          ) : (
            <FlatList
              data={markets}
              renderItem={renderMarketItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          )
        ) : null}

        {showCreateMarketModal && (
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}>
            <View style={[styles.modalContent, { 
              backgroundColor: colors.card,
              borderColor: colors.primary,
            }]}>
              <View style={[styles.modalHeader, { backgroundColor: colors.primaryGlass }]}>
                <Store size={32} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>دروستکردنی مارکێتی نوێ</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>تکایە زانیاریەکان بە وردی پڕبکەرەوە</Text>
              </View>
              
              <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ناوی مارکێت</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.cardBorder }]}>
                    <Building2 size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                      }]}
                      value={newMarketName}
                      onChangeText={setNewMarketName}
                      placeholder="بۆ نموونە: مارکێتی کارەبا"
                      placeholderTextColor={colors.textTertiary}
                      textAlign="right"
                      editable={!isCreating}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ژمارە تەلەفۆن</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.cardBorder }]}>
                    <Phone size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                      }]}
                      value={newMarketPhone}
                      onChangeText={setNewMarketPhone}
                      placeholder="07501234567"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="phone-pad"
                      textAlign="right"
                      editable={!isCreating}
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.sectionHeader}>
                  <UserCircle size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>زانیاری بەڕێوەبەر</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ناوی بەڕێوەبەر</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.cardBorder }]}>
                    <UserCircle size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                      }]}
                      value={newManagerName}
                      onChangeText={setNewManagerName}
                      placeholder="ناوی تەواو"
                      placeholderTextColor={colors.textTertiary}
                      textAlign="right"
                      editable={!isCreating}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ووشەی نهێنی</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.cardBorder }]}>
                    <Lock size={20} color={colors.textTertiary} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.modalInput, { 
                        backgroundColor: colors.inputBackground,
                        color: colors.text,
                      }]}
                      value={newManagerPassword}
                      onChangeText={setNewManagerPassword}
                      placeholder="لانیکەم ٦ نووسە"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry
                      textAlign="right"
                      editable={!isCreating}
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ژمارەی ڕۆژەکان</Text>
                  <View style={styles.daysSelector}>
                    {['30', '60', '90', '180', '365'].map((days) => (
                      <TouchableOpacity
                        key={days}
                        style={[styles.dayOption, {
                          backgroundColor: newSubscriptionDays === days ? colors.primaryGlass : colors.inputBackground,
                          borderColor: newSubscriptionDays === days ? colors.primary : colors.cardBorder,
                        }]}
                        onPress={() => setNewSubscriptionDays(days)}
                        disabled={isCreating}
                      >
                        <Text style={[styles.dayOptionText, {
                          color: newSubscriptionDays === days ? colors.primary : colors.textSecondary,
                          fontWeight: newSubscriptionDays === days ? '700' : '500',
                        }]}>{days}</Text>
                        <Text style={[styles.dayOptionLabel, {
                          color: newSubscriptionDays === days ? colors.primary : colors.textTertiary,
                        }]}>ڕۆژ</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { 
                    backgroundColor: colors.errorGlass,
                    borderColor: colors.error,
                  }]}
                  onPress={() => {
                    setShowCreateMarketModal(false);
                    setNewMarketName('');
                    setNewMarketPhone('');
                    setNewManagerName('');
                    setNewManagerPassword('');
                    setNewSubscriptionDays('30');
                  }}
                  disabled={isCreating}
                >
                  <X size={20} color={colors.error} />
                  <Text style={[styles.modalButtonText, { color: colors.error }]}>پاشگەز</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton, { 
                    backgroundColor: colors.primary,
                  }]}
                  onPress={handleCreateMarket}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={20} color="#FFFFFF" />
                      <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>دروستکردن</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {!showCreateMarketModal && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateMarketModal(true)}
          >
            <Plus size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
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
    flexDirection: 'column',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  subscriptionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  subscriptionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sendNotificationButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  sendNotificationText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  logoutButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  requestCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  marketCard: {
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  requestHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marketHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marketHeaderTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  marketName: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  requestDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  requestInfo: {
    marginBottom: 16,
    gap: 8,
  },
  marketInfo: {
    marginBottom: 16,
    gap: 8,
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  progressPercentage: {
    fontSize: 12,
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
  warningCard: {
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  warningText: {
    fontSize: 15,
    textAlign: 'center' as const,
  },
  warningSubtext: {
    fontSize: 13,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
  },
  progressValue: {
    fontSize: 15,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  subscriptionInput: {
    marginBottom: 16,
  },
  subscriptionLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'right',
  },
  daysInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  requestActions: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    borderWidth: 1,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
    borderWidth: 1,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  marketActions: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  extendButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  extendButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  reduceButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  reduceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  toggleButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  deleteButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  deleteButtonText: {
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
    overflow: 'hidden',
  },
  modalScrollView: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    gap: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalForm: {
    gap: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  inputGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'right',
    marginRight: 4,
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: {
    marginLeft: 8,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  daysSelector: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 65,
  },
  dayOptionText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  dayOptionLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row-reverse',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cancelButton: {
    borderWidth: 2,
  },
  createButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
