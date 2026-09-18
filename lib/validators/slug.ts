import { z } from "zod"

export const RESERVED_SLUGS = [
  "admin",
  "superadmin",
  "login",
  "api",
  "dashboard",
  "alumnos",
  "planes",
  "ejercicios",
  "plantillas",
  "configuracion",
  "rutina",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
] as const

export const slugSchema = z
  .string()
  .min(3, "El slug debe tener al menos 3 caracteres")
  .max(50, "El slug no puede exceder 50 caracteres")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "El slug solo puede contener letras minúsculas, números y guiones medios (sin guiones al inicio o final)",
  )
  .refine(
    (slug) => !RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]),
    {
      message: "Este slug está reservado por el sistema. Por favor elegí otro.",
    },
  )
