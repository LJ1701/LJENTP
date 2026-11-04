/** @type {import('next').NextConfig} */
const nextConfig = {
  // Résumé uploads (up to 4 MB) are sent to a server action; the default limit is 1 MB.
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } }
};

export default nextConfig;
