import path from "path";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // required for static export
  basePath: isProd ? "/your-repo-name" : "",
  assetPrefix: isProd ? "/your-repo-name/" : "",
  images: {
    unoptimized: true, // disable next/image optimization for static export
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    };

    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
