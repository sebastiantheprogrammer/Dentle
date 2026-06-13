export type SupabaseStatus = {
  configured: boolean;
  missing: string[];
};

export function getSupabaseStatus(): SupabaseStatus {
  const missing = [];
  if (!process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { configured: missing.length === 0, missing };
}

export function isAdminKeyValid(value: string | undefined) {
  const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "development" ? "dentle-admin" : "");
  return Boolean(expected && value && value === expected);
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}) {
  const status = getSupabaseStatus();

  if (!status.configured) {
    throw new Error(`Missing Supabase env: ${status.missing.join(", ")}`);
  }

  const projectUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = `${projectUrl!.replace(/\/$/, "")}/rest/v1/${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });

  const text = await response.text();

  if (!response.ok) {
    const message = text;
    throw new Error(`Supabase request failed: ${response.status} ${message}`);
  }

  if (response.status === 204 || !text) return undefined as T;
  return JSON.parse(text) as T;
}
