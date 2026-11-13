import "server-only";

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

export async function sendVendorRejectionEmail(input: {
  to: string;
  businessName: string;
  reason: string;
  reapplicationAllowed: boolean;
  nextReapplicationAt: string | null;
  remainingAttempts: number;
  idempotencyKey: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Resend email configuration is missing.");

  const dateText = input.nextReapplicationAt
    ? new Date(input.nextReapplicationAt).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Lagos" })
    : "";

  const policy = input.reapplicationAllowed
    ? `You may submit up to ${input.remainingAttempts} more reapplication(s). The next submission window opens on ${dateText} (Nigeria time).`
    : "No further reapplications are available for this application. Please contact Bufer Feast support if you believe this decision was made in error.";

  const reason = escapeHtml(input.reason);
  const business = escapeHtml(input.businessName || "your business");
  const text = [
    "Hello,",
    `We reviewed the vendor application for ${input.businessName || "your business"} and could not approve it at this time.`,
    "",
    "Reason for rejection:",
    input.reason,
    "",
    policy,
    "",
    "Bufer Feast Vendor Support",
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Update on your Bufer Feast vendor application",
      text,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937"><h2>Vendor application update</h2><p>Hello,</p><p>We reviewed the vendor application for <strong>${business}</strong> and could not approve it at this time.</p><h3>Reason for rejection</h3><p style="white-space:pre-wrap">${reason}</p><p>${escapeHtml(policy)}</p><p>Bufer Feast Vendor Support</p></div>`,
    }),
  });

  const payload = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok) throw new Error(`Resend rejected the email request (HTTP ${response.status}): ${payload.message || "provider error"}`);
  return { id: payload.id || null };
}
