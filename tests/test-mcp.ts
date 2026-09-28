import { mastra } from '../src/mastra';
import { deepwikiClient } from '../src/mastra/mcp/deepwiki-client';

const agent = mastra.getAgent('agent');

const result = await agent.generate(
  'Use deepwiki_ask_wiki_question to explain what the facebook/react repository does, in two sentences.',
  { toolsets: await deepwikiClient.listToolsets() },
);

console.log(result.text);
await deepwikiClient.disconnect();