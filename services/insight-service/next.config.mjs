/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle at .next/standalone for Docker / Cloud Run.
  // Has no effect on `npm run dev` or Vercel deploys.
  output: "standalone",
};

export default nextConfig;
