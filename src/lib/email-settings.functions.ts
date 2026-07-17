import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

function mask(v: string | undefined | null, keep = 4): string | null {
  if (!v) return null;
  if (v.length <= keep) return "•".repeat(v.length);
  return "•".repeat(Math.max(4, v.length - keep)) + v.slice(-keep);
}

export const getEmailSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const resendKey = process.env.RESEND_API_KEY;
    const mailchimpKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    const serverPrefix =
      process.env.MAILCHIMP_SERVER_PREFIX ||
      (mailchimpKey && mailchimpKey.includes("-")
        ? mailchimpKey.slice(mailchimpKey.lastIndexOf("-") + 1)
        : null);
    const archiveBcc =
      (process.env.EMAIL_BCC && process.env.EMAIL_BCC.trim()) ||
      "afropolarinstitute@gmail.com";

    return {
      resend: {
        apiKeyConfigured: !!resendKey,
        apiKeyPreview: mask(resendKey, 4),
        from: process.env.RESEND_FROM || "Afro Polar Institute <onboarding@resend.dev>",
        fromIsDefault: !process.env.RESEND_FROM,
      },
      mailchimp: {
        apiKeyConfigured: !!mailchimpKey,
        apiKeyPreview: mask(mailchimpKey, 6),
        audienceId: audienceId || null,
        serverPrefix: serverPrefix || null,
      },
      archive: {
        bcc: archiveBcc,
        isDefault: !process.env.EMAIL_BCC,
      },
    };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        to: z.string().trim().email().max(254).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const recipient = data.to || "afropolarinstitute@gmail.com";
    const { sendEmail } = await import("./mailer.server");
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0A3D62;padding:24px;">
        <h2 style="margin:0 0 12px;">Test dispatch</h2>
        <p>This is a test message from the Afro Polar Institute email pipeline.</p>
        <p style="font-size:12px;color:#5A7A90;">Sent at ${new Date().toISOString()}</p>
      </div>`;
    const result = await sendEmail({
      to: recipient,
      subject: "Afro Polar Institute — email test",
      html,
      // The recipient may already be the archive address — sendEmail dedupes,
      // but skip explicitly when the user is testing the archive itself.
      skipArchiveBcc: recipient.toLowerCase() === "afropolarinstitute@gmail.com",
    });
    return { ok: true, id: result.id ?? null, sentTo: recipient };
  });

export const testMailchimpConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    const prefix =
      process.env.MAILCHIMP_SERVER_PREFIX ||
      (apiKey && apiKey.includes("-") ? apiKey.slice(apiKey.lastIndexOf("-") + 1) : null);
    if (!apiKey || !audienceId || !prefix) {
      return { ok: false, error: "Mailchimp credentials are not fully configured." };
    }
    const url = `https://${prefix}.api.mailchimp.com/3.0/lists/${audienceId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${btoa(`anystring:${apiKey}`)}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Mailchimp responded ${res.status}: ${text.slice(0, 240)}` };
    }
    const body = (await res.json()) as { name?: string; stats?: { member_count?: number } };
    return {
      ok: true,
      audienceName: body.name ?? null,
      memberCount: body.stats?.member_count ?? null,
    };
  });
