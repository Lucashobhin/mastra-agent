import { MCPClient } from "@mastra/mcp";

export const deepwikiClient = new MCPClient({
  servers: {
    deepwiki: {
      url: new URL("https://mcp.deepwiki.com/mcp"),
      timeout: 30000,
    },
  },
});