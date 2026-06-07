"use client";

import { useEffect, useRef, useState } from "react";

export function MermaidChart({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          flowchart: { curve: "basis" },
        });

        // 生成唯一 ID
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;

        const { svg } = await mermaid.render(id, code);

        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "渲染失败");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className="text-xs text-red-500 bg-red-50 rounded-lg p-3">
        ⚠️ Mermaid 渲染错误: {error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
    />
  );
}
