import { retrieveContext } from "./src/rag/retrieve";

const questions = [
  "Which database does Momentum use?",
  "What is this person's work experience?",
  "What skills does this person have?",
];

for (const question of questions) {
  console.log(`Question: ${question}`);
  const results = await retrieveContext(question, 3);
  for (const r of results) {
    console.log(`  Score: ${r.score.toFixed(4)}  Source: ${r.metadata?.source}`);
    console.log(`  Text: ${r.metadata?.text}`);
  }
  console.log("-".repeat(50));
}