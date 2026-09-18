import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Smartphone,
  Palette,
  Users,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  Layers,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function PortalRootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0d] text-white selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/80 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={siteConfig.branding.logoNavbar}
              alt={siteConfig.name}
              width={160}
              height={70}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              render={<Link href="/login" />}
              className="gap-1.5"
            >
              Acceso Entrenadores
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[700px] rounded-full bg-primary/20 blur-[130px]" />

          <div className="relative mx-auto max-w-4xl text-center space-y-6">
            {/* SaaS Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Plataforma SaaS para Entrenadores y Coaches</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold uppercase tracking-tight text-white leading-tight">
              Tu software de entrenamiento con{" "}
              <span className="text-primary">marca propia</span> y portal de alumnos
            </h1>

            {/* Subheading */}
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed">
              Una solución integral para entrenadores personales y gimnasios.
              Gestioná tu cartera de clientes, planificá rutinas y ofrecé a tus
              alumnos un portal mobile-first sin contraseñas con tu propia identidad.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                render={<Link href="/login" />}
                className="w-full sm:w-auto gap-2 text-base px-8 h-12"
              >
                Ingresar al Panel de Gestión
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <section className="border-t border-white/10 bg-[#121212] px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-6xl space-y-12">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold uppercase tracking-tight text-white">
                Todo lo que necesitás para escalar tu servicio de coaching
              </h2>
              <p className="text-sm text-white/60">
                Diseñado para ahorrarte horas de trabajo administrativo y brindar
                a tus alumnos una experiencia de entrenamiento de primer nivel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-primary/15 p-3 text-primary w-fit">
                    <Palette className="size-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold uppercase text-white">
                    Marca Blanca & Enlace Propio
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Tu nombre comercial, tu logotipo, tu titular de bienvenida y
                    tu WhatsApp de contacto. Cada entrenador cuenta con su URL
                    única y exclusiva.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-primary/15 p-3 text-primary w-fit">
                    <Smartphone className="size-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold uppercase text-white">
                    Portal del Alumno por DNI
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Tus alumnos no necesitan recordar contraseñas ni registrarse.
                    Ingresan su DNI en tu portal y visualizan su rutina del día,
                    series, descansos y videos demostrativos.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-white/10 bg-white/5 text-white">
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-primary/15 p-3 text-primary w-fit">
                    <Users className="size-6" />
                  </div>
                  <h3 className="font-heading text-lg font-bold uppercase text-white">
                    Control de Cuotas & Membresías
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed">
                    Monitoreá el estado de pago de cada cliente, alertá cuotas por
                    vencer y pausá accesos automáticamente sin fricción.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Operational Highlights */}
        <section className="border-t border-white/10 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="mx-auto rounded-full bg-primary/10 p-3 text-primary w-fit mb-3">
                <Layers className="size-6" />
              </div>
              <h4 className="font-heading text-lg font-bold uppercase">
                Plantillas Reutilizables
              </h4>
              <p className="text-xs text-white/60">
                Armá rutinas modelo y asignalas a múltiples alumnos en un clic,
                personalizando cargas según sea necesario.
              </p>
            </div>

            <div className="space-y-2">
              <div className="mx-auto rounded-full bg-primary/10 p-3 text-primary w-fit mb-3">
                <TrendingUp className="size-6" />
              </div>
              <h4 className="font-heading text-lg font-bold uppercase">
                Registro de Progreso
              </h4>
              <p className="text-xs text-white/60">
                Tus alumnos cargan sus pesos y sensaciones en cada sesión,
                permitiéndote ajustar su progresión en tiempo real.
              </p>
            </div>

            <div className="space-y-2">
              <div className="mx-auto rounded-full bg-primary/10 p-3 text-primary w-fit mb-3">
                <ShieldCheck className="size-6" />
              </div>
              <h4 className="font-heading text-lg font-bold uppercase">
                Aislamiento Total de Datos
              </h4>
              <p className="text-xs text-white/60">
                Tus clientes, rutinas y datos financieros se mantienen 100%
                privados e independientes de otros entrenadores.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] px-4 py-8 text-center text-xs text-white/50 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            <span className="font-medium text-white/70">{siteConfig.name}</span>
            <span>— Plataforma Multi-Tenant para Entrenadores</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-white/70 hover:text-white transition-colors"
            >
              Acceso Entrenadores
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
