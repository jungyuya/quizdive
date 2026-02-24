import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",  // 개발 환경에서 SW 비활성화
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = withPWA({
  // Next.js 16에서 Turbopack이 기본 빌더로 사용됨.
  // next-pwa가 내부적으로 webpack 설정을 추가하므로,
  // 빈 turbopack 설정을 명시하여 "webpack config without turbopack config" 에러를 방지.
  turbopack: {},
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',  // 리사이징된 이미지 Base64 전송 허용
    },
  },
});

export default nextConfig;
