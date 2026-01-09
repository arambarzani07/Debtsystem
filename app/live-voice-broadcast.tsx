import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,

  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Mic,
  Square,
  Play,
  Pause,
  Send,
  Clock,
  Users,
  Trash2,
  Radio,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useDebt } from '@/contexts/DebtContext';
import {
  VoiceBroadcast,
  BroadcastRecipient,
  requestAudioPermissions,
  startRecording,
  stopRecording,
  playAudio,
  saveBroadcast,
  getBroadcasts,
  deleteBroadcast,
  sendBroadcast,
  formatDuration,
  initializeAudioDirectory,
} from '@/utils/voiceBroadcast';

export default function LiveVoiceBroadcast() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = useTheme();
  const { debtors } = useDebt();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playingSound, setPlayingSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUri, setCurrentAudioUri] = useState<string | null>(null);

  const [broadcasts, setBroadcasts] = useState<VoiceBroadcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  const [title, setTitle] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'overdue' | 'selected'>('all');
  const [selectedDebtorIds, setSelectedDebtorIds] = useState<string[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);


  const [showHistory, setShowHistory] = useState(false);

  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    initializeAudioDirectory();
    loadBroadcasts();
  }, []);

  useEffect(() => {
    return () => {
      if (playingSound) {
        playingSound.unloadAsync();
      }
    };
  }, [playingSound]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, pulseAnim]);

  const loadBroadcasts = async () => {
    setLoading(true);
    const data = await getBroadcasts();
    setBroadcasts(data);
    setLoading(false);
  };



  const handleStartRecording = async () => {
    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) {
      Alert.alert('هەڵە', 'ڕێگەپێدان بۆ دەنگ پێویستە');
      return;
    }

    const rec = await startRecording();
    if (rec) {
      setRecording(rec);
      setIsRecording(true);
      setRecordingDuration(0);
      setRecordedAudioUri(null);
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    const result = await stopRecording(recording);
    setRecording(null);

    if (result) {
      setRecordedAudioUri(result.uri);
      setRecordedDuration(result.duration);
    }
  };

  const handlePlayPause = async (uri: string) => {
    if (isPlaying && currentAudioUri === uri) {
      await playingSound?.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (playingSound && currentAudioUri !== uri) {
      await playingSound.unloadAsync();
      setPlayingSound(null);
    }

    const sound = await playAudio(uri);
    if (sound) {
      setPlayingSound(sound);
      setCurrentAudioUri(uri);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentAudioUri(null);
        }
      });
    }
  };

  const handleSendBroadcast = async () => {
    if (!recordedAudioUri) {
      Alert.alert('هەڵە', 'تکایە دەنگێک تۆمار بکە');
      return;
    }

    if (!title.trim()) {
      Alert.alert('هەڵە', 'تکایە ناونیشانێک بنووسە');
      return;
    }

    let recipients: BroadcastRecipient[] = [];
    let recipientIds: string[] = [];

    if (recipientType === 'all') {
      recipients = debtors.map((d: any) => ({
        id: d.id,
        name: d.name,
        phoneNumber: d.phoneNumber || '',
        delivered: false,
        listened: false,
      }));
      recipientIds = debtors.map((d) => d.id);
    } else if (recipientType === 'overdue') {
      const overdueDebtors = debtors.filter((d: any) => d.totalDebt > 0);
      recipients = overdueDebtors.map((d: any) => ({
        id: d.id,
        name: d.name,
        phoneNumber: d.phoneNumber || '',
        delivered: false,
        listened: false,
      }));
      recipientIds = overdueDebtors.map((d: any) => d.id);
    } else {
      if (selectedDebtorIds.length === 0) {
        Alert.alert('هەڵە', 'تکایە کەسێک هەڵبژێرە');
        return;
      }
      recipients = debtors
        .filter((d: any) => selectedDebtorIds.includes(d.id))
        .map((d: any) => ({
          id: d.id,
          name: d.name,
          phoneNumber: d.phoneNumber || '',
          delivered: false,
          listened: false,
        }));
      recipientIds = selectedDebtorIds;
    }

    const broadcast: VoiceBroadcast = {
      id: Date.now().toString(),
      title: title.trim(),
      audioUri: recordedAudioUri,
      duration: recordedDuration,
      recipientType,
      recipientIds,
      createdAt: new Date(),
      status: 'sent',
      listenerIds: [],
      deliveryCount: 0,
      listenCount: 0,
    };

    setSending(true);
    setSendProgress(0);

    await saveBroadcast(broadcast);

    const result = await sendBroadcast(broadcast, recipients, (progress) => {
      setSendProgress(progress);
    });

    setSending(false);

    Alert.alert(
      'سەرکەوتوو بوو',
      `پەیامی دەنگی بۆ ${result.success} کەس نێردرا`,
      [
        {
          text: 'باشە',
          onPress: () => {
            setTitle('');
            setRecordedAudioUri(null);
            setRecordedDuration(0);
            setRecordingDuration(0);
            setSelectedDebtorIds([]);
            loadBroadcasts();
            setShowHistory(true);
          },
        },
      ]
    );
  };

  const handleDeleteBroadcast = (id: string) => {
    Alert.alert('سڕینەوە', 'دڵنیای لە سڕینەوەی ئەم پەیامە؟', [
      { text: 'هەڵوەشاندنەوە', style: 'cancel' },
      {
        text: 'سڕینەوە',
        style: 'destructive',
        onPress: async () => {
          await deleteBroadcast(id);
          loadBroadcasts();
        },
      },
    ]);
  };

  const isDark = settings.theme === 'dark';
  const bgColor = isDark ? '#0F172A' : '#F8FAFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textColor = isDark ? '#F1F5F9' : '#1E293B';
  const subtextColor = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? '#334155' : '#E2E8F0';

  const totalBroadcasts = broadcasts.length;
  const totalRecipients = broadcasts.reduce((sum, b) => sum + b.deliveryCount, 0);
  const totalListeners = broadcasts.reduce((sum, b) => sum + b.listenCount, 0);
  const avgListenRate =
    totalRecipients > 0 ? ((totalListeners / totalRecipients) * 100).toFixed(1) : '0';

  const recipientTypes = [
    { key: 'all' as const, label: 'هەموو کڕیارەکان', icon: Users, count: debtors.length },
    {
      key: 'overdue' as const,
      label: 'قەرزدارەکان',
      icon: AlertCircle,
      count: debtors.filter((d: any) => d.totalDebt > 0).length,
    },
    { key: 'selected' as const, label: 'هەڵبژاردن', icon: CheckCircle, count: selectedDebtorIds.length },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ fontSize: 28, color: textColor }}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <Radio size={24} color="#EF4444" />
            <Text style={[styles.headerTitle, { color: textColor }]}>پەیامی دەنگی ڕاستەوخۆ</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: subtextColor }]}>ناردنی دەنگ بە کۆمەڵ</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showHistory ? (
          <View>
            <View style={[styles.statsContainer, { backgroundColor: cardBg }]}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#EF444410' }]}>
                  <Radio size={20} color="#EF4444" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{totalBroadcasts}</Text>
                <Text style={[styles.statLabel, { color: subtextColor }]}>پەیام</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#3B82F610' }]}>
                  <Users size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{totalRecipients}</Text>
                <Text style={[styles.statLabel, { color: subtextColor }]}>وەرگر</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#10B98110' }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: textColor }]}>{avgListenRate}%</Text>
                <Text style={[styles.statLabel, { color: subtextColor }]}>گوێگرتن</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>ناونیشان</Text>
              <TextInput
                style={[styles.input, { backgroundColor: bgColor, color: textColor, borderColor }]}
                value={title}
                onChangeText={setTitle}
                placeholder="ناونیشانی پەیام"
                placeholderTextColor={subtextColor}
              />
            </View>

            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.sectionHeader}>
                <Mic size={20} color="#EF4444" />
                <Text style={[styles.sectionTitle, { color: textColor }]}>تۆمارکردنی دەنگ</Text>
              </View>

              <View style={styles.recordingContainer}>
                <Animated.View
                  style={[
                    styles.recordButton,
                    {
                      backgroundColor: isRecording ? '#EF4444' : '#10B981',
                      transform: [{ scale: isRecording ? pulseAnim : 1 }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={isRecording ? handleStopRecording : handleStartRecording}
                    style={styles.recordButtonInner}
                    disabled={sending}
                  >
                    {isRecording ? (
                      <Square size={32} color="white" fill="white" />
                    ) : (
                      <Mic size={32} color="white" />
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.recordingInfo}>
                  <Text style={[styles.recordingTime, { color: isRecording ? '#EF4444' : textColor }]}>
                    {formatDuration(recordingDuration)}
                  </Text>
                  <Text style={[styles.recordingStatus, { color: subtextColor }]}>
                    {isRecording ? 'تۆمارکردن...' : recordedAudioUri ? 'ئامادەیە بۆ ناردن' : 'لێرە دابگرە'}
                  </Text>
                </View>
              </View>

              {recordedAudioUri && (
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: bgColor }]}
                  onPress={() => handlePlayPause(recordedAudioUri)}
                >
                  {isPlaying && currentAudioUri === recordedAudioUri ? (
                    <Pause size={20} color="#3B82F6" />
                  ) : (
                    <Play size={20} color="#3B82F6" />
                  )}
                  <Text style={[styles.playButtonText, { color: textColor }]}>
                    {isPlaying && currentAudioUri === recordedAudioUri ? 'وەستان' : 'گوێگرتن'}
                  </Text>
                  <Text style={[styles.durationText, { color: subtextColor }]}>
                    {formatDuration(recordedDuration)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.sectionHeader}>
                <Users size={20} color="#3B82F6" />
                <Text style={[styles.sectionTitle, { color: textColor }]}>وەرگرەکان</Text>
              </View>

              <View style={styles.recipientTypes}>
                {recipientTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = recipientType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.recipientTypeCard,
                        {
                          backgroundColor: isSelected ? '#3B82F610' : bgColor,
                          borderColor: isSelected ? '#3B82F6' : borderColor,
                        },
                      ]}
                      onPress={() => setRecipientType(type.key)}
                    >
                      <Icon size={24} color={isSelected ? '#3B82F6' : subtextColor} />
                      <Text
                        style={[
                          styles.recipientTypeLabel,
                          { color: isSelected ? '#3B82F6' : textColor },
                        ]}
                      >
                        {type.label}
                      </Text>
                      <Text style={[styles.recipientTypeCount, { color: subtextColor }]}>
                        {type.count} کەس
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: recordedAudioUri && title ? '#10B981' : '#64748B' },
              ]}
              onPress={handleSendBroadcast}
              disabled={!recordedAudioUri || !title || sending}
            >
              {sending ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.sendButtonText}>ناردن... {Math.round(sendProgress * 100)}%</Text>
                </>
              ) : (
                <>
                  <Send size={20} color="white" />
                  <Text style={styles.sendButtonText}>ناردنی پەیامی دەنگی</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.historyButton, { backgroundColor: bgColor, borderColor }]}
              onPress={() => setShowHistory(true)}
            >
              <Clock size={20} color="#3B82F6" />
              <Text style={[styles.historyButtonText, { color: textColor }]}>مێژووی پەیامەکان</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              style={[styles.backToRecordButton, { backgroundColor: cardBg, borderColor }]}
              onPress={() => setShowHistory(false)}
            >
              <Text style={{ fontSize: 20, color: textColor }}>→</Text>
              <Text style={[styles.backToRecordText, { color: textColor }]}>گەڕانەوە بۆ تۆمارکردن</Text>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
            ) : broadcasts.length === 0 ? (
              <View style={styles.emptyState}>
                <Radio size={64} color={subtextColor} />
                <Text style={[styles.emptyText, { color: subtextColor }]}>هیچ پەیامێک نییە</Text>
              </View>
            ) : (
              broadcasts.map((broadcast) => (
                <View key={broadcast.id} style={[styles.broadcastCard, { backgroundColor: cardBg }]}>
                  <View style={styles.broadcastHeader}>
                    <View style={styles.broadcastTitleRow}>
                      <Radio size={16} color="#EF4444" />
                      <Text style={[styles.broadcastTitle, { color: textColor }]}>{broadcast.title}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteBroadcast(broadcast.id)}>
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.broadcastInfo}>
                    <View style={styles.broadcastInfoItem}>
                      <Clock size={14} color={subtextColor} />
                      <Text style={[styles.broadcastInfoText, { color: subtextColor }]}>
                        {formatDuration(broadcast.duration)}
                      </Text>
                    </View>
                    <View style={styles.broadcastInfoItem}>
                      <Users size={14} color={subtextColor} />
                      <Text style={[styles.broadcastInfoText, { color: subtextColor }]}>
                        {broadcast.deliveryCount} کەس
                      </Text>
                    </View>
                    <View style={styles.broadcastInfoItem}>
                      <Calendar size={14} color={subtextColor} />
                      <Text style={[styles.broadcastInfoText, { color: subtextColor }]}>
                        {new Date(broadcast.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.playBroadcastButton, { backgroundColor: bgColor }]}
                    onPress={() => handlePlayPause(broadcast.audioUri)}
                  >
                    {isPlaying && currentAudioUri === broadcast.audioUri ? (
                      <Pause size={16} color="#3B82F6" />
                    ) : (
                      <Play size={16} color="#3B82F6" />
                    )}
                    <Text style={[styles.playBroadcastButtonText, { color: textColor }]}>
                      {isPlaying && currentAudioUri === broadcast.audioUri ? 'وەستان' : 'گوێگرتن'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    textAlign: 'right',
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    alignItems: 'center',
  },
  recordingTime: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  recordingStatus: {
    fontSize: 14,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  playButtonText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  durationText: {
    fontSize: 13,
  },
  recipientTypes: {
    gap: 12,
  },
  recipientTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  recipientTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  recipientTypeCount: {
    fontSize: 13,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    marginBottom: 80,
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backToRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  backToRecordText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  broadcastCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  broadcastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  broadcastTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  broadcastTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  broadcastInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  broadcastInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  broadcastInfoText: {
    fontSize: 12,
  },
  playBroadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  playBroadcastButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
