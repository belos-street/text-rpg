import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许局域网设备通过 IP 访问开发服务器资源
  // （Next 16 默认阻断非 localhost 源的 /_next/* 请求，会导致局域网设备无法水合）
  allowedDevOrigins: ["localhost", "192.168.31.22"],
};

export default nextConfig;
