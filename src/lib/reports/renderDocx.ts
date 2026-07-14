import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReportModel } from "./types";

const TEMPLATE = join(process.cwd(), "src/reports/monthly-template.docx");

// The template uses dotted tags (e.g. {universe.grandTotal.schemes},
// {prose.universeOverview}, {#universe.categories}) for readability.
// docxtemplater's default parser only resolves a tag as a single flat key —
// it does not walk dotted paths into nested objects — so we supply a parser
// that splits on "." and traverses the scope. This also correctly resolves
// loop tags like {#universe.categories} to the nested array.
function nestedParser(tag: string) {
  return {
    get(scope: unknown): unknown {
      if (tag === ".") return scope;
      return tag.split(".").reduce<unknown>((s, k) => {
        if (s == null || typeof s !== "object") return undefined;
        return (s as Record<string, unknown>)[k];
      }, scope);
    },
  };
}

export function renderReport(model: ReportModel): Buffer {
  const zip = new PizZip(readFileSync(TEMPLATE));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
    parser: nestedParser,
  });
  doc.render(model as unknown as Record<string, unknown>);
  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
