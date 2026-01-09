import { Platform, Linking, Share, Alert } from 'react-native';
import * as StoreReview from 'expo-store-review';

export async function rateApp() {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    
    if (isAvailable) {
      await StoreReview.requestReview();
    } else {
      const storeUrl = Platform.select({
        ios: 'https://apps.apple.com/app/id123456789',
        android: 'https://play.google.com/store/apps/details?id=app.rork.qarzi_rekxistin_sistema_911jsfqu_uiaf33is',
        default: 'https://rork.app',
      });
      
      await Linking.openURL(storeUrl);
    }
  } catch (error) {
    console.error('Error opening store review:', error);
    Alert.alert('هەڵە', 'نەتوانرا پەیجی هەڵسەنگاندن بکرێتەوە');
  }
}

export async function shareApp() {
  try {
    const message = 'سیستەمی بەڕێوەبردنی قەرز - باشترین ئەپ بۆ بەڕێوەبردنی قەرز و کڕیاران';
    const url = Platform.select({
      ios: 'https://apps.apple.com/app/id123456789',
      android: 'https://play.google.com/store/apps/details?id=app.rork.qarzi_rekxistin_sistema_911jsfqu_uiaf33is',
      default: 'https://rork.app',
    });

    const result = await Share.share({
      message: `${message}\n\n${url}`,
      url: url,
      title: 'سیستەمی بەڕێوەبردنی قەرز',
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else {
        console.log('Shared successfully');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing app:', error);
    Alert.alert('هەڵە', 'نەتوانرا ئەپەکە هاوبەش بکرێت');
  }
}
