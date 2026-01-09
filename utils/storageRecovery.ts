import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = [
  'users_data',
  'markets_data',
  'market_requests_data',
  'current_user',
  'app_stories',
  'telegram_config',
  'telegram_sent_messages',
  'REMINDERS_KEY',
  'notifications',
  'notification_templates',
  'scheduled_reminders',
  'savedPhone',
  'savedPassword',
  'rememberMe',
  'customerSavedPhone',
  'customerSavedPassword',
  'customerRememberMe',
];

export async function safeJSONParse<T = any>(data: string | null, fallback: T): Promise<T> {
  try {
    if (!data || data === 'undefined' || data === 'null') {
      return fallback;
    }
    
    if (typeof data !== 'string') {
      if (typeof data === 'object' && data !== null) {
        return data as T;
      }
      return fallback;
    }
    
    const trimmed = data.trim();
    if (trimmed === '') {
      return fallback;
    }
    
    if (trimmed === 'object Object' || trimmed === '[object Object]' || trimmed.includes('[object Object]')) {
      console.error('❌ INVALID DATA: [object Object] detected');
      console.error('Corrupted data:', trimmed.substring(0, 100));
      return fallback;
    }
    
    try {
      const parsed = JSON.parse(trimmed);
      return parsed as T;
    } catch (parseError) {
      console.error('❌ JSON PARSE ERROR:', parseError);
      console.error('Failed data (first 200 chars):', trimmed.substring(0, 200));
      console.error('Data length:', trimmed.length);
      return fallback;
    }
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR in safeJSONParse:', error);
    return fallback;
  }
}

export async function validateAndFixStorage(): Promise<void> {
  console.log('🔍 Starting storage validation...');
  let fixed = 0;
  let removed = 0;
  
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToCheck = [...new Set([...STORAGE_KEYS, ...allKeys.filter(key => key.startsWith('market_'))])];
    
    console.log(`📦 Checking ${keysToCheck.length} storage keys...`);
    
    for (const key of keysToCheck) {
      try {
        const stored = await AsyncStorage.getItem(key);
        
        if (!stored) {
          continue;
        }
        
        if (stored === 'undefined' || stored === 'null' || stored.trim() === '') {
          try {
            await AsyncStorage.removeItem(key);
            removed++;
          } catch (removeError) {
            console.error(`Failed to remove invalid ${key}:`, removeError);
          }
          continue;
        }
        
        if (stored === 'object Object' || stored === '[object Object]' || stored.includes('[object Object]')) {
          console.error(`❌ ${key}: [object Object] detected, removing...`);
          try {
            await AsyncStorage.removeItem(key);
            removed++;
            fixed++;
          } catch (removeError) {
            console.error(`Failed to remove corrupted ${key}:`, removeError);
          }
          continue;
        }
        
        try {
          JSON.parse(stored);
        } catch {
          console.error(`❌ ${key}: Invalid JSON, removing...`);
          console.error(`Data sample:`, stored.substring(0, 100));
          try {
            await AsyncStorage.removeItem(key);
            removed++;
            fixed++;
          } catch (removeError) {
            console.error(`Failed to remove invalid JSON ${key}:`, removeError);
          }
        }
      } catch (error) {
        console.error(`❌ Error validating ${key}:`, error);
      }
    }
    
    if (fixed > 0) {
      console.log(`✅ Storage validation complete: Fixed ${fixed} issues, removed ${removed} keys`);
    } else {
      console.log(`✅ Storage validation complete: All OK`);
    }
  } catch (error) {
    console.error('❌ Error during storage validation:', error);
  }
}

export async function clearAllMarketData(): Promise<void> {
  console.log('Clearing all market data...');
  
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const marketKeys = allKeys.filter(key => key.startsWith('market_'));
    
    if (marketKeys.length > 0) {
      await AsyncStorage.multiRemove(marketKeys);
      console.log(`Cleared ${marketKeys.length} market data entries`);
    }
  } catch (error) {
    console.error('Error clearing market data:', error);
  }
}

export async function clearAllStorage(): Promise<void> {
  console.log('Clearing all storage...');
  
  try {
    await AsyncStorage.clear();
    console.log('All storage cleared successfully');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

export async function safeSetItem(key: string, value: any): Promise<void> {
  try {
    if (value === null || value === undefined) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        console.error(`Error removing ${key}:`, removeError);
      }
      return;
    }
    
    let stringValue: string;
    
    if (typeof value === 'string') {
      if (value === '[object Object]' || value.includes('[object Object]')) {
        console.error(`❌ Attempted to save [object Object] to ${key}`);
        throw new Error('Cannot save [object Object] to storage');
      }
      stringValue = value;
    } else if (typeof value === 'object') {
      try {
        stringValue = JSON.stringify(value);
      } catch (stringifyError) {
        console.error(`❌ Failed to stringify object for ${key}:`, stringifyError);
        throw new Error(`Cannot serialize object for ${key}`);
      }
    } else {
      stringValue = String(value);
    }
    
    try {
      JSON.parse(stringValue);
    } catch {
      if (typeof value === 'object') {
        console.error(`❌ Invalid JSON for ${key}:`, value);
        throw new Error(`Cannot serialize object for ${key}`);
      }
    }
    
    try {
      await AsyncStorage.setItem(key, stringValue);
    } catch (setError) {
      console.error(`❌ AsyncStorage.setItem failed for ${key}:`, setError);
      throw setError;
    }
  } catch (error) {
    console.error(`❌ Error in safeSetItem for ${key}:`, error);
    throw error;
  }
}

export async function safeGetItem<T = any>(key: string, fallback: T): Promise<T> {
  try {
    const stored = await AsyncStorage.getItem(key);
    return await safeJSONParse<T>(stored, fallback);
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return fallback;
  }
}
