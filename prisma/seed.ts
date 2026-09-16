import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required to run seed.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

function getAdminCredentials() {
  const email = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "sramon@coach.com";
  const password = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "SRamon2026.";
  const name = process.env.SEED_ADMIN_NAME || process.env.ADMIN_NAME || "Santiago Ramón";

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters long.");
  }

  return { email, password, name };
}

const EXERCISES: {
  name: string;
  primaryMuscle: string;
  secondaryMuscle: string;
  videoUrl: string;
}[] = [
  {
    name: "Sentadilla con barra trasera (Back Squat)",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteos, aductores, erectores espinales, abdomen",
    videoUrl: "https://www.youtube.com/shorts/bEv6CCg2BC8",
  },
  {
    name: "Sentadilla búlgara",
    primaryMuscle: "Cuádriceps / Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductores, core",
    videoUrl: "https://www.youtube.com/shorts/2C-uNgKwPLE",
  },
  {
    name: "Prensa inclinada a 45°",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Glúteo mayor, aductor mayor",
    videoUrl: "https://www.youtube.com/shorts/sPrDYXaoR0s",
  },
  {
    name: "Extensión de piernas en máquina",
    primaryMuscle: "Cuádriceps",
    secondaryMuscle: "Ninguno (aislamiento monoarticular)",
    videoUrl: "https://www.youtube.com/shorts/m0BgSmkWx3c",
  },
  {
    name: "Peso muerto rumano (RDL)",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Glúteo mayor, erectores espinales, antebrazos",
    videoUrl: "https://www.youtube.com/shorts/_oyxCn2iSjU",
  },
  {
    name: "Curl femoral acostado o sentado",
    primaryMuscle: "Isquiosurales",
    secondaryMuscle: "Gemelos (gastrocnemio)",
    videoUrl: "https://www.youtube.com/shorts/ELOCsoDSmrg",
  },
  {
    name: "Empuje de cadera (Hip Thrust)",
    primaryMuscle: "Glúteo mayor",
    secondaryMuscle: "Isquiosurales, aductor mayor, erectores espinales",
    videoUrl: "https://www.youtube.com/shorts/SEdqd1n0cvg",
  },
  {
    name: "Elevación de talones de pie",
    primaryMuscle: "Gemelos (Gastrocnemio)",
    secondaryMuscle: "Sóleo, tibial posterior",
    videoUrl: "https://www.youtube.com/shorts/3UWi44yN-wE",
  },
  {
    name: "Elevación de talones sentado",
    primaryMuscle: "Sóleo",
    secondaryMuscle: "Gemelos (gastrocnemio)",
    videoUrl: "https://www.youtube.com/shorts/JbyjNymZOtE",
  },
  {
    name: "Press de banca plano con barra",
    primaryMuscle: "Pectoral mayor (medio e inferior)",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "https://www.youtube.com/shorts/4Y2ZdHCOXok",
  },
  {
    name: "Press inclinado con mancuernas",
    primaryMuscle: "Pectoral mayor (haz clavicular / superior)",
    secondaryMuscle: "Deltoides anterior, tríceps braquial",
    videoUrl: "https://www.youtube.com/shorts/8iPEnn-ltC8",
  },
  {
    name: "Aperturas / Cruce de poleas (Cable Flyes)",
    primaryMuscle: "Pectoral mayor",
    secondaryMuscle: "Deltoides anterior, bíceps braquial (cabeza corta)",
    videoUrl: "https://www.youtube.com/shorts/Iwe6AmxVf7o",
  },
  {
    name: "Fondos en paralelas (Dips)",
    primaryMuscle: "Pectoral mayor / Tríceps braquial",
    secondaryMuscle: "Deltoides anterior, romboides",
    videoUrl: "https://www.youtube.com/shorts/2z8JmcrW-As",
  },
  {
    name: "Dominadas pronas (Pull-ups)",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle:
      "Bíceps braquial, braquial anterior, redondo mayor, trapecio medio/inferior",
    videoUrl: "https://www.youtube.com/shorts/eGo4IYlbE5g",
  },
  {
    name: "Remo con barra (Pendlay o 45°)",
    primaryMuscle: "Espalda media (Dorsal / Romboides)",
    secondaryMuscle:
      "Trapecio, deltoides posterior, bíceps braquial, erectores espinales",
    videoUrl: "https://www.youtube.com/shorts/FWJR5Ve8gkY",
  },
  {
    name: "Jalón al pecho en polea (Lat Pulldown)",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Bíceps braquial, braquiorradial, redondo mayor",
    videoUrl: "https://www.youtube.com/shorts/CAwf7n6Luuc",
  },
  {
    name: "Remo unilateral con mancuerna",
    primaryMuscle: "Dorsal ancho",
    secondaryMuscle: "Romboides, deltoides posterior, bíceps braquial",
    videoUrl: "https://www.youtube.com/shorts/dFzUjzfih7k",
  },
  {
    name: "Press militar de pie con barra (OHP)",
    primaryMuscle: "Deltoides anterior",
    secondaryMuscle:
      "Deltoides lateral, tríceps braquial, trapecio superior, core",
    videoUrl: "https://www.youtube.com/shorts/2yjwXTZQDDI",
  },
  {
    name: "Elevaciones laterales con mancuernas / polea",
    primaryMuscle: "Deltoides lateral",
    secondaryMuscle: "Deltoides anterior, trapecio superior",
    videoUrl: "https://www.youtube.com/shorts/3VcKaXpzqRo",
  },
  {
    name: "Pájaros / Reverse Pec Deck",
    primaryMuscle: "Deltoides posterior",
    secondaryMuscle: "Romboides, trapecio medio, infraespinoso",
    videoUrl: "https://www.youtube.com/shorts/5YK4bgzXDp0",
  },
  {
    name: "Press francés con barra Z",
    primaryMuscle: "Tríceps braquial (énfasis cabeza larga)",
    secondaryMuscle: "Deltoides anterior, antebrazos",
    videoUrl: "https://www.youtube.com/shorts/d_KZxkY_0cM",
  },
  {
    name: "Extensión de tríceps en polea alta (cuerda)",
    primaryMuscle: "Tríceps braquial (cabeza lateral y medial)",
    secondaryMuscle: "Antebrazos",
    videoUrl: "https://www.youtube.com/shorts/6SS6K3lAwZ8",
  },
  {
    name: "Curl de bíceps con barra recta",
    primaryMuscle: "Bíceps braquial",
    secondaryMuscle: "Braquial anterior, braquiorradial",
    videoUrl: "https://www.youtube.com/shorts/i1YgFZB6alI",
  },
  {
    name: "Curl martillo con mancuernas",
    primaryMuscle: "Braquiorradial / Braquial anterior",
    secondaryMuscle: "Bíceps braquial",
    videoUrl: "https://www.youtube.com/shorts/zC3nLlEvin4",
  },
  {
    name: "Curl bayesian / en polea detrás del cuerpo",
    primaryMuscle: "Bíceps braquial (cabeza larga)",
    secondaryMuscle: "Braquial anterior",
    videoUrl: "https://www.youtube.com/shorts/x8f2M96JgT0",
  },
  {
    name: "Rueda abdominal (Ab Wheel Rollout)",
    primaryMuscle: "Recto abdominal",
    secondaryMuscle: "Dorsal ancho, deltoides anterior, flexores de cadera",
    videoUrl: "https://www.youtube.com/shorts/rqi9vL_Bf30",
  },
  {
    name: "Elevación de piernas colgado",
    primaryMuscle: "Recto abdominal (porción inferior)",
    secondaryMuscle: "Flexores de cadera (psoas ilíaco), antebrazos",
    videoUrl: "https://www.youtube.com/shorts/hdng3Nm1x_E",
  },
];

const GENERIC_PROFILE_DEFAULTS: {
  level: "basico" | "intermedio" | "avanzado";
  password: string;
}[] = [
  { level: "basico", password: "olympia.basico" },
  { level: "intermedio", password: "olympia.intermedio" },
  { level: "avanzado", password: "olympia.avanzado" },
];

const OBJETIVOS = [
  "Hipertrofia",
  "Fuerza",
  "Pérdida de Grasa",
  "Salud / Postural",
  "Rendimiento Deportivo",
  "Recomposición Corporal",
];

const MODALIDADES = [
  "Gimnasio",
  "En Casa / Calistenia",
  "Híbrido",
  "Personalizado 1 a 1",
];

const DEFAULT_PLANS = [
  {
    name: "Plan Mensual Estándar",
    description: "Acceso completo a la plataforma, rutina personalizada y seguimiento mensual.",
    price: 35000,
    durationDays: 30,
    isActive: true,
  },
  {
    name: "Plan Trimestral Pro",
    description: "Plan de 3 meses con ajustes quincenales, control de cargas y soporte directo.",
    price: 95000,
    durationDays: 90,
    isActive: true,
  },
  {
    name: "Plan Semestral VIP",
    description: "Compromiso de 6 meses con evaluación biomecánica, nutrición complementaria y prioridad.",
    price: 175000,
    durationDays: 180,
    isActive: true,
  },
  {
    name: "Plan Promocional Verano (Inactivo)",
    description: "Promoción especial de temporada (archivada).",
    price: 28000,
    durationDays: 30,
    isActive: false,
  },
];

async function seedBase() {
  const { email, password, name } = getAdminCredentials();
  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Trainer
  await db.trainer.deleteMany({ where: { email: { not: email } } });
  const trainer = await db.trainer.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });
  console.log(`✅ Entrenador configurado: ${email} (${name})`);

  // 2. Ejercicios
  for (const exercise of EXERCISES) {
    await db.exercise.upsert({
      where: { name: exercise.name },
      update: {
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscle: exercise.secondaryMuscle,
        videoUrl: exercise.videoUrl,
      },
      create: exercise,
    });
  }
  console.log(`✅ ${EXERCISES.length} ejercicios sincronizados`);

  // 3. Taxonomías: Objetivos y Modalidades
  const objetivoMap = new Map<string, string>();
  for (const label of OBJETIVOS) {
    const obj = await db.objetivo.upsert({
      where: { label },
      update: {},
      create: { label },
    });
    objetivoMap.set(label, obj.id);
  }

  const modalidadMap = new Map<string, string>();
  for (const label of MODALIDADES) {
    const mod = await db.modalidad.upsert({
      where: { label },
      update: {},
      create: { label },
    });
    modalidadMap.set(label, mod.id);
  }
  console.log(`✅ Taxonomías sincronizadas (${OBJETIVOS.length} objetivos, ${MODALIDADES.length} modalidades)`);

  // 4. Perfiles Genéricos
  for (const { level, password: pswd } of GENERIC_PROFILE_DEFAULTS) {
    const genericPasswordHash = await bcrypt.hash(pswd, 10);
    await db.genericProfile.upsert({
      where: { level },
      update: {},
      create: { level, passwordHash: genericPasswordHash },
    });
  }
  console.log(`✅ ${GENERIC_PROFILE_DEFAULTS.length} perfiles genéricos listos`);

  // 5. Planes de Suscripción
  const planMap = new Map<string, string>();
  for (const plan of DEFAULT_PLANS) {
    const saved = await db.plan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        isActive: plan.isActive,
      },
      create: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        durationDays: plan.durationDays,
        isActive: plan.isActive,
      },
    });
    planMap.set(plan.name, saved.id);
  }
  console.log(`✅ ${DEFAULT_PLANS.length} planes de membresía listos`);

  return { trainer, objetivoMap, modalidadMap, planMap };
}

async function seedLocalDevData(
  objetivoMap: Map<string, string>,
  modalidadMap: Map<string, string>,
  planMap: Map<string, string>
) {
  console.log("\n🚀 Inicializando datos de prueba locales para desarrollo...");

  // Obtener mapa de ejercicios por nombre
  const exercises = await db.exercise.findMany();
  const exMap = new Map<string, string>(exercises.map((e) => [e.name, e.id]));

  const getExId = (name: string) => {
    const id = exMap.get(name);
    if (!id) throw new Error(`Ejercicio no encontrado para seed: "${name}"`);
    return id;
  };

  // --------------------------------------------------------------------------
  // 0. Limpieza previa de datos de prueba en orden de dependencias (FK)
  // --------------------------------------------------------------------------
  const TEST_DNIS = [
    "10000001",
    "10000002",
    "10000003",
    "10000004",
    "10000005",
    "10000006",
    "10000007",
  ];
  const TEST_TEMPLATE_NAMES = [
    "Hipertrofia Torso / Pierna (4 Días)",
    "Full Body Iniciación (3 Días)",
    "Push / Pull / Legs Avanzado (6 Días)",
  ];

  // 1. Desvincular perfiles genéricos
  await db.genericProfile.updateMany({
    data: { assignedTemplateId: null },
  });

  // 2. Limpiar datos de alumnos de prueba
  const existingTestStudents = await db.student.findMany({
    where: { dni: { in: TEST_DNIS } },
    select: { id: true },
  });
  const testStudentIds = existingTestStudents.map((s) => s.id);

  if (testStudentIds.length > 0) {
    await db.progressLog.deleteMany({ where: { studentId: { in: testStudentIds } } });
    await db.bodyWeightLog.deleteMany({ where: { studentId: { in: testStudentIds } } });
    await db.routineOverride.deleteMany({
      where: { assignedRoutine: { studentId: { in: testStudentIds } } },
    });
    await db.assignedRoutine.deleteMany({ where: { studentId: { in: testStudentIds } } });
    await db.payment.deleteMany({ where: { studentId: { in: testStudentIds } } });
    await db.studentSubscription.deleteMany({ where: { studentId: { in: testStudentIds } } });
  }

  // 3. Limpiar cualquier rutina asignada que apunte a las plantillas de prueba
  const existingTemplates = await db.routineTemplate.findMany({
    where: { name: { in: TEST_TEMPLATE_NAMES } },
    select: { id: true },
  });
  const existingTemplateIds = existingTemplates.map((t) => t.id);

  if (existingTemplateIds.length > 0) {
    await db.progressLog.deleteMany({
      where: { assignedRoutine: { templateId: { in: existingTemplateIds } } },
    });
    await db.routineOverride.deleteMany({
      where: { assignedRoutine: { templateId: { in: existingTemplateIds } } },
    });
    await db.assignedRoutine.deleteMany({
      where: { templateId: { in: existingTemplateIds } },
    });
    await db.routineTemplate.deleteMany({
      where: { id: { in: existingTemplateIds } },
    });
  }

  // --------------------------------------------------------------------------
  // 1. Plantillas de Rutinas (Routine Templates)
  // --------------------------------------------------------------------------

  // Template A: Torso / Pierna 4 Días
  const templateTorsoPierna = await db.routineTemplate.create({
    data: {
      name: "Hipertrofia Torso / Pierna (4 Días)",
      description: "Rutina intermedia/avanzada enfocada en desarrollo muscular equilibrado con frecuencia 2.",
      durationWeeks: 4,
      trainingDays: {
        create: [
          {
            label: "Día 1 – Torso Pesado (Fuerza)",
            dayOrder: 1,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Press de banca plano con barra"),
                  sets: 4,
                  reps: 6,
                  weightKg: new Prisma.Decimal(80.0),
                  intensity: "@8",
                  tempo: "3-0-1-0",
                  restSecs: 180,
                  trainerNotes: "Foco en retracción escapular y pausa controlada en el pecho.",
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Dominadas pronas (Pull-ups)"),
                  sets: 4,
                  reps: 6,
                  weightKg: new Prisma.Decimal(0.0),
                  intensity: "@8",
                  tempo: "2-0-1-1",
                  restSecs: 150,
                  trainerNotes: "Rango completo de movimiento. Si podés, agregá lastre de 5kg.",
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Press militar de pie con barra (OHP)"),
                  sets: 3,
                  reps: 8,
                  weightKg: new Prisma.Decimal(45.0),
                  intensity: "@7.5",
                  restSecs: 120,
                  trainerNotes: "Apretar glúteos y abdomen para proteger la zona lumbar.",
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Remo con barra (Pendlay o 45°)"),
                  sets: 3,
                  reps: 8,
                  weightKg: new Prisma.Decimal(70.0),
                  intensity: "@8",
                  restSecs: 120,
                  blockOrder: 4,
                },
                // Superserie Brazos
                {
                  exerciseId: getExId("Fondos en paralelas (Dips)"),
                  sets: 3,
                  reps: 10,
                  restSecs: 30,
                  groupLabel: "A",
                  groupRestSecs: 90,
                  trainerNotes: "Superserie con curl de bíceps.",
                  blockOrder: 5,
                },
                {
                  exerciseId: getExId("Curl de bíceps con barra recta"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(30.0),
                  restSecs: 30,
                  groupLabel: "A",
                  groupRestSecs: 90,
                  blockOrder: 6,
                },
              ],
            },
          },
          {
            label: "Día 2 – Pierna Pesada (Fuerza)",
            dayOrder: 2,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Sentadilla con barra trasera (Back Squat)"),
                  sets: 4,
                  reps: 6,
                  weightKg: new Prisma.Decimal(100.0),
                  intensity: "@8",
                  tempo: "3-1-1-0",
                  restSecs: 180,
                  trainerNotes: "Profundidad paralela o sub-paralela. Mantener el torso firme.",
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Peso muerto rumano (RDL)"),
                  sets: 3,
                  reps: 8,
                  weightKg: new Prisma.Decimal(90.0),
                  intensity: "@7.5",
                  tempo: "3-0-1-0",
                  restSecs: 150,
                  trainerNotes: "Empujar caderas hacia atrás, no flexionar columna.",
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Prensa inclinada a 45°"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(160.0),
                  restSecs: 120,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Elevación de talones de pie"),
                  sets: 4,
                  reps: 15,
                  weightKg: new Prisma.Decimal(60.0),
                  restSecs: 60,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Rueda abdominal (Ab Wheel Rollout)"),
                  sets: 3,
                  reps: 12,
                  restSecs: 60,
                  trainerNotes: "Controlar la extensión sin que caiga la cadera.",
                  blockOrder: 5,
                },
              ],
            },
          },
          {
            label: "Día 3 – Torso Hipertrofia & Bombeo",
            dayOrder: 3,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Press inclinado con mancuernas"),
                  sets: 4,
                  reps: 10,
                  weightKg: new Prisma.Decimal(28.0),
                  intensity: "@8",
                  restSecs: 90,
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Jalón al pecho en polea (Lat Pulldown)"),
                  sets: 4,
                  reps: 10,
                  weightKg: new Prisma.Decimal(60.0),
                  intensity: "@8",
                  restSecs: 90,
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Aperturas / Cruce de poleas (Cable Flyes)"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(15.0),
                  restSecs: 60,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Elevaciones laterales con mancuernas / polea"),
                  sets: 4,
                  reps: 15,
                  weightKg: new Prisma.Decimal(10.0),
                  restSecs: 60,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Pájaros / Reverse Pec Deck"),
                  sets: 3,
                  reps: 15,
                  weightKg: new Prisma.Decimal(40.0),
                  restSecs: 60,
                  blockOrder: 5,
                },
                {
                  exerciseId: getExId("Extensión de tríceps en polea alta (cuerda)"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(25.0),
                  restSecs: 60,
                  blockOrder: 6,
                },
                {
                  exerciseId: getExId("Curl bayesian / en polea detrás del cuerpo"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(15.0),
                  restSecs: 60,
                  blockOrder: 7,
                },
              ],
            },
          },
          {
            label: "Día 4 – Pierna Hipertrofia & Glúteos",
            dayOrder: 4,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Empuje de cadera (Hip Thrust)"),
                  sets: 4,
                  reps: 10,
                  weightKg: new Prisma.Decimal(120.0),
                  intensity: "@8.5",
                  tempo: "2-0-1-2",
                  restSecs: 150,
                  trainerNotes: "Pausa de 2 segundos apretando glúteos arriba.",
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Sentadilla búlgara"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(20.0),
                  restSecs: 90,
                  trainerNotes: "10 repeticiones por pierna con mancuernas.",
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Extensión de piernas en máquina"),
                  sets: 3,
                  reps: 15,
                  weightKg: new Prisma.Decimal(50.0),
                  restSecs: 60,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Curl femoral acostado o sentado"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(45.0),
                  restSecs: 60,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Elevación de piernas colgado"),
                  sets: 3,
                  reps: 15,
                  restSecs: 60,
                  blockOrder: 5,
                },
              ],
            },
          },
        ],
      },
    },
    include: { trainingDays: { include: { exerciseBlocks: true } } },
  });

  // Template B: Full Body Iniciación 3 Días
  const templateFullBody = await db.routineTemplate.create({
    data: {
      name: "Full Body Iniciación (3 Días)",
      description: "Rutina ideal para principiantes y personas que retoman el entrenamiento. 3 sesiones semanales completas.",
      durationWeeks: 4,
      trainingDays: {
        create: [
          {
            label: "Día 1 – Full Body A",
            dayOrder: 1,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Sentadilla con barra trasera (Back Squat)"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(50.0),
                  restSecs: 120,
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Press de banca plano con barra"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(40.0),
                  restSecs: 120,
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Jalón al pecho en polea (Lat Pulldown)"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(45.0),
                  restSecs: 90,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Elevaciones laterales con mancuernas / polea"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(7.0),
                  restSecs: 60,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Rueda abdominal (Ab Wheel Rollout)"),
                  sets: 3,
                  reps: 10,
                  restSecs: 60,
                  blockOrder: 5,
                },
              ],
            },
          },
          {
            label: "Día 2 – Full Body B",
            dayOrder: 2,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Peso muerto rumano (RDL)"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(50.0),
                  restSecs: 120,
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Press militar de pie con barra (OHP)"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(30.0),
                  restSecs: 120,
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Remo con barra (Pendlay o 45°)"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(45.0),
                  restSecs: 90,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Prensa inclinada a 45°"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(100.0),
                  restSecs: 90,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Curl martillo con mancuernas"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(10.0),
                  restSecs: 60,
                  blockOrder: 5,
                },
              ],
            },
          },
          {
            label: "Día 3 – Full Body C",
            dayOrder: 3,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Empuje de cadera (Hip Thrust)"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(70.0),
                  restSecs: 120,
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Press inclinado con mancuernas"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(18.0),
                  restSecs: 90,
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Remo unilateral con mancuerna"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(18.0),
                  restSecs: 90,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Sentadilla búlgara"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(10.0),
                  restSecs: 90,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Extensión de tríceps en polea alta (cuerda)"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(18.0),
                  restSecs: 60,
                  blockOrder: 5,
                },
              ],
            },
          },
        ],
      },
    },
    include: { trainingDays: { include: { exerciseBlocks: true } } },
  });

  // Template C: Push / Pull / Legs (PPL) Avanzado (6 Días)
  const templatePpl = await db.routineTemplate.create({
    data: {
      name: "Push / Pull / Legs Avanzado (6 Días)",
      description: "Estructura avanzada de alta frecuencia y volumen semanal para atletas experimentados.",
      durationWeeks: 6,
      trainingDays: {
        create: [
          {
            label: "Día 1 – Push (Empuje A)",
            dayOrder: 1,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Press de banca plano con barra"),
                  sets: 4,
                  reps: 8,
                  weightKg: new Prisma.Decimal(90.0),
                  intensity: "@8.5",
                  restSecs: 150,
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Press militar de pie con barra (OHP)"),
                  sets: 3,
                  reps: 8,
                  weightKg: new Prisma.Decimal(50.0),
                  restSecs: 120,
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Fondos en paralelas (Dips)"),
                  sets: 3,
                  reps: 12,
                  restSecs: 90,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Elevaciones laterales con mancuernas / polea"),
                  sets: 4,
                  reps: 15,
                  weightKg: new Prisma.Decimal(12.0),
                  restSecs: 60,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Press francés con barra Z"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(32.0),
                  restSecs: 60,
                  blockOrder: 5,
                },
              ],
            },
          },
          {
            label: "Día 2 – Pull (Tracción A)",
            dayOrder: 2,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Dominadas pronas (Pull-ups)"),
                  sets: 4,
                  reps: 8,
                  weightKg: new Prisma.Decimal(10.0),
                  trainerNotes: "Lastrado 10kg.",
                  restSecs: 150,
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Remo con barra (Pendlay o 45°)"),
                  sets: 4,
                  reps: 8,
                  weightKg: new Prisma.Decimal(80.0),
                  restSecs: 120,
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Jalón al pecho en polea (Lat Pulldown)"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(70.0),
                  restSecs: 90,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Pájaros / Reverse Pec Deck"),
                  sets: 4,
                  reps: 15,
                  weightKg: new Prisma.Decimal(45.0),
                  restSecs: 60,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Curl de bíceps con barra recta"),
                  sets: 3,
                  reps: 10,
                  weightKg: new Prisma.Decimal(35.0),
                  restSecs: 60,
                  blockOrder: 5,
                },
              ],
            },
          },
          {
            label: "Día 3 – Legs (Pierna A)",
            dayOrder: 3,
            exerciseBlocks: {
              create: [
                {
                  exerciseId: getExId("Sentadilla con barra trasera (Back Squat)"),
                  sets: 4,
                  reps: 6,
                  weightKg: new Prisma.Decimal(115.0),
                  intensity: "@8.5",
                  restSecs: 180,
                  blockOrder: 1,
                },
                {
                  exerciseId: getExId("Peso muerto rumano (RDL)"),
                  sets: 3,
                  reps: 8,
                  weightKg: new Prisma.Decimal(100.0),
                  restSecs: 150,
                  blockOrder: 2,
                },
                {
                  exerciseId: getExId("Prensa inclinada a 45°"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(180.0),
                  restSecs: 120,
                  blockOrder: 3,
                },
                {
                  exerciseId: getExId("Curl femoral acostado o sentado"),
                  sets: 3,
                  reps: 12,
                  weightKg: new Prisma.Decimal(55.0),
                  restSecs: 60,
                  blockOrder: 4,
                },
                {
                  exerciseId: getExId("Elevación de talones de pie"),
                  sets: 4,
                  reps: 15,
                  weightKg: new Prisma.Decimal(70.0),
                  restSecs: 60,
                  blockOrder: 5,
                },
              ],
            },
          },
        ],
      },
    },
    include: { trainingDays: { include: { exerciseBlocks: true } } },
  });

  console.log(`✅ 3 plantillas de entrenamiento completas creadas con días y bloques`);

  // Asignar plantillas a perfiles genéricos
  await db.genericProfile.update({
    where: { level: "basico" },
    data: { assignedTemplateId: templateFullBody.id },
  });
  await db.genericProfile.update({
    where: { level: "intermedio" },
    data: { assignedTemplateId: templateTorsoPierna.id },
  });
  await db.genericProfile.update({
    where: { level: "avanzado" },
    data: { assignedTemplateId: templatePpl.id },
  });
  console.log(`✅ Perfiles genéricos vinculados a sus plantillas correspondientes`);

  // --------------------------------------------------------------------------
  // 2. Alumnos de Prueba (Students con diferentes estados y casos de uso)
  // --------------------------------------------------------------------------

  const objHipertrofia = objetivoMap.get("Hipertrofia")!;
  const objFuerza = objetivoMap.get("Fuerza")!;
  const objGrasa = objetivoMap.get("Pérdida de Grasa")!;
  const objSalud = objetivoMap.get("Salud / Postural")!;

  const modGimnasio = modalidadMap.get("Gimnasio")!;
  const modCasa = modalidadMap.get("En Casa / Calistenia")!;
  const modHibrido = modalidadMap.get("Híbrido")!;

  const planMensualId = planMap.get("Plan Mensual Estándar")!;
  const planTrimestralId = planMap.get("Plan Trimestral Pro")!;
  const planVipId = planMap.get("Plan Semestral VIP")!;

  const now = new Date();
  const dateDaysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  const dateDaysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  // Student 1: DNI 10000001 - Juan Pérez (Intermedio, Activo, cuota al día, rutina activa con historial)
  const student1 = await db.student.upsert({
    where: { dni: "10000001" },
    update: {
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan.perez@testgym.com",
      phone: "+54 11 4455-6677",
      nivel: "intermedio",
      objetivoId: objHipertrofia,
      modalidadId: modGimnasio,
      secondaryGoals: "Mejorar press de banca a 100kg y definición de brazos",
      membershipStartsAt: dateDaysAgo(60),
      paymentExpiresAt: dateDaysFromNow(25), // Al día
      healthNotes: "Sin antecedentes lesivos relevantes.",
      isActive: true,
    },
    create: {
      dni: "10000001",
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan.perez@testgym.com",
      phone: "+54 11 4455-6677",
      nivel: "intermedio",
      objetivoId: objHipertrofia,
      modalidadId: modGimnasio,
      secondaryGoals: "Mejorar press de banca a 100kg y definición de brazos",
      membershipStartsAt: dateDaysAgo(60),
      paymentExpiresAt: dateDaysFromNow(25),
      healthNotes: "Sin antecedentes lesivos relevantes.",
      isActive: true,
    },
  });

  // Student 2: DNI 10000002 - María González (Principiante, Activa, cuota por vencer en 3 días para probar alertas)
  const student2 = await db.student.upsert({
    where: { dni: "10000002" },
    update: {
      firstName: "María",
      lastName: "González",
      email: "maria.gonzalez@testgym.com",
      phone: "+54 11 5566-7788",
      nivel: "principiante",
      objetivoId: objGrasa,
      modalidadId: modHibrido,
      secondaryGoals: "Ganar resistencia cardiovascular y tonificación general",
      membershipStartsAt: dateDaysAgo(27),
      paymentExpiresAt: dateDaysFromNow(3), // Por vencer en 3 días
      healthNotes: "Molestia leve ocasional en rodilla derecha (evitar impacto alto).",
      isActive: true,
    },
    create: {
      dni: "10000002",
      firstName: "María",
      lastName: "González",
      email: "maria.gonzalez@testgym.com",
      phone: "+54 11 5566-7788",
      nivel: "principiante",
      objetivoId: objGrasa,
      modalidadId: modHibrido,
      secondaryGoals: "Ganar resistencia cardiovascular y tonificación general",
      membershipStartsAt: dateDaysAgo(27),
      paymentExpiresAt: dateDaysFromNow(3),
      healthNotes: "Molestia leve ocasional en rodilla derecha (evitar impacto alto).",
      isActive: true,
    },
  });

  // Student 3: DNI 10000003 - Carlos Rodríguez (Avanzado, Activo, cuota VENCIDA hace 4 días para probar mora)
  const student3 = await db.student.upsert({
    where: { dni: "10000003" },
    update: {
      firstName: "Carlos",
      lastName: "Rodríguez",
      email: "carlos.rodriguez@testgym.com",
      phone: "+54 11 6677-8899",
      nivel: "avanzado",
      objetivoId: objFuerza,
      modalidadId: modGimnasio,
      secondaryGoals: "Preparación para torneo de Powerlifting en noviembre",
      membershipStartsAt: dateDaysAgo(120),
      paymentExpiresAt: dateDaysAgo(4), // Vencida
      healthNotes: "Tendinitis rotuliana tratada en 2024. Actualmente recuperado.",
      isActive: true,
    },
    create: {
      dni: "10000003",
      firstName: "Carlos",
      lastName: "Rodríguez",
      email: "carlos.rodriguez@testgym.com",
      phone: "+54 11 6677-8899",
      nivel: "avanzado",
      objetivoId: objFuerza,
      modalidadId: modGimnasio,
      secondaryGoals: "Preparación para torneo de Powerlifting en noviembre",
      membershipStartsAt: dateDaysAgo(120),
      paymentExpiresAt: dateDaysAgo(4),
      healthNotes: "Tendinitis rotuliana tratada en 2024. Actualmente recuperado.",
      isActive: true,
    },
  });

  // Student 4: DNI 10000004 - Lucía Fernández (Intermedio, Inactiva / Baja temporal para probar filtros de soft-delete)
  const student4 = await db.student.upsert({
    where: { dni: "10000004" },
    update: {
      firstName: "Lucía",
      lastName: "Fernández",
      email: "lucia.fernandez@testgym.com",
      phone: "+54 11 7788-9900",
      nivel: "intermedio",
      objetivoId: objSalud,
      modalidadId: modCasa,
      secondaryGoals: "Mantener movilidad de columna y salud postural",
      membershipStartsAt: dateDaysAgo(90),
      paymentExpiresAt: dateDaysAgo(15),
      healthNotes: "Rectificación cervical.",
      isActive: false, // Inactiva
    },
    create: {
      dni: "10000004",
      firstName: "Lucía",
      lastName: "Fernández",
      email: "lucia.fernandez@testgym.com",
      phone: "+54 11 7788-9900",
      nivel: "intermedio",
      objetivoId: objSalud,
      modalidadId: modCasa,
      secondaryGoals: "Mantener movilidad de columna y salud postural",
      membershipStartsAt: dateDaysAgo(90),
      paymentExpiresAt: dateDaysAgo(15),
      healthNotes: "Rectificación cervical.",
      isActive: false,
    },
  });

  // Student 5: DNI 10000005 - Mateo Rossi (Principiante, Nuevo alumno sin rutina asignada para probar flujo de creación)
  const student5 = await db.student.upsert({
    where: { dni: "10000005" },
    update: {
      firstName: "Mateo",
      lastName: "Rossi",
      email: "mateo.rossi@testgym.com",
      phone: "+54 11 8899-0011",
      nivel: "principiante",
      objetivoId: objHipertrofia,
      modalidadId: modGimnasio,
      secondaryGoals: "Aprender técnica básica de sentadilla y dominadas",
      membershipStartsAt: dateDaysAgo(1),
      paymentExpiresAt: dateDaysFromNow(29),
      healthNotes: "Ninguna.",
      isActive: true,
    },
    create: {
      dni: "10000005",
      firstName: "Mateo",
      lastName: "Rossi",
      email: "mateo.rossi@testgym.com",
      phone: "+54 11 8899-0011",
      nivel: "principiante",
      objetivoId: objHipertrofia,
      modalidadId: modGimnasio,
      secondaryGoals: "Aprender técnica básica de sentadilla y dominadas",
      membershipStartsAt: dateDaysAgo(1),
      paymentExpiresAt: dateDaysFromNow(29),
      healthNotes: "Ninguna.",
      isActive: true,
    },
  });

  // Student 6: DNI 10000006 - Sofía Herrera (Avanzado, Excepción manual de acceso: accessOverride allowed)
  const student6 = await db.student.upsert({
    where: { dni: "10000006" },
    update: {
      firstName: "Sofía",
      lastName: "Herrera",
      email: "sofia.herrera@testgym.com",
      phone: "+54 11 9900-1122",
      nivel: "avanzado",
      objetivoId: objHipertrofia,
      modalidadId: modGimnasio,
      secondaryGoals: "Enfoque en tren inferior y glúteos",
      membershipStartsAt: dateDaysAgo(45),
      paymentExpiresAt: dateDaysAgo(10), // Cuota vencida pero acceso permitido por excepción
      accessOverride: "allowed", // Excepción manual
      healthNotes: "Molestia lumbar leve L5-S1 en flexión máxima.",
      isActive: true,
    },
    create: {
      dni: "10000006",
      firstName: "Sofía",
      lastName: "Herrera",
      email: "sofia.herrera@testgym.com",
      phone: "+54 11 9900-1122",
      nivel: "avanzado",
      objetivoId: objHipertrofia,
      modalidadId: modGimnasio,
      secondaryGoals: "Enfoque en tren inferior y glúteos",
      membershipStartsAt: dateDaysAgo(45),
      paymentExpiresAt: dateDaysAgo(10),
      accessOverride: "allowed",
      healthNotes: "Molestia lumbar leve L5-S1 en flexión máxima.",
      isActive: true,
    },
  });

  // Student 7: DNI 10000007 - Diego Morales (Intermedio, Suspendido manualmente por el profesor: accessOverride blocked)
  const student7 = await db.student.upsert({
    where: { dni: "10000007" },
    update: {
      firstName: "Diego",
      lastName: "Morales",
      email: "diego.morales@testgym.com",
      phone: "+54 11 2233-4455",
      nivel: "intermedio",
      objetivoId: objFuerza,
      modalidadId: modGimnasio,
      secondaryGoals: "Fuerza básica y acondicionamiento",
      membershipStartsAt: dateDaysAgo(20),
      paymentExpiresAt: dateDaysFromNow(10), // Cuota al día pero suspendido manualmente
      accessOverride: "blocked", // Bloqueado manual
      healthNotes: "Ninguna.",
      isActive: true,
    },
    create: {
      dni: "10000007",
      firstName: "Diego",
      lastName: "Morales",
      email: "diego.morales@testgym.com",
      phone: "+54 11 2233-4455",
      nivel: "intermedio",
      objetivoId: objFuerza,
      modalidadId: modGimnasio,
      secondaryGoals: "Fuerza básica y acondicionamiento",
      membershipStartsAt: dateDaysAgo(20),
      paymentExpiresAt: dateDaysFromNow(10),
      accessOverride: "blocked",
      healthNotes: "Ninguna.",
      isActive: true,
    },
  });

  console.log(`✅ 7 alumnos de prueba creados (DNI: 10000001 al 10000007)`);

  // --------------------------------------------------------------------------
  // 3. Suscripciones y Pagos (Subscriptions & Payments)
  // --------------------------------------------------------------------------

  // Juan Pérez: Suscripción Trimestral
  const subJuan = await db.studentSubscription.create({
    data: {
      studentId: student1.id,
      planId: planTrimestralId,
      priceSnapshot: new Prisma.Decimal(95000.0),
      startDate: dateDaysAgo(60),
      expiresAt: dateDaysFromNow(30),
    },
  });
  await db.payment.create({
    data: {
      studentId: student1.id,
      subscriptionId: subJuan.id,
      amount: new Prisma.Decimal(95000.0),
      paidAt: dateDaysAgo(60),
      notes: "Transferencia bancaria Banco Galicia - Plan Trimestral",
    },
  });

  // María González: Suscripción Mensual
  const subMaria = await db.studentSubscription.create({
    data: {
      studentId: student2.id,
      planId: planMensualId,
      priceSnapshot: new Prisma.Decimal(35000.0),
      startDate: dateDaysAgo(27),
      expiresAt: dateDaysFromNow(3),
    },
  });
  await db.payment.create({
    data: {
      studentId: student2.id,
      subscriptionId: subMaria.id,
      amount: new Prisma.Decimal(35000.0),
      paidAt: dateDaysAgo(27),
      notes: "Efectivo en recepción",
    },
  });

  // Carlos Rodríguez: Suscripción Semestral VIP
  const subCarlos = await db.studentSubscription.create({
    data: {
      studentId: student3.id,
      planId: planVipId,
      priceSnapshot: new Prisma.Decimal(175000.0),
      startDate: dateDaysAgo(180),
      expiresAt: dateDaysAgo(4), // Vencida
    },
  });
  await db.payment.create({
    data: {
      studentId: student3.id,
      subscriptionId: subCarlos.id,
      amount: new Prisma.Decimal(175000.0),
      paidAt: dateDaysAgo(180),
      notes: "Mercado Pago QR",
    },
  });

  // Sofía Herrera: Suscripción Mensual
  const subSofia = await db.studentSubscription.create({
    data: {
      studentId: student6.id,
      planId: planMensualId,
      priceSnapshot: new Prisma.Decimal(35000.0),
      startDate: dateDaysAgo(15),
      expiresAt: dateDaysFromNow(15),
    },
  });
  await db.payment.create({
    data: {
      studentId: student6.id,
      subscriptionId: subSofia.id,
      amount: new Prisma.Decimal(35000.0),
      paidAt: dateDaysAgo(15),
      notes: "Transferencia Bancaria",
    },
  });

  console.log(`✅ Suscripciones y pagos registrados con historial`);

  // --------------------------------------------------------------------------
  // 4. Asignación de Rutinas y Overrides (Assigned Routines)
  // --------------------------------------------------------------------------

  // Juan Pérez: Rutina Histórica previa + Rutina Activa Torso/Pierna
  await db.assignedRoutine.create({
    data: {
      studentId: student1.id,
      templateId: templateFullBody.id,
      status: "historic",
      assignedAt: dateDaysAgo(60),
      expiresAt: dateDaysAgo(30),
    },
  });

  const assignedJuan = await db.assignedRoutine.create({
    data: {
      studentId: student1.id,
      templateId: templateTorsoPierna.id,
      status: "active",
      assignedAt: dateDaysAgo(30),
      expiresAt: dateDaysFromNow(30),
    },
  });

  // María González: Rutina Activa Full Body con Override en Sentadilla Búlgara
  const assignedMaria = await db.assignedRoutine.create({
    data: {
      studentId: student2.id,
      templateId: templateFullBody.id,
      status: "active",
      assignedAt: dateDaysAgo(27),
      expiresAt: dateDaysFromNow(3),
    },
  });

  // Encontrar el bloque de Sentadilla Búlgara en el template Full Body
  const day3FullBody = templateFullBody.trainingDays.find((d) => d.dayOrder === 3);
  const bulgarianBlock = day3FullBody?.exerciseBlocks.find(
    (b) => b.exerciseId === getExId("Sentadilla búlgara")
  );

  if (bulgarianBlock) {
    await db.routineOverride.create({
      data: {
        assignedRoutineId: assignedMaria.id,
        exerciseBlockId: bulgarianBlock.id,
        sets: 3,
        reps: 8,
        weightKg: new Prisma.Decimal(6.0), // Ajuste de peso personalizado
        trainerNotes: "Realizar sin salto y con pausa para proteger la rodilla.",
      },
    });
  }

  // Carlos Rodríguez: Rutina Activa PPL
  const assignedCarlos = await db.assignedRoutine.create({
    data: {
      studentId: student3.id,
      templateId: templatePpl.id,
      status: "active",
      assignedAt: dateDaysAgo(40),
      expiresAt: dateDaysFromNow(2),
    },
  });

  // Sofía Herrera: Rutina Activa Torso/Pierna
  const assignedSofia = await db.assignedRoutine.create({
    data: {
      studentId: student6.id,
      templateId: templateTorsoPierna.id,
      status: "active",
      assignedAt: dateDaysAgo(15),
      expiresAt: dateDaysFromNow(15),
    },
  });

  console.log(`✅ Rutinas asignadas (activas e históricas) y personalizaciones (overrides) listas`);

  // --------------------------------------------------------------------------
  // 5. Registros de Progreso (Progress Logs) y Peso Corporal (Body Weight Logs)
  // --------------------------------------------------------------------------

  // Días y bloques del template Torso/Pierna de Juan
  const day1TorsoPierna = templateTorsoPierna.trainingDays.find((d) => d.dayOrder === 1)!;
  const benchBlock = day1TorsoPierna.exerciseBlocks.find(
    (b) => b.exerciseId === getExId("Press de banca plano con barra")
  )!;
  const pullUpBlock = day1TorsoPierna.exerciseBlocks.find(
    (b) => b.exerciseId === getExId("Dominadas pronas (Pull-ups)")
  )!;

  const day2TorsoPierna = templateTorsoPierna.trainingDays.find((d) => d.dayOrder === 2)!;
  const squatBlock = day2TorsoPierna.exerciseBlocks.find(
    (b) => b.exerciseId === getExId("Sentadilla con barra trasera (Back Squat)")
  )!;
  const rdlBlock = day2TorsoPierna.exerciseBlocks.find(
    (b) => b.exerciseId === getExId("Peso muerto rumano (RDL)")
  )!;

  // Logs de progreso de Juan Pérez (simulando 2 semanas de entrenamientos reales)
  await db.progressLog.createMany({
    data: [
      {
        studentId: student1.id,
        assignedRoutineId: assignedJuan.id,
        exerciseBlockId: benchBlock.id,
        loggedDate: dateDaysAgo(12),
        weightKg: new Prisma.Decimal(80.0),
        completed: true,
        studentNotes: "Buena serie, sentí buena congestión en el pecho.",
        noteType: "session",
      },
      {
        studentId: student1.id,
        assignedRoutineId: assignedJuan.id,
        exerciseBlockId: pullUpBlock.id,
        loggedDate: dateDaysAgo(12),
        weightKg: new Prisma.Decimal(0.0),
        completed: true,
        studentNotes: "Pude completar las 4 series de 6 repeticiones.",
        noteType: "session",
      },
      {
        studentId: student1.id,
        assignedRoutineId: assignedJuan.id,
        exerciseBlockId: squatBlock.id,
        loggedDate: dateDaysAgo(10),
        weightKg: new Prisma.Decimal(100.0),
        completed: true,
        studentNotes: "Sentadillas profundas sin molestias.",
        noteType: "session",
      },
      {
        studentId: student1.id,
        assignedRoutineId: assignedJuan.id,
        exerciseBlockId: rdlBlock.id,
        loggedDate: dateDaysAgo(10),
        weightKg: new Prisma.Decimal(90.0),
        completed: true,
        studentNotes: "Sentí buen estiramiento en isquios.",
        noteType: "session",
      },
      {
        studentId: student1.id,
        assignedRoutineId: assignedJuan.id,
        exerciseBlockId: benchBlock.id,
        loggedDate: dateDaysAgo(5),
        weightKg: new Prisma.Decimal(82.5), // Progresión de carga
        completed: true,
        studentNotes: "Subí 2.5kg en banca! Salieron 6 repeticiones sólidas.",
        noteType: "session",
      },
      {
        studentId: student1.id,
        assignedRoutineId: assignedJuan.id,
        exerciseBlockId: squatBlock.id,
        loggedDate: dateDaysAgo(3),
        weightKg: new Prisma.Decimal(102.5), // Progresión
        completed: true,
        studentNotes: "Cansancio acumulado en las últimas repeticiones.",
        noteType: "session",
      },
    ],
  });

  // Sofía Herrera: Log de molestia (noteType: discomfort)
  await db.progressLog.create({
    data: {
      studentId: student6.id,
      assignedRoutineId: assignedSofia.id,
      exerciseBlockId: rdlBlock.id,
      loggedDate: dateDaysAgo(2),
      weightKg: new Prisma.Decimal(60.0),
      completed: true,
      studentNotes: "Sentí una ligera tensión lumbar en la última serie.",
      noteType: "discomfort",
    },
  });

  // Logs de Peso Corporal (BodyWeightLogs)
  await db.bodyWeightLog.createMany({
    data: [
      // Juan Pérez (evolución de peso)
      { studentId: student1.id, loggedDate: dateDaysAgo(28), weightKg: new Prisma.Decimal(78.5) },
      { studentId: student1.id, loggedDate: dateDaysAgo(21), weightKg: new Prisma.Decimal(78.9) },
      { studentId: student1.id, loggedDate: dateDaysAgo(14), weightKg: new Prisma.Decimal(79.2) },
      { studentId: student1.id, loggedDate: dateDaysAgo(7), weightKg: new Prisma.Decimal(79.6) },
      { studentId: student1.id, loggedDate: dateDaysAgo(1), weightKg: new Prisma.Decimal(80.0) },

      // María González (pérdida de peso controlada)
      { studentId: student2.id, loggedDate: dateDaysAgo(25), weightKg: new Prisma.Decimal(64.2) },
      { studentId: student2.id, loggedDate: dateDaysAgo(18), weightKg: new Prisma.Decimal(63.7) },
      { studentId: student2.id, loggedDate: dateDaysAgo(11), weightKg: new Prisma.Decimal(63.1) },
      { studentId: student2.id, loggedDate: dateDaysAgo(4), weightKg: new Prisma.Decimal(62.6) },

      // Carlos Rodríguez
      { studentId: student3.id, loggedDate: dateDaysAgo(30), weightKg: new Prisma.Decimal(88.0) },
      { studentId: student3.id, loggedDate: dateDaysAgo(15), weightKg: new Prisma.Decimal(88.4) },
      { studentId: student3.id, loggedDate: dateDaysAgo(1), weightKg: new Prisma.Decimal(88.6) },
    ],
  });

  console.log(`✅ Logs de progreso y registros de peso corporal generados`);
}

async function main() {
  console.log("=================================================");
  console.log("🏋️  INICIANDO SEED DE BASE DE DATOS LOCAL (.env)");
  console.log("=================================================");

  const { objetivoMap, modalidadMap, planMap } = await seedBase();

  const isProduction = process.env.NODE_ENV === "production" || process.env.IS_PROD_SEED === "true";
  const shouldSeedDevData = process.env.SEED_DEV_DATA !== "false" && !isProduction;

  if (shouldSeedDevData) {
    await seedLocalDevData(objetivoMap, modalidadMap, planMap);
  }

  console.log("\n=================================================");
  console.log("✨ SEED COMPLETADO EXITOSAMENTE");
  console.log("=================================================");
  console.log("📋 DATOS DE ACCESO PARA PRUEBAS:");
  console.log("-------------------------------------------------");
  console.log("👤 PANEL ENTRENADOR (ADMIN):");
  console.log(`   Email:    ${process.env.SEED_ADMIN_EMAIL || "sramon@coach.com"}`);
  console.log(`   Password: ${process.env.SEED_ADMIN_PASSWORD || "SRamon2026."}`);
  console.log("-------------------------------------------------");
  console.log("📱 ACCESO ALUMNOS POR DNI (PORTAL ALUMNO):");
  console.log("   DNI 10000001 : Juan Pérez (Activo / Cuota al día / Acceso Habilitado)");
  console.log("   DNI 10000002 : María González (Activa / Vence en 3 días / Acceso Habilitado)");
  console.log("   DNI 10000003 : Carlos Rodríguez (Cuota vencida hace 4 días / ⛔ ACCESO BLOQUEADO)");
  console.log("   DNI 10000004 : Lucía Fernández (Inactiva / Baja temporal / ⛔ NO ENCONTRADO)");
  console.log("   DNI 10000005 : Mateo Rossi (Nuevo alumno / Sin rutina asignada)");
  console.log("   DNI 10000006 : Sofía Herrera (Cuota vencida / 🟢 ACCESO PERMITIDO POR EXCEPCIÓN)");
  console.log("   DNI 10000007 : Diego Morales (Cuota al día / ⛔ SUSPENDIDO MANUALMENTE)");
  console.log("-------------------------------------------------");
  console.log("🔑 ACCESO PERFILES GENÉRICOS:");
  console.log("   Básico:     olympia.basico");
  console.log("   Intermedio: olympia.intermedio");
  console.log("   Avanzado:   olympia.avanzado");
  console.log("=================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
