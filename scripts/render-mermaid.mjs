// scripts/render-mermaid.mjs
// 从 architecture.mmd 生成 public/architecture.svg
// 使用 mermaid.ink API（无需 puppeteer）

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MMD_PATH = "/Users/pineapple/Desktop/workspace/Projects/pineapple-ops/docs/architecture.mmd";
const OUT_DIR = join(ROOT, "public");
const OUT_PATH = join(OUT_DIR, "architecture.svg");

// 读取并清理 mmd
let code = readFileSync(MMD_PATH, "utf-8");
code = code
  .replace(/^classDef\s+.*$/gm, "")
  .replace(/^class\s+.*$/gm, "")
  .replace(/^style\s+\w+\s+.*$/gm, "")
  .replace(/^\s*%%.*$/gm, "")
  .trim();

console.log("📐 Mermaid 代码长度:", code.length);

// 用 mermaid.ink API 渲染 SVG
const encoded = Buffer.from(code).toString("base64url");
const url = `https://mermaid.ink/svg/${encoded}`;

console.log("🌐 请求 mermaid.ink ...");

try {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const svg = await res.text();

  if (!svg.includes("<svg")) {
    throw new Error("返回内容不是 SVG");
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, svg, "utf-8");
  console.log(`✅ 已生成: ${OUT_PATH} (${svg.length} bytes)`);
} catch (err) {
  console.error("❌ 渲染失败:", err.message);
  console.log("🔄 尝试简化版...");

  // 简化版
  const simpleCode = `graph TB
    User([用户浏览器]) -->|HTTPS| CF[Cloudflare CDN]
    CF --> NG[腾讯云 Nginx]
    subgraph K3S [K3s 集群 DO新加坡]
        GHOST[Ghost :30080]
        GRAFANA[Grafana :30858]
        ALIST[AList :31717]
        MINIO[MinIO :31901]
        KIBANA[Kibana :30561]
    end
    NG -->|31717| K3S
    subgraph JD [京东云]
        VW[Vaultwarden :8080]
        UK[Uptime Kuma :3001]
    end
    NG --> JD
    subgraph HSY [火山云]
        BASTION[堡垒机 Next-Terminal]
    end
    GHOST --> MDB[MariaDB]
    GHOST -.-> MINIO
    ALIST -.-> CLOUD[115 云盘 40TB]
`;

  try {
    const encoded2 = Buffer.from(simpleCode).toString("base64url");
    const url2 = `https://mermaid.ink/svg/${encoded2}`;
    const res2 = await fetch(url2, { signal: AbortSignal.timeout(30000) });
    const svg2 = await res2.text();

    if (!svg2.includes("<svg")) throw new Error("不是 SVG");

    writeFileSync(OUT_PATH, svg2, "utf-8");
    console.log(`✅ 已生成简化版: ${OUT_PATH} (${svg2.length} bytes)`);
  } catch (err2) {
    console.error("❌ 简化版也失败:", err2.message);
    process.exit(1);
  }
}
