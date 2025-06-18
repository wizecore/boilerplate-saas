import { isProd } from "@/lib/utils";
import { unstable_createNodejsStream } from "@vercel/og";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const stream = await unstable_createNodejsStream(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          width: "100%",
          height: "100%",
          border: "2px solid rgba(56, 189, 248, 0.1)",
          borderRadius: "16px",
          padding: "32px",
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px"
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: "800",
              background: "linear-gradient(90deg, #9867f0, #ed4e50)",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: "-0.02em"
            }}
          >
            {process.env.NEXT_PUBLIC_APP_NAME}
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "rgba(18, 88, 38, 0.9)",
              fontWeight: "600",
              textAlign: "center",
              maxWidth: "600px",
              lineHeight: "1.4"
            }}
          >
            {process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "Description"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "16px"
          }}
        >
          {["Fast", "Simple", "Easy"].map(text => (
            <div
              key={text}
              style={{
                padding: "8px 16px",
                background: "rgba(56, 189, 248, 0.1)",
                borderRadius: "8px",
                color: "rgba(224, 242, 254, 0.9)",
                fontSize: "28px",
                fontWeight: "500",
                border: "1px solid rgba(56, 189, 248, 0.2)"
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630
    }
  );

  res.setHeader("Content-Type", "image/png");
  if (isProd()) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  await stream.pipe(res);
}
