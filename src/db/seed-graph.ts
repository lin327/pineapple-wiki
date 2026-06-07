import "dotenv/config";
import { db } from "./index";
import { entities, edges, changes, categories, articles, articleTags } from "./schema";

async function seedGraph() {
  console.log("🌱 开始录入 CMDB 图数据...\n");

  // ── 清理旧图数据 ──
  console.log("🧹 清理旧图数据...");
  await db().delete(changes);
  await db().delete(edges);
  await db().delete(entities);
  console.log("   ✅ 已清理\n");

  // ══════════════════════════════════════════
  //  1. 节点（Nodes）— 6 台真实服务器
  // ══════════════════════════════════════════
  console.log("🖥️  创建节点...");
  const nodeData = [
    {
      name: "volc-bastion",
      displayName: "火山云堡垒机",
      tier: "P0",
      status: "running" as const,
      metadata: {
        cloud: "火山引擎",
        region: "北京",
        spec: "2C/2G/40G",
        bandwidth: "1Mbps",
        tailscaleIp: "100.115.0.10",
        role: "安全堡垒机",
        software: "Next Terminal",
        inK3s: false,
      },
    },
    {
      name: "tencent-nginx",
      displayName: "腾讯云 nginx 网关",
      tier: "P0",
      status: "running" as const,
      metadata: {
        cloud: "腾讯云",
        region: "广州",
        spec: "2C/2G/50G",
        bandwidth: "4Mbps",
        tailscaleIp: "100.115.0.5",
        role: "nginx 统一入口网关",
        inK3s: false,
        sslTermination: true,
      },
    },
    {
      name: "jd-docker",
      displayName: "京东云工具机",
      tier: "P1",
      status: "running" as const,
      metadata: {
        cloud: "京东云",
        region: "上海",
        spec: "2C/4G/60G",
        bandwidth: "5Mbps",
        tailscaleIp: "100.115.0.2",
        role: "Docker 工具机",
        inK3s: false,
      },
    },
    {
      name: "k3s-master",
      displayName: "K3s Master (DO 新加坡)",
      tier: "P0",
      status: "running" as const,
      metadata: {
        cloud: "DigitalOcean",
        region: "新加坡",
        spec: "4C/8G/160G",
        tailscaleIp: "100.115.0.33",
        role: "K3s 控制面 + 入口",
        inK3s: true,
        k3sVersion: "v1.29.3+k3s1",
        nodePort: 31717,
      },
    },
    {
      name: "k3s-worker03",
      displayName: "K3s Worker03 (DO 新加坡)",
      tier: "P1",
      status: "running" as const,
      metadata: {
        cloud: "DigitalOcean",
        region: "新加坡",
        spec: "2C/4G/80G",
        role: "业务工作负载",
        inK3s: true,
        labels: { workload: "business", zone: "az-1" },
      },
    },
    {
      name: "k3s-worker04",
      displayName: "K3s Worker04 (DO 新加坡)",
      tier: "P1",
      status: "running" as const,
      metadata: {
        cloud: "DigitalOcean",
        region: "新加坡",
        spec: "2C/4G/80G",
        role: "业务工作负载",
        inK3s: true,
        labels: { workload: "business", zone: "az-2" },
      },
    },
  ];

  const insertedNodes = await db()
    .insert(entities)
    .values(nodeData.map((n) => ({ type: "node" as const, ...n })))
    .returning();
  console.log(`   ✅ 已创建 ${insertedNodes.length} 个节点`);

  // ══════════════════════════════════════════
  //  2. 服务（Services）— 9 个真实服务
  // ══════════════════════════════════════════
  console.log("⚡ 创建服务...");
  const serviceData = [
    {
      name: "ghost",
      displayName: "Ghost 博客",
      tier: "P1",
      status: "running" as const,
      metadata: { port: 30080, protocol: "http", type: "web", namespace: "content" },
    },
    {
      name: "grafana",
      displayName: "Grafana 监控",
      tier: "P1",
      status: "running" as const,
      metadata: { port: 30858, protocol: "http", type: "monitoring", namespace: "monitoring" },
    },
    {
      name: "kibana",
      displayName: "Kibana 日志",
      tier: "P2",
      status: "running" as const,
      metadata: { port: 30561, protocol: "http", type: "logging", namespace: "logging" },
    },
    {
      name: "minio",
      displayName: "MinIO 对象存储",
      tier: "P2",
      status: "running" as const,
      metadata: { port: 31901, protocol: "http", type: "storage", namespace: "storage" },
    },
    {
      name: "kuboard",
      displayName: "Kuboard 集群管理",
      tier: "P2",
      status: "running" as const,
      metadata: { port: 31717, protocol: "http", type: "management" },
    },
    {
      name: "alist",
      displayName: "Alist 文件管理",
      tier: "P1",
      status: "running" as const,
      metadata: { port: 31717, protocol: "webdav", type: "storage-gateway", namespace: "storage", capacity: "40TB" },
    },
    {
      name: "vaultwarden",
      displayName: "Vaultwarden 密码管理",
      tier: "P0",
      status: "running" as const,
      metadata: { port: 8080, protocol: "http", type: "security" },
    },
    {
      name: "uptime-kuma",
      displayName: "Uptime Kuma 探活",
      tier: "P1",
      status: "running" as const,
      metadata: { port: 3001, protocol: "http", type: "monitoring" },
    },
    {
      name: "traefik",
      displayName: "Traefik Ingress",
      tier: "P0",
      status: "running" as const,
      metadata: { port: 31717, protocol: "http", type: "gateway", namespace: "kube-system" },
    },
  ];

  const insertedServices = await db()
    .insert(entities)
    .values(serviceData.map((s) => ({ type: "service" as const, ...s })))
    .returning();
  console.log(`   ✅ 已创建 ${insertedServices.length} 个服务`);

  // ══════════════════════════════════════════
  //  3. 域名（Domains）— 9 个已用 + 3 个待定
  // ══════════════════════════════════════════
  console.log("🌐 创建域名...");
  const domainData = [
    {
      name: "pineapple-user.site",
      displayName: "主站 (Vercel)",
      tier: "P1",
      status: "running" as const,
      metadata: { ssl: true, provider: "cloudflare", backend: "vercel" },
    },
    {
      name: "ghost.pineapple-user.site",
      displayName: "Ghost 后台",
      tier: "P1",
      status: "running" as const,
      metadata: { ssl: true, backend: "k3s", port: 30080 },
    },
    {
      name: "drive.pineapple-user.site",
      displayName: "Alist 文件",
      tier: "P1",
      status: "running" as const,
      metadata: { ssl: true, backend: "k3s", port: 31717 },
    },
    {
      name: "pass.pineapple-user.site",
      displayName: "Vaultwarden",
      tier: "P0",
      status: "running" as const,
      metadata: { ssl: true, backend: "jd-cloud", port: 8080 },
    },
    {
      name: "status.pineapple-user.site",
      displayName: "Uptime Kuma",
      tier: "P1",
      status: "running" as const,
      metadata: { ssl: true, backend: "jd-cloud", port: 3001 },
    },
    {
      name: "grafana.pineapple-user.site",
      displayName: "Grafana 监控",
      tier: "P1",
      status: "running" as const,
      metadata: { ssl: true, backend: "k3s", port: 30858 },
    },
    {
      name: "kibana.pineapple-user.site",
      displayName: "Kibana 日志",
      tier: "P2",
      status: "running" as const,
      metadata: { ssl: true, backend: "k3s", port: 30561 },
    },
    {
      name: "minio.pineapple-user.site",
      displayName: "MinIO 存储",
      tier: "P2",
      status: "running" as const,
      metadata: { ssl: true, backend: "k3s", port: 31901 },
    },
    {
      name: "kuboard.pineapple-user.site",
      displayName: "Kuboard 集群",
      tier: "P2",
      status: "running" as const,
      metadata: { ssl: true, backend: "k3s", port: 31717 },
    },
    // 待定域名
    {
      name: "tentative.me",
      displayName: "Tentative (待用)",
      tier: "P2",
      status: "unknown" as const,
      metadata: { ssl: true, provider: "cloudflare", note: "待接入 K3s Ingress" },
    },
    {
      name: "tentativr.tech",
      displayName: "Tentativr (待用)",
      tier: "P2",
      status: "unknown" as const,
      metadata: { ssl: true, note: "待配置" },
    },
    {
      name: "pineapplestyle.dev",
      displayName: "PineappleStyle (待用)",
      tier: "P2",
      status: "unknown" as const,
      metadata: { ssl: true, note: "待配置" },
    },
  ];

  const insertedDomains = await db()
    .insert(entities)
    .values(domainData.map((d) => ({ type: "domain" as const, ...d })))
    .returning();
  console.log(`   ✅ 已创建 ${insertedDomains.length} 个域名`);

  // ══════════════════════════════════════════
  //  4. 人员（Person）
  // ══════════════════════════════════════════
  console.log("👤 创建人员...");
  await db()
    .insert(entities)
    .values({
      type: "person",
      name: "pineapple",
      displayName: "菠萝",
      tier: "P0",
      metadata: { role: "DevOps 运维工程师", responsibilities: ["全栈运维", "K3s 管理", "GitOps", "IaC"] },
    });
  console.log("   ✅ 已创建 1 名人员");

  // ══════════════════════════════════════════
  //  5. 告警规则（Alerts）
  // ══════════════════════════════════════════
  console.log("🚨 创建告警规则...");
  const alertData = [
    { name: "cpu-90",       displayName: "CPU > 90%",      metadata: { threshold: "90%", duration: "5m", channel: "grafana" } },
    { name: "disk-85",      displayName: "磁盘 > 85%",     metadata: { threshold: "85%", duration: "10m", channel: "grafana" } },
    { name: "ssl-expiring", displayName: "SSL 即将过期",    metadata: { threshold: "7d", channel: "cert-monitor" } },
    { name: "service-down", displayName: "服务宕机",        metadata: { threshold: "1m", channel: "uptime-kuma" } },
    { name: "memory-90",    displayName: "内存 > 90%",     metadata: { threshold: "90%", duration: "5m", channel: "grafana" } },
  ];

  const insertedAlerts = await db()
    .insert(entities)
    .values(alertData.map((a) => ({ type: "alert" as const, ...a })))
    .returning();
  console.log(`   ✅ 已创建 ${insertedAlerts.length} 条告警规则`);

  // ══════════════════════════════════════════
  //  6. Runbooks（关联已有 articles）
  // ══════════════════════════════════════════
  console.log("📋 创建 Runbook 实体...");
  const allArticles = await db().select().from(articles);
  const runbookEntities = allArticles.map((a) => ({
    type: "runbook" as const,
    name: `rb-${a.slug}`,
    displayName: a.title,
    metadata: { articleSlug: a.slug, articleId: a.id },
  }));

  const insertedRunbooks =
    runbookEntities.length > 0
      ? await db().insert(entities).values(runbookEntities).returning()
      : [];
  console.log(`   ✅ 已创建 ${insertedRunbooks.length} 个 Runbook`);

  // ══════════════════════════════════════════
  //  Helper: 按 name 查实体 ID
  // ══════════════════════════════════════════
  const allEntities = await db().select().from(entities);
  const entityMap = new Map(allEntities.map((e) => [e.name, e.id]));

  function eid(name: string): string {
    const id = entityMap.get(name);
    if (!id) throw new Error(`Entity not found: ${name}`);
    return id;
  }

  // ══════════════════════════════════════════
  //  7. 关系（Edges）
  // ══════════════════════════════════════════
  console.log("🔗 创建关系...");

  const edgeData = [
    // ── 服务 → runs_on → 节点 ──
    { source: "ghost",       target: "k3s-master",    relation: "runs_on" },
    { source: "grafana",     target: "k3s-master",    relation: "runs_on" },
    { source: "kibana",      target: "k3s-worker03",  relation: "runs_on" },
    { source: "minio",       target: "k3s-worker04",  relation: "runs_on" },
    { source: "kuboard",     target: "k3s-master",    relation: "runs_on" },
    { source: "alist",       target: "k3s-master",    relation: "runs_on" },
    { source: "traefik",     target: "k3s-master",    relation: "runs_on" },
    { source: "vaultwarden", target: "jd-docker",     relation: "runs_on" },
    { source: "uptime-kuma", target: "jd-docker",     relation: "runs_on" },

    // ── 域名 → exposes → 服务 ──
    { source: "ghost.pineapple-user.site",   target: "ghost",       relation: "exposes" },
    { source: "grafana.pineapple-user.site", target: "grafana",     relation: "exposes" },
    { source: "kibana.pineapple-user.site",  target: "kibana",      relation: "exposes" },
    { source: "minio.pineapple-user.site",   target: "minio",       relation: "exposes" },
    { source: "kuboard.pineapple-user.site", target: "kuboard",     relation: "exposes" },
    { source: "drive.pineapple-user.site",   target: "alist",       relation: "exposes" },
    { source: "pass.pineapple-user.site",    target: "vaultwarden", relation: "exposes" },
    { source: "status.pineapple-user.site",  target: "uptime-kuma", relation: "exposes" },

    // ── nginx 网关 → calls → 服务（通过 Tailscale 反代）──
    { source: "tencent-nginx", target: "traefik",      relation: "calls", metadata: { via: "tailscale", port: 31717 } },
    { source: "tencent-nginx", target: "vaultwarden",  relation: "calls", metadata: { via: "tailscale", port: 8080 } },
    { source: "tencent-nginx", target: "uptime-kuma",  relation: "calls", metadata: { via: "tailscale", port: 3001 } },

    // ── 堡垒机 → manages → 节点 ──
    { source: "volc-bastion", target: "tencent-nginx", relation: "manages" },
    { source: "volc-bastion", target: "jd-docker",     relation: "manages" },
    { source: "volc-bastion", target: "k3s-master",    relation: "manages" },

    // ── 人员 → owns → 所有服务和节点 ──
    ...serviceData.map((s) => ({
      source: "pineapple",
      target: s.name,
      relation: "owns" as const,
    })),
    ...nodeData.map((n) => ({
      source: "pineapple",
      target: n.name,
      relation: "owns" as const,
    })),

    // ── 告警 → alerts_on → 服务/节点 ──
    { source: "cpu-90",        target: "k3s-master",    relation: "alerts_on" },
    { source: "cpu-90",        target: "k3s-worker03",  relation: "alerts_on" },
    { source: "cpu-90",        target: "k3s-worker04",  relation: "alerts_on" },
    { source: "disk-85",       target: "minio",         relation: "alerts_on" },
    { source: "disk-85",       target: "alist",         relation: "alerts_on" },
    { source: "ssl-expiring",  target: "ghost",         relation: "alerts_on" },
    { source: "ssl-expiring",  target: "grafana",       relation: "alerts_on" },
    { source: "service-down",  target: "ghost",         relation: "alerts_on" },
    { source: "service-down",  target: "grafana",       relation: "alerts_on" },
    { source: "service-down",  target: "uptime-kuma",   relation: "alerts_on" },
    { source: "service-down",  target: "vaultwarden",   relation: "alerts_on" },
    { source: "memory-90",     target: "k3s-master",    relation: "alerts_on" },

    // ── 服务间依赖 ──
    { source: "grafana", target: "traefik", relation: "depends_on" },
    { source: "kibana",  target: "traefik", relation: "depends_on" },
    { source: "ghost",   target: "traefik", relation: "depends_on" },
    { source: "kuboard", target: "traefik", relation: "depends_on" },
    { source: "alist",   target: "traefik", relation: "depends_on" },
    { source: "minio",   target: "traefik", relation: "depends_on" },
    { source: "ghost",   target: "alist",   relation: "depends_on", metadata: { purpose: "media-storage" } },
  ];

  const edgesToInsert = edgeData.map((e) => ({
    sourceId: eid(e.source),
    targetId: eid(e.target),
    relation: e.relation,
    metadata: "metadata" in e && e.metadata ? e.metadata : {},
  }));

  await db().insert(edges).values(edgesToInsert);
  console.log(`   ✅ 已创建 ${edgesToInsert.length} 条关系`);

  // ══════════════════════════════════════════
  //  8. 变更记录（Changes）
  // ══════════════════════════════════════════
  console.log("📝 创建变更记录...");
  const changeData = [
    // ── Phase 1: 基础设施初始化（2026-01）──
    {
      entityId: eid("volc-bastion"),
      action: "deploy" as const,
      title: "火山云堡垒机部署",
      description: "部署 Next Terminal 收敛 SSH 访问，Tailscale 组网",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-01-04T18:24:00+08:00"),
    },
    {
      entityId: eid("tencent-nginx"),
      action: "deploy" as const,
      title: "腾讯云 nginx 网关初始化",
      description: "部署 nginx 反向代理，配置 Tailscale 内网通信",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-01-08T14:30:00+08:00"),
    },
    {
      entityId: eid("k3s-master"),
      action: "deploy" as const,
      title: "K3s 集群初始化",
      description: "部署 K3s Master + 2 Worker 节点，DigitalOcean 新加坡",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-01-12T10:00:00+08:00"),
    },
    {
      entityId: eid("traefik"),
      action: "deploy" as const,
      title: "Traefik Ingress Controller 部署",
      description: "K3s 内置 Traefik 启用，配置 NodePort 31717",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-01-12T16:45:00+08:00"),
    },
    {
      entityId: eid("jd-docker"),
      action: "deploy" as const,
      title: "京东云工具机初始化",
      description: "Docker 环境搭建，Tailscale 组网接入",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-01-18T11:20:00+08:00"),
    },

    // ── Phase 2: 安全与网络配置（2026-02 ~ 03）──
    {
      entityId: eid("tencent-nginx"),
      action: "config_change" as const,
      title: "nginx SSL 终结 + 统一入口配置",
      description: "配置所有子域名 SSL 证书，Tailscale 内网反代到 K3s/京东云",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-02-05T15:10:00+08:00"),
    },
    {
      entityId: eid("traefik"),
      action: "config_change" as const,
      title: "Traefik HTTPS 重定向配置",
      description: "配置 HTTPS 重定向、WebSocket 支持、IngressRoute 规则",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-02-12T09:30:00+08:00"),
    },
    {
      entityId: eid("vaultwarden"),
      action: "deploy" as const,
      title: "Vaultwarden 密码管理器部署",
      description: "部署到京东云 Docker，配置 pass.pineapple-user.site",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-02-20T17:00:00+08:00"),
    },
    {
      entityId: eid("uptime-kuma"),
      action: "deploy" as const,
      title: "Uptime Kuma 探活监控部署",
      description: "部署到京东云 Docker，配置核心服务探活规则",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-03-01T14:20:00+08:00"),
    },
    {
      entityId: eid("volc-bastion"),
      action: "config_change" as const,
      title: "堡垒机安全策略加固",
      description: "配置 ACL 收敛 SSH 访问权限，仅允许 Tailscale 内网穿透",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-03-10T10:45:00+08:00"),
    },

    // ── Phase 3: 应用部署与可观测性（2026-04 ~ 05）──
    {
      entityId: eid("ghost"),
      action: "deploy" as const,
      title: "Ghost 博客部署到 K3s",
      description: "部署 Ghost 到 content 命名空间，挂载 Supabase 数据库",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-04-03T16:30:00+08:00"),
    },
    {
      entityId: eid("alist"),
      action: "deploy" as const,
      title: "Alist 网盘网关部署",
      description: "挂载 115 网盘 40TB 存储，WebDAV 接入 K3s",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-04-15T11:00:00+08:00"),
    },
    {
      entityId: eid("grafana"),
      action: "deploy" as const,
      title: "Grafana + Prometheus 监控栈部署",
      description: "部署可观测性套件到 monitoring 命名空间，接入节点和服务监控",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-04-28T14:50:00+08:00"),
    },
    {
      entityId: eid("kibana"),
      action: "deploy" as const,
      title: "Kibana 日志系统部署",
      description: "部署 ELK 日志栈到 logging 命名空间",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-05-05T10:15:00+08:00"),
    },
    {
      entityId: eid("minio"),
      action: "deploy" as const,
      title: "MinIO 对象存储部署",
      description: "部署 MinIO 到 storage 命名空间，配置持久化存储",
      operator: "菠萝",
      severity: "info",
      createdAt: new Date("2026-05-12T15:30:00+08:00"),
    },
  ];

  await db().insert(changes).values(changeData);
  console.log(`   ✅ 已创建 ${changeData.length} 条变更记录`);

  // ══════════════════════════════════════════
  //  9. 更新分类（新增运维分类）
  // ══════════════════════════════════════════
  console.log("📁 更新分类...");
  const existingCats = await db().select().from(categories);
  const catSlugs = new Set(existingCats.map((c) => c.slug));

  const newCats = [
    { name: "架构设计", slug: "architecture" },
    { name: "Runbook", slug: "runbook" },
    { name: "故障复盘", slug: "postmortem" },
    { name: "变更记录", slug: "changelog" },
  ].filter((c) => !catSlugs.has(c.slug));

  if (newCats.length > 0) {
    await db().insert(categories).values(newCats);
  }
  console.log(`   ✅ 分类已更新\n`);

  // ══════════════════════════════════════════
  //  验证
  // ══════════════════════════════════════════
  console.log("🔍 验证图数据...\n");

  const finalEntities = await db().select().from(entities);
  const stats = {
    nodes: finalEntities.filter((e) => e.type === "node").length,
    services: finalEntities.filter((e) => e.type === "service").length,
    domains: finalEntities.filter((e) => e.type === "domain").length,
    persons: finalEntities.filter((e) => e.type === "person").length,
    alerts: finalEntities.filter((e) => e.type === "alert").length,
    runbooks: finalEntities.filter((e) => e.type === "runbook").length,
    edges: edgesToInsert.length,
    changes: changeData.length,
  };

  console.log(`🖥️  节点:     ${stats.nodes}`);
  console.log(`⚡ 服务:     ${stats.services}`);
  console.log(`🌐 域名:     ${stats.domains}`);
  console.log(`👤 人员:     ${stats.persons}`);
  console.log(`🚨 告警:     ${stats.alerts}`);
  console.log(`📋 Runbook:  ${stats.runbooks}`);
  console.log(`🔗 关系:     ${stats.edges}`);
  console.log(`📝 变更:     ${stats.changes}`);
  console.log(`\n✨ CMDB 图数据录入完成！`);
}

seedGraph().catch((err) => {
  console.error("❌ 录入失败:", err);
  process.exit(1);
});
