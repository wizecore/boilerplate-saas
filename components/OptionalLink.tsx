import React from "react";
import Link, { LinkProps } from "next/link";
import type { UrlObject } from "url";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { cn, retainAttribution } from "@/lib/utils";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & LinkProps;

/** Renders NextJS link or directly children if no href provided */
export const OptionalLink = ({
  children,
  href,
  ...props
}: Omit<Props, "href"> & {
  href?: string | UrlObject;
  children?: React.ReactNode;
}) =>
  href ? (
    <Link href={href} {...props}>
      {children}
    </Link>
  ) : (
    <>{children}</>
  );

export const MarketingLink = ({
  children,
  href,
  className,
  ...props
}: Omit<Props, "href" | "scroll"> & {
  href: string;
}) => (
  <Link href={retainAttribution(href)} className={cn("MarketingLink", className)} {...props}>
    {children}
  </Link>
);

export const ExternalLink = ({
  children,
  href,
  className,
  rel,
  target,
  invertIconColor,
  ...props
}: Omit<Props, "href"> & {
  href?: string | UrlObject;
  children?: React.ReactNode;
  invertIconColor?: boolean;
}) =>
  href ? (
    <Link
      href={href}
      className={cn("group inline-flex items-center", className)}
      target={target ?? "_blank"}
      rel={rel ?? "noopener noreferrer"}
      {...props}
    >
      {children}
      <ExternalLinkIcon
        className={cn(
          "ml-1 w-4 h-4",
          invertIconColor
            ? "text-background group-hover:text-background"
            : "text-foreground/60 group-hover:text-foreground"
        )}
      />
    </Link>
  ) : (
    <>{children}</>
  );
