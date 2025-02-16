// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import createMDX from "@next/mdx";
import { headers } from "next/headers";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any, options: any) => {
    config.module.rules.push({
      test: /\.(wgsl|vs|fs|vert|frag)$/,
      use: ["shader-loader"],
    });

    return config;
  },
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // eslint is not helpful imo
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optionally, add any other Next.js config below
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // Set your origin
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-File-Name",
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
