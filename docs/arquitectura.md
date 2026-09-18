# Arquitectura — Personal Trainer Platform

**Versión:** 2.0  
**Fecha:** Septiembre 2026  
**Estado:** Evolución Multi-tenant Aprobada

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend + API | **Next.js** (App Router) | **16.3.1** ✅ | Un solo repo, un solo deploy. Server Components para lectura, Client Components para interactividad. Soporte de dynamic routes `/[coachSlug]`. |
| Base de datos | **PostgreSQL** (Neon) | latest | Modelo relacional multi-tenant con esquema compartido e índices compuestos para aislamiento eficiente por tenant. |
| ORM | **Prisma** | **7.9.1** ✅ | Type-safety en queries, migraciones controladas, schema como fuente de verdad. Driver adapter `@prisma/adapter-pg`. |
| Autenticación | **Auth.js v5** (NextAuth) | 5.0.0-beta.32 ⚠️ | Sesión JWT extendida con `trainerId`, `role` (`SUPERADMIN` / `COACH`) y `slug`. Guards de ruta por rol. Alumnos acceden vía slug y DNI sin sesión formal. |
| Validación | **Zod** | 4.x | Validación de inputs, Server Actions y blacklist de slugs reservados. |
| Estilos | **Tailwind CSS v4** | 4.x | CSS nativo con variables en `globals.css`. |
| Componentes UI | **shadcn/ui** | latest | Componentes accesibles sobre Radix UI con diálogos custom (`ConfirmDialog`). |
| Hosting | **Vercel** | — | Despliegue único para todos los tenants sin requerir gestión de DNS wildcard. |

---

## 2. Estrategia de Multi-tenancy (Slug-in-Path)

Se adopta la estrategia **Shared Database, Shared Schema con columna discriminadora (`trainer_id`)** y ruteo **Slug-in-Path**:

1. **Aislamiento de Infraestructura Cero Costo:** No requiere configuración de dominios wildcard ni servidores adicionales; corre en un único build/deploy de Next.js.
2. **Identificación por URL:**
   - Portal del Alumno: `tuapp.com/[coachSlug]` (ej. `tuapp.com/santiago-ramon`).
   - Rutina del Alumno: `tuapp.com/[coachSlug]/rutina/[dni]`.
   - Panel del Coach: `tuapp.com/dashboard`, `tuapp.com/alumnos`, etc. (identificado transparentemente por la sesión JWT de Auth.js).
   - Panel del SuperAdmin: `tuapp.com/superadmin` (protegido por rol `SUPERADMIN`).
   - Login unificado: `tuapp.com/login`.

### Estructura de Carpetas en App Router

```
/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx               # Login unificado para Coach y SuperAdmin
│   │
│   ├── (admin)/                         # Panel privado del Coach autenticado
│   │   ├── dashboard/page.tsx           # KPIs financieros y deportivos del coach
│   │   ├── alumnos/page.tsx             # Gestión de alumnos del coach (filtro por planes)
│   │   ├── planes/page.tsx              # Gestión de planes de suscripción
│   │   ├── ejercicios/page.tsx          # Biblioteca de ejercicios
│   │   ├── plantillas/page.tsx          # Plantillas de rutinas del coach
│   │   ├── configuracion/page.tsx       # Marca blanca: logo, portada, WhatsApp, Instagram
│   │   └── layout.tsx                   # Guard de autenticación de Coach
│   │
│   ├── (superadmin)/                    # Panel exclusivo del dueño de la plataforma
│   │   ├── superadmin/
│   │   │   ├── coaches/page.tsx         # Altas, bajas, suspensión y edición de slugs
│   │   │   └── metrics/page.tsx         # Métricas de negocio del SaaS
│   │   └── layout.tsx                   # Guard de rol SUPERADMIN
│   │
│   ├── [coachSlug]/                     # Portal público del alumno por entrenador
│   │   ├── layout.tsx                   # Inyección dinámica de metadatos, SEO y branding
│   │   ├── page.tsx                     # Ingreso por DNI del alumno para este coach
│   │   └── rutina/
│   │       ├── [dni]/page.tsx           # Rutina activa y registro de progreso
│   │       └── generico/[level]/page.tsx
│   │
│   └── api/                             # Route Handlers serverless
├── components/
│   ├── ui/                              # shadcn/ui + ConfirmDialog
│   ├── admin/                           # Componentes del panel del coach
│   ├── superadmin/                      # Componentes de administración SaaS
│   ├── portal/                          # Componentes del portal del alumno
│   └── shared/                          # Componentes comunes (VideoDialog, etc.)
├── lib/
│   ├── auth.ts                          # Configuración Auth.js con JWT + Trainer Claims
│   ├── db.ts                            # Cliente Prisma singleton
│   ├── services/                        # Servicios de negocio (exigen trainerId)
│   ├── repositories/                    # Repositorios Prisma (aislados por trainerId)
│   ├── validators/                      # Schemas Zod y blacklist de slugs
│   └── config/                          # Configuración base del sistema
├── prisma/
│   ├── schema.prisma                    # Esquema multi-tenant
│   └── migrations/                      # Historial de migraciones SQL
```

---

## 3. Modelo de Base de Datos Multi-tenant

### Decisiones de Diseño
- **Discriminador `trainer_id` obligatorio:** Toda entidad operativa (`Student`, `Plan`, `StudentSubscription`, `Payment`, `RoutineTemplate`, `GenericProfile`) pertenece a un `Trainer`.
- **Unicidad Compuesta de DNI:** `@@unique([trainerId, dni])` permite que distintos profesores tengan alumnos con el mismo DNI sin conflicto.
- **Unicidad Compuesta de Planes:** `@@unique([trainerId, name])` aísla los nombres de planes por profesor.
- **Marca Blanca en la Base de Datos:** Los campos de identidad visual y contacto residen directamente en la tabla `trainers`, eliminando la dependencia de un JSON estático para soportar múltiples clientes.

### Diagrama de Tablas Multi-tenant

```
trainers (Tenants + Admins)
────────────────────────────────────────────────────────────
id                UUID          PK
email             TEXT          UNIQUE NOT NULL
password_hash     TEXT          NOT NULL
name              TEXT          NOT NULL
role              ENUM          (SUPERADMIN, COACH) DEFAULT 'COACH'
slug              TEXT          UNIQUE NOT NULL   ← ej: "santiago-ramon"
business_name     TEXT
headline          TEXT
tagline           TEXT
logo_url          TEXT
hero_image_url    TEXT
whatsapp_number   TEXT
instagram_url     TEXT
is_active         BOOLEAN       DEFAULT true      ← suspensión SaaS
created_at        TIMESTAMP     DEFAULT now()
updated_at        TIMESTAMP


students (Aislado por Trainer)
────────────────────────────────────────────────────────────
id                    UUID          PK
trainer_id            UUID          FK → trainers(id) ON DELETE CASCADE
dni                   TEXT          NOT NULL
first_name            TEXT          NOT NULL
last_name             TEXT          NOT NULL
email                 TEXT
phone                 TEXT
objetivo_id           UUID          FK → objetivos(id)
secondary_goals       TEXT
nivel                 ENUM          (principiante, intermedio, avanzado)
modalidad_id          UUID          FK → modalidades(id)
membership_starts_at  DATE
payment_expires_at    DATE
access_override       ENUM          (auto, allowed, blocked) DEFAULT 'auto'
health_notes          TEXT
is_active             BOOLEAN       DEFAULT true
created_at            TIMESTAMP     DEFAULT now()
updated_at            TIMESTAMP

  UNIQUE: (trainer_id, dni)
  INDEX:  (trainer_id, dni)


plans (Aislado por Trainer)
────────────────────────────────────────────────────────────
id              UUID          PK
trainer_id      UUID          FK → trainers(id) ON DELETE CASCADE
name            TEXT          NOT NULL
description     TEXT
price           DECIMAL(10,2) NOT NULL
duration_days   INT           DEFAULT 30
is_active       BOOLEAN       DEFAULT true
created_at      TIMESTAMP     DEFAULT now()
updated_at      TIMESTAMP

  UNIQUE: (trainer_id, name)


student_subscriptions & payments
────────────────────────────────────────────────────────────
(Heredan la pertenencia del alumno y registran el historial de cuotas)


routine_templates (Aislado por Trainer)
────────────────────────────────────────────────────────────
id              UUID          PK
trainer_id      UUID          FK → trainers(id) ON DELETE CASCADE
name            TEXT          NOT NULL
description     TEXT
duration_weeks  INT           DEFAULT 4
created_at      TIMESTAMP     DEFAULT now()
updated_at      TIMESTAMP
```

---

## 4. Capas de la Aplicación y Aislamiento de Datos

El sistema sigue una estricta política de **Aislamiento por Capa**:

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                  │
│   - Next.js Server Components & Route Guards            │
│   - Obtiene session.trainerId / params.coachSlug        │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                      Service Layer                      │
│   - Valida pertenencia del recurso al trainerId         │
│   - Aplica reglas de negocio y transacciones            │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                    Repository Layer                     │
│   - Cláusulas WHERE obligatorias con { trainerId }      │
│   - Evita consultas globales o filtrados en memoria     │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                   Infrastructure Layer                  │
│   - Prisma Client + PostgreSQL (Neon)                   │
└─────────────────────────────────────────────────────────┘
```

### Seguridad y Blacklist de Slugs Reservados

Para evitar conflictos entre las rutas del sistema y los portales de los entrenadores, Zod valida la asignación de slugs contra una lista negra estricta:

```typescript
export const RESERVED_SLUGS = [
  "admin",
  "superadmin",
  "login",
  "api",
  "dashboard",
  "alumnos",
  "planes",
  "ejercicios",
  "plantillas",
  "configuracion",
  "rutina",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
] as const;
```
│  Next.js Pages + React Components   │
└─────────────────┬───────────────────┘
                  │ HTTP
┌─────────────────▼───────────────────┐
│           API Layer                 │
│  Route Handlers — solo orquestan:   │
│  1. Parsear y validar input (Zod)   │
│  2. Llamar al servicio              │
│  3. Formatear la respuesta HTTP     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Service Layer               │
│  Lógica de negocio pura:            │
│  - Aplicar reglas RN-01 a RN-04     │
│  - Orquestación entre entidades     │
│  - Sin conocimiento de HTTP ni DB   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Repository Layer             │
│  Acceso a datos:                    │
│  - Abstracciones sobre Prisma       │
│  - Queries y mutations              │
│  - Sin lógica de negocio            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        Infrastructure               │
│  Prisma Client (singleton)          │
│  PostgreSQL — Neon                  │
└─────────────────────────────────────┘
```

### Ejemplo de flujo: alumno ingresa su DNI

```
GET /api/rutina?dni=12345678
  → Route Handler: valida formato DNI con Zod
  → RutinaService.getActivaByDni("12345678")
    → StudentRepository.findByDni("12345678")         → verifica que exista y esté activo
    → AssignedRoutineRepository.findActiveByStudentId() → obtiene rutina activa
    → [aplica overrides individuales sobre la plantilla base]
    → [construye el DTO de rutina con días y ejercicios]
  ← 200 { student, rutina: { dias: [...], ejercicios: [...] } }
```

---

## 5. Principios SOLID Aplicados al Proyecto

### S — Single Responsibility (Responsabilidad Única)

Cada módulo tiene **una sola razón para cambiar**.

```typescript
// ✅ Correcto — cada módulo hace una sola cosa
// lib/services/rutina.service.ts   → lógica de negocio de rutinas
// lib/repositories/rutina.repo.ts  → queries de rutinas a la DB
// app/api/rutinas/route.ts         → parsear HTTP y delegar al servicio

// ❌ Incorrecto
// app/api/rutinas/route.ts haciendo queries a Prisma directamente
// (mezcla responsabilidades: HTTP + negocio + datos)
```

### O — Open/Closed (Abierto/Cerrado)

El sistema es **extensible sin modificar** código existente.

```typescript
// La biblioteca de ejercicios crece con nuevos tipos sin tocar
// la lógica de asignación de rutinas.

// Los filtros de alumnos son extensibles vía parámetros:
interface StudentFilters {
  objetivo?: Objetivo
  nivel?: Nivel
  modalidad?: Modalidad
  isActive?: boolean
  // agregar nuevos filtros aquí sin tocar el servicio
}
```

### L — Liskov Substitution (Sustitución de Liskov)

Las implementaciones de repositorios son **intercambiables** si respetan la interfaz.

```typescript
// lib/repositories/interfaces.ts
interface IStudentRepository {
  findByDni(dni: string): Promise<Student | null>
  findAll(filters: StudentFilters): Promise<Student[]>
  create(data: CreateStudentInput): Promise<Student>
  update(id: string, data: UpdateStudentInput): Promise<Student>
  deactivate(id: string): Promise<void>  // nunca delete — soft delete
}

// Implementación hoy: PrismaStudentRepository
// Si mañana cambiamos ORM, el servicio no se toca.
```

### I — Interface Segregation (Segregación de Interfaces)

Interfaces **pequeñas y focalizadas**, no un repositorio monolítico.

```typescript
// ✅ Correcto — una interfaz por entidad
interface IStudentRepository { ... }
interface IExerciseRepository { ... }
interface IRoutineRepository { ... }
interface IProgressRepository { ... }

// ❌ Incorrecto — un IRepository con 40 métodos mezclados
```

### D — Dependency Inversion (Inversión de Dependencias)

Los servicios **dependen de abstracciones**, nunca de Prisma directamente.

```typescript
// ✅ Correcto — el servicio no sabe qué implementación usa
class RutinaService {
  constructor(
    private readonly rutinaRepo: IRoutineRepository,
    private readonly studentRepo: IStudentRepository,
  ) {}

  async getActivaByDni(dni: string) {
    const student = await this.studentRepo.findByDni(dni)
    if (!student || !student.isActive) throw new StudentNotFoundError()
    // ...
  }
}

// ❌ Incorrecto — acoplado a Prisma, no testeable
class RutinaService {
  async getActivaByDni(dni: string) {
    const student = await prisma.student.findUnique({ where: { dni } })
  }
}
```

---

## 6. Convenciones de Desarrollo

### Nombrado
| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case` | `rutina.service.ts` |
| Clases / Interfaces | `PascalCase` | `RutinaService`, `IStudentRepository` |
| Variables y funciones | `camelCase` | `getActivaByDni` |
| Constantes globales | `UPPER_SNAKE_CASE` | `MAX_BULK_CHUNK_SIZE` |
| Tablas Prisma | `snake_case` | mapeadas con `@@map("progress_logs")` |
| Componentes shadcn | `PascalCase` | importados de `@/components/ui/` |
| Clases Tailwind custom | `kebab-case` en `@layer` | `trainer-sidebar`, `portal-exercise-card` |

### API Routes
- Rutas en español alineadas al dominio: `/api/alumnos`, `/api/rutinas`, `/api/progreso`
- Validar input con Zod **antes** de pasar al servicio
- Respuestas de error consistentes: `{ error: string, code: string }`
- HTTP status codes semánticos: `201` para creación, `404` para not found, `422` para validación

### Base de datos
- **Nunca** borrar registros de alumnos — usar `is_active = false`
- Toda operación que cambie `status` de una rutina pasa por el servicio (nunca directo a la DB)
- Migraciones con nombres descriptivos: `add_payment_expires_to_students`
- Usar transacciones Prisma para operaciones que afectan múltiples tablas

### Seguridad
- Variables de entorno en `.env.local`, **nunca** en el repositorio
- El DNI en la URL del portal se valida y sanitiza antes de cualquier query
- Panel admin protegido por `proxy.ts` (Auth.js) en todas las rutas `/(admin)/*`
- Passwords manejadas por Auth.js (bcrypt internamente)

### Importación masiva (CSV)
- Validar el archivo completo primero — reportar todos los errores antes de persistir nada
- Procesar en **chunks de 50 registros** para respetar el timeout de Vercel (10s free tier)
- Cada chunk es una transacción atómica: si falla un registro, se revierte el chunk completo
- Progreso visible en UI durante el proceso

---

## 7. Variables de Entorno Requeridas

```bash
# Base de datos (Neon)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Auth.js
NEXTAUTH_URL="https://tu-dominio.vercel.app"
NEXTAUTH_SECRET="..."                          # openssl rand -base64 32
```

---

## 9. UI: Tailwind CSS v4 + shadcn/ui

### Por qué esta combinación

- **Tailwind v4** elimina `tailwind.config.js`. La config vive en `globals.css` como CSS custom properties nativas — compatible con el sistema de tokens de `DESIGN.md`.
- **shadcn/ui** provee componentes accesibles (Radix UI por debajo) que se copian al proyecto y se pueden modificar libremente. No es una dependencia externa bloqueante.
- Los design tokens de `DESIGN.md` se mapean directamente a variables CSS de shadcn.

### Scaffolding inicial

```bash
# Opción recomendada: shadcn init crea el proyecto Next.js + Tailwind + shadcn de una vez
npx shadcn@latest init -t next

# Agregar componentes a medida que se necesiten
npx shadcn@latest add button card input table checkbox textarea badge
npx shadcn@latest add dialog sheet sidebar skeleton toast
```

### Mapeo de tokens DESIGN.md → CSS variables shadcn

El archivo `app/globals.css` traduce los tokens de `DESIGN.md` al sistema de variables de shadcn:

```css
@import "tailwindcss";

@layer base {
  :root {
    /* Brand — del DESIGN.md, extraído del logo Santiago Ramón */
    --primary: #f20f38;            /* colors.brand */
    --primary-foreground: #ffffff; /* colors.on-brand */
    --destructive: #8c041d;        /* colors.brand-deep */

    /* Superficies */
    --background: #ffffff;         /* colors.canvas */
    --card: #f2f2f2;               /* colors.surface-soft */
    --card-foreground: #0d0d0d;    /* colors.ink */

    /* Texto */
    --foreground: #0d0d0d;         /* colors.ink */
    --muted-foreground: #6b6b6b;   /* colors.mute */

    /* Bordes */
    --border: #e5e5e5;             /* colors.hairline */
    --input: #e5e5e5;
    --ring: #f20f38;               /* focus ring en rojo de marca */

    /* Tipografía */
    --font-sans: 'Inter', -apple-system, system-ui, sans-serif;
    --font-display: 'Oswald', -apple-system, system-ui, sans-serif; /* titulares y botones */

    /* Radio — del DESIGN.md rounded tokens (sin cambios respecto a lo ya implementado) */
    --radius: 1rem;                /* rounded.md = 16px */
  }
}
```

> **Nota**: `--radius` se mantiene en `1rem`, igual a lo ya construido — el rediseño de paleta no reinicia el radio ya implementado. Modales usan `rounded-[1.5rem]` (`rounded.lg` = 24px).

### shadcn/ui → DESIGN.md mapping de componentes

| DESIGN.md component | shadcn/ui component | Customización |
|---|---|---|
| `button-primary` | `<Button>` | variante `default`, color `--primary`, fuente `--font-display` |
| `button-secondary` | `<Button variant="secondary">` | borde `--border` |
| `button-destructive` | `<Button variant="destructive">` | color `--destructive` |
| `text-input` | `<Input>` | radius `rounded.sm` (8px), foco `--ring` |
| `modal-card` | `<Dialog>` | radius `1.5rem` |
| `badge-neutral` / `badge-success` / `badge-overdue` | `<Badge>` | variantes por estado de cuota/progreso |
| `card` / `card-soft` → alumno, ejercicio, día de rutina | `<Card>` | fondo `--card` en variante soft |
| `data-table-row` | `<Table>` | zebra opcional con `--card` |
| `sidebar-nav` | `<Sidebar>` (admin) | fondo `--foreground` (negro), item activo `--primary` |
| `portal-header` | custom (portal) | fondo negro, nombre del alumno en `--font-display` |

---

## 8. Consideraciones de Performance

| Escenario | Estrategia |
|---|---|
| Alumno consulta su rutina | Query por índice en `dni` — < 5ms. Cache con `unstable_cache` de Next.js 16 (revalidar al asignar nueva rutina). |
| Trainer lista alumnos | Paginación con cursor (`cursor`-based, no `offset`) para consistencia con datasets grandes. |
| Asignación masiva 500 alumnos | `createMany` de Prisma en chunks de 50, dentro de transacciones. |
| Importación CSV | Parse en el cliente (browser) → POST por chunks al servidor con feedback de progreso. |
| Componentes UI | Server Components por defecto; solo `"use client"` donde haya interactividad real (formularios, checkboxes de progreso). |

---

*Este documento es la fuente de verdad de la arquitectura. Cualquier decisión que se desvíe de lo aquí definido requiere actualizar este archivo antes de implementar.*
