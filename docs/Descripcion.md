# Santiago Ramón — Plataforma de Gestión de Alumnos y Rutinas

**Qué es este documento:** una descripción funcional de lo que la plataforma hace hoy, escrita para presentarle a un entrenador real y que evalúe si cubre su forma de trabajar. No tiene lenguaje técnico — es un recorrido por las pantallas y funciones tal como las usaría un entrenador o un alumno.

---

## 1. La idea en dos líneas

Una web donde vos (el entrenador) administrás tus alumnos, tu catálogo de ejercicios y tus rutinas desde una computadora o el celular, con usuario y contraseña. Tus alumnos entran a otra parte de esa misma web **solo con su DNI** (sin usuario ni contraseña) para ver la rutina del día y anotar lo que hicieron.

---

## 2. Lo que podés hacer vos, como entrenador

### Alumnos
- Alta de un alumno con sus datos: nombre, apellido, DNI, email, teléfono, objetivo (hipertrofia / fuerza / descenso), nivel (principiante / intermedio / avanzado), modalidad (gimnasio / casa), fecha de inicio de membresía, fecha de vencimiento de cuota, y notas de salud o lesiones.
- Editar cualquier dato de un alumno (menos el DNI, que es su identificador fijo).
- Buscar por nombre o DNI, y filtrar por objetivo, nivel, modalidad o estado (activo/inactivo).
- Ver de un vistazo qué alumnos tienen la cuota vencida (badge en rojo) y cuáles al día (badge en verde).
- Desactivar un alumno que dejó de entrenar (no se borra nada, solo deja de aparecer en el listado y pierde el acceso al portal) — y reactivarlo si vuelve.
- **Carga masiva por planilla:** subir un archivo CSV con muchos alumnos a la vez, con una plantilla descargable de ejemplo. El sistema revisa todo el archivo antes de cargar nada: si hay un error en cualquier fila (DNI repetido, dato faltante), no importa nada y te dice exactamente en qué fila está el problema.

### Ejercicios
- Catálogo de ejercicios con nombre, músculo principal, músculo secundario y un video demostrativo (YouTube o Vimeo).
- Al tocar "Ver video", se abre ahí mismo en un cuadro flotante — no te saca de la pantalla.
- Buscador y filtro por grupo muscular.

### Plantillas de rutina
- Armar una rutina "molde" organizada por días (ej. "Día 1 – Torso"), y dentro de cada día agregar ejercicios con series, repeticiones (o duración si es por tiempo), descanso sugerido y una nota técnica tuya.
- Reordenar los ejercicios dentro de un día.
- Duplicar una plantilla entera para armar variantes rápido, sin tocar la original.
- Editar una plantilla ya creada sin que eso afecte a los alumnos que ya la tienen asignada — cada alumno conserva la versión que le diste el día de la asignación.
- **Importar plantillas completas por planilla:** subir un CSV que arma de una sola vez ejercicios nuevos (si no existen todavía en tu catálogo), días, bloques, y hasta la asignación directa a un alumno puntual por su DNI.

### Asignar rutinas
- Asignación individual: elegís una plantilla para un alumno y podés personalizarle series, repeticiones o notas puntuales sin tocar la plantilla base.
- Asignación masiva: elegís una plantilla y un filtro de alumnos (por objetivo, nivel, modalidad, o combinación) y se la asignás a todos de una — con vista previa de a cuántos afecta antes de confirmar, y un reporte final de cuántas salieron bien.
- Un alumno solo puede tener **una** rutina activa a la vez — al asignarle una nueva, la anterior pasa automáticamente a su historial (no se pierde, queda accesible como consulta).

### Seguimiento
- Ficha de cada alumno con el historial completo de rutinas que tuvo (activa e históricas).
- Historial de progreso: qué marcó como completado, qué peso usó, y qué notas dejó en cada sesión — con filtro por rango de fechas.
- Pantalla de inicio con un resumen numérico: alumnos activos, cuotas vencidas o por vencer en los próximos 7 días, y rutinas activas.

---

## 3. Lo que puede hacer tu alumno

Sin descargar nada ni crear ninguna cuenta:

1. Entra a la web desde el celu e ingresa su DNI.
2. Ve su rutina activa organizada por día (formato acordeón, pensado para leerse fácil en el gimnasio con buena luz y letra grande).
3. Por cada ejercicio ve: nombre, series, repeticiones o duración, descanso sugerido, tu nota técnica, y puede tocar para ver el video demostrativo sin salir de la pantalla.
4. Marca cada ejercicio como completado con un check grande y táctil, y anota el peso que usó.
5. Puede dejar una nota corta de esa sesión (por ejemplo, una molestia o una sustitución que hizo).
6. Todo se guarda solo — no hay botón de "guardar", ni contraseña que se pueda olvidar.

---

## 4. Identidad visual

La plataforma (panel y portal) ya está vestida con tu marca: la paleta de negro y rojo extraída de tu logo, y una tipografía con identidad deportiva — no es un sistema genérico.

---

## 5. Lo que la plataforma **no** hace todavía

Para que la conversación sea concreta, esto es lo que queda explícitamente afuera del alcance actual:

- **No cobra ni registra pagos.** Solo guarda una fecha de vencimiento de cuota como referencia visual — no hay integración con Mercado Pago, tarjetas, ni historial de pagos.
- **No tiene planes ni tarifas** (mensual, trimestral, por clase, etc.) — es agnóstico a cómo cobrás.
- **No envía avisos** (WhatsApp, email, notificación push) cuando se vence una cuota o cuando le asignás una rutina nueva a alguien. Hoy esa información solo se ve si vos entrás a mirarla.
- **Un solo entrenador.** No está pensado para que varios profesores compartan el mismo panel con permisos distintos.
- **Importación solo en CSV**, no en Excel (.xlsx).
- **No mide asistencia física** al gimnasio — solo registra lo que el alumno carga desde su celular.
- **No hay chat ni mensajería** entre vos y el alumno dentro de la plataforma (las notas de sesión son de una sola vía, el alumno te escribe a vos, no hay respuesta dentro del sistema).
- **El progreso se ve como lista, no como gráfico** — no hay todavía una curva de evolución de cargas por ejercicio.
- **No genera reportes exportables** (PDF, planilla de resumen mensual, etc.).
- **Todavía no está publicada en internet** — corre en un entorno de pruebas, el paso de subirla a un dominio real está pendiente.

---

## 6. Preguntas para vos

Estas son las que más nos van a ayudar a saber si falta algo importante:

1. ¿Con cuántos alumnos activos trabajás hoy? ¿El nivel de detalle que ves en la ficha del alumno te alcanza, o necesitás algo más específico de tu rutina de trabajo?
2. ¿Cómo cobrás las cuotas hoy? ¿Te serviría que el sistema lleve un registro de pagos, o preferís mantenerlo separado?
3. ¿Necesitás que el sistema te avise (o le avise al alumno) cuando se vence una cuota o se asigna una rutina nueva? ¿Por qué medio te resultaría útil — WhatsApp, mail, otro?
4. Además de peso y notas, ¿qué otra información de la sesión te gustaría ver — series efectivas, percepción de esfuerzo (RPE), fotos de progreso, medidas corporales?
5. ¿Trabajás solo o hay otro profe que en algún momento necesitaría entrar a este mismo panel?
6. Para armar rutinas y ver el catálogo de ejercicios, ¿lo harías principalmente desde la compu o también desde el celular?
7. ¿Te sirve ver el progreso como lista cronológica, o preferirías algo más visual (un gráfico de evolución de cargas por ejercicio, por ejemplo)?
8. ¿Hay algo de tu rutina diaria como entrenador — armando planes, hablando con alumnos, cobrando — que no viste reflejado en nada de lo de arriba?

---

*Este documento describe el estado actual de la plataforma (Agosto 2026) y se actualiza a medida que se agregan funcionalidades.*
