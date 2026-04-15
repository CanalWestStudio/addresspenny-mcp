#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AddressPennyClient } from "./client.js";

const API_KEY = process.env.ADDRESSPENNY_API_KEY;
const ACCOUNT_ID = process.env.ADDRESSPENNY_ACCOUNT_ID;
const API_URL = process.env.ADDRESSPENNY_API_URL ?? "https://addresspenny.com/api/v1";

if (!API_KEY) {
  console.error("ADDRESSPENNY_API_KEY environment variable is required");
  process.exit(1);
}
if (!ACCOUNT_ID) {
  console.error("ADDRESSPENNY_ACCOUNT_ID environment variable is required");
  process.exit(1);
}

const client = new AddressPennyClient({ apiKey: API_KEY, accountId: ACCOUNT_ID, baseUrl: API_URL });

const server = new McpServer(
  { name: "addresspenny", version: "0.1.0" },
  {
    instructions:
      "Use these tools to validate postal mailing addresses via AddressPenny. " +
      "Prefer validate_address for a single known address, bulk_validate for a list of known addresses, " +
      "and parse_and_validate when addresses are embedded in freeform text (chats, documents, transcripts). " +
      "All tools return the standardized address and validation metadata when successful.",
  }
);

server.registerTool(
  "validate_address",
  {
    description:
      "Validate a single postal address. Returns the standardized address, deliverability status, and validation metadata. Consumes 1 credit.",
    inputSchema: {
      address: z
        .string()
        .min(1)
        .describe("Full or partial postal address as a single string, e.g. '1600 Amphitheatre Pkwy, Mountain View, CA'"),
    },
  },
  async ({ address }) => {
    try {
      const result = await client.validateAddress(address);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.registerTool(
  "bulk_validate",
  {
    description:
      "Validate up to 100 postal addresses in a single request. Consumes 1 credit per address. Returns an array where each entry is either a validated address or an error.",
    inputSchema: {
      addresses: z
        .array(z.string().min(1))
        .min(1)
        .max(100)
        .describe("Array of address strings to validate (max 100)."),
    },
  },
  async ({ addresses }) => {
    try {
      const result = await client.bulkValidate(addresses);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  }
);

server.registerTool(
  "parse_and_validate",
  {
    description:
      "Extract postal addresses from unstructured text (emails, chat messages, call transcripts, scraped pages) and validate each one. Consumes 1 credit per extracted and validated address. Returns an empty list if no complete addresses are found.",
    inputSchema: {
      text: z
        .string()
        .min(1)
        .describe("Freeform text that may contain zero or more postal addresses."),
    },
  },
  async ({ text }) => {
    try {
      const result = await client.parseAndValidate(text);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return errorResult(error);
    }
  }
);

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `AddressPenny error: ${message}` }],
    isError: true,
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AddressPenny MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
