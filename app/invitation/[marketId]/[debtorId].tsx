import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle } from 'lucide-react-native';

export default function InvitationScreen() {
  useLocalSearchParams<{ marketId: string; debtorId: string }>();
  const { colors } = useTheme();
  const [loading] = useState(false);

  const handleAccept = async () => {
    const url = 'https://rork.app/customer-login';
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
            <CheckCircle size={64} color="#FFFFFF" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            بانگهێشت بۆ پەیوەستبوون
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            بانگهێشت کراویت بۆ پەیوەستبوون بە سیستەمی بەڕێوەبردنی قەرز
          </Text>

          <View style={[styles.featuresCard, {
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              تایبەتمەندییەکان:
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  بینینی قەرزەکانت بە ڕاستەوخۆ
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  وەرگرتنی یادەوەری لە ڕێگەی تێلێگرام
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  بینینی مێژووی مامەڵەکان
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  پەیوەندی ئاسان لەگەڵ فرۆشگا
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.acceptButton, { backgroundColor: colors.primary }]}
            onPress={handleAccept}
          >
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>
              قبووڵکردنی بانگهێشت
            </Text>
          </TouchableOpacity>

          <View style={[styles.infoBox, {
            backgroundColor: colors.primaryGlass,
            borderColor: colors.primary,
          }]}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              💡 دوای قبووڵکردن، دەتوانیت چوونە ژوورەوە بکەیت و قەرزەکانت ببینیت
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
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
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  acceptButton: {
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
  acceptButtonText: {
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
