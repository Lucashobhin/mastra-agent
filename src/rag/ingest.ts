import { MDocument } from "@mastra/rag";
import { LibSQLVector } from "@mastra/libsql";
import { embedMany } from "ai";
import { createOllama } from "ollama-ai-provider-v2";
import { readFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

const INDEX_NAME = "momentum_docs";
const EMBEDDING_MODEL = "nomic-embed-text";
const VECTOR_STORE_ID = "momentum-vector-store";
const PDF_FILENAME = "mydoc.pdf";

async function loadPdfText(filePath: string): Promise<string> {
  const buffer = readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function ingest() {
  // --- Markdown source ---
  const mdText = readFileSync("data/momentum.md", "utf-8");
  const mdDoc = MDocument.fromMarkdown(mdText);

  const mdChunks = await mdDoc.chunk({
    strategy: "markdown",
    headers: [
      ["#", "h1"],
      ["##", "h2"],
    ],
  });

  const mdEnriched = mdChunks.map((chunk, index) => {
    const h1 = chunk.metadata?.h1 ?? "";
    const h2 = chunk.metadata?.h2 ?? "";
    const prefix = [h1, h2].filter(Boolean).join(" - ");
    return {
      text: prefix ? `${prefix}: ${chunk.text}` : chunk.text,
      source: "momentum.md",
      chunkIndex: index,
    };
  });

  // --- PDF source ---
  const pdfText = await loadPdfText(`data/${PDF_FILENAME}`);
  const pdfDoc = MDocument.fromText(pdfText);

  const pdfChunks = await pdfDoc.chunk({
    strategy: "recursive",
    maxSize: 300,
    overlap: 30,
  });

  const pdfEnriched = pdfChunks.map((chunk, index) => ({
    text: chunk.text,
    source: PDF_FILENAME,
    chunkIndex: index,
  }));

  // --- Combine ---
  const allEnriched = [...mdEnriched, ...pdfEnriched];
  const values = allEnriched.map((c) => c.text);

  const { embeddings } = await embedMany({
    values,
    model: ollama.embedding(EMBEDDING_MODEL),
  });

  if (embeddings.length === 0) {
    throw new Error("No embeddings were generated.");
  }

  const dimension = embeddings[0].length;

  const dbPath = "C:/Users/shobh/Desktop/mastra-agent/vector.db";

  const vectorStore = new LibSQLVector({
    id: VECTOR_STORE_ID,
    url: `file:${dbPath}`,
  });

  await vectorStore.createIndex({
    indexName: INDEX_NAME,
    dimension,
    metric: "cosine",
  });

  const ids = allEnriched.map((c) => `${c.source}:chunk_${c.chunkIndex}`);

  const metadata = allEnriched.map((c) => ({
    text: c.text,
    source: c.source,
    chunkIndex: c.chunkIndex,
    embeddingModel: EMBEDDING_MODEL,
  }));

  await vectorStore.upsert({
    indexName: INDEX_NAME,
    vectors: embeddings,
    metadata,
    ids,
  });

  console.log(`Ingested ${allEnriched.length} total chunks into LibSQLVector`);
  console.log(`  - Markdown: ${mdEnriched.length} chunks`);
  console.log(`  - PDF: ${pdfEnriched.length} chunks`);
  console.log(`Embedding dimension: ${dimension}`);
}

ingest().catch(console.error);