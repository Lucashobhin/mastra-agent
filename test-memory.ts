import { mastra } from './src/mastra';

const agent = mastra.getAgent('agent');

const resourceId = 'shobhin-working-memory-test-003';

async function main() {
  await agent.generate(
    'My name is Shobhin and my favorite programming language is Python. Remember this information.',
    {
      memory: {
        resource: resourceId,
        thread: 'working-memory-thread-003',
      },
    },
  );

  const result = await agent.generate(
    'What is my name and favorite programming language? Answer in one sentence.',
    {
      memory: {
        resource: resourceId,
        thread: 'working-memory-thread-004',
      },
    },
  );

  console.log(result.text);
}

main().catch(console.error);