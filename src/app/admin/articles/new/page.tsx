import { requirePageAccess } from "@/lib/adminAuth";
import { ArticleEditor } from "@/components/editor/ArticleEditor";

export default async function NewArticlePage() {
  await requirePageAccess("articles", "edit");
  return <ArticleEditor />;
}
