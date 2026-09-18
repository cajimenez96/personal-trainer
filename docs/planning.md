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
| **EP-13** | Seguimiento y Coaching (Fase 1) | Primera ola de MVP 2 — cronómetro, WhatsApp, peso corporal, bloques, objetivos flexibles | 🟡 Alta |
| **EP-14** | Seguimiento y Coaching (Fase 2) | Segunda ola de MVP 2 — tempo prescrito | 🟢 Media |
| **EP-15** | Mejoras de UI y Administración | UI de tablas/inputs, seed real, Objetivo/Modalidad administrables | 🟡 Alta |
| **EP-16** | Arquitectura Multi-tenant & SaaS | Soporte multi-profesor (slug-in-path), rol SuperAdmin, aislamiento de datos y marca blanca dinámica | 🔴 Crítica |
| **EP-17** | Modelo SaaS y Catálogo Master | Catálogo global de ejercicios (Copy-on-Write), cupos configurables de planes/alumnos y membresías | 🔴 Crítica |

---

## MVP 1 — Recorrido hasta ahora ✅

> **Cerrado el 15/08/2026.** Las 29 historias de usuario de esta sección están `DONE` y conforman el primer MVP: administración de alumnos, catálogo de ejercicios, plantillas de rutinas, asignación individual/masiva, portal del alumno por DNI, registro de progreso, importación masiva por CSV, identidad de marca aplicada, y correcciones post-QA. El detalle completo de cada ticket (criterios, resumen de implementación, archivos) se conserva abajo como registro histórico — no se resume ni se borra nada, porque documenta decisiones técnicas reales (bugs encontrados, por qué se adaptó tal o cual criterio) que siguen siendo relevantes.

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

## MVP 2 — Trabajo a Desarrollar

> **Origen:** `docs/mvp2/Plataforma_Entrenamiento_Propuesta_Evolucion.md`, una propuesta de evolución hacia un "motor de seguimiento del entrenamiento" (Programar → Ejecutar → Medir → Evaluar → Ajustar). Se analizó completa contra la arquitectura real y se debatieron los puntos de mayor impacto antes de convertir nada en ticket — ver conversación del 15/08/2026. Lo que sigue son las decisiones de alcance tomadas y las historias que se derivan de ellas.

### Decisiones de Alcance Tomadas

| Propuesta original | Decisión | Motivo |
|---|---|---|
| Registro estructurado por serie (peso/reps/RIR por cada serie) | ❌ Descartado | El campo de notas libres que ya existe (HU-18) alcanza para que el alumno describa lo que hizo por serie. Costo de desarrollo: cero, ya está construido. **Consecuencia asumida:** PRs automáticos, 1RM estimado, gráficos de progreso y detección de estancamiento no son viables como cálculo del sistema sin datos numéricos estructurados — quedan en el backlog abierto de abajo. |
| Fotos de progreso | ❌ Descartado | Sin excepciones, ningún estilo. No hay infraestructura de almacenamiento de archivos en el proyecto y no se va a construir para esto. |
| Acceso del alumno: DNI + PIN | ❌ Descartado | Consistente con el problema original del producto ("sin contraseñas que se olviden", `producto.md`). El acceso sigue siendo solo por DNI. |
| Multi-entrenador | ❌ Descartado | Un solo coach. El schema sigue sin `trainerId` en `Student`/`Exercise`/`RoutineTemplate` — si en el futuro hiciera falta, es una migración real, no una bandera que se prende. |
| PRs automáticos, 1RM estimado, gráficos de progreso, detección de estancamiento | ❌ Descartado | Confirmado — no hacen falta gráficos ni cálculos automáticos de este tipo. Consistente con la decisión de no modelar series: sin datos numéricos estructurados no hay sobre qué graficar, y el profesor evalúa esto leyendo las notas del alumno. |
| Cronómetro de descanso, WhatsApp, peso corporal, bloques/superseries, objetivos flexibles, notas tipificadas, adherencia simple | ✅ Aceptado | No dependen de la decisión de series — se convierten en las historias de esta sección. |

---

### 🎯 EP-13 — Seguimiento y Coaching (Fase 1)

---

#### HU-30 · Cronómetro de Descanso
> **Como** alumno,
> **quiero** que arranque un cronómetro de descanso apenas marco una serie o ejercicio como completado,
> **para** saber cuándo retomar sin tener que mirar el reloj del gimnasio.

**Story Points:** 3
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-17

**Criterios de Aceptación:**
- [x] Al marcar un ejercicio completado, arranca automáticamente un cronómetro de cuenta regresiva
- [x] El tiempo default sale de `rest_secs` del bloque, incluyendo el override si existe
- [x] Se puede pausar, sumar tiempo (+15s) y finalizar manualmente antes de que llegue a cero
- [x] Aviso (sonido vía Web Audio API + vibración si el navegador la soporta) al llegar a cero
- [x] No bloquea la pantalla — es una card más dentro del ejercicio, el resto de la rutina se sigue viendo

**Resumen de la implementación:**
`RestTimer` (nuevo, `components/portal`) es un componente de intervalo autocontenido — arranca al montarse, se remonta con `key` cada vez que el alumno vuelve a marcar el checkbox (así reinicia limpio en vez de arrastrar el estado anterior). Solo se muestra si el bloque tiene `restSecs` — si no está configurado, no aparece nada (no se inventa un default). Verificado en browser real con un descanso corto (8s): cuenta regresiva correcta, se detiene en cero sin pasar a negativo, "+15s" revive el timer después de llegar a cero, y "Finalizar" lo saca de la pantalla.

**Archivos modificados/creados:**
`components/portal/rest-timer.tsx` (nuevo) · `components/portal/exercise-progress.tsx` · `app/(portal)/rutina/[dni]/page.tsx`

---

#### HU-31 · Acciones Rápidas de WhatsApp
> **Como** trainer,
> **quiero** un botón que abra WhatsApp con un mensaje prearmado hacia un alumno,
> **para** comunicarme rápido sin salir del panel ni escribir el mensaje de cero.

**Story Points:** 2
**Prioridad:** 🟢 Media
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Botones de WhatsApp en la ficha del alumno, visibles solo si tiene teléfono cargado
- [x] Abre `wa.me/<telefono>?text=<mensaje>` en una pestaña nueva (sin integración de API, sin chat interno)
- [x] 2 mensajes prearmados con variables (nombre del alumno, fecha de vencimiento de cuota): aviso de cuota por vencer (solo si tiene `paymentExpiresAt` cargado) y aviso de rutina actualizada
- [x] El teléfono se normaliza a solo-dígitos antes de armar el link

**Resumen de la implementación:**
`WhatsAppActions` es un Server Component — son `<a href="https://wa.me/...">` planos, no hace falta cliente ni estado. La normalización del teléfono es deliberadamente simple (`replace(/\D/g, "")`, sin inyectar código de país): hoy no hay ninguna validación de formato de teléfono en el alta de alumno (es texto libre), así que no había ningún "mismo criterio" para reutilizar — se corrigió esa suposición del criterio original antes de escribirlo. El botón de "cuota por vencer" no se muestra si el alumno no tiene `paymentExpiresAt` cargado, para no mandar un mensaje con una fecha inexistente. Verificado en browser real: las dos URLs se arman con el nombre y la fecha correctos, URL-encoded bien.

**Archivos modificados/creados:**
`components/admin/whatsapp-actions.tsx` (nuevo) · `app/(admin)/alumnos/[id]/page.tsx`

---

#### HU-32 · Peso Corporal Histórico
> **Como** alumno,
> **quiero** poder registrar mi peso corporal de tanto en tanto,
> **para** que mi entrenador vea mi evolución además de las cargas que levanto.

**Story Points:** 3
**Prioridad:** 🟢 Media
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Nueva tabla independiente `body_weight_logs` para el histórico de peso corporal (no se mezcla con `progress_logs`, que es peso *levantado* por ejercicio)
- [x] Campo opcional en el header del portal para cargar peso corporal — no ligado a ningún ejercicio puntual, un registro por día como máximo (mismo patrón de `upsert` que `progress_logs`)
- [x] Listado cronológico visible en la ficha del alumno (panel admin) — card "Peso Corporal", solo aparece si hay al menos un registro

**Resumen de la implementación:**
Mismo patrón en capas que el resto del proyecto (repo/servicio/validador), reutilizando `todayUTC()` de `progress-log.service.ts` en vez de duplicarlo. El campo vive en el header oscuro del portal (mismo lugar que el nombre del alumno), separado visualmente de los inputs de peso por ejercicio para que no se confundan. Verificado en browser real: se guarda desde el portal, persiste al recargar, y aparece correctamente en la ficha del alumno del admin. Encontrado durante la verificación: el server de desarrollo no recoge el cliente de Prisma regenerado en caliente — hubo que reiniciarlo después de `prisma generate` para que reconociera el modelo nuevo (no es un bug del código, es una limitación del proceso de Node ya arrancado).

**Archivos modificados/creados:**
`prisma/schema.prisma` (`BodyWeightLog`) · `prisma/migrations/20260816090000_add_body_weight_logs/` · `lib/repositories/interfaces.ts` · `lib/repositories/body-weight.repository.ts` (nuevo) · `lib/services/body-weight.service.ts` (nuevo) · `lib/actions/body-weight.actions.ts` (nuevo) · `components/portal/body-weight-input.tsx` (nuevo) · `app/(portal)/rutina/[dni]/page.tsx` · `app/(admin)/alumnos/[id]/page.tsx`

---

#### HU-33 · Bloques y Superseries en Plantillas
> **Como** trainer,
> **quiero** poder agrupar ejercicios dentro de un día en bloques (ej. superserie A1/A2, circuito),
> **para** prescribir estructuras reales de gimnasio y no solo una lista plana de ejercicios.

**Story Points:** 8
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-10, HU-21

**Criterios de Aceptación:**
- [x] Un día de entrenamiento puede agrupar 1 o más ejercicios bajo una misma etiqueta de bloque (A, B, C…)
- [x] Descanso configurable a nivel de bloque, no solo por ejercicio individual
- [x] El armador de plantillas (`TemplateBuilder`) permite crear/reordenar bloques, no solo ejercicios sueltos
- [x] El portal del alumno muestra los ejercicios agrupados visualmente por bloque
- [x] La importación CSV (HU-21) soporta la columna de agrupación sin romper el formato ya documentado

> **Nota:** es la historia más grande de esta ola — toca el schema (nuevo nivel de agrupación entre día y ejercicio), el armador de plantillas completo, y el importador CSV. Si se quiere reducir el alcance de esta primera tanda de MVP2, esta es la candidata a mover a una ola siguiente.

**Resumen de la implementación:**
Se optó deliberadamente por **no** crear una tabla/relación nueva para el grupo: `ExerciseBlock` gana dos campos (`groupLabel` texto libre corto, ej. "A"; `groupRestSecs` descanso del bloque completo) y el agrupamiento visual se resuelve por **etiqueta + orden consecutivo** dentro del `blockOrder` ya existente — mismo criterio de simplicidad que el resto del schema (sin modelar un id relacional extra para algo que no lo necesita). `restSecs` (por ejercicio) y `groupRestSecs` (por bloque/superserie) son campos distintos e independientes: el primero sigue siendo el descanso después de ESE ejercicio puntual (normalmente 0 dentro de una superserie), el segundo es el descanso después de completar el bloque entero — se toma del último ejercicio del grupo para mostrarlo una sola vez. Se creó un helper compartido `lib/utils/group-blocks.ts` (`groupConsecutiveBlocks`) reutilizado por el armador de plantillas (preview), el portal del alumno y — de forma más liviana, solo con un badge "Bloque X" — la vista de solo lectura del admin. Deliberadamente **no** se hizo el grupo personalizable por alumno (`RoutineOverride`): es estructural, igual que qué ejercicios componen un día, así que siempre viene de la plantilla base. Verificado de punta a punta en browser real: se agrupó "Peso muerto" + "Pecho plano" bajo "Grupo A" con descanso post-bloque de 60s en el armador (preview mostró correctamente "Bloque A (superserie)"), se guardó contra la Neon real, y tanto el portal del alumno (`/rutina/39975255`) como la vista de solo lectura del admin mostraron el agrupamiento correctamente tras el guardado. El pipeline de importación CSV (`routineTemplateService.create`) se verificó directamente contra la base real con un script descartable, confirmando que `groupLabel`/`groupRestSecs` persisten.

**Archivos modificados/creados:**
`prisma/schema.prisma` · `prisma/migrations/20260816160000_add_exercise_block_grouping/` · `lib/repositories/interfaces.ts` · `lib/repositories/routine-template.repository.ts` · `lib/services/assigned-routine.service.ts` · `lib/validators/routine-template.ts` · `lib/validators/routine-import.ts` · `lib/actions/routine-import.actions.ts` · `lib/utils/group-blocks.ts` (nuevo) · `components/admin/template-builder.tsx` · `components/admin/routine-import-runner.tsx` · `app/(admin)/plantillas/[id]/page.tsx` · `app/(admin)/plantillas/importar/page.tsx` · `app/(portal)/rutina/[dni]/page.tsx` · `app/(admin)/alumnos/[id]/rutinas/[routineId]/page.tsx`

---

#### HU-34 · Objetivos Flexibles del Alumno
> **Como** trainer,
> **quiero** registrar un objetivo principal más objetivos secundarios y prioridades de un alumno,
> **para** reflejar su plan real en vez de encasillarlo en una sola categoría fija.

**Story Points:** 5
**Prioridad:** 🟢 Media
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Se mantiene el enum actual (`Objetivo`: hipertrofia/fuerza/descenso) como "objetivo principal" — no se rompe lo existente
- [x] Campo adicional (`secondaryGoals`) para objetivos secundarios/prioridades en texto libre (ej. "mejorar sentadilla, espalda")
- [x] Visible y editable en la ficha del alumno; opcional, no bloquea el alta

**Resumen de la implementación:**
Campo de texto libre (no lista estructurada) — consistente con el criterio de simplicidad usado en el resto de esta ola (HU-30/32/37: texto descriptivo en vez de estructura rígida cuando no hace falta más). Mismo patrón de siempre: schema → migración → validador → `CreateStudentData`/`UpdateStudentData` → `updateStudentAction` (único lugar que destructura campos explícitamente, `createStudentAction` no necesitó cambios porque pasa `parsed.data` completo) → `StudentForm`. Verificado en browser real contra la Neon: se guarda y precarga correctamente al recargar la ficha.

**Archivos modificados/creados:**
`prisma/schema.prisma` · `prisma/migrations/20260816140000_add_secondary_goals/` · `lib/validators/student.ts` · `lib/repositories/interfaces.ts` · `lib/actions/student.actions.ts` · `components/admin/student-form.tsx` · `app/(admin)/alumnos/[id]/page.tsx`

---

#### HU-35 · Notas Tipificadas
> **Como** trainer,
> **quiero** que las notas de progreso se distingan por tipo (sesión, incidencia, administrativa),
> **para** poder filtrarlas y encontrar lo importante sin releer todo el historial.

**Story Points:** 3
**Prioridad:** 🟢 Media
**Estado:** `DONE`
**Depende de:** HU-19

**Criterios de Aceptación:**
- [x] El registro de progreso admite un tipo de nota opcional (ej. sesión normal / incidencia / molestia)
- [x] El historial de progreso (HU-19) permite filtrar por tipo además del rango de fechas ya existente

> **Nota:** prioridad baja a propósito — confirmar que el volumen real de notas lo justifica antes de construirlo; con pocos alumnos, puede no aportar tanto como el resto de esta ola.

**Resumen de la implementación:**
`noteType` es un enum de Postgres (`NoteType`: `session`/`incident`/`discomfort`) en vez de texto libre — mismo criterio que `Objetivo`/`Nivel`/`Modalidad` ya existentes en el schema, porque necesita ser filtrable con igualdad exacta. Es el alumno quien elige el tipo al cargar la nota en el portal (selector junto al textarea de "+ Agregar nota"), no el trainer — tiene sentido porque es quien está registrando la sesión en el momento. En el historial admin se agregó un tercer filtro GET (`noteType`, mismo patrón sin JS que `from`/`to`) y un badge por nota (`destructive` para incidencia/molestia, para que salten a la vista sin releer todo el historial, que es el objetivo del ticket). **Bug encontrado y corregido en el camino:** el schema de query `progressHistoryQuerySchema` (`from`/`to`) no tenía el preprocesamiento `emptyToUndefined` que sí usa el resto del código base — un formulario GET envía siempre los 3 campos, y con `from`/`to` vacíos (`""`) `z.coerce.date()` fallaba, tirando abajo el `safeParse` completo y descartando silenciosamente también el filtro nuevo de `noteType` (caía a `filters = {}`, sin fallar visiblemente). Preexistía desde HU-19 pero nunca se manifestó porque hasta ahora "sin filtros" y "fallo silencioso de fecha vacía" daban el mismo resultado visible; se volvió visible recién al agregar un filtro que sí debía aplicarse incluso con fechas vacías. Se corrigió agregando el mismo preprocesamiento ya usado en `lib/validators/student.ts` y `lib/validators/routine-import.ts`. Verificado de punta a punta en browser real contra la Neon real: cargué una nota tipo "Molestia" desde el portal (`/rutina/39975255`), confirmé que persiste al recargar, verifiqué el badge "Molestia" en el historial admin, y probé el filtro con `noteType=incident` (0 resultados, correcto) y `noteType=discomfort` (1 resultado, correcto).

**Archivos modificados/creados:**
`prisma/schema.prisma` (`NoteType`) · `prisma/migrations/20260816180000_add_progress_log_note_type/` · `lib/validators/progress-note.ts` (nuevo) · `lib/repositories/interfaces.ts` · `lib/repositories/progress-log.repository.ts` · `lib/validators/progress-history.ts` · `lib/actions/progress.actions.ts` · `components/portal/exercise-progress.tsx` · `app/(portal)/rutina/[dni]/page.tsx` · `app/(admin)/alumnos/[id]/progreso/page.tsx`

---

#### HU-36 · Dashboard Deportivo: Adherencia y Alertas Simples
> **Como** trainer,
> **quiero** ver en el dashboard qué alumnos no entrenan hace varios días y una adherencia simple por alumno,
> **para** saber a quién prestarle atención sin revisar ficha por ficha.

**Story Points:** 5
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-25

**Criterios de Aceptación:**
- [x] Sección nueva en el dashboard: alumnos activos sin ningún registro de progreso en los últimos 7 días
- [x] Adherencia simple por alumno: sesiones con al menos un registro / sesiones esperadas en el rango de su rutina activa
- [x] Explícitamente **sin** volumen ni RIR — eso quedó fuera por la decisión de no modelar series (ver tabla de decisiones arriba)

**Resumen de la implementación:**
"Sesiones esperadas" es una aproximación deliberada por volumen, no por calendario: `(días de la plantilla) × (semanas transcurridas desde la asignación)`. No se puede calcular exacto porque el sistema no modela qué día de la semana corresponde a qué día de la plantilla (nunca se pidió esa granularidad). Se documenta esto explícitamente en la propia UI del dashboard, no se presenta como más preciso de lo que es. `AssignedRoutineRepository.findAdherenceStats()` hace una query por rutina activa (N+1 aceptable dado el volumen esperado de un solo entrenador) contando fechas distintas de `progress_logs` desde la asignación. Verificado con datos reales: un alumno recién asignado sin registros mostró correctamente "0/1 · 0%" y en la alerta de inactividad; otro que había registrado progreso ese mismo día mostró "1/1 · 100%" y no apareció en la alerta.

**Archivos modificados/creados:**
`lib/repositories/interfaces.ts` (`AdherenceStat`, `findAdherenceStats`) · `lib/repositories/assigned-routine.repository.ts` · `lib/services/assigned-routine.service.ts` (`getAdherenceStats`) · `app/(admin)/dashboard/page.tsx`

---

#### HU-37 · Prescripción Enriquecida: Peso, Intensidad y Esquema de Reps
> **Como** trainer,
> **quiero** poder prescribir peso, intensidad (RPE) y un esquema de repeticiones variable por ejercicio,
> **para** que la rutina que ve el alumno tenga el mismo nivel de detalle que ya uso en mi planilla de Excel.

**Story Points:** 8
**Prioridad:** 🟡 Alta
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] `ExerciseBlock` y `RoutineOverride` ganan 3 campos nuevos: `weightKg` (peso prescrito), `intensity` (texto libre, ej. `@7`) y `repsScheme` (texto libre para esquemas variables, ej. `1x6 2x5 1x4`)
- [x] `reps` sigue siendo un número simple para casos fijos; cuando `repsScheme` está presente, se muestra en su lugar
- [x] El armador de plantillas (`TemplateBuilder`) permite cargar los 3 campos nuevos por ejercicio
- [x] El formulario de personalización individual (`AssignmentForm`, HU-12) también los permite personalizar por alumno
- [x] El portal del alumno muestra peso, intensidad y esquema de reps cuando existen, destacados en color de marca
- [x] La importación CSV de rutinas (HU-21) soporta las 3 columnas nuevas como opcionales, sin romper el formato existente

**Resumen de la implementación:**
Esto **no es lo mismo** que el "registro por serie" descartado en la propuesta de MVP2 — ese era sobre lo que el alumno *reporta* haber hecho; esto es sobre lo que el trainer *prescribe*, un campo que ya existía (`ExerciseBlock`) y solo necesitaba 3 campos más. `weightKg` es `Decimal` en Postgres — Prisma lo devuelve como objeto `Decimal`, no `number`, así que hubo que agregar conversión explícita (`.toNumber()`) en `routine-template.repository.ts` (`findById`, `duplicate`) y `assigned-routine.repository.ts` (`findByIdWithDetails`), que antes devolvían el resultado de Prisma sin mapear porque ningún campo anterior lo requería. Verificado de punta a punta: creé una plantilla replicando una fila real del Excel del cliente (sentadilla: 4 series, esquema "1x6 2x5 1x4", 130kg, @7, descanso 150s), la asigné a un alumno, y el portal la mostró prácticamente idéntica al Excel original.

**Hallazgo importante (no arreglado en esta HU, ver HU-38):** al verificar, encontré que **editar una plantilla que tiene una asignación con personalización (`RoutineOverride`) rompe con error 500** — preexistente desde HU-11, no relacionado a estos campos nuevos.

**Archivos modificados/creados:**
`prisma/schema.prisma` · `prisma/migrations/20260816120000_add_prescription_fields/` · `lib/repositories/interfaces.ts` · `lib/repositories/routine-template.repository.ts` · `lib/repositories/assigned-routine.repository.ts` · `lib/services/assigned-routine.service.ts` · `lib/validators/routine-template.ts` · `lib/validators/assignment.ts` · `components/admin/template-builder.tsx` · `components/admin/assignment-form.tsx` · `app/(admin)/plantillas/[id]/page.tsx` · `app/(portal)/rutina/[dni]/page.tsx` · `app/(admin)/alumnos/[id]/rutinas/[routineId]/page.tsx` · `lib/validators/routine-import.ts` · `lib/actions/routine-import.actions.ts` · `components/admin/routine-import-runner.tsx` · `app/(admin)/plantillas/importar/page.tsx`

---

#### HU-38 · Fix: Editar Plantilla con Personalizaciones/Progreso Asignados Falla
> **Como** trainer,
> **quiero** poder editar una plantilla aunque algún alumno tenga progreso o una personalización registrada sobre ella,
> **para** no quedar bloqueado de ajustar mis plantillas ni perder el historial real de mis alumnos.

**Story Points:** 8 *(re-estimado — el alcance real era mayor a los 3 pts originales, ver resumen)*
**Prioridad:** 🔴 Crítica
**Estado:** `DONE`
**Depende de:** HU-11

**Criterios de Aceptación:**
- [x] Guardar cambios en una plantilla no falla cuando existen `RoutineOverride` o `ProgressLog` referenciando sus `exercise_blocks`
- [x] Ningún dato histórico real (progreso del alumno, personalizaciones) se pierde al editar una plantilla — se descartó la opción de "perderlos silenciosamente"
- [x] Si el trainer intenta eliminar específicamente un ejercicio/día que sí tiene historial, la operación se bloquea con un mensaje claro (no un error de base de datos crudo)

**Resumen de la implementación:**
El alcance creció al verificar: no era solo `routine_overrides` bloqueando por `RESTRICT` — **`progress_logs` (el historial real de peso/completado del alumno) tenía exactamente el mismo problema**, y ese es un caso mucho más común que las personalizaciones. Perder progreso registrado silenciosamente para "resolver" el error hubiera sido peor que el bug original, así que se descartó esa opción y se atacó la causa real: `RoutineTemplateRepository.update()` hacía `deleteMany({})` + `create` de **todos** los días/bloques en cada edición — incluso los que no cambiaron — generando IDs nuevos cada vez y rompiendo cualquier referencia externa.

El fix reescribe `update()` como un diff real dentro de una transacción: los días/bloques que ya existían (identificados por `id`, ahora trackeado de punta a punta desde `TemplateBuilder` hasta el repositorio) se actualizan in-place preservando su id; solo los genuinamente nuevos se crean y solo los genuinamente removidos se eliminan. Antes de eliminar algo, se cuenta cuántos `progress_logs`/`routine_overrides` lo referencian — si hay alguno, la operación completa aborta con `TemplateBlockInUseError` (mismo patrón que `DniAlreadyExistsError`/`ExerciseNameTakenError` ya usado en el proyecto) y el formulario muestra el mensaje en vez de una pantalla de error genérica.

Verificado exhaustivamente contra la Neon real con el caso que originalmente rompía ("Plantilla A", 1 override + 2 progress logs sobre su único bloque): (1) editar el peso prescrito del bloque existente — guardó bien, **el id del bloque no cambió**, override y progress logs intactos; (2) intentar eliminar ese mismo bloque — bloqueado con el mensaje "No se puede eliminar: 2 registro(s) de progreso y 1 personalización(es) todavía referencian ejercicios que se están quitando de la plantilla", y confirmado que nada se perdió en la base tras el intento fallido.

**Archivos modificados/creados:**
`lib/repositories/interfaces.ts` (`id?` en `CreateExerciseBlockData`/`CreateTrainingDayData`) · `lib/repositories/routine-template.repository.ts` (`update()` reescrito, `TemplateBlockInUseError`) · `lib/services/routine-template.service.ts` (re-export del error) · `lib/actions/routine-template.actions.ts` (captura el error) · `lib/validators/routine-template.ts` (`id` opcional) · `components/admin/template-builder.tsx` (trackea ids reales, muestra error general) · `app/(admin)/plantillas/[id]/page.tsx` (pasa ids reales)

---

### 🎯 EP-14 — Seguimiento y Coaching (Fase 2)

> **Origen:** mismo documento de evolución que EP-13 (`docs/mvp2/Plataforma_Entrenamiento_Propuesta_Evolucion.md`). La tabla de "Decisiones de Alcance Tomadas" de EP-13 no cubría todo el documento — quedaban puntos sin decidir ni para adentro ni para afuera (readiness, molestias recurrentes, sustitución de ejercicios, biblioteca avanzada, tempo, mesociclos/deload, evaluación física). Se revisó ese remanente el 16/08/2026 y se decidió llevar únicamente **Tempo Prescrito** a esta fase — el resto queda fuera por ahora (esfuerzo medio/alto con ROI dudoso para un solo coach con pocos alumnos, o directamente descartado sin nueva justificación desde EP-13).

---

#### HU-39 · Tempo Prescrito
> **Como** trainer,
> **quiero** poder indicar el tempo de ejecución de un ejercicio (ej. "3-1-1-0" o "controlado"),
> **para** que el alumno sepa el ritmo esperado, igual que ya indico peso e intensidad.

**Story Points:** 2
**Prioridad:** 🟢 Media
**Estado:** `DONE`
**Depende de:** HU-37

**Criterios de Aceptación:**
- [x] `ExerciseBlock` y `RoutineOverride` ganan un campo `tempo` de texto libre y opcional (no obligatorio, no una métrica central — igual que `intensity`)
- [x] El armador de plantillas (`TemplateBuilder`) permite cargarlo por ejercicio
- [x] El formulario de personalización individual (`AssignmentForm`) permite personalizarlo por alumno
- [x] El portal del alumno lo muestra cuando existe
- [x] La importación CSV de rutinas soporta la columna nueva como opcional, sin romper el formato existente

**Resumen de la implementación:**
Calco directo del patrón ya usado para `intensity` en HU-37 — mismo tipo de campo (texto libre corto, opcional, sin validación de formato estricta porque el propio documento de origen dice explícitamente "no debe ser obligatorio ni convertirse en una métrica central"). Se agregó a `ExerciseBlock` y `RoutineOverride` (sí es personalizable por alumno, a diferencia de `groupLabel`/`groupRestSecs` de HU-33 que son estructurales). Verificado de punta a punta contra la Neon real: cargado en el armador de plantillas ("Peso muerto" con tempo "3-1-1-0"), confirmado en la vista previa y en el portal del alumno; luego personalizado por alumno vía `AssignmentForm` (override a "controlado") y confirmado que el portal muestra el valor personalizado en vez del de la plantilla base.

**Archivos modificados/creados:**
`prisma/schema.prisma` (`tempo` en `ExerciseBlock`/`RoutineOverride`) · `prisma/migrations/20260816200000_add_tempo/` · `lib/repositories/interfaces.ts` · `lib/repositories/routine-template.repository.ts` · `lib/repositories/assigned-routine.repository.ts` · `lib/services/assigned-routine.service.ts` · `lib/validators/routine-template.ts` · `lib/validators/assignment.ts` · `lib/validators/routine-import.ts` · `lib/actions/routine-import.actions.ts` · `components/admin/routine-import-runner.tsx` · `components/admin/template-builder.tsx` · `components/admin/assignment-form.tsx` · `app/(admin)/plantillas/[id]/page.tsx` · `app/(admin)/plantillas/importar/page.tsx` · `app/(portal)/rutina/[dni]/page.tsx` · `app/(admin)/alumnos/[id]/rutinas/[routineId]/page.tsx`

---

### 🛠️ EP-15 — Mejoras de UI y Administración

---

#### HU-41 · Mejoras de UI: Inputs, Fecha por Defecto y Acciones en Tablas
> **Como** trainer,
> **quiero** distinguir visualmente qué campos puedo editar, no tener que tipear la fecha de hoy a mano, y tener acciones rápidas (ver/editar/desactivar-eliminar) desde cualquier tabla,
> **para** operar más rápido sin fricción innecesaria.

**Story Points:** 3
**Prioridad:** 🟡 Alta
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Todos los inputs/textareas/selects editables tienen fondo blanco; los deshabilitados (ej. DNI) se siguen distinguiendo visualmente
- [x] "Fecha inicio membresía" precarga la fecha de hoy en modo creación (en edición respeta la fecha real guardada)
- [x] Las tablas de Alumnos y Ejercicios tienen una columna de Acciones (menú Editar / Desactivar-Reactivar o Eliminar) y toda la fila navega al detalle al hacer click, salvo la celda de acciones y la de video

**Resumen de la implementación:**
`Input`/`Textarea`/`Select` de shadcn pasaron de `bg-transparent` (heredaba el gris de la Card, `--card: #f2f2f2`) a `bg-background` (`#ffffff`) — cambio de una clase por componente, cubre toda la app de una sola vez. El menú de acciones se armó sobre `@base-ui/react/menu` (nuevo `components/ui/dropdown-menu.tsx`, mismo criterio de wrapping que `alert-dialog.tsx`); el AlertDialog de confirmación (desactivar/eliminar) se maneja con estado controlado (`open`/`onOpenChange`) en vez de depender del trigger del menú, porque anidar un trigger de diálogo dentro de un menú que se cierra al hacer click es un patrón frágil en cualquier librería headless — desacoplar los dos estados lo evita por completo. La fila clickeable (`ClickableTableRow`, client component con `router.push`) necesitó un wrapper `ActionsCell` aparte porque un Server Component no puede pasar un `onClick` inline a un Client Component (RSC no serializa funciones) — error real encontrado al verificar, no antes.

**Archivos modificados/creados:**
`components/ui/input.tsx` · `components/ui/textarea.tsx` · `components/ui/select.tsx` · `components/ui/dropdown-menu.tsx` (nuevo) · `components/admin/student-form.tsx` (fecha por defecto) · `components/admin/clickable-table-row.tsx` (nuevo) · `components/admin/actions-cell.tsx` (nuevo) · `components/admin/student-row-actions.tsx` (nuevo) · `components/admin/exercise-row-actions.tsx` (nuevo) · `app/(admin)/alumnos/page.tsx` · `app/(admin)/ejercicios/page.tsx`

---

#### HU-42 · Seed Real: Admin Único y Catálogo de Ejercicios
> **Como** trainer,
> **quiero** que el entorno arranque con mi usuario real y mi catálogo de ejercicios, no con datos de prueba,
> **para** empezar a usar la plataforma de verdad.

**Story Points:** 1
**Prioridad:** 🟡 Alta
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] El seed crea un único trainer real (`sramon@coach.com`) — borra cualquier otro trainer de prueba que hubiera quedado
- [x] El seed carga los 27 ejercicios reales (nombre, músculo principal, músculos secundarios) provistos, con upsert idempotente por nombre

**Resumen de la implementación:**
`prisma/seed.ts` reescrito: `db.trainer.deleteMany({ where: { email: { not: ADMIN.email } } })` antes del upsert real (garantiza un solo trainer), y `db.exercise.upsert` por cada uno de los 27 ejercicios (idempotente, mismo patrón que `ExerciseService.findOrCreate`). Corrido contra la Neon real vía `prisma db seed`. Verificado con login real con las credenciales nuevas.

**Archivos modificados/creados:**
`prisma/seed.ts`

---

#### HU-43 · Objetivo y Modalidad Administrables (no hardcodeados)
> **Como** trainer,
> **quiero** poder agregar, renombrar y eliminar las opciones de Objetivo y Modalidad desde el dashboard,
> **para** no depender de un enum fijo en el código cada vez que necesito una categoría nueva.

**Story Points:** 8
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-34

**Criterios de Aceptación:**
- [x] `Objetivo` y `Modalidad` dejan de ser enums de Postgres y pasan a ser tablas administrables (dos tablas dedicadas, no una genérica) — decisión tomada explícitamente con el trainer
- [x] Nivel queda fuera de este alcance a propósito — sigue siendo un enum fijo, por decisión explícita
- [x] Sección "Listas de alumnos" en el Dashboard con dos listas (Objetivos, Modalidades): agregar, renombrar inline, eliminar
- [x] Borrado protegido: si algún alumno tiene la opción asignada, se bloquea con un mensaje claro (mismo criterio que `ExerciseInUseError`/`TemplateBlockInUseError`) — nunca se orfanea ni se pierde el dato silenciosamente
- [x] Todos los puntos de consumo migrados: alta/edición de alumno, filtros del listado, asignación masiva, importación CSV

**Resumen de la implementación:**
Antes de tocar código se analizó el porqué de la decisión original (comentario en el schema: `objetivo` "se mantiene rígido a propósito", de HU-34) — esa decisión era sobre no volverlo texto libre, no sobre que fuera eterno-hardcodeado; una lista cerrada administrable sigue siendo "rígida" en el sentido correcto. Se migró de enum a modelo `Objetivo`/`Modalidad` (id + label único) vía una migración a mano que crea las tablas, siembra las 3+2 opciones que tenía el enum, hace backfill de `Student.objetivo_id`/`modalidad_id` desde los valores viejos, y recién ahí dropea las columnas enum y el tipo — todo en una sola migración transaccional, corrida contra la Neon real con datos reales de por medio (verificado que Carlos Jimenez conservó Fuerza/Gimnasio después del backfill).

Decisión de diseño clave: el **label es la clave de negocio** en todos los puntos de entrada humano (CSV, ejemplos de importación), mientras que el **id** es lo que viaja por los selects/formularios/filtros (generados por el propio `<select>`, nunca tipeados a mano) — evita tener que exponer UUIDs en un CSV que alguien edita en Excel, sin necesitar un campo `slug` aparte. El importador CSV resuelve label→id contra la lista actual antes de validar (mismo criterio que la resolución de DNI/ejercicio ya usada en HU-20/21); si el texto no matchea ninguna opción vigente, es un error de fila, no una creación silenciosa de una categoría nueva.

Capa de repos/servicios: dos implementaciones concretas (`ObjetivoRepository`/`ModalidadRepository`, `ObjetivoService`/`ModalidadService`) compartiendo un único tipo `ILabelOptionRepository` — decisión explícita de no generalizar en una tabla ni una clase repositorio genérica, siguiendo el mismo criterio que el resto del proyecto (Exercise y Student tampoco comparten una capa genérica pese a ser CRUDs similares). La capa de presentación sí se comparte (`ManagedListCard`, un solo componente cliente reusado para ambas listas) porque ahí la duplicación no aporta nada.

**Bug encontrado al verificar:** los filtros del listado de alumnos y del catálogo de ejercicios estaban rotos desde antes de esta HU — el mismo patrón de fondo que ya se había arreglado en HU-35/HU-19 (`z.string().min(1).optional()` sin `emptyToUndefined` sobre un campo que un formulario GET real siempre manda, aunque sea vacío) rompía el `safeParse` completo y descartaba todos los filtros en silencio. Se corrigió en `studentListQuerySchema`, `exerciseListQuerySchema` y el `filtersSchema` local de `asignar-masivo`, verificado filtrando por Objetivo en el listado real.

**Archivos modificados/creados:**
`prisma/schema.prisma` (`Objetivo`, `Modalidad`, `Student.objetivoId`/`modalidadId`) · `prisma/migrations/20260816220000_objetivo_modalidad_lookup_tables/` · `lib/repositories/interfaces.ts` · `lib/repositories/objetivo.repository.ts` (nuevo) · `lib/repositories/modalidad.repository.ts` (nuevo) · `lib/repositories/student.repository.ts` · `lib/services/objetivo.service.ts` (nuevo) · `lib/services/modalidad.service.ts` (nuevo) · `lib/actions/objetivo.actions.ts` (nuevo) · `lib/actions/modalidad.actions.ts` (nuevo) · `lib/actions/student.actions.ts` · `lib/actions/student-import.actions.ts` · `lib/validators/student.ts` · `lib/validators/exercise.ts` · `components/admin/managed-list-card.tsx` (nuevo) · `components/admin/filter-select.tsx` (nuevo) · `components/admin/student-form.tsx` · `components/admin/student-import-runner.tsx` · `app/(admin)/dashboard/page.tsx` · `app/(admin)/alumnos/page.tsx` · `app/(admin)/alumnos/nuevo/page.tsx` · `app/(admin)/alumnos/[id]/page.tsx` · `app/(admin)/alumnos/importar/page.tsx` · `app/(admin)/plantillas/[id]/asignar-masivo/page.tsx`

---

#### HU-44 · Importador de Alumnos: Columnas en Español, Fechas DD-MM-AAAA y Zona de Carga Visible
> **Como** trainer,
> **quiero** completar el CSV de alumnos con columnas en español y fechas en el formato que uso normalmente, y ver claramente dónde subir el archivo,
> **para** no depender de convenciones en inglés ni de un input casi invisible.

**Story Points:** 3
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-20

**Criterios de Aceptación:**
- [x] Las columnas del CSV están en español (`nombre`, `apellido`, `telefono`, `fecha_inicio_membresia`, `fecha_vencimiento_cuota`, `notas_salud`, etc.)
- [x] Las fechas se ingresan en formato DD-MM-AAAA (no AAAA-MM-DD)
- [x] La UI de `/alumnos/importar` tiene una zona clara para arrastrar o elegir el archivo, con un botón explícito para cargarlo — no un `<input type="file">` desnudo

**Resumen de la implementación:**
El input nativo sin estilos existía desde HU-20, pero renderiza como un link de texto chico casi invisible según el navegador — se reemplazó por una zona de drop (borde punteado, ícono, drag & drop + click) que solo *selecciona* el archivo; la lectura/validación real ahora requiere un click explícito en "Cargar archivo" (antes se disparaba sola en el `onChange`), tal como se pidió.

Los encabezados en español y el `createStudentSchema` interno (en inglés, sin tocar — lo usa también el formulario web) se concilian con una capa de traducción en el propio importador: se remapean las columnas del CSV (`nombre`→`firstName`, etc.) antes de validar, mismo criterio que ya se usaba para resolver `objetivo`/`modalidad` de texto a id (HU-43). Las fechas DD-MM-AAAA se convierten a ISO con una regex simple antes de llegar al schema — el `<input type="date">` del formulario web sigue mandando AAAA-MM-DD nativamente y no se tocó, evitando romper esa ruta. Verificado de punta a punta contra la Neon real: alumno importado con fecha `15-08-2026` quedó guardado como `2026-08-15` (15 de agosto, no una fecha mal interpretada), y una fecha en el formato viejo (`2026-08-15`) es rechazada con un error de fila claro en vez de importarse silenciosamente mal.

**Archivos modificados/creados:**
`components/admin/student-import-runner.tsx` · `app/(admin)/alumnos/importar/page.tsx`

---

#### HU-45 · Selector de Ejercicio con Búsqueda (Search-Select)
> **Como** trainer,
> **quiero** poder buscar un ejercicio por nombre en vez de desplazarme por un `<select>` largo,
> **para** armar plantillas más rápido a medida que el catálogo crece.

**Story Points:** 2
**Prioridad:** 🟢 Media
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] El selector de ejercicio en el armador de plantillas permite escribir para filtrar por nombre, en vez de un `<select>` nativo con toda la lista
- [x] Reutiliza un componente propio del proyecto (no una librería nueva) para mantener consistencia con el resto de la UI

**Resumen de la implementación:**
Se confirmó que shadcn sí tiene un componente `combobox` para el estilo `base-nova` (el que ya usa este proyecto), construido sobre `@base-ui/react` — la misma librería de primitivos que ya sostiene `select.tsx`/`dropdown-menu.tsx`/`alert-dialog.tsx`, así que no suma una dependencia nueva. Se instalaron `components/ui/combobox.tsx` e `components/ui/input-group.tsx` adaptando el registry oficial: se sacó `IconPlaceholder` (un helper interno del sitio de docs de shadcn que no existe fuera de ahí) por íconos de `lucide-react` directos, y se ajustaron los imports a las rutas de este proyecto. Se dejaron afuera los subcomponentes de selección múltiple (`Chips`) por no hacer falta para un selector simple.

En `TemplateBuilder`, el combobox usa ids de ejercicio como tipo de valor (no objetos) con `itemToStringLabel` resolviendo "Nombre (músculo)" — mantiene `block.exerciseId` como string igual que antes, sin tocar `toPayload()` ni el resto del componente. Encontrado y corregido al verificar: el mismo warning de `nativeButton` que ya había aparecido en HU-26, esta vez porque `ComboboxTrigger` sí renderiza un `<button>` real y el default del proyecto (`nativeButton ?? !render`) asume lo contrario cuando se le pasa un `render` — se corrigió pasando `nativeButton` explícito en ese único punto. Verificado en browser real: tipear "sent" filtra correctamente por substring (no solo prefijo) entre varios ejercicios que lo contienen, la selección persiste con el label completo, y el ejercicio elegido se guarda correctamente en la Neon real.

**Archivos modificados/creados:**
`components/ui/combobox.tsx` (nuevo) · `components/ui/input-group.tsx` (nuevo) · `components/admin/template-builder.tsx`

---

#### HU-46 · Armador de Plantillas: Jerarquía Visual (Esenciales/Avanzados) + Fix de Keys Duplicadas
> **Como** trainer,
> **quiero** que el armador de plantillas distinga los campos que casi siempre completo de los que uso rara vez, con más aire entre ellos,
> **para** cargar una rutina rápido sin sentir que estoy llenando un formulario denso donde todo pesa igual.

**Story Points:** 3
**Prioridad:** 🟡 Alta
**Estado:** `DONE`
**Depende de:** HU-33, HU-37, HU-45

**Criterios de Aceptación:**
- [x] Cada bloque de ejercicio separa campos esenciales (siempre visibles) de avanzados (colapsados detrás de "Opciones avanzadas")
- [x] Los campos avanzados tienen un ícono de información con tooltip explicando para qué sirven
- [x] Si un bloque ya tiene algún campo avanzado cargado (plantilla existente), la sección arranca desplegada — no esconde datos que ya están ahí
- [x] Se corrige el bug de keys de React duplicadas al agregar días/ejercicios rápido

**Resumen de la implementación:**
División: esenciales = Ejercicio, Series, Reps, Peso (kg), Descanso (seg) — lo que se completa en casi todos los ejercicios. Avanzados = Esquema de reps, Duración (seg), Intensidad, Tempo, Grupo, Descanso post-bloque, Notas del trainer — casos particulares (esquema variable, superseries, ejercicios por tiempo). El toggle es local por bloque (`Set<string>` de keys expandidas), no global, así que expandir uno no afecta a los demás. Se instaló `components/ui/tooltip.tsx` desde el registry de shadcn para el estilo `base-nova` (mismo criterio que `combobox`/`input-group` en HU-45), con un ícono `Info` de lucide-react como trigger.

**Bug de raíz encontrado y corregido de paso** (reportado por el usuario con captura de consola): `keyCounter` para generar keys de React (`${uid}-${keyCounter++}`) era una variable local `let` declarada en el cuerpo del componente — se reinicia en cada render. Si dos clicks en "Agregar día"/"Agregar ejercicio" disparaban desde closures de renders distintos, ambos podían calcular el mismo sufijo y colisionar (`Encountered two children with the same key`). Se cambió a `useRef(0)`, que sí persiste entre renders. Verificado agregando 2 días y 3 ejercicios en secuencia rápida sin errores en consola.

Verificado en browser real contra la Neon: plantilla creada con un ejercicio con Grupo="A" y Descanso post-bloque=60 guardada correctamente; al reabrir esa plantilla para editar, la sección avanzada de ese bloque aparece ya desplegada con los valores correctos (no hay que buscarlos).

**Archivos modificados/creados:**
`components/ui/tooltip.tsx` (nuevo) · `components/admin/template-builder.tsx`

---

#### HU-47 · Link "Volver" en Detalle de Plantilla y Asignación Masiva
> **Como** trainer,
> **quiero** un link "Volver" en las pantallas de detalle de plantilla y asignación masiva,
> **para** no depender del botón atrás del navegador para salir de ahí.

**Story Points:** 1
**Prioridad:** 🟢 Media
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] `/plantillas/[id]` tiene un link "Volver" (`variant="link"`, con ícono) que navega a `/plantillas`
- [x] `/plantillas/[id]/asignar-masivo` tiene el mismo link, navegando de vuelta al detalle de esa plantilla

**Resumen de la implementación:**
`Button` ya tenía un `variant="link"` sin usar en ningún lado del proyecto — se usó tal cual, con `ArrowLeft` de lucide-react, en vez de agregar un componente nuevo. Verificado en browser real: navega correctamente en ambas pantallas.

**Archivos modificados/creados:**
`app/(admin)/plantillas/[id]/page.tsx` · `app/(admin)/plantillas/[id]/asignar-masivo/page.tsx`

---

**Nota de cierre de EP-15:** el contraste de los botones `outline`/`secondary` y el cambio de tipografía (los dos puntos que quedaban abiertos de la conversación sobre UI) los resolvió el propio usuario directamente en el código, fuera de este flujo de tickets — confirmado visualmente en las verificaciones de HU-46/HU-47 (botones ya legibles sobre fondo gris). No se abre ticket para eso porque no hay una implementación de esta sesión que documentar.

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

════════════════════════════════════
MVP 1 termina acá — HU-01 a HU-29
════════════════════════════════════

ONDA 8 — MVP 2, Fase 1
────────────────────────────────────
HU-30 Cronómetro de Descanso                    ✅
HU-31 Acciones Rápidas de WhatsApp              ✅
HU-32 Peso Corporal Histórico                   ✅
HU-37 Prescripción Enriquecida (peso/RPE/reps)  ✅
HU-38 Fix: editar plantilla con overrides       ✅ (creció a 8pts — también afectaba progress_logs)
HU-34 Objetivos Flexibles                       ✅
HU-36 Dashboard Deportivo (adherencia + alertas) ✅
HU-33 Bloques y Superseries                      ✅
HU-35 Notas Tipificadas                          ✅
════════════════════════════════════
MVP 2, Fase 1 (EP-13) termina acá — HU-30 a HU-38
════════════════════════════════════

ONDA 9 — MVP 2, Fase 2
────────────────────────────────────
HU-39 Tempo Prescrito                            ✅
════════════════════════════════════
MVP 2, Fase 2 (EP-14) termina acá — HU-39
════════════════════════════════════

ONDA 10 — Mejoras de UI y Administración
────────────────────────────────────
HU-41 Mejoras de UI (inputs, fecha, acciones en tablas)  ✅
HU-42 Seed real (admin + catálogo de ejercicios)         ✅
HU-43 Objetivo y Modalidad administrables                ✅
HU-44 Importador de alumnos (español, fechas, zona de carga) ✅
HU-45 Selector de ejercicio con búsqueda (combobox)      ✅
HU-46 Jerarquía visual esenciales/avanzados + fix keys   ✅
HU-47 Link "Volver" en plantilla/asignación masiva       ✅
════════════════════════════════════
════════════════════════════════════
EP-15 termina acá — HU-41 a HU-47 (contraste de botones y tipografía resueltos por el usuario directamente)
════════════════════════════════════

ONDA 11 — Multi-tenant & Plataforma SaaS (Slug-in-Path)
────────────────────────────────────
HU-48 Schema Multi-tenant & Migración DB            📋 TO DO
HU-49 Auth Unificado & Sesión JWT con Tenant        📋 TO DO
HU-50 Repositorios & Servicios Aislados por Tenant  📋 TO DO
HU-51 Ruteo Dinámico Portal Alumno (/[coachSlug])   📋 TO DO
HU-52 Panel SuperAdmin (Gestión Coaches & Slugs)    📋 TO DO
HU-53 Configuración Marca Blanca & Perfil Coach     📋 TO DO
════════════════════════════════════
EP-16 en desarrollo — HU-48 a HU-53
════════════════════════════════════
```

---

## EP-16 — Arquitectura Multi-tenant & SaaS (Slug-in-Path) 🚀

> **Objetivo:** Permitir que la plataforma funcione como un SaaS multi-tenant con un único build y deployment, donde múltiples entrenadores gestionan sus propios alumnos, planes y rutinas de manera totalmente aislada, contando con un portal público por slug (`tuapp.com/[coachSlug]`) con marca blanca dinámica y un panel de administración global (SuperAdmin).

---

#### HU-48 · Schema Multi-tenant y Migración de Base de Datos
> **Como** desarrollador,  
> **quiero** adaptar el schema de Prisma para soportar multi-tenancy con discriminador `trainerId`, roles de usuario (`SUPERADMIN`, `COACH`), unicidad compuesta (`[trainerId, dni]`, `[trainerId, name]`) y campos de marca blanca,  
> **para** que la base de datos garantice integridad referencial y aislamiento estricto por entrenador sin pérdida de datos existentes.

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** —

**Criterios de Aceptación:**
- [x] Enum `Role` (`SUPERADMIN`, `COACH`) agregado a `Trainer` con valor por defecto `COACH`.
- [x] Modelo `Trainer` incluye: `slug` (`@unique`), `businessName`, `headline`, `tagline`, `logoUrl`, `heroImageUrl`, `whatsappNumber`, `instagramUrl`, `isActive` (`Boolean @default(true)`).
- [x] Modelos vinculados con FK obligatoria `trainerId`: `Student`, `Plan`, `RoutineTemplate`, `GenericProfile`.
- [x] Unicidad de DNI modificada: `@@unique([trainerId, dni])` reemplaza a `@unique` global en `Student`.
- [x] Unicidad de Planes modificada: `@@unique([trainerId, name])` reemplaza a `@unique` global en `Plan`.
- [x] Migración SQL (`prisma migrate deploy`) ejecutada exitosamente, asignando los datos existentes en la base de datos al entrenador por defecto (Santiago Ramón con slug `santiago-ramon`).
- [x] `seed.ts` actualizado para sembrar un SuperAdmin (`admin@plataforma.com`) y dos entrenadores de prueba (`santiago-ramon` y `coach-demo`).

**Resumen de la implementación:**
Se actualizó `prisma/schema.prisma` con las claves foráneas obligatorias `trainerId` (onDelete: Cascade) en `Student`, `Plan`, `RoutineTemplate` y `GenericProfile`. Se reemplazaron las restricciones de unicidad global por restricciones compuestas por entrenador (`[trainerId, dni]`, `[trainerId, name]`, `[trainerId, level]`). Se generó y aplicó la migración `20260917000000_add_multitenant_trainer_and_slugs` con backfill automático en Neon DB. Se actualizaron los repositorios y servicios con resolución de tenant y soporte para unicidad compuesta, manteniendo 100% de tests unitarios pasando y 0 errores de TypeScript.

**Archivos modificados/creados:**
`prisma/schema.prisma` · `prisma/migrations/20260917000000_add_multitenant_trainer_and_slugs/migration.sql` · `prisma/seed.ts` · `lib/tenant.ts` · `lib/repositories/interfaces.ts` · `lib/repositories/student.repository.ts` · `lib/repositories/plan.repository.ts` · `lib/repositories/routine-template.repository.ts` · `lib/repositories/generic-profile.repository.ts` · `lib/services/generic-profile.service.test.ts` · `lib/services/payment.service.test.ts` · `lib/services/plan.service.test.ts` · `lib/mappers/template-routine.mapper.test.ts`

---

#### HU-49 · Autenticación Unificada y Sesión JWT con Claims de Tenant
> **Como** entrenador o SuperAdmin,  
> **quiero** autenticarme en un único formulario de login y que mi sesión contenga mi rol, ID de entrenador y slug,  
> **para** que el sistema autorice mis acciones y me redirija al panel correspondiente (`/dashboard` o `/superadmin`).

**Story Points:** 3  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-48

**Criterios de Aceptación:**
- [x] `lib/auth.ts` actualizado: callback `jwt` y `session` extienden el token con `trainerId`, `role` y `slug`.
- [x] Guard de autenticación (`proxy.ts`) verifica que un usuario con rol `COACH` solo acceda a `/(admin)/*`.
- [x] Guard de `/(superadmin)/*` restringe el acceso exclusivamente a usuarios con rol `SUPERADMIN` (403/redirect a login para el resto).
- [x] Al iniciar sesión: SuperAdmin es redirigido a `/superadmin`, Coach es redirigido a `/dashboard`.
- [x] Si un coach está marcado como `isActive: false`, el login es rechazado con mensaje de cuenta suspendida.

**Resumen de la implementación:**
Se extendió la configuración de NextAuth v5 en `lib/auth.ts` con tipado extendido de sesión (`User`, `Session`, `JWT`), inyección de claims (`id`, `role`, `slug`, `isActive`) en los callbacks `jwt` y `session`, validación de cuentas activas en `authorize`, y creación de helpers `requireAuth()`, `requireCoachAuth()` y `requireSuperAdminAuth()`. Se actualizó `proxy.ts` con protección de rutas administrativas y SuperAdmin, y la pantalla de login con soporte para error de cuentas inactivas.

**Archivos modificados/creados:**
`lib/auth.ts` · `proxy.ts` · `app/login/page.tsx`

---

#### HU-50 · Repositorios y Servicios Aislados por Tenant
> **Como** desarrollador,  
> **quiero** que todas las capas de acceso a datos y servicios exijan `trainerId` de manera obligatoria en sus queries y mutaciones,  
> **para** evitar cualquier posibilidad de fuga de datos o modificación accidental entre diferentes entrenadores (Cross-tenant Data Leak).

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-48, HU-49

**Criterios de Aceptación:**
- [x] `IStudentRepository`, `IPlanRepository`, `IRoutineRepository`, `IPaymentRepository` actualizados para requerir `trainerId` en métodos de lectura (`findAll`, `findById`, `findByDni`) y escritura (`create`, `update`, `delete`).
- [x] Todos los queries de Prisma incluyen la cláusula `where: { trainerId }`.
- [x] Services (`StudentService`, `PlanService`, `RutinaService`, `PaymentService`) validan que la entidad pertenezca al `trainerId` antes de ejecutar mutaciones.
- [x] Server Actions obtienen el `trainerId` directamente de la sesión validada del servidor (`requireCoachAuth()`), nunca de parámetros confiados al cliente.
- [x] Tests unitarios en Vitest actualizados y pasando al 100% para verificar el aislamiento de tenant.

**Resumen de la implementación:**
Se actualizaron todos los servicios (`StudentService`, `PlanService`, `RoutineTemplateService`, `PaymentService`) y Server Actions (`student.actions.ts`, `plan.actions.ts`, `routine-template.actions.ts`, `assignment.actions.ts`, `payment.actions.ts`, `subscription.actions.ts`, `bulk-assignment.actions.ts`, `student-import.actions.ts`, `routine-import.actions.ts`) para autenticar al usuario y scoped los registros al `trainerId` de la sesión activa. Se crearon tests unitarios en `lib/services/student.service.test.ts` que prueban el aislamiento multi-tenant y la unicidad de DNI por entrenador.

**Archivos modificados/creados:**
`lib/services/student.service.ts` · `lib/services/plan.service.ts` · `lib/services/routine-template.service.ts` · `lib/services/payment.service.ts` · `lib/actions/student.actions.ts` · `lib/actions/plan.actions.ts` · `lib/actions/routine-template.actions.ts` · `lib/actions/assignment.actions.ts` · `lib/actions/payment.actions.ts` · `lib/actions/subscription.actions.ts` · `lib/actions/bulk-assignment.actions.ts` · `lib/actions/student-import.actions.ts` · `lib/actions/routine-import.actions.ts` · `lib/services/student.service.test.ts`

---

#### HU-51 · Ruteo Dinámico del Portal del Alumno por Slug (`/[coachSlug]`)
> **Como** alumno,  
> **quiero** acceder al enlace personalizado de mi entrenador (`tuapp.com/[coachSlug]`) para ver su identidad de marca y consultar mi rutina ingresando mi DNI,  
> **para** tener una experiencia 100% identificada con mi profesor y acceder a mi entrenamiento de manera rápida.

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-48, HU-50

**Criterios de Aceptación:**
- [x] Rutas migradas a `app/[coachSlug]/page.tsx`, `app/[coachSlug]/rutina/[dni]/page.tsx` y `app/[coachSlug]/rutina/generico/[level]/page.tsx`.
- [x] `layout.tsx` dentro de `[coachSlug]` consulta el perfil del entrenador por slug; si no existe o está suspendido (`isActive: false`), retorna `notFound()` o pantalla informativa.
- [x] Metadatos y SEO (`generateMetadata`) se generan dinámicamente con el nombre y branding del entrenador.
- [x] La consulta por DNI busca al alumno filtrando estrictamente por `(trainerId, dni)`.
- [x] Control de acceso (`StudentAccessBlocked` / cuotas vencidas) muestra los datos de contacto (WhatsApp/Instagram) específicos del entrenador consultado con enlace directo de WhatsApp.

**Resumen de la implementación:**
Se implementó el ruteo dinámico por slug en `app/[coachSlug]/layout.tsx` (con `generateMetadata`, blacklist de slugs reservados y pantalla de suspensión), `app/[coachSlug]/page.tsx` (home de alumno con logo y textos dinámicos del coach), `app/[coachSlug]/rutina/[dni]/page.tsx` (rutina del alumno aislada por `coach.id` y `dni`), y `app/[coachSlug]/rutina/generico/[level]/page.tsx`. Se actualizó `StudentAccessBlocked` para integrar contacto directo vía WhatsApp e Instagram del profesor. Se configuró redirección automática en la raíz `/` y `/rutina/[dni]` hacia el slug del entrenador por defecto.

**Archivos modificados/creados:**
`lib/validators/slug.ts` · `app/[coachSlug]/layout.tsx` · `app/[coachSlug]/page.tsx` · `app/[coachSlug]/rutina/[dni]/page.tsx` · `app/[coachSlug]/rutina/generico/[level]/page.tsx` · `components/portal/student-access-blocked.tsx` · `lib/services/generic-profile.service.ts` · `app/(portal)/page.tsx` · `app/(portal)/rutina/[dni]/page.tsx`

---

#### HU-52 · Panel de SuperAdmin: Gestión de Profesores y Slugs
> **Como** SuperAdmin (Dueño de la Plataforma),  
> **quiero** un panel administrativo para dar de alta entrenadores, asignarles un slug único, activar/suspender sus cuentas y ver estadísticas globales,  
> **para** operar y comercializar el SaaS sin necesidad de modificar código ni base de datos manualmente.

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`  
**Depende de:** HU-48, HU-49

**Criterios de Aceptación:**
- [x] Vista `/superadmin` con KPIs globales: Total de entrenadores activos/suspendidos, total de alumnos registrados y con membresía activa, rutinas activas y tasa de actividad de tenants.
- [x] CRUD de Entrenadores (`/superadmin/coaches`): Formulario de alta con nombre, email, contraseña temporal, slug, nombre comercial y WhatsApp.
- [x] Validación de Slugs con Zod: Formato url-safe (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) y rechazo estricto contra la lista de palabras reservadas (`RESERVED_SLUGS`).
- [x] Acción de Suspender / Reactivar entrenador (bloquea inmediatamente acceso al admin del coach y al portal de sus alumnos) con diálogo de confirmación.
- [x] Reemplazo seguro de contraseña para soporte de cuentas con hash bcrypt.

**Resumen de la implementación:**
Se implementó el panel completo de SuperAdmin protegido en `app/(superadmin)/layout.tsx` (exige rol `SUPERADMIN`), `app/(superadmin)/superadmin/page.tsx` (dashboard con KPIs globales) y `app/(superadmin)/superadmin/coaches/page.tsx` (tabla de profesores con estado, slug con enlace al portal y conteos de alumnos y plantillas). Se desarrollaron las Server Actions en `lib/actions/superadmin.actions.ts` (`createCoachAction`, `toggleCoachStatusAction`, `resetCoachPasswordAction`) y componentes reactivos (`SuperAdminNavbar`, `CreateCoachDialog`, `CoachStatusToggle`, `ResetPasswordDialog`).

**Archivos modificados/creados:**
`lib/validators/superadmin.ts` · `lib/validators/superadmin.test.ts` · `lib/actions/superadmin.actions.ts` · `components/superadmin/superadmin-navbar.tsx` · `components/superadmin/create-coach-dialog.tsx` · `components/superadmin/coach-status-toggle.tsx` · `components/superadmin/reset-password-dialog.tsx` · `app/(superadmin)/layout.tsx` · `app/(superadmin)/superadmin/page.tsx` · `app/(superadmin)/superadmin/coaches/page.tsx` · `proxy.ts`

---

#### HU-53 · Configuración de Marca Blanca y Perfil del Coach
> **Como** entrenador,  
> **quiero** una sección de Configuración en mi panel para personalizar mi nombre comercial, logotipo, imagen de portada, titular, número de WhatsApp y usuario de Instagram,  
> **para** que mi portal de alumnos refleje mi marca personal sin depender del equipo técnico.

**Story Points:** 3  
**Prioridad:** 🟡 Alta  
**Estado:** `DONE`  
**Depende de:** HU-48, HU-50

**Criterios de Aceptación:**
- [x] Nueva pantalla `/configuracion` en el panel del coach con formulario reactivo.
- [x] Campos editables: Nombre comercial (`businessName`), Titular (`headline`), Bajada (`tagline`), URL de Logo (`logoUrl`), URL de Portada (`heroImageUrl`), Teléfono WhatsApp (`whatsappNumber`) e Instagram (`instagramUrl`).
- [x] Previsualización en vivo de cómo se verá la tarjeta de bienvenida en el portal del alumno en un mockup mobile.
- [x] Persistencia directa en el registro `Trainer` del usuario autenticado con feedback de guardado exitoso y enlace directo al portal.

**Resumen de la implementación:**
Se creó la vista `app/(admin)/configuracion/page.tsx` y el componente `CoachProfileForm` (`components/admin/coach-profile-form.tsx`) que incluye formulario completo con previsualización en vivo estilo mockup móvil del portal del alumno con actualización instantánea de logo, titular, bajada y contacto. Se implementó la Server Action `updateCoachProfileAction` en `lib/actions/coach-profile.actions.ts` y se agregó el enlace de Configuración a la barra de navegación del panel (`components/admin/admin-navbar.tsx`).

**Archivos modificados/creados:**
`lib/validators/coach-profile.ts` · `lib/validators/coach-profile.test.ts` · `lib/actions/coach-profile.actions.ts` · `components/admin/coach-profile-form.tsx` · `app/(admin)/configuracion/page.tsx` · `components/admin/admin-navbar.tsx`

---

### 🏢 EP-17 — Modelo SaaS, Límites de Planes y Catálogo Master de Ejercicios

---

#### HU-54 · Catálogo Master de Ejercicios y Copy-on-Write para Entrenadores
> **Como** SuperAdmin y como Entrenador,  
> **quiero** contar con una biblioteca global de ejercicios gestionada por la plataforma y que los entrenadores puedan personalizar ejercicios sin alterar la base compartida,  
> **para** que cada profesor tenga una biblioteca completa de arranque y libertad de adaptación con aislamiento estricto.

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Modelo `Exercise` actualizado con `trainerId String?` (`null` para ejercicios master).
- [x] Sección de SuperAdmin en `/superadmin/ejercicios` para crear, editar y eliminar ejercicios del catálogo global.
- [x] Diálogos accesibles con soporte para grupos musculares, nombre y enlace a video de YouTube.
- [x] Lógica de Copy-on-Write en `ExerciseService`: si un entrenador edita un ejercicio master (`trainerId === null`), se clona automáticamente una versión privada para su cuenta (`trainerId = coachId`) y se reasignan las rutinas del coach sin alterar el catálogo global.
- [x] Prevención de eliminación de ejercicios master por parte de los entrenadores (solo pueden eliminar sus propios ejercicios creados o copiados).

**Resumen de la implementación:**
Se agregaron índices y relación opcional con `Trainer` en el esquema de Prisma. Se implementó la migración `20260918162936_add_saas_tier_limits_and_master_exercises`. Se actualizaron `ExerciseRepository` y `ExerciseService` con lógica Copy-on-Write y filtrado de catálogo unificado con prioridad de sobrescritura local. Se crearon la página `/superadmin/ejercicios` y los componentes `MasterExerciseDialog` y `DeleteMasterExerciseButton`.

**Archivos modificados/creados:**
`prisma/schema.prisma` · `lib/repositories/exercise.repository.ts` · `lib/services/exercise.service.ts` · `lib/actions/exercise.actions.ts` · `components/superadmin/exercise-dialog.tsx` · `components/superadmin/delete-master-exercise-button.tsx` · `app/(superadmin)/superadmin/ejercicios/page.tsx` · `components/superadmin/superadmin-navbar.tsx`

---

#### HU-55 · Límites Configurables de Planes y Alumnos por Coach
> **Como** SuperAdmin,  
> **quiero** definir límites máximos de planes activos (`maxPlans`) y alumnos activos (`maxStudents`) para cada entrenador,  
> **para** poder vender la plataforma bajo diferentes tiers/niveles comerciales (Base, Avanzado, Pro).

**Story Points:** 5  
**Prioridad:** 🔴 Crítica  
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Modelo `Trainer` con campos `maxPlans Int @default(1)` y `maxStudents Int @default(10)`.
- [x] `PlanService` valida el límite dinámico del coach al crear o reactivar planes (`activeCount >= trainer.maxPlans`), bloqueando la creación si se superó el cupo.
- [x] `StudentService` valida el límite dinámico del coach al crear, reactivar o importar masivamente alumnos por CSV (`activeCount >= trainer.maxStudents`).
- [x] Interfaz de administración de planes (`PlanManager`) muestra el cupo actual dinámicamente (`{activePlans.length} / {maxPlans}`) y bloquea el botón si se alcanzó el límite.
- [x] Mensajes descriptivos al alcanzar los cupos indicando contactar al administrador para ampliar el plan.

**Resumen de la implementación:**
Se implementaron `PlanLimitReachedError` y `StudentLimitReachedError` con soporte para inyección de dependencias (`limitsLookup`) para pruebas unitarias limpias. Se actualizaron las acciones de servidor de alumnos y planes para capturar las excepciones y renderizar feedback visual claro en los formularios. Se agregaron tests unitarios verificando la aplicación estricta de cupos.

**Archivos modificados/creados:**
`lib/services/plan.service.ts` · `lib/services/plan.service.test.ts` · `lib/services/student.service.ts` · `lib/services/student.service.test.ts` · `components/admin/plan-manager.tsx` · `app/(admin)/planes/page.tsx` · `lib/actions/student.actions.ts` · `components/admin/student-form.tsx`

---

#### HU-56 · Trazabilidad de Membresías y Gestión Comercial en SuperAdmin
> **Como** SuperAdmin,  
> **quiero** visualizar la fecha de alta (`createdAt`), última actualización (`updatedAt`), vencimiento de membresía (`membershipExpiresAt`) y cupos de cada profesor,  
> **para** auditar el ciclo de vida del cliente y ajustar sus parámetros contractuales de manera manual.

**Story Points:** 3  
**Prioridad:** 🟡 Alta  
**Estado:** `DONE`

**Criterios de Aceptación:**
- [x] Diálogos `CreateCoachDialog` y `EditCoachDialog` permiten ingresar o actualizar `Cupo Alumnos`, `Cupo Planes` y `Vencimiento Membresía`.
- [x] Esquemas de validación Zod (`createCoachSchema`, `updateCoachBySuperAdminSchema`) validan tipos y mínimos enteros.
- [x] Tabla de entrenadores `/superadmin/coaches` presenta columnas para `Cupo Alumnos` (consumidos / contratados), `Cupo Planes`, fecha de `Alta` formateada y `Vencimiento`.
- [x] Indicador para profesores sin fecha límite de membresía explícita ("Sin límite").

**Resumen de la implementación:**
Se agregaron campos y validaciones numéricas y de fecha en `lib/validators/superadmin.ts` y persistencia en `lib/actions/superadmin.actions.ts`. Se actualizaron los modales de creación y edición en `components/superadmin` y la tabla resumen en `app/(superadmin)/superadmin/coaches/page.tsx`.

**Archivos modificados/creados:**
`lib/validators/superadmin.ts` · `lib/actions/superadmin.actions.ts` · `components/superadmin/create-coach-dialog.tsx` · `components/superadmin/edit-coach-dialog.tsx` · `app/(superadmin)/superadmin/coaches/page.tsx`

---

## Resumen de Story Points

### MVP 1 (cerrado)

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
| **Subtotal MVP 1** | **29 HUs** | **106 pts** |

### MVP 2

| Épica | Tickets | Story Points |
|---|---|---|
| EP-13 Seguimiento y Coaching (Fase 1) — cerrada ✅ | 9 | 45 |
| EP-14 Seguimiento y Coaching (Fase 2) — cerrada ✅ | 1 | 2 |
| EP-15 Mejoras de UI y Administración — cerrada ✅ | 7 | 21 |
| EP-16 Multi-tenant & SaaS (Slug-in-Path) — cerrada ✅ | 6 | 26 |
| EP-17 Modelo SaaS y Catálogo Master — cerrada ✅ | 3 | 13 |
| **Subtotal MVP 2** | **26 HUs** | **107 pts** |

| | |
|---|---|
| **TOTAL GENERAL** | **55 HUs · 213 pts** |

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
