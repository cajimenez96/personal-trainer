import { z } from "zod"

// Sanitize first (strip anything that isn't a digit — handles "30.123.456",
// spaces, etc.) then validate shape. Never pass raw user input to a query.
export const dniSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{7,9}$/, "DNI inválido"))
