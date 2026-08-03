// pdfjs-dist ships no types for the worker entry point — it is only ever
// imported for its side effect of providing WorkerMessageHandler to
// globalThis.pdfjsWorker (see lib/reports/pdfjsLoader.ts).
declare module "pdfjs-dist/legacy/build/pdf.worker.mjs" {
  export const WorkerMessageHandler: unknown;
}
