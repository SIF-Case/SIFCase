import { requireAdmin } from "@/lib/adminAuth";
import { ArticleEditor } from "@/components/editor/ArticleEditor";

export default async function NewArticlePage() {
  await requireAdmin();
  return <ArticleEditor />;
}
