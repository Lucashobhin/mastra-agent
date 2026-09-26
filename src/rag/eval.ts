import { createContextPrecisionScorer } from "@mastra/evals/scorers/prebuilt";
import { ollama } from "ollama-ai-provider-v2";
import { retrieveContext } from "./retrieve";

const testCases = [
  { question: "Which database does Momentum use?" },
  { question: "What framework is used by the backend?" },
  { question: "How is authentication implemented?" },
  { question: "What is Shobhin's work experience?" },
];

async function runEval() {
  for (const testCase of testCases) {
    const results = await retrieveContext(testCase.question, 3);
    const contextTexts = results.map((r) => r.metadata?.text ?? "");

    const scorer = createContextPrecisionScorer({
      model: ollama("qwen2.5:7b"),
      options: {
        context: contextTexts,
        scale: 1,
      },
    });

    const scoreResult = await scorer.run({
      input: {
        inputMessages: [
          { id: "1", role: "user", content: testCase.question },
        ],
      },
      output: [
        { id: "2", role: "assistant", content: contextTexts.join(" ") },
      ],
    });

    console.log(`Question: ${testCase.question}`);
    console.log(`  Score: ${scoreResult.score}`);
    console.log(`  Reason: ${scoreResult.reason}`);
    console.log("-".repeat(50));
  }
}

runEval();