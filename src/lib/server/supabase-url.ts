// A hosted Supabase client requires the PROJECT BASE URL. The SDK adds /rest/v1.
export function canonicalSupabaseUrl(value: string | undefined): string {
  if (!value) throw new Error("Missing Supabase project URL.");
  const url = new URL(value.trim());
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.hostname === "supabase.com"
  ) {
    throw new Error(
      "Use the HTTPS project base URL with no /rest/v1, table path, query or credentials.",
    );
  }
  return url.origin;
}
