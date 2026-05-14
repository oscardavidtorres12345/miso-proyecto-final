import { Star } from "lucide-react";
import "./PortalFeedbackCard.css";

type PortalFeedbackCardProps = {
  userName: string;
  title: string;
  rating: number;
  comment: string;
};

const MAX_RATING = 5;

const PortalFeedbackCard = ({
  userName,
  title,
  rating,
  comment,
}: PortalFeedbackCardProps) => {
  const initial = userName.trim().charAt(0).toUpperCase() || "U";
  const safeRating = Math.max(0, Math.min(MAX_RATING, Math.round(rating)));

  const displayName = userName.trim();

  return (
    <article className="portal-feedback-card">
      <div className="portal-feedback-card__initial">{initial}</div>
      <div className="portal-feedback-card__content">
        <div className="portal-feedback-card__title-group">
          <div className="portal-feedback-card__header">
            <h3 className="portal-feedback-card__title">{displayName}</h3>
            <div className="portal-feedback-card__rating" aria-label={`Rating ${safeRating} de ${MAX_RATING}`}>
              {Array.from({ length: MAX_RATING }).map((_, index) => {
                const filled = index < safeRating;
                return (
                  <Star
                    key={index}
                    size={18}
                    className={
                      filled
                        ? "portal-feedback-card__star portal-feedback-card__star--filled"
                        : "portal-feedback-card__star"
                    }
                  />
                );
              })}
            </div>
          </div>
          <span className="portal-feedback-card__name">{title}</span>
        </div>
        <p className="portal-feedback-card__comment">{comment}</p>
      </div>
    </article>
  );
};

export default PortalFeedbackCard;
