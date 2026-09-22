import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { retrieveContext } from "../../rag/retrieve";

export const searchMomentumDocsTool = createTool({
  id: "searchMomentumDocs",
  description:
    "Search the knowledge base for information about the Momentum project (database, backend, authentication, overview) and Shobhin's resume (education, work experience, technical skills).",

  inputSchema: z.object({
    question: z.string().describe("The question to search for"),
  }),

  execute: async ({ question }) => {
    const results = await retrieveContext(question, 3);

    return {
      chunks: results.map((r) => ({
        text: r.metadata?.text,
        source: r.metadata?.source,
        score: r.score,
      })),
    };
  },
});