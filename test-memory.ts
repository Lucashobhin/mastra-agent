import { mastra } from './src/mastra';

const resourceId = 'shobhin-test-user';

const thread1 = 'memory-test-thread-1';
const thread2 = 'memory-test-thread-2';

const agent = mastra.getAgent('agent');

console.log('--- THREAD 1 ---');

await agent.generate(
  'My name is Shobhin and my favorite programming language is TypeScript.',
  {
    memory: {
      resource: resourceId,
      thread: thread1,
    },
  },
);

console.log('--- THREAD 2 ---');

const result = await agent.generate(
  'What is my name and what is my favorite programming language?',
  {
    memory: {
      resource: resourceId,
      thread: thread2,
    },
  },
);

console.log('\nANSWER:');
console.log(result.text);