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
  const lastHtmlRef = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
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
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastHtmlRef.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[400px] px-6 py-5 focus:outline-none text-[15px] leading-relaxed",
      },
      transformPastedHTML: cleanWordPaste,
    },
  });

  useEffect(() => {
    if (editor && value !== lastHtmlRef.current) {
      lastHtmlRef.current = value;
      editor.commands.setContent(value);
    }
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
    <div className="border border-rule rounded-[14px] bg-white">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 px-3 py-2 border-b border-rule bg-mist flex flex-wrap items-center gap-0.5 rounded-t-[14px]">
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

      {/* Editor content styles — Tailwind v4 has no typography plugin so we define these explicitly */}
      <style>{`
        .ProseMirror { font-size: 15px; line-height: 1.75; color: #334155; }
        .ProseMirror p { margin: 0 0 0.85em; }
        .ProseMirror p:last-child { margin-bottom: 0; }
        .ProseMirror h1 { font-size: 2em; font-weight: 700; line-height: 1.2; margin: 1.4em 0 0.5em; color: #0B1F3A; letter-spacing: -0.3px; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: 700; line-height: 1.25; margin: 1.3em 0 0.5em; color: #0B1F3A; letter-spacing: -0.2px; }
        .ProseMirror h3 { font-size: 1.2em; font-weight: 600; line-height: 1.3; margin: 1.2em 0 0.4em; color: #0B1F3A; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.6em; margin: 0.6em 0 0.9em; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.6em; margin: 0.6em 0 0.9em; }
        .ProseMirror li { margin-bottom: 0.3em; }
        .ProseMirror li p { margin: 0; }
        .ProseMirror blockquote { border-left: 3px solid #1E4ED8; margin: 1.5em 0; padding: 0.4em 0 0.4em 1.25em; color: #64748B; font-style: italic; }
        .ProseMirror strong { font-weight: 600; color: #0B1F3A; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror code { font-family: "Courier New", monospace; font-size: 0.85em; background: #F1F5F9; padding: 1px 5px; border-radius: 4px; color: #c7254e; }
        .ProseMirror pre { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-size: 13px; line-height: 1.6; margin: 1.25em 0; }
        .ProseMirror pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
        .ProseMirror mark { background: #FEF08A; padding: 0 2px; border-radius: 2px; }
        .ProseMirror hr { border: none; border-top: 2px solid #E2E8F0; margin: 2em 0; }
        .ProseMirror a { color: #1E4ED8; text-decoration: underline; text-underline-offset: 2px; }
        .ProseMirror img { max-width: 100%; border-radius: 12px; margin: 1rem 0; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #94A3B8; pointer-events: none; height: 0; }

        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        .ProseMirror td, .ProseMirror th { border: 1px solid #CBD5E1; padding: 8px 12px; min-width: 80px; vertical-align: top; position: relative; }
        .ProseMirror th { background: #F1F5F9; font-weight: 600; text-align: left; }
        .ProseMirror .selectedCell:after { content: ""; position: absolute; inset: 0; background: rgba(30,78,216,0.08); pointer-events: none; z-index: 2; }
        .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #1E4ED8; pointer-events: none; }
        .ProseMirror-focused .tableWrapper { overflow-x: auto; }
        .tableWrapper { overflow-x: auto; margin: 1rem 0; }
      `}</style>
    </div>
  );
}
