import { Logo, Navbar } from "@/components/landing/Navbar";
import { cn } from "@/lib/utils";

const FooterNav = () => {
  return (
    <div className="container gap-x-6 gap-y-4 pt-6">
      {/* Brand Column */}
      <div className="flex flex-col gap-4 items-center">
        <div className="inline-flex flex-col gap-2">
          <div className="flex items-center gap-2 justify-center">
            <Logo />
            <span className="font-bold text-lg">{process.env.NEXT_PUBLIC_APP_NAME}</span>
          </div>
          <p className="text-sm text-muted-foreground"></p>
        </div>
      </div>
    </div>
  );
};

export const MarketingShell = ({
  children,
  className,
  footer,
  center
}: {
  children: React.ReactNode;
  className?: string;
  footer?: boolean;
  center?: boolean;
}) => (
  <div
    className={cn(
      "min-h-screen border border-transparent",
      className,
      center && "flex flex-col justify-center"
    )}
  >
    <Navbar />

    <div className="mt-12">{children}</div>

    {(footer ?? true) && (
      <footer className={cn("mt-8 lg:pt-0 lg:pb-0 flex flex-col justify-center items-center")}>
        <FooterNav />

        <div className="text-center text-sm text-muted-foreground mb-4">
          <p>Built with ❤️ in Helsinki, Finland.</p>
          <p>
            &copy; {process.env.NEXT_PUBLIC_YEAR}
            {new Date().getFullYear() !== parseInt(process.env.NEXT_PUBLIC_YEAR ?? "2025")
              ? `-${new Date().getFullYear()}`
              : ""}{" "}
            {process.env.NEXT_PUBLIC_APP_NAME}
          </p>
        </div>
      </footer>
    )}
  </div>
);
