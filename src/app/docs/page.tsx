import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = { title: "架构文档" };

export const dynamic = "force-dynamic";

const OPS_DIR = "/Users/pineapple/Desktop/workspace/Projects/pineapple-ops";

function readYamlFiles(dir: string, prefix = ""): { path: string; content: string }[] {
  const results: { path: string; content: string }[] = [];
  const fullDir = join(OPS_DIR, dir);
  if (!existsSync(fullDir)) return results;

  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...readYamlFiles(join(dir, entry.name), relPath));
    } else if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
      try {
        const content = readFileSync(join(fullDir, entry.name), "utf-8");
        results.push({ path: relPath, content });
      } catch {}
    }
  }
  return results;
}

export default function DocsPage() {
  const k3sFiles = readYamlFiles("k3s");
  const dockerFiles = readYamlFiles("docker");

  // 检查 SVG 文件是否存在
  const hasArchSvg = existsSync(join(process.cwd(), "public", "architecture.svg"));
  const hasTestSvg = existsSync(join(process.cwd(), "public", "test-flow.svg"));

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">📖 架构文档</h1>
      <p className="text-sm text-gray-500 mb-6">
        pineapple-ops 仓库 · 声明式基础设施管理
      </p>

      {/* 测试图 */}
      {hasTestSvg && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🧪 流量路径</h2>
          <div className="flex justify-center">
            <img src="/test-flow.svg" alt="流量路径图" className="max-w-full h-auto" />
          </div>
        </div>
      )}

      {/* 架构全景图 */}
      {hasArchSvg && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🏗️ 架构全景图</h2>
          <div className="flex justify-center overflow-x-auto">
            <img src="/architecture.svg" alt="6 节点混合云架构图" className="max-w-full h-auto" />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            源文件: <code>pineapple-ops/docs/architecture.mmd</code>
          </p>
        </div>
      )}

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "K3s Manifests", count: k3sFiles.length, icon: "☸️", color: "bg-blue-50" },
          { label: "Docker Compose", count: dockerFiles.length, icon: "🐳", color: "bg-emerald-50" },
          { label: "总文件数", count: k3sFiles.length + dockerFiles.length, icon: "📄", color: "bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 border border-gray-200`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm text-gray-600">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.count}</p>
          </div>
        ))}
      </div>

      {/* K3s Manifests */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">☸️ K3s Manifests</h2>
        <div className="space-y-3">
          {k3sFiles.map((f) => (
            <details key={f.path} className="bg-white rounded-xl border border-gray-200 group">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm">📄</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900 font-mono">{f.path}</span>
                    <span className="text-xs text-gray-400 ml-2">{f.content.split("\n").length} 行</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-open:rotate-90 transition-transform">▶</span>
              </summary>
              <div className="px-4 pb-4">
                <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-96 overflow-y-auto font-mono">
                  {f.content}
                </pre>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Docker Compose */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">🐳 Docker Compose</h2>
        <div className="space-y-3">
          {dockerFiles.map((f) => (
            <details key={f.path} className="bg-white rounded-xl border border-gray-200 group">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm">🐳</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900 font-mono">{f.path}</span>
                    <span className="text-xs text-gray-400 ml-2">{f.content.split("\n").length} 行</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-open:rotate-90 transition-transform">▶</span>
              </summary>
              <div className="px-4 pb-4">
                <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-96 overflow-y-auto font-mono">
                  {f.content}
                </pre>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* 仓库结构 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">📁 仓库目录结构</h2>
        <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 font-mono">{`pineapple-ops/
├── k3s/                        # K8s 声明式部署
│   ├── ghost-k3s.yaml          # Ghost 博客 + MySQL
│   ├── alist-k3s.yaml          # Alist 网盘聚合
│   ├── minio-k3s.yaml          # MinIO 对象存储
│   ├── kuboard-create-token.yaml
│   └── efk/                    # EFK 日志栈
│       ├── elasticsearch.yaml
│       ├── fluent-bit.yaml
│       ├── kibana.yaml
│       └── ilm-setup.yaml
├── docker/                     # Docker Compose
│   └── docker-compose.yaml     # Vaultwarden + Uptime Kuma
├── docs/                       # 文档
│   ├── architecture.mmd        # Mermaid 架构图
│   └── awesome-ops.md          # 运维项目合辑
└── scripts/                    # 自动化脚本`}</pre>
      </div>
    </div>
  );
}
