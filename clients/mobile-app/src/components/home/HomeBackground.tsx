import React, { useId, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Rect } from 'react-native-svg';

const ELLIPSE_RGB = '125, 161, 13';
const GLOW_COLOR = `rgb(${ELLIPSE_RGB})`;
const SPACING = 1000;
const ELLIPSE_RADIUS = 608;

interface Props {
  contentHeight?: number;
}

export function HomeBackground({ contentHeight }: Props) {
  const { width, height } = useWindowDimensions();
  const gradientId = useId();
  const canvasHeight = Math.max(height, contentHeight ?? 0);
  const circleCount = Math.ceil(canvasHeight / SPACING) + 1;
  const circles = useMemo(
    () =>
      Array.from({ length: circleCount }, (_, i) => ({
        key: i,
        centerX: i % 2 === 0 ? width * 1.25 : width * -0.25,
        centerY: i * SPACING + SPACING / 2,
      })),
    [circleCount, width],
  );

  return (
    <View style={[styles.container, { height: canvasHeight }]} pointerEvents="none">
      <Svg
        width={width}
        height={canvasHeight}
        style={styles.svg}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={GLOW_COLOR} stopOpacity={0.95} />
            <Stop offset="30%" stopColor={GLOW_COLOR} stopOpacity={0.60} />
            <Stop offset="58%" stopColor={GLOW_COLOR} stopOpacity={0.30} />
            <Stop offset="80%" stopColor={GLOW_COLOR} stopOpacity={0.12} />
            <Stop offset="94%" stopColor={GLOW_COLOR} stopOpacity={0.03} />
            <Stop offset="100%" stopColor={GLOW_COLOR} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={canvasHeight} fill="#fefefe" />
        {circles.map((circle) => (
          <Circle
            key={circle.key}
            cx={circle.centerX}
            cy={circle.centerY}
            r={ELLIPSE_RADIUS}
            fill={`url(#${gradientId})`}
          />
        ))}
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
