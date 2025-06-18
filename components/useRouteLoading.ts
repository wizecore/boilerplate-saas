import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import logger from "@/lib/logger";

/** Returns true if next route is loading, useful for displaying a progress bar. */
export const useRouteLoading = (timeout = 400, finishTimeout = 5000) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: unknown;

    const routeChangeStart = (url: string) => {
      logger.verbose(`App is changing to ${url}`);
      if (timeout) {
        timer = setTimeout(() => setLoading(true), timeout);
      } else {
        setLoading(true);
      }
    };

    const routeChangeComplete = (url: string) => {
      logger.verbose(`App is changed to ${url}`);
      setLoading(() => {
        if (timer) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clearTimeout(timer as any);
        }
        return false;
      });
    };

    router.events.on("routeChangeStart", routeChangeStart);
    router.events.on("routeChangeComplete", routeChangeComplete);

    setTimeout(() => setLoading(false), finishTimeout);

    return () => {
      router.events.off("routeChangeStart", routeChangeStart);
      router.events.off("routeChangeComplete", routeChangeComplete);
    };
  }, [router, timeout, finishTimeout]);

  return loading;
};
