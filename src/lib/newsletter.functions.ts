import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomToken } from "./slug";

const emailSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(120).optional(),
  origin: z.string().trim().url().max(300).optional(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = randomToken(24);
    const email = data.email.toLowerCase();
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert(
        { email, name: data.name ?? null, confirm_token: token, status: "pending" },
        { onConflict: "email" },
      );
    if (error) throw error;

    const origin = data.origin?.replace(/\/$/, "") ?? "https://arctic-sun-connect.lovable.app";
    const confirmUrl = `${origin}/newsletter/confirm?token=${token}`;

    try {
      const { sendEmail, templates } = await import("./mailer.server");
      await sendEmail({
        to: email,
        subject: "Confirm your subscription to The Latitude Brief",
        html: templates.newsletterConfirm(confirmUrl),
      });
    } catch (err) {
      console.error("Newsletter confirmation email failed:", err);
    }

    return { ok: true, pending: true };
  });

export const confirmNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: String(d.token).slice(0, 128) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString(), confirm_token: null })
      .eq("confirm_token", data.token)
      .select("email, name")
      .maybeSingle();
    if (error) throw error;

    if (row?.email) {
      try {
        const { upsertMailchimpMember } = await import("./mailchimp.server");
        await upsertMailchimpMember({
          email: row.email,
          name: row.name,
          status: "subscribed",
          tags: ["latitude-brief"],
        });
      } catch (err) {
        console.error("Mailchimp mirror failed:", err);
      }
    }

    return { ok: !!row, email: row?.email ?? null };
  });
