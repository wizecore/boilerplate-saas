"use client";

import React, { useCallback, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import useSWR from "swr";
import { User, Github, Mail } from "lucide-react";

const errorMessages = {
  Signin: "Try signing with a different account.",
  OAuthSignin: "Try signing with a different account.",
  OAuthCallback: "Try signing with a different account.",
  OAuthCreateAccount: "Try signing with a different account.",
  EmailCreateAccount: "Try signing with a different account.",
  Callback: "Google sign in cancelled. Try signing with a different account.",
  OAuthAccountNotLinked:
    "To confirm your identity, sign in with the same account you used originally.",
  EmailSignin: "Check your email address.",
  CredentialsSignin: "Sign in failed. Check the details you provided are correct.",
  WrongProvider: "Use the same provider to sign in as you did previously (e.g. Google).",
  SessionRequired: "",
  default: "Unable to sign in."
};

function useQueryParams<T extends Record<string, unknown>>() {
  const { query } = useRouter();
  return query as T;
}

export function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const router = useRouter();
  const { error } = useQueryParams<{ error: string }>();

  const callbackUrl = router?.query?.callbackUrl
    ? (router?.query?.callbackUrl as string)
    : "/dashboard";

  const { data: providerConfig } = useSWR<Record<string, unknown>>("/api/auth/providers");
  const providers = Object.keys(providerConfig ?? {});

  const errorMessage = error
    ? (errorMessages[error as keyof typeof errorMessages] ?? errorMessages.default)
    : undefined;

  useEffect(() => {
    // FIXME: This does not fire in MacOS Desktop Safari
    if (window.PerformanceNavigationTiming) {
      const navigationEntries = performance.getEntriesByType("navigation");
      const found = navigationEntries.find(e => {
        // FIXME: this property not in the spec
        return (e as { type?: string }).type === "back_forward";
      });
      if (found) {
        setLoading(false);
      }
    }
  }, []);

  const onSubmit = useCallback(
    async (event: React.SyntheticEvent) => {
      event.preventDefault();
      setLoading(true);

      if (!email) {
        toast({
          title: "Error",
          description: "Email is required",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const result = providers?.includes("credentials")
        ? await signIn("credentials", {
            username: email,
            password,
            redirectTo: callbackUrl,
            callbackUrl
          })
        : await signIn("email", {
            email,
            redirectTo: callbackUrl,
            callbackUrl
          });

      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      } else if (providers?.includes("credentials")) {
        router.push(callbackUrl);
      }

      setLoading(false);
    },
    [callbackUrl, email, password, providers, router]
  );

  const handleGitHubSignIn = useCallback(() => {
    setLoading(true);
    signIn("github", { callbackUrl });
  }, [callbackUrl]);

  const handleGoogleSignIn = useCallback(() => {
    setLoading(true);
    signIn("google", { callbackUrl });
  }, [callbackUrl]);

  if (!providers) {
    return null;
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {error && errorMessage !== "" && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}
      {providers?.includes("credentials") || providers?.includes("email") ? (
        <form onSubmit={onSubmit}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={loading}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => {
                  if (
                    process.env.NODE_ENV === "development" &&
                    providers?.includes("credentials")
                  ) {
                    e.target.value = "test@test." + process.env.NEXT_PUBLIC_CREDENTIALS_DOMAIN;
                    setEmail("test@test." + process.env.NEXT_PUBLIC_CREDENTIALS_DOMAIN);
                  }
                }}
              />
            </div>
            {providers?.includes("credentials") ? (
              <div className="grid gap-1">
                <Label className="sr-only" htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  placeholder="Password"
                  type="password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  disabled={loading}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => {
                    e.target.type = "text";
                    if (process.env.NODE_ENV === "development") {
                      e.target.value = "123";
                      setPassword("123");
                    }
                  }}
                  onBlur={e => (e.target.type = "password")}
                />
              </div>
            ) : null}

            <Button disabled={loading}>
              <User className="mr-2 h-4 w-4" /> Confirm with E-mail
            </Button>
          </div>
        </form>
      ) : null}
      {(providers.includes("github") || providers.includes("google")) &&
      (providers.includes("credentials") || providers.includes("email")) ? (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
      ) : null}
      <div className="flex gap-2 justify-center">
        {providers.includes("github") ? (
          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={handleGitHubSignIn}
            className="w-full"
          >
            <Github className="mr-2 h-4 w-4" /> GitHub
          </Button>
        ) : null}

        {providers?.includes("google") ? (
          <Button
            variant="outline"
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            <Mail className="mr-2 h-4 w-4" /> Google
          </Button>
        ) : null}
      </div>
    </div>
  );
}
