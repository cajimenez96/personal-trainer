"use client";

import { useState } from "react";
import {
  Plus,
  Loader2,
  CheckCircle2,
  User,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  createCoachSchema,
  type CreateCoachInput,
} from "@/lib/validators/superadmin";
import { createCoachAction } from "@/lib/actions/superadmin.actions";
import type { PlatformPlanDTO } from "@/lib/repositories/platform-plan.repository";

interface CreateCoachDialogProps {
  plans?: PlatformPlanDTO[];
}

export function CreateCoachDialog({ plans = [] }: CreateCoachDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedQuotas, setShowAdvancedQuotas] = useState(false);

  const defaultPlan = plans.length > 0 ? plans[0] : null;

  const calculateDefaultExpiry = (durationDays: number = 30): string => {
    const d = new Date();
    d.setDate(d.getDate() + durationDays);
    return d.toISOString().split("T")[0];
  };

  const [values, setValues] = useState<CreateCoachInput>({
    name: "",
    email: "",
    password: "",
    slug: "",
    businessName: "",
    whatsappNumber: "",
    platformPlanId: defaultPlan ? defaultPlan.id : "",
    maxPlans: defaultPlan ? defaultPlan.maxPlans : 1,
    maxStudents: defaultPlan ? defaultPlan.maxStudents : 10,
    maxGenericProfiles: defaultPlan ? defaultPlan.maxGenericProfiles : 3,
    membershipExpiresAt: defaultPlan
      ? calculateDefaultExpiry(defaultPlan.durationDays)
      : calculateDefaultExpiry(30),
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

  const handleSelectPlan = (plan: PlatformPlanDTO | null) => {
    if (!plan) {
      setValues((prev) => ({
        ...prev,
        platformPlanId: "",
      }));
      setShowAdvancedQuotas(true);
      return;
    }

    const expiryDays =
      plan.trialDays && plan.trialDays > 0
        ? plan.durationDays + plan.trialDays
        : plan.durationDays;

    setValues((prev) => ({
      ...prev,
      platformPlanId: plan.id,
      maxPlans: plan.maxPlans,
      maxStudents: plan.maxStudents,
      maxGenericProfiles: plan.maxGenericProfiles,
      membershipExpiresAt: calculateDefaultExpiry(expiryDays),
    }));
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
          `Profesor creado exitosamente con slug /${res.data.slug}`
        );
        setValues({
          name: "",
          email: "",
          password: "",
          slug: "",
          businessName: "",
          whatsappNumber: "",
          platformPlanId: defaultPlan ? defaultPlan.id : "",
          maxPlans: defaultPlan ? defaultPlan.maxPlans : 1,
          maxStudents: defaultPlan ? defaultPlan.maxStudents : 10,
          maxGenericProfiles: defaultPlan ? defaultPlan.maxGenericProfiles : 3,
          membershipExpiresAt: defaultPlan
            ? calculateDefaultExpiry(defaultPlan.durationDays)
            : calculateDefaultExpiry(30),
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
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger
        render={
          <Button className="gap-2 shadow-sm font-medium">
            <Plus className="size-4" />
            Nuevo Profesor
          </Button>
        }
      />
      <ResponsiveDialogContent className="w-auto sm:max-w-7xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full overflow-hidden"
        >
          {/* Header */}
          <ResponsiveDialogHeader className="p-5 border-b border-border bg-muted/20 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <User className="size-5" />
              </span>
              <div>
                <ResponsiveDialogTitle className="text-xl font-bold tracking-tight">
                  Dar de Alta Nuevo Profesor
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Registrá un nuevo entrenador para crear su entorno aislado
                  (tenant) y su portal de alumnos con slug dedicado.
                </ResponsiveDialogDescription>
              </div>
            </div>
          </ResponsiveDialogHeader>

          {/* Body con scroll interno */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* SECCIÓN 1: Identidad y Acceso */}
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="size-3.5 text-primary" />
                  1. Identidad & Portal de Acceso
                </span>
                <span className="text-[11px] text-muted-foreground">
                  * Obligatorio
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre y Apellido *</Label>
                <Input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="Ej: Laura Gómez"
                  disabled={isSubmitting}
                  className="bg-background"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug de Acceso (URL del Portal) *</Label>
                <div className="flex items-center rounded-md border border-input bg-muted/40 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:bg-background transition-all">
                  <span className="text-xs font-mono text-muted-foreground select-none">
                    tuapp.com/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    value={values.slug}
                    onChange={handleChange}
                    className="w-full bg-transparent text-xs font-mono font-medium outline-none px-1 text-foreground"
                    placeholder="laura-gomez"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Solo minúsculas, números y guiones. Es la URL pública donde sus
                  alumnos verán sus rutinas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email de Acceso *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    placeholder="admin@plataforma.com"
                    disabled={isSubmitting}
                    className="bg-background"
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
                    className="bg-background"
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Nombre Comercial (Marca)</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={values.businessName ?? ""}
                    onChange={handleChange}
                    placeholder="Ej: LG Fitness Studio"
                    disabled={isSubmitting}
                    className="bg-background"
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
                    className="bg-background"
                  />
                  {errors.whatsappNumber && (
                    <p className="text-xs text-destructive">
                      {errors.whatsappNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Plan SaaS & Suscripción */}
            <div className="rounded-xl border border-border/80 bg-card p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  2. Plan de Plataforma & Límites SaaS
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Suscripción Entrenador
                </Badge>
              </div>

              {/* Selector de Planes de Plataforma */}
              {plans.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Seleccioná el plan base asignado:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {plans.map((p) => {
                      const isSelected = values.platformPlanId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectPlan(p)}
                          className={`flex flex-col justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                              : "border-border/70 bg-background/50 hover:bg-muted/30"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-foreground">
                                {p.name}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="size-3.5 text-primary" />
                              )}
                            </div>
                            <p className="text-sm font-bold text-foreground mt-1">
                              ${p.price.toLocaleString("es-AR")}
                              <span className="text-[10px] font-normal text-muted-foreground">
                                /{p.durationDays}d
                              </span>
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-0.5">
                            <p>
                              <strong>{p.maxStudents}</strong> alumnos
                            </p>
                            <p>
                              <strong>{p.maxPlans}</strong> planes coach
                            </p>
                            <p>
                              <strong>{p.maxGenericProfiles}</strong> genéricos
                            </p>
                            {p.trialDays > 0 && (
                              <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                🎁 {p.trialDays}d prueba
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón para mostrar / ajustar límites personalizados */}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedQuotas((prev) => !prev)}
                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/70"
                >
                  <span>
                    {showAdvancedQuotas
                      ? "Ocultar ajustes manuales de cupos"
                      : "Ajustar límites o fecha de vencimiento manualmente"}
                  </span>
                  {showAdvancedQuotas ? (
                    <ChevronUp className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </Button>
              </div>

              {/* Detalle de Cupos y Vencimiento */}
              {showAdvancedQuotas && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 bg-muted/20 p-3 rounded-lg border border-border/50 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <Label htmlFor="maxStudents" className="text-xs">
                      Cupo Alumnos *
                    </Label>
                    <Input
                      id="maxStudents"
                      name="maxStudents"
                      type="number"
                      min={1}
                      value={values.maxStudents ?? 10}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background h-8 text-xs"
                      required
                    />
                    {errors.maxStudents && (
                      <p className="text-[10px] text-destructive">
                        {errors.maxStudents}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="maxPlans" className="text-xs">
                      Cupo Planes *
                    </Label>
                    <Input
                      id="maxPlans"
                      name="maxPlans"
                      type="number"
                      min={1}
                      value={values.maxPlans ?? 1}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background h-8 text-xs"
                      required
                    />
                    {errors.maxPlans && (
                      <p className="text-[10px] text-destructive">
                        {errors.maxPlans}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="maxGenericProfiles" className="text-xs">
                      Genéricos *
                    </Label>
                    <Input
                      id="maxGenericProfiles"
                      name="maxGenericProfiles"
                      type="number"
                      min={0}
                      value={values.maxGenericProfiles ?? 3}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background h-8 text-xs"
                      required
                    />
                    {errors.maxGenericProfiles && (
                      <p className="text-[10px] text-destructive">
                        {errors.maxGenericProfiles}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="membershipExpiresAt" className="text-xs">
                      Vencimiento
                    </Label>
                    <Input
                      id="membershipExpiresAt"
                      name="membershipExpiresAt"
                      type="date"
                      value={values.membershipExpiresAt ?? ""}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="bg-background h-8 text-xs"
                    />
                    {errors.membershipExpiresAt && (
                      <p className="text-[10px] text-destructive">
                        {errors.membershipExpiresAt}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer fijo */}
          <ResponsiveDialogFooter>
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
              Crear Profesor
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
