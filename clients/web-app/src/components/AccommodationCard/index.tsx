import {
  ArrowLeftRight,
  Baby,
  Coffee,
  Dumbbell,
  PawPrint,
  Sparkles,
  Star,
  Tv,
  Utensils,
  Waves,
  Wind,
  Wifi,
  Car,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import breakfastIcon from "@/assets/breakfast.svg";
import propertyPlaceholder from "@/assets/imagen.avif";
import Button from "@/components/Button";
import type { Accommodation } from "@/types/accommodation";
import { formatPrice, getRatingLabel } from "@/utils/accommodation";
import "./AccommodationCard.css";

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

interface AccommodationCardProps {
  accommodation: Accommodation;
}

const AccommodationCard = ({ accommodation }: AccommodationCardProps) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
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

  const visibleAmenities = amenities.slice(0, MAX_AMENITIES);
  const nightsAdultsLabel = `${t("accommodationCard.nightsLine", { count: price.nights })}, ${t("accommodationCard.adultsLine", { count: price.adults })}`;
  const imageSrc =
    typeof image === "string" && image.trim() !== ""
      ? image.trim()
      : propertyPlaceholder;

  return (
    <div className="accommodation-card">
      <div className="accommodation-card__image-wrapper">
        <img
          src={imageSrc}
          alt={name}
          className="accommodation-card__image"
          onError={(e) => {
            e.currentTarget.src = propertyPlaceholder;
          }}
        />
        {hasBreakfast && (
          <div className="accommodation-card__pill">
            <img
              src={breakfastIcon}
              alt={t("accommodationCard.breakfastAlt")}
              className="accommodation-card__pill-icon"
            />
            <span>{t("accommodationCard.breakfast")}</span>
          </div>
        )}
      </div>

      <div className="accommodation-card__info">
        <h3 className="accommodation-card__name">{name}</h3>
        <p className="accommodation-card__distance">
          {t("accommodationCard.distanceFromCenter", { distance: distanceFromCenter })}
        </p>

        <div className="accommodation-card__stars">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={18}
              fill={i < stars ? "currentColor" : "none"}
              className="accommodation-card__star"
            />
          ))}
        </div>

        <div className="accommodation-card__amenities">
          {visibleAmenities.map((amenity) => {
            const Icon = AMENITY_ICONS[amenity.id];
            return Icon ? <Icon key={amenity.id} size={29} /> : null;
          })}
        </div>
      </div>

      <div className="accommodation-card__divider" />

      <div className="accommodation-card__right">
        <div className="accommodation-card__rating">
          <div className="accommodation-card__rating-row">
            <div className="accommodation-card__rating-copy">
              <span className="accommodation-card__rating-label">
                {getRatingLabel(rating.score, t)}
              </span>
              <span className="accommodation-card__review-count">
                {t("accommodationCard.reviews", { count: rating.reviewCount })}
              </span>
            </div>
            <div className="accommodation-card__rating-badge">
              {rating.score}
            </div>
          </div>
        </div>

        <div className="accommodation-card__price-block">
          <span className="accommodation-card__price-nights">{nightsAdultsLabel}</span>
          <div className="accommodation-card__price-row">
            <span className="accommodation-card__price-symbol">$</span>
            <span className="accommodation-card__price-amount">
              {formatPrice(price.amount)}
            </span>
            <span className="accommodation-card__price-currency">
              {price.currency}
            </span>
          </div>
          {price.includesTaxes && (
            <span className="accommodation-card__price-taxes">
              {t("accommodationCard.includesTaxes")}
            </span>
          )}
          <Link
            to={`/accommodation/${id}?${searchParams.toString()}`}
            onClick={() => sessionStorage.removeItem("accommodation-id-lock")}
          >
            <Button variant="primary" className="accommodation-card__btn">
              {t("accommodationCard.viewDetails")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccommodationCard;
