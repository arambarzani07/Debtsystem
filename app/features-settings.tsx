import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mic2,
  Sparkles,
  BrainCircuit,
  Wallet,
  Gamepad2,
  Zap,
  HandshakeIcon,
  SearchCode,
  TrendingUp,
  Map,
  Award,
  Brain,
  Target,
  MessageCircle,
  QrCode,
  Sparkle,
  ChevronLeft,
  Phone,
  Radio,
  Target as TargetIcon,
  Users2,
  Heater as Flame,
  BarChart2,
  RefreshCw,
  Trophy,
  Shield,
  BadgeDollarSign,
  CreditCard,
  ChartLine,
  Copy,
  Zap as Lightning,
  FileText,
  Users,
  Gift,
  Megaphone,
  Briefcase,
  TrendingUpDown,
  Send,
  Bell,
  UserCircle,
  Settings,
  ArrowRightLeft,
} from 'lucide-react-native';

export default function FeaturesSettingsScreen() {
  const { colors } = useTheme();
  const { currentUser } = useAuth();
  const router = useRouter();

  const features = [
    {
      id: 'statistics',
      title: 'ئامارەکان',
      icon: TrendingUpDown,
      color: '#3B82F6',
      route: '/statistics',
    },
    {
      id: 'transactions',
      title: 'هەموو مامەڵەکان',
      icon: ArrowRightLeft,
      color: '#8B5CF6',
      route: '/transactions',
    },
    {
      id: 'notifications',
      title: 'ئاگادارکردنەوەکان',
      icon: Bell,
      color: '#F59E0B',
      route: '/notifications',
    },
    {
      id: 'profile',
      title: 'پرۆفایل',
      icon: UserCircle,
      color: '#10B981',
      route: '/profile',
    },
    {
      id: 'telegram-settings',
      title: 'ڕێکخستنەکانی تێلێگرام',
      icon: Send,
      color: '#0088CC',
      route: '/telegram-settings',
    },
    {
      id: 'settings',
      title: 'ڕێکخستنەکان',
      icon: Settings,
      color: '#6B7280',
      route: '/settings',
    },
    {
      id: 'voice-payment',
      title: 'سیستەمی دەنگی ڕاستەوخۆ',
      icon: Mic2,
      color: '#F97316',
      route: '/voice-payment',
    },
    {
      id: 'ai-features',
      title: 'تایبەتمەندیەکانی AI',
      icon: Sparkles,
      color: '#FCD34D',
      route: '/ai-features',
    },
    {
      id: 'ai-chat',
      title: 'AI چات',
      icon: BrainCircuit,
      color: '#6366F1',
      route: '/ai-chat',
    },
    {
      id: 'cash-flow',
      title: 'پێشبینی کاش فلۆ',
      icon: Wallet,
      color: '#EC4899',
      route: '/cash-flow-prediction',
    },
    {
      id: 'gamification',
      title: 'گەیمیفیکەیشن',
      icon: Gamepad2,
      color: '#8B5CF6',
      route: '/debt-gamification',
    },
    {
      id: 'smart-collection',
      title: 'کۆکردنەوەی زیرەک',
      icon: Zap,
      color: '#F59E0B',
      route: '/smart-collection',
    },
    {
      id: 'negotiation',
      title: 'گفتووگۆی قەرز',
      icon: HandshakeIcon,
      color: '#22C55E',
      route: '/debt-negotiation',
    },
    {
      id: 'advanced-search',
      title: 'گەڕانی پێشکەوتوو',
      icon: SearchCode,
      color: colors.primary,
      route: '/advanced-search',
    },
    {
      id: 'advanced-analytics',
      title: 'شیکاری پێشکەوتوو',
      icon: TrendingUp,
      color: colors.primary,
      route: '/advanced-analytics',
    },
    {
      id: 'customers-map',
      title: 'نەخشەی کڕیاران',
      icon: Map,
      color: '#10B981',
      route: '/customers-map',
    },
    {
      id: 'social-comparison',
      title: 'بەراوردی کۆمەڵایەتی',
      icon: Award,
      color: '#6366F1',
      route: '/social-comparison',
    },
    {
      id: 'ai-debt-analysis',
      title: 'AI شیکاری قەرز',
      icon: Brain,
      color: '#9333EA',
      route: '/ai-debt-analysis',
    },
    {
      id: 'debtor-insights',
      title: 'تێگەیشتنی قەرزار',
      icon: Target,
      color: '#F59E0B',
      route: '/debtor-insights',
    },
    {
      id: 'automatic-reminders',
      title: 'ئاگادارکردنەوەی ئۆتۆماتیک',
      icon: MessageCircle,
      color: '#A855F7',
      route: '/automatic-reminders',
    },
    {
      id: 'stories',
      title: 'ستۆریەکان',
      icon: Sparkle,
      color: '#FB923C',
      route: '/stories',
    },
    {
      id: 'quick-voice',
      title: 'فەرمانی دەنگی خێرا',
      icon: Mic2,
      color: '#F97316',
      route: '/quick-voice-command',
    },
    {
      id: 'payment-plan',
      title: 'پلانی پارەدان',
      icon: CreditCard,
      color: '#8B5CF6',
      route: '/smart-payment-plan',
    },
    {
      id: 'debt-splitting',
      title: 'دابەشکردنی قەرز',
      icon: Copy,
      color: '#3B82F6',
      route: '/debt-splitting',
    },
    {
      id: 'debt-heatmap',
      title: 'نەخشەی گەرمی قەرز',
      icon: Flame,
      color: '#EF4444',
      route: '/debt-heatmap',
    },
    {
      id: 'debt-comparison',
      title: 'بەراوردکردنی قەرز',
      icon: BarChart2,
      color: '#10B981',
      route: '/debt-comparison',
    },
    {
      id: 'collection-campaign',
      title: 'کامپەینی کۆکردنەوە',
      icon: Megaphone,
      color: '#F59E0B',
      route: '/collection-campaign',
    },
    {
      id: 'smart-triage',
      title: 'تریاژی زیرەکی قەرز',
      icon: TargetIcon,
      color: '#8B5CF6',
      route: '/smart-debt-triage',
    },
    {
      id: 'collaborative',
      title: 'کۆکردنەوە لە هاوکاری',
      icon: Users2,
      color: '#6366F1',
      route: '/collaborative-collections',
    },
    {
      id: 'success-stories',
      title: 'چیرۆکی سەرکەوتن',
      icon: Trophy,
      color: '#22C55E',
      route: '/success-stories',
    },
    {
      id: 'portfolio-optimizer',
      title: 'باشکردنی پۆرتفۆلیۆ',
      icon: ChartLine,
      color: '#3B82F6',
      route: '/debt-portfolio-optimizer',
    },
    {
      id: 'dispute-resolution',
      title: 'چارەسەری ناکۆکی',
      icon: Shield,
      color: '#F59E0B',
      route: '/smart-dispute-resolution',
    },
    {
      id: 'fraud-detection',
      title: 'دۆزینەوەی فریودان',
      icon: Shield,
      color: '#EF4444',
      route: '/advanced-fraud-detection',
    },
    {
      id: 'debt-consolidation',
      title: 'یەکلایەنەکردنی قەرز',
      icon: RefreshCw,
      color: '#8B5CF6',
      route: '/debt-consolidation',
    },
    {
      id: 'customer-lifetime',
      title: 'نرخی تەمەنی کڕیار',
      icon: BadgeDollarSign,
      color: '#10B981',
      route: '/customer-lifetime-value',
    },
    {
      id: 'payment-terminal',
      title: 'تێرمیناڵی پارەدان',
      icon: CreditCard,
      color: '#6366F1',
      route: '/payment-terminal',
    },
    {
      id: 'credit-scoring',
      title: 'نمرەی کرێدیت',
      icon: ChartLine,
      color: '#F59E0B',
      route: '/credit-scoring',
    },
    {
      id: 'loyalty-rewards',
      title: 'پاداشتی دڵسۆزی',
      icon: Gift,
      color: '#EC4899',
      route: '/loyalty-rewards',
    },
    {
      id: 'duplicate-detection',
      title: 'دۆزینەوەی دووبارەبوون',
      icon: Copy,
      color: '#F59E0B',
      route: '/duplicate-detection',
    },
    {
      id: 'bulk-operations',
      title: 'کردارەکانی گشتگیر',
      icon: Lightning,
      color: '#8B5CF6',
      route: '/bulk-operations',
    },
    {
      id: 'quick-reports',
      title: 'ڕاپۆرتی خێرا',
      icon: FileText,
      color: '#3B82F6',
      route: '/quick-reports',
    },
    {
      id: 'voice-broadcast',
      title: 'بڵاوکردنەوەی دەنگی گرووپی',
      icon: Radio,
      color: '#F97316',
      route: '/live-voice-broadcast',
    },
    {
      id: 'auto-dial',
      title: 'پەیوەندی ئۆتۆماتیک',
      icon: Phone,
      color: '#22C55E',
      route: '/auto-dial-collection',
    },
    {
      id: 'custom-reports',
      title: 'ڕاپۆرتی تایبەت',
      icon: FileText,
      color: '#6366F1',
      route: '/custom-reports',
    },
    {
      id: 'history-log',
      title: 'مێژووی گۆڕانکاریەکان',
      icon: RefreshCw,
      color: '#8B5CF6',
      route: '/history-log',
    },
    {
      id: 'customer-accounts',
      title: 'هەژماری کڕیاران',
      icon: Users,
      color: '#10B981',
      route: '/customer-accounts',
    },
    {
      id: 'account-center',
      title: 'ناوەندی هەژمار',
      icon: Briefcase,
      color: '#3B82F6',
      route: '/account-center',
    },
    {
      id: 'debt-forgiveness',
      title: 'لێخۆشبوونی قەرز',
      icon: HandshakeIcon,
      color: '#10B981',
      route: '/debt-forgiveness',
    },
    {
      id: 'partial-payment',
      title: 'پلانی پارەدانی بەشێکی',
      icon: BadgeDollarSign,
      color: '#8B5CF6',
      route: '/partial-payment-plans',
    },
    {
      id: 'debt-restructuring',
      title: 'دووبارە پێکهێنانەوەی قەرز',
      icon: RefreshCw,
      color: '#F59E0B',
      route: '/debt-restructuring',
    },
    {
      id: 'credit-limits',
      title: 'سنووری کرێدیتی کڕیار',
      icon: Shield,
      color: '#EF4444',
      route: '/customer-credit-limits',
    },
    {
      id: 'payment-methods',
      title: 'بەڕێوەبردنی ڕێگای پارەدان',
      icon: CreditCard,
      color: '#6366F1',
      route: '/payment-method-management',
    },
    {
      id: 'collection-agencies',
      title: 'ئاژانسی کۆکردنەوەی قەرز',
      icon: Users,
      color: '#EC4899',
      route: '/collection-agencies',
    },
    {
      id: 'legal-docs',
      title: 'دروستکردنی بەڵگەی یاسایی',
      icon: FileText,
      color: '#3B82F6',
      route: '/legal-document-generator',
    },
    {
      id: 'communication-history',
      title: 'مێژووی پەیوەندی کڕیار',
      icon: MessageCircle,
      color: '#22C55E',
      route: '/communication-history',
    },
    {
      id: 'settlement-calculator',
      title: 'ژمێرەری کۆتایی هێنانی قەرز',
      icon: ChartLine,
      color: '#F97316',
      route: '/debt-settlement-calculator',
    },
    {
      id: 'receipt-generator',
      title: 'دروستکردنی پسوڵەی پارەدان',
      icon: FileText,
      color: '#8B5CF6',
      route: '/payment-receipt-generator',
    },
    {
      id: 'overdue-tracker',
      title: 'شوێنکەوتنی پارەی دواکەوتوو',
      icon: Bell,
      color: '#EF4444',
      route: '/overdue-payment-tracker',
    },
    {
      id: 'customer-segmentation',
      title: 'دابەشکردنی کڕیاران بە بەش',
      icon: Users2,
      color: '#6366F1',
      route: '/customer-segmentation',
    },
    {
      id: 'recovery-rate',
      title: 'ڕێژەی گەڕاندنەوەی قەرز',
      icon: TrendingUp,
      color: '#10B981',
      route: '/debt-recovery-rate',
    },
    {
      id: 'payment-promises',
      title: 'شوێنکەوتنی بەڵێنی پارەدان',
      icon: Target,
      color: '#F59E0B',
      route: '/payment-promise-tracker',
    },
    {
      id: 'multi-store',
      title: 'بەڕێوەبردنی چەند شوێنێک',
      icon: Briefcase,
      color: '#EC4899',
      route: '/multi-store-management',
    },
    {
      id: 'employee-performance',
      title: 'کارایی کارمەندان',
      icon: Trophy,
      color: '#8B5CF6',
      route: '/employee-performance',
    },
    {
      id: 'customer-feedback',
      title: 'سیستەمی فیدباکی کڕیار',
      icon: MessageCircle,
      color: '#3B82F6',
      route: '/customer-feedback-system',
    },
    {
      id: 'debt-writeoff',
      title: 'بەڕێوەبردنی نوسینەوەی قەرز',
      icon: FileText,
      color: '#EF4444',
      route: '/debt-writeoff-management',
    },
    {
      id: 'payment-gateway',
      title: 'یەکگرتنی دەروازەی پارەدان',
      icon: CreditCard,
      color: '#22C55E',
      route: '/payment-gateway-integration',
    },
    {
      id: 'financial-dashboard',
      title: 'داشبۆردی دارایی',
      icon: ChartLine,
      color: '#6366F1',
      route: '/financial-dashboard',
    },
  ];

  if (currentUser?.role === 'manager' || currentUser?.role === 'employee') {
    features.push({
      id: 'scan-qr',
      title: 'سکانی QR کۆد',
      icon: QrCode,
      color: '#9333EA',
      route: '/scan-qr',
    });
  }

  if (currentUser?.role === 'manager') {
    features.push({
      id: 'manage-employees',
      title: 'بەڕێوەبردنی کارمەندان',
      icon: Users,
      color: '#6366F1',
      route: '/manage-employees',
    });
  }

  if (currentUser?.role === 'owner') {
    features.push({
      id: 'owner-dashboard',
      title: 'داشبۆردی خاوەندار',
      icon: Briefcase,
      color: '#F59E0B',
      route: '/owner-dashboard',
    });
    features.push({
      id: 'market-request',
      title: 'داواکاریەکانی مارکێت',
      icon: FileText,
      color: '#22C55E',
      route: '/market-request',
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={[styles.headerCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>ڕێکخستنەکان</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: colors.cardGlass,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => router.push(feature.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${feature.color}20` }]}>
                  <feature.icon size={28} color={feature.color} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.text }]} numberOfLines={2}>
                  {feature.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
    paddingTop: Platform.OS === 'web' ? 20 : 10,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '47%',
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
    writingDirection: 'rtl' as const,
  },
});
