"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  createCoachSchema,
  type CreateCoachInput,
} from "@/lib/validators/superadmin";
import { createCoachAction } from "@/lib/actions/superadmin.actions";

export function CreateCoachDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<CreateCoachInput>({
    name: "",
    email: "",
    password: "",
    slug: "",
    businessName: "",
    whatsappNumber: "",
    maxPlans: 1,
    maxStudents: 10,
    maxGenericProfiles: 3,
    membershipExpiresAt: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name") {
        const currentSlug = prev.slug;
        if (!currentSlug || currentSlug === slugify(prev.name)) {
          next.slug = slugify(value);
        }
      }
      return next;
    });
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

    const parsed = createCoachSchema.safeParse(values);
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
      const res = await createCoachAction(parsed.data);
      if (res.success && res.data) {
        toast.success(
          `Profesor creado exitosamente con slug /${res.data.slug}`,
        );
        setValues({
          name: "",
          email: "",
          password: "",
          slug: "",
          businessName: "",
          whatsappNumber: "",
          maxPlans: 1,
          maxStudents: 10,
          maxGenericProfiles: 3,
          membershipExpiresAt: "",
        });
        setOpen(false);
      } else {
        toast.error(res.error || "Error al crear el profesor");
        if (res.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.fieldErrors)) {
            if (v && v.length > 0) mapped[k] = v[0];
          }
          setErrors(mapped);
        }
      }
    } catch {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="size-4" />
            Nuevo Profesor
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dar de Alta Nuevo Profesor</DialogTitle>
          <DialogDescription>
            Registrá un nuevo entrenador para crear su entorno aislado y su
            portal de alumnos con slug dedicado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre y Apellido *</Label>
            <Input
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Ej: Laura Gómez"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug de Acceso (URL del Portal) *</Label>
            <div className="flex items-center rounded-md border border-input bg-muted/40 px-3 py-1 focus-within:ring-2 focus-within:ring-primary">
              <span className="text-sm text-muted-foreground select-none">
                tuapp.com/
              </span>
              <input
                id="slug"
                name="slug"
                value={values.slug}
                onChange={handleChange}
                className="w-full bg-transparent text-sm outline-none px-1 font-mono font-medium"
                placeholder="laura-gomez"
                disabled={isSubmitting}
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Solo minúsculas, números y guiones. Es la URL donde sus alumnos
              verán sus rutinas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email de Acceso *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="profesor@ejemplo.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña Inicial *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Nombre Comercial (Marca)</Label>
              <Input
                id="businessName"
                name="businessName"
                value={values.businessName ?? ""}
                onChange={handleChange}
                placeholder="Ej: LG Fitness Studio"
                disabled={isSubmitting}
              />
              {errors.businessName && (
                <p className="text-xs text-destructive">
                  {errors.businessName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsappNumber">WhatsApp de Contacto</Label>
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
            </div>
          </div>

          {/* Límites SaaS y Vencimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-border/50 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxStudents">Cupo Alumnos *</Label>
              <Input
                id="maxStudents"
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
              <Label htmlFor="maxPlans">Cupo Planes *</Label>
              <Input
                id="maxPlans"
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
              <Label htmlFor="maxGenericProfiles">Genéricos *</Label>
              <Input
                id="maxGenericProfiles"
                name="maxGenericProfiles"
                type="number"
                min={0}
                value={values.maxGenericProfiles ?? 3}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.maxGenericProfiles && (
                <p className="text-xs text-destructive">
                  {errors.maxGenericProfiles}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="membershipExpiresAt">Vencimiento</Label>
              <Input
                id="membershipExpiresAt"
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
              Guardar y Crear Tenant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
