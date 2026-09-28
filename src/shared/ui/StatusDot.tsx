import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "pending";

export interface StatusDotProps extends Omit<ComponentProps<"span">, "children"> {
  tone: StatusTone;
  label: ReactNode;
}

const tones: Record<StatusTone, string> = {
  success: "bg-[var(--ok-t)] text-[var(--ok)] before:bg-[var(--ok)]",
  warning: "bg-[var(--alerta-t)] text-[var(--alerta)] before:bg-[var(--alerta)]",
  danger: "bg-[var(--peligro-t)] text-[var(--peligro)] before:bg-[var(--peligro)]",
  neutral: "bg-[var(--s3)] text-[var(--t2)] before:bg-[var(--t2)]",
  pending: "bg-[var(--marca-t)] text-[var(--marca-tx)] before:bg-[var(--marca-tx)]",
};

export function StatusDot({ tone, label, className, ...props }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium before:size-[5px] before:shrink-0 before:rounded-full before:content-['']",
        tones[tone],
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
