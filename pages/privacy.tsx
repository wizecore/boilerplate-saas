import React from "react";
import Head from "next/head";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MarketingShell } from "@/components/landing/MarketingShell";

const Typography = ({
  variant,
  children,
  className
}: {
  variant: "h1" | "h2" | "h3" | "p";
  children: React.ReactNode;
  className?: string;
}) => {
  const variants = {
    h1: "text-3xl font-bold",
    h2: "text-2xl font-bold",
    h3: "text-xl font-bold",
    p: "text-base"
  };
  return <p className={`${className ?? ""} ${variants[variant]}`}>{children}</p>;
};

const PrivacyPolicy: React.FC = () => {
  return (
    <MarketingShell>
      <Head>
        <title>Privacy Policy</title>
        <meta
          name="description"
          content={"Privacy Policy for " + process.env.NEXT_PUBLIC_APP_NAME}
        />
      </Head>
      <div className="container mx-auto px-4 py-8 mt-16">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <Typography variant="p" className="mb-4">
              We are committed to protecting your privacy and ensuring the security of your
              personal information. This Privacy Policy outlines our practices concerning the
              collection, use, and protection of your data.
            </Typography>

            <Typography variant="h3" className="mb-2">
              1. Data Collection and Usage
            </Typography>

            <Typography variant="p" className="mb-4">
              We do not track your activities or collect any unnecessary personal information.
              We only collect and use the data that is essential for providing our services to
              you.
            </Typography>

            <Typography variant="h3" className="mb-2">
              2. Data Sharing
            </Typography>
            <Typography variant="p" className="mb-4">
              We do not share your data with any third parties. Your information remains
              strictly confidential and is used solely for the purpose of providing and
              improving our services.
            </Typography>

            <Typography variant="h3" className="mb-2">
              3. Data Storage
            </Typography>
            <Typography variant="p" className="mb-4">
              All data is hosted on servers located within the European Union (EU), ensuring
              compliance with EU data protection regulations.
            </Typography>

            <Typography variant="h3" className="mb-2">
              4. GDPR Compliance
            </Typography>
            <Typography variant="p" className="mb-4">
              We fully comply with the General Data Protection Regulation (GDPR). This means
              you have the right to access, rectify, and erase your personal data, as well as
              the right to restrict or object to its processing.
            </Typography>

            <Typography variant="h3" className="mb-2">
              5. Changes to This Policy
            </Typography>
            <Typography variant="p" className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page.
            </Typography>

            <Typography variant="h3" className="mb-2">
              6. Contact Us
            </Typography>
            <Typography variant="p" className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at
              {process.env.NEXT_PUBLIC_MAIL_FROM}.
            </Typography>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
};

export default PrivacyPolicy;
