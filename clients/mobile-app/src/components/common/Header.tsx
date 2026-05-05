import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, LogOut, ShoppingCart } from 'lucide-react-native';
import LogoSvg from '../../assets/logo.svg';
import { COUNTRIES, useLocale } from '../../context/LocaleContext';
import { t } from '../../i18n';
import { colors, fonts } from '../../theme/colors';

const flagUrl = (code: string) => `https://flagcdn.com/w80/${code}.png`;

interface HeaderProps {
  showCart?: boolean;
  showLogin?: boolean;
  showMenu?: boolean;
  showMyBookings?: boolean;
  showFlag?: boolean;
  showLogo?: boolean;
  cartItemCount?: number;
  username?: string;
  onLogoPress?: () => void;
  onLoginPress?: () => void;
  onLogoutPress?: () => void;
  onMyBookingsPress?: () => void;
  onCartPress?: () => void;
}

export function Header({
  showCart,
  showLogin,
  showMenu,
  showMyBookings,
  showFlag,
  showLogo,
  cartItemCount = 0,
  username = 'U',
  onLogoPress,
  onLoginPress,
  onLogoutPress,
  onMyBookingsPress,
  onCartPress,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const { selectedCountry, setSelectedCountry } = useLocale();

  const initial = username.trim().length > 0 ? username[0].toUpperCase() : 'U';
  const badgeLabel = cartItemCount > 99 ? '99+' : String(cartItemCount);

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <View>
          {showLogo && (
            <TouchableOpacity
              testID="header-logo"
              activeOpacity={0.85}
              onPress={onLogoPress}
              disabled={!onLogoPress}
              accessibilityRole="button"
              accessibilityLabel="Ir al inicio"
            >
              <LogoSvg width={Math.round(32 * 225 / 68)} height={32} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actions}>
          {showCart && (
            <View style={styles.cartWrapper}>
              <TouchableOpacity
                style={styles.iconBtn}
                activeOpacity={0.85}
                testID="cart-btn"
                accessibilityLabel="Carrito"
                accessibilityRole="button"
                onPress={onCartPress}
              >
                <ShoppingCart size={20} color={colors.white} />
              </TouchableOpacity>
              {cartItemCount > 0 && (
                <View style={styles.cartBadge} testID="cart-badge">
                  <Text style={styles.cartBadgeText}>{badgeLabel}</Text>
                </View>
              )}
            </View>
          )}

          {showLogin && (
            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.85}
              testID="login-btn"
              onPress={onLoginPress}
              accessibilityRole="button"
              accessibilityLabel={t('header.login')}
            >
              <Text style={styles.loginBtnText}>{t('header.login')}</Text>
            </TouchableOpacity>
          )}

          {showMenu && (
            <View style={styles.menuWrapper}>
              <TouchableOpacity
                style={styles.menuBtn}
                activeOpacity={0.85}
                onPress={() => setMenuOpen(prev => !prev)}
                testID="menu-btn"
                accessibilityLabel="Menu"
                accessibilityRole="button"
              >
                <Text style={styles.menuBtnText}>{initial}</Text>
              </TouchableOpacity>

              {menuOpen && (
                <>
                  <TouchableWithoutFeedback
                    onPress={() => setMenuOpen(false)}
                    testID="menu-overlay"
                  >
                    <View style={styles.overlay} />
                  </TouchableWithoutFeedback>
                  <View style={styles.dropdown} testID="menu-dropdown">
                    {showMyBookings && (
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        activeOpacity={0.85}
                        testID="my-bookings-btn"
                        onPress={() => { setMenuOpen(false); onMyBookingsPress?.(); }}
                        accessibilityRole="button"
                        accessibilityLabel={t('header.myBookings')}
                      >
                        <Globe size={18} color={colors.secondary} />
                        <Text style={styles.dropdownItemText}>{t('header.myBookings')}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      activeOpacity={0.85}
                      onPress={() => { setMenuOpen(false); onLogoutPress?.(); }}
                      testID="logout-btn"
                      accessibilityRole="button"
                      accessibilityLabel={t('header.logout')}
                    >
                      <LogOut size={18} color={colors.secondary} />
                      <Text style={styles.dropdownItemText}>{t('header.logout')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          )}

          {showFlag && (
            <View style={styles.menuWrapper}>
              <TouchableOpacity
                onPress={() => setFlagOpen(prev => !prev)}
                activeOpacity={0.85}
                testID="flag-btn"
                accessibilityLabel={t('header.selectCountry')}
                accessibilityRole="button"
              >
                <View style={styles.flagCircle}>
                  <Image
                    source={{ uri: flagUrl(selectedCountry.code) }}
                    style={styles.flagImage}
                    resizeMode="cover"
                    testID={`flag-img-${selectedCountry.code}`}
                    accessibilityLabel={selectedCountry.label}
                  />
                </View>
              </TouchableOpacity>

              {flagOpen && (
                <>
                  <TouchableWithoutFeedback
                    onPress={() => setFlagOpen(false)}
                    testID="flag-overlay"
                  >
                    <View style={styles.overlay} />
                  </TouchableWithoutFeedback>
                  <View style={styles.dropdown} testID="flag-dropdown">
                    {COUNTRIES.map(country => (
                      <TouchableOpacity
                        key={country.code}
                        style={styles.dropdownItem}
                        activeOpacity={0.85}
                        testID={`flag-option-${country.code}`}
                        onPress={() => {
                          setSelectedCountry(country);
                          setFlagOpen(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={country.label}
                      >
                        <Image
                          source={{ uri: flagUrl(country.code) }}
                          style={styles.dropdownFlagImage}
                          resizeMode="cover"
                          accessibilityLabel={country.label}
                        />
                        <Text style={styles.dropdownItemText}>{t(`header.countries.${country.code}`)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.white,
    borderBottomColor: '#efefefce',
    borderBottomWidth: 1,
  },
  inner: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartWrapper: {
    position: 'relative',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#c62828',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  loginBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  loginBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: fonts.regular
  },
  menuWrapper: {
    position: 'relative',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fonts.regular
  },
  flagCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  flagImage: {
    width: 40,
    height: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
    minWidth: 180,
    padding: 8,
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.secondary,
    fontFamily: fonts.regular
  },
  dropdownFlagImage: {
    width: 24,
    height: 16,
    borderRadius: 2,
  },
});
