/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_LAST_UPDATED: new Date().toISOString(),
  }
};

export default nextConfig;
