"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  action: (formData: FormData) => Promise<void>;
  error?: string;
}

export function LoginForm({ action, error }: LoginFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          required
          disabled={isPending}
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
          disabled={isPending}
        />
      </div>
      {error === "InactiveAccount" ? (
        <p role="alert" className="text-sm text-destructive text-center">
          Tu cuenta se encuentra suspendida o inactiva. Contactá al
          administrador de la plataforma.
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive text-center">
          Email o contraseña incorrectos.
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full gap-2" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Ingresando...</span>
          </>
        ) : (
          "Ingresar"
        )}
      </Button>
    </form>
  );
}
