"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  DollarSign,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
} from "@/lib/actions/plan.actions";
import type { PlanDTO } from "@/lib/repositories/interfaces";

interface PlanManagerProps {
  plans: PlanDTO[];
  maxPlans?: number;
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function PlanManager({ plans, maxPlans = 1 }: PlanManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanDTO | null>(null);
  const [planToDelete, setPlanToDelete] = useState<PlanDTO | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [isActive, setIsActive] = useState(true);

  const activePlans = plans.filter((p) => p.isActive);
  const isLimitReached = activePlans.length >= maxPlans;

  function openCreateDialog() {
    setEditingPlan(null);
    setName("");
    setDescription("");
    setPrice("");
    setDurationDays("30");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEditDialog(plan: PlanDTO) {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description || "");
    setPrice(plan.price.toString());
    setDurationDays(plan.durationDays.toString());
    setIsActive(plan.isActive);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error("El precio debe ser un número mayor a 0");
      return;
    }

    const parsedDays = parseInt(durationDays, 10);
    if (isNaN(parsedDays) || parsedDays <= 0) {
      toast.error("La duración debe ser al menos 1 día");
      return;
    }

    startTransition(async () => {
      if (editingPlan) {
        const res = await updatePlanAction(editingPlan.id, {
          name,
          description: description.trim() || undefined,
          price: parsedPrice,
          durationDays: parsedDays,
          isActive,
        });
        if (!res.ok) {
          toast.error(res.error || "Error al actualizar plan");
        } else {
          toast.success("Plan actualizado con éxito");
          setDialogOpen(false);
        }
      } else {
        const res = await createPlanAction({
          name,
          description: description.trim() || undefined,
          price: parsedPrice,
          durationDays: parsedDays,
        });
        if (!res.ok) {
          toast.error(res.error || "Error al crear plan");
        } else {
          toast.success("Plan creado con éxito");
          setDialogOpen(false);
        }
      }
    });
  }

  function handleDelete(plan: PlanDTO) {
    setPlanToDelete(plan);
  }

  function handleConfirmDelete() {
    if (!planToDelete) return;
    const id = planToDelete.id;

    startTransition(async () => {
      const res = await deletePlanAction(id);
      if (!res.ok) {
        toast.error(res.error || "No se pudo eliminar el plan");
      } else {
        toast.success("Plan eliminado");
        setPlanToDelete(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
            Planes de Suscripción
          </h1>
          <p className="text-sm text-muted-foreground">
            Configurá los planes y tarifas disponibles para tus alumnos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={isLimitReached ? "secondary" : "default"}
            className="px-3 py-1 text-sm font-semibold"
          >
            {activePlans.length} / {maxPlans} {maxPlans === 1 ? "Plan Activo" : "Planes Activos"}
          </Badge>
          <Button
            onClick={openCreateDialog}
            disabled={isLimitReached || isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Plan
          </Button>
        </div>
      </div>

      {isLimitReached && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Alcanzaste el límite de {maxPlans} {maxPlans === 1 ? "plan activo" : "planes activos"}. Podés editar uno existente
            o solicitar al administrador una ampliación de cupo.
          </span>
        </div>
      )}

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No hay planes creados</h3>
            <p className="text-sm text-muted-foreground">
              Comenzá creando tu primer plan (ej: Mensual Básico, Trimestral o
              Pase Libre).
            </p>
            <Button onClick={openCreateDialog} className="mt-2">
              Crear primer plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all ${
                plan.isActive ? "border-primary/30" : "opacity-60 bg-muted/30"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {plan.description || "Sin descripción"}
                    </CardDescription>
                  </div>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-primary">
                    {currencyFormatter.format(Number(plan.price))}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {plan.durationDays} días
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(plan)}
                    disabled={isPending}
                    className="gap-1 text-xs"
                  >
                    <Edit2 className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan)}
                    disabled={isPending}
                    className="gap-1 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plan Dialog (Create / Edit) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plan" : "Crear Nuevo Plan"}
            </DialogTitle>
            <DialogDescription>
              Definí el nombre, tarifa y duración de este plan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nombre del Plan *</Label>
              <Input
                id="plan-name"
                placeholder="ej. Pase Libre, 3 Días x Semana"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={60}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="plan-price">Precio ($) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="plan-price"
                    type="number"
                    step="any"
                    placeholder="35000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-duration">Duración (días) *</Label>
                <Input
                  id="plan-duration"
                  type="number"
                  placeholder="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-desc">Descripción (opcional)</Label>
              <Textarea
                id="plan-desc"
                placeholder="Detalle o condiciones del plan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={200}
              />
            </div>

            {editingPlan && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="plan-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="plan-active" className="cursor-pointer text-sm">
                  Plan activo (disponible para asignar a alumnos)
                </Label>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Guardando..."
                  : editingPlan
                    ? "Guardar Cambios"
                    : "Crear Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
        title="¿Eliminar plan de suscripción?"
        description={
          planToDelete ? (
            <span className="flex w-full flex-col items-center text-center">
              ¿Estás seguro de que querés eliminar el plan
              <strong>{planToDelete.name}?</strong>
            </span>
          ) : (
            ""
          )
        }
        confirmText="Eliminar Plan"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
