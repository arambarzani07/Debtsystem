import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Trash2, CheckCheck, X } from 'lucide-react-native';
import type { AppNotification } from '@/types';

export default function NotificationsScreen() {
  const { currentUser } = useAuth();
  const { 
    getNotificationsForUser, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead,
    deleteAllNotifications,
    markNotificationsAsViewed,
  } = useNotifications();
  const { colors } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  React.useEffect(() => {
    markNotificationsAsViewed();
  }, [markNotificationsAsViewed]);

  if (!currentUser) {
    router.back();
    return null;
  }

  const allNotifications = getNotificationsForUser(currentUser.role, currentUser.id);
  const notifications = filter === 'unread' 
    ? allNotifications.filter(n => !n.isRead)
    : allNotifications;

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    Alert.alert(
      'سڕینەوەی ئاگادارکردنەوە',
      'ئایا دڵنیایت لە سڕینەوەی ئەم ئاگادارکردنەوەیە؟',
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          onPress: async () => {
            await deleteNotification(notificationId);
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(currentUser.role, currentUser.id);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'سڕینەوەی هەموو ئاگادارکردنەوەکان',
      'ئایا دڵنیایت لە سڕینەوەی هەموو ئاگادارکردنەوەکان؟',
      [
        { text: 'نەخێر', style: 'cancel' },
        {
          text: 'بەڵێ',
          style: 'destructive',
          onPress: async () => {
            await deleteAllNotifications(currentUser.role, currentUser.id);
          },
        },
      ]
    );
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const isUnread = !item.isRead;
    const notificationDate = new Date(item.createdAt);
    const formattedDate = notificationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let senderLabel = '';
    if (item.senderRole === 'owner') senderLabel = 'خاوەندار';
    else if (item.senderRole === 'manager') senderLabel = 'بەڕێوەبەر';
    else if (item.senderRole === 'employee') senderLabel = 'کارمەند';

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: isUnread ? colors.primaryGlass : colors.cardGlass,
            borderColor: isUnread ? colors.primary : colors.glassBorder,
            shadowColor: colors.shadowColor,
          },
        ]}
        onPress={() => handleMarkAsRead(item.id)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitleRow}>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {item.title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.notificationMessage, { color: colors.textSecondary }]}>
          {item.message}
        </Text>

        <View style={styles.notificationFooter}>
          <Text style={[styles.notificationDate, { color: colors.textTertiary }]}>
            {formattedDate}
          </Text>
          {senderLabel && (
            <View style={[styles.senderBadge, { 
              backgroundColor: colors.primaryGlass,
              borderColor: colors.primary,
            }]}>
              <Text style={[styles.senderText, { color: colors.primary }]}>
                {senderLabel}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>
              ئاگادارکردنەوەکان
            </Text>
            <View style={styles.placeholderButton} />
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === 'all' ? colors.primaryGlass : colors.cardGlass,
                  borderColor: filter === 'all' ? colors.primary : colors.glassBorder,
                },
              ]}
              onPress={() => setFilter('all')}
            >
              <Text style={[
                styles.filterText,
                { color: filter === 'all' ? colors.primary : colors.textSecondary }
              ]}>
                هەموو ({allNotifications.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === 'unread' ? colors.primaryGlass : colors.cardGlass,
                  borderColor: filter === 'unread' ? colors.primary : colors.glassBorder,
                },
              ]}
              onPress={() => setFilter('unread')}
            >
              <Text style={[
                styles.filterText,
                { color: filter === 'unread' ? colors.primary : colors.textSecondary }
              ]}>
                نەخوێندراو ({allNotifications.filter(n => !n.isRead).length})
              </Text>
            </TouchableOpacity>
          </View>

          {notifications.length > 0 && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, {
                  backgroundColor: colors.primaryGlass,
                  borderColor: colors.primary,
                }]}
                onPress={handleMarkAllAsRead}
              >
                <CheckCheck size={18} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  خوێندنەوەی هەموو
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, {
                  backgroundColor: colors.errorGlass,
                  borderColor: colors.error,
                }]}
                onPress={handleDeleteAll}
              >
                <Trash2 size={18} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>
                  سڕینەوەی هەموو
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={60} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {filter === 'unread' ? 'هیچ ئاگادارکردنەوەی نەخوێندراو نییە' : 'هیچ ئاگادارکردنەوەیەک نییە'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderButton: {
    width: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    textAlign: 'center',
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  actionsContainer: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  notificationHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  notificationFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
  },
  senderBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  senderText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 16,
  },
});
