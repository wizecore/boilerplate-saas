import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import React, { forwardRef, useImperativeHandle, useState } from "react";

export const ConfirmDialog = forwardRef(
  (
    {
      onContinue,
      onCancel,
      title,
      message,
      children,
      className
    }: {
      onContinue?: () => void;
      onCancel?: () => void;
      title?: string;
      message?: React.ReactNode;
      children?: React.ReactNode;
      className?: string;
    },
    ref: React.ForwardedRef<{
      open: () => void;
    }>
  ) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => {
        setOpen(true);
      }
    }));

    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className={className}>
              {typeof message === "string" ? (
                <div className="text-md font-bold my-4">{message}</div>
              ) : message !== undefined && message !== null ? (
                message
              ) : null}
              {children}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              autoFocus
              disabled={!onContinue}
              onKeyDown={e => {
                e.preventDefault();

                if (e.key === "Enter" && onContinue) {
                  setOpen(false);
                  onContinue();
                }
              }}
              onClick={e => {
                e.preventDefault();

                if (onContinue) {
                  setOpen(false);
                  onContinue();
                }
              }}
            >
              Continue
            </AlertDialogAction>

            <AlertDialogCancel
              onClick={e => {
                e.preventDefault();
                setOpen(false);
                onCancel && onCancel();
              }}
            >
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";
