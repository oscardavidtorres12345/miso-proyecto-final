import { useEffect, useRef, useState } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
}

const MAX_FONT_SIZE = 48;
const MIN_FONT_SIZE = 14;

const KpiCard = ({ label, value }: KpiCardProps) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);

  useEffect(() => {
    const fit = () => {
      const span = spanRef.current;
      const wrapper = wrapperRef.current;
      if (!span || !wrapper) return;

      span.style.fontSize = `${MAX_FONT_SIZE}px`;
      if (span.scrollWidth <= wrapper.clientWidth) {
        setFontSize(MAX_FONT_SIZE);
        return;
      }

      let lo = MIN_FONT_SIZE;
      let hi = MAX_FONT_SIZE;
      while (lo < hi - 1) {
        const mid = Math.floor((lo + hi) / 2);
        span.style.fontSize = `${mid}px`;
        if (span.scrollWidth <= wrapper.clientWidth) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      setFontSize(lo);
    };

    fit();
    const observer = new ResizeObserver(fit);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#7DA10D]/20 flex flex-col gap-1 min-w-0 overflow-hidden">
      <span className="text-s text-gray-500 font-medium leading-snug">{label}</span>
      <div ref={wrapperRef} className="overflow-hidden">
        <span
          ref={spanRef}
          style={{ fontSize: `${fontSize}px` }}
          className="font-bold text-[#213500] leading-tight whitespace-nowrap block"
        >
          {value}
        </span>
      </div>
    </div>
  );
};

export default KpiCard;
