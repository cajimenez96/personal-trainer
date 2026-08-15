# Planning — Personal Trainer Platform
### Metodología: Kanban · Agile

**Scrum Master:** —  
**Product Owner:** Cliente (Personal Trainer)  
**Equipo:** Desarrollo Full-Stack  
**Fecha de inicio:** Agosto 2026  
**Repositorio de referencia:** `producto.md` · `arquitectura.md` · `DESIGN.md`

---

## Tablero Kanban

```
┌─────────────┬─────────────┬──────────────┬─────────────┬──────────┐
│  BACKLOG    │   TO DO     │ IN PROGRESS  │   REVIEW    │   DONE   │
│             │ (priorizad) │   (WIP: 2)   │             │          │
└─────────────┴─────────────┴──────────────┴─────────────┴──────────┘
```

> **WIP Limit:** máximo 2 tickets en "In Progress" simultáneamente.  
> **Definition of Done:** código mergeado en `main`, revisión de código aprobada, criterios de aceptación verificados manualmente.

---

## Épicas

| ID | Nombre | Descripción | Prioridad |
|---|---|---|---|
| **EP-01** | Infraestructura | Setup del proyecto, DB, CI/CD base | 🔴 Crítica |
| **EP-02** | Autenticación Admin | Login seguro del trainer | 🔴 Crítica |
| **EP-03** | Gestión de Alumnos | CRUD completo de alumnos | 🔴 Crítica |
| **EP-04** | Biblioteca de Ejercicios | Catálogo de ejercicios gestionable | 🔴 Crítica |
| **EP-05** | Plantillas de Rutinas | Creación y gestión de plantillas | 🔴 Crítica |
| **EP-06** | Asignación de Rutinas | Individual y masiva | 🟡 Alta |
| **EP-07** | Portal del Alumno | Acceso por DNI y vista de rutina | 🔴 Crítica |
| **EP-08** | Registro de Progreso | Logging de pesos, checks y notas | 🟡 Alta |
| **EP-09** | Importación Masiva | CSV/Excel upload con validación | 🟢 Media |
| **EP-10** | Marca e Identidad Visual | Rediseño de UI anclado al logo real + ajustes de datos y documentación | 🟡 Alta |
| **EP-11** | Puesta en Marcha (Entorno Real) | Sincronización con la base de datos real de Neon y verificación end-to-end | 🔴 Crítica |
| **EP-12** | Correcciones Post-QA | Bugs y mejoras encontrados probando la app real | 🟡 Alta |

---

## Historias de Usuario

### 🏗️ EP-01 — Infraestructura

---

#### HU-01 · Setup del Proyecto
> **Como** desarrollador,  
> **quiero** tener el proyecto scaffoldeado con Next.js 16, Tailwind v4, shadcn/ui, Prisma y las variables de entorno configuradas,  
> **para** que el equipo pueda arrancar a desarrollar features sin fricción.

**Story Points:** 3  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Proyecto creado con `npx shadcn@latest init -t next`
- [x] Prisma instalado y conectado a PostgreSQL (Neon) en local
- [x] `globals.css` con tokens de `DESIGN.md` mapeados a variables shadcn
- [x] `.env.example` documentado con todas las variables requeridas (`.env.local` no aplica en este setup — ver nota abajo)
- [x] `proxy.ts` configurado para proteger rutas `/(admin)/*` (Next 16 renombró `middleware.ts` → `proxy.ts`)
- [x] `.env` conectado a la instancia real de Neon (`DATABASE_URL`) y `NEXTAUTH_SECRET` generado — dependencias instaladas (`npm install`) y `prisma generate` corriendo limpio contra el schema actual
- [ ] Deploy inicial en Vercel funcionando — pendiente, a cargo del cliente/trainer
- [x] `README.md` con instrucciones de setup local

**Resumen de la implementación:**
Scaffold verificado y corregido: se agregaron dependencias faltantes (`bcryptjs`, `zod`) que ya se usaban en el código sin estar declaradas, se corrigió el cliente de Prisma 7 (import + driver adapter `@prisma/adapter-pg`, requerido desde v7), y se migró `middleware.ts` → `proxy.ts` porque el archivo viejo corría en Edge Runtime y crasheaba al importar Prisma (Next 16 deprecó `middleware.ts`; `proxy.ts` corre en Node.js por default). Repo Git inicializado.

**Archivos modificados/creados:**
`package.json` · `lib/db.ts` · `proxy.ts` · `README.md` · `.env` · `.env.example` · `docs/arquitectura.md`

---

#### HU-02 · Schema de Base de Datos
> **Como** desarrollador,  
> **quiero** tener el schema de Prisma completo y la primera migración aplicada,  
> **para** que todas las tablas estén disponibles desde el inicio del desarrollo.

**Story Points:** 3  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-01

**Criterios de Aceptación:**
- [x] `prisma/schema.prisma` define todas las entidades: `Trainer`, `Student`, `Exercise`, `RoutineTemplate`, `TrainingDay`, `ExerciseBlock`, `AssignedRoutine`, `RoutineOverride`, `ProgressLog`
- [x] Todos los enums definidos: `Objetivo`, `Nivel`, `Modalidad`, `RoutineStatus`
- [x] Índices creados: `idx_students_dni`, `idx_assigned_routines_student_status`
- [x] Partial unique index para una sola rutina activa por alumno (RN-04)
- [x] `prisma migrate dev` ejecuta sin errores
- [x] Seed básico con un trainer de prueba

**Resumen de la implementación:**
Schema completo aplicado contra Neon. Bug encontrado y corregido durante HU-12: el índice parcial de RN-04 se había declarado como `@@unique` normal (sin `WHERE status='active'`) porque el DSL de Prisma no soporta índices parciales — bloqueaba cualquier reasignación de rutina. Se corrigió con SQL crudo en una migración (`partial_unique_active_routine`).

**Archivos modificados/creados:**
`prisma/schema.prisma` · `prisma/migrations/20260814142609_init/` · `prisma/migrations/20260814211846_partial_unique_active_routine/` · `prisma/seed.ts` · `prisma.config.ts`

---

### 🔐 EP-02 — Autenticación Admin

---

#### HU-03 · Login del Trainer
> **Como** trainer,  
> **quiero** poder iniciar sesión con mi email y contraseña,  
> **para** acceder de forma segura al panel de administración.

**Story Points:** 3  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-01, HU-02

**Criterios de Aceptación:**
- [x] Pantalla de login con campos email y contraseña usando componentes shadcn (`Input`, `Button`, `Card`)
- [x] Autenticación implementada con Auth.js v5
- [x] Credenciales incorrectas muestran mensaje de error claro
- [x] Sesión persiste entre navegaciones
- [x] Logout disponible desde el panel
- [x] Rutas `/(admin)/*` redirigen a login si no hay sesión activa
- [x] Password hasheada (bcrypt via Auth.js), nunca en texto plano

**Resumen de la implementación:**
Route handler de Auth.js, pantalla de login con Server Action (credenciales inválidas → redirect con mensaje), layout admin con nav + logout, y `proxy.ts` corregido: como `(admin)` y `(portal)` son route groups no agregan prefijo a la URL, el guard protege todo excepto las rutas públicas explícitas (`/`, `/login`, `/rutina/*`, `api/auth`).

**Archivos modificados/creados:**
`app/api/auth/[...nextauth]/route.ts` · `app/login/page.tsx` · `app/(admin)/layout.tsx` · `app/(admin)/dashboard/page.tsx` · `proxy.ts` · `components/ui/input.tsx` · `components/ui/card.tsx` · `components/ui/label.tsx`

---

### 👥 EP-03 — Gestión de Alumnos

---

#### HU-04 · Listado de Alumnos
> **Como** trainer,  
> **quiero** ver la lista de todos mis alumnos con sus datos básicos y estado de cuota,  
> **para** tener una visión rápida de mi cartera de clientes.

**Story Points:** 3  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-03

**Criterios de Aceptación:**
- [x] Tabla paginada (cursor-based) con: Nombre, DNI, Objetivo, Nivel, Estado de cuota
- [x] Indicador visual de cuota vencida (fecha expirada en rojo)
- [x] Filtros por: Objetivo, Nivel, Modalidad, estado activo/inactivo
- [x] Búsqueda por nombre o DNI
- [x] Acceso rápido a la ficha individual desde cada fila
- [x] Diseño responsivo con shadcn `Table` + `Badge` para categorías

**Resumen de la implementación:**
Capas repository/service/validator para `Student` (patrón reutilizado en el resto de las entidades). Paginación cursor-based real (no offset). Filtros y búsqueda vía formulario GET server-rendered, sin JS.

**Archivos modificados/creados:**
`lib/repositories/interfaces.ts` · `lib/repositories/student.repository.ts` · `lib/services/student.service.ts` · `lib/validators/student.ts` · `app/(admin)/alumnos/page.tsx` · `components/ui/table.tsx` · `components/ui/badge.tsx` · `components/ui/select.tsx`

---

#### HU-05 · Crear Alumno
> **Como** trainer,  
> **quiero** poder registrar un nuevo alumno con sus datos completos,  
> **para** incorporarlo al sistema y poder asignarle rutinas.

**Story Points:** 3  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-04

**Criterios de Aceptación:**
- [x] Formulario con campos: Nombre\*, Apellido\*, DNI\*, Email, Teléfono, Objetivo, Nivel, Modalidad, Fecha venc. cuota, Notas de salud (\* = obligatorio)
- [x] Validación: DNI único (error claro si ya existe), campos obligatorios
- [x] Validación de formato con Zod en cliente y servidor
- [x] Confirmación visual de creación exitosa (toast)
- [x] Redirige al listado tras crear
- [x] Diseño con shadcn `Dialog` o página dedicada (se optó por página dedicada)

**Resumen de la implementación:**
Server Action con Zod compartido cliente/servidor (mismo schema validado en `onSubmit` antes de enviar y de nuevo en el servidor). Unicidad de DNI verificada en el servicio. Toast vía `sonner` con redirect a `/alumnos?created=1`.

**Archivos modificados/creados:**
`lib/actions/student.actions.ts` · `components/admin/student-form.tsx` · `components/admin/flash-toast.tsx` · `app/(admin)/alumnos/nuevo/page.tsx` · `lib/services/student.service.ts` (create + DniAlreadyExistsError) · `components/ui/textarea.tsx` · `components/ui/sonner.tsx`

---

#### HU-06 · Editar Alumno
> **Como** trainer,  
> **quiero** poder actualizar los datos de un alumno existente,  
> **para** mantener su información siempre actualizada.

**Story Points:** 2  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-05

**Criterios de Aceptación:**
- [x] Formulario pre-cargado con los datos actuales del alumno
- [x] El DNI no puede modificarse (es el identificador único público)
- [x] Cambios se persisten y se refleja en el listado inmediatamente
- [x] Confirmación visual con toast de éxito/error

**Resumen de la implementación:**
`StudentForm` reutilizado en modo `create`/`edit`. El DNI no es editable estructuralmente: `updateStudentSchema` lo omite del schema (`.omit({ dni: true })`), no solo deshabilitado en la UI.

**Archivos modificados/creados:**
`app/(admin)/alumnos/[id]/page.tsx` · `lib/actions/student.actions.ts` (updateStudentAction) · `lib/services/student.service.ts` (update, getById) · `lib/validators/student.ts` (updateStudentSchema) · `components/admin/student-form.tsx` (modo edit)

---

#### HU-07 · Desactivar Alumno (Soft Delete)
> **Como** trainer,  
> **quiero** poder desactivar un alumno que dejó de entrenar conmigo,  
> **para** que no aparezca en el listado activo sin perder su historial.

**Story Points:** 1  
**Prioridad:** 🟡 Alta  
**Estado:** `DONE`  
**Depende de:** HU-06

**Criterios de Aceptación:**
- [x] Botón "Desactivar" con confirmación (`AlertDialog`)
- [x] Alumno desactivado: `is_active = false`, no aparece en el listado por defecto
- [x] El portal de acceso por DNI rechaza el acceso de alumnos desactivados
- [x] El trainer puede ver alumnos inactivos con un toggle en el filtro (ya cubierto por el filtro "Estado" de HU-04)

**Resumen de la implementación:**
Soft delete simple (`isActive = false`). El portal (`/rutina/[dni]`, HU-15) valida `student.isActive` antes de mostrar cualquier rutina.

**Archivos modificados/creados:**
`components/admin/deactivate-student-button.tsx` · `lib/actions/student.actions.ts` (deactivateStudentAction) · `lib/services/student.service.ts` (deactivate) · `lib/repositories/student.repository.ts` (deactivate) · `components/ui/alert-dialog.tsx`

---

### 🏋️ EP-04 — Biblioteca de Ejercicios

---

#### HU-08 · Listado y Búsqueda de Ejercicios
> **Como** trainer,  
> **quiero** ver el catálogo de ejercicios disponibles con sus datos y filtros,  
> **para** tener una referencia rápida al armar rutinas.

**Story Points:** 2  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-03

**Criterios de Aceptación:**
- [x] Listado con: Nombre, Músculo primario, Músculo secundario, indicador de video disponible
- [x] Búsqueda por nombre
- [x] Filtro por grupo muscular
- [x] Acceso a link de video (abre en nueva pestaña)

**Resumen de la implementación:**
Grupo muscular no es un enum en el schema (texto libre), así que el filtro se arma con los valores distintos de `primaryMuscle` ya existentes en la base (`listMuscleGroups`).

**Archivos modificados/creados:**
`lib/repositories/exercise.repository.ts` · `lib/services/exercise.service.ts` · `lib/validators/exercise.ts` · `app/(admin)/ejercicios/page.tsx`

---

#### HU-09 · Crear y Editar Ejercicio
> **Como** trainer,  
> **quiero** agregar y editar ejercicios en mi biblioteca,  
> **para** mantener el catálogo actualizado con los ejercicios que uso en mis rutinas.

**Story Points:** 2  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-08

**Criterios de Aceptación:**
- [x] Formulario: Nombre\*, Músculo principal\*, Músculo secundario, URL de video
- [x] Validación de URL de video (formato válido de YouTube/Vimeo)
- [x] Nombre único dentro del catálogo
- [x] Formulario reutilizable para crear y editar
- [x] Eliminación solo si el ejercicio no está referenciado en ninguna plantilla activa

**Resumen de la implementación:**
El schema no tiene un concepto de "plantilla activa" (`RoutineTemplate` no tiene status), así que la protección de borrado es: no se puede eliminar si el ejercicio está referenciado en algún `exercise_block` de cualquier plantilla (`countBlocksUsing`). Confirmación con `AlertDialog`.

**Archivos modificados/creados:**
`lib/actions/exercise.actions.ts` · `components/admin/exercise-form.tsx` · `components/admin/delete-exercise-button.tsx` · `app/(admin)/ejercicios/nuevo/page.tsx` · `app/(admin)/ejercicios/[id]/page.tsx` · `lib/services/exercise.service.ts` (create/update/delete + ExerciseNameTakenError)

---

### 📋 EP-05 — Plantillas de Rutinas

---

#### HU-10 · Crear Plantilla de Rutina
> **Como** trainer,  
> **quiero** crear plantillas de rutinas estructuradas por días con ejercicios,  
> **para** reutilizarlas en múltiples alumnos sin tener que armar cada rutina desde cero.

**Story Points:** 8  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-09

**Criterios de Aceptación:**
- [x] Formulario de plantilla: Nombre\*, Descripción, Duración en semanas
- [x] Agregar días de entrenamiento con etiqueta (ej. "Día 1 – Tren Superior")
- [x] Por cada día: agregar ejercicios de la biblioteca con Series\*, Repeticiones, Duración (seg), Descanso (seg), Notas del trainer
- [x] Drag-and-drop o flechas para reordenar ejercicios dentro de un día (se implementó con flechas ↑↓, opción válida según el criterio)
- [x] Vista previa de la plantilla completa antes de guardar
- [x] Guardado parcial (borrador) sin necesidad de completar todos los días

**Resumen de la implementación:**
`TemplateBuilder`: componente cliente con estado local (días/bloques anidados), guardado vía Server Action invocada directamente (no `<form>`, por la estructura anidada). Creación con Prisma nested writes en una sola transacción. Bug encontrado y corregido: `/plantillas` y `/plantillas/nuevo` quedaban pre-renderizadas estáticamente en build pese a leer de la DB (Prisma no fuerza render dinámico) — se agregó `export const dynamic = "force-dynamic"`.

**Archivos modificados/creados:**
`lib/repositories/routine-template.repository.ts` · `lib/services/routine-template.service.ts` · `lib/validators/routine-template.ts` · `lib/actions/routine-template.actions.ts` · `components/admin/template-builder.tsx` · `app/(admin)/plantillas/page.tsx` · `app/(admin)/plantillas/nuevo/page.tsx` · `app/(admin)/layout.tsx` (nav)

---

#### HU-11 · Editar y Duplicar Plantilla
> **Como** trainer,  
> **quiero** poder editar una plantilla existente o duplicarla para crear variantes,  
> **para** agilizar la creación de nuevas rutinas sin partir de cero.

**Story Points:** 5  
**Prioridad:** 🟡 Alta  
**Estado:** `DONE`  
**Depende de:** HU-10

**Criterios de Aceptación:**
- [x] Edición de plantilla base no afecta rutinas ya asignadas a alumnos (RN-02)
- [x] Opción "Duplicar plantilla" crea una copia independiente con nombre "Copia de [nombre]"
- [x] La copia es completamente editable sin afectar el original
- [x] Confirmación al editar una plantilla que tiene alumnos asignados (solo informativa, no bloqueante)

**Resumen de la implementación:**
Edición = reemplazo completo de días/bloques dentro de una transacción (`deleteMany` + `create` anidado). Duplicado = lectura completa de la plantilla origen + creación de una nueva con `Copia de {nombre}`. Banner informativo (no bloqueante) cuando `countAssignments(id) > 0`.

**Archivos modificados/creados:**
`lib/repositories/routine-template.repository.ts` (findById, update, duplicate, countAssignments) · `lib/services/routine-template.service.ts` · `lib/actions/routine-template.actions.ts` (updateTemplateAction, duplicateTemplateAction) · `components/admin/template-builder.tsx` (modo edit) · `components/admin/duplicate-template-button.tsx` · `app/(admin)/plantillas/[id]/page.tsx`

---

### 📌 EP-06 — Asignación de Rutinas

---

#### HU-12 · Asignación Individual de Rutina
> **Como** trainer,  
> **quiero** asignar una plantilla a un alumno específico y personalizarla si es necesario,  
> **para** que el alumno reciba una rutina adaptada a su nivel sin modificar la plantilla base.

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-10, HU-05

**Criterios de Aceptación:**
- [x] Desde la ficha del alumno: seleccionar una plantilla del catálogo
- [x] Opción de personalizar ejercicios individuales (series, reps, notas) sin tocar la plantilla base (RN-02)
- [x] Al asignar: rutina anterior pasa automáticamente a estado "Histórico" (RN-04)
- [x] Solo puede haber una rutina en estado "Activa" por alumno (validado a nivel DB y servicio)
- [x] Fecha de inicio registrada, fecha de vencimiento calculada desde `duration_weeks`
- [x] Notificación visual de éxito

**Resumen de la implementación:**
Flujo en 2 pasos: picker de plantilla → formulario de personalización por bloque (`RoutineOverride`, campos en blanco = usa el valor de la plantilla). `assign()` corre en una transacción: democión de la rutina activa anterior + creación de la nueva, protegido por el índice único parcial de RN-04 (ver bug corregido en HU-02).

**Archivos modificados/creados:**
`lib/repositories/assigned-routine.repository.ts` · `lib/services/assigned-routine.service.ts` · `lib/validators/assignment.ts` · `lib/actions/assignment.actions.ts` · `components/admin/assignment-form.tsx` · `app/(admin)/alumnos/[id]/asignar/page.tsx` · `app/(admin)/alumnos/[id]/page.tsx` (card de rutina activa)

---

#### HU-13 · Asignación Masiva por Categoría
> **Como** trainer,  
> **quiero** asignar una plantilla a todos los alumnos de una categoría en una sola operación,  
> **para** ahorrar tiempo cuando incorporo un nuevo bloque de entrenamiento para un grupo.

**Story Points:** 5  
**Prioridad:** 🟡 Alta  
**Estado:** `DONE`  
**Depende de:** HU-12

**Criterios de Aceptación:**
- [x] Selección de plantilla + filtro de alumnos (por Objetivo, Nivel, Modalidad o combinación)
- [x] Vista previa de cuántos alumnos serán afectados antes de confirmar
- [x] Confirmación con `AlertDialog` mostrando la cantidad de afectados
- [x] Procesamiento en chunks sin bloquear la UI (feedback de progreso)
- [x] Reporte al finalizar: X asignaciones exitosas / Y errores (con detalle)

**Resumen de la implementación:**
Filtros server-rendered (GET) + preview de alumnos afectados. Confirmación abre `AlertDialog`, y al confirmar el cliente procesa en chunks de 50 (mismo tamaño que HU-20/21), llamando al Server Action una vez por chunk para no bloquear la UI y mostrar progreso "X/Y". Cada asignación dentro del chunk tiene su propio try/catch — un fallo individual no aborta el resto del lote.

**Archivos modificados/creados:**
`lib/actions/bulk-assignment.actions.ts` · `components/admin/bulk-assign-runner.tsx` · `app/(admin)/plantillas/[id]/asignar-masivo/page.tsx` · `lib/repositories/student.repository.ts` (findAllActive) · `lib/services/student.service.ts` (listAllActive) · `lib/validators/student.ts` (labels exportados) · `app/(admin)/plantillas/[id]/page.tsx` (entry point)

---

#### HU-14 · Ver Historial de Rutinas de un Alumno
> **Como** trainer,  
> **quiero** ver todas las rutinas que tuvo asignadas un alumno (activa e históricas),  
> **para** hacer seguimiento de su evolución y progresión.

**Story Points:** 2  
**Prioridad:** 🟢 Media  
**Estado:** `DONE`  
**Depende de:** HU-12

**Criterios de Aceptación:**
- [x] Sección en la ficha del alumno con listado cronológico de rutinas
- [x] Indicador visual de estado: Activa / Histórico
- [x] Acceso a la rutina histórica en modo solo lectura

**Resumen de la implementación:**
`getDetail(id)` fusiona la plantilla base con los overrides de esa asignación (mismo mecanismo que usará el portal en HU-16). La página de detalle valida que la rutina pertenezca al alumno de la URL antes de mostrarla.

**Archivos modificados/creados:**
`lib/repositories/assigned-routine.repository.ts` (findByIdWithDetails) · `lib/services/assigned-routine.service.ts` (getDetail, merge de overrides) · `app/(admin)/alumnos/[id]/rutinas/[routineId]/page.tsx` · `app/(admin)/alumnos/[id]/page.tsx` (sección historial)

---

### 📱 EP-07 — Portal del Alumno

---

#### HU-15 · Acceso por DNI
> **Como** alumno,  
> **quiero** acceder a mi rutina ingresando únicamente mi número de DNI,  
> **para** ver mi entrenamiento del día sin necesidad de recordar contraseñas.

**Story Points:** 3  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-12

**Criterios de Aceptación:**
- [x] Pantalla mobile-first con campo de DNI prominente
- [x] Diseño con paleta rojo/blanco del DESIGN.md, tipografía Inter
- [x] DNI validado y sanitizado antes de cualquier query
- [x] Si el DNI no existe o el alumno está inactivo: mensaje de error amigable (mismo mensaje para ambos casos, no revela cuál)
- [x] Si el alumno no tiene rutina activa: mensaje indicando que contacte al trainer
- [ ] Tiempo de respuesta < 1.5s en conexión 4G (RNF-02) — no verificado con load-test real; la query es simple (lookup indexado por DNI)
- [x] No se almacena sesión persistente del alumno (stateless por diseño, `force-dynamic` en toda la ruta)

**Resumen de la implementación:**
Implementada junto con HU-16 (misma página/ruta, misma lógica de validación — separarlas en dos pasadas hubiera sido redundante). `app/page.tsx` (placeholder de `create-next-app`) se reemplazó por `app/(portal)/page.tsx`. DNI se sanitiza (`replace(/\D/g,"")`) y valida (7-9 dígitos) tanto en la entrada como de nuevo en `/rutina/[dni]` (la ruta es bookmarkeable, no se puede confiar en que siempre se llegue vía el formulario).

**Archivos modificados/creados:**
`app/(portal)/page.tsx` (nuevo, reemplaza `app/page.tsx`) · `lib/validators/portal.ts` · `lib/services/student.service.ts` (getByDni)

---

#### HU-16 · Vista de Rutina Activa
> **Como** alumno,  
> **quiero** ver mi rutina activa organizada por días con todos los detalles de cada ejercicio,  
> **para** saber exactamente qué hacer en el gimnasio.

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-15

**Criterios de Aceptación:**
- [x] Vista organizada por días/bloques con tabs o acordeón (se usó acordeón nativo `<details>`, primer día abierto por default)
- [x] Por cada ejercicio: Nombre, Series, Repeticiones o Duración, Descanso sugerido, Notas del trainer
- [x] Link de video demostrativo (abre YouTube/Vimeo en nueva pestaña)
- [x] Diseño mobile-first con elementos táctiles ≥ 44px (RNF-01)
- [x] Los overrides individuales del trainer se muestran en lugar de los valores de la plantilla base
- [x] Nombre del alumno visible en el header para confirmar identidad
- [x] Alto contraste, legible en ambientes de gimnasio (luz intensa)

**Resumen de la implementación:**
Implementada junto con HU-15 en `app/(portal)/rutina/[dni]/page.tsx`, reutilizando `assignedRoutineService.getDetail()` de HU-14 (mismo merge de overrides). Acordeón con `<details>`/`<summary>` nativo — sin JS ni dependencia extra, alineado con el objetivo de carga rápida en 4G.

**Archivos modificados/creados:**
`app/(portal)/rutina/[dni]/page.tsx`

---

### 📊 EP-08 — Registro de Progreso

---

#### HU-17 · Marcar Ejercicio Completado y Registrar Peso
> **Como** alumno,  
> **quiero** marcar cada ejercicio como completado y registrar el peso que utilicé,  
> **para** tener un historial de mis cargas y poder ver mi progresión.

**Story Points:** 5  
**Prioridad:** 🟡 Alta  
**Estado:** `DONE`  
**Depende de:** HU-16

**Criterios de Aceptación:**
- [x] Checkbox grande y táctil por ejercicio (≥ 44px)
- [x] Campo numérico para peso en kg por ejercicio
- [x] El progreso se guarda automáticamente (sin botón "guardar" explícito) o con debounce
- [x] Registro asociado a la fecha actual del día
- [x] Un solo registro por ejercicio por día (UNIQUE constraint)
- [x] Al volver al día, los datos previos están precargados
- [x] Estado visual claro: completado ✅ / pendiente ⬜

**Resumen de la implementación:**
`ProgressLog.upsert` sobre el unique compuesto (`studentId`, `exerciseBlockId`, `loggedDate`). Checkbox guarda al toque, peso con debounce de 600ms. Como es una ruta pública sin sesión, el Server Action nunca confía en un `studentId` del cliente: re-deriva todo desde el DNI (re-validado) y verifica que el `exerciseBlockId` realmente pertenezca a la rutina activa de ese alumno antes de escribir.

**Archivos modificados/creados:**
`lib/repositories/progress-log.repository.ts` · `lib/services/progress-log.service.ts` (incl. `todayUTC`) · `lib/actions/progress.actions.ts` · `components/portal/exercise-progress.tsx` · `app/(portal)/rutina/[dni]/page.tsx` (prefill)

---

#### HU-18 · Agregar Notas de Sesión
> **Como** alumno,  
> **quiero** dejar una nota de feedback por ejercicio,  
> **para** comunicarle al trainer sensaciones, molestias o sustituciones que hice.

**Story Points:** 2  
**Prioridad:** 🟡 Alta  
**Estado:** `DONE`  
**Depende de:** HU-17

**Criterios de Aceptación:**
- [x] Campo de texto libre por ejercicio (expandible al hacer tap)
- [x] Guardado junto al registro de peso/completado
- [x] Placeholder sugerido: "Ej: molestia en hombro derecho, bajé el peso a 20kg"
- [x] Texto limitado a 500 caracteres

**Resumen de la implementación:**
Extiende `ExerciseProgress` (HU-17): botón "+ Agregar nota" colapsado por default, se expande al tocar (o queda expandido si ya hay una nota previa). Guardado con el mismo debounce y mismo Server Action que peso/completado. Límite de 500 caracteres validado en cliente (`maxLength`) y servidor (Zod).

**Archivos modificados/creados:**
`lib/actions/progress.actions.ts` (studentNotes) · `components/portal/exercise-progress.tsx` (textarea expandible)

---

#### HU-19 · Ver Progreso del Alumno (Admin)
> **Como** trainer,  
> **quiero** ver el progreso registrado por un alumno en sus sesiones,  
> **para** hacer seguimiento de su evolución y ajustar la rutina si es necesario.

**Story Points:** 3  
**Prioridad:** 🟢 Media  
**Estado:** `DONE`  
**Depende de:** HU-17

**Criterios de Aceptación:**
- [x] Desde la ficha del alumno: sección de progreso con historial por fecha (botón "Ver progreso" en la card de Rutina)
- [x] Por cada sesión: ejercicios completados, pesos usados, notas del alumno
- [x] Listado cronológico agrupado por fecha (se optó por listado, no calendario — consistente con el patrón ya usado en HU-14 para historial de rutinas)
- [x] Filtro por rango de fechas (`from`/`to`, GET server-rendered, sin JS)

**Resumen de la implementación:**
`ProgressLogRepository.findByStudent` nuevo (join con `exerciseBlock.exercise` para el nombre), agrupado por fecha en la propia página (sin lógica extra en el servicio). Badge `success`/`secondary` para completado/pendiente — reutiliza la variante agregada en HU-23. Verificado con Playwright contra datos reales (checkbox + peso cargados desde el portal, visibles inmediatamente en el historial admin).

**Archivos modificados/creados:**
`lib/repositories/interfaces.ts` (`ProgressHistoryEntry`, `findByStudent`) · `lib/repositories/progress-log.repository.ts` · `lib/services/progress-log.service.ts` (`getHistory`) · `lib/validators/progress-history.ts` (nuevo) · `app/(admin)/alumnos/[id]/progreso/page.tsx` (nuevo) · `app/(admin)/alumnos/[id]/page.tsx` (link "Ver progreso")

---

### 📤 EP-09 — Importación Masiva (CSV)

---

#### HU-20 · Importar Alumnos desde CSV
> **Como** trainer,  
> **quiero** cargar un archivo CSV para registrar múltiples alumnos de una vez,  
> **para** no tener que ingresarlos uno por uno cuando migro de otro sistema.

**Story Points:** 8  
**Prioridad:** 🟢 Media  
**Estado:** `DONE`  
**Depende de:** HU-05

**Criterios de Aceptación:**
- [x] Upload de archivo CSV desde el panel admin (`/alumnos/importar`) — Excel no soportado, solo CSV (no estaba en el criterio original de forma obligatoria y agrega complejidad de parsing binario)
- [x] Columnas esperadas documentadas en la página + botón "Descargar plantilla" (genera el CSV vía Blob, sin endpoint nuevo)
- [x] Validación del archivo completo ANTES de importar: reutiliza `createStudentSchema` (mismo validador que HU-05) por fila + detección de DNI duplicado dentro del archivo + chequeo de DNI ya existente en la DB (`checkExistingDnisAction`, una sola query `IN`)
- [x] Reporte de errores con número de fila (ajustado por el header) y descripción del problema
- [x] Si hay errores: no se importa nada — la validación completa corre antes de habilitar el botón de importar
- [x] Procesamiento en chunks de 50 registros (`importStudentsChunkAction`, mismo patrón que HU-13)
- [x] Feedback de progreso "X/Y" durante la importación (mismo patrón que `BulkAssignRunner`)
- [x] Reporte final: X alumnos importados / Y omitidos (con detalle por DNI)

**Resumen de la implementación:**
Se agregó `papaparse` como dependencia (parsing CSV correcto con comillas/escapes — no vale la pena reimplementarlo a mano para algo que persiste datos reales). El validador de fila reutiliza `createStudentSchema` de HU-05 en vez de duplicar reglas. Verificado: lógica de parseo+validación probada contra fixtures válidos e inválidos, UI probada en browser real (Playwright) confirmando que el chequeo de DNI contra la Neon real funciona (el botón de importar solo se habilita si no hay conflictos), y el flujo de creación/rechazo de duplicados verificado directamente contra la DB real. El paso final de "click en confirmar del `AlertDialog`" no se pudo automatizar con Playwright (problema de eventos pointer vs. click sintético de Base UI, no relacionado al código) — se verificó el mismo código (`studentService.create`) directamente contra la base.

**Archivos modificados/creados:**
`package.json` (papaparse) · `lib/actions/student-import.actions.ts` (nuevo) · `components/admin/student-import-runner.tsx` (nuevo) · `components/admin/download-csv-template-button.tsx` (nuevo) · `app/(admin)/alumnos/importar/page.tsx` (nuevo) · `app/(admin)/alumnos/page.tsx` (link)

---

#### HU-21 · Importar Rutinas desde CSV
> **Como** trainer,  
> **quiero** importar ejercicios y bloques de rutinas desde un archivo estructurado,  
> **para** poblar rápidamente el catálogo y las plantillas.

**Story Points:** 8  
**Prioridad:** 🟢 Media  
**Estado:** `DONE`  
**Depende de:** HU-10, HU-20

**Criterios de Aceptación:**
- [x] Formato CSV documentado en `/plantillas/importar` + botón "Descargar plantilla" — una fila = un ejercicio dentro de un día de una plantilla, agrupado por `templateName`/`dayLabel`
- [x] Validación previa con reporte de inconsistencias (fila + descripción), incluyendo `primaryMuscle` obligatorio solo para ejercicios nuevos y RN-01 (`durationWeeks` mínimo 2)
- [x] Soporta creación de ejercicios (find-or-create idempotente por nombre) + plantillas con días + bloques en una sola importación
- [x] DNIs referenciados (columna opcional `studentDni`, para asignar la plantilla resultante) deben existir y estar activos — si no, error de validación, no se importa nada
- [x] Procesamiento en chunks de 50 — adaptado a **plantillas** en vez de filas crudas, porque cada plantilla es la unidad transaccional real (mismo mecanismo de creación anidada que HU-10); en la práctica casi siempre es 1 sola tanda

**Resumen de la implementación:**
La complejidad real de esta HU era el modelo de datos: una fila de CSV plano tiene que reconstruir una jerarquía (plantilla → días → bloques) más, opcionalmente, asignaciones a alumnos — algo que RF-3.5 de `producto.md` ya anticipaba ("poblar o actualizar ejercicios, bloques de rutinas y asignaciones"). El orden real en la base lo determina la posición en el array pasado a `routineTemplateService.create()` (no un campo `order` — confirmado leyendo `toNestedDaysCreate`), así que el cliente ordena por `dayOrder`/`blockOrder` antes de construir el payload. Se agregó `ExerciseService.findOrCreate` (idempotente, reutilizado también aquí sin duplicar lógica de `ExerciseService.create`). Verificado: lógica de agrupamiento/orden probada contra un CSV con filas fuera de orden (confirmando que el resultado igual queda bien ordenado), y el pipeline completo (find-or-create + creación de plantilla anidada + asignación) probado directamente contra la Neon real, incluyendo limpieza de los datos de prueba. En el browser real, la validación end-to-end (incluida la consulta de ejercicios/DNI existentes contra la DB) confirmó correctamente "Importar 1 plantilla(s) / 1 asignación(es)".

**Archivos modificados/creados:**
`lib/services/exercise.service.ts` (`findOrCreate`) · `lib/validators/routine-import.ts` (nuevo) · `lib/actions/routine-import.actions.ts` (nuevo) · `components/admin/routine-import-runner.tsx` (nuevo) · `app/(admin)/plantillas/importar/page.tsx` (nuevo) · `app/(admin)/plantillas/page.tsx` (link) · reutiliza `components/admin/download-csv-template-button.tsx` de HU-20

---

### 🎨 EP-10 — Marca e Identidad Visual

---

#### HU-22 · Rediseño de UI con Identidad de Marca + Ajustes de Datos
> **Como** trainer,
> **quiero** que la plataforma use la paleta e identidad visual de mi marca (logo Santiago Ramón) en vez de un sistema de diseño genérico, y que el modelo de datos refleje correctamente el estado de membresía,
> **para** que el producto se sienta propio y los datos de mis alumnos estén completos.

**Story Points:** 3
**Prioridad:** 🟡 Alta
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] `docs/DESIGN.md` reescrito: paleta anclada al logo (negro `#0D0D0D` + rojo `#F20F38`/`#BF0426`/`#8C041D` extraídos del logo real), tipografía Oswald + Inter, componentes acotados a lo que la app usa (sin vocabulario de marketing/pricing heredado de referencias genéricas)
- [x] Campo `membership_starts_at` agregado a `students` (schema, migración, validador, formulario de alta/edición) — completa el par fecha de inicio / fecha de fin de membresía
- [x] RN-01 (vigencia mínima de 2 semanas) validada en `lib/validators/routine-template.ts` — antes no se aplicaba
- [x] `producto.md`: ERD corregido (fence de mermaid roto), RF-2.3 actualizado (se retira "medidas corporales", nunca implementado ni pedido; se agrega fecha de inicio de membresía)
- [x] `arquitectura.md`: versión de Prisma corregida (6.x → 7.9.1), riesgo de Auth.js beta documentado, mapeo de tokens DESIGN.md → CSS actualizado a la nueva paleta

**Resumen de la implementación:**
`docs/DESIGN.md` ya venía con cambios locales sin commitear (dos iteraciones: una referencia Pinterest, luego una referencia genérica tipo SaaS-editorial) — ninguna de las dos aplicaba al dominio real. Se debatió dirección (clara vs. oscura, tipografía) antes de escribir la versión final, anclada a los colores reales del logo provisto por el cliente. La aplicación de la nueva paleta a `app/globals.css` y a los componentes shadcn ya construidos queda **fuera de esta HU** — es trabajo de implementación visual, no de documentación/datos, y se planifica aparte.

**Archivos modificados/creados:**
`docs/DESIGN.md` · `docs/producto.md` · `docs/arquitectura.md` · `prisma/schema.prisma` · `prisma/migrations/20260815090000_add_membership_starts_at/` · `lib/repositories/interfaces.ts` · `lib/validators/student.ts` · `lib/validators/routine-template.ts` · `lib/actions/student.actions.ts` · `components/admin/student-form.tsx` · `app/(admin)/alumnos/[id]/page.tsx`

---

#### HU-23 · Aplicar Sistema de Diseño a la UI Real
> **Como** trainer,
> **quiero** que el panel admin y el portal del alumno usen visualmente la paleta e identidad definidas en `DESIGN.md` (no solo el documento),
> **para** que la experiencia real coincida con mi marca.

**Story Points:** 8
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-22

**Criterios de Aceptación:**
- [x] `app/globals.css` actualizado con los tokens de color (`--primary`, `--destructive`, `--background`, `--card`, `--border`, `--ring`, `--success` nuevo) y fuentes (Oswald vía `next/font/google` como `--font-display`, mapeado a `--font-heading`; Inter se mantiene para cuerpo)
- [x] Header del panel admin (estructura real es una barra superior, no una sidebar lateral — se adaptó `sidebar-nav` a esa estructura) con fondo negro y nav en blanco/rojo al hover
- [x] Header del portal del alumno (`portal-header`) con fondo negro y nombre del alumno
- [x] Badges de estado de cuota (HU-04) migrados a variantes `success` (nueva, verde) / `destructive` (ahora en el granate de marca)
- [x] Botones destructivos y CTAs primarios cascadean automáticamente desde los tokens — sin tocar componentes shadcn individualmente
- [x] Verificación visual con Playwright contra la app real (login, dashboard, listado de alumnos, portal con rutina activa) — sin errores de consola atribuibles a este cambio
- [x] QA visual manual en desktop (admin) y portal — mobile no se probó en viewport reducido en esta pasada

**Resumen de la implementación:**
Cambio de bajo blast-radius: se actualizaron los custom properties de color en `:root` (de `oklch` calculado a hex directo, más trazable a los valores exactos del logo) y se agregó la fuente Oswald como `--font-display`. Como `CardTitle` ya usaba la clase `font-heading` y los badges/botones ya leían `--primary`/`--destructive` genéricamente, la mayoría de la UI adoptó la marca sin tocar componentes — solo se agregó una variante `success` a `Badge`, `font-heading` a la base de `Button`, una regla global `h1,h2,h3 { font-heading }`, y se recoloreó explícitamente el header admin y el header del portal (los dos únicos lugares con fondo negro de marca). No se restructuró el nav admin a sidebar lateral — se mantuvo la barra superior ya construida, solo reskineada.

**Archivos modificados/creados:**
`app/globals.css` · `app/layout.tsx` · `components/ui/button.tsx` · `components/ui/badge.tsx` · `app/(admin)/layout.tsx` · `app/(admin)/alumnos/page.tsx` · `app/(portal)/rutina/[dni]/page.tsx`

---

### 🚀 EP-11 — Puesta en Marcha (Entorno Real)

---

#### HU-24 · Sincronizar Migraciones y Verificar Conexión a Neon (real)
> **Como** desarrollador,
> **quiero** aplicar las migraciones pendientes contra la base de datos real de Neon y confirmar que la app conecta correctamente,
> **para** que el entorno de desarrollo esté completamente operativo con datos reales.

**Story Points:** 1
**Prioridad:** 🔴 Crítica
**Estado:** `DONE`
**Depende de:** HU-01, HU-22

**Criterios de Aceptación:**
- [x] `prisma migrate deploy` aplicado contra la Neon real — incluye la migración `add_membership_starts_at` (HU-22). Las otras 2 migraciones ya estaban aplicadas de antes; `migrate status` confirma "Database schema is up to date"
- [x] Conexión verificada contra la DB real (migrate deploy + migrate status corrieron sin errores)
- [x] Seed corrido (idempotente vía `upsert`) — trainer de prueba confirmado: `trainer@test.com` / `trainer123`

**Resumen de la implementación:**
Ejecutado con la `DATABASE_URL` real provista por el cliente. Sin cambios de código — solo operación contra la base.

---

### 🩹 EP-12 — Correcciones Post-QA

---

#### HU-25 · Dashboard con Contenido Real
> **Como** trainer,
> **quiero** ver un resumen numérico al entrar al panel,
> **para** tener una foto rápida del estado de mi cartera sin ir alumno por alumno.

**Story Points:** 3
**Prioridad:** 🟢 Media
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Alumnos activos (conteo)
- [x] Cuotas vencidas o por vencer en los próximos 7 días (conteo)
- [x] Rutinas activas (conteo)
- [x] Cada stat linkea al listado de alumnos

**Resumen de la implementación:**
El dashboard nunca tuvo contenido real desde HU-03 — el reporte "no muestra nada" no era un bug, era un placeholder nunca completado. Se agregaron `countActive`/`countExpiringSoon` a `StudentService` y `countActive` a `AssignedRoutineService` (queries de conteo simples, sin nuevo repositorio). "Por vencer" incluye las ya vencidas — ambas necesitan atención del trainer por igual.

**Archivos modificados/creados:**
`lib/repositories/interfaces.ts` · `lib/repositories/student.repository.ts` · `lib/repositories/assigned-routine.repository.ts` · `lib/services/student.service.ts` · `lib/services/assigned-routine.service.ts` · `app/(admin)/dashboard/page.tsx`

---

#### HU-26 · Fix Warning `nativeButton` (Base UI)
> **Como** desarrollador,
> **quiero** que los `Button` compuestos con `Link` no disparen warnings de Base UI,
> **para** mantener la semántica de accesibilidad correcta y la consola limpia.

**Story Points:** 1
**Prioridad:** 🟡 Alta
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Cero errores de consola `nativeButton` en ningún flujo probado (alumnos, ejercicios, plantillas, importaciones)
- [x] La navegación real (href) se preserva en todos los casos

**Resumen de la implementación:**
El warning aparecía en 13 lugares distintos (`<Button render={<Link .../>}>`) porque Base UI asume `nativeButton=true` (espera un `<button>` real) salvo que se le diga lo contrario. En vez de parchear cada uso, se corrigió `components/ui/button.tsx` en un solo lugar: `nativeButton` ahora default a `false` automáticamente cuando se pasa un `render` prop. Verificado: cero errores en consola, y el elemento subyacente sigue siendo un `<a href>` real (confirmado inspeccionando el DOM), solo que ahora con `role="button"` correcto en vez de heredar semántica de botón nativo sobre un link.

**Archivos modificados/creados:**
`components/ui/button.tsx`

---

#### HU-27 · Fecha de Inicio de Membresía Obligatoria
> **Como** trainer,
> **quiero** que la fecha de inicio de membresía sea obligatoria al crear un alumno,
> **para** que el estado de membresía (HU-22) esté siempre completo.

**Story Points:** 1
**Prioridad:** 🟡 Alta
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] No se puede crear un alumno sin `membershipStartsAt`
- [x] El formulario marca el campo como obligatorio (asterisco)
- [x] La importación CSV (HU-20) hereda la misma regla — se actualizó la documentación de columnas obligatorias en `/alumnos/importar`

**Resumen de la implementación:**
Cambio de una línea en `createStudentSchema` (se sacó el `.optional()`). Como `updateStudentSchema` y el importador de CSV (HU-20) reutilizan este mismo schema, la regla se propaga sola a edición e importación — efecto cascada intencional, no se dupicó la validación en ningún lado.

**Archivos modificados/creados:**
`lib/validators/student.ts` · `components/admin/student-form.tsx` · `app/(admin)/alumnos/importar/page.tsx` (doc actualizada)

---

#### HU-28 · Reactivar Alumno
> **Como** trainer,
> **quiero** poder reactivar un alumno que desactivé por error o que volvió a entrenar conmigo,
> **para** no tener que recrearlo desde cero.

**Story Points:** 2
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-07

**Criterios de Aceptación:**
- [x] Botón "Reactivar alumno" visible en la ficha cuando el alumno está inactivo
- [x] Reactivar restaura `is_active = true` sin tocar su historial
- [x] Vuelve a aparecer en el listado activo y puede acceder al portal por DNI

**Resumen de la implementación:**
Gap real encontrado durante QA: HU-07 (Desactivar) nunca tuvo su contraparte. Se agregó el camino completo (repositorio → servicio → action → botón), simétrico a `DeactivateStudentButton` pero sin `AlertDialog` de confirmación — reactivar es una acción de bajo riesgo y reversible (se puede volver a desactivar), no amerita el mismo nivel de fricción.

**Archivos modificados/creados:**
`lib/repositories/interfaces.ts` · `lib/repositories/student.repository.ts` · `lib/services/student.service.ts` · `lib/actions/student.actions.ts` · `components/admin/reactivate-student-button.tsx` (nuevo) · `app/(admin)/alumnos/[id]/page.tsx`

---

#### HU-29 · Video del Ejercicio en Modal Embebido
> **Como** usuario (trainer o alumno),
> **quiero** ver el video demostrativo de un ejercicio sin salir de la pantalla actual,
> **para** no perder el contexto de la rutina o el catálogo.

**Story Points:** 3
**Prioridad:** 🟢 Media
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] El video se muestra en un modal con iframe embebido (YouTube/Vimeo) en vez de redirigir
- [x] Aplica tanto al portal del alumno (HU-16) como al catálogo de ejercicios del admin (HU-08)
- [x] Si la URL no es de un host soportado, cae de vuelta al link externo (no rompe)

**Resumen de la implementación:**
Se instaló el componente `Dialog` de shadcn (no existía todavía — solo `AlertDialog`) y se creó `VideoDialog` en un nuevo `components/shared/` (primer componente compartido entre admin y portal — antes no había esa carpeta). El resolver de URL a embed soporta `watch?v=`, `youtu.be/`, `vimeo.com/` y `/shorts/`, `/embed/`, `/live/` de YouTube — este último caso se encontró recién al probar con un video real del catálogo (era un YouTube Short, formato común que el primer intento no cubría). El trigger usa un `<button>` nativo real en vez de un `Link`, evitando desde el diseño el mismo problema de HU-26.

**Archivos modificados/creados:**
`components/ui/dialog.tsx` (nuevo, shadcn) · `components/shared/video-dialog.tsx` (nuevo) · `app/(portal)/rutina/[dni]/page.tsx` · `app/(admin)/ejercicios/page.tsx`

---

## Roadmap por Olas (Waves)

> En Kanban no hay sprints fijos, pero organizamos el trabajo en **olas de entrega** para dar visibilidad al cliente.

```
ONDA 1 — Fundaciones (Semanas 1-2)
────────────────────────────────────
HU-01 Setup del Proyecto
HU-02 Schema de Base de Datos
HU-03 Login del Trainer

ONDA 2 — Core Admin (Semanas 3-4)
────────────────────────────────────
HU-04 Listado de Alumnos
HU-05 Crear Alumno
HU-06 Editar Alumno
HU-08 Listado de Ejercicios
HU-09 Crear y Editar Ejercicio

ONDA 3 — Rutinas (Semanas 5-7)
────────────────────────────────────
HU-10 Crear Plantilla
HU-11 Editar y Duplicar Plantilla
HU-12 Asignación Individual

ONDA 4 — Portal del Alumno (Semanas 8-9)
────────────────────────────────────
HU-15 Acceso por DNI
HU-16 Vista de Rutina
HU-17 Marcar Completado + Peso
HU-18 Notas de Sesión

ONDA 5 — Features Secundarios (Semanas 10-12)
────────────────────────────────────
HU-07 Desactivar Alumno
HU-13 Asignación Masiva
HU-14 Historial de Rutinas
HU-19 Ver Progreso (Admin)
HU-20 Importar Alumnos CSV
HU-21 Importar Rutinas CSV

ONDA 6 — Marca en Producción
────────────────────────────────────
HU-24 Sincronizar Neon (real)
HU-23 Aplicar Sistema de Diseño a la UI

ONDA 7 — Correcciones Post-QA
────────────────────────────────────
HU-26 Fix nativeButton
HU-27 Membresía obligatoria
HU-28 Reactivar Alumno
HU-25 Dashboard con contenido real
HU-29 Video en modal embebido
```

---

## Resumen de Story Points

| Épica | Tickets | Story Points |
|---|---|---|
| EP-01 Infraestructura | 2 | 6 |
| EP-02 Auth Admin | 1 | 3 |
| EP-03 Alumnos | 4 | 9 |
| EP-04 Ejercicios | 2 | 4 |
| EP-05 Plantillas | 2 | 13 |
| EP-06 Asignación | 3 | 12 |
| EP-07 Portal Alumno | 2 | 8 |
| EP-08 Progreso | 3 | 10 |
| EP-09 Importación CSV | 2 | 16 |
| EP-10 Marca e Identidad | 2 | 11 |
| EP-11 Puesta en Marcha | 1 | 1 |
| EP-12 Correcciones Post-QA | 5 | 10 |
| **TOTAL** | **29 HUs** | **106 pts** |

---

## Convenciones del Equipo

### Formato de Branches
```
feature/HU-XX-descripcion-corta
bugfix/HU-XX-descripcion-del-bug
chore/descripcion-de-tarea
```

### Formato de Commits (Conventional Commits)
```
feat(alumnos): add student creation form with Zod validation
fix(portal): correct DNI sanitization on query param
chore(db): add idx_students_dni migration
refactor(services): extract routine assignment logic to service layer
```

### Definition of Ready (antes de mover a "To Do")
- [ ] Criterios de aceptación claros y completos
- [ ] Dependencias resueltas
- [ ] Story points estimados
- [ ] Diseño o wireframe disponible si el ticket tiene UI

### Definition of Done (para mover a "Done")
- [ ] Código mergeado en `main` con PR aprobado
- [ ] Todos los criterios de aceptación verificados
- [ ] Sin errores de TypeScript (`tsc --noEmit`)
- [ ] Componentes shadcn respetan los tokens de `DESIGN.md`
- [ ] Funciona en mobile (portal) o desktop (admin)

---

*Documento vivo. Se actualiza al inicio de cada ola de entrega.*
