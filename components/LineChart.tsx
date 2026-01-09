import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Line, Circle, Text as SvgText, G, Polyline } from 'react-native-svg';

export interface LineChartDataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = Dimensions.get('window').width - 80,
  height = 200,
  color = '#60A5FA',
  showGrid = true,
  showLabels = true,
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>هیچ زانیارییەک نییە</Text>
      </View>
    );
  }

  const padding = { top: 20, right: 10, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, value: point.value, label: point.label };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    const value = maxValue - (valueRange / 4) * i;
    gridLines.push({ y, value });
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {showGrid && gridLines.map((line, i) => (
          <G key={i}>
            <Line
              x1={padding.left}
              y1={line.y}
              x2={width - padding.right}
              y2={line.y}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
            <SvgText
              x={padding.left - 10}
              y={line.y + 5}
              fill="#94A3B8"
              fontSize="10"
              textAnchor="end"
            >
              {Math.round(line.value).toLocaleString()}
            </SvgText>
          </G>
        ))}

        <Polyline
          points={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, i) => (
          <G key={i}>
            <Circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              stroke="#1E293B"
              strokeWidth="2"
            />
            {showLabels && i % Math.ceil(data.length / 6) === 0 && (
              <SvgText
                x={point.x}
                y={height - padding.bottom + 20}
                fill="#94A3B8"
                fontSize="10"
                textAnchor="middle"
              >
                {point.label}
              </SvgText>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});
