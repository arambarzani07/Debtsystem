import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface VoiceRecording {
  uri: string;
  duration: number;
}

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<boolean> {
  try {
    console.log('Requesting audio permissions...');
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Audio permission denied');
      return false;
    }

    console.log('Setting audio mode...');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    console.log('Starting recording...');
    recording = new Audio.Recording();
    
    const recordingOptions = {
      android: {
        extension: '.m4a' as const,
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav' as const,
        outputFormat: Audio.IOSOutputFormat.LINEARPCM,
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 44100,
        numberOfChannels: 2,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {},
    };

    await recording.prepareToRecordAsync(recordingOptions);
    await recording.startAsync();
    console.log('Recording started');
    return true;
  } catch (error) {
    console.error('Failed to start recording:', error);
    recording = null;
    return false;
  }
}

export async function stopRecording(): Promise<VoiceRecording | null> {
  try {
    if (!recording) {
      console.log('No recording in progress');
      return null;
    }

    console.log('Stopping recording...');
    await recording.stopAndUnloadAsync();
    
    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    }

    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    
    recording = null;

    if (!uri) {
      console.log('No recording URI');
      return null;
    }

    console.log('Recording stopped:', uri);
    return {
      uri,
      duration: status.durationMillis || 0,
    };
  } catch (error) {
    console.error('Failed to stop recording:', error);
    recording = null;
    return null;
  }
}

export async function transcribeAudio(audioUri: string): Promise<string | null> {
  try {
    console.log('Starting transcription for:', audioUri);
    
    const formData = new FormData();
    
    const uriParts = audioUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    const audioFile = {
      uri: audioUri,
      name: `recording.${fileType}`,
      type: `audio/${fileType}`,
    } as any;

    formData.append('audio', audioFile);

    const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Transcription failed:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    console.log('Transcription result:', result);
    return result.text || null;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
}

export async function recordAndTranscribe(): Promise<string | null> {
  const started = await startRecording();
  if (!started) {
    return null;
  }

  return new Promise((resolve) => {
    setTimeout(async () => {
      const voiceRecording = await stopRecording();
      if (!voiceRecording) {
        resolve(null);
        return;
      }

      const transcription = await transcribeAudio(voiceRecording.uri);
      resolve(transcription);
    }, 5000);
  });
}
