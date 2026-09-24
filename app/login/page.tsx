import Image from "next/image";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteConfig } from "@/lib/config/site";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/login/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

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
    <div className="dark min-h-screen flex flex-col justify-center items-center px-4 bg-[#0d0d0d] text-white selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Subtle ambient brand glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[650px] rounded-full bg-primary/15 blur-[130px]" />

      <div className="relative w-full max-w-md">
        <Card className="border border-white/10 bg-[#141414] shadow-2xl backdrop-blur-md rounded-2xl">
          <CardHeader className="flex flex-col items-center text-center pb-4 pt-6 sm:pt-8">
            <div className="relative h-16 w-48 flex items-center justify-center mb-3">
              <Image
                src={siteConfig.branding.logoHome}
                alt={`${siteConfig.name} Logo`}
                width={320}
                height={160}
                className="max-h-16 w-auto object-contain"
                priority
              />
            </div>
            <CardTitle className="font-heading text-2xl font-bold uppercase tracking-tight text-white">
              Acceso a la Plataforma
            </CardTitle>
            <CardDescription className="text-white/60 text-sm mt-1">
              Iniciá sesión como Administrador o Entrenador
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-2">
            <LoginForm action={login} error={error} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
