import { useWindowDimensions, View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import TravelHubLogo from '../assets/logo.svg';
import {
  BACKGROUND_ELLIPSE_RADIUS_MULTIPLIER,
  BACKGROUND_ELLIPSE_RGB,
} from '../theme/backgroundEllipses';
import { colors } from '../theme/colors';

function SplashEllipsesBackground() {
  const { width, height } = useWindowDimensions();
  const r = Math.max(width, height) * BACKGROUND_ELLIPSE_RADIUS_MULTIPLIER;
  const cx = width / 2;
  const cy = height / 2;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="ellipseGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={BACKGROUND_ELLIPSE_RGB} stopOpacity={0.52} />
          <Stop offset="28%" stopColor={BACKGROUND_ELLIPSE_RGB} stopOpacity={0.22} />
          <Stop offset="55%" stopColor={BACKGROUND_ELLIPSE_RGB} stopOpacity={0.06} />
          <Stop offset="100%" stopColor={BACKGROUND_ELLIPSE_RGB} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={colors.secondary} />
      <Circle cx={cx} cy={cy} r={r} fill="url(#ellipseGlow)" />
    </Svg>
  );
}

export function SplashScreen() {
  const { width } = useWindowDimensions();
  const logoWidth = Math.min(width - 48, 280);
  const logoHeight = (logoWidth * 68) / 225;

  return (
    <View style={styles.root}>
      <SplashEllipsesBackground />
      <View style={styles.logoWrap} pointerEvents="box-none">
        <TravelHubLogo width={logoWidth} height={logoHeight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  logoWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
