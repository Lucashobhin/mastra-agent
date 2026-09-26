import { createFaithfulnessScorer } from "@mastra/evals/scorers/prebuilt";
import { ollama } from "ollama-ai-provider-v2";
import { retrieveContext } from "./retrieve";

const testCases = [
  { question: "Which database does Momentum use?" },
  { question: "What framework is used by the backend?" },
  { question: "How is authentication implemented?" },
];

async function runFaithfulnessEval() {
  for (const testCase of testCases) {
    const results = await retrieveContext(testCase.question, 3);
    const contextTexts = results.map((r) => r.metadata?.text ?? "");

    // Simulate the answer Qwen would give (in real use, this comes from your agent's actual generation)
    const simulatedAnswer = contextTexts[0]; // top chunk stands in for "what agent said"

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
          { id: "1", role: "user", content: testCase.question },
        ],
      },
      output: [
        { id: "2", role: "assistant", content: simulatedAnswer },
      ],
    });

    console.log(`Question: ${testCase.question}`);
    console.log(`  Answer tested: ${simulatedAnswer}`);
    console.log(`  Faithfulness Score: ${scoreResult.score}`);
    console.log(`  Reason: ${scoreResult.reason}`);
    console.log("-".repeat(50));
  }
}

runFaithfulnessEval();