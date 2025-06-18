import logger from "@/lib/logger";
import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import path from "path";
import fs from "node:fs";
import { ReactElement } from "react";
import { nonFalse, pwgen } from "@/lib/utils";

export const sendMail = async (
  to: string | string[],
  subject: string,
  html: string | NonNullable<ReactElement>,
  options?: {
    from?: string;
    referenceId?: string;
    plainText?: boolean | string;
    darkModeForce?: boolean;
    unsubscribeLink?: string;
  }
) => {
  logger.info("Sending mail to", to, process.env.SMTP_HOST, process.env.SMTP_PORT);
  const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    ...(process.env.SMTP_PORT ? { port: parseInt(process.env.SMTP_PORT) } : {}),
    secure: process.env.SMTP_SECURE === "1",
    ...(process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      : {})
  });

  const cid = `icon-${pwgen(16)}`;

  const now = Date.now();
  // FIXME: Enabling pretty breaks with error "Unexpected closing tag..."
  // https://github.com/resend/react-email/issues/1838
  let str = typeof html === "string" ? html : await render(html, { pretty: false });
  const icon = fs.readFileSync(path.join(process.cwd(), "/public/icon.png"));
  const haveIcon = str.includes('"/icon.png"');
  str = str.replace('"/icon.png"', `"cid:${cid}"`);

  // Fixing color blending for Gmail dark mode
  // See https://www.hteumeuleu.com/2021/fixing-gmail-dark-mode-css-blend-modes/
  if (options?.darkModeForce) {
    if (!str.startsWith("<!DOCTYPE html")) {
      str = `<!DOCTYPE html>${str}`;
    }

    str = str
      .replace("<body ", "<body class=\'body\' ")
      .replace("<body\n", "<body class=\'body\'\n")
      .replace("<body>", '<body class="body">');

    str = str.replace(
      "</head>",
      `<style>
      @media (max-width: 480px) {
        .body .gmail-blend-screen { background:#000000; mix-blend-mode: screen; }
        .body .gmail-blend-difference { background:#000000; mix-blend-mode: difference; }
      }
    </style></head>`
    );
  }

  logger.info("Rendered mail in", Date.now() - now, "ms");
  const from = process.env.NEXT_PUBLIC_MAIL_FROM ?? "hello@example.com";

  const result = await mailer.sendMail({
    from: options?.from ?? (process.env.NEXT_PUBLIC_APP_NAME ?? "Example") + " <" + from + ">",
    to,
    // Add development host name to the subject
    subject,
    html: str,
    text:
      options?.plainText === true && typeof html === "object"
        ? await render(html, { plainText: true })
        : typeof options?.plainText === "string"
          ? options.plainText
          : undefined,
    // Set this to prevent Gmail from threading emails.
    // More info: https://resend.com/changelog/custom-email-headers
    headers: {
      "X-Entity-Ref-ID": options?.referenceId ?? String(new Date().getTime()),
      ...(options?.unsubscribeLink ? { "List-Unsubscribe": options.unsubscribeLink } : {})
    },
    attachments: [
      // Only include an icon if it present in the email,
      // otherwise it might be shown as an attachment.
      haveIcon
        ? ({
            filename: false,
            content: icon,
            contentType: "image/png",
            cid,
            contentDisposition: "inline"
          } as const)
        : undefined
    ].filter(nonFalse)
  });

  logger.info("Mail sent", result);

  if (result.rejected?.length > 0) {
    throw new Error("Mail rejected");
  }

  if (result.accepted?.length === 0) {
    throw new Error("Mail not accepted");
  }

  return result;
};
