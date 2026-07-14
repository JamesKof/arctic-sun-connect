import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { randomToken } from "./slug";

const emailSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(120).optional(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = randomToken(24);
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert(
        { email: data.email.toLowerCase(), name: data.name ?? null, confirm_token: token, status: "pending" },
        { onConflict: "email" },
      );
    if (error) throw error;
    // TODO: send double opt-in email once an email domain is configured.
    // Confirmation URL: `${origin}/newsletter/confirm?token=${token}`
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
      .select("email")
      .maybeSingle();
    if (error) throw error;
    return { ok: !!row, email: row?.email ?? null };
  });
