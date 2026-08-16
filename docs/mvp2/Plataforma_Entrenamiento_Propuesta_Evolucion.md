# Plataforma de Gestión de Alumnos y Rutinas
## Propuesta de evolución funcional — Entrenamiento, Seguimiento y Coaching

**Documento de planificación para Producto + Desarrollo**  
**Fecha:** Agosto 2026  
**Estado:** Propuesta funcional

---

# 1. Visión general

La plataforma actual tiene una base sólida para:

- administrar alumnos;
- administrar ejercicios;
- crear plantillas de rutinas;
- asignar rutinas;
- registrar lo realizado por el alumno;
- consultar historial.

El principal salto de producto propuesto es pasar de un sistema centrado en **"entregar rutinas"** a un sistema centrado en:

> **Programar → Ejecutar → Medir → Evaluar → Ajustar**

La plataforma debería ayudar al entrenador a responder:

- ¿El alumno hizo lo prescrito?
- ¿Con qué carga y repeticiones?
- ¿Qué tan cerca del fallo estuvo?
- ¿Está progresando?
- ¿Está cumpliendo el plan?
- ¿Tiene molestias o signos de fatiga?
- ¿Hay ejercicios estancados?
- ¿Necesito modificar la programación?

La prioridad no debería ser agregar muchas funcionalidades administrativas, sino construir un **motor de seguimiento del entrenamiento** sólido.

---

# 2. Principio central del nuevo producto

El concepto central debería evolucionar desde:

```text
Rutina → Alumno
```

hacia:

```text
Ejercicio
   ↓
Prescripción
   ↓
Sesión
   ↓
Serie ejecutada
   ↓
Datos reales
   ↓
Progreso
   ↓
Evaluación
   ↓
Nueva programación
```

Esto permitirá que la plataforma sea una verdadera herramienta de coaching y no solamente un gestor de rutinas.

---

# 3. Registro por serie

## Problema actual

Actualmente se contempla registrar principalmente el peso utilizado.

Eso es insuficiente para analizar entrenamiento de fuerza/hipertrofia.

## Propuesta

Cada ejercicio ejecutado debería poder registrar:

- peso;
- repeticiones reales;
- RIR;
- estado de completado;
- opcionalmente duración;
- opcionalmente notas.

Ejemplo:

```text
Press banca

Serie 1
80 kg × 10 reps — RIR 3

Serie 2
80 kg × 10 reps — RIR 2

Serie 3
80 kg × 8 reps — RIR 1
```

## Modelo conceptual

```text
Sesión
└── Ejercicio
    ├── Serie 1
    │   ├── peso
    │   ├── repeticiones
    │   ├── RIR
    │   └── completada
    ├── Serie 2
    └── Serie N
```

**Prioridad: P0**

---

# 4. RIR / RPE

## Propuesta

Incorporar RIR (Reps In Reserve / repeticiones en reserva).

Para el alumno, RIR probablemente sea más intuitivo que RPE.

Opciones:

```text
0 — No podía hacer otra
1 — Podía hacer 1
2 — Podía hacer 2
3 — Podía hacer 3 o más
```

También podría existir un modo avanzado con RPE:

```text
RPE 6
RPE 7
RPE 8
RPE 9
RPE 10
```

## Objetivo

Permitir interpretar una misma carga de forma contextual.

Ejemplo:

```text
80 × 10 — RIR 4
```

es muy diferente de:

```text
80 × 10 — RIR 0
```

## Uso futuro

RIR puede alimentar:

- análisis de fatiga;
- autorregulación;
- reglas de progresión;
- detección de esfuerzo excesivo;
- análisis de progreso.

**Prioridad: P0**

---

# 5. Prescrito vs. realizado

La plataforma debe conservar la diferencia entre lo que el entrenador indicó y lo que el alumno realmente hizo.

Ejemplo:

```text
PRESCRITO

Sentadilla
4 × 8
100 kg
```

```text
REALIZADO

100 × 8
100 × 8
100 × 7
100 × 6
```

El sistema debería poder detectar:

- volumen incompleto;
- volumen superado;
- carga diferente;
- repeticiones diferentes;
- series omitidas.

Esto es fundamental para analizar adherencia y rendimiento.

**Prioridad: P0**

---

# 6. Concepto de "Sesión"

Introducir una entidad conceptual de sesión de entrenamiento.

Ejemplo:

```text
Lunes 17/08
TORSO A

✓ Press banca
✓ Remo
✓ Press militar
✓ Jalón
○ Curl bíceps

Duración: 58 min
```

Una sesión debería permitir almacenar:

- fecha;
- hora de inicio;
- hora de finalización;
- ejercicios;
- series;
- cargas;
- repeticiones;
- RIR;
- sustituciones;
- notas;
- molestias;
- percepción general.

**Prioridad: P0**

---

# 7. Pantalla de entrenamiento del alumno

La interfaz debe estar diseñada específicamente para utilizarse en el gimnasio.

Principios:

- móvil primero;
- botones grandes;
- buena legibilidad;
- alto contraste;
- pocos elementos simultáneos;
- navegación rápida;
- mínimo teclado;
- guardado automático.

Ejemplo conceptual:

```text
HOY

TORSO A

PRESS BANCA

4 × 8
80 kg
RIR 2

[ VER VIDEO ]

Serie 1
[80 kg] [8 reps] [RIR 2]

[✓ COMPLETAR]

Descanso: 02:00
```

El alumno no necesita un dashboard complejo durante el entrenamiento.

**Prioridad: P0**

---

# 8. Cronómetro de descanso

Después de completar una serie:

```text
DESCANSO
01:32
```

Funciones:

- iniciar automáticamente;
- pausar;
- agregar tiempo;
- finalizar manualmente;
- configurar descanso por ejercicio.

Debe existir una versión simple y opcionalmente una avanzada.

**Prioridad: P1**

---

# 9. Progresión automática / sugerida

La plataforma debería poder sugerir progresiones sin reemplazar al entrenador.

Ejemplo:

```text
Semana 1
30 × 10
30 × 10
30 × 9
RIR 2

Semana 2
30 × 11
30 × 10
30 × 10
RIR 2

Semana 3
30 × 12
30 × 12
30 × 12
RIR 1
```

Resultado:

```text
Objetivo alcanzado.

Sugerencia:
Aumentar carga en la próxima sesión.
```

La recomendación debe ser editable y siempre estar bajo control del entrenador.

**Prioridad: P1**

---

# 10. Reglas de progresión

Al programar un ejercicio se podría seleccionar un método.

## Doble progresión

```text
8–12 reps

Si alcanza 12 reps en todas las series:
→ aumentar peso
```

## Progresión por RIR

```text
Objetivo: RIR 2

RIR > 3
→ considerar aumento

RIR 2
→ mantener

RIR < 1
→ considerar reducción
```

## Manual

```text
El entrenador decide.
```

No todas las rutinas deben utilizar reglas automáticas.

**Prioridad: P1**

---

# 11. PR y récords personales

Para entrenamiento de fuerza, detectar récords debería ser una funcionalidad nativa.

Ejemplo:

```text
🏆 NUEVO RÉCORD

Press banca
100 kg × 5

Mejor anterior:
100 kg × 4
```

También se puede calcular 1RM estimado.

Ejemplo mediante Epley:

```text
100 kg × 5
1RM estimado ≈ 116,7 kg
```

Debe mostrarse también la marca real, no únicamente el 1RM estimado.

**Prioridad: P1**

---

# 12. Gráficos de progreso

No limitarse al gráfico de peso.

Por ejercicio:

- carga;
- repeticiones;
- volumen;
- mejor serie;
- e1RM;
- RIR.

Ejemplo:

```text
Press banca

Mejor serie
100 × 5
      ↓
102,5 × 5
      ↓
105 × 5
```

También debería poder visualizarse:

- últimas 4 semanas;
- últimas 12 semanas;
- histórico completo.

**Prioridad: P1**

---

# 13. Adherencia

La adherencia debe convertirse en una métrica central.

Ejemplo:

```text
Sesiones previstas: 12
Sesiones realizadas: 10

Adherencia: 83%
```

Pero idealmente separar:

```text
Sesiones realizadas: 10/12
Ejercicios completados: 91%
Volumen completado: 88%
```

Esto permite distinguir:

- alumno que no viene;
- alumno que viene pero omite ejercicios;
- alumno que completa parcialmente;
- alumno que cumple completamente.

**Prioridad: P1**

---

# 14. Readiness / estado previo al entrenamiento

Antes de una sesión se podría preguntar:

```text
¿Cómo te sentís hoy?

Sueño
1 2 3 4 5

Energía
1 2 3 4 5

Estrés
1 2 3 4 5

Dolor/molestia
1 2 3 4 5
```

Esto permite contextualizar el rendimiento.

Ejemplo:

```text
Readiness promedio: 3,8/5
```

No debe utilizarse como diagnóstico.

**Prioridad: P1**

---

# 15. Dolor y molestias

Separar la información médica/general del registro de entrenamiento.

Durante un ejercicio:

```text
¿Tuviste alguna molestia?

□ No
□ Sí
```

Si sí:

```text
Zona:
Rodilla

Intensidad:
1–10

Tipo:
□ Dolor
□ Incomodidad
□ Fatiga
□ Técnica
□ Otro
```

También:

```text
¿Pudiste completar el ejercicio?
Sí / No
```

El sistema puede generar alertas por recurrencia.

Ejemplo:

```text
⚠️ Press banca
Molestia de hombro registrada
4 sesiones consecutivas
```

El sistema debe registrar y alertar, pero no diagnosticar lesiones.

**Prioridad: P1**

---

# 16. Sustitución de ejercicios

En un gimnasio real los ejercicios se sustituyen constantemente.

El entrenador debería poder definir alternativas:

```text
Press inclinado

Alternativas:
- Press máquina
- Press mancuernas
- Press inclinado Smith
```

El alumno puede registrar:

```text
Prescrito:
Press inclinado

Realizado:
Press máquina
```

La rutina original no se modifica.

Debe quedar registrada la sustitución.

**Prioridad: P1**

---

# 17. Biblioteca de ejercicios avanzada

El catálogo actual puede crecer.

Datos sugeridos:

```text
Ejercicio
├── Nombre
├── Grupo muscular
├── Músculo principal
├── Músculos secundarios
├── Equipamiento
├── Patrón de movimiento
├── Nivel
├── Video
├── Instrucciones
├── Errores comunes
├── Tempo recomendado
├── Alternativas
└── Precauciones
```

## Patrones de movimiento

- Empuje horizontal
- Tirón horizontal
- Empuje vertical
- Tirón vertical
- Dominante de rodilla
- Dominante de cadera
- Unilateral
- Core
- Aislación

**Prioridad: P1/P2**

---

# 18. Variantes de ejercicios

Permitir relacionar variantes.

Ejemplo:

```text
Sentadilla
├── Sentadilla libre
├── High bar
├── Low bar
├── Smith
├── Hack squat
└── Goblet squat
```

Esto evita tener un catálogo completamente plano y permite análisis más inteligentes.

**Prioridad: P2**

---

# 19. Bloques de entrenamiento

La estructura actual:

```text
Día
└── Ejercicios
```

debería evolucionar a:

```text
Día 1 — Torso

Bloque A — Fuerza
├── Press banca
└── Remo

Bloque B — Hipertrofia
├── Press inclinado
└── Jalón

Bloque C — Accesorios
├── Elevaciones laterales
└── Curl
```

Esto permite:

- bloques;
- superseries;
- circuitos;
- prioridad de ejercicios;
- diferentes descansos;
- agrupaciones lógicas.

**Prioridad: P1**

---

# 20. Superseries

Permitir definir:

```text
A1 — Press inclinado
A2 — Remo
```

Con:

```text
Descanso después de A2: 90 s
```

Esto debe formar parte de la estructura de bloques.

**Prioridad: P1/P2**

---

# 21. Tempo

Agregar un campo opcional:

```text
Tempo: 3-1-1-0
```

O una descripción simple:

```text
Tempo: controlado
```

No debe ser obligatorio ni convertirse en una métrica central.

**Prioridad: P2**

---

# 22. Dashboard del entrenador orientado al entrenamiento

El dashboard actual es principalmente administrativo.

Debería agregarse un panel deportivo:

```text
ENTRENAMIENTO

Sesiones esta semana       84
Adherencia                 87%

Alumnos sin entrenar 7d     6
Alumnos con molestias       4
Alumnos estancados          7
PRs esta semana             18
```

Estados:

```text
🟢 Excelente
🟡 Revisar
🔴 Atención
```

**Prioridad: P1**

---

# 23. Alumnos que necesitan atención

Crear un sistema de alertas accionables.

Ejemplos:

```text
🔴 Martín
No entrena hace 9 días
```

```text
🟡 Lucía
3 sesiones consecutivas debajo
del volumen prescrito
```

```text
🔴 Pedro
Molestia registrada 4 veces
```

```text
🟡 Sofía
Sin progresión en sentadilla
durante 5 semanas
```

Y también alertas positivas:

```text
🟢 Juan
+7,5% e1RM press banca
últimas 6 semanas
```

**Prioridad: P1**

---

# 24. Detección de estancamiento

Crear una lógica de "posible estancamiento".

Ejemplo:

```text
Ejercicio:
Sentadilla

Ventana:
4 semanas

Sin mejora significativa:
peso + repeticiones + e1RM

→ Posible estancamiento
```

No debe afirmarse automáticamente que existe un problema.

La etiqueta correcta debería ser:

> "Posible estancamiento — revisar"

**Prioridad: P2**

---

# 25. Evaluación física inicial

Agregar evaluaciones configurables.

Ejemplo:

```text
Evaluación inicial

Peso
Altura

Medidas:
- cintura
- cadera
- brazo
- muslo
- pecho

Fotos:
- frente
- espalda
- lateral

Tests:
- sentadilla
- press banca
- peso muerto
- dominadas
```

El entrenador debería elegir qué evaluar.

Luego comparar:

```text
Inicial
↓
4 semanas
↓
8 semanas
↓
12 semanas
```

**Prioridad: P1/P2**

---

# 26. Peso corporal

Registrar peso corporal con histórico.

Ejemplo:

```text
Semana 1: 78,2 kg
Semana 2: 78,6 kg
Semana 3: 78,9 kg
...
```

Esto permite contextualizar el rendimiento y los objetivos de hipertrofia, fuerza o recomposición.

**Prioridad: P1**

---

# 27. Fotos de progreso

Para objetivos de hipertrofia/composición corporal:

```text
Inicio
4 semanas
8 semanas
12 semanas
```

Posiciones:

- frente;
- espalda;
- lateral.

Debe existir:

- consentimiento;
- control de privacidad;
- acceso restringido;
- posibilidad de eliminar fotos.

**Prioridad: P2**

---

# 28. Programación por fases / mesociclos

Para entrenamiento avanzado:

```text
Plan de entrenamiento

Mesociclo 1
├── Semana 1
├── Semana 2
├── Semana 3
└── Semana 4

Mesociclo 2
├── Semana 1
├── Semana 2
└── ...
```

No debería ser obligatorio para todas las rutinas.

Debe coexistir con el modo simple.

**Prioridad: P2**

---

# 29. Deload

Permitir programar semanas de descarga.

Ejemplo:

```text
Semana 1 — Base
Semana 2 — Sobrecarga
Semana 3 — Sobrecarga
Semana 4 — Peak
Semana 5 — Deload
```

Posibilidad futura:

```text
Duplicar semana
→ Reducir volumen 40%
```

Siempre bajo control del entrenador.

**Prioridad: P2**

---

# 30. Historial de cambios

Registrar cambios importantes.

Ejemplo:

```text
17/08
Press banca
80 kg → 82,5 kg

Motivo:
Progresión
```

```text
18/08
Sentadilla
100 kg → 95 kg

Motivo:
Molestia / ajuste
```

Esto puede evolucionar a un audit log.

**Prioridad: P2**

---

# 31. Notas tipificadas

En lugar de una única nota genérica:

```text
Nota del entrenador
Nota del alumno
Nota de sesión
Nota administrativa
Incidencia
```

Esto mejora la búsqueda y el análisis.

**Prioridad: P2**

---

# 32. Acceso del alumno: revisar el uso exclusivo del DNI

El acceso únicamente con DNI es cómodo pero débil desde el punto de vista de seguridad.

Alternativas:

## Opción A

```text
DNI + PIN de 4 dígitos
```

## Opción B

```text
DNI + código temporal por WhatsApp
```

## Opción C

Magic link.

Para un MVP, la alternativa recomendada sería:

> DNI + PIN de 4 dígitos.

No utilizar el DNI como único secreto de autenticación.

**Prioridad: P0**

---

# 33. WhatsApp

No es necesario construir un chat interno completo.

Una primera versión podría ofrecer acciones rápidas:

```text
📱 WhatsApp
```

Con mensajes prearmados:

```text
Hola Juan, te actualicé la rutina.
```

```text
Hola María, tu cuota vence el viernes.
```

```text
¿Cómo te sentiste hoy con la sentadilla?
```

La plataforma puede simplemente abrir WhatsApp con el mensaje preparado.

**Prioridad: P1**

---

# 34. Pagos

No se recomienda convertir pagos en una prioridad inmediata.

La fecha de vencimiento actual es suficiente para el MVP.

En una etapa posterior:

```text
Pago
├── Fecha
├── Monto
├── Método
├── Período
└── Comprobante
```

Integraciones como Mercado Pago pueden venir después.

**Prioridad: P2**

---

# 35. Multi-entrenador

No es necesario implementarlo inmediatamente.

Sin embargo, la arquitectura debería evitar bloquearlo.

Conceptualmente:

```text
Entrenador
├── Alumnos
├── Rutinas
└── Ejercicios
```

En el futuro:

```text
Equipo
├── Entrenador A
├── Entrenador B
└── Entrenador C
```

No implementar permisos complejos hasta que exista una necesidad real.

**Prioridad: P2**

---

# 36. IA

No se recomienda comenzar por IA.

Primero se necesitan datos estructurados de calidad:

```text
Prescrito
Realizado
Peso
Reps
RIR
Sesión
Adherencia
Dolor
Fatiga
Progresión
```

Con suficientes datos, una capa inteligente podría posteriormente:

- sugerir aumentos de carga;
- detectar estancamientos;
- identificar baja adherencia;
- detectar cambios de rendimiento;
- resumir el progreso;
- sugerir qué alumnos revisar.

La IA debe asistir al entrenador, no reemplazar su criterio.

**Prioridad: futuro**

---

# 37. Objetivos del alumno

Actualmente:

```text
Hipertrofia
Fuerza
Descenso
```

es demasiado rígido.

Se recomienda separar:

## Objetivo principal

Ejemplo:

```text
Hipertrofia
```

## Objetivos secundarios

```text
Mejorar sentadilla
Aumentar masa en espalda
```

## Prioridades

```text
Glúteos
Pecho
Sentadilla
```

Separar también:

- objetivo;
- nivel;
- contexto;
- limitaciones.

**Prioridad: P1**

---

# 38. Qué NO debería convertirse en prioridad

Evitar convertir el producto en:

```text
MyFitnessPal
+
Strava
+
Trainerize
+
WhatsApp
+
Mercado Pago
+
Nutrición
+
Red social
```

El núcleo debe seguir siendo:

> **Programar → Ejecutar → Medir → Evaluar → Ajustar**

Todo lo demás debe estar subordinado a ese ciclo.

---

# 39. Roadmap recomendado

## P0 — Núcleo de entrenamiento

1. Registro por serie
2. Peso + repeticiones reales
3. RIR
4. Prescrito vs. realizado
5. Sesiones
6. Historial por ejercicio
7. Seguridad de acceso del alumno
8. UX móvil de entrenamiento

---

## P1 — Seguimiento y coaching

9. PR / récords
10. e1RM
11. Gráficos
12. Adherencia
13. Readiness
14. Molestias
15. Sustituciones
16. Bloques
17. Superseries
18. Reglas de progresión
19. Dashboard deportivo
20. Alertas de alumnos
21. Peso corporal
22. WhatsApp
23. Objetivos flexibles

---

## P2 — Programación avanzada

24. Biblioteca avanzada
25. Variantes de ejercicios
26. Tempo
27. Evaluaciones físicas
28. Fotos de progreso
29. Mesociclos
30. Semanas programadas
31. Deload
32. Historial de cambios
33. Notas tipificadas
34. Reportes
35. Exportaciones
36. Pagos
37. Multi-entrenador

---

## Futuro

38. IA
39. Recomendaciones automáticas
40. Análisis avanzado de estancamiento
41. Predicción de carga
42. Wearables
43. Integraciones externas

---

# 40. Modelo funcional recomendado

```text
                    ENTRENADOR
                         │
             ┌───────────┴───────────┐
             │                       │
         ALUMNOS                 EJERCICIOS
             │                       │
             └──────────┬────────────┘
                        │
                 PROGRAMACIÓN
                        │
              ┌─────────┴─────────┐
              │                   │
             PLAN                FASE
              │                   │
            SEMANA              SEMANA
              │                   │
             DÍA                BLOQUES
              │                   │
          EJERCICIOS ─────────────┘
              │
              ▼
          ASIGNACIÓN
              │
              ▼
           ALUMNO
              │
              ▼
           SESIÓN
              │
       ┌──────┼───────┐
       │      │       │
      KG     REPS    RIR
       │      │       │
       └──────┼───────┘
              │
              ▼
          PROGRESO
              │
       ┌──────┼──────┐
       │      │      │
      PRs   e1RM  ADHERENCIA
       │      │      │
       └──────┼──────┘
              ▼
        DECISIÓN DEL
         ENTRENADOR
              │
              ▼
       NUEVA PROGRAMACIÓN
```

---

# 41. Modelo de datos conceptual

Una evolución posible sería:

```text
Alumno
│
├── Evaluaciones
├── Peso corporal
├── Fotos
├── Rutinas asignadas
│
└── Sesiones
    │
    ├── Estado / readiness
    ├── Notas
    ├── Molestias
    │
    └── Ejercicios realizados
        │
        ├── Ejercicio prescrito
        ├── Ejercicio realizado
        ├── Sustitución
        │
        └── Series
            ├── Peso
            ├── Repeticiones
            ├── RIR
            ├── RPE
            └── Completada
```

Esto debería servir como base para futuras decisiones técnicas.

---

# 42. Métricas principales del producto

## Alumno

- sesiones previstas;
- sesiones realizadas;
- adherencia;
- ejercicios completados;
- volumen;
- mejor marca;
- e1RM;
- evolución del peso corporal;
- readiness;
- molestias.

## Entrenador

- alumnos activos;
- alumnos sin entrenar;
- adherencia promedio;
- alumnos con molestias;
- alumnos con posible estancamiento;
- PRs;
- sesiones realizadas;
- alumnos que requieren revisión.

---

# 43. Principios de UX

## Para el entrenador

La plataforma debe optimizar:

> **ver → decidir → modificar**

No:

> navegar → buscar → abrir muchas pantallas → editar.

## Para el alumno

Debe optimizar:

> **ver → ejecutar → registrar → continuar**

El alumno no debería sentir que está llenando formularios.

---

# 44. Principios de producto

1. El entrenador mantiene el control.
2. Las recomendaciones automáticas son sugerencias, no decisiones.
3. La rutina prescrita nunca debe perderse.
4. Lo realizado debe quedar registrado independientemente de lo prescrito.
5. Los datos deben conservar contexto.
6. El historial debe ser inmutable o versionado cuando corresponda.
7. La interfaz del alumno debe ser mucho más simple que la del entrenador.
8. El sistema debe priorizar información accionable.
9. No agregar funcionalidades administrativas si no mejoran el trabajo del entrenador.
10. El objetivo final es mejorar el proceso de coaching.

---

# 45. Prioridad estratégica

La principal evolución recomendada es:

```text
HOY

Administrar alumnos
        ↓
Crear rutina
        ↓
Asignar rutina
        ↓
Alumno registra peso
        ↓
Consultar historial
```

Convertirlo en:

```text
PROGRAMAR
    ↓
PRESCRIBIR
    ↓
EJECUTAR
    ↓
REGISTRAR SERIES
    ↓
MEDIR RIR / RPE
    ↓
ANALIZAR ADHERENCIA
    ↓
ANALIZAR PROGRESO
    ↓
DETECTAR PROBLEMAS
    ↓
ENTRENADOR DECIDE
    ↓
AJUSTAR PROGRAMACIÓN
    ↓
REPETIR
```

Ese ciclo debería ser el verdadero corazón de la plataforma.

---

# 46. Recomendación final

No implementar todas las funcionalidades simultáneamente.

El próximo gran objetivo debería ser construir correctamente:

> **Ejercicio → Prescripción → Serie → Ejecución → Sesión → Progreso**

Una vez que ese modelo esté funcionando correctamente, funcionalidades como gráficos, PRs, adherencia, estancamiento, recomendaciones, readiness e IA pueden construirse sobre datos reales y consistentes.

La plataforma ya tiene una buena base administrativa. El siguiente nivel consiste en convertir esos datos administrativos en **datos de entrenamiento útiles para tomar decisiones**.

---

# 47. Referencias generales de evidencia

Como orientación para las decisiones relacionadas con entrenamiento, hipertrofia, fuerza y autorregulación:

- ACSM Position Stand (2026): Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults.
- Evidencia sobre proximidad al fallo y hipertrofia.
- Evidencia sobre autorregulación y RPE/RIR.
- Evidencia sobre progresión de cargas.

Estas referencias deben utilizarse como apoyo para decisiones de producto, pero la plataforma no debe presentar recomendaciones como diagnóstico médico ni sustituir el criterio de un entrenador cualificado o profesional de la salud.

---

# 48. Resumen ejecutivo para el equipo

Si hubiera que resumir todo el documento en cinco decisiones:

### 1. Convertir la rutina en un sistema de programación

No solamente:

```text
4 × 8
```

sino:

```text
4 × 8 @ 80 kg
Objetivo RIR 2
Progresión: doble progresión
```

### 2. Registrar lo que realmente ocurrió

```text
Prescrito ≠ Realizado
```

y guardar las series individualmente.

### 3. Crear el concepto de sesión

La sesión debe ser el centro del seguimiento del alumno.

### 4. Transformar datos en información accionable

Ejemplo:

```text
No:
"Juan hizo 8 sesiones."

Sí:
"Juan tiene 87% de adherencia,
subió 7,5% su e1RM de press banca
y lleva 3 semanas sin progresar en sentadilla."
```

### 5. Mantener al entrenador en el centro

La plataforma debe ayudar a:

> **ver → entender → decidir → ajustar**

y no intentar reemplazar al entrenador.

---

**Conclusión:**

La plataforma tiene potencial para evolucionar desde un "gestor de rutinas" hacia un **sistema de gestión y seguimiento del entrenamiento**, donde la programación, la ejecución y el progreso forman un ciclo continuo.

Ese debería ser el norte del producto.
