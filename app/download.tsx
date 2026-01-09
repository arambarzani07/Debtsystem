import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Download, Smartphone, Globe } from 'lucide-react-native';

export default function DownloadScreen() {
  const { colors } = useTheme();

  const handleDownload = async () => {
    const url = 'https://rork.app';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
            <Download size={64} color="#FFFFFF" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            داگرتنی ئەپ
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            بەڕێوەبردنی قەرزەکانت بە ئاسانی لە مۆبایلەکەتەوە
          </Text>

          <View style={[styles.featuresCard, {
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primaryGlass }]}>
                <Smartphone size={24} color={colors.primary} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  ئەپی مۆبایل
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  بەردەستە بۆ ئەندرۆید و iOS
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.successGlass }]}>
                <Globe size={24} color={colors.success} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  وێب ئەپ
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  بەکاریبهێنە لە هەر براوزەرێک
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: colors.primary }]}
            onPress={handleDownload}
          >
            <Download size={20} color="#FFFFFF" />
            <Text style={styles.downloadButtonText}>
              داگرتنی ئێستا
            </Text>
          </TouchableOpacity>

          <View style={[styles.infoBox, {
            backgroundColor: colors.primaryGlass,
            borderColor: colors.primary,
          }]}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              💡 ئەم ئەپە یارمەتیدەری بەڕێوەبردنی قەرزەکانتە بە شێوەیەکی ئاسان و سەرکەوتوو
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresCard: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  infoBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
