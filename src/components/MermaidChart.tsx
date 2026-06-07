"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidChart({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    let cancelled = false;
    const container = ref.current;

    async function render() {
      try {
        // 清理旧内容
        container.innerHTML = "";

        // 创建 pre.mermaid 元素供 mermaid.run 渲染
        const pre = document.createElement("pre");
        pre.className = "mermaid";
        pre.textContent = code;
        container.appendChild(pre);

        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          logLevel: "error",
        });

        await mermaid.run({ nodes: [pre] });

        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Mermaid error:", err);
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <details className="text-xs text-red-600 bg-red-50 rounded-lg p-3">
        <summary className="cursor-pointer font-medium">⚠️ Mermaid 渲染错误（点击展开）</summary>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px]">{error}</pre>
      </details>
    );
  }

  return (
    <div ref={ref} className="flex justify-center py-2 [&>svg]:max-w-full [&>svg]:h-auto" />
  );
}
