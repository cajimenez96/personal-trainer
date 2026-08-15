import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div>
      <h1 className="text-2xl font-semibold">Hola, {session?.user?.name}</h1>
      <p className="text-muted-foreground">Panel de administración.</p>
    </div>
  )
}
