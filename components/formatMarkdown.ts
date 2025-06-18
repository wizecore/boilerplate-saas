import React from "react";
import { compiler, MarkdownToJSX } from "markdown-to-jsx";
import { cn } from "@/lib/utils";

const DivElement =
  (className?: string) =>
  // eslint-disable-next-line react/display-name
  ({ children, ...props }: { children: React.ReactNode; props: unknown }) =>
    React.createElement(
      "div",
      { ...props, className: cn("markdown prose dark:prose-invert", className) },
      children
    );

const PElement = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  props: unknown;
}) =>
  React.createElement(
    "div",
    { ...props, className: cn("my-3 leading-normal", className) },
    children
  );

const AElement = ({
  children,
  href,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  props: unknown;
}) =>
  React.createElement(
    "a",
    {
      href,
      target: href?.startsWith("http") ? "_blank" : undefined,
      rel: href?.startsWith("http") ? "noopener noreferrer" : undefined,
      ...props
    },
    children
  );

const trimLines = (str: string) =>
  str
    .split("\n")
    .map(line => line.trim())
    .join("\n");

export const formatMarkdown = (
  str: string | string[] | undefined,
  options?: MarkdownToJSX.Options,
  overrides?: MarkdownToJSX.Overrides,
  forceBlock?: boolean,
  className?: string
) => {
  if (str === undefined) {
    return null;
  }
  return compiler(
    // Multiline markdown written in the code have spaces at the start,
    // remove it here
    Array.isArray(str) ? str.join() : typeof str === "string" ? trimLines(str) : String(str),
    {
      forceBlock,
      forceWrapper: forceBlock,
      wrapper: DivElement(className),
      overrides: {
        p: PElement,
        a: AElement,
        ...overrides
      },
      disableParsingRawHTML: true,
      ...options
    }
  );
};
