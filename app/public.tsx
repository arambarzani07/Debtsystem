import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { ArrowRight, Share2, LogIn, Users, Info, PhoneCall, Globe } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';

import Svg, { Rect } from 'react-native-svg';

function QRCodeGenerator({ data, size = 200 }: { data: string; size?: number }) {
  const modules = useMemo(() => {
    const out: boolean[][] = [];
    const moduleCount = 25;
    for (let row = 0; row < moduleCount; row++) {
      out[row] = [];
      for (let col = 0; col < moduleCount; col++) {
        const seed =
          (data.charCodeAt((row + col) % Math.max(1, data.length)) || 0) +
          row * moduleCount +
          col;
        out[row][col] = seed % 2 === 0;
      }
    }
    return out;
  }, [data]);

  const moduleCount = modules.length;
  const moduleSize = size / Math.max(1, moduleCount);

  if (!data) {
    return (
      <View style={[styles.qrFallback, { width: size, height: size }]}>
        <Text style={styles.qrFallbackText}>QR نەدۆزرایەوە</Text>
      </View>
    );
  }

  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" />
      {modules.map((row, rowIndex) =>
        row.map((isDark, colIndex) => {
          if (!isDark) return null;
          return (
            <Rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * moduleSize}
              y={rowIndex * moduleSize}
              width={moduleSize}
              height={moduleSize}
              fill="#0B0F1A"
            />
          );
        })
      )}
      <Rect x={0} y={0} width={moduleSize * 7} height={moduleSize * 7} fill="#0B0F1A" />
      <Rect x={moduleSize} y={moduleSize} width={moduleSize * 5} height={moduleSize * 5} fill="#FFFFFF" />
      <Rect x={moduleSize * 2} y={moduleSize * 2} width={moduleSize * 3} height={moduleSize * 3} fill="#0B0F1A" />

      <Rect x={size - moduleSize * 7} y={0} width={moduleSize * 7} height={moduleSize * 7} fill="#0B0F1A" />
      <Rect x={size - moduleSize * 6} y={moduleSize} width={moduleSize * 5} height={moduleSize * 5} fill="#FFFFFF" />
      <Rect x={size - moduleSize * 5} y={moduleSize * 2} width={moduleSize * 3} height={moduleSize * 3} fill="#0B0F1A" />

      <Rect x={0} y={size - moduleSize * 7} width={moduleSize * 7} height={moduleSize * 7} fill="#0B0F1A" />
      <Rect x={moduleSize} y={size - moduleSize * 6} width={moduleSize * 5} height={moduleSize * 5} fill="#FFFFFF" />
      <Rect x={moduleSize * 2} y={size - moduleSize * 5} width={moduleSize * 3} height={moduleSize * 3} fill="#0B0F1A" />
    </Svg>
  );
}

export default function PublicLandingScreen() {
  const router = useRouter();
  const theme = useTheme();

  const colors = theme?.colors ?? {
    background: '#0B0F1A',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.75)',
    textTertiary: 'rgba(255,255,255,0.55)',
    primary: '#22C55E',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    card: 'rgba(255,255,255,0.10)',
    cardGlass: 'rgba(255,255,255,0.10)',
    glassBorder: 'rgba(255,255,255,0.14)',
    shadowColor: '#000000',
    errorGlass: 'rgba(239,68,68,0.18)',
    backgroundGradient: ['#0B0F1A', '#0A1530'],
  };

  const [shareNote, setShareNote] = useState<string>('');

  const shareUrl = useMemo(() => {
    const url = Linking.createURL('/public');
    console.log('Public share url:', url);
    return url;
  }, []);

  const handleShare = useCallback(async () => {
    try {
      const message = shareNote.trim().length
        ? `${shareNote.trim()}\n\n${shareUrl}`
        : shareUrl;

      await Share.share({
        message,
        title: 'بەکارهێنانی ئەپ',
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('هەڵە', 'هاوبەشکردن سەرکەوتوو نەبوو، تکایە دووبارە هەوڵبدەرەوە');
    }
  }, [shareNote, shareUrl]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="public-screen">
      <LinearGradient
        colors={['#0B0F1A', '#0A1530', '#07142C']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.cardGlass, borderColor: colors.glassBorder }]}
            testID="public-back"
          >
            <ArrowRight size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareButton, { backgroundColor: 'rgba(34,197,94,0.16)', borderColor: 'rgba(34,197,94,0.35)' }]}
            testID="public-share"
          >
            <Share2 size={18} color={colors.primary} />
            <Text style={[styles.shareButtonText, { color: colors.primary }]}>هاوبەشکردن</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { borderColor: colors.glassBorder }]}>
            <View style={styles.heroTopRow}>
              <View style={[styles.heroIcon, { backgroundColor: 'rgba(59,130,246,0.18)', borderColor: 'rgba(59,130,246,0.35)' }]}>
                <Globe size={22} color={'#60A5FA'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]} testID="public-title">بۆ هەموو خەڵک</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} testID="public-subtitle">
                  ئەم شاشەیە بۆ ئەوەی هەموو خەڵک بتوانن ئەپەکەت بکەنەوە و ڕێگای چوونەژوورەوە هەڵبژێرن.
                </Text>
              </View>
            </View>

            <View style={styles.qrRow}>
              <View style={styles.qrWrap}>
                <View style={[styles.qrCard, { borderColor: colors.glassBorder }]} testID="public-qr">
                  <QRCodeGenerator data={shareUrl} size={200} />
                </View>
                <Text style={[styles.qrHint, { color: colors.textTertiary }]}>
                  QR سکان بکە یان لینکەکە هاوبەش بکە.
                </Text>
              </View>

              <View style={styles.linkWrap}>
                <Text style={[styles.linkLabel, { color: colors.textSecondary }]}>لینکی بەکارهێنان</Text>
                <View style={[styles.linkBox, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: colors.glassBorder }]}>
                  <Text style={[styles.linkText, { color: colors.text }]} numberOfLines={2} selectable testID="public-link">
                    {shareUrl}
                  </Text>
                </View>

                <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>دەق بۆ هاوبەشکردن (ئارەزوومەندانە)</Text>
                <TextInput
                  value={shareNote}
                  onChangeText={setShareNote}
                  placeholder="مثلاً: تکایە ئەپەکەم بەکاربهێنە..."
                  placeholderTextColor={'rgba(255,255,255,0.45)'}
                  style={[styles.noteInput, { color: colors.text, borderColor: colors.glassBorder }]}
                  testID="public-share-note"
                  multiline
                />
              </View>
            </View>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.glassBorder }]}
              onPress={() => router.push('/login' as any)}
              testID="public-owner-login"
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(34,197,94,0.16)', borderColor: 'rgba(34,197,94,0.35)' }]}>
                <LogIn size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>چوونەژوورەوە (بەڕێوەبەر)</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>بۆ بەڕێوەبردن و کارمەندان</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.glassBorder }]}
              onPress={() => router.push('/customer-login' as any)}
              testID="public-customer-login"
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.16)', borderColor: 'rgba(59,130,246,0.35)' }]}>
                <Users size={20} color={'#60A5FA'} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>چوونەژوورەوە (کڕیار)</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>بینینی قەرز و مامەڵەکان</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.glassBorder }]}
              onPress={() => router.push('/about' as any)}
              testID="public-about"
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(245,158,11,0.16)', borderColor: 'rgba(245,158,11,0.35)' }]}>
                <Info size={20} color={'#FBBF24'} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>دەربارە</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>زانیاری سەرەکی و یارمەتی</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: colors.glassBorder }]}
              onPress={() => router.push('/contact-support' as any)}
              testID="public-support"
              activeOpacity={0.85}
            >
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(239,68,68,0.14)', borderColor: 'rgba(239,68,68,0.35)' }]}>
                <PhoneCall size={20} color={'#FB7185'} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>پەیوەندی</Text>
              <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>پەیوەندی بە پشتگیری</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.tipCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: colors.glassBorder }]}>
            <Text style={[styles.tipTitle, { color: colors.text }]}>چۆن هەموو خەڵک بەکاربهێنێت؟</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>١) ئەم لینکە هاوبەش بکە (WhatsApp / Telegram / SMS){'\n'}٢) لە موبایل: Expo Go یان Rork App دابەزێنە و QR سکان بکەن{'\n'}٣) لە وێب: لینکەکە بکەنەوە لە براوزەر</Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    gap: 8,
  },
  shareButtonText: { fontSize: 14, fontWeight: '700' as const },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroTopRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  qrRow: { flexDirection: 'row', gap: 14, marginTop: 14, flexWrap: 'wrap' },
  qrWrap: { alignItems: 'center' },
  qrCard: {
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  qrHint: { marginTop: 10, fontSize: 12 },
  linkWrap: { flex: 1, minWidth: 220 },
  linkLabel: { fontSize: 12, fontWeight: '700' as const, marginBottom: 8 },
  linkBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  linkText: { fontSize: 12, lineHeight: 16 },
  noteLabel: { fontSize: 12, fontWeight: '700' as const, marginTop: 12, marginBottom: 8 },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    minHeight: 64,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null),
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 160,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: { fontSize: 14, fontWeight: '800' as const },
  actionDesc: { fontSize: 12, marginTop: 4 },
  tipCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  tipTitle: { fontSize: 14, fontWeight: '800' as const, marginBottom: 8 },
  tipText: { fontSize: 12, lineHeight: 18 },
  qrFallback: { backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qrFallbackText: { fontSize: 12, color: '#64748B', textAlign: 'center' },
});
