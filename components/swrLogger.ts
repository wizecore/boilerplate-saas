import logger from "@/lib/logger";
import { inspect } from "@/lib/utils";
import { Arguments, BareFetcher, Middleware, SWRConfiguration, SWRHook } from "swr";

export const swrLogger: Middleware = <Data>(useSWRNext: SWRHook) => {
  return ((key: unknown, fetcher: BareFetcher<Data> | null, config: SWRConfiguration) => {
    let nextFetcher = fetcher;

    if (fetcher) {
      nextFetcher = (...args: unknown[]) => {
        const started = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const label =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          typeof key === "function" ? key() : Array.isArray(key) ? key.join(", ") : key;
        logger.info("SWR -->", label);
        const response = fetcher(...args);
        if (response instanceof Promise) {
          return response.then(result => {
            logger.info(
              "SWR <--",
              label,
              "elapsed",
              Date.now() - started,
              "ms",
              inspect(result)
            );
            return result;
          });
        } else {
          logger.info(
            "SWR <--",
            label,
            "elapsed",
            Date.now() - started,
            "ms",
            inspect(response)
          );
          return response;
        }
      };
    }

    // Execute the hook with the new fetcher.
    return key === "function"
      ? useSWRNext(key, nextFetcher, config)
      : useSWRNext(key as Arguments, nextFetcher, config);
  }) as SWRHook;
};
