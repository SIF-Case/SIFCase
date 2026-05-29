"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Minus,
} from "lucide-react";

type Props = { value: string; onChange: (html: string) => void; onImageUpload: (file: File) => Promise<string> };

export function RichEditor({ value, onChange, onImageUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ HTMLAttributes: { class: "rounded-[12px] max-w-full my-4" } }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your article…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[400px] px-6 py-5 focus:outline-none text-[15px] leading-relaxed",
      },
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
    const url = window.prompt("URL:");
    if (!url) return;
    editor?.chain().focus().toggleLink({ href: url }).run();
  }

  if (!editor) return null;

  const btn = (active: boolean) =>
    `size-7 inline-flex items-center justify-center rounded-[6px] transition-colors ${active ? "bg-primary text-white" : "text-muted hover:text-body hover:bg-surface"}`;

  return (
    <div className="border border-rule rounded-[14px] overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="px-3 py-2.5 border-b border-rule bg-mist flex flex-wrap items-center gap-0.5">
        {/* History */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="Undo"><Undo className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="Redo"><Redo className="size-3.5" /></button>
        <div className="w-px h-4 bg-rule mx-1" />

        {/* Headings */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive("heading", { level: 1 }))} title="H1"><Heading1 className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))} title="H2"><Heading2 className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))} title="H3"><Heading3 className="size-3.5" /></button>
        <div className="w-px h-4 bg-rule mx-1" />

        {/* Marks */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))} title="Bold"><Bold className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))} title="Italic"><Italic className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive("underline"))} title="Underline"><UnderlineIcon className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive("strike"))} title="Strikethrough"><Strikethrough className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive("code"))} title="Inline code"><Code className="size-3.5" /></button>
        <div className="w-px h-4 bg-rule mx-1" />

        {/* Align */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={btn(editor.isActive({ textAlign: "left" }))} title="Align left"><AlignLeft className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={btn(editor.isActive({ textAlign: "center" }))} title="Center"><AlignCenter className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={btn(editor.isActive({ textAlign: "right" }))} title="Align right"><AlignRight className="size-3.5" /></button>
        <div className="w-px h-4 bg-rule mx-1" />

        {/* Lists */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))} title="Bullet list"><List className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))} title="Ordered list"><ListOrdered className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))} title="Quote"><Quote className="size-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="Divider"><Minus className="size-3.5" /></button>
        <div className="w-px h-4 bg-rule mx-1" />

        {/* Link + Image */}
        <button type="button" onClick={setLink} className={btn(editor.isActive("link"))} title="Link"><Link2 className="size-3.5" /></button>
        <button type="button" onClick={() => fileInputRef.current?.click()} className={btn(false)} title="Insert image"><ImageIcon className="size-3.5" /></button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
