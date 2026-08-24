import Image from "next/image";
import logoHome from "@/app/assets/home.png";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { studentService } from "@/lib/services/student.service";
import { dniSchema } from "@/lib/validators/portal";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Ingresá un DNI válido (solo números).",
  "not-found":
    "No encontramos un alumno activo con ese DNI. Consultá con tu entrenador.",
};

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function lookup(formData: FormData) {
    "use server";

    const parsed = dniSchema.safeParse(formData.get("dni"));
    if (!parsed.success) {
      redirect("/?error=invalid");
    }

    const student = await studentService.getByDni(parsed.data);
    if (!student || !student.isActive) {
      redirect("/?error=not-found");
    }

    redirect(`/rutina/${parsed.data}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-16">
        <Image
          src={logoHome}
          alt="Santiago Ramón Logo"
          className="w-2xs object-contain"
          priority
        />
        <div>
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight">
            Tu rutina de hoy
          </h1>
          <p className="mb-8 text-center text-muted-foreground">
            Ingresá tu DNI para ver tu rutina de entrenamiento.
          </p>

          <form action={lookup} className="w-full flex flex-col gap-3">
            <Input
              name="dni"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Tu DNI"
              aria-label="DNI"
              aria-invalid={!!error}
              required
              className="h-12 rounded-xl px-5 text-center text-lg font-semibold tracking-widest"
            />

            {error && (
              <p role="alert" className="text-center text-sm text-destructive">
                {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full rounded-xl">
              Ver mi rutina
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
