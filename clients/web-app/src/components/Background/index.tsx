import { useEffect, useState } from "react";
import "./Background.css";

const SPACING = 1000;
const ELLIPSE_HALF = 359;

const Background = () => {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight;
      setCount(Math.ceil(height / SPACING) + 1);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="background" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`background__ellipse background__ellipse--${i % 2 === 0 ? "left" : "right"}`}
          style={{ top: `${i * SPACING + SPACING / 2 - ELLIPSE_HALF}px` }}
        />
      ))}
    </div>
  );
};

export default Background;
