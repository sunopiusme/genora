"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "../../lib/cn";
import styles from "./dialog.module.css";

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

export const DialogContent = forwardRef<
  ElementRef<typeof RadixDialog.Content>,
  ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
    overlayClassName?: string;
  }
>(function DialogContent({ className, overlayClassName, children, ...props }, ref) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className={cn(styles.overlay, overlayClassName)} />
      <RadixDialog.Content
        ref={ref}
        className={cn(styles.content, className)}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});
