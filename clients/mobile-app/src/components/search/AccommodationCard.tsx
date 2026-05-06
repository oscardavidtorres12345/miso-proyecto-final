import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeftRight,
  Baby,
  Car,
  Coffee,
  Dumbbell,
  PawPrint,
  Sparkles,
  Star,
  Tv,
  Utensils,
  Waves,
  Wifi,
  Wind,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import BreakfastIcon from '../../assets/breakfast.svg';
import { t, tCount } from '../../i18n';
import type { Accommodation } from '../../types/api';
import { colors } from '../../theme/colors';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PLACEHOLDER_IMAGE = require('../../assets/imagen.avif') as number;

const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  pool: Waves,
  parking: Car,
  transfer: ArrowLeftRight,
  ac: Wind,
  restaurant: Utensils,
  gym: Dumbbell,
  spa: Sparkles,
  tv: Tv,
  pets: PawPrint,
  kids: Baby,
  breakfast: Coffee,
};

const MAX_AMENITIES = 4;

export function getRatingLabel(score: number | null | undefined): string {
  if (score == null) return '';
  if (score >= 9) return 'Excepcional';
  if (score >= 8.5) return 'Excelente';
  if (score >= 7) return 'Muy bien';
  if (score >= 5) return 'Bien';
  return 'Aceptable';
}

export function formatPrice(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return '–';
  return new Intl.NumberFormat('es-CO').format(Math.round(amount));
}

export function safeFixed(value: number | null | undefined, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return '–';
  return value.toFixed(decimals);
}

interface AccommodationCardProps {
  accommodation: Accommodation;
  onPress?: (id: string | number) => void;
  nights?: number;
  adults?: number;
}

export function AccommodationCard({ accommodation, onPress, nights = 1, adults = 1 }: AccommodationCardProps) {
  const {
    id,
    name,
    image,
    distanceFromCenter,
    stars,
    rating,
    amenities,
    hasBreakfast,
    price,
  } = accommodation;

  const [imgError, setImgError] = useState(false);
  const imageSrc =
    !imgError && image && typeof image === 'string' && image.trim()
      ? { uri: image.trim() }
      : null;

  const visibleAmenities = (amenities ?? []).slice(0, MAX_AMENITIES);
  const safeStars = stars ?? 0;

  const ratingScore = rating?.score ?? null;
  const reviewCount = rating?.reviewCount ?? 0;

  const pricePerNight =
    price?.perNight ?? (price as any)?.amount ?? (price as any)?.total ?? null;
  const currency = price?.currency ?? '';
  const cardNights = (price as any)?.nights ?? nights;
  const cardAdults = (price as any)?.adults ?? adults;
  const nightsAdultsLabel = `${tCount('search.nights', cardNights)}, ${tCount('search.adults', cardAdults)}`;

  return (
    <View style={styles.card}>
      {/* Top row: image + info */}
      <View style={styles.topRow}>
        {/* Image */}
        <View style={styles.imageWrapper}>
          {imageSrc ? (
            <Image
              source={imageSrc}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImgError(true)}
              testID="accommodation-image"
              accessibilityLabel={name ?? 'Imagen del alojamiento'}
            />
          ) : (
            <Image
              source={PLACEHOLDER_IMAGE}
              style={styles.image}
              resizeMode="cover"
              testID="accommodation-image"
              accessibilityLabel={t('common.imageUnavailable')}
            />
          )}
          {hasBreakfast && (
            <View style={styles.pill}>
              <BreakfastIcon width={14} height={14} />
              <Text style={styles.pillText}>{t('filters.meal.breakfast')}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {name ?? '–'}
          </Text>
          {distanceFromCenter != null && (
            <Text style={styles.distance} numberOfLines={1}>
              {distanceFromCenter} km del centro
            </Text>
          )}

          <View style={styles.starsRow}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={16}
                fill={i < safeStars ? '#53bfcb' : 'none'}
                color="#53bfcb"
              />
            ))}
          </View>

          {visibleAmenities.length > 0 && (
            <View style={styles.amenitiesRow}>
              {visibleAmenities.map((amenity) => {
                const Icon = AMENITY_ICONS[amenity?.id ?? ''];
                return Icon ? (
                  <Icon key={amenity.id} size={22} color="#737373" />
                ) : null;
              })}
            </View>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom section: rating + price + button */}
      <View style={styles.bottom}>
        {/* Rating */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingCopy}>
            {ratingScore != null && (
              <Text style={styles.ratingLabel}>{getRatingLabel(ratingScore)}</Text>
            )}
            <Text style={styles.reviewCount}>
              {tCount('search.comments', reviewCount)}
            </Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>{safeFixed(ratingScore)}</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceBlock}>
          <Text style={styles.priceNights}>{nightsAdultsLabel}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>$</Text>
            <Text style={styles.priceAmount}>{formatPrice(pricePerNight)}</Text>
            {currency ? (
              <Text style={styles.priceCurrency}>{currency}</Text>
            ) : null}
          </View>
          <Text style={styles.priceTaxes}>{t('search.taxesAndCharges')}</Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onPress?.(id)}
          activeOpacity={0.85}
          testID="accommodation-detail-btn"
          accessibilityRole="button"
          accessibilityLabel={t('search.viewDetails')}
        >
          <Text style={styles.btnText}>{t('search.viewDetails')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  imageWrapper: {
    width: '45%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pillText: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 11,
    color: colors.secondary,
  },
  info: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    paddingTop: 2,
  },
  name: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 22,
    color: colors.secondary,
    lineHeight: 26,
  },
  distance: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 14,
    color: '#6b7280',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
    marginHorizontal: -14,
  },
  bottom: {
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingCopy: {
    flexDirection: 'column',
    gap: 2,
  },
  ratingLabel: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 14,
    color: '#111',
  },
  reviewCount: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 12,
    color: '#6b7280',
  },
  ratingBadge: {
    width: 36,
    height: 30,
    backgroundColor: '#53bfcb',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBadgeText: {
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
    fontSize: 14,
  },
  priceBlock: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  priceNights: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 11,
    color: '#111',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceSymbol: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 14,
    color: '#111',
  },
  priceAmount: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 26,
    color: '#111',
    lineHeight: 30,
  },
  priceCurrency: {
    fontFamily: 'Quicksand_500Medium',
    fontSize: 13,
    color: '#111',
  },
  priceTaxes: {
    fontFamily: 'Quicksand_400Regular',
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: {
    fontFamily: 'Quicksand_500Medium',
    color: '#fff',
    fontSize: 15,
  },
});
