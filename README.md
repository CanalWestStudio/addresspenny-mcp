# @addresspenny/mcp

[Model Context Protocol](https://modelcontextprotocol.io) server for [AddressPenny](https://addresspenny.com) address validation. Lets Claude Desktop, Cursor, and any MCP-compatible agent validate postal addresses, bulk-clean lists, and extract addresses from freeform text.

## Tools

- **`validate_address`** — validate a single postal address. Returns the standardized address and validation metadata. Consumes 1 credit.
- **`bulk_validate`** — validate up to 100 addresses in one call. Consumes 1 credit per address.
- **`parse_and_validate`** — extract every postal address from unstructured text (chats, transcripts, scraped pages) and validate each one. Consumes 1 credit per extracted and validated address.

## Requirements

- Node.js 18 or newer
- An AddressPenny account with an API token and the token's account ID — create both at [addresspenny.com](https://addresspenny.com)

## Configuration

The server reads three environment variables:

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `ADDRESSPENNY_API_KEY` | yes | — | API token from AddressPenny |
| `ADDRESSPENNY_ACCOUNT_ID` | yes | — | Prefixed account ID (e.g. `acct_abc123`) |
| `ADDRESSPENNY_API_URL` | no | `https://addresspenny.com/api/v1` | Override for self-hosted or staging |

## Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or the equivalent on your OS:

```json
{
  "mcpServers": {
    "addresspenny": {
      "command": "npx",
      "args": ["-y", "@addresspenny/mcp"],
      "env": {
        "ADDRESSPENNY_API_KEY": "your-api-token",
        "ADDRESSPENNY_ACCOUNT_ID": "acct_your_account_id"
      }
    }
  }
}
```

Restart Claude Desktop. The tools appear under the tools icon in the chat input.

## Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "addresspenny": {
      "command": "npx",
      "args": ["-y", "@addresspenny/mcp"],
      "env": {
        "ADDRESSPENNY_API_KEY": "your-api-token",
        "ADDRESSPENNY_ACCOUNT_ID": "acct_your_account_id"
      }
    }
  }
}
```

## Local development

```bash
npm install
npm run build
ADDRESSPENNY_API_KEY=... ADDRESSPENNY_ACCOUNT_ID=... node build/index.js
```

The server speaks MCP over stdio. It is not meant to be invoked directly — point an MCP client at it using the config above.

## License

MIT
