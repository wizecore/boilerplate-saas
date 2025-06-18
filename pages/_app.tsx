import { AppProps } from "next/app";
import Head from "next/head";
import "./global.css";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorReportProvider } from "@/components/ErrorReportProvider";
import { Toaster } from "@/components/ui/toaster";
import { SWRConfig } from "swr";
import { fetcher, isProd } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { swrLogger } from "@/components/swrLogger";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* https://nextjs.org/docs/pages/api-reference/components/head */}
      <Head>
        <title>{process.env.NEXT_PUBLIC_APP_NAME}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.png" />
        <link rel="shortcut icon" type="image/png" href="/icon.png" />
        <link rel="apple-touch-icon" type="image/png" href="/icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL} />
        <meta name="author" content="Wizecore Oy" />
        <meta name="theme-color" content="#3a2c56" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="og:site_name" content={process.env.NEXT_PUBLIC_APP_NAME} />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_APP_URL} />
        <meta property="og:locale" content="en-GB" />
        <meta property="og:type" content="article" />
        <meta name="og:title" content={process.env.NEXT_PUBLIC_APP_NAME} key="title" />
        <meta name="og:image" content="/api/og/cover.png" key="image" />
        <meta name="twitter:image" content="/api/og/cover.png" key="twitter:image" />
        <meta
          name="description"
          key="description"
          content={process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "Description"}
        />
        <meta
          name="og:description"
          key="og:description"
          content={process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "Description"}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1.0, user-scalable=no"
        />
      </Head>
      {/* https://plausible.io/docs/custom-event-goals */}
      {process.env.NEXT_PUBLIC_APP_URL &&
        process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL &&
        isProd() && (
          <Script
            async
            defer
            data-domain={new URL(process.env.NEXT_PUBLIC_APP_URL).hostname}
            src={process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL}
          />
        )}
      <SWRConfig
        value={{
          fetcher,
          use: process.env.NEXT_PUBLIC_LOG_VERBOSE === "1" ? [swrLogger] : []
        }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <ErrorBoundary>
            <ErrorReportProvider>
              <SessionProvider>
                <TooltipProvider>
                  <Component {...pageProps} />
                </TooltipProvider>
              </SessionProvider>
            </ErrorReportProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SWRConfig>
    </>
  );
}
