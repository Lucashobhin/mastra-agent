import { google } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider-v2';
import { pathToFileURL } from 'node:url';
import { Agent } from '@mastra/core/agent';
import { TaskSignalProvider } from '@mastra/core/signals';
import { askUserTool, webFetchTool } from '@mastra/core/tools';
import { LocalFilesystem, LocalSandbox, WORKSPACE_TOOLS, Workspace } from '@mastra/core/workspace';
import { Memory } from '@mastra/memory';
import { startScheduleTool, stopScheduleTool } from '../tools/schedule-tools';
import { getOrderTool,getCustomerTool} from "../tools/order-tools";
import { orderCustomerWorkflow } from '../workflows/order-workflow';
import { LibSQLVector } from '@mastra/libsql';
import { searchMomentumDocsTool } from "../tools/rag-tools";
import { deepwikiClient } from "../mcp/deepwiki-client";

const workspacePath = 'workspace';
async function loadDeepwikiTools() {
  try {
    const tools = await deepwikiClient.listTools();

    console.log("DeepWiki tools loaded:");
    console.log(Object.keys(tools));

    return tools;
  } catch (err) {
    console.error("DEEPWIKI MCP ERROR:");
    console.error(err);
    return {};
  }
}

const deepwikiTools = await loadDeepwikiTools();


const workspace = new Workspace({
  id: 'agent-workspace',
  name: 'Agent Workspace',
  filesystem: new LocalFilesystem({
    basePath: workspacePath,
  }),
  sandbox: new LocalSandbox({
    workingDirectory: workspacePath,
  }),
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
      requireApproval: true,
    },
  },
});

export const agent = new Agent({
  id: 'agent',
  name: 'Agent',
  description:
    'A general-purpose assistant that can research, manage tasks, work with local files, run approved commands, and create recurring schedules.',
  metadata: {
    suggestedPrompts: [
      "What's the weather in Austin this weekend?",
      "What's the SPCX stock price right now?",
      'Build a Japanese sakura festival landing page.',
    ],
  },


 instructions: `
You are a helpful assistant with access to tools.

You have access to persistent user memory.

When user information is available in Working Memory, use it to answer questions about the user.
Do not claim that you do not know something if it is present in the user profile.

When the user provides personal information such as their name, favorite programming language, role, preferences, or habits, remember it for future conversations.

Answer clearly and directly.

When a user's request can be answered using an available tool, use the appropriate tool.

You have access to tools for retrieving order and customer information.

Use the order tool when the user asks about an order, including its status, delivery information, or order details.

Use the customer tool when customer information is needed.

Call getOrder or getCustomer at most ONCE per distinct request. After getCustomer returns a result containing "name" and "email" fields, the request is complete — immediately write your final answer in plain text and do not call any tool again. After getOrder returns a result containing "status" and "customerId", if the user only asked about the order (not the customer), immediately write your final answer and do not call any tool again.

When using searchMomentumDocs, call it ONCE per distinct question. After receiving tool results, immediately use that information to answer — do NOT call the same tool again for the same question unless the first result was completely empty or irrelevant.

After receiving the necessary tool results, combine them and give the user a clear answer.
`,
 
  model: google('gemini-3.1-flash-lite'),
  defaultOptions: {
    maxSteps: 10,
    autoResumeSuspendedTools: true,
  },


memory: new Memory({
  vector: new LibSQLVector({
    id: 'memory-vector',
    url: 'file:./mastra.db',
  }),

  embedder: ollama.embedding('nomic-embed-text'),

  options: {
    semanticRecall: {
      enabled:true,
      topK: 5,
      messageRange: 2,
      scope: 'resource',
    },

    workingMemory: {
      enabled: true,
      scope: 'resource',
      template: `
# User Profile

- Name:
- Favorite programming language:
- Role:
- Favorite movie triology:
`,
    },

    observationalMemory: {
      enabled: true,
      model: ollama('qwen2.5:7b'),
      scope: 'resource',
    },
  },
}),
  workflows: {
  orderCustomerWorkflow,
},
  // workspace,
  
  tools: {
  ask_user: askUserTool,
  start_schedule: startScheduleTool,
  stop_schedule: stopScheduleTool,
  web_fetch: webFetchTool,
  getOrder: getOrderTool,
  getCustomer: getCustomerTool,
  searchMomentumDocs: searchMomentumDocsTool,
  ...deepwikiTools,
},
  
  signals: [new TaskSignalProvider()],
});
