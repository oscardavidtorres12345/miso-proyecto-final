import "./Spinner.css";

interface SpinnerProps {
  size?: number;
}

const Spinner = ({ size = 48 }: SpinnerProps) => (
  <div
    className="spinner"
    style={{ width: size, height: size }}
    role="status"
    aria-label="Cargando"
  />
);

export default Spinner;
