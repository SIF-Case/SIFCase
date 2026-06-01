"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useEffect, useRef } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Minus, Highlighter, Table as TableIcon,
  Plus, Trash2,
} from "lucide-react";

type Props = { value: string; onChange: (html: string) => void; onImageUpload: (file: File) => Promise<string> };

// Strip Word/Google Docs junk while preserving structure
function cleanWordPaste(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "")
    .replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, "")
    .replace(/<m:[^>]*>[\s\S]*?<\/m:[^>]*>/gi, "")
    .replace(/style="[^"]*mso-[^"]*"/gi, "")
    .replace(/class="Mso[^"]*"/gi, "")
    .replace(/<span\s*>/gi, "")
    .replace(/&nbsp;/g, " ");
}

export function RichEditor({ value, onChange, onImageUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight.configure({ multicolor: false }),
      ImageExt.configure({ HTMLAttributes: { class: "rounded-[12px] max-w-full my-4" }, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing… or paste from Word/Google Docs" }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "tiptap-table" } }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[400px] px-6 py-5 focus:outline-none text-[15px] leading-relaxed",
      },
      transformPastedHTML: cleanWordPaste,
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const url = await onImageUpload(file);
    editor.chain().focus().setImage({ src: url }).run();
    e.target.value = "";
  }

  function setLink() {
    const prev = editor?.getAttributes("link").href ?? "";
    const url = window.prompt("URL:", prev);
    if (url === null) return;
    if (url === "") { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().toggleLink({ href: url }).run();
  }

  function insertTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  if (!editor) return null;

  const btn = (active: boolean, danger = false) =>
    `size-7 inline-flex items-center justify-center rounded-[6px] transition-colors ${
      active ? "bg-primary text-white" : danger ? "text-muted hover:text-loss hover:bg-red-50" : "text-muted hover:text-body hover:bg-surface"
    }`;

  const Sep = () => <div className="w-px h-4 bg-rule mx-1 shrink-0" />;

  return (
    <div className="border border-rule rounded-[14px] overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-rule bg-mist flex flex-wrap items-center gap-0.5">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="Undo"><Undo className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="Redo"><Redo className="size-3.5" /></button>
        <Sep />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))} title="H1"><Heading1 className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="H2"><Heading2 className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="H3"><Heading3 className="size-3.5" /></button>
        <Sep />

        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold"><Bold className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic"><Italic className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Underline"><UnderlineIcon className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))} title="Strikethrough"><Strikethrough className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive("code"))} title="Code"><Code className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={btn(editor.isActive("highlight"))} title="Highlight"><Highlighter className="size-3.5" /></button>
        <Sep />

        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btn(editor.isActive({ textAlign: "left" }))} title="Left"><AlignLeft className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btn(editor.isActive({ textAlign: "center" }))} title="Center"><AlignCenter className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btn(editor.isActive({ textAlign: "right" }))} title="Right"><AlignRight className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={btn(editor.isActive({ textAlign: "justify" }))} title="Justify"><AlignJustify className="size-3.5" /></button>
        <Sep />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet list"><List className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Numbered list"><ListOrdered className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Quote"><Quote className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="Divider"><Minus className="size-3.5" /></button>
        <Sep />

        {/* Table controls */}
        <button type="button" onClick={insertTable} className={btn(editor.isActive("table"))} title="Insert table"><TableIcon className="size-3.5" /></button>
        {editor.isActive("table") && (
          <>
            <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className={btn(false)} title="Add column right"><Plus className="size-3 rotate-0" /></button>
            <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className={btn(false)} title="Add row below">
              <span className="text-[9px] font-bold leading-none">+R</span>
            </button>
            <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className={btn(false, true)} title="Delete column">
              <span className="text-[9px] font-bold leading-none">-C</span>
            </button>
            <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className={btn(false, true)} title="Delete row">
              <span className="text-[9px] font-bold leading-none">-R</span>
            </button>
            <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className={btn(false, true)} title="Delete table"><Trash2 className="size-3.5" /></button>
          </>
        )}
        <Sep />

        <button type="button" onClick={setLink} className={btn(editor.isActive("link"))} title="Link"><Link2 className="size-3.5" /></button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className={btn(false)} title="Insert image"><ImageIcon className="size-3.5" /></button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Table styles */}
      <style>{`
        .tiptap-table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .tiptap-table td, .tiptap-table th { border: 1px solid #CBD5E1; padding: 8px 12px; min-width: 80px; vertical-align: top; position: relative; }
        .tiptap-table th { background: #F1F5F9; font-weight: 600; text-align: left; }
        .tiptap-table .selectedCell:after { content: ""; position: absolute; inset: 0; background: rgba(30,78,216,0.08); pointer-events: none; }
        .tiptap-table .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: #1E4ED8; cursor: col-resize; }
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .ProseMirror td, .ProseMirror th { border: 1px solid #CBD5E1; padding: 8px 12px; min-width: 80px; vertical-align: top; }
        .ProseMirror th { background: #F1F5F9; font-weight: 600; }
        .ProseMirror .selectedCell:after { content: ""; position: absolute; inset: 0; background: rgba(30,78,216,0.08); pointer-events: none; z-index: 2; }
        .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #1E4ED8; pointer-events: none; }
        .ProseMirror-focused .tableWrapper { overflow-x: auto; }
        .tableWrapper { overflow-x: auto; margin: 1rem 0; }
      `}</style>
    </div>
  );
}
