# Generic Student Profiles — Design

## Problem

The student portal currently identifies a student only by DNI (`app/(portal)/page.tsx` →
`/rutina/[dni]`), which is fully DB-backed through `Student` / `AssignedRoutine`. There is no
way for an anonymous visitor (e.g. gym floor demo, walk-in) to view a routine without an
existing `Student` record.

## Goal

Add three shared, level-based access profiles — básico, intermedio, avanzado — that:
- log in with a coach-configurable password (seeded as `olympia.basico`, `olympia.intermedio`,
  `olympia.avanzado`)
- are usable by any number of people concurrently (not tied to one person)
- show a routine template the coach assigned to that level
- have no progress tracking and no body-weight logging
- do not create rows in the `Student` table

## Non-goals

- No session/cookie auth beyond what `/rutina/[dni]` already does (knowing the secret is
  the access control, same trust model as a known DNI).
- No per-profile customization/overrides of the assigned template (unlike `AssignedRoutine`,
  which supports per-block overrides for real students).
- No analytics, adherence tracking, or history for generic profiles.

## Data model

New Prisma model, decoupled from `Student` so generic profiles never pollute student lists,
CSV exports, or membership/adherence stats:

```prisma
enum GenericLevel {
  BASICO
  INTERMEDIO
  AVANZADO
}

model GenericProfile {
  id                 String           @id @default(cuid())
  level              GenericLevel     @unique
  passwordHash       String
  assignedTemplateId String?
  assignedTemplate   RoutineTemplate? @relation(fields: [assignedTemplateId], references: [id], onDelete: SetNull)
  updatedAt          DateTime         @updatedAt
}
```

Seed (`prisma/seed.ts`) upserts the 3 rows with bcrypt hashes of the default passwords
(`olympia.basico`, `olympia.intermedio`, `olympia.avanzado`), same bcrypt pattern already used
for `Trainer.passwordHash`. The coach can change each password later from the admin UI —
seed values are just the initial state, not a permanent constant.

## Auth flow

`app/(portal)/page.tsx` keeps one input field. The `lookup` server action:
1. If the value matches the existing DNI pattern (`dniSchema`), follow the current path
   unchanged (`studentService.getByDni` → `/rutina/[dni]`).
2. Otherwise, load all 3 `GenericProfile` rows and `bcrypt.compare` the entered value against
   each `passwordHash`. On a match, redirect to `/rutina/generico/[level]` (lowercase level
   slug). On no match, show the same generic "not found" error used today — the two failure
   paths (bad DNI vs. bad generic password) are indistinguishable to the visitor, same as
   today's DNI-not-found message.

`proxy.ts` needs no change: `pathname.startsWith("/rutina")` already treats the whole
`/rutina/*` subtree as public.

**Accepted security note:** once a level's routine is assigned, `/rutina/generico/basico` is a
guessable, unauthenticated URL for anyone who has ever seen it — identical risk posture to
`/rutina/[dni]` today (knowing a DNI is enough). This is a conscious continuation of the
existing trust model, not a new regression.

## Shared presentation components (container/presentational split)

`app/(portal)/rutina/[dni]/page.tsx` today mixes data-fetching and JSX in one file. Extract the
following presentational components so both the real-student and generic-student routine pages
reuse them instead of duplicating markup:

- `RoutinePortalHeader` — dark header block (greeting + level/name, template name subtitle).
  Accepts an optional trailing slot; only the real-student page passes `BodyWeightInput` there.
- `RoutineDayAccordion` — the `<details>`-per-day rendering plus superserie grouping
  (`groupConsecutiveBlocks`). Takes the day/block list and a per-block render slot.
- `ExerciseBlockCard` — exercise name, video dialog, sets/reps/rest/tempo/notes. Accepts an
  optional trailing slot; only the real-student page passes `ExerciseProgress` there.
- `NoRoutineAssignedMessage` — the "no tenés rutina activa todavía" screen, parameterized by
  greeting text and back-link href.

These components take the existing `RoutineDetailDay`/`RoutineDetailBlock` shape (currently in
`lib/services/assigned-routine.service.ts`) as props — that shape is reused as-is, not
duplicated, since it already has everything a read-only render needs.

Both `page.tsx` files stay thin containers:
- `app/(portal)/rutina/[dni]/page.tsx`: fetch student, active `AssignedRoutine`, today's
  progress/body-weight, merge overrides (unchanged logic), render shared components passing
  the tracking slots.
- `app/(portal)/rutina/generico/[level]/page.tsx` (new): validate `level` param against
  `GenericLevel`, fetch `GenericProfile` + its `assignedTemplate` (with `trainingDays` →
  `exerciseBlocks` → `exercise`), map directly to `RoutineDetailDay[]` (no override merge — a
  small mapper, not `mergeRoutineDetail`, since there is no `AssignedRoutineRaw`), render the
  same shared components with no tracking slots.

## Admin: assigning a routine per level

New page `app/(admin)/alumnos-genericos/page.tsx`: 3 fixed cards (básico/intermedio/avanzado),
each showing the currently assigned template name (or "Sin asignar"), a link to reassign, and a
small form to change that level's password (hashed with bcrypt before saving — reuses the same
`bcrypt.hash` call pattern as `prisma/seed.ts`).

Extract `TemplatePicker` (the "choose a template" card grid, currently embedded directly in
`app/(admin)/alumnos/[id]/asignar/page.tsx`) into a shared presentational component, reused by:
- `AsignarRutinaPage` (existing, real students) — container fetches `student` + `templates`.
- New `app/(admin)/alumnos-genericos/[level]/asignar/page.tsx` — container fetches
  `GenericProfile` + `templates`.

New service/repo/action layer, following the existing pattern (`StudentService` /
`IStudentRepository` / `*.actions.ts`):
- `lib/repositories/interfaces.ts`: add `IGenericProfileRepository`.
- `lib/repositories/generic-profile.repository.ts`: Prisma-backed implementation.
- `lib/services/generic-profile.service.ts`: `getAll()`, `getByLevel()`, `assignTemplate()`,
  `updatePassword()`, `verifyPassword()` (used by the portal auth flow).
- `lib/validators/generic-profile.ts`: level enum schema, password schema (reuse the trainer
  login's min-length rule).
- `lib/actions/generic-profile.actions.ts`: `assignGenericTemplateAction`,
  `updateGenericPasswordAction`.

## Testing

- Unit: `GenericProfileService.verifyPassword` matches/rejects correctly; template mapper
  produces the same shape `RoutineDayAccordion` expects.
- Integration/manual: portal lookup routes a DNI to `/rutina/[dni]` and a generic password to
  `/rutina/generico/[level]`; admin can reassign a template and change a password; a level with
  no assigned template shows `NoRoutineAssignedMessage`.
