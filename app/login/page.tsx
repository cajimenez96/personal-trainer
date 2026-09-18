import Image from "next/image";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();

  // Si ya tiene sesión activa, redirigir según su rol
  if (session?.user) {
    if (session.user.role === "SUPERADMIN") {
      redirect("/superadmin");
    } else {
      redirect("/dashboard");
    }
  }

  const { error, callbackUrl } = await searchParams;

  async function login(formData: FormData) {
    "use server";

    const email = String(formData.get("email") || "")
      .toLowerCase()
      .trim();

    // Determinar destino según el rol del usuario si no hay un callbackUrl explícito
    let targetUrl = "/dashboard";
    if (callbackUrl && !callbackUrl.startsWith("/_next") && callbackUrl !== "/dashboard") {
      targetUrl = callbackUrl;
    } else {
      const trainer = await db.trainer.findUnique({
        where: { email },
        select: { role: true },
      });
      if (trainer?.role === "SUPERADMIN") {
        targetUrl = "/superadmin";
      }
    }

    try {
      await signIn("credentials", {
        email,
        password: formData.get("password"),
        redirectTo: targetUrl,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        const params = new URLSearchParams({ error: "CredentialsSignin" });
        if (callbackUrl && callbackUrl !== "/dashboard") {
          params.set("callbackUrl", callbackUrl);
        }
        redirect(`/login?${params.toString()}`);
      }
      throw err;
    }
  }

  return (
    <div className="h-screen flex justify-center items-center px-2 bg-background">
      <div>
        <Card className="w-xs md:w-md border-border">
          <CardHeader className="flex flex-col items-center text-center">
            <Image
              src={siteConfig.branding.logoHome}
              alt={`${siteConfig.name} Logo`}
              width={320}
              height={160}
              className="max-h-24 w-auto object-contain mb-2"
              priority
            />
            <CardTitle className="text-xl">Acceso a la Plataforma</CardTitle>
            <CardDescription>
              Iniciá sesión como Administrador o Entrenador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={login} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error === "InactiveAccount" ? (
                <p
                  role="alert"
                  className="text-sm text-destructive text-center"
                >
                  Tu cuenta se encuentra suspendida o inactiva. Contactá al
                  administrador de la plataforma.
                </p>
              ) : error ? (
                <p
                  role="alert"
                  className="text-sm text-destructive text-center"
                >
                  Email o contraseña incorrectos.
                </p>
              ) : null}
              <Button type="submit" size="lg" className="w-full">
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
