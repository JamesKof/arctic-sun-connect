// Server-only Resend mailer (routed through Lovable's connector gateway).
// Do not import from client-reachable modules at module scope.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  bcc?: string | string[];
  /** Skip the default archive BCC (e.g. for the test-send button which sends to that address directly). */
  skipArchiveBcc?: boolean;
};

const DEFAULT_ARCHIVE_BCC = "afropolarinstitute@gmail.com";

function resolveArchiveBcc(): string[] {
  const override = process.env.EMAIL_BCC;
  const list = (override && override.trim().length > 0 ? override : DEFAULT_ARCHIVE_BCC)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list;
}

export async function sendEmail(input: SendEmailInput): Promise<{ id?: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

  const from =
    input.from ??
    process.env.RESEND_FROM ??
    "Afro Polar Institute <onboarding@resend.dev>";

  const toList = Array.isArray(input.to) ? input.to : [input.to];
  const explicitBcc = input.bcc ? (Array.isArray(input.bcc) ? input.bcc : [input.bcc]) : [];
  const archive = input.skipArchiveBcc ? [] : resolveArchiveBcc();
  const bccList = Array.from(
    new Set([...explicitBcc, ...archive].filter((addr) => !toList.includes(addr))),
  );

  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from,
      to: toList,
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
      ...(bccList.length ? { bcc: bccList } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend send failed [${res.status}]: ${body}`);
    throw new Error(`Email send failed [${res.status}]: ${body}`);
  }
  return res.json().catch(() => ({}));
}

const brandShell = (title: string, body: string) => `
<!doctype html>
<html><body style="margin:0;background:#F4F8FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A3D62;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(10,61,98,0.08);">
        <tr><td style="padding:32px 40px 8px;">
          <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#38B48B;font-weight:700;">Afro Polar Institute</div>
          <h1 style="margin:12px 0 0;font-size:24px;line-height:1.25;color:#0A3D62;font-weight:700;">${title}</h1>
        </td></tr>
        <tr><td style="padding:16px 40px 32px;font-size:15px;line-height:1.65;color:#0A3D62;">${body}</td></tr>
        <tr><td style="padding:20px 40px;background:#DDF4FF;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#0A3D62;">
          Connecting People and Latitudes
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

export const templates = {
  newsletterConfirm(confirmUrl: string) {
    return brandShell(
      "Confirm your subscription",
      `<p>Thanks for joining <strong>The Latitude Brief</strong>. Please confirm your email so we can start delivering monthly dispatches from the tropics to the poles.</p>
       <p style="margin:28px 0;"><a href="${confirmUrl}" style="display:inline-block;background:#0A3D62;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Confirm subscription</a></p>
       <p style="font-size:13px;color:#5A7A90;">If the button doesn't work, paste this link into your browser:<br/><span style="word-break:break-all;">${confirmUrl}</span></p>`,
    );
  },
  eventConfirmation(eventTitle: string, when: string, where: string) {
    return brandShell(
      `You're registered: ${eventTitle}`,
      `<p>We've saved your seat. Here are the details:</p>
       <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;font-size:14px;">
         <tr><td style="padding:6px 12px 6px 0;color:#5A7A90;">When</td><td style="padding:6px 0;font-weight:600;">${when}</td></tr>
         <tr><td style="padding:6px 12px 6px 0;color:#5A7A90;">Where</td><td style="padding:6px 0;font-weight:600;">${where}</td></tr>
       </table>
       <p>You'll receive joining instructions and any programme updates at this address.</p>`,
    );
  },
};
