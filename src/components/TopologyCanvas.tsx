"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";

// * 图节点接口 — 对应 DB entities 表，outDegree/inDegree 为预计算的出/入度
interface GraphNode {
  id: string;
  type: string;
  name: string;
  displayName: string;
  tier: string | null;
  status: string | null;
  metadata: Record<string, unknown>;
  outDegree: number;
  inDegree: number;
}

// * 图边接口 — 对应 DB edges 表，sourceId → targetId 为有向边
interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// * 实体类型配色 — 每种类型在画布上有独立的视觉标识
const typeColors: Record<string, string> = {
  person: "#8b5cf6",
  domain: "#10b981",
  service: "#f59e0b",
  node: "#6366f1",
  alert: "#ef4444",
  runbook: "#06b6d4",
};

// * 实体类型图标 — 绘制在节点圆圈内
const typeIcons: Record<string, string> = {
  node: "🖥️",
  service: "⚡",
  domain: "🌐",
  person: "👤",
  alert: "🚨",
  runbook: "📋",
};

// * 实体类型中文标签 — 用于图例和筛选按钮
const typeLabels: Record<string, string> = {
  node: "节点",
  service: "服务",
  domain: "域名",
  person: "人员",
  alert: "告警",
  runbook: "手册",
};

// * 关系类型中文标签 — 显示在详情面板的关系列表中
const relationLabels: Record<string, string> = {
  runs_on: "运行在",
  exposes: "暴露",
  owns: "负责",
  fixes: "修复",
  alerts_on: "监控",
  depends_on: "依赖",
  calls: "调用",
  manages: "管理",
};

// * 分层顺序 — 拓扑图从上到下: 人员 → 域名 → 服务 → 节点 → 告警/手册
const layerOrder: Record<string, number> = {
  person: 0,
  domain: 1,
  service: 2,
  node: 3,
  alert: 4,
  runbook: 5,
};

// * 分层 Y 坐标 — 每层在画布上的垂直位置（像素）
const layerY: Record<number, number> = {
  0: 70,
  1: 180,
  2: 300,
  3: 420,
  4: 530,
  5: 530,
};

// * 节点半径 — P0(核心)最大，P2(低优先级)最小，体现重要性层级
const tierRadius: Record<string, number> = {
  P0: 24,
  P1: 18,
  P2: 14,
};

// * 默认筛选类型 — 仅显示这四种，person 和 runbook 默认隐藏
const filterTypes = ["node", "service", "domain", "alert"] as const;

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

export function TopologyCanvas({ initialData }: { initialData: GraphData }) {
  const searchParams = useSearchParams();
  // * URL ?focus=xxx 参数 — 支持从外部链接直接聚焦到某个节点
  const focusName = searchParams.get("focus");

  const [graph] = useState<GraphData>(initialData);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [relatedEdges, setRelatedEdges] = useState<GraphEdge[]>([]);
  const [relatedNodes, setRelatedNodes] = useState<Map<string, GraphNode>>(new Map());
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(filterTypes)
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const didFocus = useRef(false);

  // * 力导向布局算法 — useMemo 缓存，仅 graph 变化时重新计算
  // * 算法步骤：1) 按类型分层 2) 按度数排序 3) 均匀分布 4) 斥力+引力迭代
  const layoutMap = useMemo(() => {
    const canvasW = 900;
    const padding = 60;

    // * Step 1: 按实体类型分组到不同层
    const groups = new Map<string, GraphNode[]>();
    for (const n of graph.nodes) {
      const layer = layerOrder[n.type] ?? 5;
      if (!groups.has(String(layer))) groups.set(String(layer), []);
      groups.get(String(layer)!)!.push(n);
    }

    const nodes: LayoutNode[] = [];

    // * Step 2: 每层内按总度数降序排列，高连接度节点居中
    for (const [layerStr, group] of groups) {
      const layer = Number(layerStr);
      const baseY = layerY[layer] ?? 300;
      const count = group.length;
      const spacing = (canvasW - padding * 2) / (count + 1);

      group.sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree));

      for (let i = 0; i < count; i++) {
        nodes.push({
          ...group[i],
          x: padding + spacing * (i + 1),
          y: baseY,
        });
      }
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // * Step 3: 力导向迭代 — 20 轮斥力(同层节点互斥) + 引力(边两端吸引)
    for (let iter = 0; iter < 20; iter++) {
      // * 斥力 — 同层节点间距越小斥力越大，防止重叠
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (layerOrder[a.type] !== layerOrder[b.type]) continue;
          const dx = b.x - a.x;
          const dist = Math.max(Math.abs(dx), 1);
          const force = 2000 / (dist * dist);
          const fx = (dx / dist) * force;
          a.x -= fx;
          b.x += fx;
        }
      }

      // * 引力 — 有边相连的节点相互吸引，使关联节点靠近
      for (const edge of graph.edges) {
        const src = nodeMap.get(edge.sourceId);
        const tgt = nodeMap.get(edge.targetId);
        if (!src || !tgt) continue;
        const dx = tgt.x - src.x;
        const force = dx * 0.005;
        src.x += force * 0.3;
        tgt.x -= force * 0.3;
      }

      // * 边界约束 — 将节点限制在画布可视区域内
      for (const node of nodes) {
        node.x = Math.max(padding, Math.min(canvasW - padding, node.x));
      }
    }

    return new Map(nodes.map((n) => [n.id, n]));
  }, [graph]);

  // * 选中节点 — 同时查找该节点的所有关联边和关联节点
  const selectNode = useCallback(
    (node: GraphNode) => {
      setSelected(node);

      const relEdges = graph.edges.filter(
        (e) => e.sourceId === node.id || e.targetId === node.id
      );
      setRelatedEdges(relEdges);

      // * 收集关联节点 ID（排除自身）
      const relNodeIds = new Set<string>();
      for (const e of relEdges) {
        relNodeIds.add(e.sourceId);
        relNodeIds.add(e.targetId);
      }
      relNodeIds.delete(node.id);

      const relNodes = new Map<string, GraphNode>();
      for (const n of graph.nodes) {
        if (relNodeIds.has(n.id)) relNodes.set(n.id, n);
      }
      setRelatedNodes(relNodes);
    },
    [graph]
  );

  // * URL focus — 首次渲染时根据 ?focus=xxx 自动选中目标节点
  // * didFocus ref 防止重复聚焦
  useEffect(() => {
    if (didFocus.current || !focusName) return;
    const target = graph.nodes.find(
      (n) => n.name === focusName || n.id === focusName
    );
    if (target) {
      selectNode(target);
      didFocus.current = true;
    }
  }, [graph, focusName, selectNode]);

  // * Canvas 绘制 — 使用 2D Context 直接绘制，性能优于 SVG/DOM
  // ! 必须处理 devicePixelRatio，否则高分屏下会模糊
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 900 * dpr;
    canvas.height = 600 * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 900, 600);

    // * 分层标线 — 虚线分隔各层，左侧显示层名称
    const layerNames = [
      { y: layerY[0], label: "👤 人员" },
      { y: layerY[1], label: "🌐 域名" },
      { y: layerY[2], label: "⚡ 服务" },
      { y: layerY[3], label: "🖥️ 节点" },
      { y: layerY[4], label: "🚨 告警 / 📋 手册" },
    ];
    for (const layer of layerNames) {
      ctx.beginPath();
      ctx.setLineDash([4, 6]);
      ctx.moveTo(20, layer.y);
      ctx.lineTo(880, layer.y);
      ctx.strokeStyle = "#f3f4f6";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#d1d5db";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(layer.label, 24, layer.y - 4);
    }

    // * 绘制边 — 选中节点的关联边高亮蓝色加粗，其余灰色细线
    for (const edge of graph.edges) {
      const source = layoutMap.get(edge.sourceId);
      const target = layoutMap.get(edge.targetId);
      if (!source || !target) continue;
      if (!activeFilters.has(source.type) || !activeFilters.has(target.type)) continue;

      const isSelected =
        selected &&
        (edge.sourceId === selected.id || edge.targetId === selected.id);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isSelected ? "#3b82f6" : "#e5e7eb";
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();

      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const targetRadius = tierRadius[target.tier || "P1"] || 18;
      const arrowX = target.x - (targetRadius + 4) * Math.cos(angle);
      const arrowY = target.y - (targetRadius + 4) * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 7 * Math.cos(angle - 0.4), arrowY - 7 * Math.sin(angle - 0.4));
      ctx.lineTo(arrowX - 7 * Math.cos(angle + 0.4), arrowY - 7 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = isSelected ? "#3b82f6" : "#d1d5db";
      ctx.fill();
    }

    // * 绘制节点 — 圆圈大小由 tier 决定，填充色由类型决定
    for (const node of graph.nodes) {
      const layout = layoutMap.get(node.id);
      if (!layout || !activeFilters.has(node.type)) continue;

      const color = typeColors[node.type] || "#6b7280";
      const radius = tierRadius[node.tier || "P1"] || 18;
      const isUnknown = node.status === "unknown";

      const isHighlighted =
        selected &&
        (node.id === selected.id ||
          graph.edges.some(
            (e) =>
              (e.sourceId === selected.id && e.targetId === node.id) ||
              (e.targetId === selected.id && e.sourceId === node.id)
          ));
      const isFocusTarget = focusName && (node.name === focusName || node.id === focusName);

      ctx.beginPath();
      ctx.arc(layout.x, layout.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted || isFocusTarget ? color : `${color}33`;
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = isHighlighted || isFocusTarget ? 3 : 1.5;
      if (isUnknown) {
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const iconSize = radius >= 20 ? 15 : radius >= 16 ? 13 : 11;
      ctx.font = `${iconSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isHighlighted || isFocusTarget ? "#fff" : color;
      ctx.fillText(typeIcons[node.type] || "?", layout.x, layout.y);

      ctx.font = "11px sans-serif";
      ctx.fillStyle = isHighlighted || isFocusTarget ? "#1f2937" : "#6b7280";
      ctx.textAlign = "center";
      ctx.fillText(
        (node.displayName || node.name).slice(0, 18),
        layout.x,
        layout.y + radius + 14
      );
    }
  }, [graph, selected, activeFilters, focusName, layoutMap]);

  // * 点击交互 — 将鼠标坐标转换为画布坐标，查找最近的节点
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = 900 / rect.width;
      const scaleY = 600 / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      let closest: GraphNode | null = null;
      let minDist = 40;

      for (const node of graph.nodes) {
        if (!activeFilters.has(node.type)) continue;
        const layout = layoutMap.get(node.id);
        if (!layout) continue;
        const radius = tierRadius[node.tier || "P1"] || 18;
        const dist = Math.sqrt((x - layout.x) ** 2 + (y - layout.y) ** 2);
        if (dist < radius + 8 && dist < minDist) {
          minDist = dist;
          closest = node;
        }
      }

      if (closest) {
        selectNode(closest);
      } else {
        setSelected(null);
        setRelatedEdges([]);
        setRelatedNodes(new Map());
      }
    },
    [graph, activeFilters, selectNode, layoutMap]
  );

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">🗺️ 基础设施拓扑</h1>

      {/* * 筛选按钮组 — 点击切换显示/隐藏对应类型的节点 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-gray-400 mr-1">筛选类型：</span>
        {filterTypes.map((type) => {
          const active = activeFilters.has(type);
          const color = typeColors[type];
          return (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
              style={{
                backgroundColor: active ? `${color}20` : "transparent",
                borderColor: active ? color : "#e5e7eb",
                color: active ? color : "#9ca3af",
              }}
            >
              <span>{typeIcons[type]}</span>
              <span>{typeLabels[type]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-6">
        {/* 拓扑图 */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={900}
            height={600}
            className="w-full cursor-pointer"
            style={{ maxWidth: 900, maxHeight: 600 }}
            onClick={handleCanvasClick}
          />

          {/* 图例 */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `${color}55`, border: `2px solid ${color}` }}
                />
                <span className="text-xs text-gray-600">
                  {typeIcons[type]} {typeLabels[type] || type}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                <span className="text-xs text-gray-500">P0</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4.5 h-4.5 rounded-full border-2 border-gray-400" />
                <span className="text-xs text-gray-500">P1</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400" />
                <span className="text-xs text-gray-500">P2</span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-400" />
                <span className="text-xs text-gray-500">unknown</span>
              </div>
            </div>
          </div>
        </div>

        {/* * 详情面板 — 显示选中节点的属性、metadata 和关联关系列表 */}
        {selected && (
          <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 p-5 h-fit sticky top-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{typeIcons[selected.type]}</span>
              <h2 className="text-lg font-semibold text-gray-900">
                {selected.displayName || selected.name}
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-mono mb-1">{selected.name}</p>
            <div className="flex items-center gap-2 mb-4">
              {selected.tier && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor:
                      selected.tier === "P0" ? "#fef2f2" : selected.tier === "P1" ? "#fffbeb" : "#f0fdf4",
                    color:
                      selected.tier === "P0" ? "#dc2626" : selected.tier === "P1" ? "#d97706" : "#16a34a",
                  }}
                >
                  {selected.tier}
                </span>
              )}
              {selected.status && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor:
                      selected.status === "running" ? "#f0fdf4" : selected.status === "unknown" ? "#f9fafb" : "#fef2f2",
                    color:
                      selected.status === "running" ? "#16a34a" : selected.status === "unknown" ? "#9ca3af" : "#dc2626",
                  }}
                >
                  {selected.status}
                </span>
              )}
            </div>

            {selected.metadata && Object.keys(selected.metadata).length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">属性</h3>
                <div className="space-y-1">
                  {Object.entries(selected.metadata)
                    .filter(([, v]) => v !== null && v !== undefined)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-gray-500">{k}</span>
                        <span className="text-gray-900 font-medium max-w-[160px] truncate text-right">
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {relatedEdges.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                  关系 ({relatedEdges.length})
                </h3>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {relatedEdges.map((edge) => {
                    const isSource = edge.sourceId === selected.id;
                    const otherNodeId = isSource ? edge.targetId : edge.sourceId;
                    const otherNode =
                      relatedNodes.get(otherNodeId) ||
                      graph.nodes.find((n) => n.id === otherNodeId);
                    const relLabel = relationLabels[edge.relation] || edge.relation;

                    return (
                      <div
                        key={edge.id}
                        className="flex items-center gap-2 text-sm p-2 rounded-lg bg-gray-50"
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                          style={{
                            backgroundColor: `${typeColors[otherNode?.type || "node"]}33`,
                            color: typeColors[otherNode?.type || "node"],
                          }}
                        >
                          {typeIcons[otherNode?.type || "node"]}
                        </span>
                        <span className="text-gray-500 text-xs shrink-0">
                          {isSource ? relLabel : `被${relLabel}`}
                        </span>
                        <span className="text-gray-900 font-medium text-xs truncate">
                          {otherNode?.displayName || otherNode?.name || "?"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
