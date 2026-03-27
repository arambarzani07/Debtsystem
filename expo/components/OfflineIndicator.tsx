import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function OfflineIndicator() {
  const { colors } = useTheme();
  const [isConnected, setIsConnected] = useState(true);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setIsConnected(true);
        setTimeout(() => setShowOffline(false), 2000);
      };
      
      const handleOffline = () => {
        setIsConnected(false);
        setShowOffline(true);
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      setIsConnected(navigator.onLine);
      if (!navigator.onLine) {
        setShowOffline(true);
      }
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    
    return () => {};
  }, []);

  if (!showOffline) return null;

  if (Platform.OS === 'web') {
    if (!isConnected) {
      return (
        <View
          style={[
            styles.container,
            { backgroundColor: colors.error },
          ]}
        >
          <WifiOff size={16} color="#FFFFFF" />
          <Text style={styles.text}>
            ئۆفلاین - زانیاریەکان لە ناوخۆیی پاشەکەوت دەکرێن
          </Text>
        </View>
      );
    }
  }

  if (!showOffline) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isConnected ? colors.success : colors.error,
        },
      ]}
    >
      {isConnected ? (
        <Wifi size={16} color="#FFFFFF" />
      ) : (
        <WifiOff size={16} color="#FFFFFF" />
      )}
      <Text style={styles.text}>
        {isConnected ? 'گەڕایەوە بۆ ئۆنلاین' : 'ئۆفلاین - زانیاریەکان لە ناوخۆیی پاشەکەوت دەکرێن'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  text: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
