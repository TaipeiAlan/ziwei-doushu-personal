// GitHub Pages 部署时由 workflow 设定 NEXT_PUBLIC_BASE_PATH（如 /ziwei-doushu-personal）；本机开发留空即可
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ['lunar-javascript'],
};

module.exports = nextConfig;
