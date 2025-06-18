import Link from "next/link";
import { UserAuthForm } from "@/components/UserAuthForm";
import { MarketingShell } from "@/components/landing/MarketingShell";

export default function Page() {
  return (
    <MarketingShell>
      <div className="mx-auto mb-8 mt-20 flex flex-col gap-3 justify-center w-full md:w-[350px] px-4 md:px-0">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-muted-foreground text-balance">
            Authorize to access the platform and start deploying your apps.
          </p>
        </div>

        <UserAuthForm />

        <p className="px-8 text-center text-sm text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link href="/tos" className="underline underline-offset-4 hover:text-primary">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </Link>{" "}
          including the use of analytics and cookies.
        </p>
      </div>
    </MarketingShell>
  );
}
