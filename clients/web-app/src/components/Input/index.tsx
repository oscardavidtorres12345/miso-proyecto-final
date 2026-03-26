import { cn } from "@/lib/utils";
import "./Input.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = ({ className, ...props }: InputProps) => (
  <input className={cn("input", className)} {...props} />
);

export default Input;
