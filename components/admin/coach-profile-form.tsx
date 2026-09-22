"use client";

import { useState } from "react";
import {
  Save,
  Loader2,
  ExternalLink,
  Smartphone,
  Eye,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  updateCoachProfileSchema,
  type UpdateCoachProfileInput,
} from "@/lib/validators/coach-profile";
import { updateCoachProfileAction } from "@/lib/actions/coach-profile.actions";
import { siteConfig } from "@/lib/config/site";

interface CoachProfileFormProps {
  initialData: {
    name: string;
    email: string;
    slug: string;
    businessName: string | null;
    headline: string | null;
    tagline: string | null;
    logoUrl: string | null;
    heroImageUrl: string | null;
    whatsappNumber: string | null;
    instagramUrl: string | null;
  };
}

export function CoachProfileForm({ initialData }: CoachProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<UpdateCoachProfileInput>({
    name: initialData.name || "",
    businessName: initialData.businessName || "",
    headline: initialData.headline || "",
    tagline: initialData.tagline || "",
    logoUrl: initialData.logoUrl || "",
    heroImageUrl: initialData.heroImageUrl || "",
    whatsappNumber: initialData.whatsappNumber || "",
    instagramUrl: initialData.instagramUrl || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const previewDisplayName =
    values.businessName?.trim() || values.name?.trim() || siteConfig.name;
  const previewHeadline =
    values.headline?.trim() || siteConfig.trainer.headline;
  const previewTagline = values.tagline?.trim() || siteConfig.trainer.tagline;
  const previewLogo = values.logoUrl?.trim() || siteConfig.branding.logoHome;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = updateCoachProfileSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await updateCoachProfileAction(parsed.data);
      if (res.success) {
        toast.success("Configuración de marca guardada con éxito");
      } else {
        toast.error(res.error || "Error al guardar configuración");
        if (res.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            if (v && v.length > 0) mapped[k] = v[0];
          }
          setErrors(mapped);
        }
      }
    } catch {
      toast.error("Ocurrió un error inesperado al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Form (Col 7) */}
      <div className="lg:col-span-7 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tenant Identity Card */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Identidad y Marca Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Portal info */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Tu Enlace de Portal Personalizado
                  </span>
                  <Link
                    href={`/${initialData.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Visitar Portal
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <div className="font-mono text-sm font-bold text-foreground">
                  tuapp.com/{initialData.slug}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Compartí este enlace con tus alumnos para que accedan
                  directamente a su panel con su DNI.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre del Entrenador *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Nombre Comercial / Marca</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={values.businessName ?? ""}
                    onChange={handleChange}
                    placeholder="Ej: SR Training Club"
                    disabled={isSubmitting}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-destructive">
                      {errors.businessName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="headline">Titular de Bienvenida</Label>
                <Input
                  id="headline"
                  name="headline"
                  value={values.headline ?? ""}
                  onChange={handleChange}
                  placeholder="Ej: Rutinas de Entrenamiento Personalizadas"
                  disabled={isSubmitting}
                />
                {errors.headline && (
                  <p className="text-xs text-destructive">{errors.headline}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Texto principal mostrado en el encabezado de tu portal.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tagline">Bajada / Descripción</Label>
                <Textarea
                  id="tagline"
                  name="tagline"
                  rows={2}
                  value={values.tagline ?? ""}
                  onChange={handleChange}
                  placeholder="Ej: Ingresá tu DNI para consultar tu plan de entrenamiento de hoy."
                  disabled={isSubmitting}
                />
                {errors.tagline && (
                  <p className="text-xs text-destructive">{errors.tagline}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Media & Branding Card */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recursos Visuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="logoUrl">URL del Logotipo</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  value={values.logoUrl ?? ""}
                  onChange={handleChange}
                  placeholder="Ej: https://tu-sitio.com/logo.png o /assets/logo.png"
                  disabled={isSubmitting}
                />
                {errors.logoUrl && (
                  <p className="text-xs text-destructive">{errors.logoUrl}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Dejá vacío para usar el logo predeterminado de la plataforma.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="heroImageUrl">
                  URL de Imagen de Fondo / Portada (Opcional)
                </Label>
                <Input
                  id="heroImageUrl"
                  name="heroImageUrl"
                  value={values.heroImageUrl ?? ""}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  disabled={isSubmitting}
                />
                {errors.heroImageUrl && (
                  <p className="text-xs text-destructive">
                    {errors.heroImageUrl}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact & Social Card */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Canales de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
                  <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={values.whatsappNumber ?? ""}
                    onChange={handleChange}
                    placeholder="Ej: +5491112345678"
                    disabled={isSubmitting}
                  />
                  {errors.whatsappNumber && (
                    <p className="text-xs text-destructive">
                      {errors.whatsappNumber}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Tus alumnos podrán hacer clic y abrir chat directo cuando su
                    cuota esté por vencer.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instagramUrl">
                    Usuario o Link de Instagram
                  </Label>
                  <Input
                    id="instagramUrl"
                    name="instagramUrl"
                    value={values.instagramUrl ?? ""}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.instagramUrl && (
                    <p className="text-xs text-destructive">
                      {errors.instagramUrl}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 px-6"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>

      {/* Live Preview (Col 5) */}
      <div className="lg:col-span-5 sticky top-20 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Eye className="size-4 text-primary" />
            <span>Previsualización en Vivo del Portal</span>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
            <Smartphone className="size-3.5" />
            Vista Móvil
          </span>
        </div>

        {/* Mock Mobile Device Frame */}
        <div className="rounded-3xl border-4 border-[#1a1a1a] bg-[#0d0d0d] p-4 text-white shadow-2xl overflow-hidden">
          {/* Mobile Top bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[10px] text-white/50">
            <span>9:41</span>
            <span className="font-mono">tuapp.com/{initialData.slug}</span>
            <span>100%</span>
          </div>

          {/* Portal Content Preview */}
          <div className="py-6 px-2 flex flex-col items-center text-center space-y-5">
            {/* Dynamic Logo */}
            <div className="relative h-14 w-40 flex items-center justify-center">
              {/* Fallback image rendering */}
              <img
                src={previewLogo}
                alt={previewDisplayName}
                className="max-h-14 max-w-full object-contain"
                onError={(e) => {
                  // Fallback if custom URL fails
                  e.currentTarget.src = siteConfig.branding.logoHome;
                }}
              />
            </div>

            {/* Headline and Tagline */}
            <div className="space-y-1.5 max-w-xs">
              <h3 className="font-heading text-xl font-bold uppercase tracking-tight text-white leading-tight">
                {previewHeadline}
              </h3>
              <p className="text-xs text-white/70">{previewTagline}</p>
            </div>

            {/* Mock DNI Box */}
            <div className="w-full max-w-xs rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <div className="text-left space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  Número de DNI
                </label>
                <div className="h-9 w-full rounded-lg bg-white/10 border border-white/20 px-3 flex items-center text-xs text-white/40 font-mono">
                  12345678
                </div>
              </div>
              <button
                type="button"
                disabled
                className="w-full h-9 rounded-lg bg-primary font-heading uppercase tracking-wider text-xs font-semibold text-white cursor-default"
              >
                Ingresar a mi rutina
              </button>
            </div>

            {/* WhatsApp Contact Preview */}
            {values.whatsappNumber && (
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
                <MessageCircle className="size-3.5" />
                <span>Contacto WhatsApp: {values.whatsappNumber}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-center text-muted-foreground px-4">
          Los cambios se aplicarán inmediatamente en tu enlace público al hacer
          clic en <strong>Guardar Cambios</strong>.
        </p>
      </div>
    </div>
  );
}
