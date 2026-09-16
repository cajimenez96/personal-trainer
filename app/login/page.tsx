import Image from "next/image";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const safeCallbackUrl =
    callbackUrl && !callbackUrl.startsWith("/_next")
      ? callbackUrl
      : "/dashboard";

  async function login(formData: FormData) {
    "use server";

    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: safeCallbackUrl,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        const params = new URLSearchParams({ error: "CredentialsSignin" });
        if (safeCallbackUrl && safeCallbackUrl !== "/dashboard") {
          params.set("callbackUrl", safeCallbackUrl);
        }
        redirect(`/login?${params.toString()}`);
      }
      throw err;
    }
  }

  return (
    <div className="h-screen flex justify-center items-center px-2">
      <div>
        <Card className="w-xs md:w-md">
          <CardHeader className="flex flex-col items-center text-center">
            <Image
              src={siteConfig.branding.logoHome}
              alt={`${siteConfig.name} Logo`}
              width={520}
              height={480}
              className=""
              priority
            />
            <CardTitle>Bienvenido!</CardTitle>
            <CardDescription>
              Panel de administración del trainer
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
    </div>
  );
}
