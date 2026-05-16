import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts } from '../../theme/colors';

interface FooterProps {
  style?: any;
}

export function Footer({ style }: FooterProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }, style]} testID="footer">
      <Text style={styles.text}>{t('footer.madeWithLove')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.secondary,
    textAlign: 'right',
    fontFamily: fonts.regular,
  },
});
