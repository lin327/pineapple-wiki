import { db } from "@/db";
import { changes, entities } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "变更时间线" };

const actionLabels: Record<string, string> = {
  deploy: "🚀 部署",
  config_change: "⚙️ 配置变更",
  scale: "📈 扩缩容",
  incident: "🔥 故障",
  alert_fire: "🚨 告警触发",
  alert_resolve: "✅ 告警恢复",
  maintenance: "🔧 维护",
};

const severityColors: Record<string, string> = {
  info: "border-blue-400 bg-blue-50",
  warning: "border-yellow-400 bg-yellow-50",
  critical: "border-red-400 bg-red-50",
};

interface ChangeItem {
  id: string;
  entityId: string | null;
  action: string;
  title: string;
  description: string | null;
  operator: string | null;
  severity: string | null;
  createdAt: Date;
}

interface Phase {
  label: string;
  icon: string;
  range: string;
  items: ChangeItem[];
}

export default async function ChangesPage() {
  let changeList: { id: string; entityId: string | null; action: string; title: string; description: string | null; operator: string | null; severity: string | null; createdAt: Date }[] = [];
  let entityMap = new Map<string, string>();

  try {
    changeList = await db()
      .select()
      .from(changes)
      .orderBy(desc(changes.createdAt))
      .limit(50);

    const allEntities = await db()
      .select({ id: entities.id, displayName: entities.displayName, name: entities.name })
      .from(entities);
    entityMap = new Map(allEntities.map((e) => [e.id, e.displayName || e.name]));
  } catch {
    // DB unavailable
  }

  // 按阶段分组
  const phases: Phase[] = [
    { label: "应用部署与可观测性", icon: "🚀", range: "2026-04 ~ 05", items: [] },
    { label: "安全与网络配置",     icon: "🔒", range: "2026-02 ~ 03", items: [] },
    { label: "基础设施初始化",     icon: "🏗️", range: "2026-01",      items: [] },
  ];

  for (const c of changeList) {
    const d = new Date(c.createdAt);
    const month = d.getMonth() + 1; // 1-12
    if (month >= 4) phases[0].items.push(c);
    else if (month >= 2) phases[1].items.push(c);
    else phases[2].items.push(c);
  }

  function formatDate(d: Date) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd} ${hh}:${mi}`;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🔄 变更时间线</h1>

      {changeList.length === 0 ? (
        <p className="text-gray-500">暂无变更记录</p>
      ) : (
        <div className="space-y-8">
          {phases.map((phase) => {
            if (phase.items.length === 0) return null;
            return (
              <div key={phase.label}>
                {/* 阶段标题 */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">{phase.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{phase.label}</h2>
                    <p className="text-xs text-gray-400">{phase.range}</p>
                  </div>
                  <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {phase.items.length} 项变更
                  </span>
                </div>

                {/* 时间线 */}
                <div className="relative ml-3">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-4">
                    {phase.items.map((c) => {
                      const date = c.createdAt ? formatDate(new Date(c.createdAt)) : "";
                      const entityName = c.entityId ? entityMap.get(c.entityId) : null;

                      return (
                        <div key={c.id} className="relative pl-10">
                          {/* 圆点 */}
                          <div
                            className={`absolute left-1.5 top-2 w-3 h-3 rounded-full border-2 ${
                              (c.severity || "info") === "critical"
                                ? "border-red-500 bg-red-100"
                                : (c.severity || "info") === "warning"
                                  ? "border-yellow-500 bg-yellow-100"
                                  : "border-blue-500 bg-blue-100"
                            }`}
                          />

                          <div
                            className={`rounded-lg border-l-4 p-3.5 ${
                              severityColors[c.severity || "info"] || severityColors.info
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">
                                {actionLabels[c.action] || c.action}
                              </span>
                              {entityName && (
                                <span className="text-xs bg-white/60 text-gray-600 px-2 py-0.5 rounded-full">
                                  {entityName}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 mb-1">{c.title}</p>
                            {c.description && (
                              <p className="text-xs text-gray-500">{c.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                              {c.operator && <span>👤 {c.operator}</span>}
                              <time>{date}</time>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
