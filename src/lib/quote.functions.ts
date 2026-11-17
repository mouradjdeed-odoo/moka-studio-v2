import { createServerFn } from "@tanstack/react-start";
import { validateAll, type QuoteData, type QuoteErrors } from "@/lib/quote";

export type QuoteResult = { ok: true } | { ok: false; errors: QuoteErrors };

const textFields = [
  "service", "objectType", "cleanScope", "buildScope", "serviceType", "units", "area",
  "floor", "elevator", "distance", "fillLevel", "name", "company", "address", "email", "phone", "notes",
] as const;

export const submitQuote = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Expected form data");
    return input;
  })
  .handler(async ({ data: formData }): Promise<QuoteResult> => {
    const data = Object.fromEntries(
      textFields.map((key) => [key, String(formData.get(key) ?? "").slice(0, 3000)]),
    ) as Omit<QuoteData, "privacy">;
    const quote: QuoteData = { ...data, privacy: formData.get("privacy") === "true" };
    const files = formData
      .getAll("files")
      .filter((f): f is File => typeof f === "object" && f !== null && (f as File).size > 0) as File[];

    const errors = validateAll(quote, files);
    if (Object.keys(errors).length > 0) return { ok: false, errors };

    // Same as the original project: requests are validated but not yet delivered to an inbox.
    return { ok: true };
  });
