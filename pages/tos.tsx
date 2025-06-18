import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketingShell } from "@/components/landing/MarketingShell";

const TermsOfService: React.FC = () => {
  return (
    <MarketingShell>
      <div className="container mx-auto py-8 mt-16">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Terms of Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Welcome to {process.env.NEXT_PUBLIC_APP_NAME}. These Terms of Service (Terms)
                govern your use of our software-as-a-service platform.{" "}
                {process.env.NEXT_PUBLIC_APP_NAME}
                is a product made and managed by Wizecore (referred to as we, us, or our). By
                using {process.env.NEXT_PUBLIC_APP_NAME}, you agree to these Terms.
              </p>

              <h2 className="text-xl font-semibold">1. Use of Service</h2>
              <p>
                {process.env.NEXT_PUBLIC_APP_NAME} is a SaaS platform designed to deploy your
                apps to VPS you own. You must use this service in compliance with all
                applicable laws and regulations.
              </p>

              <h2 className="text-xl font-semibold">2. Account Registration</h2>
              <p>
                To use {process.env.NEXT_PUBLIC_APP_NAME}, you need to create an account. You
                are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account.
              </p>

              <h2 className="text-xl font-semibold">3. Privacy</h2>
              <p>
                Your privacy is important to us. Please refer to our Privacy Policy for
                information on how we collect, use, and disclose your personal information.
              </p>

              <h2 className="text-xl font-semibold">4. Intellectual Property</h2>
              <p>
                All content and materials available on {process.env.NEXT_PUBLIC_APP_NAME},
                including but not limited to text, graphics, website name, code, images and
                logos are the intellectual property of Wizecore and are protected by applicable
                copyright and trademark law.
              </p>

              <h2 className="text-xl font-semibold">5. Limitation of Liability</h2>
              <p>
                Wizecore shall not be liable for any indirect, incidental, special,
                consequential or punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly, or any loss of data, use, goodwill, or other
                intangible losses, resulting from your use of{" "}
                {process.env.NEXT_PUBLIC_APP_NAME}.
              </p>

              <h2 className="text-xl font-semibold">6. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will always post the
                most current version on our website. By continuing to use{" "}
                {process.env.NEXT_PUBLIC_APP_NAME} after changes become effective, you agree to
                be bound by the revised Terms.
              </p>

              <h2 className="text-xl font-semibold">7. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at
                {process.env.NEXT_PUBLIC_MAIL_FROM}.
              </p>

              <p className="mt-8">Last updated: 26 August 2024</p>
              <p>
                {process.env.NEXT_PUBLIC_APP_NAME}
                <br />
                Website:{" "}
                <a
                  href={process.env.NEXT_PUBLIC_APP_URL}
                  className="text-blue-600 hover:underline"
                >
                  {process.env.NEXT_PUBLIC_APP_URL}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MarketingShell>
  );
};

export default TermsOfService;
