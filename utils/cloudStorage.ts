import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Debtor } from '@/types';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { safeJSONParse } from './storageRecovery';

// Conditionally import expo-auth-session only on native platforms
let AuthSession: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    AuthSession = require('expo-auth-session');
  } catch (error) {
    console.warn('expo-auth-session not available:', error);
  }
}

const CLOUD_SYNC_KEY = 'cloud_sync_settings';
const LAST_SYNC_KEY = 'last_cloud_sync';
const SYNC_QUEUE_KEY = 'cloud_sync_queue';
const GOOGLE_AUTH_KEY = 'google_auth_token';
const GOOGLE_USER_KEY = 'google_user_info';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export interface CloudSyncSettings {
  enabled: boolean;
  provider: 'gdrive' | 'icloud' | 'none';
  autoSync: boolean;
  syncInterval: number;
  lastSyncTime?: string;
  googleConnected?: boolean;
  googleUserEmail?: string;
  googleUserName?: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

const getDefaultSettings = (): CloudSyncSettings => ({
  enabled: false,
  provider: 'none',
  autoSync: false,
  syncInterval: 30,
});

export const getCloudSyncSettings = async (): Promise<CloudSyncSettings> => {
  try {
    const settings = await AsyncStorage.getItem(CLOUD_SYNC_KEY);
    return await safeJSONParse<CloudSyncSettings>(settings, getDefaultSettings());
  } catch (error) {
    console.error('Error getting cloud sync settings:', error);
    return getDefaultSettings();
  }
};

export const saveCloudSyncSettings = async (settings: CloudSyncSettings): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(CLOUD_SYNC_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving cloud sync settings:', error);
    return false;
  }
};

export const addToSyncQueue = async (action: SyncQueueItem['action'], data: any): Promise<boolean> => {
  try {
    const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue: SyncQueueItem[] = await safeJSONParse<SyncQueueItem[]>(queueData, []);
    
    queue.push({
      id: Date.now().toString(),
      action,
      data,
      timestamp: new Date().toISOString(),
    });
    
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    return false;
  }
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  try {
    const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return await safeJSONParse<SyncQueueItem[]>(queueData, []);
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

export const clearSyncQueue = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing sync queue:', error);
    return false;
  }
};

export const uploadToGoogleDrive = async (debtors: Debtor[], accessToken: string): Promise<boolean> => {
  try {
    if (!accessToken || accessToken.startsWith('demo_token_')) {
      console.error('Invalid or demo Google access token');
      throw new Error('تکایە سەرەتا بە Google بەستەرەوە');
    }

    const data = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: debtors,
    });

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";

    const metadata = {
      name: 'debt_backup.json',
      mimeType: 'application/json',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      data +
      closeDelim;

    const existingFileId = await findGoogleDriveBackupFile(accessToken);

    let response;
    if (existingFileId) {
      response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );
    } else {
      response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Drive upload error:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.code === 401) {
          throw new Error('دەستپێڕاگەیشتنی Google بەسەرچووە، تکایە دووبارە بەستەرەوە بە Google');
        }
      } catch {
        // Ignore parse error
      }
      throw new Error('هەڵە لە بارکردنی زانیاریەکان بۆ Google Drive');
    }

    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    console.log('✅ Successfully uploaded to Google Drive');
    return true;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    return false;
  }
};

const findGoogleDriveBackupFile = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name='debt_backup.json'&spaces=drive&fields=files(id,name)",
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding Google Drive backup file:', error);
    return null;
  }
};

export const downloadFromGoogleDrive = async (accessToken: string): Promise<Debtor[] | null> => {
  try {
    if (!accessToken || accessToken.startsWith('demo_token_')) {
      console.error('Invalid or demo Google access token');
      throw new Error('تکایە سەرەتا بە Google بەستەرەوە');
    }

    const fileId = await findGoogleDriveBackupFile(accessToken);
    
    if (!fileId) {
      console.log('No backup file found on Google Drive');
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Drive download error:', errorText);
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.code === 401) {
          throw new Error('دەستپێڕاگەیشتنی Google بەسەرچووە، تکایە دووبارە بەستەرەوە بە Google');
        }
      } catch {
        // Ignore parse error
      }
      throw new Error('هەڵە لە داگرتنی زانیاریەکان لە Google Drive');
    }

    const data = await response.text();
    const backup = await safeJSONParse<any>(data, null);
    
    if (!backup) {
      console.error('Failed to parse Google Drive backup');
      return null;
    }
    
    console.log('✅ Successfully downloaded from Google Drive');
    return backup.data || null;
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    return null;
  }
};

export const uploadToCloud = async (
  debtors: Debtor[],
  provider: 'gdrive' | 'icloud'
): Promise<boolean> => {
  try {
    if (provider === 'gdrive') {
      const accessToken = await getGoogleAuthToken();
      if (!accessToken) {
        console.error('No Google access token available');
        return false;
      }
      return await uploadToGoogleDrive(debtors, accessToken);
    }

    const data = JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: debtors,
    });
    
    await AsyncStorage.setItem(`cloud_backup_${provider}`, data);
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error uploading to cloud:', error);
    return false;
  }
};

export const downloadFromCloud = async (
  provider: 'gdrive' | 'icloud'
): Promise<Debtor[] | null> => {
  try {
    if (provider === 'gdrive') {
      const accessToken = await getGoogleAuthToken();
      if (!accessToken) {
        console.error('No Google access token available');
        return null;
      }
      return await downloadFromGoogleDrive(accessToken);
    }

    const data = await AsyncStorage.getItem(`cloud_backup_${provider}`);
    if (!data) return null;
    
    const backup = await safeJSONParse<any>(data, null);
    if (!backup) return null;
    return backup.data || null;
  } catch (error) {
    console.error('Error downloading from cloud:', error);
    return null;
  }
};

export const syncWithCloud = async (
  localData: Debtor[],
  provider: 'gdrive' | 'icloud'
): Promise<{ success: boolean; data?: Debtor[]; merged?: boolean }> => {
  try {
    const cloudData = await downloadFromCloud(provider);
    
    if (!cloudData) {
      await uploadToCloud(localData, provider);
      return { success: true, data: localData };
    }
    
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const mergedData = mergeData(localData, cloudData, lastSync || undefined);
    
    await uploadToCloud(mergedData, provider);
    
    return { success: true, data: mergedData, merged: true };
  } catch (error) {
    console.error('Error syncing with cloud:', error);
    return { success: false };
  }
};

const mergeData = (
  localData: Debtor[],
  cloudData: Debtor[],
  lastSyncTime?: string
): Debtor[] => {
  const merged = new Map<string, Debtor>();
  
  cloudData.forEach(debtor => {
    merged.set(debtor.id, debtor);
  });
  
  localData.forEach(debtor => {
    const existing = merged.get(debtor.id);
    
    if (!existing) {
      merged.set(debtor.id, debtor);
    } else {
      const localDate = new Date(debtor.createdAt).getTime();
      const cloudDate = new Date(existing.createdAt).getTime();
      
      if (localDate > cloudDate) {
        merged.set(debtor.id, debtor);
      } else if (localDate === cloudDate) {
        merged.set(debtor.id, {
          ...existing,
          transactions: [...existing.transactions, ...debtor.transactions].filter(
            (transaction, index, self) =>
              index === self.findIndex(t => t.id === transaction.id)
          ),
        });
      }
    }
  });
  
  return Array.from(merged.values());
};

export const checkSyncNeeded = async (intervalMinutes: number): Promise<boolean> => {
  try {
    const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
    
    if (!lastSync) return true;
    
    const lastSyncTime = new Date(lastSync).getTime();
    const now = new Date().getTime();
    const diffMinutes = (now - lastSyncTime) / (1000 * 60);
    
    return diffMinutes >= intervalMinutes;
  } catch (error) {
    console.error('Error checking sync needed:', error);
    return false;
  }
};

const DEMO_MODE = false;

export interface GoogleAuthResult {
  success: boolean;
  accessToken?: string;
  email?: string;
  name?: string;
  error?: string;
}

export const authenticateWithGoogle = async (): Promise<GoogleAuthResult> => {
  try {
    if (DEMO_MODE) {
      const demoEmail = 'demo@gmail.com';
      const demoName = 'Demo User';
      const demoToken = `demo_token_${Date.now()}`;
      
      await AsyncStorage.setItem(GOOGLE_AUTH_KEY, demoToken);
      await AsyncStorage.setItem(GOOGLE_USER_KEY, JSON.stringify({
        email: demoEmail,
        name: demoName,
      }));
      
      return {
        success: true,
        accessToken: demoToken,
        email: demoEmail,
        name: demoName,
      };
    }

    // For web platform, use a web-based OAuth flow
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: 'Google authentication on web is not yet implemented. Please use a native platform.',
      };
    }

    // For native platforms, use expo-auth-session
    if (!AuthSession) {
      return {
        success: false,
        error: 'expo-auth-session is not available. Please install it: bun add expo-auth-session',
      };
    }

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'myapp',
    });

    console.log('Redirect URI:', redirectUri);

    const clientId = Platform.select({
      ios: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
      default: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    });

    const request = new AuthSession.AuthRequest({
      clientId: clientId!,
      scopes: ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
      redirectUri,
      prompt: AuthSession.Prompt.SelectAccount,
      usePKCE: true,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params.code) {
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: clientId!,
          code: result.params.code,
          redirectUri,
          extraParams: request.codeVerifier ? {
            code_verifier: request.codeVerifier,
          } : undefined,
        },
        discovery
      );

      if (tokenResponse?.accessToken) {
        await AsyncStorage.setItem(GOOGLE_AUTH_KEY, tokenResponse.accessToken);
        
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
        });
        
        const userInfo = await userInfoResponse.json();
        await AsyncStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(userInfo));
        
        return {
          success: true,
          accessToken: tokenResponse.accessToken,
          email: userInfo.email,
          name: userInfo.name,
        };
      }
    }

    return {
      success: false,
      error: 'Failed to get access token',
    };
  } catch (error) {
    console.error('Google authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getGoogleAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(GOOGLE_AUTH_KEY);
  } catch (error) {
    console.error('Error getting Google auth token:', error);
    return null;
  }
};

export const getGoogleUserInfo = async (): Promise<{ email?: string; name?: string } | null> => {
  try {
    const userInfo = await AsyncStorage.getItem(GOOGLE_USER_KEY);
    return await safeJSONParse<{ email?: string; name?: string } | null>(userInfo, null);
  } catch (error) {
    console.error('Error getting Google user info:', error);
    return null;
  }
};

export const disconnectGoogle = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(GOOGLE_AUTH_KEY);
    await AsyncStorage.removeItem(GOOGLE_USER_KEY);
    return true;
  } catch (error) {
    console.error('Error disconnecting Google:', error);
    return false;
  }
};
