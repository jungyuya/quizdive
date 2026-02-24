import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",  // 개발 환경에서 SW 비활성화
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = withPWA({
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',  // 리사이징된 이미지 Base64 전송 허용
    },
  },
});

export default nextConfig;
