import { Button } from "@/components/ui/button";
import { cn, formatMessage } from "@/lib/utils";
import { useMemo } from "react";

export const ErrorMessage = ({
  title,
  error,
  onClick,
  redirect,
  buttonText,
  status
}: {
  title?: string;
  error?: Error | string;
  onClick?: () => void;
  redirect?: string;
  buttonText?: string;
  status?: number;
}) => {
  const message = useMemo(
    () =>
      error ? (typeof error === "string" ? error : formatMessage(error)) : "Unknown error",
    [error]
  );

  return (
    <div className="flex flex-col justify-center items-center w-full h-screen">
      {status && (
        <div className="text-[50vw] text-center fixed w-screen text-black/15 dark:text-white/15 top-1/2 -translate-y-1/2">
          {status}
        </div>
      )}
      <div
        className={cn(
          "z-10 p-12 flex flex-col gap-5 max-w-lg m-3",
          status ? undefined : " rounded-lg shadow-lg bg-card/60"
        )}
      >
        <div className="flex justify-center items-center">
          <img src="/icon.png" width={100} alt="Logo" />
        </div>
        <h2 className="text-2xl font-bold text-center">{title ?? "Error"}</h2>
        <div className="text-center text-muted-foreground">{message}</div>
        <div className="flex justify-center">
          <Button
            onClick={e => {
              if (onClick) {
                e.preventDefault();
                onClick();
              } else {
                window.location.href = redirect || "/dashboard";
              }
            }}
          >
            {buttonText ?? "Try again?"}
          </Button>
        </div>
      </div>
    </div>
  );
};
