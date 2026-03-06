import type { NextConfig } from "next";

// Para deploy com Node.js (ex.: Hostinger Business com login): use NEXT_OUTPUT_MODE=node
// Para export estático (só pasta out/): npm run build (padrão)
const useNodeDeploy = process.env.NEXT_OUTPUT_MODE === 'node';

const nextConfig: NextConfig = {
  ...(useNodeDeploy ? {} : { output: 'export' }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
