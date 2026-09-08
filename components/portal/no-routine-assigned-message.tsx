import Link from "next/link"

export function NoRoutineAssignedMessage({
  greetingName,
  backHref,
  backLabel,
}: {
  greetingName: string
  backHref: string
  backLabel: string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-lg font-semibold">Hola, {greetingName}</p>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Todavía no tenés una rutina activa. Consultá con tu entrenador para que te
        asigne una.
      </p>
      <Link href={backHref} className="mt-6 text-sm text-primary hover:underline">
        {backLabel}
      </Link>
    </div>
  )
}
