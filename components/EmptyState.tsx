import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  message: string;
  submessage?: string;
  icon?: React.ReactNode;
  textColor?: string;
  subtextColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  submessage, 
  icon, 
  textColor = '#6B7280', 
  subtextColor = '#9CA3AF' 
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
      {submessage && (
        <Text style={[styles.subtext, { color: subtextColor }]}>{submessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  iconContainer: {
    marginBottom: 16,
  },
  text: {
    fontSize: 24,
    fontWeight: '800' as const,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtext: {
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '500' as const,
    lineHeight: 24,
  },
});

export default EmptyState;
