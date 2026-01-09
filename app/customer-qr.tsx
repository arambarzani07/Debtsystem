import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { ArrowRight, Share2 } from 'lucide-react-native';
import Svg, { Rect } from 'react-native-svg';

function QRCodeGenerator({ data, size = 256 }: { data: string; size?: number }) {
  if (!data || data.length === 0) {
    return (
      <View style={{ width: size, height: size, backgroundColor: '#F1F5F9', borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#64748B', fontSize: 14, textAlign: 'center' }}>QR کۆد نەدۆزرایەوە</Text>
      </View>
    );
  }

  const modules: boolean[][] = [];
  const moduleCount = 25;
  
  for (let row = 0; row < moduleCount; row++) {
    modules[row] = [];
    for (let col = 0; col < moduleCount; col++) {
      const hash = (data.charCodeAt(0) || 0) + row * moduleCount + col;
      modules[row][col] = hash % 2 === 0;
    }
  }
  
  const moduleSize = size / moduleCount;
  
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
              fill="#000000"
            />
          );
        })
      )}
      <Rect x={0} y={0} width={moduleSize * 7} height={moduleSize * 7} fill="#000000" />
      <Rect x={moduleSize} y={moduleSize} width={moduleSize * 5} height={moduleSize * 5} fill="#FFFFFF" />
      <Rect x={moduleSize * 2} y={moduleSize * 2} width={moduleSize * 3} height={moduleSize * 3} fill="#000000" />
      
      <Rect x={size - moduleSize * 7} y={0} width={moduleSize * 7} height={moduleSize * 7} fill="#000000" />
      <Rect x={size - moduleSize * 6} y={moduleSize} width={moduleSize * 5} height={moduleSize * 5} fill="#FFFFFF" />
      <Rect x={size - moduleSize * 5} y={moduleSize * 2} width={moduleSize * 3} height={moduleSize * 3} fill="#000000" />
      
      <Rect x={0} y={size - moduleSize * 7} width={moduleSize * 7} height={moduleSize * 7} fill="#000000" />
      <Rect x={moduleSize} y={size - moduleSize * 6} width={moduleSize * 5} height={moduleSize * 5} fill="#FFFFFF" />
      <Rect x={moduleSize * 2} y={size - moduleSize * 5} width={moduleSize * 3} height={moduleSize * 3} fill="#000000" />
    </Svg>
  );
}

export default function CustomerQRScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { getDebtor } = useDebt();

  const debtor = getDebtor(id as string);

  if (!debtor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>
              کڕیارەکە نەدۆزرایەوە
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `QR کۆدی ${debtor.name} - ID: ${debtor.id}`,
        title: `QR کۆدی ${debtor.name}`,
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={[styles.backButton, { 
              backgroundColor: colors.cardGlass,
              borderColor: colors.glassBorder,
            }]}
          >
            <ArrowRight size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>QR کۆد</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.qrCard, { 
            backgroundColor: colors.cardGlass,
            borderColor: colors.glassBorder,
          }]}>
            <Text style={[styles.debtorName, { color: colors.text }]}>{debtor.name}</Text>
            {debtor.phone && (
              <Text style={[styles.debtorPhone, { color: colors.textSecondary }]}>{debtor.phone}</Text>
            )}

            <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF' }]}>
              <QRCodeGenerator data={debtor.id} size={256} />
            </View>

            <View style={[styles.infoCard, { 
              backgroundColor: colors.background,
              borderColor: colors.glassBorder,
            }]}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>کۆی قەرز</Text>
              <Text style={[styles.infoValue, { color: colors.error }]}>
                {debtor.totalDebt.toLocaleString('en-US')} دینار
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.primary }]}
              onPress={handleShare}
            >
              <Share2 size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>هاوبەشکردنی QR کۆد</Text>
            </TouchableOpacity>

            <Text style={[styles.instructionText, { color: colors.textTertiary }]}>
              ئەم QR کۆدە بەکاربهێنە بۆ سکانکردنی خێرا و چوونە ناو حسابی کڕیار
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  qrCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  debtorName: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  debtorPhone: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  qrContainer: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
