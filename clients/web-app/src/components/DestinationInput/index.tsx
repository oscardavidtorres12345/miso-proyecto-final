import { MapPin } from "lucide-react";
import Input from "@/components/Input";
import "./DestinationInput.css";

interface DestinationInputProps {
  value: string;
  onChange: (value: string) => void;
}

const DestinationInput = ({ value, onChange }: DestinationInputProps) => (
  <div className="flex flex-col flex-1 min-w-0">
    <span className="destination-input__label font-bold text-black">
      Destino
    </span>
    <div className="flex items-center gap-1">
      <MapPin className="destination-input__icon text-primary" />
      <div className="destination-input__box">
        <Input
          type="text"
          placeholder="¿Donde?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  </div>
);

export default DestinationInput;
