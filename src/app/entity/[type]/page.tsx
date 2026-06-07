import { db } from "@/db";
import { entities, edges } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

const typeLabels: Record<string, { icon: string; title: string }> = {
  node: { icon: "🖥️", title: "节点" },
  service: { icon: "⚡", title: "服务" },
  domain: { icon: "🌐", title: "域名" },
  person: { icon: "👤", title: "人员" },
  alert: { icon: "🚨", title: "告警" },
  runbook: { icon: "📋", title: "Runbook" },
};

const relationLabels: Record<string, string> = {
  runs_on: "运行在",
  exposes: "暴露",
  owns: "负责",
  fixes: "修复",
  alerts_on: "监控",
  depends_on: "依赖",
  calls: "调用",
};

interface PageProps {
  params: Promise<{ type: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const info = typeLabels[type];
  return { title: info ? `${info.icon} ${info.title}` : "实体" };
}

export default async function EntityListPage({ params }: PageProps) {
  const { type } = await params;
  const info = typeLabels[type];
  if (!info) notFound();

  let entityList: { id: string; type: string; name: string; displayName: string | null; metadata: Record<string, unknown> | null; createdAt: Date; updatedAt: Date }[] = [];
  let edgeData: { id: string; sourceId: string; targetId: string; relation: string; metadata: Record<string, unknown> | null; createdAt: Date }[] = [];

  try {
    entityList = await db()
      .select()
      .from(entities)
      .where(eq(entities.type, type))
      .orderBy(asc(entities.name));

    edgeData = await db().select().from(edges);
  } catch {
    // DB unavailable
  }

  // 为每个实体找到关联边
  const entityEdges = new Map<string, typeof edgeData>();
  for (const e of entityList) {
    entityEdges.set(e.id, []);
  }
  for (const edge of edgeData) {
    if (entityEdges.has(edge.sourceId)) {
      entityEdges.get(edge.sourceId)!.push(edge);
    }
    if (entityEdges.has(edge.targetId)) {
      entityEdges.get(edge.targetId)!.push(edge);
    }
  }

  // 构建实体名查找表
  const entityNameMap = new Map(
    (await db().select({ id: entities.id, name: entities.name, displayName: entities.displayName }).from(entities)).map(
      (e) => [e.id, e.displayName || e.name]
    )
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{info.icon}</span>
        <h1 className="text-2xl font-bold text-gray-900">
          {info.title}
          <span className="ml-2 text-base font-normal text-gray-400">
            ({entityList.length})
          </span>
        </h1>
      </div>

      {entityList.length === 0 ? (
        <p className="text-gray-500">暂无 {info.title} 实体</p>
      ) : (
        <div className="grid gap-4">
          {entityList.map((entity) => {
            const related = entityEdges.get(entity.id) ?? [];
            const meta = entity.metadata as Record<string, unknown>;

            return (
              <div
                key={entity.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {entity.displayName || entity.name}
                    </h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {entity.name}
                    </p>
                  </div>
                  <Link
                    href={`/topology?focus=${entity.name}`}
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    查看拓扑 →
                  </Link>
                </div>

                {/* 属性 */}
                {meta && Object.keys(meta).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(meta)
                      .filter(([, v]) => v !== null && v !== undefined && v !== "")
                      .slice(0, 6)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                        >
                          <span className="text-gray-400">{k}:</span>
                          <span className="font-medium">{String(v)}</span>
                        </span>
                      ))}
                  </div>
                )}

                {/* 关系 */}
                {related.length > 0 && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 mb-2">关系</p>
                    <div className="flex flex-wrap gap-2">
                      {related.slice(0, 8).map((edge) => {
                        const isSource = edge.sourceId === entity.id;
                        const otherName = isSource
                          ? entityNameMap.get(edge.targetId)
                          : entityNameMap.get(edge.sourceId);
                        const relLabel = relationLabels[edge.relation] || edge.relation;
                        const arrow = isSource ? "→" : "←";

                        return (
                          <span
                            key={edge.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700"
                          >
                            {isSource ? relLabel : `被${relLabel}`} {arrow}{" "}
                            <span className="font-medium">{otherName}</span>
                          </span>
                        );
                      })}
                      {related.length > 8 && (
                        <span className="text-xs text-gray-400">
                          +{related.length - 8} 更多
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
