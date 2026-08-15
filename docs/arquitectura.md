# Arquitectura — Personal Trainer Platform

**Versión:** 1.0  
**Fecha:** Agosto 2026  
**Estado:** Aprobado

---

## 1. Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend + API | **Next.js** (App Router) | **16.3.1** ✅ | Un solo repo, un solo deploy. Server Components para lectura, Client Components para interactividad. |
| Base de datos | **PostgreSQL** (Neon) | latest | Modelo de datos relacional. Integridad referencial nativa, JOINs eficientes, FK constraints reales. |
| ORM | **Prisma** | **7.9.1** ✅ | Type-safety en queries, migraciones controladas, schema como fuente de verdad. Requiere driver adapter (`@prisma/adapter-pg`) desde v7. |
| Autenticación | **Auth.js v5** (NextAuth) | 5.0.0-beta.32 ⚠️ | Solo para el trainer (admin). Alumnos acceden por DNI sin sesión formal. **Riesgo:** todavía en beta — vigilar el lanzamiento de una versión estable antes de un release de producción. |
| Validación | **Zod** | 4.x | Validación de inputs en API Routes y formularios. Single source of truth para los schemas. |
| Estilos | **Tailwind CSS v4** | 4.x | CSS nativo con variables. Sin `tailwind.config.js` — la config vive en `globals.css`. |
| Componentes UI | **shadcn/ui** | latest | Componentes accesibles sobre Radix UI, 100% customizables, tokens mapeados a DESIGN.md. |
| Hosting | **Vercel** | — | Zero-ops, preview deployments automáticos, integración nativa con Next.js y Neon. |

---

## 2. Estructura de Carpetas

```
/
├── app/
│   ├── (admin)/              # Grupo: panel del trainer (requiere auth)
│   │   ├── dashboard/
│   │   ├── alumnos/
│   │   ├── ejercicios/
│   │   ├── plantillas/
│   │   └── layout.tsx        # Layout con guard de autenticación
│   ├── (portal)/             # Grupo: portal del alumno (acceso por DNI)
│   │   ├── page.tsx          # Pantalla de ingreso por DNI
│   │   └── rutina/
│   │       └── [dni]/
│   └── api/                  # Route Handlers (serverless)
│       ├── auth/
│       ├── alumnos/
│       ├── ejercicios/
│       ├── plantillas/
│       ├── rutinas/
│       └── progreso/
├── components/
│   ├── ui/                   # Componentes shadcn/ui (generados por CLI)
│   ├── admin/                # Componentes de negocio del panel trainer
│   ├── portal/                # Componentes de negocio del portal alumno
│   └── shared/                # Componentes usados por admin Y portal (ej. VideoDialog)
├── lib/
│   ├── db/                   # Cliente Prisma (singleton)
│   ├── services/             # Lógica de negocio (capa de dominio)
│   ├── repositories/         # Acceso a datos (abstracciones sobre Prisma)
│   └── validators/           # Schemas Zod compartidos
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── app/globals.css            # Design tokens Tailwind v4 + variables shadcn/ui
└── proxy.ts                   # Protección de rutas admin (Next 16 renombró middleware.ts → proxy.ts)
```

---

## 3. Modelo de Base de Datos

### Decisiones de diseño

- **UUIDs** como primary keys (portable, sin colisiones en imports masivos).
- **Soft delete** en alumnos (`is_active`): nunca se borra un alumno, solo se desactiva.
- **Overrides** en rutinas asignadas: la personalización individual vive separada de la plantilla base, garantizando RN-02.
- **Índices** explícitos en las columnas de búsqueda frecuente.

### Tablas

```
trainers
────────────────────────────────────────────────────────────
id              UUID        PK
email           TEXT        UNIQUE NOT NULL
password_hash   TEXT        NOT NULL
name            TEXT        NOT NULL
created_at      TIMESTAMP   DEFAULT now()


students
────────────────────────────────────────────────────────────
id                    UUID        PK
dni                   TEXT        UNIQUE NOT NULL   ← identificador público
first_name            TEXT        NOT NULL
last_name             TEXT        NOT NULL
email                 TEXT
phone                 TEXT
objetivo              ENUM        (hipertrofia, fuerza, descenso)
nivel                 ENUM        (principiante, intermedio, avanzado)
modalidad             ENUM        (gimnasio, casa)
membership_starts_at  DATE
payment_expires_at    DATE
health_notes          TEXT
is_active             BOOLEAN     DEFAULT true      ← soft delete
created_at            TIMESTAMP   DEFAULT now()
updated_at            TIMESTAMP

  INDEX: idx_students_dni


exercises
────────────────────────────────────────────────────────────
id                    UUID        PK
name                  TEXT        NOT NULL
primary_muscle        TEXT        NOT NULL
secondary_muscle      TEXT
video_url             TEXT
created_at            TIMESTAMP   DEFAULT now()
updated_at            TIMESTAMP


routine_templates
────────────────────────────────────────────────────────────
id              UUID        PK
name            TEXT        NOT NULL
description     TEXT
duration_weeks  INT         NOT NULL DEFAULT 4
created_at      TIMESTAMP   DEFAULT now()
updated_at      TIMESTAMP


training_days
────────────────────────────────────────────────────────────
id           UUID    PK
template_id  UUID    FK → routine_templates(id)  ON DELETE CASCADE
label        TEXT    NOT NULL   ← "Día 1 – Tren Superior"
day_order    INT     NOT NULL


exercise_blocks
────────────────────────────────────────────────────────────
id               UUID    PK
training_day_id  UUID    FK → training_days(id)   ON DELETE CASCADE
exercise_id      UUID    FK → exercises(id)
sets             INT     NOT NULL
reps             INT                   ← nullable si es por tiempo
duration_secs    INT                   ← nullable si es por reps
rest_secs        INT
trainer_notes    TEXT
block_order      INT     NOT NULL


assigned_routines
────────────────────────────────────────────────────────────
id           UUID        PK
student_id   UUID        FK → students(id)
template_id  UUID        FK → routine_templates(id)   ← plantilla de origen
status       ENUM        (active, historic)  DEFAULT 'active'
assigned_at  TIMESTAMP   DEFAULT now()
expires_at   TIMESTAMP                        ← calculado desde duration_weeks

  INDEX: idx_assigned_routines_student_status
  PARTIAL UNIQUE INDEX: idx_one_active_per_student
    ON assigned_routines (student_id) WHERE status = 'active'


routine_overrides                    ← personalizaciones individuales (RN-02)
────────────────────────────────────────────────────────────
id                   UUID    PK
assigned_routine_id  UUID    FK → assigned_routines(id)  ON DELETE CASCADE
exercise_block_id    UUID    FK → exercise_blocks(id)
sets                 INT                   ← null = usa el valor de la plantilla
reps                 INT
duration_secs        INT
rest_secs            INT
trainer_notes        TEXT


progress_logs
────────────────────────────────────────────────────────────
id                   UUID          PK
student_id           UUID          FK → students(id)
assigned_routine_id  UUID          FK → assigned_routines(id)
exercise_block_id    UUID          FK → exercise_blocks(id)
logged_date          DATE          NOT NULL
weight_kg            DECIMAL(6,2)  ← nullable
completed            BOOLEAN       DEFAULT false
student_notes        TEXT
created_at           TIMESTAMP     DEFAULT now()
updated_at           TIMESTAMP

  INDEX: idx_progress_student_date
  UNIQUE: (student_id, exercise_block_id, logged_date)
```

---

## 4. Capas de la Aplicación

El sistema sigue una **arquitectura en capas** para separar responsabilidades y mantener el código testeable.

```
┌─────────────────────────────────────┐
│        Presentation Layer           │
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
