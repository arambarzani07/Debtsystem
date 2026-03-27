import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Camera } from 'lucide-react-native';

export default function ScanQRScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { debtors } = useDebt();
  const { currentUser } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission?.granted, requestPermission]);

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    console.log('QR Code scanned:', data);
    console.log('Current user:', currentUser?.role);
    console.log('Total debtors:', debtors.length);
    
    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'employee')) {
      if (Platform.OS === 'web') {
        alert('تەنها بەڕێوەبەر و کارمەندەکان دەتوانن QR کۆد سکان بکەن');
      } else {
        Alert.alert('هەڵە', 'تەنها بەڕێوەبەر و کارمەندەکان دەتوانن QR کۆد سکان بکەن', [
          {
            text: 'باشە',
            onPress: () => setScanned(false),
          },
        ]);
      }
      setTimeout(() => setScanned(false), 2000);
      return;
    }
    
    const debtor = debtors.find(d => d.id === data);
    console.log('Debtor found:', debtor ? debtor.id : 'NO');
    
    if (debtor) {
      router.push(`/debtor/${debtor.id}` as any);
      setTimeout(() => setScanned(false), 1000);
    } else {
      if (Platform.OS === 'web') {
        alert('کڕیارەکە نەدۆزرایەوە');
      } else {
        Alert.alert('هەڵە', 'کڕیارەکە نەدۆزرایەوە', [
          {
            text: 'هەوڵدانەوە',
            onPress: () => setScanned(false),
          },
        ]);
      }
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              چاوەڕوانی مۆڵەتی کامێرا...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.backgroundGradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContent}>
            <Camera size={64} color={colors.textTertiary} />
            <Text style={[styles.permissionText, { color: colors.text }]}>
              پێویستە مۆڵەتی کامێرا بدرێت
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>درووستکردنی مۆڵەت</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backButtonAlt, { 
                backgroundColor: colors.cardGlass,
                borderColor: colors.glassBorder,
              }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>گەڕانەوە</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>سکانی QR کۆد</Text>
        </View>

        <View style={styles.scanOverlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.instructionText}>
            QR کۆدی کڕیار لەناو چوارچێوە دابنێ
          </Text>
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
    paddingHorizontal: 40,
    gap: 20,
  },
  message: {
    fontSize: 18,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  backButtonAlt: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    position: 'relative' as const,
  },
  corner: {
    position: 'absolute' as const,
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
