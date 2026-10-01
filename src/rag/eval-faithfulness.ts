import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";
import { createFaithfulnessScorer } from "@mastra/evals/scorers/prebuilt";
import { ollama } from "ollama-ai-provider-v2";
import { retrieveContext } from "./retrieve";

// Small evaluation-only agent.
// We are NOT importing or modifying the main agent.
const evalAgent = new Agent({
  id: "faithfulness-eval-agent",
  name: "Faithfulness Evaluation Agent",

  instructions: `
You answer questions using ONLY the context provided by the user.

Rules:
- Do not use your own knowledge.
- Do not invent information.
- Every factual claim must be supported by the provided context.
- If the context does not contain enough information, say:
  "I don't have enough information in the provided context."
`,

  model: google("gemini-3.1-flash-lite"),
});

const testCases = [
  { question: "Which database does Momentum use?" },
  { question: "What framework is used by the backend?" },
  { question: "How is authentication implemented?" },
];

async function runFaithfulnessEval() {
  for (const testCase of testCases) {
    console.log(`\nQuestion: ${testCase.question}`);

    // 1. Retrieve relevant chunks from our RAG system
    const results = await retrieveContext(testCase.question, 3);

    const contextTexts = results
      .map((r) => r.metadata?.text ?? "")
      .filter(Boolean);

    console.log(`Retrieved chunks: ${contextTexts.length}`);

    // 2. Give ONLY those chunks to the LLM
    const prompt = `
Use the following retrieved context to answer the question.

CONTEXT:
${contextTexts
  .map((text, index) => `[Chunk ${index + 1}]\n${text}`)
  .join("\n\n")}

QUESTION:
${testCase.question}

Answer using ONLY the context above.
`;

    // 3. Generate a REAL answer through Mastra Agent
    const response = await evalAgent.generate([
      {
        role: "user",
        content: prompt,
      },
    ]);

    const realAnswer = response.text;

    // 4. Evaluate whether the generated answer is supported
    //    by the retrieved context.
    const scorer = createFaithfulnessScorer({
      model: ollama("qwen2.5:7b"),
      options: {
        context: contextTexts,
        scale: 1,
      },
    });

    const scoreResult = await scorer.run({
      input: {
        inputMessages: [
          {
            id: "1",
            role: "user",
            content: testCase.question,
          },
        ],
      },

      output: [
        {
          id: "2",
          role: "assistant",
          content: realAnswer,
        },
      ],
    });

    console.log(`Real answer: ${realAnswer}`);
    console.log(`Faithfulness Score: ${scoreResult.score}`);
    console.log(`Reason: ${scoreResult.reason}`);

    console.log("-".repeat(60));
  }
}

runFaithfulnessEval().catch((error) => {
  console.error("Faithfulness evaluation failed:");
  console.error(error);
});