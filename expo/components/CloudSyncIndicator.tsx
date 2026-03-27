import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Cloud, CloudOff, Check, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useMarket } from '@/contexts/MarketContext';

interface CloudSyncIndicatorProps {
  onPress?: () => void;
}

export default function CloudSyncIndicator({ onPress }: CloudSyncIndicatorProps) {
  const { colors } = useTheme();
  const { lastBackendSyncTime, syncStatus, pendingChanges } = useMarket();

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <ActivityIndicator size={16} color={colors.primary} />;
      case 'success':
        return <Check size={16} color={colors.success} />;
      case 'error':
        return <AlertCircle size={16} color={colors.error} />;
      case 'idle':
      default:
        return lastBackendSyncTime ? (
          <Cloud size={16} color={colors.textSecondary} />
        ) : (
          <CloudOff size={16} color={colors.textTertiary} />
        );
    }
  };

  const getStatusText = () => {
    if (syncStatus === 'syncing') {
      return 'هاوکاتکردن...';
    }

    if (pendingChanges > 0) {
      return `${pendingChanges} گۆڕانکاری چاوەڕوان`;
    }

    if (lastBackendSyncTime) {
      const now = new Date();
      const lastSync = new Date(lastBackendSyncTime);
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) {
        return 'ئێستا هاوکات کرا';
      } else if (diffMins < 60) {
        return `${diffMins} خولەک لەمەوپێش`;
      } else if (diffHours < 24) {
        return `${diffHours} کاتژمێر لەمەوپێش`;
      } else {
        return `${diffDays} ڕۆژ لەمەوپێش`;
      }
    }

    return 'هاوکاتکردنی Cloud';
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'idle':
      default:
        return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.cardGlass,
          borderColor: colors.glassBorder,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getStatusIcon()}</View>
        <Text
          style={[
            styles.statusText,
            { color: getStatusColor() },
          ]}
          numberOfLines={1}
        >
          {getStatusText()}
        </Text>
        {syncStatus === 'syncing' && (
          <RefreshCw size={14} color={colors.primary} style={styles.syncIcon} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  syncIcon: {
    marginLeft: 2,
  },
});
