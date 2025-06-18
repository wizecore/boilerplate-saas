import { useToast } from "@/components/ui/use-toast";
import React, { useCallback, useEffect } from "react";

export const ErrorReportProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();

  const reportError = useCallback(
    (message: string) => {
      toast({
        title: "Error",
        description: message
      });
    },
    [toast]
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).reportError = reportError;

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).reportError = undefined;
    };
  }, [reportError]);
  // Assign the reportError function to global

  return <div>{children}</div>;
};
