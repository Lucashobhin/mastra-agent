import { LibSQLVector } from "@mastra/libsql";
import { embed } from "ai";
import { createOllama } from "ollama-ai-provider-v2";

const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

const VECTOR_STORE_ID = "momentum-vector-store";

const vectorStore = new LibSQLVector({
  id: VECTOR_STORE_ID,
  url: "file:C:/Users/shobh/Desktop/mastra-agent/vector.db",
});

export async function retrieveContext(question: string, topK: number = 5) {
  const { embedding } = await embed({
    value: question,
    model: ollama.embedding("nomic-embed-text"),
  });

  const results = await vectorStore.query({
    indexName: "momentum_docs",
    queryVector: embedding,
    topK,
  });

  return results;
}