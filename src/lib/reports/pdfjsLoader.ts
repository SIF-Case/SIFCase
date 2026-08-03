// pdfjs-dist's legacy build evaluates `new DOMMatrix()` at module scope (for the
// canvas renderer). In Node it polyfills that global from the optional
// @napi-rs/canvas package — which resolves in local dev but is not shipped to
// Vercel's function bundle, so the import throws
// "ReferenceError: DOMMatrix is not defined" in production only.
//
// We only ever call getTextContent(), never the canvas renderer, so the matrix
// is never actually used. Install a minimal stub before importing pdf.mjs
// instead of pulling in a ~50 MB native canvas binary.

type PdfjsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

class DOMMatrixStub {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: number[] | string) {
    if (Array.isArray(init) && init.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init;
    }
  }

  translate(tx = 0, ty = 0) {
    const m = new DOMMatrixStub([this.a, this.b, this.c, this.d, this.e, this.f]);
    m.e += this.a * tx + this.c * ty;
    m.f += this.b * tx + this.d * ty;
    return m;
  }

  scale(sx = 1, sy = sx) {
    const m = new DOMMatrixStub([this.a, this.b, this.c, this.d, this.e, this.f]);
    m.a *= sx;
    m.b *= sx;
    m.c *= sy;
    m.d *= sy;
    return m;
  }
}

let modulePromise: Promise<PdfjsModule> | null = null;

// Lazily import pdf.mjs so the stub is installed before its module body runs.
export function loadPdfjs(): Promise<PdfjsModule> {
  if (!modulePromise) {
    const g = globalThis as Record<string, unknown>;
    if (!g.DOMMatrix) g.DOMMatrix = DOMMatrixStub;
    if (!g.Path2D) g.Path2D = class Path2DStub {};
    // Don't cache a failed import — a transient module-load error would
    // otherwise poison every later report request on the same warm instance.
    modulePromise = import("pdfjs-dist/legacy/build/pdf.mjs").catch((e) => {
      modulePromise = null;
      throw e;
    });
  }
  return modulePromise;
}
