import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface VoiceBroadcast {
  id: string;
  title: string;
  audioUri: string;
  duration: number;
  recipientType: 'all' | 'selected' | 'overdue' | 'group';
  recipientIds: string[];
  scheduledTime?: Date;
  createdAt: Date;
  sentAt?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  listenerIds: string[];
  deliveryCount: number;
  listenCount: number;
}

export interface BroadcastRecipient {
  id: string;
  name: string;
  phoneNumber: string;
  delivered: boolean;
  listened: boolean;
  listenedAt?: Date;
}

const STORAGE_KEY = '@voice_broadcasts';

export const initializeAudioDirectory = async () => {
  console.log('Audio directory initialized');
};

export const requestAudioPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return true;
    }
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting audio permissions:', error);
    return false;
  }
};

export const startRecording = async (): Promise<Audio.Recording | null> => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    await recording.startAsync();
    return recording;
  } catch (error) {
    console.error('Error starting recording:', error);
    return null;
  }
};

export const stopRecording = async (
  recording: Audio.Recording
): Promise<{ uri: string; duration: number } | null> => {
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    
    if (!uri) return null;

    const duration = 'durationMillis' in status ? (status.durationMillis || 0) / 1000 : 0;

    return { uri, duration };
  } catch (error) {
    console.error('Error stopping recording:', error);
    return null;
  }
};

export const playAudio = async (uri: string): Promise<Audio.Sound | null> => {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
    return sound;
  } catch (error) {
    console.error('Error playing audio:', error);
    return null;
  }
};

export const saveBroadcast = async (
  broadcast: VoiceBroadcast
): Promise<void> => {
  try {
    const broadcasts = await getBroadcasts();
    const updated = [broadcast, ...broadcasts];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving broadcast:', error);
  }
};

export const getBroadcasts = async (): Promise<VoiceBroadcast[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const broadcasts = JSON.parse(data);
    return broadcasts.map((b: any) => ({
      ...b,
      createdAt: new Date(b.createdAt),
      scheduledTime: b.scheduledTime ? new Date(b.scheduledTime) : undefined,
      sentAt: b.sentAt ? new Date(b.sentAt) : undefined,
    }));
  } catch (error) {
    console.error('Error getting broadcasts:', error);
    return [];
  }
};

export const updateBroadcast = async (
  id: string,
  updates: Partial<VoiceBroadcast>
): Promise<void> => {
  try {
    const broadcasts = await getBroadcasts();
    const updated = broadcasts.map((b) => (b.id === id ? { ...b, ...updates } : b));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating broadcast:', error);
  }
};

export const deleteBroadcast = async (id: string): Promise<void> => {
  try {
    const broadcasts = await getBroadcasts();
    const filtered = broadcasts.filter((b) => b.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting broadcast:', error);
  }
};

export const sendBroadcast = async (
  broadcast: VoiceBroadcast,
  recipients: BroadcastRecipient[],
  onProgress?: (progress: number) => void
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      success++;
      onProgress?.((i + 1) / recipients.length);
    } catch {
      failed++;
    }
  }

  await updateBroadcast(broadcast.id, {
    status: 'sent',
    sentAt: new Date(),
    deliveryCount: success,
  });

  return { success, failed };
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getStorageSize = async (): Promise<number> => {
  return 0;
};
