import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',  // 리사이징된 이미지 Base64 전송 허용
    },
  },
};

export default nextConfig;
