const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg", "gif", "ico", "webp", "jp2", "avif"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  experimental: {
    webVitalsAttribution: ["CLS", "LCP"],
    serverSourceMaps: true
  },
  logging: {
    fetches: {
      fullUrl: true
    }
  },
  async headers() {
    return [
      {
        source: "/api/:everything*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, max-age=0"
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400"
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*"
          }
        ]
      }
    ];
  },
  /** @type {import('next').NextConfig['webpack']} */
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: new RegExp(`\.(${IMAGE_EXTENSIONS.join("|")})$`),
      // Next.js already handles url() in css/sass/scss files
      issuer: /\.\w+(?<!(s?c|sa)ss)$/i,
      use: [
        {
          loader: "url-loader",
          options: {
            limit: 8192,
            fallback: "file-loader",
            outputPath: `${isServer ? "../" : ""}static/images/`,
            publicPath: "/_next/static/images/",
            name: "[name]-[hash].[ext]"
          }
        }
      ]
    });

    config.module.rules.push(
      ...[
        {
          test: /\.ya?ml$/,
          use: "js-yaml-loader"
        }
      ]
    );

    // https://github.com/vercel/next.js/pull/50792#issuecomment-1586637022
    config.watchOptions = { poll: 1000, aggregateTimeout: 500 };
    return config;
  }
};

module.exports = nextConfig;
