import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useStories } from '@/contexts/StoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Image, Type, Check, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

const COLOR_PRESETS = [
  { background: '#1F2937', text: '#FFFFFF', name: 'داکن' },
  { background: '#EF4444', text: '#FFFFFF', name: 'سوور' },
  { background: '#F59E0B', text: '#FFFFFF', name: 'نارنجی' },
  { background: '#10B981', text: '#FFFFFF', name: 'سەوز' },
  { background: '#3B82F6', text: '#FFFFFF', name: 'شین' },
  { background: '#8B5CF6', text: '#FFFFFF', name: 'مۆر' },
  { background: '#EC4899', text: '#FFFFFF', name: 'پەمبەیی' },
  { background: '#FFFFFF', text: '#000000', name: 'سپی' },
];

export default function CreateStoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addStory, setContext } = useStories();
  const auth = useAuth();
  const { currentUser, getCurrentMarket } = auth;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [isCreating, setIsCreating] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);

  useEffect(() => {
    const market = getCurrentMarket();
    setContext(currentUser || null, market);
  }, [currentUser, getCurrentMarket, setContext]);

  const handleCreateStory = async () => {
    if (storyType === 'text' && !title.trim()) {
      if (Platform.OS === 'web') {
        alert('تکایە سەردێڕێک بنووسە');
      } else {
        Alert.alert('هەڵە', 'تکایە سەردێڕێک بنووسە');
      }
      return;
    }

    if (storyType === 'image' && !imageUrl.trim() && !selectedImage) {
      if (Platform.OS === 'web') {
        alert('تکایە وێنەیەک هەڵبژێرە یان لینکێک دابنێ');
      } else {
        Alert.alert('هەڵە', 'تکایە وێنەیەک هەڵبژێرە یان لینکێک دابنێ');
      }
      return;
    }

    try {
      setIsCreating(true);
      await addStory(
        title || 'ستۆری نوێ',
        content,
        storyType === 'image' ? (selectedImage || imageUrl) : undefined,
        undefined,
        selectedColor.background,
        selectedColor.text,
        24
      );

      if (Platform.OS === 'web') {
        alert('ستۆری بە سەرکەوتوویی دروست کرا');
      } else {
        Alert.alert('سەرکەوتوو بوو', 'ستۆری بە سەرکەوتوویی دروست کرا');
      }
      router.back();
    } catch (error) {
      console.error('Error creating story:', error);
      if (Platform.OS === 'web') {
        alert('کێشەیەک ڕوویدا لە دروستکردنی ستۆری');
      } else {
        Alert.alert('هەڵە', 'کێشەیەک ڕوویدا لە دروستکردنی ستۆری');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handlePickImage = async () => {
    try {
      setIsPickingImage(true);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        if (Platform.OS === 'web') {
          alert('پێویستە ڕێگە بدەیت بۆ دەستگەیشتن بە وێنەکان');
        } else {
          Alert.alert('ڕێگەپێدان پێویستە', 'پێویستە ڕێگە بدەیت بۆ دەستگەیشتن بە وێنەکان');
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setImageUrl('');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      if (Platform.OS === 'web') {
        alert('کێشەیەک ڕوویدا لە هەڵبژاردنی وێنە');
      } else {
        Alert.alert('هەڵە', 'کێشەیەک ڕوویدا لە هەڵبژاردنی وێنە');
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                {
                  backgroundColor: storyType === 'text' ? colors.primary : colors.card,
                  borderColor: storyType === 'text' ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => setStoryType('text')}
            >
              <Type size={24} color={storyType === 'text' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: storyType === 'text' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                نووسین
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                {
                  backgroundColor: storyType === 'image' ? colors.primary : colors.card,
                  borderColor: storyType === 'image' ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => setStoryType('image')}
            >
              <Image size={24} color={storyType === 'image' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.typeButtonText,
                  { color: storyType === 'image' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                وێنە
              </Text>
            </TouchableOpacity>
          </View>

          {storyType === 'text' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>سەردێڕ</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder },
                  ]}
                  placeholder="سەردێڕی ستۆری..."
                  placeholderTextColor={colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={60}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ناوەڕۆک</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder },
                  ]}
                  placeholder="ناوەڕۆکی ستۆری..."
                  placeholderTextColor={colors.textTertiary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={6}
                  maxLength={300}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ڕەنگی پاشبنەما</Text>
                <View style={styles.colorGrid}>
                  {COLOR_PRESETS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        {
                          backgroundColor: preset.background,
                          borderColor: selectedColor === preset ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setSelectedColor(preset)}
                    >
                      {selectedColor === preset && (
                        <Check size={20} color={preset.text} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.previewContainer}>
                <Text style={[styles.label, { color: colors.text, marginBottom: 12 }]}>پێشبینین</Text>
                <View
                  style={[
                    styles.preview,
                    { backgroundColor: selectedColor.background },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewTitle,
                      { color: selectedColor.text },
                    ]}
                    numberOfLines={2}
                  >
                    {title || 'سەردێڕی ستۆری'}
                  </Text>
                  <Text
                    style={[
                      styles.previewContent,
                      { color: selectedColor.text },
                    ]}
                    numberOfLines={5}
                  >
                    {content || 'ناوەڕۆکی ستۆری لێرە دەردەکەوێت...'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>هەڵبژاردنی وێنە</Text>
                
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                  onPress={handlePickImage}
                  disabled={isPickingImage}
                >
                  {isPickingImage ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <Upload size={32} color={colors.primary} />
                      <Text style={[styles.uploadButtonText, { color: colors.text }]}>
                        وێنەیەک لە مۆبایل هەڵبژێرە
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {selectedImage && (
                  <View style={styles.selectedImageContainer}>
                    <RNImage
                      source={{ uri: selectedImage }}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Text style={styles.removeImageText}>سڕینەوە</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>یان</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>لینکی وێنە</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder },
                  ]}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor={colors.textTertiary}
                  value={imageUrl}
                  onChangeText={(text) => {
                    setImageUrl(text);
                    if (text) setSelectedImage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!selectedImage}
                />
                <Text style={[styles.hint, { color: colors.textTertiary }]}>
                  بۆ نموونە: لە unsplash.com وێنەیەک هەڵبژێرە
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>ناونیشان (دڵخواز)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.card, color: colors.text, borderColor: colors.cardBorder },
                  ]}
                  placeholder="ناونیشانی وێنە..."
                  placeholderTextColor={colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={60}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={handleCreateStory}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>دروستکردنی ستۆری</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    textAlign: 'right',
  },
  textArea: {
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    textAlign: 'right',
    minHeight: 120,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  colorGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    marginBottom: 24,
  },
  preview: {
    borderRadius: 20,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'right',
  },
  previewContent: {
    fontSize: 14,
    opacity: 0.9,
    textAlign: 'right',
    lineHeight: 22,
  },
  createButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700' as const,
  },
  uploadButton: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  selectedImageContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  divider: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
