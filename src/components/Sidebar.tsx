"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  entityCounts: Record<string, number>;
  className?: string;
}

const cmdbItems: { type: string; icon: string; label: string }[] = [
  { type: "node",    icon: "🖥️", label: "节点" },
  { type: "service", icon: "⚡", label: "服务" },
  { type: "domain",  icon: "🌐", label: "域名" },
  { type: "alert",   icon: "🚨", label: "告警" },
  { type: "runbook", icon: "📋", label: "Runbook" },
  { type: "docs",    icon: "📖", label: "架构文档" },
];

export function Sidebar({ entityCounts, className = "" }: SidebarProps) {
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";
  const isTopology = pathname === "/topology";
  const isHome = pathname === "/";
  const isChanges = pathname === "/changes";

  return (
    <aside
      className={`w-64 shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit overflow-y-auto max-h-screen sticky top-4 ${className}`}
    >
      {/* 全局导航 */}
      <nav aria-label="全局导航">
        <ul className="space-y-1">
          {[
            { href: "/dashboard", label: "仪表盘", icon: "📊", active: isDashboard },
            { href: "/topology",  label: "拓扑图",  icon: "🗺️", active: isTopology },
            { href: "/",          label: "文章",    icon: "📝", active: isHome },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  item.active
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    item.active ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
                <span>{item.icon} {item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* CMDB */}
      <nav className="mt-5 pt-4 border-t border-gray-100" aria-label="CMDB">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
          CMDB
        </h2>
        <ul className="space-y-1">
          {cmdbItems.map((item) => {
            const href = item.type === "docs" ? "/docs" : `/entity/${item.type}`;
            const isActive = pathname === href;
            return (
              <li key={item.type}>
                <Link
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  <span className="truncate">
                    {item.icon} {item.label}
                  </span>
                  {entityCounts[item.type] !== undefined && (
                    <span className="ml-auto text-xs text-gray-400 tabular-nums">
                      {entityCounts[item.type]}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 其他 */}
      <nav className="mt-5 pt-4 border-t border-gray-100" aria-label="其他">
        <ul className="space-y-1">
          <li>
            <Link
              href="/changes"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                isChanges
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isChanges ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
              <span>🔄 变更记录</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
