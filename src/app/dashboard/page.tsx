import { db } from "@/db";
import { entities, edges, changes } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "故障仪表盘" };

export default async function DashboardPage() {
  let alertEntities: { id: string; name: string; displayName: string | null; metadata: Record<string, unknown> | null }[] = [];
  let changeList: { id: string; entityId: string | null; action: string; title: string; description: string | null; operator: string | null; severity: string | null; createdAt: Date }[] = [];
  let allEdges: { id: string; sourceId: string; targetId: string; relation: string }[] = [];
  let allEntities: { id: string; type: string; name: string; displayName: string | null }[] = [];

  try {
    [alertEntities, changeList, allEdges, allEntities] = await Promise.all([
      db().select().from(entities).where(eq(entities.type, "alert")),
      db().select().from(changes).orderBy(desc(changes.createdAt)).limit(10),
      db().select().from(edges),
      db().select().from(entities),
    ]);
  } catch {
    // DB unavailable
  }

  const entityMap = new Map(allEntities.map((e) => [e.id, e]));
  const nameMap = new Map(allEntities.map((e) => [e.id, e.displayName || e.name]));

  // 为每个告警找到关联的服务
  const alertTargets = alertEntities.map((alert) => {
    const targets = allEdges
      .filter((e) => e.sourceId === alert.id && e.relation === "alerts_on")
      .map((e) => entityMap.get(e.targetId))
      .filter(Boolean);
    return { alert, targets };
  });

  // 统计
  const stats = {
    nodes: allEntities.filter((e) => e.type === "node").length,
    services: allEntities.filter((e) => e.type === "service").length,
    domains: allEntities.filter((e) => e.type === "domain").length,
    alerts: alertEntities.length,
  };

  const severityColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    critical: "bg-red-100 text-red-700",
  };

  const actionLabels: Record<string, string> = {
    deploy: "部署",
    config_change: "配置变更",
    scale: "扩缩容",
    incident: "故障",
    alert_fire: "告警触发",
    alert_resolve: "告警恢复",
    maintenance: "维护",
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">📊 故障仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "节点", value: stats.nodes, icon: "🖥️", color: "bg-indigo-50" },
          { label: "服务", value: stats.services, icon: "⚡", color: "bg-amber-50" },
          { label: "域名", value: stats.domains, icon: "🌐", color: "bg-emerald-50" },
          { label: "告警规则", value: stats.alerts, icon: "🚨", color: "bg-red-50" },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.color} rounded-xl p-4 border border-gray-200`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm text-gray-600">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 告警面板 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🚨 告警规则与影响范围</h2>
        {alertTargets.length === 0 ? (
          <p className="text-gray-500">暂无告警规则</p>
        ) : (
          <div className="grid gap-3">
            {alertTargets.map(({ alert, targets }) => {
              const meta = alert.metadata as Record<string, unknown>;
              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚨</span>
                      <span className="font-semibold text-gray-900">
                        {alert.displayName || alert.name}
                      </span>
                    </div>
                    {meta.threshold ? (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                        阈值: {String(meta.threshold)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">影响服务:</span>
                    {targets.map((t) => (
                      <Link
                        key={t!.id}
                        href={`/topology?focus=${t!.name}`}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full hover:bg-blue-50 hover:text-blue-600"
                      >
                        ⚡ {t!.displayName || t!.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 最近变更 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">🔄 最近变更</h2>
          <Link href="/changes" className="text-sm text-blue-600 hover:underline">
            查看全部 →
          </Link>
        </div>
        {changeList.length === 0 ? (
          <p className="text-gray-500">暂无变更记录</p>
        ) : (
          <div className="space-y-2">
            {changeList.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-3"
              >
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    severityColors[c.severity || "info"] || severityColors.info
                  }`}
                >
                  {actionLabels[c.action] || c.action}
                </span>
                <span className="flex-1 text-sm text-gray-900 truncate">
                  {c.title}
                </span>
                {c.entityId && entityMap.has(c.entityId) && (
                  <span className="text-xs text-gray-400">
                    → {nameMap.get(c.entityId)}
                  </span>
                )}
                {c.operator && (
                  <span className="text-xs text-gray-400">{c.operator}</span>
                )}
                <time className="text-xs text-gray-400">
                  {c.createdAt
                    ? new Date(c.createdAt).toISOString().slice(0, 10)
                    : ""}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
