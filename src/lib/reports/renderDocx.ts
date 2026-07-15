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

// Performance-cell colour buckets, matching the report legend swatches:
//   Strong (> +3%)          → 1A6E3A (dark green)
//   Positive (0 to +3%)     → 27AE60 (green)
//   Mild negative (-2 to 0) → E67E22 (orange)
//   Negative (< -2%)        → C0392B (red)
// The template fills every percent cell from one run whose colour is fixed
// (green), so after rendering we re-colour each percent-value run by its value.
function bucketColor(v: number): string {
  if (v > 3) return "1A6E3A";
  if (v >= 0) return "27AE60";
  if (v >= -2) return "E67E22";
  return "C0392B";
}

const RUN_RE = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
const PCT_RE = /^\s*([+\-−]?\d+(?:\.\d+)?)%\s*$/; // a bare percent value, e.g. "+6.01%"

function recolorPercentRuns(xml: string): string {
  return xml.replace(RUN_RE, (run) => {
    const tm = run.match(/<w:t\b[^>]*>([^<]*)<\/w:t>/);
    if (!tm) return run;
    const pm = tm[1].match(PCT_RE);
    if (!pm) return run;
    const v = parseFloat(pm[1].replace("−", "-"));
    if (Number.isNaN(v)) return run;
    const color = bucketColor(v);
    if (/<w:color\b[^>]*\/>/.test(run)) {
      return run.replace(/<w:color\b[^>]*\/>/, `<w:color w:val="${color}"/>`);
    }
    if (/<w:rPr>/.test(run)) {
      return run.replace("<w:rPr>", `<w:rPr><w:color w:val="${color}"/>`);
    }
    return run.replace(/(<w:r\b[^>]*>)/, `$1<w:rPr><w:color w:val="${color}"/></w:rPr>`);
  });
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
  const out = doc.getZip();
  out.file("word/document.xml", recolorPercentRuns(out.file("word/document.xml")!.asText()));
  return out.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
