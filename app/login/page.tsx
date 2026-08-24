import Image from "next/image";
import logoHome from "@/app/assets/home.png";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;

  async function login(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: callbackUrl || "/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        const params = new URLSearchParams({ error: "CredentialsSignin" });
        if (callbackUrl) params.set("callbackUrl", callbackUrl);
        redirect(`/login?${params.toString()}`);
      }
      throw err;
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row items-center justify-center gap-24 bg-background p-4">
      <Image
        src={logoHome}
        alt="Santiago Ramón Logo"
        className="w-2xs md:w-auto object-contain"
        priority
      />
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center text-center">
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Panel de administración del trainer</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
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
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                Email o contraseña incorrectos.
              </p>
            )}
            <Button type="submit" size="lg" className="w-full">
              Ingresar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
