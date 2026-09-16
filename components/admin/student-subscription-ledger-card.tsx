"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { assignPlanAction } from "@/lib/actions/subscription.actions"
import { registerPaymentAction, deletePaymentAction } from "@/lib/actions/payment.actions"
import type {
  AccountStatement,
  PlanDTO,
  StudentSubscriptionWithPlan,
} from "@/lib/repositories/interfaces"

interface Props {
  studentId: string
  studentName: string
  availablePlans: PlanDTO[]
  currentSubscription: StudentSubscriptionWithPlan | null
  statement: AccountStatement
}

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function StudentSubscriptionLedgerCard({
  studentId,
  studentName,
  availablePlans,
  currentSubscription,
  statement,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null)

  // Assign plan state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    availablePlans[0]?.id || "",
  )
  const [startDate, setStartDate] = useState<string>(toInputDate(new Date()))

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>(
    statement.balance > 0 ? statement.balance.toString() : "",
  )
  const [paymentDate, setPaymentDate] = useState<string>(toInputDate(new Date()))
  const [paymentNotes, setPaymentNotes] = useState<string>("")

  const isExpired =
    currentSubscription &&
    new Date(currentSubscription.expiresAt).getTime() < new Date().setHours(0, 0, 0, 0)

  function handleAssignPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlanId) {
      toast.error("Por favor seleccioná un plan")
      return
    }

    startTransition(async () => {
      const res = await assignPlanAction({
        studentId,
        planId: selectedPlanId,
        startDate: new Date(startDate + "T12:00:00Z"),
      })

      if (!res.ok) {
        toast.error(res.error || "Error al asignar plan")
      } else {
        toast.success("Plan asignado correctamente")
        setAssignDialogOpen(false)
      }
    })
  }

  function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("El monto debe ser mayor a 0")
      return
    }

    startTransition(async () => {
      const res = await registerPaymentAction({
        studentId,
        amount,
        paidAt: new Date(paymentDate + "T12:00:00Z"),
        notes: paymentNotes.trim() || undefined,
        subscriptionId: currentSubscription?.id || undefined,
      })

      if (!res.ok) {
        toast.error(res.error || "Error al registrar el pago")
      } else {
        toast.success("Pago registrado con éxito")
        setPaymentDialogOpen(false)
        setPaymentAmount("")
        setPaymentNotes("")
      }
    })
  }

  function handleDeletePayment(paymentId: string) {
    setPaymentToDeleteId(paymentId)
  }

  function handleConfirmDeletePayment() {
    if (!paymentToDeleteId) return
    const id = paymentToDeleteId

    startTransition(async () => {
      const res = await deletePaymentAction(id, studentId)
      if (!res.ok) {
        toast.error(res.error || "No se pudo eliminar el pago")
      } else {
        toast.success("Pago eliminado")
        setPaymentToDeleteId(null)
      }
    })
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Plan & Cuenta Corriente
            </CardTitle>
            <CardDescription>
              Membresía, estado de vencimiento y pagos de {studentName}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate(toInputDate(new Date()))
                setAssignDialogOpen(true)
              }}
              disabled={isPending || availablePlans.length === 0}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {currentSubscription ? "Renovar / Cambiar Plan" : "Asignar Plan"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setPaymentAmount(statement.balance > 0 ? statement.balance.toString() : "")
                setPaymentDate(toInputDate(new Date()))
                setPaymentDialogOpen(true)
              }}
              disabled={isPending}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Registrar Pago
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subscription & Balance Overview Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Current Plan Card */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Plan Actual
              </span>
              {currentSubscription ? (
                <Badge variant={isExpired ? "destructive" : "default"}>
                  {isExpired ? "Vencido" : "Al día"}
                </Badge>
              ) : (
                <Badge variant="secondary">Sin Plan</Badge>
              )}
            </div>

            {currentSubscription ? (
              <div className="mt-3 space-y-1">
                <p className="text-lg font-bold text-foreground">
                  {currentSubscription.plan.name}
                </p>
                <p className="text-sm font-medium text-primary">
                  {currencyFormatter.format(Number(currentSubscription.priceSnapshot))} ·{" "}
                  {currentSubscription.plan.durationDays} días
                </p>
                <div className="pt-2 text-xs text-muted-foreground">
                  <span>
                    Desde:{" "}
                    {new Intl.DateTimeFormat("es-AR").format(
                      new Date(currentSubscription.startDate),
                    )}
                  </span>
                  <span className="mx-1.5">·</span>
                  <span className={isExpired ? "font-semibold text-destructive" : ""}>
                    Vence:{" "}
                    {new Intl.DateTimeFormat("es-AR").format(
                      new Date(currentSubscription.expiresAt),
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                El alumno no tiene un plan activo asignado.
              </p>
            )}
          </div>

          {/* Balance / Account State Card */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Saldo Cuenta Corriente
              </span>
              <Badge
                variant={
                  statement.balance > 0
                    ? "destructive"
                    : statement.balance < 0
                      ? "secondary"
                      : "default"
                }
              >
                {statement.balance > 0
                  ? "Deuda Pendiente"
                  : statement.balance < 0
                    ? "Saldo a Favor"
                    : "Al Día"}
              </Badge>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-black">
                <span
                  className={
                    statement.balance > 0
                      ? "text-destructive"
                      : statement.balance < 0
                        ? "text-blue-500"
                        : "text-emerald-500"
                  }
                >
                  {currencyFormatter.format(statement.balance)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                <span>Total Facturado: {currencyFormatter.format(statement.totalCharges)}</span>
                <span>Total Abonado: {currencyFormatter.format(statement.totalPaid)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions / Ledger Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Historial de Movimientos
          </h4>

          {statement.transactions.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No hay movimientos de cuenta registrados todavía.
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Concepto</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {statement.transactions.map((t) => {
                    const isPayment = t.type === "PAYMENT"
                    return (
                      <tr key={t.id} className="hover:bg-muted/30">
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("es-AR").format(new Date(t.date))}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {isPayment ? (
                              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            <span className="font-medium text-foreground">
                              {t.description}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">
                          <span className={isPayment ? "text-emerald-500" : "text-foreground"}>
                            {isPayment ? "-" : "+"}
                            {currencyFormatter.format(t.amount)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {isPayment && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePayment(t.referenceId || t.id)}
                              disabled={isPending}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>

      {/* Dialog: Assign / Renew Plan */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Asignar Plan a {studentName}</DialogTitle>
            <DialogDescription>
              Seleccioná el plan y la fecha de inicio. La fecha de vencimiento se calculará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignPlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-select">Plan *</Label>
              <Select value={selectedPlanId} onValueChange={(val) => setSelectedPlanId(val ?? "")}>
                <SelectTrigger id="plan-select" className="w-full">
                  <SelectValue placeholder="Seleccioná un plan">
                    {(val) => {
                      const plan = availablePlans.find((p) => p.id === val)
                      return plan
                        ? `${plan.name} — ${currencyFormatter.format(Number(plan.price))} (${plan.durationDays} días)`
                        : undefined
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {currencyFormatter.format(Number(p.price))} ({p.durationDays} días)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha de Inicio *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !selectedPlanId}>
                {isPending ? "Guardando..." : "Confirmar Asignación"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Register Payment */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Registrá un pago parcial o total para abonar a la cuenta de {studentName}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegisterPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Monto a Abonar ($) *</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pay-amount"
                  type="number"
                  step="any"
                  placeholder="15000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-date">Fecha de Pago *</Label>
              <Input
                id="pay-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-notes">Nota / Referencia (opcional)</Label>
              <Input
                id="pay-notes"
                placeholder="ej. Transferencia MP, Efectivo, Seña 50%"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                maxLength={100}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Registrando..." : "Registrar Pago"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Payment Deletion */}
      <ConfirmDialog
        open={!!paymentToDeleteId}
        onOpenChange={(open) => !open && setPaymentToDeleteId(null)}
        title="¿Eliminar registro de pago?"
        description="¿Estás seguro de que querés eliminar este pago? El saldo de la cuenta corriente del alumno se actualizará automáticamente."
        confirmText="Eliminar Pago"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isPending}
        onConfirm={handleConfirmDeletePayment}
      />
    </Card>
  )
}
