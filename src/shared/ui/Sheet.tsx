import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

export const Sheet = Dialog;
export const SheetClose = DialogClose;
export const SheetDescription = DialogDescription;
export const SheetFooter = DialogFooter;
export const SheetHeader = DialogHeader;
export const SheetTitle = DialogTitle;
export const SheetTrigger = DialogTrigger;

export function SheetContent({ className, ...props }: ComponentProps<typeof DialogContent>) {
  return <DialogContent data-slot="sheet-content" className={cn("bottom-0 rounded-t-[16px]", className)} {...props} />;
}
