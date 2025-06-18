import { absoluteUrl } from "@/lib/utils";
import {
  Body as ReactEmailBody,
  Container,
  Head,
  Heading,
  Hr,
  Html as ReactEmailHtml,
  Img,
  Link,
  Preview,
  Tailwind
} from "@react-email/components";

export const MailTemplate = ({
  preview,
  title,
  children,
  unsubscribeLink
}: {
  preview?: string;
  title: string;
  children: React.ReactNode;
  unsubscribeLink?: string;
}) => {
  const Html = false ? ReactEmailHtml : "div";
  const Body = false ? ReactEmailBody : "div";
  return (
    <Html className="dark">
      <Tailwind
        config={{
          darkMode: "class",
          theme: {
            colors: {
              background: "#ffffff",
              foreground: "#000000",
              "muted-foreground": "#3f3f3f",
              "muted-background": "#fafafa",
              primary: "#2011ff",
              "primary-foreground": "#ffffff",
              blue: "#3b82f6",
              red: "#ef4444",
              green: "#22c55e"
            },
            fontSize: {
              xs: ["12px", { lineHeight: "16px" }],
              sm: ["14px", { lineHeight: "20px" }],
              base: ["16px", { lineHeight: "24px" }],
              lg: ["18px", { lineHeight: "28px" }],
              xl: ["20px", { lineHeight: "28px" }],
              "2xl": ["24px", { lineHeight: "32px" }],
              "3xl": ["30px", { lineHeight: "36px" }],
              "4xl": ["36px", { lineHeight: "36px" }],
              "5xl": ["48px", { lineHeight: "1" }],
              "6xl": ["60px", { lineHeight: "1" }],
              "7xl": ["72px", { lineHeight: "1" }],
              "8xl": ["96px", { lineHeight: "1" }],
              "9xl": ["144px", { lineHeight: "1" }]
            },
            spacing: {
              px: "1px",
              0: "0",
              0.5: "2px",
              1: "4px",
              1.5: "6px",
              2: "8px",
              2.5: "10px",
              3: "12px",
              3.5: "14px",
              4: "16px",
              5: "20px",
              6: "24px",
              7: "28px",
              8: "32px",
              9: "36px",
              10: "40px",
              11: "44px",
              12: "48px",
              14: "56px",
              16: "64px",
              20: "80px",
              24: "96px",
              28: "112px",
              32: "128px",
              36: "144px",
              40: "160px",
              44: "176px",
              48: "192px",
              52: "208px",
              56: "224px",
              60: "240px",
              64: "256px",
              72: "288px",
              80: "320px",
              96: "384px"
            }
          }
        }}
      >
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          {/**
           * Required for dark mode to work in Apple Mail on macOS.
           * https://github.com/resend/react-email/discussions/591
           */}
          <style>{":root {color-scheme: light dark;}"}</style>
        </Head>
        <Body className="bg-background text-foreground font-sans">
          {preview && <Preview>{preview}</Preview>}

          <Container className="mx-auto max-w-lg py-6 px-4 mt-8">
            {/**
             * This url /icon.png is hardcoded in lib/mail.ts
             * to automatically inlined then sending an email.
             */}
            <Img
              src="/icon.png"
              className="h-12 w-12"
              alt={process.env.NEXT_PUBLIC_APP_NAME}
            />
            <Heading className="text-2xl font-semibold text-foreground mt-4 mb-4">
              {title}
            </Heading>

            {children}

            <Hr className="border-border mt-2 mb-2" />

            <div className="w-full">
              <Link href={absoluteUrl("/")} className="text-sm text-muted-foreground">
                {process.env.NEXT_PUBLIC_APP_NAME} &copy; {new Date().getFullYear()}{" "}
              </Link>

              {unsubscribeLink && (
                <Link
                  href={unsubscribeLink}
                  className="text-sm text-muted-foreground inline-block"
                  target="_blank"
                >
                  - <span className="inline-block">Unsubscribe</span>
                </Link>
              )}
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
