import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useDebt } from '@/contexts/DebtContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, SkipForward, CheckCircle, XCircle, TrendingUp, Users, PhoneCall, PhoneMissed, PhoneForwarded, ArrowLeft, Settings as SettingsIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CallLog {
  debtorId: string;
  debtorName: string;
  phoneNumber: string;
  callTime: string;
  status: 'answered' | 'no_answer' | 'busy' | 'skipped' | 'successful_promise' | 'refused';
  notes?: string;
  promisedAmount?: number;
  promisedDate?: string;
}

interface Campaign {
  id: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  targetDebtors: string[];
  callLogs: CallLog[];
  status: 'active' | 'paused' | 'completed';
  script: string;
  filterCriteria: {
    minDebt?: number;
    maxDebt?: number;
    category?: string;
    hasPhone?: boolean;
  };
}

export default function AutoDialCollectionScreen() {
  const { debtors } = useDebt();
  const { language } = useLanguage();
  const { settings } = useTheme();
  const isDark = settings.theme === 'dark';

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [currentDebtorIndex, setCurrentDebtorIndex] = useState(0);
  const [isDialing, setIsDialing] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [minDebt, setMinDebt] = useState('');
  const [maxDebt, setMaxDebt] = useState('');
  const [callScript, setCallScript] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const translations = {
    ku: {
      title: 'پێوانەی خۆکار',
      subtitle: 'سیستەمی پەیوەندی خۆکار بە قەرزدارەکان',
      createCampaign: 'کامپەینی نوێ',
      campaignName: 'ناوی کامپەین',
      filterOptions: 'فلتەرکردن',
      minDebt: 'کەمترین بڕی قەرز',
      maxDebt: 'زۆرترین بڕی قەرز',
      category: 'جۆر',
      all: 'هەموو',
      vip: 'VIP',
      regular: 'ئاسایی',
      wholesale: 'کۆمەڵایەتی',
      callScript: 'سکریپتی پەیوەندی',
      scriptPlaceholder: 'چی دەڵێیت بە قەرزدارەکە؟\n\nنموونە: سڵاو، من لە [ناوی بازرگانی]. ئەمەوێت پێت بڵێم کە قەرزێکت هەیە بە بڕی [بڕ]. دەتوانیت کەی پارەکە بدەیتەوە؟',
      startCampaign: 'دەستپێکردنی کامپەین',
      targetDebtors: 'قەرزداری هەڵبژێردراو',
      noCampaign: 'هیچ کامپەینێک نییە',
      createFirst: 'یەکەم کامپەین دروست بکە',
      activeCampaign: 'کامپەینی چالاک',
      pause: 'وەستاندن',
      resume: 'درێژەپێدان',
      nextCall: 'پەیوەندی دواتر',
      currentDebtor: 'قەرزداری ئێستا',
      totalDebt: 'کۆی قەرز',
      phoneNumber: 'ژمارەی تەلەفۆن',
      callNow: 'پەیوەندی بکە',
      markAs: 'وەک نیشان بکە',
      answered: 'وەڵامی دایەوە',
      noAnswer: 'وەڵامی نەدایەوە',
      busy: 'خەریکە',
      skip: 'تێپەڕاندن',
      successfulPromise: 'بەڵێنی دا',
      refused: 'ڕەتیکردەوە',
      addNotes: 'تێبینی زیادبکە',
      notesPlaceholder: 'تێبینی دەربارەی پەیوەندیەکە...',
      save: 'پاشەکەوتکردن',
      statistics: 'ئامار',
      totalCalls: 'کۆی پەیوەندییەکان',
      answered_stat: 'وەڵامدراوە',
      noAnswer_stat: 'وەڵام نەدراوە',
      promises: 'بەڵێنەکان',
      successRate: 'ڕێژەی سەرکەوتن',
      completedCampaigns: 'کامپەینی تەواوبوو',
      viewDetails: 'بینینی وردەکاری',
      completeCampaign: 'تەواوکردنی کامپەین',
      noPhone: 'ژمارەی تەلەفۆن نییە',
      progress: 'پێشکەوتن',
      of: 'لە',
    },
    en: {
      title: 'Auto Dial',
      subtitle: 'Automatic debt collection calling system',
      createCampaign: 'New Campaign',
      campaignName: 'Campaign Name',
      filterOptions: 'Filter Options',
      minDebt: 'Minimum Debt',
      maxDebt: 'Maximum Debt',
      category: 'Category',
      all: 'All',
      vip: 'VIP',
      regular: 'Regular',
      wholesale: 'Wholesale',
      callScript: 'Call Script',
      scriptPlaceholder: 'What to say to the debtor?\n\nExample: Hello, this is [Business Name]. I wanted to remind you about your outstanding balance of [Amount]. When can you make a payment?',
      startCampaign: 'Start Campaign',
      targetDebtors: 'Target Debtors',
      noCampaign: 'No campaigns',
      createFirst: 'Create your first campaign',
      activeCampaign: 'Active Campaign',
      pause: 'Pause',
      resume: 'Resume',
      nextCall: 'Next Call',
      currentDebtor: 'Current Debtor',
      totalDebt: 'Total Debt',
      phoneNumber: 'Phone Number',
      callNow: 'Call Now',
      markAs: 'Mark As',
      answered: 'Answered',
      noAnswer: 'No Answer',
      busy: 'Busy',
      skip: 'Skip',
      successfulPromise: 'Made Promise',
      refused: 'Refused',
      addNotes: 'Add Notes',
      notesPlaceholder: 'Notes about the call...',
      save: 'Save',
      statistics: 'Statistics',
      totalCalls: 'Total Calls',
      answered_stat: 'Answered',
      noAnswer_stat: 'No Answer',
      promises: 'Promises',
      successRate: 'Success Rate',
      completedCampaigns: 'Completed Campaigns',
      viewDetails: 'View Details',
      completeCampaign: 'Complete Campaign',
      noPhone: 'No phone number',
      progress: 'Progress',
      of: 'of',
    },
    ar: {
      title: 'الاتصال التلقائي',
      subtitle: 'نظام الاتصال التلقائي بالمدينين',
      createCampaign: 'حملة جديدة',
      campaignName: 'اسم الحملة',
      filterOptions: 'خيارات التصفية',
      minDebt: 'الحد الأدنى للدين',
      maxDebt: 'الحد الأقصى للدين',
      category: 'الفئة',
      all: 'الكل',
      vip: 'VIP',
      regular: 'عادي',
      wholesale: 'جملة',
      callScript: 'نص المكالمة',
      scriptPlaceholder: 'ماذا تقول للمدين؟\n\nمثال: مرحبا، هذا [اسم العمل]. أردت تذكيرك بالرصيد المستحق [المبلغ]. متى يمكنك الدفع؟',
      startCampaign: 'بدء الحملة',
      targetDebtors: 'المدينون المستهدفون',
      noCampaign: 'لا توجد حملات',
      createFirst: 'أنشئ حملتك الأولى',
      activeCampaign: 'الحملة النشطة',
      pause: 'إيقاف مؤقت',
      resume: 'استئناف',
      nextCall: 'المكالمة التالية',
      currentDebtor: 'المدين الحالي',
      totalDebt: 'إجمالي الدين',
      phoneNumber: 'رقم الهاتف',
      callNow: 'اتصل الآن',
      markAs: 'وضع علامة كـ',
      answered: 'تم الرد',
      noAnswer: 'لم يرد',
      busy: 'مشغول',
      skip: 'تخطي',
      successfulPromise: 'قطع وعد',
      refused: 'رفض',
      addNotes: 'إضافة ملاحظات',
      notesPlaceholder: 'ملاحظات حول المكالمة...',
      save: 'حفظ',
      statistics: 'الإحصائيات',
      totalCalls: 'إجمالي المكالمات',
      answered_stat: 'تم الرد',
      noAnswer_stat: 'لم يرد',
      promises: 'الوعود',
      successRate: 'معدل النجاح',
      completedCampaigns: 'الحملات المكتملة',
      viewDetails: 'عرض التفاصيل',
      completeCampaign: 'إكمال الحملة',
      noPhone: 'لا يوجد رقم هاتف',
      progress: 'التقدم',
      of: 'من',
    },
  };

  const t = translations[language];

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const stored = await AsyncStorage.getItem('auto_dial_campaigns');
      if (stored) {
        const data = JSON.parse(stored);
        setCampaigns(data);
        const active = data.find((c: Campaign) => c.status === 'active');
        if (active) {
          setActiveCampaign(active);
          setCurrentDebtorIndex(active.callLogs.length);
        }
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const saveCampaigns = async (updatedCampaigns: Campaign[]) => {
    try {
      await AsyncStorage.setItem('auto_dial_campaigns', JSON.stringify(updatedCampaigns));
      setCampaigns(updatedCampaigns);
    } catch (error) {
      console.error('Error saving campaigns:', error);
    }
  };

  const filteredDebtors = useMemo(() => {
    return debtors.filter(d => {
      if (d.totalDebt <= 0) return false;
      if (!d.phone) return false;

      const min = minDebt ? parseFloat(minDebt) : 0;
      const max = maxDebt ? parseFloat(maxDebt) : Infinity;

      if (d.totalDebt < min || d.totalDebt > max) return false;

      if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;

      return true;
    });
  }, [debtors, minDebt, maxDebt, selectedCategory]);

  const createCampaign = useCallback(async () => {
    if (!campaignName.trim()) {
      Alert.alert(language === 'ku' ? 'هەڵە' : 'Error', language === 'ku' ? 'تکایە ناوی کامپەین بنووسە' : 'Please enter campaign name');
      return;
    }

    if (filteredDebtors.length === 0) {
      Alert.alert(language === 'ku' ? 'هەڵە' : 'Error', language === 'ku' ? 'هیچ قەرزدارێک نەدۆزرایەوە' : 'No debtors found');
      return;
    }

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignName,
      startedAt: new Date().toISOString(),
      targetDebtors: filteredDebtors.map(d => d.id),
      callLogs: [],
      status: 'active',
      script: callScript || t.scriptPlaceholder,
      filterCriteria: {
        minDebt: minDebt ? parseFloat(minDebt) : undefined,
        maxDebt: maxDebt ? parseFloat(maxDebt) : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        hasPhone: true,
      },
    };

    const updatedCampaigns = [...campaigns.filter(c => c.status !== 'active'), newCampaign];
    await saveCampaigns(updatedCampaigns);
    setActiveCampaign(newCampaign);
    setCurrentDebtorIndex(0);
    setShowCreateCampaign(false);
    setCampaignName('');
    setCallScript('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [campaignName, filteredDebtors, callScript, campaigns, minDebt, maxDebt, selectedCategory, language, t.scriptPlaceholder]);

  const currentDebtor = useMemo(() => {
    if (!activeCampaign) return null;
    const debtorId = activeCampaign.targetDebtors[currentDebtorIndex];
    return debtors.find(d => d.id === debtorId);
  }, [activeCampaign, currentDebtorIndex, debtors]);

  const makeCall = useCallback(async () => {
    if (!currentDebtor?.phone) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsDialing(true);

    const phoneNumber = currentDebtor.phone.replace(/[^0-9+]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error making call:', error);
    }

    setTimeout(() => setIsDialing(false), 2000);
  }, [currentDebtor]);

  const logCall = useCallback(async (
    status: CallLog['status'],
    notes?: string,
    promisedAmount?: number,
    promisedDate?: string
  ) => {
    if (!activeCampaign || !currentDebtor) return;

    const newLog: CallLog = {
      debtorId: currentDebtor.id,
      debtorName: currentDebtor.name,
      phoneNumber: currentDebtor.phone || '',
      callTime: new Date().toISOString(),
      status,
      notes,
      promisedAmount,
      promisedDate,
    };

    const updatedCampaign = {
      ...activeCampaign,
      callLogs: [...activeCampaign.callLogs, newLog],
    };

    const updatedCampaigns = campaigns.map(c =>
      c.id === activeCampaign.id ? updatedCampaign : c
    );

    await saveCampaigns(updatedCampaigns);
    setActiveCampaign(updatedCampaign);

    if (currentDebtorIndex < activeCampaign.targetDebtors.length - 1) {
      setCurrentDebtorIndex(currentDebtorIndex + 1);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [activeCampaign, currentDebtor, campaigns, currentDebtorIndex]);

  const pauseCampaign = useCallback(async () => {
    if (!activeCampaign) return;

    const updatedCampaign = { ...activeCampaign, status: 'paused' as const };
    const updatedCampaigns = campaigns.map(c =>
      c.id === activeCampaign.id ? updatedCampaign : c
    );

    await saveCampaigns(updatedCampaigns);
    setActiveCampaign(null);
  }, [activeCampaign, campaigns]);

  const resumeCampaign = useCallback(async (campaign: Campaign) => {
    const updatedCampaign = { ...campaign, status: 'active' as const };
    const updatedCampaigns = campaigns.map(c =>
      c.id === campaign.id ? updatedCampaign : c
    );

    await saveCampaigns(updatedCampaigns);
    setActiveCampaign(updatedCampaign);
    setCurrentDebtorIndex(updatedCampaign.callLogs.length);
  }, [campaigns]);

  const completeCampaign = useCallback(async () => {
    if (!activeCampaign) return;

    const updatedCampaign = {
      ...activeCampaign,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
    };

    const updatedCampaigns = campaigns.map(c =>
      c.id === activeCampaign.id ? updatedCampaign : c
    );

    await saveCampaigns(updatedCampaigns);
    setActiveCampaign(null);
    setCurrentDebtorIndex(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [activeCampaign, campaigns]);

  const campaignStats = useMemo(() => {
    if (!activeCampaign) return null;

    const logs = activeCampaign.callLogs;
    const answered = logs.filter(l => l.status === 'answered' || l.status === 'successful_promise').length;
    const noAnswer = logs.filter(l => l.status === 'no_answer').length;
    const promises = logs.filter(l => l.status === 'successful_promise').length;
    const successRate = logs.length > 0 ? (answered / logs.length) * 100 : 0;

    return {
      totalCalls: logs.length,
      answered,
      noAnswer,
      promises,
      successRate: successRate.toFixed(0),
    };
  }, [activeCampaign]);

  const bgColor = isDark ? '#121212' : '#F8F9FA';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryText = isDark ? '#B0B0B0' : '#666666';

  if (showCreateCampaign) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <LinearGradient
          colors={isDark ? ['#1a237e', '#0d47a1'] : ['#1976d2', '#2196f3']}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => {
              setShowCreateCampaign(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.createCampaign}</Text>
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.label, { color: textColor }]}>{t.campaignName}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5', color: textColor }]}
              value={campaignName}
              onChangeText={setCampaignName}
              placeholder={t.campaignName}
              placeholderTextColor={secondaryText}
            />

            <Text style={[styles.label, { color: textColor, marginTop: 20 }]}>{t.filterOptions}</Text>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={[styles.smallLabel, { color: secondaryText }]}>{t.minDebt}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5', color: textColor }]}
                  value={minDebt}
                  onChangeText={setMinDebt}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={secondaryText}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={[styles.smallLabel, { color: secondaryText }]}>{t.maxDebt}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5', color: textColor }]}
                  value={maxDebt}
                  onChangeText={setMaxDebt}
                  placeholder="∞"
                  keyboardType="numeric"
                  placeholderTextColor={secondaryText}
                />
              </View>
            </View>

            <Text style={[styles.smallLabel, { color: secondaryText, marginTop: 15 }]}>{t.category}</Text>
            <View style={styles.categoryButtons}>
              {['all', 'VIP', 'Regular', 'Wholesale'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => {
                    setSelectedCategory(cat);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: selectedCategory === cat
                        ? '#1976d2'
                        : isDark ? '#2A2A2A' : '#F5F5F5',
                    },
                  ]}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    {
                      color: selectedCategory === cat ? '#FFF' : textColor,
                    },
                  ]}>
                    {t[cat.toLowerCase() as keyof typeof t] || cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.targetInfo}>
              <Users size={20} color="#1976d2" />
              <Text style={[styles.targetText, { color: textColor }]}>
                {t.targetDebtors}: {filteredDebtors.length}
              </Text>
            </View>

            <Text style={[styles.label, { color: textColor, marginTop: 20 }]}>{t.callScript}</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5', color: textColor }]}
              value={callScript}
              onChangeText={setCallScript}
              placeholder={t.scriptPlaceholder}
              placeholderTextColor={secondaryText}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            onPress={createCampaign}
            style={styles.startButton}
            disabled={filteredDebtors.length === 0}
          >
            <LinearGradient
              colors={filteredDebtors.length > 0 ? ['#4CAF50', '#45a049'] : ['#999', '#888']}
              style={styles.startButtonGradient}
            >
              <Play size={24} color="#FFF" />
              <Text style={styles.startButtonText}>{t.startCampaign}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <LinearGradient
        colors={isDark ? ['#1a237e', '#0d47a1'] : ['#1976d2', '#2196f3']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => {
            router.back();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setShowCreateCampaign(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={styles.createButton}
        >
          <SettingsIcon size={24} color="#FFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {activeCampaign && currentDebtor ? (
          <View style={styles.activeSection}>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.campaignHeader}>
                <View>
                  <Text style={[styles.campaignTitle, { color: textColor }]}>{activeCampaign.name}</Text>
                  <Text style={[styles.campaignSubtitle, { color: secondaryText }]}>
                    {t.progress}: {currentDebtorIndex + 1} {t.of} {activeCampaign.targetDebtors.length}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={pauseCampaign}
                  style={styles.pauseButton}
                >
                  <Pause size={20} color="#FF9800" />
                </TouchableOpacity>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${((currentDebtorIndex + 1) / activeCampaign.targetDebtors.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: cardBg, marginTop: 15 }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t.currentDebtor}</Text>
              
              <View style={styles.debtorInfo}>
                <View style={styles.debtorAvatar}>
                  <Users size={32} color="#1976d2" />
                </View>
                <View style={styles.debtorDetails}>
                  <Text style={[styles.debtorName, { color: textColor }]}>{currentDebtor.name}</Text>
                  <Text style={[styles.debtorDebt, { color: '#F44336' }]}>
                    {t.totalDebt}: {currentDebtor.totalDebt.toLocaleString('en-US')} {currentDebtor.currency || 'IQD'}
                  </Text>
                  {currentDebtor.phone && (
                    <Text style={[styles.debtorPhone, { color: secondaryText }]}>
                      📱 {currentDebtor.phone}
                    </Text>
                  )}
                </View>
              </View>

              {activeCampaign.script && (
                <View style={[styles.scriptBox, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
                  <Text style={[styles.scriptLabel, { color: secondaryText }]}>{t.callScript}:</Text>
                  <Text style={[styles.scriptText, { color: textColor }]}>
                    {activeCampaign.script
                      .replace('[ناوی بازرگانی]', 'بازرگانی')
                      .replace('[بڕ]', currentDebtor.totalDebt.toLocaleString('en-US'))
                      .replace('[Business Name]', 'Business')
                      .replace('[Amount]', currentDebtor.totalDebt.toLocaleString('en-US'))
                    }
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={makeCall}
                style={styles.callButton}
                disabled={isDialing || !currentDebtor.phone}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.callButtonGradient}
                >
                  <PhoneCall size={24} color="#FFF" />
                  <Text style={styles.callButtonText}>{t.callNow}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[styles.markAsLabel, { color: secondaryText }]}>{t.markAs}:</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  onPress={() => logCall('answered')}
                  style={[styles.statusButton, { backgroundColor: '#4CAF50' }]}
                >
                  <CheckCircle size={18} color="#FFF" />
                  <Text style={styles.statusButtonText}>{t.answered}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => logCall('no_answer')}
                  style={[styles.statusButton, { backgroundColor: '#FF9800' }]}
                >
                  <PhoneMissed size={18} color="#FFF" />
                  <Text style={styles.statusButtonText}>{t.noAnswer}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => logCall('successful_promise')}
                  style={[styles.statusButton, { backgroundColor: '#2196F3' }]}
                >
                  <TrendingUp size={18} color="#FFF" />
                  <Text style={styles.statusButtonText}>{t.successfulPromise}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => logCall('refused')}
                  style={[styles.statusButton, { backgroundColor: '#F44336' }]}
                >
                  <XCircle size={18} color="#FFF" />
                  <Text style={styles.statusButtonText}>{t.refused}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => logCall('skipped')}
                  style={[styles.statusButton, { backgroundColor: '#9E9E9E' }]}
                >
                  <SkipForward size={18} color="#FFF" />
                  <Text style={styles.statusButtonText}>{t.skip}</Text>
                </TouchableOpacity>
              </View>

              {currentDebtorIndex >= activeCampaign.targetDebtors.length - 1 && (
                <TouchableOpacity
                  onPress={completeCampaign}
                  style={styles.completeButton}
                >
                  <Text style={styles.completeButtonText}>{t.completeCampaign}</Text>
                </TouchableOpacity>
              )}
            </View>

            {campaignStats && (
              <View style={[styles.card, { backgroundColor: cardBg, marginTop: 15 }]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>{t.statistics}</Text>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <PhoneCall size={24} color="#4CAF50" />
                    <Text style={[styles.statValue, { color: textColor }]}>{campaignStats.totalCalls}</Text>
                    <Text style={[styles.statLabel, { color: secondaryText }]}>{t.totalCalls}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <CheckCircle size={24} color="#4CAF50" />
                    <Text style={[styles.statValue, { color: textColor }]}>{campaignStats.answered}</Text>
                    <Text style={[styles.statLabel, { color: secondaryText }]}>{t.answered_stat}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <PhoneMissed size={24} color="#FF9800" />
                    <Text style={[styles.statValue, { color: textColor }]}>{campaignStats.noAnswer}</Text>
                    <Text style={[styles.statLabel, { color: secondaryText }]}>{t.noAnswer_stat}</Text>
                  </View>

                  <View style={styles.statItem}>
                    <TrendingUp size={24} color="#2196F3" />
                    <Text style={[styles.statValue, { color: textColor }]}>{campaignStats.promises}</Text>
                    <Text style={[styles.statLabel, { color: secondaryText }]}>{t.promises}</Text>
                  </View>
                </View>

                <View style={[styles.successRateBox, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
                  <Text style={[styles.successRateLabel, { color: secondaryText }]}>{t.successRate}</Text>
                  <Text style={[styles.successRateValue, { color: '#4CAF50' }]}>{campaignStats.successRate}%</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptySection}>
            {campaigns.filter(c => c.status === 'paused').length > 0 ? (
              <View>
                <Text style={[styles.sectionTitle, { color: textColor, textAlign: 'center' }]}>
                  {t.completedCampaigns}
                </Text>
                {campaigns.filter(c => c.status === 'paused').map(campaign => (
                  <View key={campaign.id} style={[styles.card, { backgroundColor: cardBg, marginTop: 15 }]}>
                    <Text style={[styles.campaignTitle, { color: textColor }]}>{campaign.name}</Text>
                    <Text style={[styles.campaignSubtitle, { color: secondaryText }]}>
                      {campaign.callLogs.length} / {campaign.targetDebtors.length} {t.totalCalls}
                    </Text>
                    <TouchableOpacity
                      onPress={() => resumeCampaign(campaign)}
                      style={styles.resumeButton}
                    >
                      <Play size={18} color="#FFF" />
                      <Text style={styles.resumeButtonText}>{t.resume}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <PhoneForwarded size={80} color={secondaryText} />
                <Text style={[styles.emptyTitle, { color: textColor }]}>{t.noCampaign}</Text>
                <Text style={[styles.emptySubtitle, { color: secondaryText }]}>{t.createFirst}</Text>
                <TouchableOpacity
                  onPress={() => setShowCreateCampaign(true)}
                  style={styles.createEmptyButton}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.createEmptyButtonGradient}
                  >
                    <Text style={styles.createEmptyButtonText}>{t.createCampaign}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    padding: 8,
  },
  createButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  smallLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  targetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    minHeight: 150,
  },
  startButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 10,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeSection: {
    paddingBottom: 20,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  campaignTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  campaignSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  pauseButton: {
    padding: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  debtorInfo: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  debtorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debtorDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  debtorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  debtorDebt: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  debtorPhone: {
    fontSize: 14,
    marginTop: 4,
  },
  scriptBox: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  scriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  scriptText: {
    fontSize: 14,
    lineHeight: 22,
  },
  callButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  callButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  markAsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  completeButton: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  successRateBox: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  successRateLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  successRateValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySection: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  createEmptyButton: {
    marginTop: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  createEmptyButtonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  createEmptyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    gap: 8,
  },
  resumeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
