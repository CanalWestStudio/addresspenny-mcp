type ClientOptions = {
  apiKey: string;
  accountId: string;
  baseUrl: string;
};

export class AddressPennyClient {
  private readonly apiKey: string;
  private readonly accountId: string;
  private readonly baseUrl: string;

  constructor({ apiKey, accountId, baseUrl }: ClientOptions) {
    this.apiKey = apiKey;
    this.accountId = accountId;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async validateAddress(originalInput: string) {
    return this.post(`/accounts/${this.accountId}/addresses`, {
      address: { original_input: originalInput },
      sync: true,
    });
  }

  async bulkValidate(addresses: string[]) {
    return this.post(`/accounts/${this.accountId}/addresses/batch`, {
      addresses,
      sync: true,
    });
  }

  async parseAndValidate(text: string) {
    return this.post(`/accounts/${this.accountId}/addresses/parse_and_validate`, { text });
  }

  private async post(path: string, body: unknown) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    const parsed = text ? safeJson(text) : null;

    if (!response.ok) {
      let errorMessage: string | null = null;
      if (parsed && typeof parsed === "object" && "error" in parsed) {
        errorMessage = formatError((parsed as { error: unknown }).error);
      }
      throw new Error(errorMessage ?? `HTTP ${response.status} ${response.statusText}`);
    }

    return parsed;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const { code, message } = error as { code?: string; message?: string };
  if (code && message) return `${code}: ${message}`;
  return message ?? null;
}
