import PortalFeedbackCard from "@/components/PortalFeedbackCard";
import { mockFeedback } from "@/mocks/feedback";
import "./PortalFeedback.css";

const PortalFeedback = () => {
  return (
    <section className="portal-feedback page-container page-section">
      <h1 className="portal-feedback__title">Feedback</h1>
      <ul className="portal-feedback__list">
        {mockFeedback.map((item) => (
          <li key={item.id} className="portal-feedback__item">
            <PortalFeedbackCard
              userName={item.userName}
              title={item.title}
              rating={item.rating}
              comment={item.comment}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PortalFeedback;
