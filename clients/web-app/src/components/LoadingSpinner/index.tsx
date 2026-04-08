import { cn } from "@/lib/utils";
import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner = ({ className }: LoadingSpinnerProps) => {
  return (
    <div className={cn("loading-spinner", className)} role="status" aria-live="polite">
      <div className="loading-spinner__ring" aria-hidden="true" />
    </div>
  );
};

export default LoadingSpinner;
