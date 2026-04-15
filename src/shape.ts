export type ShapedAddress = {
  status: string;
  original_input: string;
  valid: boolean | null;
  address: AddressComponents | null;
  formatted: string | null;
  error: string | null;
  errors?: string[];
  raw?: unknown;
};

type AddressComponents = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

type RawAddress = {
  id?: number;
  original_input?: string;
  status?: string;
  remote_payload?: {
    is_valid?: boolean;
    formatted_address?: string;
    address?: Partial<AddressComponents>;
    [key: string]: unknown;
  };
  errors?: string[];
};

export function shapeSingle(envelope: unknown): ShapedAddress {
  const raw = ((envelope as { address?: RawAddress })?.address ?? {}) as RawAddress;
  return shape(raw);
}

export function shapeMany(envelope: unknown): ShapedAddress[] {
  const entries = ((envelope as { addresses?: RawAddress[] })?.addresses ?? []) as RawAddress[];
  return entries.map(shape);
}

function shape(raw: RawAddress): ShapedAddress {
  if (raw.errors && raw.errors.length > 0) {
    return {
      status: "invalid_input",
      original_input: raw.original_input ?? "",
      valid: false,
      address: null,
      formatted: null,
      error: null,
      errors: raw.errors,
    };
  }

  const payload = raw.remote_payload ?? {};
  const components = payload.address ?? {};

  return {
    status: raw.status ?? "unknown",
    original_input: raw.original_input ?? "",
    valid: typeof payload.is_valid === "boolean" ? payload.is_valid : null,
    address: raw.remote_payload
      ? {
          line1: components.line1 ?? null,
          line2: components.line2 ?? null,
          city: components.city ?? null,
          state: components.state ?? null,
          postal_code: components.postal_code ?? null,
          country: components.country ?? null,
        }
      : null,
    formatted: payload.formatted_address ?? null,
    error: null,
    raw: raw.remote_payload,
  };
}
