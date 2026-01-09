import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, View, StyleSheet, Text, Platform } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const { getUnreadCount, hasUnviewedNotifications, markNotificationsAsViewed } = useNotifications();
  const { colors } = useTheme();
  const router = useRouter();
  
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const previousUnreadCount = useRef<number>(0);

  const playNotificationSound = async () => {
    try {
      if (Platform.OS === 'web') {
        try {
          const audio = new window.Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.5;
          await audio.play().catch(err => {
            console.log('Web audio playback failed (may require user interaction):', err);
          });
        } catch (webErr) {
          console.log('Web audio initialization failed:', webErr);
        }
      }
    } catch (error) {
      console.log('Notification sound playback error:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    const currentUnreadCount = getUnreadCount(currentUser.role, currentUser.id);
    
    if (currentUnreadCount > previousUnreadCount.current && previousUnreadCount.current !== 0) {
      playNotificationSound();
    }
    
    previousUnreadCount.current = currentUnreadCount;
  }, [currentUser, getUnreadCount]);

  useEffect(() => {
    if (hasUnviewedNotifications) {
      const shakeSequence = Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]);

      const pulseSequence = Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);

      const loopAnimation = Animated.loop(
        Animated.parallel([shakeSequence, pulseSequence])
      );

      loopAnimation.start();

      return () => {
        loopAnimation.stop();
      };
    } else {
      shakeAnimation.setValue(0);
      scaleAnimation.setValue(1);
    }
  }, [hasUnviewedNotifications, shakeAnimation, scaleAnimation]);

  if (!currentUser) return null;

  const unreadCount = getUnreadCount(currentUser.role, currentUser.id);

  const handlePress = () => {
    markNotificationsAsViewed();
    router.push('/notifications' as any);
  };

  const rotate = shakeAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <TouchableOpacity
      style={[styles.bellContainer, {
        backgroundColor: colors.cardGlass,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadowColor,
      }]}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.bellIconWrapper,
          {
            transform: [
              { rotate },
              { scale: scaleAnimation },
            ],
          },
        ]}
      >
        <Bell size={22} color={hasUnviewedNotifications ? colors.primary : colors.textSecondary} strokeWidth={2.5} />
      </Animated.View>
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={[styles.badgeText, { color: '#fff' }]}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  bellIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
});
