import { db } from "@/db";
import { entities, edges } from "@/db/schema";
import { successResponse, handleUnknownError } from "@/lib/api";
import { eq, or } from "drizzle-orm";

// GET /api/graph — 返回全量图数据（节点 + 边），供拓扑页面使用
export async function GET() {
  try {
    const allEntities = await db().select().from(entities);
    const allEdges = await db().select().from(edges);

    // 为每个实体附加其关联边
    const entityRelations = new Map<string, {
      outgoing: typeof allEdges;
      incoming: typeof allEdges;
    }>();

    for (const e of allEntities) {
      entityRelations.set(e.id, { outgoing: [], incoming: [] });
    }

    for (const edge of allEdges) {
      entityRelations.get(edge.sourceId)?.outgoing.push(edge);
      entityRelations.get(edge.targetId)?.incoming.push(edge);
    }

    return successResponse({
      nodes: allEntities.map((e) => ({
        id: e.id,
        type: e.type,
        name: e.name,
        displayName: e.displayName,
        tier: e.tier,
        status: e.status,
        metadata: e.metadata,
        outDegree: entityRelations.get(e.id)?.outgoing.length ?? 0,
        inDegree: entityRelations.get(e.id)?.incoming.length ?? 0,
      })),
      edges: allEdges.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        relation: e.relation,
        metadata: e.metadata,
      })),
    });
  } catch {
    return handleUnknownError();
  }
}
