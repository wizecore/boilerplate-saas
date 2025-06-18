import { ErrorMessage } from "@/components/ErrorMessage";
import logger from "@/lib/logger";
import { getIP } from "@/lib/utils";
import { NextPage, NextPageContext } from "next";
import NextErrorComponent, { ErrorProps } from "next/error";

interface AppErrorProps extends ErrorProps {
  err?: Error;
  url?: string;
  hasGetInitialPropsRun?: boolean;
}

const Page: NextPage<AppErrorProps> = (err: AppErrorProps) => {
  logger.warn("Error", err);
  return (
    <ErrorMessage
      error={
        err.title
          ? err.title
          : err.statusCode
            ? `Error ${err.statusCode} occurred on server`
            : "An error occurred on client"
      }
      redirect="/"
      status={err.statusCode}
    />
  );
};

/**
 * Custom error page from
 * https://nextjs.org/docs/going-to-production#error-handling
 *
 * See example:
 * https://github.com/vercel/next.js/blob/canary/examples/with-sentry/pages/_error.js
 */
export const getInitialProps = async (context: NextPageContext) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(context);

  if (context.req) {
    logger.info(
      "Server side error at",
      context.req?.method,
      context.req?.url,
      "ip",
      getIP(context.req),
      "agent",
      context.req?.headers["user-agent"],
      context.err ?? errorInitialProps
    );
    return errorInitialProps;
  }

  if (context.res?.statusCode) {
    return { statusCode: context.res?.statusCode };
  }

  if (context.err) {
    logger.info("Client side error at", "path", context.pathname, "error", context.err);
    return { statusCode: context.err.statusCode ?? 500 };
  }

  return errorInitialProps;
};

Page.getInitialProps = getInitialProps;
export default Page;
