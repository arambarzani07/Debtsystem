import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, CreditCard, BarChart3, Shield, ArrowRight, ArrowLeft } from 'lucide-react-native';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'بەخێربێیت!',
    description: 'سیستەمێکی تەواو بۆ بەڕێوەبردنی قەرز و کڕیاران. بە ئاسانی قەرزەکانت بەڕێوە ببە و کاتت دابگرە.',
    icon: <Users size={80} color="#60A5FA" />,
    color: '#60A5FA',
  },
  {
    title: 'بەڕێوەبردنی قەرز',
    description: 'کڕیار زیاد بکە، قەرز و پارەدان تۆمار بکە، و هەموو مامەڵەکان لە یەک شوێندا ببینە.',
    icon: <CreditCard size={80} color="#34D399" />,
    color: '#34D399',
  },
  {
    title: 'ڕاپۆرت و ئامار',
    description: 'ڕاپۆرتی پێشکەوتوو دروست بکە و ئامار ببینە بۆ بڕیاری باشتر.',
    icon: <BarChart3 size={80} color="#F59E0B" />,
    color: '#F59E0B',
  },
  {
    title: 'پارێزراو و دڵنیا',
    description: 'هەموو زانیاریەکانت بە شێوەیەکی پارێزراو هەڵدەگیرێت. دەتوانیت Face ID/Fingerprint بەکاربهێنیت.',
    icon: <Shield size={80} color="#8B5CF6" />,
    color: '#8B5CF6',
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/');
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/');
  };

  const step = steps[currentStep];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>پەڕاندن</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {step.icon}
        </View>

        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && { backgroundColor: step.color, width: 24 },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonsContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton]}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: step.color }]}
          >
            {currentStep === steps.length - 1 ? (
              <Text style={styles.nextButtonText}>دەست پێبکە</Text>
            ) : (
              <>
                <Text style={styles.nextButtonText}>دواتر</Text>
                <ArrowRight size={24} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    padding: 20,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    color: '#CBD5E1',
    textAlign: 'center' as const,
    lineHeight: 28,
  },
  footer: {
    padding: 32,
  },
  dotsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 56,
    borderRadius: 28,
    marginLeft: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginHorizontal: 8,
  },
});
