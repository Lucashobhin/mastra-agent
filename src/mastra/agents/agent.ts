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

const workspacePath = 'workspace';

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

When a user's request can be answered using an available tool, use the appropriate tool.

You have access to tools for retrieving order and customer information.

Use the order tool when the user asks about an order, including its status, delivery information, or order details.

Use the customer tool when customer information is needed.

If getOrder returns a customerId and the user requested customer details, immediately call getCustomer using that customerId. Do not ask the user for permission.

After receiving the necessary tool results, combine them and give the user a clear answer.
`,
  model: ollama('qwen2.5:7b'),
  defaultOptions: {
    maxSteps: 100,
    autoResumeSuspendedTools: true,
  },
 memory: new Memory({
   options: {
    workingMemory: {
  enabled: true,
  scope: 'resource',
  template: `
# User Profile

- Name:
- Favorite programming language:
- Role:
`,
},
    generateTitle: true,
    observationalMemory: {
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
 // getOrder: getOrderTool,
 // getCustomer: getCustomerTool
},
  
  signals: [new TaskSignalProvider()],
});
