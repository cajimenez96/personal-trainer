# Generic Student Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anyone view a level-based (básico/intermedio/avanzado) routine via a shared, coach-configurable password, without creating `Student` rows or any progress-tracking data.

**Architecture:** A new `GenericProfile` Prisma model (one row per level, holding a bcrypt password hash and an optional `RoutineTemplate` pointer) sits alongside the existing `Student`/`AssignedRoutine` pipeline without touching it. The portal's existing DNI entry field also tries a generic-password match. A new read-only portal route renders the assigned template directly (no `AssignedRoutine`, no overrides, no tracking). Presentation pieces shared with the real-student routine page are extracted into `components/portal/*` so both pages stay thin containers (fetch + validate) over shared UI.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Prisma 7, Zod v4, bcryptjs, Vitest (new — first test runner in this repo).

**Spec:** `docs/superpowers/specs/2026-09-03-generic-student-profiles-design.md`

## Global Constraints

- DNI validation regex (`^\d{7,9}$`, in `lib/validators/portal.ts`) is unchanged — the generic-password path only runs when a value does **not** parse as a DNI.
- Passwords are hashed with `bcryptjs` (`bcrypt.hash(value, 10)` / `bcrypt.compare`), same as `Trainer.passwordHash` in `lib/auth.ts` and `prisma/seed.ts`.
- `GenericProfile` never joins `Student` — generic profiles must never appear in student lists, CSV exports, or membership/adherence stats.
- No `AssignedRoutine`, `RoutineOverride`, `ProgressLog`, or `BodyWeightLog` rows are ever created for generic profiles — the generic routine view reads `RoutineTemplate` directly.
- `proxy.ts` needs no change: `pathname.startsWith("/rutina")` already treats the whole `/rutina/*` subtree as public.
- Follow the existing repository/service/validator layering exactly: `lib/repositories/interfaces.ts` (types) → `lib/repositories/*.repository.ts` (Prisma-backed, implements the interface) → `lib/services/*.service.ts` (wraps one repo, exported as a singleton) → `lib/actions/*.actions.ts` (`"use server"`, zod-parses, calls the service).
- Enum string values live in two places by existing convention (see `Nivel` / `NIVEL_VALUES`): the Prisma schema enum (lowercase values) is the source of truth for the DB and is imported type-only into `lib/repositories/interfaces.ts`; `lib/validators/*.ts` separately declares the matching `as const` string array used by `z.enum(...)` and UI labels. Keep both in sync manually — do not introduce a runtime dependency between them.
- Commit messages: conventional commits (`feat:`, `chore:`, `test:` …), and every commit ends with:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  ```
- This repo has no test runner yet. Vitest is installed in Task 3, the first task with real logic to test. Tasks 4, 6, and 7 (thin Prisma repositories / server actions) follow the codebase's existing convention of **no** automated test — verified by `tsc --noEmit` only, same as every other repository/action file today.
- UI-only tasks (8–12) have no component-rendering tests (no `@testing-library/react` in scope) — each ends with a manual verification checklist run against `npm run dev`, matching how this repo verifies UI today.

---

### Task 1: Prisma schema — `GenericProfile` model + migration

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma model `GenericProfile` (fields: `id`, `level: GenericLevel`, `passwordHash`, `assignedTemplateId`, `updatedAt`) and enum `GenericLevel` (`basico | intermedio | avanzado`) — consumed by every later task via the generated Prisma Client (`@/app/generated/prisma/client`).

- [ ] **Step 1: Add the `GenericLevel` enum**

Insert right after the `RoutineStatus` enum (after line 26, before the `NoteType` enum comment block):

```prisma
enum GenericLevel {
  basico
  intermedio
  avanzado
}
```

- [ ] **Step 2: Add the `GenericProfile` model**

Insert a new section after the `RoutineOverride` model (after its closing `}` and before the `// PROGRESS LOGS` section header):

```prisma
// ─────────────────────────────────────────────
// GENERIC PROFILES (shared, non-Student access by level — no tracking)
// ─────────────────────────────────────────────

model GenericProfile {
  id                 String       @id @default(uuid())
  level              GenericLevel @unique
  passwordHash       String       @map("password_hash")
  assignedTemplateId String?      @map("assigned_template_id")
  updatedAt          DateTime     @updatedAt @map("updated_at")

  assignedTemplate RoutineTemplate? @relation(fields: [assignedTemplateId], references: [id], onDelete: SetNull)

  @@map("generic_profiles")
}
```

- [ ] **Step 3: Add the back-relation on `RoutineTemplate`**

In `model RoutineTemplate`, change:

```prisma
  trainingDays     TrainingDay[]
  assignedRoutines AssignedRoutine[]
```

to:

```prisma
  trainingDays     TrainingDay[]
  assignedRoutines AssignedRoutine[]
  genericProfiles  GenericProfile[]
```

- [ ] **Step 4: Generate and run the migration**

Run: `npx prisma migrate dev --name add_generic_profile`
Expected: migration file created under `prisma/migrations/`, applies cleanly, ends with "Your database is now in sync with your schema."

- [ ] **Step 5: Regenerate the Prisma Client**

Run: `npx prisma generate`
Expected: completes without errors (this also runs automatically via `postinstall`, but run it now so Task 3 onward can import `GenericLevel` from `@/app/generated/prisma/client` immediately).

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "$(cat <<'EOF'
feat: add GenericProfile model for level-based portal access

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Seed default generic-profile passwords

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `db.genericProfile` (Prisma Client model from Task 1), `bcrypt` (already imported in this file).
- Produces: 3 seeded `GenericProfile` rows (`basico`, `intermedio`, `avanzado`), each with a bcrypt hash of `olympia.<level>`. These are just the initial state — the coach changes them later via the admin UI built in Task 12.

- [ ] **Step 1: Add the seed data and upsert loop**

In `prisma/seed.ts`, add this near the top (after `const EXERCISES = [...]` array, before `async function main()`):

```typescript
const GENERIC_PROFILE_DEFAULTS: { level: "basico" | "intermedio" | "avanzado"; password: string }[] = [
  { level: "basico", password: "olympia.basico" },
  { level: "intermedio", password: "olympia.intermedio" },
  { level: "avanzado", password: "olympia.avanzado" },
]
```

Inside `async function main()`, after the `EXERCISES` upsert loop (after the `console.log(\`Seeded ${EXERCISES.length} exercises\`)` line), add:

```typescript
  for (const { level, password } of GENERIC_PROFILE_DEFAULTS) {
    const passwordHash = await bcrypt.hash(password, 10)
    await db.genericProfile.upsert({
      where: { level },
      update: {},
      create: { level, passwordHash },
    })
  }

  console.log(`Seeded ${GENERIC_PROFILE_DEFAULTS.length} generic profiles`)
```

Note the `update: {}` — re-running the seed must never overwrite a password the coach already changed from the admin UI. Only a brand-new row gets the default password.

- [ ] **Step 2: Run the seed and verify**

Run: `npm run db:seed`
Expected: output includes `Seeded 3 generic profiles`, no errors.

Verify: `npx prisma studio` (or a one-off `SELECT level, assigned_template_id FROM generic_profiles;`) shows 3 rows with non-null `password_hash` and null `assigned_template_id`.

- [ ] **Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "$(cat <<'EOF'
feat: seed default passwords for generic student profiles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Install Vitest + `lib/validators/generic-profile.ts`

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/validators/generic-profile.ts`
- Test: `lib/validators/generic-profile.test.ts`

**Interfaces:**
- Produces:
  - `GENERIC_LEVEL_VALUES: readonly ["basico", "intermedio", "avanzado"]`
  - `type GenericLevelValue = "basico" | "intermedio" | "avanzado"`
  - `GENERIC_LEVEL_LABEL: Record<GenericLevelValue, string>` (`"Básico"`, `"Intermedio"`, `"Avanzado"`)
  - `genericLevelSchema: ZodSchema<GenericLevelValue>`
  - `genericPasswordSchema: ZodSchema<{ level: GenericLevelValue; password: string }>`, `type GenericPasswordInput`
  - `assignGenericTemplateSchema: ZodSchema<{ level: GenericLevelValue; templateId: string }>`, `type AssignGenericTemplateInput`
  - These are consumed by every later task (repository, service, actions, both new pages, both new components).

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

Add to `package.json` `scripts`:
```json
"test": "vitest run"
```

- [ ] **Step 2: Add `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
```

- [ ] **Step 3: Write the failing test**

Create `lib/validators/generic-profile.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import {
  GENERIC_LEVEL_LABEL,
  GENERIC_LEVEL_VALUES,
  assignGenericTemplateSchema,
  genericLevelSchema,
  genericPasswordSchema,
} from "./generic-profile"

describe("genericLevelSchema", () => {
  it("accepts the three known levels", () => {
    for (const level of GENERIC_LEVEL_VALUES) {
      expect(genericLevelSchema.safeParse(level).success).toBe(true)
    }
  })

  it("rejects anything else", () => {
    expect(genericLevelSchema.safeParse("olympia.basico").success).toBe(false)
    expect(genericLevelSchema.safeParse("").success).toBe(false)
    expect(genericLevelSchema.safeParse("BASICO").success).toBe(false)
  })
})

describe("GENERIC_LEVEL_LABEL", () => {
  it("has a label for every level", () => {
    expect(GENERIC_LEVEL_LABEL.basico).toBe("Básico")
    expect(GENERIC_LEVEL_LABEL.intermedio).toBe("Intermedio")
    expect(GENERIC_LEVEL_LABEL.avanzado).toBe("Avanzado")
  })
})

describe("genericPasswordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = genericPasswordSchema.safeParse({ level: "basico", password: "short" })
    expect(result.success).toBe(false)
  })

  it("accepts a valid password", () => {
    const result = genericPasswordSchema.safeParse({ level: "basico", password: "olympia.basico" })
    expect(result.success).toBe(true)
  })
})

describe("assignGenericTemplateSchema", () => {
  it("requires a uuid templateId", () => {
    const result = assignGenericTemplateSchema.safeParse({ level: "basico", templateId: "not-a-uuid" })
    expect(result.success).toBe(false)
  })

  it("accepts a valid payload", () => {
    const result = assignGenericTemplateSchema.safeParse({
      level: "intermedio",
      templateId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run lib/validators/generic-profile.test.ts`
Expected: FAIL — `./generic-profile` module not found.

- [ ] **Step 5: Implement `lib/validators/generic-profile.ts`**

```typescript
import { z } from "zod"

export const GENERIC_LEVEL_VALUES = ["basico", "intermedio", "avanzado"] as const

export type GenericLevelValue = (typeof GENERIC_LEVEL_VALUES)[number]

export const GENERIC_LEVEL_LABEL: Record<GenericLevelValue, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

export const genericLevelSchema = z.enum(GENERIC_LEVEL_VALUES)

export const genericPasswordSchema = z.object({
  level: genericLevelSchema,
  password: z.string().trim().min(8, "La clave debe tener al menos 8 caracteres"),
})
export type GenericPasswordInput = z.infer<typeof genericPasswordSchema>

export const assignGenericTemplateSchema = z.object({
  level: genericLevelSchema,
  templateId: z.string().uuid(),
})
export type AssignGenericTemplateInput = z.infer<typeof assignGenericTemplateSchema>
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run lib/validators/generic-profile.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/validators/generic-profile.ts lib/validators/generic-profile.test.ts
git commit -m "$(cat <<'EOF'
test: add vitest and generic-profile validators

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `IGenericProfileRepository` + Prisma implementation

**Files:**
- Modify: `lib/repositories/interfaces.ts`
- Create: `lib/repositories/generic-profile.repository.ts`

**Interfaces:**
- Consumes: `GenericLevelValue` is NOT used here — this layer imports the Prisma-generated `GenericLevel` type directly (matching the existing `Nivel` convention), plus `db` from `@/lib/db`.
- Produces:
  - `type GenericProfileWithTemplate = { id: string; level: GenericLevel; passwordHash: string; assignedTemplateId: string | null; assignedTemplate: { id: string; name: string } | null; updatedAt: Date }`
  - `interface IGenericProfileRepository { findAll(): Promise<GenericProfileWithTemplate[]>; findByLevel(level: GenericLevel): Promise<GenericProfileWithTemplate | null>; assignTemplate(level: GenericLevel, templateId: string | null): Promise<GenericProfileWithTemplate>; updatePasswordHash(level: GenericLevel, passwordHash: string): Promise<void> }`
  - `class PrismaGenericProfileRepository implements IGenericProfileRepository`
  - Consumed by Task 5 (`GenericProfileService`).

- [ ] **Step 1: Add the Prisma type import**

In `lib/repositories/interfaces.ts`, change the top import:

```typescript
import type {
  AssignedRoutine,
  Exercise,
  GenericLevel,
  Nivel,
  NoteType,
  RoutineTemplate,
  Student,
} from "@/app/generated/prisma/client"
```

- [ ] **Step 2: Add the types and interface**

Append at the end of `lib/repositories/interfaces.ts`:

```typescript
export type GenericProfileWithTemplate = {
  id: string
  level: GenericLevel
  passwordHash: string
  assignedTemplateId: string | null
  assignedTemplate: { id: string; name: string } | null
  updatedAt: Date
}

export interface IGenericProfileRepository {
  findAll(): Promise<GenericProfileWithTemplate[]>
  findByLevel(level: GenericLevel): Promise<GenericProfileWithTemplate | null>
  assignTemplate(level: GenericLevel, templateId: string | null): Promise<GenericProfileWithTemplate>
  updatePasswordHash(level: GenericLevel, passwordHash: string): Promise<void>
}
```

- [ ] **Step 3: Implement the Prisma repository**

Create `lib/repositories/generic-profile.repository.ts`:

```typescript
import { db } from "@/lib/db"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type { GenericProfileWithTemplate, IGenericProfileRepository } from "@/lib/repositories/interfaces"

const TEMPLATE_SELECT = { assignedTemplate: { select: { id: true, name: true } } } as const

export class PrismaGenericProfileRepository implements IGenericProfileRepository {
  findAll(): Promise<GenericProfileWithTemplate[]> {
    return db.genericProfile.findMany({
      include: TEMPLATE_SELECT,
      orderBy: { level: "asc" },
    })
  }

  findByLevel(level: GenericLevel): Promise<GenericProfileWithTemplate | null> {
    return db.genericProfile.findUnique({
      where: { level },
      include: TEMPLATE_SELECT,
    })
  }

  assignTemplate(level: GenericLevel, templateId: string | null): Promise<GenericProfileWithTemplate> {
    return db.genericProfile.update({
      where: { level },
      data: { assignedTemplateId: templateId },
      include: TEMPLATE_SELECT,
    })
  }

  async updatePasswordHash(level: GenericLevel, passwordHash: string): Promise<void> {
    await db.genericProfile.update({ where: { level }, data: { passwordHash } })
  }
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/repositories/interfaces.ts lib/repositories/generic-profile.repository.ts
git commit -m "$(cat <<'EOF'
feat: add GenericProfile repository

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `GenericProfileService`

**Files:**
- Create: `lib/services/generic-profile.service.ts`
- Test: `lib/services/generic-profile.service.test.ts`

**Interfaces:**
- Consumes: `IGenericProfileRepository`, `GenericProfileWithTemplate` (Task 4), Prisma's `GenericLevel` type.
- Produces: `class GenericProfileService` with `getAll()`, `getByLevel(level)`, `assignTemplate(level, templateId)`, `updatePassword(level, plainPassword)`, `verifyPassword(candidate): Promise<GenericLevel | null>`; singleton `export const genericProfileService`. Consumed by Task 7 (actions), Task 8 (portal entry), Task 9 (generic routine page), Task 12 (admin pages).

- [ ] **Step 1: Write the failing test**

Create `lib/services/generic-profile.service.test.ts`:

```typescript
import bcrypt from "bcryptjs"
import { beforeAll, describe, expect, it } from "vitest"
import { GenericProfileService } from "./generic-profile.service"
import type { GenericProfileWithTemplate, IGenericProfileRepository } from "@/lib/repositories/interfaces"

function makeProfile(level: "basico" | "intermedio" | "avanzado", passwordHash: string): GenericProfileWithTemplate {
  return {
    id: `id-${level}`,
    level: level as GenericProfileWithTemplate["level"],
    passwordHash,
    assignedTemplateId: null,
    assignedTemplate: null,
    updatedAt: new Date(),
  }
}

class FakeGenericProfileRepository implements IGenericProfileRepository {
  constructor(private profiles: GenericProfileWithTemplate[]) {}

  async findAll() {
    return this.profiles
  }

  async findByLevel(level: GenericProfileWithTemplate["level"]) {
    return this.profiles.find((p) => p.level === level) ?? null
  }

  async assignTemplate(level: GenericProfileWithTemplate["level"], templateId: string | null) {
    const profile = this.profiles.find((p) => p.level === level)
    if (!profile) throw new Error("not found")
    profile.assignedTemplateId = templateId
    return profile
  }

  async updatePasswordHash(level: GenericProfileWithTemplate["level"], passwordHash: string) {
    const profile = this.profiles.find((p) => p.level === level)
    if (!profile) throw new Error("not found")
    profile.passwordHash = passwordHash
  }
}

describe("GenericProfileService.verifyPassword", () => {
  let service: GenericProfileService

  beforeAll(async () => {
    const profiles = [
      makeProfile("basico", await bcrypt.hash("olympia.basico", 10)),
      makeProfile("intermedio", await bcrypt.hash("olympia.intermedio", 10)),
      makeProfile("avanzado", await bcrypt.hash("olympia.avanzado", 10)),
    ]
    service = new GenericProfileService(new FakeGenericProfileRepository(profiles))
  })

  it("returns the matching level for a correct password", async () => {
    await expect(service.verifyPassword("olympia.intermedio")).resolves.toBe("intermedio")
  })

  it("returns null for a wrong password", async () => {
    await expect(service.verifyPassword("wrong-password")).resolves.toBeNull()
  })

  it("returns null for an empty string", async () => {
    await expect(service.verifyPassword("")).resolves.toBeNull()
  })
})

describe("GenericProfileService.updatePassword", () => {
  it("hashes the new password before saving", async () => {
    const profiles = [makeProfile("basico", await bcrypt.hash("old-password", 10))]
    const repo = new FakeGenericProfileRepository(profiles)
    const service = new GenericProfileService(repo)

    await service.updatePassword("basico" as GenericProfileWithTemplate["level"], "new-password-123")

    const stored = await repo.findByLevel("basico" as GenericProfileWithTemplate["level"])
    expect(stored?.passwordHash).not.toBe("new-password-123")
    await expect(bcrypt.compare("new-password-123", stored!.passwordHash)).resolves.toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/services/generic-profile.service.test.ts`
Expected: FAIL — `./generic-profile.service` module not found.

- [ ] **Step 3: Implement the service**

Create `lib/services/generic-profile.service.ts`:

```typescript
import bcrypt from "bcryptjs"
import type { GenericLevel } from "@/app/generated/prisma/client"
import type { IGenericProfileRepository } from "@/lib/repositories/interfaces"
import { PrismaGenericProfileRepository } from "@/lib/repositories/generic-profile.repository"

const SALT_ROUNDS = 10

export class GenericProfileService {
  constructor(private readonly repo: IGenericProfileRepository) {}

  getAll() {
    return this.repo.findAll()
  }

  getByLevel(level: GenericLevel) {
    return this.repo.findByLevel(level)
  }

  assignTemplate(level: GenericLevel, templateId: string | null) {
    return this.repo.assignTemplate(level, templateId)
  }

  async updatePassword(level: GenericLevel, plainPassword: string) {
    const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS)
    await this.repo.updatePasswordHash(level, passwordHash)
  }

  // Compares the entered value against all 3 profiles' hashes. Cheap at this
  // scale (3 rows), and the only way to identify the level: the password is
  // coach-configurable free text, not a fixed pattern we could branch on.
  async verifyPassword(candidate: string): Promise<GenericLevel | null> {
    if (!candidate) return null
    const profiles = await this.repo.findAll()
    for (const profile of profiles) {
      const isMatch = await bcrypt.compare(candidate, profile.passwordHash)
      if (isMatch) return profile.level
    }
    return null
  }
}

export const genericProfileService = new GenericProfileService(new PrismaGenericProfileRepository())
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/services/generic-profile.service.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/services/generic-profile.service.ts lib/services/generic-profile.service.test.ts
git commit -m "$(cat <<'EOF'
feat: add GenericProfileService with password verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Template-to-routine-days mapper

**Files:**
- Create: `lib/mappers/template-routine.mapper.ts`
- Test: `lib/mappers/template-routine.mapper.test.ts`

**Interfaces:**
- Consumes: `RoutineTemplateWithFullDays` (`lib/repositories/interfaces.ts`), `RoutineDetailDay` / `RoutineDetailBlock` (`lib/services/assigned-routine.service.ts`, both already exported).
- Produces: `function mapTemplateToRoutineDays(template: RoutineTemplateWithFullDays, exerciseById: Map<string, { name: string; videoUrl: string | null }>): RoutineDetailDay[]`. Consumed by Task 9 (generic routine page).

- [ ] **Step 1: Write the failing test**

Create `lib/mappers/template-routine.mapper.test.ts`:

```typescript
import { describe, expect, it } from "vitest"
import { mapTemplateToRoutineDays } from "./template-routine.mapper"
import type { RoutineTemplateWithFullDays } from "@/lib/repositories/interfaces"

function makeTemplate(): RoutineTemplateWithFullDays {
  return {
    id: "template-1",
    name: "Plantilla Básico",
    description: null,
    durationWeeks: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    trainingDays: [
      {
        id: "day-1",
        label: "Día 1",
        dayOrder: 0,
        exerciseBlocks: [
          {
            id: "block-1",
            exerciseId: "exercise-1",
            sets: 3,
            reps: 10,
            repsScheme: null,
            weightKg: 20,
            intensity: null,
            tempo: null,
            durationSecs: null,
            restSecs: 60,
            trainerNotes: null,
            blockOrder: 0,
            groupLabel: null,
            groupRestSecs: null,
          },
        ],
      },
    ],
  }
}

describe("mapTemplateToRoutineDays", () => {
  it("maps template days/blocks into RoutineDetailDay shape, resolving exercise info", () => {
    const exerciseById = new Map([["exercise-1", { name: "Sentadilla", videoUrl: "https://example.com/v" }]])

    const result = mapTemplateToRoutineDays(makeTemplate(), exerciseById)

    expect(result).toEqual([
      {
        id: "day-1",
        label: "Día 1",
        blocks: [
          {
            id: "block-1",
            exerciseName: "Sentadilla",
            exerciseVideoUrl: "https://example.com/v",
            sets: 3,
            reps: 10,
            repsScheme: null,
            weightKg: 20,
            intensity: null,
            tempo: null,
            durationSecs: null,
            restSecs: 60,
            trainerNotes: null,
            isOverridden: false,
            groupLabel: null,
            groupRestSecs: null,
          },
        ],
      },
    ])
  })

  it("falls back gracefully when an exercise is missing from the map", () => {
    const result = mapTemplateToRoutineDays(makeTemplate(), new Map())
    expect(result[0].blocks[0].exerciseName).toBe("Ejercicio")
    expect(result[0].blocks[0].exerciseVideoUrl).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/mappers/template-routine.mapper.test.ts`
Expected: FAIL — `./template-routine.mapper` module not found.

- [ ] **Step 3: Implement the mapper**

Create `lib/mappers/template-routine.mapper.ts`:

```typescript
import type { RoutineTemplateWithFullDays } from "@/lib/repositories/interfaces"
import type { RoutineDetailDay } from "@/lib/services/assigned-routine.service"

// No AssignedRoutine/override involved: a generic profile's routine is
// always exactly what the template says (RN-02 override rules don't apply).
export function mapTemplateToRoutineDays(
  template: RoutineTemplateWithFullDays,
  exerciseById: Map<string, { name: string; videoUrl: string | null }>,
): RoutineDetailDay[] {
  return template.trainingDays.map((day) => ({
    id: day.id,
    label: day.label,
    blocks: day.exerciseBlocks.map((block) => {
      const exercise = exerciseById.get(block.exerciseId)
      return {
        id: block.id,
        exerciseName: exercise?.name ?? "Ejercicio",
        exerciseVideoUrl: exercise?.videoUrl ?? null,
        sets: block.sets,
        reps: block.reps,
        repsScheme: block.repsScheme,
        weightKg: block.weightKg,
        intensity: block.intensity,
        tempo: block.tempo,
        durationSecs: block.durationSecs,
        restSecs: block.restSecs,
        trainerNotes: block.trainerNotes,
        isOverridden: false,
        groupLabel: block.groupLabel,
        groupRestSecs: block.groupRestSecs,
      }
    }),
  }))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/mappers/template-routine.mapper.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/mappers/template-routine.mapper.ts lib/mappers/template-routine.mapper.test.ts
git commit -m "$(cat <<'EOF'
feat: add template-to-routine-days mapper for generic profiles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `generic-profile.actions.ts`

**Files:**
- Create: `lib/actions/generic-profile.actions.ts`

**Interfaces:**
- Consumes: `genericProfileService` (Task 5), `assignGenericTemplateSchema` / `genericPasswordSchema` (Task 3).
- Produces: `type GenericActionState = { ok: boolean; error?: string }`; `assignGenericTemplateAction(input: AssignGenericTemplateInput): Promise<GenericActionState>`; `updateGenericPasswordAction(input: GenericPasswordInput): Promise<GenericActionState>`. Consumed by Task 12 (`ConfirmGenericAssignment`, `GenericPasswordForm`).

- [ ] **Step 1: Implement the actions**

Create `lib/actions/generic-profile.actions.ts`:

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import {
  assignGenericTemplateSchema,
  genericPasswordSchema,
  type AssignGenericTemplateInput,
  type GenericPasswordInput,
} from "@/lib/validators/generic-profile"

export type GenericActionState = { ok: boolean; error?: string }

export async function assignGenericTemplateAction(
  input: AssignGenericTemplateInput,
): Promise<GenericActionState> {
  const parsed = assignGenericTemplateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Datos inválidos." }

  await genericProfileService.assignTemplate(parsed.data.level, parsed.data.templateId)
  revalidatePath("/alumnos-genericos")
  return { ok: true }
}

export async function updateGenericPasswordAction(
  input: GenericPasswordInput,
): Promise<GenericActionState> {
  const parsed = genericPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  await genericProfileService.updatePassword(parsed.data.level, parsed.data.password)
  revalidatePath("/alumnos-genericos")
  return { ok: true }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/generic-profile.actions.ts
git commit -m "$(cat <<'EOF'
feat: add server actions for generic profile assignment and password

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Portal entry — accept DNI or generic password

**Files:**
- Modify: `app/(portal)/page.tsx`

**Interfaces:**
- Consumes: `genericProfileService.verifyPassword` (Task 5), `dniSchema` (existing, `lib/validators/portal.ts`), `studentService.getByDni` (existing).
- Produces: no new exports — this is a leaf page. Redirects to `/rutina/[dni]` (existing, unchanged) or `/rutina/generico/[level]` (built in Task 9).

- [ ] **Step 1: Rewrite the lookup action and copy**

Replace the full contents of `app/(portal)/page.tsx`:

```tsx
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
```

Note: `inputMode="numeric"` was removed from the input — it now accepts DNI digits or an alphanumeric password. The `"invalid"` error key is gone: any non-DNI value now attempts the generic-password path before falling back to `"not-found"`, so there's no longer a separate "malformed DNI" state to report.

- [ ] **Step 2: Manual verification**

Run: `npm run dev`
- Enter a known active student's DNI → redirected to `/rutina/<dni>` showing their routine (unchanged behavior).
- Enter `olympia.basico` (seeded in Task 2) → redirected to `/rutina/generico/basico` (404 until Task 9 exists — expected at this point in the plan).
- Enter garbage (e.g. `nope`) → stays on `/?error=not-found` with the new error message.

- [ ] **Step 3: Commit**

```bash
git add "app/(portal)/page.tsx"
git commit -m "$(cat <<'EOF'
feat: accept generic profile password on portal entry

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Extract shared portal components + refactor the real-student routine page

**Files:**
- Create: `components/portal/routine-portal-header.tsx`
- Create: `components/portal/routine-day-accordion.tsx`
- Create: `components/portal/exercise-block-card.tsx`
- Create: `components/portal/no-routine-assigned-message.tsx`
- Modify: `app/(portal)/rutina/[dni]/page.tsx`

**Interfaces:**
- Consumes: `RoutineDetailDay` / `RoutineDetailBlock` (`lib/services/assigned-routine.service.ts`), `groupConsecutiveBlocks` (`lib/utils/group-blocks.ts`, existing/unchanged), `VideoDialog` (`components/shared/video-dialog.tsx`, existing/unchanged).
- Produces:
  - `RoutinePortalHeader({ greetingLabel, title, subtitle, trailingSlot? })`
  - `RoutineDayAccordion({ days, renderDayActions?, renderBlockTrailing? })`
  - `ExerciseBlockCard({ block, trailingSlot? })`
  - `NoRoutineAssignedMessage({ greetingName, backHref, backLabel })`
  - All four consumed by Task 10 (generic routine page) and by the refactored real-student page in this task.

- [ ] **Step 1: Create `ExerciseBlockCard`**

Create `components/portal/exercise-block-card.tsx`:

```tsx
import type { ReactNode } from "react"
import { Play } from "lucide-react"
import { VideoDialog } from "@/components/shared/video-dialog"
import type { RoutineDetailBlock } from "@/lib/services/assigned-routine.service"

export function ExerciseBlockCard({
  block,
  trailingSlot,
}: {
  block: RoutineDetailBlock
  trailingSlot?: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-heading text-lg font-bold leading-snug tracking-tight text-foreground">
          {block.exerciseName}
        </h3>
        {block.exerciseVideoUrl && (
          <VideoDialog
            videoUrl={block.exerciseVideoUrl}
            className="flex h-9 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e5252a] text-white shadow-sm transition-transform hover:bg-[#c91e23] active:scale-95"
          >
            <Play className="size-4 fill-white text-white" />
          </VideoDialog>
        )}
      </div>

      <div className="mt-2.5 flex flex-col gap-1 text-sm">
        <p className="text-foreground">
          <span className="font-bold">Series:</span> {block.sets}
        </p>
        <p className="text-foreground">
          <span className="font-bold">Repeticiones:</span>{" "}
          {block.repsScheme ? block.repsScheme : block.reps ? block.reps : "—"}
          {block.durationSecs ? ` · ${block.durationSecs}s` : ""}
        </p>
        {block.restSecs !== null && (
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Descanso:</span> {block.restSecs}s
          </p>
        )}
        {(block.weightKg !== null || block.intensity !== null) && (
          <p className="text-sm font-medium text-primary">
            {block.weightKg !== null && `Carga sugerida: ${block.weightKg} kg`}
            {block.weightKg !== null && block.intensity !== null && " · "}
            {block.intensity !== null && block.intensity}
          </p>
        )}
        {block.tempo !== null && (
          <p className="text-xs text-muted-foreground">Tempo: {block.tempo}</p>
        )}
        {block.trainerNotes && (
          <p className="mt-1 text-xs italic text-muted-foreground">
            &ldquo;{block.trainerNotes}&rdquo;
          </p>
        )}
      </div>

      {trailingSlot}
    </div>
  )
}
```

- [ ] **Step 2: Create `RoutineDayAccordion`**

Create `components/portal/routine-day-accordion.tsx`:

```tsx
import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { groupConsecutiveBlocks } from "@/lib/utils/group-blocks"
import { ExerciseBlockCard } from "@/components/portal/exercise-block-card"
import type { RoutineDetailBlock, RoutineDetailDay } from "@/lib/services/assigned-routine.service"

export function RoutineDayAccordion({
  days,
  renderDayActions,
  renderBlockTrailing,
}: {
  days: RoutineDetailDay[]
  renderDayActions?: (day: RoutineDetailDay) => ReactNode
  renderBlockTrailing?: (block: RoutineDetailBlock) => ReactNode
}) {
  return (
    <>
      {days.map((day) => (
        <details
          key={day.id}
          className="group rounded-2xl border border-border/80 bg-card shadow-sm transition-all open:pb-3"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3.5 text-base font-bold text-[#d32f2f] hover:opacity-90 dark:text-red-400 [&::-webkit-details-marker]:hidden">
            <span className="font-heading text-lg tracking-tight">{day.label}</span>
            <ChevronDown className="size-5 transition-transform duration-200 group-open:rotate-180" />
          </summary>

          <div className="flex flex-col gap-3 px-4 pt-1">
            {day.blocks.length > 0 && renderDayActions?.(day)}

            {day.blocks.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">Sin ejercicios.</p>
            )}
            {groupConsecutiveBlocks(day.blocks).map((entry, entryIndex) =>
              entry.kind === "single" ? (
                <ExerciseBlockCard
                  key={entry.block.id}
                  block={entry.block}
                  trailingSlot={renderBlockTrailing?.(entry.block)}
                />
              ) : (
                <div
                  key={`group-${entryIndex}-${entry.label}`}
                  className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3"
                >
                  <p className="mb-2 text-sm font-semibold text-primary">
                    Bloque {entry.label} · superserie
                  </p>
                  <div className="flex flex-col gap-3">
                    {entry.blocks.map((block) => (
                      <ExerciseBlockCard
                        key={block.id}
                        block={block}
                        trailingSlot={renderBlockTrailing?.(block)}
                      />
                    ))}
                  </div>
                  {entry.blocks[entry.blocks.length - 1].groupRestSecs !== null && (
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      Descanso post-bloque: {entry.blocks[entry.blocks.length - 1].groupRestSecs}s
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </details>
      ))}
    </>
  )
}
```

- [ ] **Step 3: Create `RoutinePortalHeader`**

Create `components/portal/routine-portal-header.tsx`:

```tsx
import type { ReactNode } from "react"

export function RoutinePortalHeader({
  greetingLabel,
  title,
  subtitle,
  trailingSlot,
}: {
  greetingLabel: string
  title: string
  subtitle: string
  trailingSlot?: ReactNode
}) {
  return (
    <header className="bg-[#0d0d0d] px-4 py-5 text-white">
      <p className="text-sm text-white/60">{greetingLabel}</p>
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-white/60">{subtitle}</p>
      {trailingSlot}
    </header>
  )
}
```

- [ ] **Step 4: Create `NoRoutineAssignedMessage`**

Create `components/portal/no-routine-assigned-message.tsx`:

```tsx
import Link from "next/link"

export function NoRoutineAssignedMessage({
  greetingName,
  backHref,
  backLabel,
}: {
  greetingName: string
  backHref: string
  backLabel: string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-lg font-semibold">Hola, {greetingName}</p>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Todavía no tenés una rutina activa. Consultá con tu entrenador para que te
        asigne una.
      </p>
      <Link href={backHref} className="mt-6 text-sm text-primary hover:underline">
        {backLabel}
      </Link>
    </div>
  )
}
```

- [ ] **Step 5: Refactor `app/(portal)/rutina/[dni]/page.tsx` to use the shared components**

Replace the full contents of `app/(portal)/rutina/[dni]/page.tsx`. This drops the now-unused `Link`, `Play`, `ChevronDown`, `VideoDialog`, `groupConsecutiveBlocks`, `RoutineDetailBlock`, and `ProgressLogEntry` imports (their JSX/logic moved into the Task 9 shared components) and adds imports for those shared components:

```tsx
import { redirect } from "next/navigation"
import { dniSchema } from "@/lib/validators/portal"
import { studentService } from "@/lib/services/student.service"
import { assignedRoutineService } from "@/lib/services/assigned-routine.service"
import { progressLogService } from "@/lib/services/progress-log.service"
import { bodyWeightService } from "@/lib/services/body-weight.service"
import { BodyWeightInput } from "@/components/portal/body-weight-input"
import { DayWeightsDialogs } from "@/components/portal/day-weights-dialog"
import { ExerciseProgress } from "@/components/portal/exercise-progress"
import { RoutinePortalHeader } from "@/components/portal/routine-portal-header"
import { RoutineDayAccordion } from "@/components/portal/routine-day-accordion"
import { NoRoutineAssignedMessage } from "@/components/portal/no-routine-assigned-message"

// student's current active routine. Never cache across requests.
export const dynamic = "force-dynamic"

export default async function RutinaPage({
  params,
}: {
  params: Promise<{ dni: string }>
}) {
  const { dni: rawDni } = await params

  const parsed = dniSchema.safeParse(rawDni)
  if (!parsed.success) redirect("/?error=invalid")

  const student = await studentService.getByDni(parsed.data)
  if (!student || !student.isActive) redirect("/?error=not-found")

  const activeRoutine = await assignedRoutineService.getActiveByStudentId(student.id)

  if (!activeRoutine) {
    return (
      <NoRoutineAssignedMessage
        greetingName={student.firstName}
        backHref="/"
        backLabel="Volver a ingresar DNI"
      />
    )
  }

  const routine = await assignedRoutineService.getDetail(activeRoutine.id)
  if (!routine) redirect("/?error=not-found")

  const [todayProgress, todayBodyWeight] = await Promise.all([
    progressLogService.getForToday(student.id),
    bodyWeightService.getForToday(student.id),
  ])
  const progressByBlock = new Map(todayProgress.map((p) => [p.exerciseBlockId, p]))

  return (
    <div className="min-h-screen bg-[#efefef] pb-12 dark:bg-background">
      <RoutinePortalHeader
        greetingLabel="Hola,"
        title={`${student.firstName} ${student.lastName}`}
        subtitle={routine.templateName}
        trailingSlot={
          <BodyWeightInput dni={parsed.data} initialWeightKg={todayBodyWeight?.weightKg ?? null} />
        }
      />

      <main className="flex flex-col gap-3 px-3 py-4 sm:px-4">
        {routine.days.length === 0 && (
          <p className="text-center text-muted-foreground">
            Esta rutina todavía no tiene días cargados.
          </p>
        )}

        <RoutineDayAccordion
          days={routine.days}
          renderDayActions={(day) =>
            day.blocks.length > 0 ? (
              <DayWeightsDialogs
                dni={parsed.data}
                assignedRoutineId={routine.id}
                blocks={day.blocks}
                progressByBlock={progressByBlock}
              />
            ) : null
          }
          renderBlockTrailing={(block) => (
            <ExerciseProgress
              dni={parsed.data}
              assignedRoutineId={routine.id}
              exerciseBlockId={block.id}
              initialCompleted={progressByBlock.get(block.id)?.completed ?? false}
              initialWeightKg={progressByBlock.get(block.id)?.weightKg ?? null}
              initialNotes={progressByBlock.get(block.id)?.studentNotes ?? null}
              initialNoteType={progressByBlock.get(block.id)?.noteType ?? null}
              restSecs={block.restSecs}
            />
          )}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`
- Open `/rutina/<a known active student DNI>` → page renders identically to before the refactor (header, days, exercise cards, video dialog, progress toggle, body-weight input, rest timer on completion, superserie grouping).
- Open `/rutina/<a DNI with no active routine>` → shows the "no tenés rutina activa" message with the same copy as before.

- [ ] **Step 8: Commit**

```bash
git add components/portal/routine-portal-header.tsx components/portal/routine-day-accordion.tsx components/portal/exercise-block-card.tsx components/portal/no-routine-assigned-message.tsx "app/(portal)/rutina/[dni]/page.tsx"
git commit -m "$(cat <<'EOF'
refactor: extract shared portal routine components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Generic routine view page

**Files:**
- Create: `app/(portal)/rutina/generico/[level]/page.tsx`

**Interfaces:**
- Consumes: `genericLevelSchema`, `GENERIC_LEVEL_LABEL` (Task 3), `genericProfileService` (Task 5), `mapTemplateToRoutineDays` (Task 6), `routineTemplateService.getById` / `exerciseService.list` (existing, unchanged), `RoutinePortalHeader` / `RoutineDayAccordion` / `NoRoutineAssignedMessage` (Task 9).
- Produces: the `/rutina/generico/[level]` route — the redirect target from Task 8's portal entry.

- [ ] **Step 1: Create the page**

Create `app/(portal)/rutina/generico/[level]/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { exerciseService } from "@/lib/services/exercise.service"
import { mapTemplateToRoutineDays } from "@/lib/mappers/template-routine.mapper"
import { GENERIC_LEVEL_LABEL, genericLevelSchema } from "@/lib/validators/generic-profile"
import { RoutinePortalHeader } from "@/components/portal/routine-portal-header"
import { RoutineDayAccordion } from "@/components/portal/routine-day-accordion"
import { NoRoutineAssignedMessage } from "@/components/portal/no-routine-assigned-message"

// Assigned template can change at any time from the admin — never cache.
export const dynamic = "force-dynamic"

export default async function RutinaGenericaPage({
  params,
}: {
  params: Promise<{ level: string }>
}) {
  const { level: rawLevel } = await params
  const parsed = genericLevelSchema.safeParse(rawLevel)
  if (!parsed.success) redirect("/?error=not-found")

  const profile = await genericProfileService.getByLevel(parsed.data)
  const levelLabel = GENERIC_LEVEL_LABEL[parsed.data]

  if (!profile?.assignedTemplateId) {
    return (
      <NoRoutineAssignedMessage greetingName={levelLabel} backHref="/" backLabel="Volver al inicio" />
    )
  }

  const [template, exercises] = await Promise.all([
    routineTemplateService.getById(profile.assignedTemplateId),
    exerciseService.list({}),
  ])
  if (!template) redirect("/?error=not-found")

  const exerciseById = new Map(exercises.map((e) => [e.id, { name: e.name, videoUrl: e.videoUrl }]))
  const days = mapTemplateToRoutineDays(template, exerciseById)

  return (
    <div className="min-h-screen bg-[#efefef] pb-12 dark:bg-background">
      <RoutinePortalHeader greetingLabel="Hola," title={levelLabel} subtitle={template.name} />

      <main className="flex flex-col gap-3 px-3 py-4 sm:px-4">
        {days.length === 0 && (
          <p className="text-center text-muted-foreground">
            Esta rutina todavía no tiene días cargados.
          </p>
        )}
        <RoutineDayAccordion days={days} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
- From `/`, enter `olympia.basico` with no template assigned yet → redirected to `/rutina/generico/basico`, shows the "no tenés rutina activa" message.
- Via `prisma studio`, set `generic_profiles.assigned_template_id` for `basico` to an existing template's id. Reload `/rutina/generico/basico` → routine renders with days/exercises, no body-weight input, no progress toggle, no rest-timer button (none of those elements should be present).
- Enter `olympia.intermedio` / `olympia.avanzado` → each resolves to its own `/rutina/generico/<level>`.

- [ ] **Step 4: Commit**

```bash
git add "app/(portal)/rutina/generico"
git commit -m "$(cat <<'EOF'
feat: add generic student portal routine view

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Extract `TemplatePicker` + refactor `AsignarRutinaPage`

**Files:**
- Create: `components/admin/template-picker.tsx`
- Modify: `app/(admin)/alumnos/[id]/asignar/page.tsx`

**Interfaces:**
- Consumes: `RoutineTemplateWithDays` (`lib/repositories/interfaces.ts`, existing).
- Produces: `TemplatePicker({ templates, hrefForTemplate })`. Consumed by this task's refactor and by Task 12 (`alumnos-genericos/[level]/asignar`).

- [ ] **Step 1: Create `TemplatePicker`**

Create `components/admin/template-picker.tsx`:

```tsx
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { RoutineTemplateWithDays } from "@/lib/repositories/interfaces"

export function TemplatePicker({
  templates,
  hrefForTemplate,
}: {
  templates: RoutineTemplateWithDays[]
  hrefForTemplate: (templateId: string) => string
}) {
  if (templates.length === 0) {
    return <p className="text-muted-foreground">No hay plantillas creadas todavía.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <Link key={t.id} href={hrefForTemplate(t.id)}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t.name}
                <Badge variant="secondary">{t.durationWeeks} sem.</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {t.trainingDays.length} día(s) ·{" "}
                {t.trainingDays.reduce((sum, d) => sum + d.exerciseBlocks.length, 0)} ejercicio(s)
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Use it from `AsignarRutinaPage`**

In `app/(admin)/alumnos/[id]/asignar/page.tsx`, add the import:

```tsx
import { TemplatePicker } from "@/components/admin/template-picker"
```

Replace this block (the template-grid `<div>` inside the `if (!templateId)` branch):

```tsx
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/alumnos/${id}/asignar?template=${t.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {t.name}
                    <Badge variant="secondary">{t.durationWeeks} sem.</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {t.trainingDays.length} día(s) ·{" "}
                    {t.trainingDays.reduce((sum, d) => sum + d.exerciseBlocks.length, 0)}{" "}
                    ejercicio(s)
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
```

with:

```tsx
        <TemplatePicker templates={templates} hrefForTemplate={(templateId) => `/alumnos/${id}/asignar?template=${templateId}`} />
```

Remove the now-unused `Badge`, `Card`, `CardContent`, `CardHeader`, `CardTitle` imports from this file if nothing else in it still uses them (check the rest of the file first — it still uses `Link`).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (in particular, no unused-import errors if the project's eslint/tsconfig treats those as errors — remove any import that's no longer referenced).

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
- Open `/alumnos/<a student id>/asignar` → template grid renders exactly as before, clicking a template still navigates to the override form (`AssignmentForm`) and assignment still works end-to-end.

- [ ] **Step 5: Commit**

```bash
git add components/admin/template-picker.tsx "app/(admin)/alumnos/[id]/asignar/page.tsx"
git commit -m "$(cat <<'EOF'
refactor: extract TemplatePicker from AsignarRutinaPage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Admin UI — manage the 3 generic profiles

**Files:**
- Create: `components/admin/generic-password-form.tsx`
- Create: `components/admin/confirm-generic-assignment.tsx`
- Create: `app/(admin)/alumnos-genericos/page.tsx`
- Create: `app/(admin)/alumnos-genericos/[level]/asignar/page.tsx`
- Modify: `components/admin/admin-navbar.tsx`

**Interfaces:**
- Consumes: `genericProfileService` (Task 5), `assignGenericTemplateAction` / `updateGenericPasswordAction` (Task 7), `GENERIC_LEVEL_VALUES` / `GENERIC_LEVEL_LABEL` / `GenericLevelValue` (Task 3), `TemplatePicker` (Task 11), `routineTemplateService` (existing, unchanged).
- Produces: `/alumnos-genericos` and `/alumnos-genericos/[level]/asignar` admin routes; a new nav entry.

- [ ] **Step 1: `GenericPasswordForm`**

Create `components/admin/generic-password-form.tsx`:

```tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateGenericPasswordAction } from "@/lib/actions/generic-profile.actions"
import type { GenericLevelValue } from "@/lib/validators/generic-profile"

export function GenericPasswordForm({ level }: { level: GenericLevelValue }) {
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit() {
    setPending(true)
    setMessage(null)
    const result = await updateGenericPasswordAction({ level, password })
    setMessage(result.ok ? "Clave actualizada." : (result.error ?? "No se pudo actualizar."))
    if (result.ok) setPassword("")
    setPending(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`password-${level}`} className="text-xs">
        Nueva clave
      </Label>
      <div className="flex gap-2">
        <Input
          id={`password-${level}`}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="olympia.basico"
          className="h-9"
        />
        <Button type="button" size="sm" onClick={handleSubmit} disabled={pending || password.length < 8}>
          {pending ? "Guardando..." : "Cambiar"}
        </Button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  )
}
```

- [ ] **Step 2: `ConfirmGenericAssignment`**

Create `components/admin/confirm-generic-assignment.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { assignGenericTemplateAction } from "@/lib/actions/generic-profile.actions"
import type { GenericLevelValue } from "@/lib/validators/generic-profile"

export function ConfirmGenericAssignment({
  level,
  templateId,
  templateName,
}: {
  level: GenericLevelValue
  templateId: string
  templateName: string
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    const result = await assignGenericTemplateAction({ level, templateId })
    if (!result.ok) {
      setError(result.error ?? "No se pudo asignar la rutina.")
      setPending(false)
      return
    }
    router.push("/alumnos-genericos")
  }

  return (
    <div className="flex flex-col gap-3">
      <p>
        Vas a asignar <strong>{templateName}</strong> a este nivel.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleConfirm} disabled={pending}>
        {pending ? "Asignando..." : "Confirmar asignación"}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: `/alumnos-genericos` list page**

Create `app/(admin)/alumnos-genericos/page.tsx`:

```tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GenericPasswordForm } from "@/components/admin/generic-password-form"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { GENERIC_LEVEL_LABEL, GENERIC_LEVEL_VALUES } from "@/lib/validators/generic-profile"

// Assigned templates change from this page itself — always fetch fresh.
export const dynamic = "force-dynamic"

export default async function AlumnosGenericosPage() {
  const profiles = await genericProfileService.getAll()
  const profileByLevel = new Map(profiles.map((p) => [p.level, p]))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Alumnos genéricos</h1>
        <p className="text-muted-foreground">
          Accesos compartidos por nivel — cualquiera con la clave puede ver la rutina asignada.
        </p>
      </div>

      {GENERIC_LEVEL_VALUES.map((level) => {
        const profile = profileByLevel.get(level)
        return (
          <Card key={level}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {GENERIC_LEVEL_LABEL[level]}
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/alumnos-genericos/${level}/asignar`} />}
                >
                  {profile?.assignedTemplate ? "Cambiar rutina" : "Asignar rutina"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Rutina actual: {profile?.assignedTemplate?.name ?? "Sin asignar"}
              </p>
              <GenericPasswordForm level={level} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: `/alumnos-genericos/[level]/asignar` page**

Create `app/(admin)/alumnos-genericos/[level]/asignar/page.tsx`:

```tsx
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TemplatePicker } from "@/components/admin/template-picker"
import { ConfirmGenericAssignment } from "@/components/admin/confirm-generic-assignment"
import { genericProfileService } from "@/lib/services/generic-profile.service"
import { routineTemplateService } from "@/lib/services/routine-template.service"
import { GENERIC_LEVEL_LABEL, genericLevelSchema } from "@/lib/validators/generic-profile"

// DB-backed: profile + template catalog must be fresh on every visit.
export const dynamic = "force-dynamic"

export default async function AsignarRutinaGenericaPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>
  searchParams: Promise<{ template?: string }>
}) {
  const { level: rawLevel } = await params
  const { template: templateId } = await searchParams
  const parsed = genericLevelSchema.safeParse(rawLevel)
  if (!parsed.success) notFound()

  const profile = await genericProfileService.getByLevel(parsed.data)
  if (!profile) notFound()

  const levelLabel = GENERIC_LEVEL_LABEL[parsed.data]

  if (!templateId) {
    const templates = await routineTemplateService.list()

    return (
      <div className="mx-auto max-w-4xl">
        <Button
          variant="link"
          render={<Link href="/alumnos-genericos" />}
          className="mb-2 h-auto px-0"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <h1 className="mb-2 text-2xl font-semibold">Asignar rutina a {levelLabel}</h1>
        <p className="mb-6 text-muted-foreground">Elegí una plantilla del catálogo.</p>
        <TemplatePicker
          templates={templates}
          hrefForTemplate={(id) => `/alumnos-genericos/${parsed.data}/asignar?template=${id}`}
        />
      </div>
    )
  }

  const template = await routineTemplateService.getById(templateId)
  if (!template) notFound()

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 text-2xl font-semibold">Asignar rutina a {levelLabel}</h1>
      <ConfirmGenericAssignment level={parsed.data} templateId={template.id} templateName={template.name} />
    </div>
  )
}
```

- [ ] **Step 5: Add the nav link**

In `components/admin/admin-navbar.tsx`, change the icon import line:

```tsx
import { Menu, X, LayoutDashboard, Users, Dumbbell, Layers, LogOut, UserCog } from "lucide-react"
```

and add an entry to `NAV_LINKS` (after `"/alumnos"`):

```tsx
const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alumnos", label: "Alumnos", icon: Users },
  { href: "/alumnos-genericos", label: "Genéricos", icon: UserCog },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/plantillas", label: "Plantillas", icon: Layers },
]
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, log in as the trainer.
- `/alumnos-genericos` shows 3 cards (Básico/Intermedio/Avanzado) with the "Genéricos" link visible in the navbar.
- Click "Asignar rutina" on Básico → template grid → click a template → confirm screen → "Confirmar asignación" → redirected back to `/alumnos-genericos`, card now shows "Rutina actual: <template name>" and the button now says "Cambiar rutina".
- Change Básico's password via `GenericPasswordForm` (≥ 8 chars) → success message shown.
- From the public `/` page, the **old** `olympia.basico` password no longer works; the **new** one redirects to `/rutina/generico/basico` and shows the just-assigned routine.

- [ ] **Step 8: Commit**

```bash
git add components/admin/generic-password-form.tsx components/admin/confirm-generic-assignment.tsx "app/(admin)/alumnos-genericos" components/admin/admin-navbar.tsx
git commit -m "$(cat <<'EOF'
feat: add admin UI to manage generic student profiles

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
