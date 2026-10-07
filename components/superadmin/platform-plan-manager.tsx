"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Layers,
  UserCog,
  Clock,
  Sparkles,
  Loader2,
  CheckCircle2,
  PauseCircle,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  createPlatformPlanAction,
  updatePlatformPlanAction,
  togglePlatformPlanStatusAction,
  deletePlatformPlanAction,
  setGlobalTrialDaysAction,
} from "@/lib/actions/platform-plan.actions";
import type { PlatformPlanDTO } from "@/lib/repositories/platform-plan.repository";

interface PlatformPlanWithCount extends PlatformPlanDTO {
  coachesCount?: number;
}

interface PlatformPlanManagerProps {
  plans: PlatformPlanWithCount[];
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function PlatformPlanManager({ plans }: PlatformPlanManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlanWithCount | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlatformPlanWithCount | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [trialDays, setTrialDays] = useState("0");
  const [maxStudents, setMaxStudents] = useState("10");
  const [maxPlans, setMaxPlans] = useState("1");
  const [maxGenericProfiles, setMaxGenericProfiles] = useState("3");
  const [isActive, setIsActive] = useState(true);

  // Global trial config state
  const defaultGlobal = plans.length > 0 && plans[0].trialDays !== undefined ? plans[0].trialDays.toString() : "7";
  const [globalTrialDays, setGlobalTrialDays] = useState(defaultGlobal);
  const [isApplyingGlobalTrial, setIsApplyingGlobalTrial] = useState(false);

  function openCreateDialog() {
    setEditingPlan(null);
    setName("");
    setDescription("");
    setPrice("");
    setDurationDays("30");
    setTrialDays(globalTrialDays || "0");
    setMaxStudents("15");
    setMaxPlans("2");
    setMaxGenericProfiles("3");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEditDialog(plan: PlatformPlanWithCount) {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description || "");
    setPrice(plan.price.toString());
    setDurationDays(plan.durationDays.toString());
    setTrialDays(plan.trialDays !== undefined ? plan.trialDays.toString() : "0");
    setMaxStudents(plan.maxStudents.toString());
    setMaxPlans(plan.maxPlans.toString());
    setMaxGenericProfiles(plan.maxGenericProfiles.toString());
    setIsActive(plan.isActive);
    setDialogOpen(true);
  }

  function handleApplyGlobalTrial() {
    const days = parseInt(globalTrialDays, 10);
    if (isNaN(days) || days < 0 || days > 365) {
      toast.error("Ingresá una cantidad de días válida entre 0 y 365.");
      return;
    }

    setIsApplyingGlobalTrial(true);
    startTransition(async () => {
      const res = await setGlobalTrialDaysAction({ trialDays: days });
      setIsApplyingGlobalTrial(false);
      if (res.success && res.data) {
        toast.success(
          `Período de prueba de ${days} días aplicado a todos los planes (${res.data.updatedCount} planes actualizados).`
        );
      } else {
        toast.error(res.error || "Error al actualizar los días de prueba.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast.error("El precio debe ser un número positivo");
      return;
    }

    const numericDuration = parseInt(durationDays, 10);
    if (isNaN(numericDuration) || numericDuration < 1) {
      toast.error("La vigencia debe ser de al menos 1 día");
      return;
    }

    const numericTrial = parseInt(trialDays, 10);
    if (isNaN(numericTrial) || numericTrial < 0) {
      toast.error("Los días de prueba no pueden ser negativos");
      return;
    }

    const numericStudents = parseInt(maxStudents, 10);
    if (isNaN(numericStudents) || numericStudents < 1) {
      toast.error("El cupo de alumnos debe ser de al menos 1");
      return;
    }

    const numericPlans = parseInt(maxPlans, 10);
    if (isNaN(numericPlans) || numericPlans < 1) {
      toast.error("El cupo de planes debe ser de al menos 1");
      return;
    }

    const numericGenerics = parseInt(maxGenericProfiles, 10);
    if (isNaN(numericGenerics) || numericGenerics < 0) {
      toast.error("El cupo de perfiles genéricos no puede ser negativo");
      return;
    }

    startTransition(async () => {
      if (editingPlan) {
        const res = await updatePlatformPlanAction({
          id: editingPlan.id,
          name,
          description: description || undefined,
          price: numericPrice,
          durationDays: numericDuration,
          trialDays: numericTrial,
          maxStudents: numericStudents,
          maxPlans: numericPlans,
          maxGenericProfiles: numericGenerics,
          isActive,
        });

        if (res.success) {
          toast.success("Plan de plataforma actualizado exitosamente");
          setDialogOpen(false);
        } else {
          toast.error(res.error || "Error al actualizar el plan");
        }
      } else {
        const res = await createPlatformPlanAction({
          name,
          description: description || undefined,
          price: numericPrice,
          durationDays: numericDuration,
          trialDays: numericTrial,
          maxStudents: numericStudents,
          maxPlans: numericPlans,
          maxGenericProfiles: numericGenerics,
          isActive,
        });

        if (res.success) {
          toast.success("Nuevo plan de plataforma creado exitosamente");
          setDialogOpen(false);
        } else {
          toast.error(res.error || "Error al crear el plan");
        }
      }
    });
  }

  function handleToggleStatus(plan: PlatformPlanWithCount) {
    startTransition(async () => {
      const res = await togglePlatformPlanStatusAction({
        id: plan.id,
        isActive: !plan.isActive,
      });

      if (res.success) {
        toast.success(
          plan.isActive
            ? `Plan "${plan.name}" pausado`
            : `Plan "${plan.name}" activado`
        );
      } else {
        toast.error(res.error || "Error al cambiar el estado del plan");
      }
    });
  }

  function handleDeletePlan() {
    if (!planToDelete) return;

    startTransition(async () => {
      const res = await deletePlatformPlanAction(planToDelete.id);
      if (res.success) {
        toast.success(`Plan "${planToDelete.name}" eliminado`);
        setPlanToDelete(null);
      } else {
        toast.error(res.error || "Error al eliminar el plan");
        setPlanToDelete(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Barra superior de acción */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Planes de Plataforma (SaaS)
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configurá las opciones comerciales, precios y cupos que ofrecés a
            los entrenadores de la plataforma.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 shrink-0">
          <Plus className="size-4" />
          Nuevo Plan SaaS
        </Button>
      </div>

      {/* Configuración global del período de prueba */}
      <Card className="border border-border/70 bg-gradient-to-r from-amber-500/5 via-primary/5 to-transparent shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Gift className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Período de Prueba de Plataforma (Trial)
                <Badge variant="secondary" className="text-[11px] font-normal">
                  Configuración Global
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configurá los días de prueba para nuevos profesores. Podés definirlo una única vez y aplicarlo a todos los planes activos con un clic.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:shrink-0">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded-md px-2.5 py-1">
              <Input
                type="number"
                min="0"
                max="365"
                value={globalTrialDays}
                onChange={(e) => setGlobalTrialDays(e.target.value)}
                className="w-16 h-7 text-center text-sm font-medium border-0 p-0 shadow-none focus-visible:ring-0"
                disabled={isApplyingGlobalTrial}
              />
              <span className="text-xs text-muted-foreground font-medium">días</span>
            </div>
            <Button
              size="sm"
              onClick={handleApplyGlobalTrial}
              disabled={isApplyingGlobalTrial}
              className="gap-1.5 text-xs h-9"
            >
              {isApplyingGlobalTrial ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Aplicar a todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grilla de Planes */}
      {plans.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            No hay planes de plataforma creados
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Creá tu primer plan para comenzar a ofrecer suscripciones a los
            profesores.
          </p>
          <Button onClick={openCreateDialog} className="mt-5 gap-2">
            <Plus className="size-4" />
            Crear Primer Plan
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col justify-between transition-all border ${
                plan.isActive
                  ? "border-border shadow-xs hover:border-primary/50"
                  : "border-border/50 bg-muted/20 opacity-80"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {plan.name}
                    </CardTitle>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-foreground tracking-tight">
                        {currencyFormatter.format(plan.price)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / {plan.durationDays} días
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={plan.isActive ? "default" : "secondary"}
                    className="text-[11px] font-medium"
                  >
                    {plan.isActive ? "Activo" : "Pausado"}
                  </Badge>
                </div>
                {plan.description && (
                  <CardDescription className="text-xs mt-2 line-clamp-2">
                    {plan.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Métricas de Cupos */}
                <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-2 border border-border/40">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary" />
                      Cupo Alumnos:
                    </span>
                    <strong className="text-foreground">
                      {plan.maxStudents}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Layers className="size-3.5 text-primary" />
                      Cupo Planes Entrenamiento:
                    </span>
                    <strong className="text-foreground">{plan.maxPlans}</strong>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <UserCog className="size-3.5 text-primary" />
                      Alumnos Genéricos:
                    </span>
                    <strong className="text-foreground">
                      {plan.maxGenericProfiles}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/30">
                    <span className="flex items-center gap-1.5">
                      <Gift className="size-3.5 text-amber-500" />
                      Prueba Gratuita:
                    </span>
                    {plan.trialDays > 0 ? (
                      <Badge variant="secondary" className="text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        {plan.trialDays} días
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin prueba</span>
                    )}
                  </div>
                </div>

                {/* Info de adopción */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Profesores con este plan:</span>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {plan.coachesCount ?? 0}
                  </Badge>
                </div>

                {/* Acciones */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(plan)}
                    disabled={isPending}
                    className="text-xs gap-1.5"
                  >
                    {plan.isActive ? (
                      <>
                        <PauseCircle className="size-3.5" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        Activar
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(plan)}
                      disabled={isPending}
                      className="text-xs gap-1"
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPlanToDelete(plan)}
                      disabled={isPending || (plan.coachesCount ?? 0) > 0}
                      title={
                        (plan.coachesCount ?? 0) > 0
                          ? "No se puede eliminar porque hay profesores usándolo"
                          : "Eliminar plan"
                      }
                      className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para Crear / Editar Plan */}
      <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <ResponsiveDialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {editingPlan ? "Editar Plan de Plataforma" : "Nuevo Plan de Plataforma"}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {editingPlan
                ? "Ajustá en tiempo real los valores económicos, vigencia y cupos para este plan."
                : "Definí un nuevo tier comercial para los entrenadores de tu plataforma."}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Nombre del Plan *</Label>
              <Input
                id="plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Plan Pro"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-desc">Descripción</Label>
              <Textarea
                id="plan-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descripción del alcance del plan"
                rows={2}
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plan-price">Precio ($ ARS) *</Label>
                <Input
                  id="plan-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="30000"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-duration">Vigencia (Días) *</Label>
                <Input
                  id="plan-duration"
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="30"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-trial" className="flex items-center gap-1">
                  <Gift className="size-3 text-amber-500" />
                  Prueba (Días)
                </Label>
                <Input
                  id="plan-trial"
                  type="number"
                  min="0"
                  max="365"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  placeholder="0"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Cupos SaaS */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Límites y Cupos del Entrenador
              </span>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="plan-students" className="text-xs">
                    Cupo Alumnos *
                  </Label>
                  <Input
                    id="plan-students"
                    type="number"
                    min="1"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    required
                    disabled={isPending}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="plan-maxplans" className="text-xs">
                    Planes Coach *
                  </Label>
                  <Input
                    id="plan-maxplans"
                    type="number"
                    min="1"
                    value={maxPlans}
                    onChange={(e) => setMaxPlans(e.target.value)}
                    required
                    disabled={isPending}
                    className="h-8 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="plan-generics" className="text-xs">
                    Genéricos *
                  </Label>
                  <Input
                    id="plan-generics"
                    type="number"
                    min="0"
                    value={maxGenericProfiles}
                    onChange={(e) => setMaxGenericProfiles(e.target.value)}
                    required
                    disabled={isPending}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            </div>

            <ResponsiveDialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {editingPlan ? "Guardar Cambios" : "Crear Plan"}
              </Button>
            </ResponsiveDialogFooter>
          </form>
        </ResponsiveDialogContent>
      </ResponsiveDialog>

      {/* Confirm Dialog para Eliminar */}
      {planToDelete && (
        <ConfirmDialog
          open={!!planToDelete}
          onOpenChange={(open) => !open && setPlanToDelete(null)}
          title="¿Eliminar plan de plataforma?"
          description={`¿Estás seguro de que querés eliminar el plan "${planToDelete.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar Plan"
          variant="destructive"
          isLoading={isPending}
          onConfirm={handleDeletePlan}
        />
      )}
    </div>
  );
}
