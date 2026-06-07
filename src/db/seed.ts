import "dotenv/config";
import { db } from "./index";
import { categories, tags, articles, articleTags } from "./schema";

async function seed() {
  console.log("🌱 开始插入运维知识库数据...\n");

  // 0. 清空已有数据（按依赖顺序）
  console.log("🧹 清空已有数据...");
  await db().delete(articleTags);
  await db().delete(articles);
  await db().delete(tags);
  await db().delete(categories);
  console.log("   ✅ 已清空\n");

  // 1. 创建分类
  console.log("📁 创建分类...");
  const insertedCategories = await db()
    .insert(categories)
    .values([
      { name: "架构设计", slug: "architecture" },
      { name: "Runbook", slug: "runbook" },
      { name: "故障复盘", slug: "postmortem" },
      { name: "变更记录", slug: "changelog" },
      { name: "技术笔记", slug: "tech-notes" },
    ])
    .returning();
  console.log(`   ✅ 已创建 ${insertedCategories.length} 个分类`);

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => [c.slug, c.id])
  );

  // 2. 创建标签
  console.log("🏷️  创建标签...");
  const insertedTags = await db()
    .insert(tags)
    .values([
      { name: "K3s" },
      { name: "Tailscale" },
      { name: "Docker" },
      { name: "Nginx" },
      { name: "Traefik" },
      { name: "Cloudflare" },
      { name: "GitOps" },
      { name: "Supabase" },
      { name: "Velero" },
      { name: "Monitoring" },
    ])
    .returning();
  console.log(`   ✅ 已创建 ${insertedTags.length} 个标签`);

  const tagMap = Object.fromEntries(
    insertedTags.map((t) => [t.name, t.id])
  );

  // 3. 创建文章
  console.log("📝 创建文章...");

  const articlesData = [
    {
      title: "6 节点混合云架构总览",
      slug: "hybrid-cloud-architecture-overview",
      content: `# 6 节点混合云架构总览

## 架构目标

利用 6 台跨云闲置服务器，通过 Tailscale SD-WAN 组网，打造面向全球交付的混合云底座。核心原则：**声明式运维（Declarative Ops）**、**GitOps**、**零脚本 — 100% YAML / Helm / Kustomize / GitHub Actions**。

## 高光亮点

- **计算存储分离** — Supabase (DBaaS) 接管数据，K3s 完全无状态
- **FinOps 降本** — WebDAV + Alist 把 40TB 115 网盘变冷备对象存储
- **4A 安全架构** — 火山云堡垒机收敛 SSH，Tailscale 零信任网络

## 架构分层

\`\`\`
┌─ Overlay 网络层 ── Tailscale 组网 6 节点
├─ 流量接入层   ── Cloudflare (WAF/DDoS) → 腾讯云 nginx → 各节点
└─ 发布控制层   ── GitHub cloud-ops 仓库 (SSOT)
\`\`\`

### 存储架构

| 类型 | 方案 |
|------|------|
| 关系型 | Supabase (Serverless PostgreSQL) |
| 冷备/媒体 | 115 网盘 → Alist (WebDAV) → K3s 挂载 / Velero 备份池 |

## 节点分配（6 台）

### 管控与灾备区（国内，不入 K3s）

| 云厂商 | 规格 | 用途 |
|--------|------|------|
| 火山云 | 2C/2G | 安全堡垒机 (Next Terminal) |
| 腾讯云 | 2C/2G | nginx 统一入口网关 (SSL + 反代) |
| 京东云 | 2C/4G | Vaultwarden + Uptime Kuma (Docker) |

### 核心计算集群（海外 K3s）

| 节点 | 云厂商 | 规格 | 磁盘 | 运行服务 |
|------|--------|------|------|----------|
| Master01 | DO (新加坡) | 4C/8G | 160G | K3s 控制面 + 入口 |
| Worker03 | DO (新加坡) | 2C/4G | 80G | 业务工作负载 |
| Worker04 | DO (新加坡) | 2C/4G | 80G | 业务工作负载 |

## 技术栈总览

| 类别 | 技术选型 |
|------|----------|
| 网络 | Tailscale (SD-WAN) / Next Terminal (堡垒机) |
| 编排 | K3s (轻量 Kubernetes) |
| CI/CD | GitHub Actions / TCR (镜像仓库) |
| 网关 | Cloudflare + 腾讯云 nginx / Traefik (集群内 Ingress) |
| 数据 | Supabase (Serverless DB) / 115 网盘 + Alist (WebDAV) |
| 可观测 | Grafana / Uptime Kuma / ELK |
| 灾备 | Velero → 备份至 115 网盘 |

## 域名与服务映射

所有域名由 Cloudflare 托管，腾讯云 nginx 统一 SSL 终结 + 反代。

| 域名 | 服务 | 后端 | 端口 |
|------|------|------|------|
| pineapple-user.site | Ghost 博客 | Vercel | — |
| ghost.pineapple-user.site | Ghost 后台管理 | K3s | 30080 |
| drive.pineapple-user.site | Alist 文件管理 | K3s | 31717 |
| pass.pineapple-user.site | Vaultwarden | 京东云 | 8080 |
| status.pineapple-user.site | Uptime Kuma | 京东云 | 3001 |
| grafana.pineapple-user.site | Grafana 监控 | K3s | 30858 |

> K3s 后端统一通过 Traefik Ingress (NodePort 31717) 路由。`,
      categoryId: catMap["architecture"],
      isPublished: true,
      tagNames: ["K3s", "Tailscale", "Cloudflare", "Nginx"],
    },
    {
      title: "Tailscale SD-WAN 组网方案",
      slug: "tailscale-sdwan-networking",
      content: `# Tailscale SD-WAN 组网方案

## 组网原理

Tailscale 基于 WireGuard 协议构建 Mesh VPN 网络，每个节点安装 tailscale 守护进程后自动获得 \`100.x.x.x\` 内网 IP，节点间通过 DERP 中继或直连 P2P 打洞通信。

### 为什么选择 Tailscale

| 对比维度 | 传统 VPN | Tailscale |
|----------|----------|-----------|
| 配置复杂度 | 手动配置证书/路由 | 装包即用，零配置 |
| 网络拓扑 | Hub-Spoke 或全互联手动 | 自动 Mesh |
| 访问控制 | iptables 规则 | ACL 声明式策略 |
| NAT 穿透 | 需要端口映射 | 自动 STUN/TURN 打洞 |
| 密钥管理 | 手动分发 | SSO 集成自动轮换 |

## 6 节点互联拓扑

\`\`\`
                    ┌─────────────────┐
                    │   Tailscale     │
                    │  Coordination  │
                    │    Server      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                     │
   ┌────┴────┐         ┌────┴────┐          ┌─────┴────┐
   │ 火山云   │         │ 腾讯云   │          │  京东云    │
   │ 堡垒机   │         │ nginx   │          │  Docker   │
   │100.64.0.1│        │100.64.0.2│         │100.115.0.2│
   └─────────┘         └────┬────┘          └──────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────┴────┐   ┌────┴────┐   ┌─────┴────┐
         │Master01 │   │Worker03 │   │Worker04  │
         │  K3s    │   │  K3s    │   │  K3s     │
         │100.115. │   │100.115. │   │100.115.  │
         │  0.33   │   │  0.34   │   │  0.35    │
         └─────────┘   └─────────┘   └──────────┘
\`\`\`

## ACL 访问控制配置

Tailscale ACL 在管理后台以 JSON 格式声明，核心策略：

\`\`\`json
{
  "acls": [
    {
      "action": "accept",
      "src": ["group:infra"],
      "dst": ["*:*"]
    },
    {
      "action": "accept",
      "src": ["tag:k3s-nodes"],
      "dst": ["tag:k3s-nodes:*"]
    }
  ],
  "tagOwners": {
    "tag:k3s-nodes": ["group:infra"],
    "tag:docker-hosts": ["group:infra"]
  }
}
\`\`\`

### ACL 策略说明

1. **infra 组**拥有全网管理权限，可 SSH 到任意节点
2. **K3s 节点间**开放全端口通信（CNI 需要）
3. **京东云 Docker 节点**通过 ACL 控制，仅允许腾讯云 nginx 访问特定端口
4. 堡垒机作为跳板机，所有 SSH 必须经过 Next Terminal 审计

## Subnet Router 配置

腾讯云 nginx 节点同时作为 Subnet Router，将京东云内网段广播给 Tailscale 网络：

\`\`\`bash
# 在腾讯云节点上启用 IP 转发
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

# 启动 tailscale 并宣告子网路由
tailscale up --advertise-routes=172.16.0.0/12 --accept-routes
\`\`\`

## 运维注意事项

- Tailscale 版本需保持一致，避免 WireGuard 协议不兼容
- DERP 中继服务器建议自建，降低公网 DERP 延迟
- ACL 变更后需在管理后台 Apply，所有节点约 30 秒内生效
- 建议开启 MagicDNS，通过主机名访问节点而非 IP`,
      categoryId: catMap["architecture"],
      isPublished: true,
      tagNames: ["Tailscale", "Cloudflare"],
    },
    {
      title: "K3s 集群部署与配置",
      slug: "k3s-cluster-deployment",
      content: `# K3s 集群部署与配置

## 集群架构

采用 1 Master + 2 Worker 的 K3s 集群，部署在 DigitalOcean 新加坡区域，通过 Tailscale 内网互联。

| 节点 | 规格 | Tailscale IP | 角色 |
|------|------|-------------|------|
| Master01 | 4C/8G/160G | 100.115.0.33 | Server (Control Plane) |
| Worker03 | 2C/4G/80G | 100.115.0.34 | Agent |
| Worker04 | 2C/4G/80G | 100.115.0.35 | Agent |

## Master 节点部署

### 前置准备

\`\`\`bash
# 关闭 swap（K3s 要求）
swapoff -a
sed -i '/ swap / s/^/#/' /etc/fstab

# 确认 Tailscale 已连接
tailscale status
\`\`\`

### 安装 K3s Server

\`\`\`bash
# 使用 Tailscale 接口作为节点通信地址
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server" \\
  sh -s - \\
  --node-ip=100.115.0.33 \\
  --advertise-address=100.115.0.33 \\
  --flannel-backend=wireguard-native \\
  --disable=traefik \\
  --write-kubeconfig-mode=644
\`\`\`

> 注意：先禁用内置 Traefik，后续通过 Helm 安装自定义配置版本。

### 获取 Join Token

\`\`\`bash
# Master 节点上获取 token
cat /var/lib/rancher/k3s/server/node-token
\`\`\`

## Worker 节点部署

\`\`\`bash
# 在 Worker03 和 Worker04 上执行
curl -sfL https://get.k3s.io | K3S_URL=https://100.115.0.33:6443 \\
  K3S_TOKEN=<node-token> \\
  INSTALL_K3S_EXEC="agent" \\
  sh -s - \\
  --node-ip=100.115.0.34
\`\`\`

## Traefik Ingress 配置

通过 Helm 安装 Traefik，配置 NodePort 暴露（31717）：

\`\`\`yaml
# traefik-values.yaml
ports:
  web:
    nodePort: 31717
  websecure:
    nodePort: 31718

service:
  type: NodePort

ingressRoute:
  dashboard:
    enabled: true
    matchRule: "Host(\`traefik.pineapple-user.site\`)"
\`\`\`

\`\`\`bash
helm repo add traefik https://traefik.github.io/charts
helm install traefik traefik/traefik \\
  -n kube-system \\
  -f traefik-values.yaml
\`\`\`

## Ingress 资源示例

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ghost-admin
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
    - host: ghost.pineapple-user.site
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ghost-admin
                port:
                  number: 2368
\`\`\`

## 集群验证

\`\`\`bash
# 检查节点状态
kubectl get nodes -o wide

# 检查系统 Pod
kubectl get pods -A

# 验证 Traefik
kubectl get svc -n kube-system traefik
\`\`\``,
      categoryId: catMap["architecture"],
      isPublished: true,
      tagNames: ["K3s", "Traefik", "Tailscale", "GitOps"],
    },
    {
      title: "nginx 网关统一入口配置",
      slug: "nginx-gateway-unified-entry",
      content: `# nginx 网关统一入口配置

## 架构说明

腾讯云 nginx 节点（2C/2G）作为统一入口网关，承担以下职责：

1. **SSL 终结** — Cloudflare Flexible 模式下，nginx 处理源站 HTTPS
2. **反向代理** — 将请求分发至后端不同节点（通过 Tailscale 内网）
3. **安全兜底** — IP 白名单 + Rate Limiting

## 流量路径

\`\`\`
用户 → Cloudflare (WAF/DDoS) → 腾讯云 nginx (SSL终结) → Tailscale内网 → 后端服务
\`\`\`

## SSL 证书配置

\`\`\`bash
# 安装 certbot
apt install -y certbot python3-certbot-nginx

# 申请证书（Cloudflare DNS 验证）
certbot certonly --nginx -d pineapple-user.site -d "*.pineapple-user.site"
\`\`\`

## nginx 主配置

\`\`\`nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    include /etc/nginx/conf.d/*.conf;
}
\`\`\`

## 反代配置（各服务）

\`\`\`nginx
# /etc/nginx/conf.d/services.conf

# Ghost 博客管理后台 → K3s NodePort
server {
    listen 443 ssl;
    server_name ghost.pineapple-user.site;

    ssl_certificate     /etc/letsencrypt/live/pineapple-user.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pineapple-user.site/privkey.pem;

    location / {
        proxy_pass http://100.115.0.33:30080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Vaultwarden → 京东云 Docker
server {
    listen 443 ssl;
    server_name pass.pineapple-user.site;

    ssl_certificate     /etc/letsencrypt/live/pineapple-user.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pineapple-user.site/privkey.pem;

    location / {
        proxy_pass http://100.115.0.2:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持（Vaultwarden 需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Uptime Kuma → 京东云 Docker
server {
    listen 443 ssl;
    server_name status.pineapple-user.site;

    ssl_certificate     /etc/letsencrypt/live/pineapple-user.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pineapple-user.site/privkey.pem;

    location / {
        proxy_pass http://100.115.0.2:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Grafana → K3s NodePort
server {
    listen 443 ssl;
    server_name grafana.pineapple-user.site;

    ssl_certificate     /etc/letsencrypt/live/pineapple-user.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pineapple-user.site/privkey.pem;

    location / {
        proxy_pass http://100.115.0.33:30858;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
\`\`\`

## 操作步骤

\`\`\`bash
# 1. 测试配置语法
nginx -t

# 2. 重载配置
systemctl reload nginx

# 3. 验证各服务可达
curl -I https://ghost.pineapple-user.site
curl -I https://pass.pineapple-user.site
curl -I https://status.pineapple-user.site
curl -I https://grafana.pineapple-user.site

# 4. 设置证书自动续期
echo "0 3 * * * certbot renew --quiet && systemctl reload nginx" | crontab -
\`\`\`

## 注意事项

- Cloudflare 设置为 **Full (Strict)** 模式时，源站需要有效 SSL 证书
- Tailscale 内网地址变动时需同步更新 nginx 配置
- 建议启用 \`proxy_connect_timeout\` 避免后端不可达时长时间挂起`,
      categoryId: catMap["runbook"],
      isPublished: true,
      tagNames: ["Nginx", "Tailscale", "Cloudflare"],
    },
    {
      title: "Ghost 博客故障恢复",
      slug: "ghost-blog-troubleshooting",
      content: `# Ghost 博客故障恢复 Runbook

## 服务架构

- **前端展示**：Vercel 部署（pineapple-user.site）
- **后台管理**：K3s Pod（ghost.pineapple-user.site → NodePort 30080）
- **数据库**：Supabase (Serverless PostgreSQL)

## 故障现象

访问 \`ghost.pineapple-user.site\` 返回 502/504 或页面空白。

## 排查流程

### Step 1：确认 K3s 节点状态

\`\`\`bash
# 检查节点是否 Ready
kubectl get nodes

# 检查 Ghost Pod 状态
kubectl get pods -n ghost -l app=ghost
\`\`\`

常见 Pod 状态：

| 状态 | 含义 | 处理 |
|------|------|------|
| CrashLoopBackOff | 启动后反复崩溃 | 查看日志 |
| ImagePullBackOff | 拉镜像失败 | 检查镜像仓库凭据 |
| Pending | 资源不足 | 检查 Node 资源 |
| Running 但 502 | 应用内部错误 | 进入容器排查 |

### Step 2：查看 Pod 日志

\`\`\`bash
# 查看最近 100 行日志
kubectl logs -n ghost -l app=ghost --tail=100

# 查看上一个崩溃容器的日志
kubectl logs -n ghost -l app=ghost --previous --tail=50
\`\`\`

### Step 3：检查数据库连接

\`\`\`bash
# 进入 Ghost 容器测试数据库连通性
kubectl exec -it -n ghost deploy/ghost -- sh

# 容器内测试
wget -qO- https://<supabase-host>/rest/v1/ \\
  --header="apikey: <anon-key>"
\`\`\`

常见数据库问题：
- Supabase 项目被暂停（免费版 7 天无活动自动暂停）
- 连接字符串中密码过期
- 网络策略阻止了出口流量

### Step 4：检查 Traefik Ingress

\`\`\`bash
# 查看 Ingress 路由规则
kubectl get ingress -n ghost
kubectl describe ingress -n ghost ghost-admin

# 检查 Traefik Pod 是否正常
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
\`\`\`

### Step 5：检查 nginx 反代

\`\`\`bash
# 在腾讯云 nginx 节点上
# 测试 Tailscale 内网连通性
curl -v http://100.115.0.33:30080

# 检查 nginx 错误日志
tail -f /var/log/nginx/error.log
\`\`\`

## 恢复操作

### 场景 A：Pod CrashLoopBackOff

\`\`\`bash
# 重启 Deployment
kubectl rollout restart deployment/ghost -n ghost

# 等待恢复
kubectl rollout status deployment/ghost -n ghost --timeout=120s
\`\`\`

### 场景 B：Supabase 数据库暂停

1. 登录 Supabase Dashboard → 项目 → Resume
2. 等待项目恢复（约 2 分钟）
3. 重启 Ghost Pod

### 场景 C：镜像拉取失败

\`\`\`bash
# 检查 imagePullSecrets
kubectl get sa -n ghost default -o yaml

# 重新创建 secret（如果 TCR token 过期）
kubectl create secret docker-registry tcr-secret \\
  -n ghost \\
  --docker-server=<tcr-registry> \\
  --docker-username=<username> \\
  --docker-password=<password>
\`\`\`

## 验证恢复

\`\`\`bash
# 1. Pod 状态正常
kubectl get pods -n ghost

# 2. HTTP 响应正常
curl -s -o /dev/null -w "%{http_code}" https://ghost.pineapple-user.site

# 3. 后台可登录
# 浏览器访问 https://ghost.pineapple-user.site/ghost/
\`\`\``,
      categoryId: catMap["runbook"],
      isPublished: true,
      tagNames: ["K3s", "Traefik", "Supabase"],
    },
    {
      title: "Alist + 115 网盘冷备方案",
      slug: "alist-115-cold-backup",
      content: `# Alist + 115 网盘冷备方案

## 方案概述

利用 115 网盘的 40TB 存储空间，通过 Alist 挂载为 WebDAV 接口，再由 Velero 将 K3s 集群备份写入该存储，实现低成本冷备。

### 架构路径

\`\`\`
K3s 集群 → Velero → MinIO (S3 兼容) → Alist (WebDAV) → 115 网盘
\`\`\`

## Alist 部署

### K3s Deployment 配置

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alist
  namespace: storage
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alist
  template:
    metadata:
      labels:
        app: alist
    spec:
      containers:
        - name: alist
          image: xhofe/alist:latest
          ports:
            - containerPort: 5244
          volumeMounts:
            - name: alist-data
              mountPath: /opt/alist/data
          env:
            - name: TZ
              value: Asia/Shanghai
      volumes:
        - name: alist-data
          persistentVolumeClaim:
            claimName: alist-data-pvc
\`\`\`

### 115 网盘挂载配置

在 Alist 管理后台添加存储：

| 配置项 | 值 |
|--------|-----|
| 驱动 | 115 Cloud |
| 挂载路径 | /115 |
| 刷新令牌 | 从浏览器 Cookie 获取 |
| 根文件夹 | / |

## Velero 备份配置

### 安装 Velero

\`\`\`bash
velero install \\
  --provider aws \\
  --plugins velero/velero-plugin-for-aws:v1.9.0 \\
  --bucket velero-backup \\
  --secret-file ./credentials-velero \\
  --backup-location-config region=minio,s3ForcePathStyle="true",s3Url=http://minio.storage:9000
\`\`\`

### 创建定时备份

\`\`\`yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
      - ghost
      - grafana
      - monitoring
      - storage
    excludedResources:
      - events
      - events.events.k8s.io
    ttl: 720h  # 保留 30 天
    storageLocation: default
    volumeSnapshotLocations:
      - default
\`\`\`

### 手动备份

\`\`\`bash
# 立即执行一次全量备份
velero backup create manual-backup-$(date +%Y%m%d) \\
  --include-namespaces ghost,grafana,monitoring,storage

# 查看备份状态
velero backup describe manual-backup-20250607
\`\`\`

## MinIO 中转层

由于 Alist 不直接提供 S3 兼容接口，部署 MinIO 作为中转：

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: minio
  namespace: storage
spec:
  replicas: 1
  selector:
    matchLabels:
      app: minio
  template:
    metadata:
      labels:
        app: minio
    spec:
      containers:
        - name: minio
          image: minio/minio:latest
          args:
            - server
            - /data
            - --console-address
            - ":9001"
          env:
            - name: MINIO_ROOT_USER
              valueFrom:
                secretKeyRef:
                  name: minio-secret
                  key: root-user
            - name: MINIO_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: minio-secret
                  key: root-password
          ports:
            - containerPort: 9000
            - containerPort: 9001
          volumeMounts:
            - name: minio-data
              mountPath: /data
      volumes:
        - name: minio-data
          persistentVolumeClaim:
            claimName: minio-data-pvc
\`\`\`

## 恢复流程

\`\`\`bash
# 列出可用备份
velero backup get

# 恢复指定备份
velero backup restore --from-backup daily-backup-20250605

# 验证恢复结果
velero restore describe daily-backup-20250605-*
kubectl get pods -A
\`\`\`

## 存储成本估算

| 项目 | 规格 | 成本 |
|------|------|------|
| 115 网盘 | 40TB | ¥0（存量） |
| MinIO PVC | 10GB（中转缓存） | K3s 本地磁盘 |
| 月度带宽 | ~50GB | DO 内部免费 |

> 冷备方案核心优势：零额外存储成本，利用已有 115 网盘容量。`,
      categoryId: catMap["architecture"],
      isPublished: true,
      tagNames: ["Velero", "K3s", "Docker"],
    },
    {
      title: "Vaultwarden 备份与恢复",
      slug: "vaultwarden-backup-restore",
      content: `# Vaultwarden 备份与恢复 Runbook

## 服务概况

- **部署位置**：京东云 Docker 节点（2C/4G）
- **数据存储**：SQLite（本地文件）
- **访问入口**：pass.pineapple-user.site → nginx → 100.115.0.2:8080
- **容器运行时**：Docker Compose

## 备份策略

Vaultwarden 使用 SQLite 作为数据库，备份方式有两种：

1. **SQLite 文件直接拷贝**（推荐，简单可靠）
2. **Docker volume 备份**（完整备份含附件）

## 日常备份脚本

### 方式一：SQLite 导出

\`\`\`bash
#!/bin/bash
# backup-vaultwarden.sh

BACKUP_DIR="/data/backups/vaultwarden"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER="vaultwarden"

mkdir -p $BACKUP_DIR

# 导出 SQLite 数据库
docker exec $CONTAINER sqlite3 /data/db.sqlite3 ".backup '/data/db-backup.db'"
docker cp $CONTAINER:/data/db-backup.db $BACKUP_DIR/vaultwarden_$DATE.db

# 备份 RSA 密钥（加密解密需要）
docker cp $CONTAINER:/data/rsa_key.pem $BACKUP_DIR/rsa_key_$DATE.pem
docker cp $CONTAINER:/data/rsa_key.pub.pem $BACKUP_DIR/rsa_key_pub_$DATE.pem

# 备份配置文件
docker cp $CONTAINER:/data/config.json $BACKUP_DIR/config_$DATE.json 2>/dev/null || true

# 保留最近 30 天
find $BACKUP_DIR -name "vaultwarden_*" -mtime +30 -delete
find $BACKUP_DIR -name "rsa_key_*" -mtime +30 -delete

echo "✅ Vaultwarden 备份完成: $BACKUP_DIR/vaultwarden_$DATE.db"
\`\`\`

### 方式二：Docker Volume 完整备份

\`\`\`bash
#!/bin/bash
# backup-vaultwarden-volume.sh

BACKUP_DIR="/data/backups/vaultwarden"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 通过临时容器挂载 volume 并打包
docker run --rm \\
  -v vaultwarden_data:/data:ro \\
  -v $BACKUP_DIR:/backup \\
  alpine \\
  tar czf /backup/vaultwarden_volume_$DATE.tar.gz -C /data .

echo "✅ Vaultwarden Volume 备份完成: $BACKUP_DIR/vaultwarden_volume_$DATE.tar.gz"
\`\`\`

## Crontab 配置

\`\`\`bash
# 每天凌晨 3 点执行 SQLite 导出备份
0 3 * * * /opt/scripts/backup-vaultwarden.sh >> /var/log/backup-vaultwarden.log 2>&1

# 每周日凌晨 4 点执行 Volume 完整备份
0 4 * * 0 /opt/scripts/backup-vaultwarden-volume.sh >> /var/log/backup-vaultwarden.log 2>&1
\`\`\`

## 恢复流程

### 从 SQLite 备份恢复

\`\`\`bash
# 1. 停止 Vaultwarden 容器
docker stop vaultwarden

# 2. 备份当前数据（以防万一）
cp /data/vaultwarden/db.sqlite3 /data/vaultwarden/db.sqlite3.bak

# 3. 拷贝备份文件到数据目录
cp /data/backups/vaultwarden/vaultwarden_20250607.db /data/vaultwarden/db.sqlite3

# 4. 恢复 RSA 密钥
cp /data/backups/vaultwarden/rsa_key_20250607.pem /data/vaultwarden/rsa_key.pem
cp /data/backups/vaultwarden/rsa_key_pub_20250607.pem /data/vaultwarden/rsa_key.pub.pem

# 5. 启动容器
docker start vaultwarden

# 6. 验证
curl -s -o /dev/null -w "%{http_code}" https://pass.pineapple-user.site/alive
\`\`\`

### 从 Volume 备份恢复

\`\`\`bash
# 1. 停止容器
docker stop vaultwarden

# 2. 清空当前 volume
docker run --rm -v vaultwarden_data:/data alpine sh -c "rm -rf /data/*"

# 3. 解压备份到 volume
docker run --rm \\
  -v vaultwarden_data:/data \\
  -v /data/backups/vaultwarden:/backup \\
  alpine \\
  sh -c "cd /data && tar xzf /backup/vaultwarden_volume_20250607.tar.gz"

# 4. 启动容器
docker start vaultwarden
\`\`\`

## 重要提醒

- **RSA 密钥必须一起备份恢复**，否则加密数据无法解密
- 恢复后建议立即在 Web 端验证密码库是否正常
- SQLite 备份前执行 \`.backup\` 命令确保数据一致性，避免直接 cp 正在写入的 db 文件`,
      categoryId: catMap["runbook"],
      isPublished: true,
      tagNames: ["Docker", "Monitoring"],
    },
    {
      title: "Grafana 监控告警配置",
      slug: "grafana-monitoring-alerting",
      content: `# Grafana 监控告警配置

## 监控栈架构

| 组件 | 用途 | 部署位置 |
|------|------|----------|
| Prometheus | 指标采集与存储 | K3s (Helm) |
| Grafana | 可视化仪表盘 | K3s NodePort 30858 |
| Loki | 日志聚合 | K3s (Helm) |
| Promtail | 日志采集 Agent | K3s DaemonSet |
| Alertmanager | 告警路由与通知 | K3s (Helm) |
| Uptime Kuma | 外部可用性监控 | 京东云 Docker |

## Prometheus 部署

\`\`\`bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \\
  -n monitoring \\
  --set grafana.service.type=NodePort \\
  --set grafana.service.nodePort=30858 \\
  --set prometheus.service.type=NodePort \\
  --set prometheus.service.nodePort=30090
\`\`\`

### 验证采集目标

\`\`\`bash
# 访问 Prometheus Targets 页面
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# 浏览器打开 http://localhost:9090/targets
\`\`\`

## Loki + Promtail 部署

\`\`\`bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack \\
  -n monitoring \\
  --set promtail.enabled=true \\
  --set loki.persistence.enabled=true \\
  --set loki.persistence.size=20Gi
\`\`\`

## 告警规则配置

### 自定义告警规则（PrometheusRule CRD）

\`\`\`yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cluster-alerts
  namespace: monitoring
  labels:
    release: prometheus
spec:
  groups:
    - name: node-alerts
      rules:
        # 节点 CPU 使用率过高
        - alert: HighCPUUsage
          expr: |
            100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 85
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "节点 {{ $labels.instance }} CPU 使用率过高"
            description: "CPU 使用率已超过 85%，当前值: {{ $value }}%"

        # 节点内存不足
        - alert: HighMemoryUsage
          expr: |
            (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "节点 {{ $labels.instance }} 内存不足"
            description: "内存使用率已超过 90%，当前值: {{ $value }}%"

        # 磁盘空间不足
        - alert: DiskSpaceLow
          expr: |
            (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 > 80
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "节点 {{ $labels.instance }} 磁盘空间不足"
            description: "根分区使用率已超过 80%"

    - name: pod-alerts
      rules:
        # Pod 频繁重启
        - alert: PodRestartLoop
          expr: |
            increase(kube_pod_container_status_restarts_total[1h]) > 5
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 频繁重启"
            description: "过去 1 小时内重启超过 5 次"

        # Pod 不可用
        - alert: PodNotReady
          expr: |
            kube_pod_status_ready{condition="true"} == 0
          for: 15m
          labels:
            severity: critical
          annotations:
            summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 不可用"
\`\`\`

## Alertmanager 通知配置

\`\`\`yaml
apiVersion: monitoring.coreos.com/v1alpha1
kind: AlertmanagerConfig
metadata:
  name: alert-config
  namespace: monitoring
spec:
  route:
    groupBy: ['alertname', 'namespace']
    groupWait: 30s
    groupInterval: 5m
    repeatInterval: 4h
    receiver: 'default'
    routes:
      - match:
          severity: critical
        receiver: 'critical'
        repeatInterval: 1h
  receivers:
    - name: 'default'
      webhookConfigs:
        - url: 'http://alert-webhook:9095/webhook'
    - name: 'critical'
      webhookConfigs:
        - url: 'http://alert-webhook:9095/webhook'
\`\`\`

## Grafana 仪表盘配置

### 导入推荐仪表盘

| Dashboard ID | 名称 | 用途 |
|-------------|------|------|
| 1860 | Node Exporter Full | 节点资源监控 |
| 15661 | K3s Cluster | K3s 集群概览 |
| 12006 | Kubernetes Pods | Pod 资源使用 |
| 13639 | Loki Logs | 日志查询 |

\`\`\`bash
# 通过 Grafana API 导入
curl -X POST http://localhost:3000/api/dashboards/import \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <api-key>" \\
  -d '{"dashboard":{"id":1860},"overwrite":true}'
\`\`\`

## Uptime Kuma 外部监控

Uptime Kuma 部署在京东云 Docker，从外部视角监控所有公网服务：

| 监控项 | URL | 间隔 | 预期 |
|--------|-----|------|------|
| Ghost 博客 | https://pineapple-user.site | 60s | 200 |
| Vaultwarden | https://pass.pineapple-user.site/alive | 60s | 200 |
| Grafana | https://grafana.pineapple-user.site/api/health | 60s | 200 |
| Uptime Kuma 自身 | https://status.pineapple-user.site | 30s | 200 |

> 外部监控与集群内监控互补：Prometheus 监控资源和应用指标，Uptime Kuma 监控端到端可用性。`,
      categoryId: catMap["runbook"],
      isPublished: true,
      tagNames: ["Monitoring", "K3s", "Docker"],
    },
    {
      title: "cloud-ops Wiki — 声明式架构文档系统",
      slug: "cloud-ops-wiki-declarative-docs",
      content: `# cloud-ops Wiki — 声明式架构文档系统

## 项目概述

基于 6 节点混合云底座，构建一套「架构即代码」的知识图库系统。所有基础设施资产、服务依赖、网络拓扑均通过 YAML Schema 声明式描述，配合 Mermaid 架构图实现可交互的可视化站点。

## 核心理念

| 原则 | 说明 | 落地方式 |
|------|------|----------|
| **声明式** | 不写脚本维护文档，只写 YAML | 所有架构数据用 YAML 描述 |
| **GitOps** | 变更走 PR，可审计、可回滚 | Wiki 源码即 Git 仓库 |
| **自动生成** | 机器能干的，人不写 | GitHub Actions 从 K3s/Tailscale 拉状态 |
| **单层真相** | 不重复记录，一处修改全局同步 | 服务域名只写在 Ingress YAML |
| **求职展示** | 每个页面都能体现 DevOps 思维 | ADR + 架构图 + FinOps 分析 |

## 架构分层

\`\`\`
┌─ Overlay 网络层 ── Tailscale 组网 6 节点
├─ 流量接入层   ── Cloudflare (WAF/DDoS) → 腾讯云 nginx → 各节点
└─ 发布控制层   ── GitHub pineapple-ops 仓库 (SSOT)
\`\`\`

### 信息架构（3 层金字塔 + 1 张关系网）

\`\`\`
                    ┌─────────┐
                    │  总览页  │  ← 一眼看清全局：架构图、健康状态、成本
                    │ (首页)   │
                    └────┬────┘
           ┌───────────┼───────────┐
           ▼           ▼           ▼
      ┌────────┐  ┌────────┐  ┌────────┐
      │ 系统层  │  │ 系统层  │  │ 系统层  │  ← 按"域"划分：网络/计算/存储/安全
      │ 网络   │  │ 计算   │  │ 存储   │
      └────┬───┘  └────┬───┘  └────┬───┘
           │           │           │
      ┌────┴───┐  ┌────┴───┐  ┌────┴───┐
      │ 服务页  │  │ 服务页  │  │ 服务页  │  ← 每个具体应用：Ghost/Alist/Grafana
      │ Ghost  │  │ Alist  │  │ MinIO  │
      └────────┘  └────────┘  └────────┘

      + 横向关系网：依赖图谱、流量路径、故障影响面
\`\`\`

## YAML Schema 数据模型

所有页面内容从 YAML 自动生成，只维护 YAML，不维护 Markdown 表格。

### 1. 节点定义（nodes.yaml）

\`\`\`yaml
nodes:
  volc-bastion:
    name: 火山云堡垒机
    provider: 火山引擎
    spec: 2C/2G
    region: 北京
    tailscale_ip: 100.115.0.10
    role: security
    in_k3s: false
    services:
      - name: next-terminal
        type: bastion

  tencent-nginx:
    name: 腾讯云入口网关
    provider: 腾讯云
    spec: 2C/2G
    region: 广州
    tailscale_ip: 100.115.0.5
    role: gateway
    upstreams:
      - target: 100.115.0.33
        port: 31717
        description: K3s Traefik Ingress
      - target: 100.115.0.2
        port: 8080
        description: Vaultwarden

  k3s-master:
    name: K3s Master
    provider: DigitalOcean
    spec: 4C/8G
    region: 新加坡
    tailscale_ip: 100.115.0.33
    role: k3s-master
    in_k3s: true
    k3s_version: "v1.29.3+k3s1"
\`\`\`

### 2. 服务定义（services.yaml）

\`\`\`yaml
services:
  ghost:
    name: Ghost 博客
    type: web
    tier: p1
    domains:
      - ghost.pineapple-user.site
    deployment:
      type: k3s
      namespace: content
      replicas: 1
    ingress:
      class: traefik
      nodeport: 30080
    dependencies:
      - ref: supabase-ghost-db
        type: strong
      - ref: traefik-ingress
        type: strong
    database:
      type: supabase
      connection: \${SUPABASE_GHOST_URL}
    backups:
      - type: velero
        schedule: daily
        target: 115-cloud

  vaultwarden:
    name: Vaultwarden
    type: security
    tier: p0
    deployment:
      type: docker-compose
      host: jd-docker
      compose_file: docker/docker-compose.yaml
\`\`\`

## 实际 K8s Manifests（pineapple-ops 仓库）

所有 K8s 部署文件声明式管理，存储在 \`k3s/\` 目录：

\`\`\`
k3s/
├── ghost-k3s.yaml          # Ghost 博客 + MySQL (StatefulSet)
├── alist-k3s.yaml          # Alist 网盘聚合 (40TB 115 网盘)
├── minio-k3s.yaml          # MinIO 对象存储
├── kuboard-create-token.yaml
└── efk/
    ├── elasticsearch.yaml   # ES 单节点 (7天保留)
    ├── fluent-bit.yaml      # Fluent Bit DaemonSet
    ├── kibana.yaml          # Kibana 日志可视化
    └── ilm-setup.yaml       # 索引生命周期管理
\`\`\`

Docker Compose 服务（京东云独立节点）：

\`\`\`
docker/
└── docker-compose.yaml
    ├── vaultwarden           # 密码管理器 (P0)
    └── uptime-kuma           # 可用性探活监控
\`\`\`

## 域名与流量路径

所有域名由 Cloudflare 托管，腾讯云 nginx 统一 SSL 终结 + 反代。

\`\`\`mermaid
sequenceDiagram
    用户->>Cloudflare: HTTPS
    Cloudflare->>腾讯云nginx: 443
    腾讯云nginx->>Tailscale: 100.115.0.33:31717
    Tailscale->>Traefik: NodePort 31717
    Traefik->>Ghost: ClusterIP
    Ghost->>Supabase: PostgreSQL
\`\`\`

| 域名 | 服务 | 后端 | 端口 |
|------|------|------|------|
| pineapple-user.site | Ghost 博客 | Vercel | — |
| ghost.pineapple-user.site | Ghost 后台 | K3s | 30080 |
| drive.pineapple-user.site | Alist 文件 | K3s | 31717 |
| pass.pineapple-user.site | Vaultwarden | 京东云 | 8080 |
| status.pineapple-user.site | Uptime Kuma | 京东云 | 3001 |
| grafana.pineapple-user.site | Grafana 监控 | K3s | 30858 |
| kibana.pineapple-user.site | Kibana 日志 | K3s | 30561 |
| minio.pineapple-user.site | MinIO 存储 | K3s | 31901 |
| kuboard.pineapple-user.site | Kuboard 集群 | K3s | 31717 |

## 简历话术

> **cloud-ops Wiki** — 声明式架构文档系统
> - 设计 YAML Schema 统一描述 6 节点混合云资产、服务依赖与网络拓扑
> - 基于 Mermaid 构建可交互的架构可视化站点
> - 通过 GitHub Actions 实现 K3s 状态自动同步与文档自动生成（GitOps 闭环）
> - 实践「架构即代码」理念，将 Zero-Scripting 约束贯穿文档体系设计`,
      categoryId: catMap["architecture"],
      isPublished: true,
      tagNames: ["GitOps", "K3s", "Tailscale", "Cloudflare"],
    },
  ];

  for (const articleData of articlesData) {
    const { tagNames, ...articleValues } = articleData;

    const [inserted] = await db()
      .insert(articles)
      .values(articleValues)
      .returning();

    // 插入文章-标签关联
    const tagAssociations = tagNames.map((tagName) => ({
      articleId: inserted.id,
      tagId: tagMap[tagName],
    }));

    await db().insert(articleTags).values(tagAssociations);

    console.log(`   ✅ 《${inserted.title}》 → [${tagNames.join(", ")}]`);
  }

  // 4. 验证数据
  console.log("\n🔍 验证插入结果...\n");

  const allCategories = await db().select().from(categories);
  const allTags = await db().select().from(tags);
  const allArticles = await db().select().from(articles);
  const allArticleTags = await db().select().from(articleTags);

  console.log(`📁 分类: ${allCategories.length} 个`);
  allCategories.forEach((c) => console.log(`   - ${c.name} (${c.slug})`));

  console.log(`\n🏷️  标签: ${allTags.length} 个`);
  allTags.forEach((t) => console.log(`   - ${t.name}`));

  console.log(`\n📝 文章: ${allArticles.length} 篇`);
  allArticles.forEach((a) =>
    console.log(`   - ${a.title} [${a.isPublished ? "已发布" : "草稿"}]`)
  );

  console.log(`\n🔗 文章-标签关联: ${allArticleTags.length} 条`);

  console.log("\n✨ 运维知识库数据插入完成！");
}

seed().catch((err) => {
  console.error("❌ 插入失败:", err);
  process.exit(1);
});
