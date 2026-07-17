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
    const email = data.email.toLowerCase();
    const { error } = await supabaseAdmin.from("event_registrations").upsert(
      {
        event_id: data.event_id,
        name: data.name,
        email,
        organization: data.organization ?? null,
        notes: data.notes ?? null,
      },
      { onConflict: "event_id,email" },
    );
    if (error) throw error;

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("title, starts_at, location, venue:venues(name, city, country)")
      .eq("id", data.event_id)
      .maybeSingle();

    if (event) {
      const when = event.starts_at
        ? new Date(event.starts_at).toLocaleString("en-GB", {
            dateStyle: "full",
            timeStyle: "short",
          })
        : "TBA";
      const venue = Array.isArray(event.venue) ? event.venue[0] : event.venue;
      const where = venue
        ? [venue.name, venue.city, venue.country].filter(Boolean).join(", ")
        : event.location ?? "Location to be confirmed";

      try {
        const { sendEmail, templates } = await import("./mailer.server");
        await sendEmail({
          to: email,
          subject: `You're registered — ${event.title}`,
          html: templates.eventConfirmation(event.title, when, where),
        });
      } catch (err) {
        console.error("Event confirmation email failed:", err);
      }
    }

    return { ok: true };
  });
