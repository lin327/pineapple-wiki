import { db } from "@/db";
import { entities, edges } from "@/db/schema";
import { Suspense } from "react";
import { TopologyCanvas } from "@/components/TopologyCanvas";

export const dynamic = "force-dynamic";

export default async function TopologyPage() {
  const [allEntities, allEdges] = await Promise.all([
    db().select().from(entities),
    db().select().from(edges),
  ]);

  // 计算度数
  const degreeMap = new Map<string, { out: number; in: number }>();
  for (const e of allEntities) {
    degreeMap.set(e.id, { out: 0, in: 0 });
  }
  for (const edge of allEdges) {
    const src = degreeMap.get(edge.sourceId);
    if (src) src.out++;
    const tgt = degreeMap.get(edge.targetId);
    if (tgt) tgt.in++;
  }

  const graphData = {
    nodes: allEntities.map((e) => ({
      id: e.id,
      type: e.type,
      name: e.name,
      displayName: e.displayName ?? "",
      tier: e.tier,
      status: e.status,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
      outDegree: degreeMap.get(e.id)?.out ?? 0,
      inDegree: degreeMap.get(e.id)?.in ?? 0,
    })),
    edges: allEdges.map((e) => ({
      id: e.id,
      sourceId: e.sourceId,
      targetId: e.targetId,
      relation: e.relation,
    })),
  };

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">加载拓扑数据中...</p>
        </div>
      }
    >
      <TopologyCanvas initialData={graphData} />
    </Suspense>
  );
}
