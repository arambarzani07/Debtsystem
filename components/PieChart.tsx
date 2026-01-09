import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

interface PieChartDataItem {
  value: number;
  label: string;
  color: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  size?: number;
}

export function PieChart({ data, size = 200 }: PieChartProps) {
  const radius = size / 2;
  const strokeWidth = 40;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>هیچ داتایەک نییە</Text>
      </View>
    );
  }
  
  let currentAngle = -90;
  
  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G rotation={0} origin={`${radius}, ${radius}`}>
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
            const rotation = currentAngle;
            
            currentAngle += angle;
            
            return (
              <Circle
                key={index}
                cx={radius}
                cy={radius}
                r={innerRadius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={dashArray}
                rotation={rotation}
                origin={`${radius}, ${radius}`}
                strokeLinecap="round"
              />
            );
          })}
        </G>
        <SvgText
          x={radius}
          y={radius - 10}
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill="#F1F5F9"
        >
          {total.toLocaleString()}
        </SvgText>
        <SvgText
          x={radius}
          y={radius + 15}
          textAnchor="middle"
          fontSize="14"
          fill="#94A3B8"
        >
          کۆی گشتی
        </SvgText>
      </Svg>
      
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendValue}>{item.value.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 24,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
  },
  legend: {
    gap: 12,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 15,
    color: '#CBD5E1',
    textAlign: 'right',
  },
  legendValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#F1F5F9',
  },
});
