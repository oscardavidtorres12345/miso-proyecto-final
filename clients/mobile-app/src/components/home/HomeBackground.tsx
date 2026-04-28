import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Rect } from 'react-native-svg';

const ELLIPSE_RGB = '125, 161, 13';
const SPACING = 1000;
const ELLIPSE_RADIUS = 359;
const ELLIPSE_OFFSET = 59;
const ELLIPSE_DIAMETER = ELLIPSE_RADIUS * 2;

interface Props {
  contentHeight?: number;
}

export function HomeBackground({ contentHeight }: Props) {
  const { width, height } = useWindowDimensions();
  const canvasHeight = Math.max(height, contentHeight ?? 0);
  const circleCount = Math.ceil(canvasHeight / SPACING) + 1;

  return (
    <View style={[styles.container, { height: canvasHeight }]} pointerEvents="none">
      <Svg
        width={width}
        height={canvasHeight}
        style={styles.svg}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={`rgb(${ELLIPSE_RGB})`} stopOpacity={0.36} />
            <Stop offset="38%" stopColor={`rgb(${ELLIPSE_RGB})`} stopOpacity={0.16} />
            <Stop offset="72%" stopColor={`rgb(${ELLIPSE_RGB})`} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={`rgb(${ELLIPSE_RGB})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={canvasHeight} fill="#fefefe" />
        {Array.from({ length: circleCount }, (_, i) => {
          const isLeft = i % 2 === 0;
          const leftPx = isLeft ? -ELLIPSE_OFFSET : width - ELLIPSE_DIAMETER + ELLIPSE_OFFSET;
          return (
            <Circle
              key={i}
              cx={leftPx + ELLIPSE_RADIUS}
              cy={i * SPACING + SPACING / 2}
              r={ELLIPSE_RADIUS}
              fill="url(#glow)"
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
