"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";

interface ArticleEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => Promise<void>;
  autoSaveInterval?: number;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-sm rounded transition-colors ${
        active
          ? "bg-primary text-white"
          : "text-text-secondary hover:bg-gray-100 hover:text-text"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  showLinkInput,
  onToggleLinkInput,
}: {
  editor: Editor | null;
  showLinkInput: boolean;
  onToggleLinkInput: () => void;
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLinkInput) linkInputRef.current?.focus();
  }, [showLinkInput]);

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl.trim()) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl.trim() })
      .run();
    setLinkUrl("");
    onToggleLinkInput();
  }, [editor, linkUrl, onToggleLinkInput]);

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-surface/60">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="加粗 (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="斜体 (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        title="标题 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        title="标题 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        title="标题 3"
      >
        H3
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="无序列表"
      >
        &bull; List
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="有序列表"
      >
        1. List
      </ToolbarButton>

      <span className="w-px h-5 bg-border mx-1" />

      <ToolbarButton
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="代码块"
      >
        {"</>"}
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            onToggleLinkInput();
          }
        }}
        title="插入链接 (Ctrl+K)"
      >
        Link
      </ToolbarButton>

      {showLinkInput && (
        <div className="flex items-center gap-1 ml-1">
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") insertLink();
              if (e.key === "Escape") {
                onToggleLinkInput();
                setLinkUrl("");
              }
            }}
            placeholder="https://..."
            className="px-2 py-1 text-xs border border-border rounded w-48 outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={insertLink}
            className="px-2 py-1 text-xs bg-primary text-white rounded"
          >
            确认
          </button>
        </div>
      )}
    </div>
  );
}

export function ArticleEditor({
  initialContent = "",
  onChange,
  onSave,
  autoSaveInterval,
}: ArticleEditorProps) {
  const [saving, setSaving] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const saveCallbackRef = useRef(onSave);
  saveCallbackRef.current = onSave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "开始撰写文章内容...",
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  const handleSave = useCallback(async () => {
    if (!editor || !saveCallbackRef.current) return;
    setSaving(true);
    try {
      await saveCallbackRef.current(editor.getHTML());
    } finally {
      setSaving(false);
    }
  }, [editor]);

  const toggleLinkInput = useCallback(() => setShowLinkInput((v) => !v), []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowLinkInput((v) => !v);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editor, handleSave]);

  // Auto-save
  useEffect(() => {
    if (!autoSaveInterval || !onSave || !editor) return;
    const id = setInterval(() => {
      if (!editor.isDestroyed) {
        saveCallbackRef.current?.(editor.getHTML());
      }
    }, autoSaveInterval);
    return () => clearInterval(id);
  }, [autoSaveInterval, onSave, editor]);

  return (
    <div className="editor-wrapper bg-white rounded-xl shadow-sm border border-border overflow-hidden">
      <Toolbar
        editor={editor}
        showLinkInput={showLinkInput}
        onToggleLinkInput={toggleLinkInput}
      />
      <EditorContent editor={editor} />
      {onSave && (
        <div className="flex items-center justify-end px-3 py-2 border-t border-border bg-surface/40">
          <span className="text-xs text-text-secondary mr-3">
            {saving ? "保存中..." : "Ctrl+S 保存"}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      )}
    </div>
  );
}
