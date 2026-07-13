import { Session } from "next-auth";
import { SessionContextValue, SessionProviderProps, UseSessionOptions } from "next-auth/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import logger from "@/lib/logger";
import { formatMessage, isProd, okstatus } from "@/lib/utils";

const SessionContext = createContext<SessionContextValue<false>>({
  data: null,
  status: "unauthenticated",
  update: async () => null
});

function useOnline(onOnline?: () => void, onOffline?: () => void) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (onOnline) {
      onOnline();
    }
  }, [onOnline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    if (onOffline) {
      onOffline();
    }
  }, [onOffline]);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onOnline, onOffline, handleOnline, handleOffline]);

  return isOnline;
}

export async function fetchSession(): Promise<Session | null> {
  const maxRetries = 5;
  const baseDelay = 100;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch("/api/auth/session")
        .then(res =>
          okstatus(res, undefined, () => {
            /* Don't report errors */
          })
        )
        .then(res => res.json() as Promise<Session>);
      const result = Object.keys(res).length > 0 ? res : null; // Return null if data empty
      if (attempt > 0) {
        logger.info("Successfully fetched session " + (attempt + "/" + maxRetries));
      }
      return result;
    } catch (error) {
      logger.error(
        "Failed to fetch session " + (attempt + "/" + maxRetries),
        formatMessage(error)
      );

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }

  return null;
}

export function SessionProvider(props: SessionProviderProps) {
  if (!SessionContext) {
    throw new Error("React Context is unavailable in Server Components");
  }

  const { children } = props;
  const refetchInterval = props.refetchInterval ?? 0;
  const refetchWhenOffline = props.refetchWhenOffline ?? true;
  const hasInitialSession = props.session !== undefined;

  const [session, setSession] = useState<Session | null>(() => props.session ?? null);
  const [loading, setLoading] = useState(!hasInitialSession);

  const loadSession = useCallback(async (noLoading = false) => {
    try {
      if (!noLoading) {
        setLoading(true);
      }
      const newSession = await fetchSession();
      setSession(oldSession => {
        // Don't set session if it's the same as the old one
        if (JSON.stringify(oldSession) === JSON.stringify(newSession)) {
          return oldSession;
        }
        return newSession;
      });
      return newSession;
    } catch (error) {
      logger.warn("CLIENT_SESSION_ERROR", formatMessage(error));
      return null;
    } finally {
      if (!noLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSession();
    return () => setSession(null);
  }, [loadSession]);

  useEffect(() => {
    const refetchOnWindowFocus = props.refetchOnWindowFocus ?? true;
    const visibilityHandler = () => {
      if (refetchOnWindowFocus && document.visibilityState === "visible") {
        loadSession(true);
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler, false);
    return () => document.removeEventListener("visibilitychange", visibilityHandler, false);
  }, [props.refetchOnWindowFocus, loadSession]);

  const isOnline = useOnline(loadSession);
  const shouldRefetch = refetchWhenOffline !== false || isOnline;

  useEffect(() => {
    if (refetchInterval && shouldRefetch) {
      const refetchIntervalTimer = setInterval(() => loadSession(), refetchInterval * 1000);
      return () => clearInterval(refetchIntervalTimer);
    } else {
      return undefined;
    }
  }, [refetchInterval, shouldRefetch, loadSession]);

  const value = useMemo(
    () =>
      loading
        ? ({ data: null, status: "loading", update: loadSession } as const)
        : session
          ? ({ data: session, status: "authenticated", update: loadSession } as const)
          : ({ data: null, status: "unauthenticated", update: loadSession } as const),
    [session, loading, loadSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession<R extends boolean>(
  options?: UseSessionOptions<R>
): SessionContextValue<R> {
  if (!SessionContext) {
    throw new Error("React Context is unavailable in Server Components");
  }

  const value = useContext(SessionContext);
  if (!value && !isProd()) {
    throw new Error("`useSession` must be wrapped in a <SessionProvider />");
  }

  const { required, onUnauthenticated } = options ?? {};
  const requiredAndNotLoading = required && value.status === "unauthenticated";
  const router = useRouter();

  logger.verbose("useSession", { data: value.data, status: value.status });

  useEffect(() => {
    if (requiredAndNotLoading) {
      const url = `/api/auth/signin?${new URLSearchParams({
        error: "SessionRequired",
        callbackUrl: window.location.href
      })}`;
      if (onUnauthenticated) {
        onUnauthenticated();
      } else {
        router.push(url);
      }
    }
  }, [requiredAndNotLoading, onUnauthenticated, router]);

  if (requiredAndNotLoading) {
    return {
      data: value.data,
      update: value.update,
      status: "loading"
    };
  }

  return value as SessionContextValue<R>;
}
