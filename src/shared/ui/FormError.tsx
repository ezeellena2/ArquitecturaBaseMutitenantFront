import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface FormErrorProps extends Omit<ComponentProps<"div">, "children"> {
  message: ReactNode;
}

export function FormError({ message, className, ...props }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "rounded-[10px] border border-[var(--peligro)] bg-[var(--peligro-t)] px-3 py-2.5 text-[13px] text-[var(--peligro)]",
        className,
      )}
      {...props}
    >
      {message}
    </div>
  );
}
