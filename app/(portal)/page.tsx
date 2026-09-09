import Image from "next/image";
import logoHome from "@/app/assets/home.png";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { studentService } from "@/lib/services/student.service";
import { genericProfileService } from "@/lib/services/generic-profile.service";
import { dniSchema } from "@/lib/validators/portal";

const ERROR_MESSAGES: Record<string, string> = {
  "not-found":
    "No encontramos un alumno activo con ese DNI, ni una clave válida. Consultá con tu entrenador.",
};

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function lookup(formData: FormData) {
    "use server";

    const value = String(formData.get("dni") ?? "").trim();

    const dniParsed = dniSchema.safeParse(value);
    if (dniParsed.success) {
      const student = await studentService.getByDni(dniParsed.data);
      if (student?.isActive) {
        redirect(`/rutina/${dniParsed.data}`);
      }
    } else {
      const matchedLevel = await genericProfileService.verifyPassword(value);
      if (matchedLevel) {
        redirect(`/rutina/generico/${matchedLevel}`);
      }
    }

    redirect("/?error=not-found");
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
            Ingresá tu DNI o tu clave para ver tu rutina de entrenamiento.
          </p>

          <form action={lookup} className="w-full flex flex-col gap-3">
            <Input
              name="dni"
              type="text"
              autoComplete="off"
              placeholder="Tu DNI o tu clave"
              aria-label="DNI o clave"
              aria-invalid={!!error}
              required
              className="h-12 rounded-xl px-5 text-center text-lg font-semibold tracking-widest"
            />

            {error && (
              <p role="alert" className="text-center text-sm text-destructive">
                {ERROR_MESSAGES[error] ?? ERROR_MESSAGES["not-found"]}
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
