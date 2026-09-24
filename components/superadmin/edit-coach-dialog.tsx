"use client";

import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  updateCoachBySuperAdminSchema,
  type UpdateCoachBySuperAdminInput,
} from "@/lib/validators/superadmin";
import { updateCoachBySuperAdminAction } from "@/lib/actions/superadmin.actions";

interface EditCoachDialogProps {
  coach: {
    id: string;
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
    maxPlans?: number;
    maxStudents?: number;
    maxGenericProfiles?: number;
    membershipExpiresAt?: Date | string | null;
  };
}

export function EditCoachDialog({ coach }: EditCoachDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<UpdateCoachBySuperAdminInput>({
    trainerId: coach.id,
    name: coach.name || "",
    email: coach.email || "",
    slug: coach.slug || "",
    businessName: coach.businessName || "",
    headline: coach.headline || "",
    tagline: coach.tagline || "",
    logoUrl: coach.logoUrl || "",
    heroImageUrl: coach.heroImageUrl || "",
    whatsappNumber: coach.whatsappNumber || "",
    instagramUrl: coach.instagramUrl || "",
    maxPlans: coach.maxPlans ?? 1,
    maxStudents: coach.maxStudents ?? 10,
    maxGenericProfiles: coach.maxGenericProfiles ?? 3,
    membershipExpiresAt: coach.membershipExpiresAt
      ? new Date(coach.membershipExpiresAt).toISOString().split("T")[0]
      : "",
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const parsed = updateCoachBySuperAdminSchema.safeParse(values);
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
      const res = await updateCoachBySuperAdminAction(parsed.data);
      if (res.success && res.data) {
        toast.success(`Datos actualizados para ${parsed.data.name}`);
        setOpen(false);
      } else {
        toast.error(res.error || "Error al actualizar datos del profesor");
        if (res.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            if (v && v.length > 0) mapped[k] = v[0];
          }
          setErrors(mapped);
        }
      }
    } catch {
      toast.error("Ocurrió un error inesperado al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Pencil className="size-3.5" />
            Editar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Datos del Entrenador</DialogTitle>
          <DialogDescription>
            Modificá la información de cuenta, marca blanca y configuración del
            portal de <strong>{coach.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Identidad de Cuenta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Nombre y Apellido *</Label>
              <Input
                id="edit-name"
                name="name"
                value={values.name}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email de Acceso *</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Slug y Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-slug">Slug del Portal *</Label>
              <div className="flex items-center rounded-md border border-input bg-muted/40 px-3 py-1 focus-within:ring-2 focus-within:ring-primary">
                <span className="text-xs text-muted-foreground select-none">
                  tuapp.com/
                </span>
                <input
                  id="edit-slug"
                  name="slug"
                  value={values.slug}
                  onChange={handleChange}
                  className="w-full bg-transparent text-sm outline-none px-1 font-mono font-medium"
                  disabled={isSubmitting}
                  required
                />
              </div>
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-businessName">Nombre Comercial</Label>
              <Input
                id="edit-businessName"
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

          {/* Titular y Bajada */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-headline">
              Titular de Bienvenida en Portal
            </Label>
            <Input
              id="edit-headline"
              name="headline"
              value={values.headline ?? ""}
              onChange={handleChange}
              placeholder="Ej: Rutinas de Entrenamiento Personalizadas"
              disabled={isSubmitting}
            />
            {errors.headline && (
              <p className="text-xs text-destructive">{errors.headline}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-tagline">Bajada / Descripción</Label>
            <Textarea
              id="edit-tagline"
              name="tagline"
              rows={2}
              value={values.tagline ?? ""}
              onChange={handleChange}
              placeholder="Ej: Ingresá tu DNI para ver tu plan del día."
              disabled={isSubmitting}
            />
            {errors.tagline && (
              <p className="text-xs text-destructive">{errors.tagline}</p>
            )}
          </div>

          {/* URLs de Imágenes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-logoUrl">URL del Logotipo</Label>
              <Input
                id="edit-logoUrl"
                name="logoUrl"
                value={values.logoUrl ?? ""}
                onChange={handleChange}
                placeholder="https://... o /assets/logo.png"
                disabled={isSubmitting}
              />
              {errors.logoUrl && (
                <p className="text-xs text-destructive">{errors.logoUrl}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-heroImageUrl">URL Imagen de Portada</Label>
              <Input
                id="edit-heroImageUrl"
                name="heroImageUrl"
                value={values.heroImageUrl ?? ""}
                onChange={handleChange}
                placeholder="https://..."
                disabled={isSubmitting}
              />
              {errors.heroImageUrl && (
                <p className="text-xs text-destructive">
                  {errors.heroImageUrl}
                </p>
              )}
            </div>
          </div>

          {/* Canales de Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-whatsappNumber">Número de WhatsApp</Label>
              <Input
                id="edit-whatsappNumber"
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-instagramUrl">
                Instagram (Usuario o URL)
              </Label>
              <Input
                id="edit-instagramUrl"
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

          {/* Límites SaaS y Vencimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-border/50 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-maxStudents">Cupo Alumnos *</Label>
              <Input
                id="edit-maxStudents"
                name="maxStudents"
                type="number"
                min={1}
                value={values.maxStudents ?? 10}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.maxStudents && (
                <p className="text-xs text-destructive">{errors.maxStudents}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-maxPlans">Cupo Planes *</Label>
              <Input
                id="edit-maxPlans"
                name="maxPlans"
                type="number"
                min={1}
                value={values.maxPlans ?? 1}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.maxPlans && (
                <p className="text-xs text-destructive">{errors.maxPlans}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-maxGenericProfiles">Cupo Genéricos *</Label>
              <Input
                id="edit-maxGenericProfiles"
                name="maxGenericProfiles"
                type="number"
                min={0}
                value={values.maxGenericProfiles ?? 3}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.maxGenericProfiles && (
                <p className="text-xs text-destructive">{errors.maxGenericProfiles}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-membershipExpiresAt">Vencimiento</Label>
              <Input
                id="edit-membershipExpiresAt"
                name="membershipExpiresAt"
                type="date"
                value={values.membershipExpiresAt ?? ""}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.membershipExpiresAt && (
                <p className="text-xs text-destructive">
                  {errors.membershipExpiresAt}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
