import { MailTemplate } from "@/lib/mail/mailTemplate";
import { absoluteUrl } from "@/lib/utils";
import { Button, Link, Section, Text } from "@react-email/components";

/**
 * If signIn is true, it means user already has an account.
 *
 * If not, display a disclaimer that by activating account they comply with ToS and Privacy
 * Policy.
 */
export const SignInMail = ({ signIn, url }: { signIn?: boolean; url?: string }) => (
  <MailTemplate
    preview={
      signIn
        ? "Your login link to " + process.env.NEXT_PUBLIC_APP_NAME
        : "Activate your " + process.env.NEXT_PUBLIC_APP_NAME + " account"
    }
    title={signIn ? "Your login link" : "Activate your account"}
  >
    <Section className="my-4 gmail-blend-screen">
      <Section className="gmail-blend-difference">
        <Button
          className="bg-primary text-primary-foreground rounded-md font-medium text-base py-3 px-6 no-underline text-center block hover:bg-primary/90"
          href={url}
        >
          Proceed to {process.env.NEXT_PUBLIC_APP_NAME}
        </Button>
      </Section>
    </Section>

    <Text className="mb-4 text-base text-muted-foreground">
      This link will only be valid for the next 10 minutes.
    </Text>

    {!signIn && (
      <Text className="mb-4 text-base text-muted-foreground">
        By clicking the button above, you agree to the{" "}
        <Link href={absoluteUrl("/terms")}>Terms of Service</Link> and{" "}
        <Link href={absoluteUrl("/privacy")}>Privacy Policy</Link>.
      </Text>
    )}
  </MailTemplate>
);
