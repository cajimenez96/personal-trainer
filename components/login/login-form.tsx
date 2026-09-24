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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-white/70">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          required
          disabled={isPending}
          className="h-11 rounded-xl bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus-visible:border-primary focus-visible:ring-primary/20"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-white/70">
          Contraseña
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="h-11 rounded-xl bg-white/[0.06] border-white/15 text-white placeholder:text-white/30 focus-visible:border-primary focus-visible:ring-primary/20"
        />
      </div>
      {error === "InactiveAccount" ? (
        <p role="alert" className="text-sm font-medium text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-center">
          Tu cuenta se encuentra suspendida o inactiva. Contactá al
          administrador de la plataforma.
        </p>
      ) : error ? (
        <p role="alert" className="text-sm font-medium text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-center">
          Email o contraseña incorrectos.
        </p>
      ) : null}
      <Button
        type="submit"
        size="lg"
        loading={isPending}
        className="w-full h-11 rounded-xl uppercase tracking-wider font-heading font-semibold text-sm shadow-lg shadow-primary/20"
      >
        Ingresar
      </Button>
    </form>
  );
}
