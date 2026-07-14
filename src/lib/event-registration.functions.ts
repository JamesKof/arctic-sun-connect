import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  event_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(254),
  organization: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const registerForEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("event_registrations").upsert(
      { event_id: data.event_id, name: data.name, email: data.email.toLowerCase(), organization: data.organization ?? null, notes: data.notes ?? null },
      { onConflict: "event_id,email" },
    );
    if (error) throw error;
    // TODO: send confirmation email once an email domain is configured.
    return { ok: true };
  });
