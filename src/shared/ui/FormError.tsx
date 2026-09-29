import type { ComponentProps, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export interface FormErrorProps extends Omit<ComponentProps<"div">, "children"> {
  message: ReactNode;
  tone?: "danger" | "warning";
}

export function FormError({ message, tone = "danger", className, ...props }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[13px] leading-normal",
        tone === "warning" ? "bg-[var(--alerta-t)] text-[var(--alerta)]" : "bg-[var(--peligro-t)] text-[var(--peligro)]",
        className,
      )}
      {...props}
    >
      <CircleAlert aria-hidden="true" className="mt-px shrink-0 text-[var(--peligro)]" size={18} strokeWidth={2} />
      <span>{message}</span>
    </div>
  );
}
